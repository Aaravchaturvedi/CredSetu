import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * A single PrismaClient instance is shared by the whole process.
 *
 * During development, `tsx watch` restarts the module graph on every file
 * change. Caching the client on `globalThis` avoids creating a new connection
 * pool each time and exhausting PostgreSQL connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
