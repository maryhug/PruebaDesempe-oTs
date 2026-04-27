import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/bcrypt";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { registerSchema } from "@/schemas/auth.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validar datos con Zod
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        const { name, email, password } = result.data;

        // 2. Verificar que el email no esté en uso
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return errorResponse("El email ya está registrado", 409);
        }

        // 3. Hashear contraseña
        const passwordHash = await hashPassword(password);

        // 4. Crear usuario (rol CUSTOMER por defecto)
        const user = await prisma.user.create({
            data: { name, email, passwordHash },
        });

        // 5. Generar tokens
        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

        // 6. Guardar refresh token en BD
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });

        // 7. Enviar tokens en HttpOnly Cookies (no accesibles desde JS del navegador)
        const response = successResponse(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            201
        );

        response.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15, // 15 minutos en segundos
            path: "/",
        });

        response.cookies.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[REGISTER]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}