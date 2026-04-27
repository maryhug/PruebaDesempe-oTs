import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { broadcastEvent } from "@/lib/sse-store";

// GET /api/cart — ver carrito activo del usuario
export async function GET(req: NextRequest) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        // Buscar carrito activo con sus items y datos del producto
        const cart = await prisma.cart.findFirst({
            where: { userId: user.userId, status: "ACTIVE" },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, price: true },
                        },
                    },
                },
            },
        });

        // Si no tiene carrito activo, retornar null (no es error)
        if (!cart) return successResponse(null);

        return successResponse(cart);
    } catch (error) {
        console.error("[CART GET]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// DELETE /api/cart — vaciar carrito (status: ABANDONED)
export async function DELETE(req: NextRequest) {
    try {
        const user = requireCustomer(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const cart = await prisma.cart.findFirst({
            where: { userId: user.userId, status: "ACTIVE" },
        });

        if (!cart) return errorResponse("No tienes un carrito activo", 404);

        // Cambiar estado a ABANDONED en lugar de eliminar
        await prisma.cart.update({
            where: { id: cart.id },
            data: { status: "ABANDONED" },
        });

        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { name: true, email: true },
        });
        // Notificar a admin por SSE
        broadcastEvent({
            type: "cart:abandoned",
            payload: {
                userId: user.userId,
                userName: userData?.name ?? "Usuario",
                userEmail: userData?.email ?? "",
                cartId: cart.id,
            },
            timestamp: new Date().toISOString(),
        });

        return successResponse({ message: "Carrito vaciado" });
    } catch (error) {
        console.error("[CART DELETE]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}