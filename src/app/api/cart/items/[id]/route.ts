import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { updateCartItemSchema } from "@/schemas/cart.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { broadcastEvent } from "@/lib/sse-store";

// PATCH /api/cart/items/:id — cambiar cantidad de un item
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;
        const body = await req.json();

        // Validar con Zod
        const result = updateCartItemSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        // Verificar que el item existe y pertenece al usuario
        const item = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true, product: true },
        });

        if (!item) return errorResponse("Item no encontrado", 404);
        if (item.cart.userId !== user.userId) return errorResponse("Acceso denegado", 403);
        if (item.cart.status !== "ACTIVE") return errorResponse("El carrito no está activo", 400);

        // Verificar stock
        if (result.data.quantity > item.product.stock) {
            return errorResponse(`Stock insuficiente. Disponible: ${item.product.stock}`, 400);
        }

        const updated = await prisma.cartItem.update({
            where: { id },
            data: { quantity: result.data.quantity },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[CART ITEM PATCH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// DELETE /api/cart/items/:id — eliminar item del carrito
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;

        // Verificar que el item existe y pertenece al usuario
        const item = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true },
        });

        if (!item) return errorResponse("Item no encontrado", 404);
        if (item.cart.userId !== user.userId) return errorResponse("Acceso denegado", 403);
        if (item.cart.status !== "ACTIVE") return errorResponse("El carrito no está activo", 400);

        await prisma.cartItem.delete({ where: { id } });

        // Buscar nombre del usuario
        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { name: true, email: true },
        });
        // Notificar a admins
        broadcastEvent({
            type: "cart:item_removed",
            payload: {
                userId: user.userId,
                userName: userData?.name ?? "Usuario",
                userEmail: userData?.email ?? "",
                cartId: item.cartId,
                itemId: id,
            },
            timestamp: new Date().toISOString(),
        });

        return successResponse({ message: "Item eliminado" });
    } catch (error) {
        console.error("[CART ITEM DELETE]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}