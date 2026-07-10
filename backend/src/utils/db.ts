import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across serverless invocations / hot reloads to
// avoid exhausting database connections on Vercel.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
