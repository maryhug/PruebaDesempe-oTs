import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createProductSchema } from "@/schemas/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/products/admin — todos los productos (incluso inactivos)
export async function GET(req: NextRequest) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });

        return successResponse(products);
    } catch (error) {
        console.error("[PRODUCTS ADMIN GET]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// POST /api/products/admin — crear producto
export async function POST(req: NextRequest) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const body = await req.json();

        // Validar con Zod
        const result = createProductSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        const product = await prisma.product.create({ data: result.data });

        return successResponse(product, 201);
    } catch (error) {
        console.error("[PRODUCTS ADMIN POST]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}