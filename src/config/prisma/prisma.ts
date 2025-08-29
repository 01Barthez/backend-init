// Dans ton fichier de config Prisma (ex: config/prisma/prisma.ts)
import { PrismaClient } from '@prisma/client';
import log from '../../services/logging/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Écoute les événements de log
prisma.$on('query', (e) => {
  log.info('Query:', e.query);
  log.info('Params:', e.params);
  log.info('Duration:', e.duration + 'ms');
});

prisma.$on('error', (e) => {
  log.error('Prisma Error:', e);
});

prisma.$on('info', (e) => {
  log.info('Prisma Info:', e);
});

prisma.$on('warn', (e) => {
  log.warn('Prisma Warn:', e);
});

export default prisma;
