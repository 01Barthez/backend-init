// Dans ton fichier de config Prisma (ex: config/prisma/prisma.ts)
import { PrismaClient } from '@prisma/client';
import log from '@services/logging/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => {
  log.error('Prisma Error:', e);
});

prisma.$on('warn', (e) => {
  log.warn('Prisma Warn:', e);
});

export default prisma;
