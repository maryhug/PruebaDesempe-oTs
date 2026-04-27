import { z } from "zod";

// Schema para agregar un item al carrito
export const addCartItemSchema = z.object({
    productId: z.string().uuid("ID de producto inválido"),
    quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

// Schema para actualizar cantidad de un item
export const updateCartItemSchema = z.object({
    quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;