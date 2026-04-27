import { NextRequest } from "next/server";
import {prisma} from "@/lib/prisma";
import { comparePassword } from "@/lib/bcrypt";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { loginSchema } from "../../../../schemas/auth.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validar datos
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        const { email, password } = result.data;

        // 2. Buscar usuario
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return errorResponse("Credenciales inválidas", 401);
        }

        // 3. Verificar que la cuenta esté activa
        if (user.status === "INACTIVE") {
            return errorResponse("Cuenta inactiva", 403);
        }

        // 4. Verificar contraseña
        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
            return errorResponse("Credenciales inválidas", 401);
        }

        // 5. Generar tokens
        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

        // 6. Guardar refresh token en BD
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });

        // 7. Responder con cookies
        const response = successResponse({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

        response.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15,
            path: "/",
        });

        response.cookies.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[LOGIN]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}