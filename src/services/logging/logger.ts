/**
 * Advanced Winston Logger – Portable, Modular, Production Ready
 * Features:
 *  - Daily rotating log files per level (info, warn, debug, error)
 *  - Formatted console logs based on environment
 *  - Handles uncaught exceptions & unhandled promise rejections
 *
 */

import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { envs } from '../../config/env/env';
import { ensureDirectoryExists } from '../../utils/fsUtils';
import path from 'path';
import LokiTransport from 'winston-loki';

// checking logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  ensureDirectoryExists(logsDir);
} catch (error) {
  console.error('Critical error: Impossible to settings logs');
  process.exit(1);
}

// Dynamic log level based on environment
const logLevel = envs.NODE_ENV === 'production' ? 'warn' : 'debug';

// Factory to create daily rotating transports with error handling
const createTransport = (filename: string, level: string, maxFiles: number) => {
  const transport = new DailyRotateFile({
    filename: `logs/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '30m',
    maxFiles: `${maxFiles}d`,
    level,
  }).on('error', (err) => {
    console.error(`Error in transport ${filename}:`, err);
  });
  return transport;
};

// Transport for Grafana Loki
const lokiTransport = new LokiTransport({
  host: 'http://loki:3100',
  labels: {
    app: 'backend',
    env: envs.NODE_ENV,
    service: 'api',
    version: '1.0.0'
  },
  json: true,
  replaceTimestamp: true,
  onConnectionError: (err) => {
    console.error('Échec de connexion à Loki:', err);
  },
}).on('error', (err) => {
  console.error(`Error in loki transport:`, err);
});

// File transports
const transportsList = [
  createTransport('application', 'info', 14),
  createTransport('warns', 'warn', 21),
  createTransport('debugs', 'debug', 21),
  createTransport('errors', 'error', 30),
];

// Format personnalisé pour les logs HTTP
const httpFormat = format.printf(({ timestamp, level, message, method, url, status, responseTime, ...meta }) => {
  return `${timestamp} [${level}]: ${method} ${url} ${status} - ${responseTime}ms`;
});

// Winston logger configuration
const log = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    // Console transport avec formatage amélioré
    new transports.Console({
      level: envs.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.colorize({ all: true }),
        format.printf(
          ({ level, message, timestamp, ...meta }) => {
            let logMessage = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length > 0) {
              logMessage += `\n${JSON.stringify(meta, null, 2)}`;
            }
            return logMessage;
          }
        )
      ),
    }),

    // Transport HTTP pour les logs d'API
    new transports.Console({
      level: 'http',
      format: format.combine(
        format.colorize({ all: true }),
        httpFormat
      ),
    }),

    // Loki transport only in non-development environments
    ...(envs.NODE_ENV !== 'development' ? [lokiTransport] : []),

    // Other file transports
    ...transportsList,
  ],

  // Manage uncaught exceptions and unhandled rejections
  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,

  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],

});

// Prevent Winston from exiting after handling exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default log;
