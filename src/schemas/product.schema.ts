import { z } from "zod";

// Schema para crear producto
export const createProductSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    price: z.number().positive("El precio debe ser mayor a 0"),
    stock: z.number().int().min(0, "El stock no puede ser negativo"),
    imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

// Schema para actualizar (todos los campos son opcionales)
export const updateProductSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;