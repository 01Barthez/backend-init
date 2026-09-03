/**
 * Process lifecycle: drain HTTP (when present), stop workers, close queues/Redis/Prisma.
 * Called from the entrypoint on SIGTERM/SIGINT — not from createApp.
 */
/* eslint-disable no-process-exit -- SIGTERM drain and uncaughtException must terminate the process */
import type { Server } from 'http';

import { closeRedis } from '@/shared/infrastructure/cache/clients/redis-client';
import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';
import { closeQueues } from '@/shared/infrastructure/queue/queue.service';
import { stopWorkers } from '@/shared/infrastructure/queue/workers';

const DRAIN_MS = 25_000;

export const closeHttpServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

export const shutdownInfrastructure = async (): Promise<void> => {
  await stopWorkers();
  await closeQueues();
  await closeRedis();
  await prisma.$disconnect();
};

/**
 * @param server HTTP server, or null for worker-only processes.
 */
export const gracefulShutdown = async (server: Server | null, signal: string): Promise<void> => {
  log.info(`${signal} received — draining`);

  const timer = setTimeout(() => {
    log.error('Shutdown timed out — forcing exit');
    process.exit(1);
  }, DRAIN_MS);
  timer.unref();

  try {
    if (server) {
      await closeHttpServer(server);
    }
    await shutdownInfrastructure();
    log.info('Process terminated cleanly');
    process.exit(0);
  } catch (error: unknown) {
    log.error('Graceful shutdown failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

export const registerProcessHandlers = (): void => {
  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.stack : reason,
    });
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
};
