/*import { PrismaClient } from "@prisma/client";

// Evita crear múltiples instancias de Prisma en desarrollo
// En desarrollo Next.js recarga el servidor constantemente y sin esto
// se crearían cientos de conexiones a la BD

declare global {
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;
*/

//-------

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const createPrismaClient = () => {
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
    })
    return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma