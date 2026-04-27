import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/orders
// Admin ve todas las órdenes, Customer solo las suyas
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        if (!user) return errorResponse("No autenticado", 401);

        const orders = await prisma.order.findMany({
            where: user.role === "ADMIN" ? {} : { userId: user.userId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(orders);
    } catch (error) {
        console.error("[ORDERS GET]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}