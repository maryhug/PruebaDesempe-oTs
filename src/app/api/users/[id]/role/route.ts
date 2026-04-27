import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
    role: z.enum(["ADMIN", "CUSTOMER"]),
});

// PATCH /api/users/:id/role — cambiar rol de usuario (solo Admin)
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
        if (!result.success) return errorResponse("Rol inválido", 400);

        const updated = await prisma.user.update({
            where: { id },
            data: { role: result.data.role },
            select: { id: true, name: true, email: true, role: true, status: true },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[USER ROLE PATCH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}