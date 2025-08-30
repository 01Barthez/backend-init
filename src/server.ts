import express from "express";
import metricsRouter from "./services/metrics/metrics";
import items from "./router/items/items.router";
import health from "./router/healtcheck/health.router";
import cors from "cors";
import { errorLog, requestLog } from "./middlewares/requestLogger";
import errorHandler from "./middlewares/errorHandler";
import log from "./services/logging/logger";

const app = express();

// Configuration de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Middleware de journalisation personnalisé
app.use(requestLog);

// Routes
app.use(metricsRouter);
app.use('/items', items);
app.use('/health', health);

// Gestion des erreurs
app.use(errorLog);
app.use(errorHandler);

// Middleware pour les routes non trouvées
app.use((req, res, next) => {
  // Si la réponse a déjà été envoyée, on ne fait rien
  if (res.headersSent) {
    return next();
  }

  const responseData = {
    status: 'error',
    message: 'Not found route',
    path: req.originalUrl
  };
  
  // Log spécifique pour les routes non trouvées
  log.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    statusCode: 404,
    responseTime: '0ms' // Le temps de réponse sera calculé par le middleware de log
  });
  
  res.status(404).json(responseData);
});

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