/**
 * Shared Prisma client singleton.
 *
 * Wire query/error events to the application logger so DB issues surface in
 * the same pipeline as application logs.
 */
import { PrismaClient } from '@prisma/client';

import log from '@/shared/infrastructure/logging/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => log.error('Prisma error', { message: e.message }));
prisma.$on('warn', (e) => log.warn('Prisma warning', { message: e.message }));

export default prisma;
