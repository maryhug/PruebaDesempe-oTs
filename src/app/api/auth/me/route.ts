import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        // 1. Leer access token de la cookie
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) {
            return errorResponse("No autenticado", 401);
        }

        // 2. Verificar token
        const payload = verifyToken(accessToken);
        if (!payload) {
            return errorResponse("Token inválido o expirado", 401);
        }

        // 3. Buscar usuario en BD
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, name: true, email: true, role: true, status: true },
        });

        if (!user) {
            return errorResponse("Usuario no encontrado", 404);
        }

        return successResponse(user);
    } catch (error) {
        console.error("[ME]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}