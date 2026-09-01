import setupSwagger from '@config/swagger/swagger';
import log from '@services/logging/logger';
import initMiddlewares from '@utils/middleware/_initMiddlewares';
import express from 'express';

import health from '@/routes/_config/health-check/health.router';
import metricsRouter from '@/services/metrics/metrics';

import { scheduler } from './services/scheduler';
import { initNotificationService, initUploader } from './services/scheduler/initDependencies';

const app = express();

setupSwagger(app);

// System routes must be registered before the global middleware stack (which ends with 404)
app.use('/metrics', metricsRouter);
app.use('/health', health);

initMiddlewares(app);

// Initialize scheduler dependencies
const uploader = initUploader();
const notificationService = initNotificationService();

// Initialize jobs with dependencies
scheduler.init({
  uploader,
  notificationService,
});

// Global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.stack : reason,
  });
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error.stack || error);
  throw new Error(`Uncaught Exception:: ${error.message || error}`);
});

export default app;
