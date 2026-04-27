import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { broadcastEvent } from "@/lib/sse-store";

export async function POST(req: NextRequest) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const cart = await prisma.cart.findFirst({
            where: { userId: user.userId, status: "ACTIVE" },
            include: {
                items: { include: { product: true } },
                user: { select: { name: true, email: true } }, // ← agregar esto
            },
        });

        if (!cart) return errorResponse("No tienes un carrito activo", 404);

        if (cart.items.length === 0) {
            return errorResponse("El carrito esta vacio", 409);
        }

        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                return errorResponse(
                    `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}`,
                    400
                );
            }
        }

        const totalAmount = cart.items.reduce(
            (acc, item) => acc + item.unitPrice * item.quantity,
            0
        );

        const cartId = cart.id;
        const userId = user.userId;

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    cartId: cartId,
                    userId: userId,
                    totalAmount,
                    status: "PENDING",
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            subtotal: item.unitPrice * item.quantity,
                        })),
                    },
                },
                include: { items: true },
            });

            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            await tx.cart.update({
                where: { id: cartId },
                data: { status: "ORDERED" },
            });

            return newOrder;
        });

        broadcastEvent({
            type: "cart:checkout",
            payload: {
                orderId: order.id,
                userId: userId,
                userName: cart.user?.name ?? "Usuario",
                userEmail: cart.user?.email ?? "",
                totalAmount,
                itemCount: cart.items.length,
            },
            timestamp: new Date().toISOString(),
        });

        return successResponse(order, 201);
    } catch (error) {
        console.error("[CHECKOUT]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}