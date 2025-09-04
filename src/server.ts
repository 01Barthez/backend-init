import setupSwagger from '@config/swagger/swagger';
import log from '@services/logging/logger';
import metricsRouter from '@services/metrics/metrics';
import initMiddlewares from '@utils/middleware/_initMiddlewares';
import express from 'express';

import health from '@/router/_config/healtcheck/health.router';

const app = express();

// Setup Swagger for API documentation
setupSwagger(app);

initMiddlewares(app);

// Metrics endpoint
app.use('/metrics', metricsRouter);

// Health check endpoint
app.use('/health', health);

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
