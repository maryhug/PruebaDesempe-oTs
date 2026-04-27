import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, generateAccessToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
    try {
        // 1. Leer refresh token de la cookie
        const refreshToken = req.cookies.get("refresh_token")?.value;
        if (!refreshToken) {
            return errorResponse("No hay refresh token", 401);
        }

        // 2. Verificar que el token es válido
        const payload = verifyToken(refreshToken);
        if (!payload) {
            return errorResponse("Refresh token inválido o expirado", 401);
        }

        // 3. Verificar que existe en la BD (no fue invalidado por logout)
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!stored || stored.expiresAt < new Date()) {
            return errorResponse("Refresh token inválido", 401);
        }

        // 4. Generar nuevo access token
        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            role: payload.role,
        });

        // 5. Enviar nuevo access token en cookie
        const response = successResponse({ message: "Token renovado" });
        response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[REFRESH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}