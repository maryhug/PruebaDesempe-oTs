import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/orders/:id — ver una orden específica
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