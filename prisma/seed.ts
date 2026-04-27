import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Iniciando seed...");

    // Limpiar BD en orden (por las relaciones entre tablas)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();

    // Hashear contraseñas
    const adminHash = await bcrypt.hash("Admin123!", 12);
    const clientHash = await bcrypt.hash("Cliente123!", 12);

    // Crear usuarios
    const admin = await prisma.user.create({
        data: {
            name: "Administrador",
            email: "admin@carthub.co",
            passwordHash: adminHash,
            role: "ADMIN",
        },
    });

    const cliente1 = await prisma.user.create({
        data: {
            name: "Cliente Uno",
            email: "cliente1@carthub.co",
            passwordHash: clientHash,
            role: "CUSTOMER",
        },
    });

    const cliente2 = await prisma.user.create({
        data: {
            name: "Cliente Dos",
            email: "cliente2@carthub.co",
            passwordHash: clientHash,
            role: "CUSTOMER",
        },
    });

    console.log("✅ Usuarios creados");

    // Crear productos
    const productos = await Promise.all([
        prisma.product.create({
            data: { name: "Laptop Pro 15", description: "Laptop de alto rendimiento", price: 2500000, stock: 10 },
        }),
        prisma.product.create({
            data: { name: "Mouse Inalámbrico", description: "Mouse ergonómico", price: 85000, stock: 50 },
        }),
        prisma.product.create({
            data: { name: "Teclado Mecánico", description: "Teclado RGB", price: 320000, stock: 25 },
        }),
        prisma.product.create({
            data: { name: "Monitor 24\"", description: "Full HD IPS", price: 750000, stock: 8 },
        }),
        prisma.product.create({
            data: { name: "Audífonos Bluetooth", description: "Cancelación de ruido", price: 450000, stock: 15 },
        }),
        prisma.product.create({
            data: { name: "Webcam HD", description: "1080p 30fps", price: 180000, stock: 20 },
        }),
        prisma.product.create({
            data: { name: "Hub USB-C", description: "7 puertos", price: 120000, stock: 30 },
        }),
        prisma.product.create({
            data: { name: "Silla Ergonómica", description: "Soporte lumbar", price: 1200000, stock: 5 },
        }),
        // Producto inactivo
        prisma.product.create({
            data: { name: "Producto Descontinuado", description: "Ya no disponible", price: 50000, stock: 0, isActive: false },
        }),
    ]);

    console.log("✅ Productos creados");

    // Carrito activo para cliente1 con 2 items
    const carrito = await prisma.cart.create({
        data: {
            userId: cliente1.id,
            status: "ACTIVE",
            items: {
                create: [
                    { productId: productos[0].id, quantity: 1, unitPrice: productos[0].price },
                    { productId: productos[1].id, quantity: 2, unitPrice: productos[1].price },
                ],
            },
        },
    });

    console.log("✅ Carrito de cliente1 creado");

    // Orden confirmada para cliente2
    const carritoCliente2 = await prisma.cart.create({
        data: {
            userId: cliente2.id,
            status: "ORDERED",
        },
    });

    await prisma.order.create({
        data: {
            cartId: carritoCliente2.id,
            userId: cliente2.id,
            status: "CONFIRMED",
            totalAmount: productos[2].price + productos[3].price,
            items: {
                create: [
                    {
                        productId: productos[2].id,
                        quantity: 1,
                        unitPrice: productos[2].price,
                        subtotal: productos[2].price,
                    },
                    {
                        productId: productos[3].id,
                        quantity: 1,
                        unitPrice: productos[3].price,
                        subtotal: productos[3].price,
                    },
                ],
            },
        },
    });

    console.log("✅ Orden de cliente2 creada");
    console.log("🎉 Seed completado!");
    console.log("---");
    console.log("👤 admin@carthub.co / Admin123!");
    console.log("👤 cliente1@carthub.co / Cliente123!");
    console.log("👤 cliente2@carthub.co / Cliente123!");
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })