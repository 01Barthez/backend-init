import express from "express";
import cors from "cors";
import items from "@router/items/items.router";
import metricsRouter from "@services/metrics/metrics";
import health from "@router/healtcheck/health.router";
import { errorLog, requestLog } from "@middlewares/requestLogger";
import errorHandler from "@middlewares/errorHandler";
import log from "@services/logging/logger";
import notFoundHandler from "@middlewares/notFoundRoutes";
import setupSwagger from "@config/swagger/swagger";
import { requestTimeMiddleware } from "./middlewares/responseTime";
import { validationErrorHandler } from "./middlewares/validationErrorHandler";

const app = express();

// Globals Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Setup Swagger for API documentation
setupSwagger(app);

// Request Logging Middleware 
app.use(requestLog);
app.use(requestTimeMiddleware);

// Routes Middleware
app.use(metricsRouter);
app.use('/items', items);
app.use('/health', health);

// Error Handling Middleware
app.use(validationErrorHandler);
app.use(errorLog);
app.use(errorHandler);
app.use(notFoundHandler);


// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', { 
    promise, 
    reason: reason instanceof Error ? reason.stack : reason 
  });
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error.stack || error);
  process.exit(1);
});

export default app;