import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

// GET /api/orders/:id — ver detalle de una orden
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getAuthUser(req);
        if (!user) return errorResponse("No autenticado", 401);

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!order) return errorResponse("Orden no encontrada", 404);

        // Customer solo puede ver sus propias órdenes
        if (user.role === "CUSTOMER" && order.userId !== user.userId) {
            return errorResponse("Acceso denegado", 403);
        }

        return successResponse(order);
    } catch (error) {
        console.error("[ORDER GET BY ID]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// Schema para validar el cambio de estado
const updateOrderSchema = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});

// PATCH /api/orders/:id — cambiar estado de orden (solo Admin)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;
        const body = await req.json();

        // Validar con Zod
        const result = updateOrderSchema.safeParse(body);
        if (!result.success) {
            return errorResponse("Estado inválido", 400);
        }

        // Verificar que la orden existe
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) return errorResponse("Orden no encontrada", 404);

        // Si se cancela la orden, restaurar el stock de los productos
        if (result.data.status === "CANCELLED" && order.status !== "CANCELLED") {
            await prisma.$transaction(async (tx) => {
                // Restaurar stock de cada producto
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }

                // Cambiar estado de la orden
                await tx.order.update({
                    where: { id },
                    data: { status: result.data.status },
                });
            });
        } else {
            // Para PENDING o CONFIRMED solo cambiar el estado
            await prisma.order.update({
                where: { id },
                data: { status: result.data.status },
            });
        }

        const updated = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true } } },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[ORDER PATCH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}