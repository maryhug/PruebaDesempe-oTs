import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Rutas públicas — no necesitan autenticación
const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/products",
];

// Rutas solo para ADMIN
const ADMIN_ROUTES = [
    "/monitor",
    "/admin",       // ← esto cubre /admin/orders y /admin/products
    "/api/monitor",
    "/api/users",
    "/api/products/admin",
];

// Rutas solo para CUSTOMER
const CUSTOMER_ROUTES = [
    "/cart",
    "/api/cart",
];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Si es ruta pública dejar pasar
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Leer token
    const accessToken = req.cookies.get("access_token")?.value;
    const payload = accessToken ? verifyToken(accessToken) : null;

    // Sin token → login
    if (!payload) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { success: false, error: "No autenticado" },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Rutas solo Admin
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
        if (payload.role !== "ADMIN") {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json(
                    { success: false, error: "Acceso denegado" },
                    { status: 403 }
                );
            }
            return NextResponse.redirect(new URL("/catalog", req.url));
        }
    }

    // Rutas solo Customer
    if (CUSTOMER_ROUTES.some((route) => pathname.startsWith(route))) {
        if (payload.role !== "CUSTOMER") {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json(
                    { success: false, error: "Acceso denegado" },
                    { status: 403 }
                );
            }
            return NextResponse.redirect(new URL("/monitor", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};