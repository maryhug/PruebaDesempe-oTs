import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/products — catálogo público
// Solo muestra productos activos con stock > 0
export async function GET(req: NextRequest) {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                stock: { gt: 0 }, // gt = greater than (mayor que)
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(products);
    } catch (error) {
        console.error("[PRODUCTS GET]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}