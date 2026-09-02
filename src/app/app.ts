/**
 * Express application factory.
 *
 * Builds middleware, mounts module routes, and runs bootstrap hooks
 * (RBAC seed, storage buckets, mail transport, workers, repeatable jobs).
 *
 * The HTTP listen call lives in `src/server.ts` so tests can import `createApp`
 * without binding a port.
 */
import express, { type Express } from 'express';

import { config } from '@/app/config';
import setupSwagger from '@/app/config/swagger';
import { type AppContainer, getContainer } from '@/app/container';
import { initMiddlewares } from '@/app/middleware/init-middlewares';
import { registerRoutes } from '@/app/routes';
import log from '@/shared/infrastructure/logging/logger';
import { verifyMailTransport } from '@/shared/infrastructure/mail/mail.service';
import { registerRepeatableJobs } from '@/shared/infrastructure/queue/queue.service';
import { startWorkers } from '@/shared/infrastructure/queue/workers';
import { storageService } from '@/shared/infrastructure/storage/storage.service';

export type CreateAppOptions = {
  /** Inject a pre-built container (tests). Defaults to the process singleton. */
  container?: AppContainer;
  /** Skip infra bootstrap (useful in unit tests). */
  skipBootstrap?: boolean;
};

/**
 * Create and configure the Express application.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const container = options.container ?? getContainer();

  // OpenAPI UI + Bull Board (admin)
  setupSwagger(app);
  container.system.setupBullBoard(app);

  // Security, parsers, logging, then module routes
  initMiddlewares(app, () => registerRoutes(app, container));

  if (!options.skipBootstrap && !config.app.isTest) {
    bootstrap(container).catch((error) => {
      log.error('Application bootstrap failed', { error });
    });
  }

  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', {
      promise,
      reason: reason instanceof Error ? reason.stack : reason,
    });
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error.stack || error);
  });

  return app;
}

/**
 * One-time startup tasks that must succeed before traffic is meaningful.
 */
async function bootstrap(container: AppContainer): Promise<void> {
  await container.rbac.useCases.seedSystemRoles.execute();
  await storageService.ensureBuckets();
  await verifyMailTransport();
  startWorkers();
  await registerRepeatableJobs();
  log.info('Application bootstrap completed');
}

export default createApp;
