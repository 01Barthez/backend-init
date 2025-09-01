import setupSwagger from '@config/swagger/swagger';
import health from '@router/healtcheck/health.router';
import log from '@services/logging/logger';
import metricsRouter from '@services/metrics/metrics';
import initMiddlewares from '@utils/middleware/_initMiddlewares';
import express from 'express';

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
  process.exit(1);
});

export default app;
