import { z } from "zod";

// Esquema para registro
export const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
        .regex(/[0-9]/, "Debe tener al menos un número"),
});

// Esquema para login
export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

// Tipos inferidos desde los schemas (no hay que repetirlos a mano)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;