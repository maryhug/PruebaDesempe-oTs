import jwt from "jsonwebtoken";
import { JwtPayload } from "@/types/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

// Crea el access token (dura 15 minutos)
export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

// Crea el refresh token (dura 7 días)
export function generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
}

// Verifica y decodifica un token, retorna null si es inválido o expirado
export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}