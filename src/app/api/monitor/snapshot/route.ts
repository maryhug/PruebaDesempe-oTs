import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/monitor/snapshot — carga inicial del panel
// Retorna todos los carritos activos y conteos
export async function GET(req: NextRequest) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        // Carritos activos con info del usuario e items
        const activeCarts = await prisma.cart.findMany({
            where: {
                status: "ACTIVE",
                items: { some: {} }, // solo carritos con al menos 1 item
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: { select: { name: true } } } },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Total de órdenes del día
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = await prisma.order.count({
            where: { createdAt: { gte: today } },
        });

        // Total de usuarios activos
        const totalUsers = await prisma.user.count({
            where: { status: "ACTIVE", role: "CUSTOMER" },
        });

        return successResponse({
            activeCartsCount: activeCarts.length,
            ordersToday,
            totalUsers,
            activeCarts: activeCarts.map((cart) => ({
                cartId: cart.id,
                userId: cart.user.id,
                userName: cart.user.name,
                userEmail: cart.user.email,
                itemCount: cart.items.length,
                items: cart.items.map((i) => i.product.name),
                updatedAt: cart.updatedAt,
            })),
        });
    } catch (error) {
        console.error("[MONITOR SNAPSHOT]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}