import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { addCartItemSchema } from "@/schemas/cart.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { broadcastEvent } from "@/lib/sse-store";

export async function POST(req: NextRequest) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const body = await req.json();

        const result = addCartItemSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        const { productId, quantity } = result.data;

        // Verificar que el producto existe y está activo
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) {
            return errorResponse("Producto no disponible", 404);
        }

        // Verificar stock suficiente
        if (product.stock < quantity) {
            return errorResponse(`Stock insuficiente. Disponible: ${product.stock}`, 400);
        }

        // Buscar carrito del usuario (solo puede tener uno por el @unique)
        let cart = await prisma.cart.findUnique({
            where: { userId: user.userId },
        });

        if (!cart) {
            // Primera vez, crear carrito
            cart = await prisma.cart.create({
                data: { userId: user.userId, status: "ACTIVE" },
            });
        } else if (cart.status !== "ACTIVE") {
            // Limpiar items viejos y reactivar (la orden vieja queda intacta)
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
            cart = await prisma.cart.update({
                where: { userId: user.userId },
                data: { status: "ACTIVE" },
            });
        }

        // Verificar si el producto ya está en el carrito
        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });

        if (existingItem) {
            // Ya existe: sumar la cantidad
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > product.stock) {
                return errorResponse(`Stock insuficiente. Disponible: ${product.stock}`, 400);
            }

            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
            });
        } else {
            // No existe: crear nuevo item con snapshot del precio
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                    unitPrice: product.price,
                },
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, imageUrl: true } },
                    },
                },
            },
        });

        // Primero busca el usuario en BD para tener su nombre
        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { name: true, email: true },
        });

        broadcastEvent({
            type: "cart:item_added",
            payload: {
                userId: user.userId,
                userName: userData?.name ?? "Usuario",
                userEmail: userData?.email ?? "",
                cartId: cart.id,
                productId,
                quantity,
                productName: product.name,
            },
            timestamp: new Date().toISOString(),
        });

        return successResponse(updatedCart, 201);
    } catch (error) {
        console.error("[CART ITEMS POST]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}