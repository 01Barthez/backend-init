import setupSwagger from '@config/swagger/swagger';
import log from '@services/logging/logger';
import initMiddlewares from '@utils/middleware/init-middlewares';
import express from 'express';

import { setupBullBoard } from '@/routes/_config/admin/queues.router';
import health from '@/routes/_config/health-check/health.router';
import rbacService from '@/services/auth/rbac.service';
import { verifyMailTransport } from '@/services/mail/mail.service';
import metricsRouter from '@/services/metrics/metrics';
import { registerRepeatableJobs } from '@/services/queue/queue.service';
import { startWorkers } from '@/services/queue/workers';
import storageService from '@/services/storage/storage.service';

const app = express();

setupSwagger(app);
setupBullBoard(app);

app.use('/metrics', metricsRouter);
app.use('/health', health);

initMiddlewares(app);

const bootstrap = async (): Promise<void> => {
  await rbacService.seedSystemRolesAndPermissions();
  await storageService.ensureBuckets();
  await verifyMailTransport();
  startWorkers();
  await registerRepeatableJobs();
  log.info('Application bootstrap completed');
};

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((error) => {
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

export default app;
