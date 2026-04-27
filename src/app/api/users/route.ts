import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/users — listar todos los usuarios (solo Admin)
export async function GET(req: NextRequest) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                // No incluir passwordHash nunca
                _count: {
                    select: {
                        orders: true, // cuántas órdenes tiene
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(users);
    } catch (error) {
        console.error("[USERS GET]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}