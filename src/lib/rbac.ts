import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { JwtPayload } from "@/types/auth";

// Lee el access token de la cookie y retorna el payload
// Retorna null si no hay token o es inválido
export function getAuthUser(req: NextRequest): JwtPayload | null {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

// Verifica que el usuario sea Admin
export function requireAdmin(req: NextRequest): JwtPayload | null {
    const user = getAuthUser(req);
    if (!user || user.role !== "ADMIN") return null;
    return user;
}

// Verifica que el usuario sea Customer
export function requireCustomer(req: NextRequest): JwtPayload | null {
    const user = getAuthUser(req);
    if (!user || user.role !== "CUSTOMER") return null;
    return user;
}