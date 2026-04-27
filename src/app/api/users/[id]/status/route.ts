import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

// PATCH /api/users/:id/status — cambiar estado de usuario (solo Admin)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;
        const body = await req.json();

        const result = schema.safeParse(body);
        if (!result.success) return errorResponse("Estado inválido", 400);

        const updated = await prisma.user.update({
            where: { id },
            data: { status: result.data.status },
            select: { id: true, name: true, email: true, role: true, status: true },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[USER STATUS PATCH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}