import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
    try {
        // 1. Leer el refresh token de la cookie
        const refreshToken = req.cookies.get("refresh_token")?.value;

        // 2. Si existe, eliminarlo de la BD (invalidar)
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }

        // 3. Limpiar ambas cookies
        const response = successResponse({ message: "Sesión cerrada" });
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");

        return response;
    } catch (error) {
        console.error("[LOGOUT]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}