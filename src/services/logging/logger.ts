/**
 * Advanced Winston Logger – Portable, Modular, Production Ready
 * Features:
 *  - Daily rotating log files per level (info, warn, debug, error)
 *  - Formatted console logs based on environment
 *  - Handles uncaught exceptions & unhandled promise rejections
 *
 */
import { envs } from '@config/env/env';
import { ensureDirectoryExists } from '@utils/fsUtils';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';

// checking logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  ensureDirectoryExists(logsDir);
} catch (error) {
  console.error('Critical error: Impossible to settings logs');
  throw new Error(`Critical error: Impossible to settings logs: ${error}`);
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
    version: '1.0.0',
  },
  json: true,
  replaceTimestamp: true,
  onConnectionError: (err) => {
    console.error('Failed to connect to Loki:', err);
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

// Custom format for HTTP logs
const _httpFormat = format.printf(
  ({ timestamp, level, _message, method, url, status, responseTime, ..._meta }) => {
    return `${timestamp} [${level}]: ${method} ${url} ${status} - ${responseTime}ms`;
  },
);

const errorFormatter = format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
      ...(typeof info.cause !== 'undefined' ? { cause: info.cause } : {}),
    };
  }
  return info;
});

// Winston logger configuration
const log = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errorFormatter(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    // Console transport with enhanced formatting
    new transports.Console({
      level: envs.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.colorize({ all: true }),
        format.printf(({ level, message, timestamp, ...meta }) => {
          let logMessage = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
          }
          return logMessage;
        }),
      ),
    }),

    // Loki transport only if accept
    ...(envs.LOKI_ENABLED === true ? [lokiTransport] : []),

    // Other file transports
    ...transportsList,
  ],

  // Manage uncaught exceptions and unhandled rejections
  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,

  exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log' })],
});

// Prevent Winston from exiting after handling exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...('cause' in error && error.cause !== undefined ? { cause: (error as any).cause } : {}),
    },
  });
  throw new Error(`Uncaught Exception: ${error}`);
});

process.on('unhandledRejection', (reason, promise) => {
  const error =
    reason instanceof Error
      ? {
          name: reason.name,
          message: reason.message,
          stack: reason.stack,
          ...('cause' in reason && (reason as any).cause !== undefined
            ? { cause: (reason as any).cause }
            : {}),
        }
      : { message: String(reason) };

  log.error('Unhandled Rejection', {
    error,
    promise: {
      promise: promise,
    },
  });
});
export default log;
