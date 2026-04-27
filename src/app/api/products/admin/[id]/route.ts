import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { updateProductSchema } from "@/schemas/product.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/products/:id — ver un producto
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return errorResponse("Producto no encontrado", 404);

        return successResponse(product);
    } catch (error) {
        console.error("[PRODUCT GET BY ID]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// PATCH /api/products/:id — editar producto (solo Admin)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;
        const body = await req.json();

        // Validar con Zod
        const result = updateProductSchema.safeParse(body);
        if (!result.success) {
            return errorResponse(result.error.issues[0]?.message ?? "Datos inválidos", 400);
        }

        // Verificar que existe
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) return errorResponse("Producto no encontrado", 404);

        const updated = await prisma.product.update({
            where: { id },
            data: result.data,
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[PRODUCT PATCH]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}

// DELETE /api/products/:id — eliminar producto (solo Admin)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireAdmin(req);
        if (!user) return errorResponse("Acceso denegado", 403);

        const { id } = await params;

        // Verificar que existe
        const existing = await prisma.product.findUnique({
            where: { id },
            include: {
                cartItems: true,  // tiene items en carritos?
                orderItems: true, // tiene items en órdenes?
            },
        });

        if (!existing) return errorResponse("Producto no encontrado", 404);

        // Si tiene items asociados, no eliminar físicamente
        // Solo desactivar (isActive: false)
        if (existing.cartItems.length > 0 || existing.orderItems.length > 0) {
            const updated = await prisma.product.update({
                where: { id },
                data: { isActive: false },
            });
            return successResponse({ ...updated, message: "Producto desactivado (tiene items asociados)" });
        }

        // Si no tiene items, eliminar físicamente
        await prisma.product.delete({ where: { id } });
        return successResponse({ message: "Producto eliminado" });
    } catch (error) {
        console.error("[PRODUCT DELETE]", error);
        return errorResponse("Error interno del servidor", 500);
    }
}