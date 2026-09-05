/**
 * Express application factory.
 *
 * Builds middleware and mounts module routes. Bootstrap (RBAC seed, buckets,
 * workers) is explicit via `bootstrapApplication` so HTTP does not listen on a
 * half-ready process.
 */
import express, { type Express } from 'express';

import { config } from '@/app/config';
import { firstValueQueryParser } from '@/app/config/query-parser';
import setupSwagger from '@/app/config/swagger';
import { validateRuntimeConfig } from '@/app/config/validate-runtime';
import { type AppContainer, getContainer } from '@/app/container';
import { initMiddlewares } from '@/app/middleware/init-middlewares';
import { registerRoutes } from '@/app/routes';
import { featureFlagService } from '@/shared/infrastructure/feature-flags';
import log from '@/shared/infrastructure/logging/logger';
import { verifyMailTransport } from '@/shared/infrastructure/mail/mail.service';
import { registerRepeatableJobs } from '@/shared/infrastructure/queue/queue.service';
import { startWorkers } from '@/shared/infrastructure/queue/workers';
import { storageService } from '@/shared/infrastructure/storage/storage.service';

export type CreateAppOptions = {
  /** Inject a pre-built container (tests). Defaults to the process singleton. */
  container?: AppContainer;
};

/**
 * Create and configure the Express application (no side-effect bootstrap).
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const container = options.container ?? getContainer();

  app.set('query parser', firstValueQueryParser);

  setupSwagger(app);
  container.system.setupBullBoard(app);
  initMiddlewares(app, () => registerRoutes(app, container));

  return app;
}

/**
 * One-time startup tasks. Fail closed — the process must not serve traffic
 * against an unseeded or worker-less graph.
 */
export async function bootstrapApplication(
  container: AppContainer = getContainer(),
): Promise<void> {
  if (config.app.isTest) {
    return;
  }

  validateRuntimeConfig();

  await featureFlagService.start();

  if (config.observability.otelEnabled) {
    log.warn(
      'OTEL_ENABLED=true but the OpenTelemetry Node SDK is not wired in this template — tracing stays ALS/traceparent-only until you integrate an exporter',
    );
  }

  await container.rbac.useCases.seedSystemRoles.execute();
  await storageService.ensureBuckets();

  const mailOk = await verifyMailTransport();
  if (!mailOk && config.app.isProduction) {
    throw new Error('SMTP transport verification failed');
  }

  if (config.app.processRole !== 'api') {
    startWorkers();
    await registerRepeatableJobs();
  }

  log.info('Application bootstrap completed', { processRole: config.app.processRole });
}

export default createApp;
