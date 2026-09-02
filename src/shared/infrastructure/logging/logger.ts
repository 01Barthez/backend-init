/**
 * Application Winston logger — rotating files, optional Loki, process-level handlers.
 *
 * Used across infrastructure adapters; import from
 * `@/shared/infrastructure/logging/logger` (or the legacy shim under services/logging).
 */
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';

import { envs } from '@/app/config';
import { ensureDirectoryExists } from '@/shared/utils/fs-utils';

/**
 * Ensure the logs directory exists. In restricted environments (CI sandboxes,
 * read-only mounts) we degrade gracefully to console-only transports.
 */
const logsDir = path.join(process.cwd(), 'logs');
let canWriteLogs = true;
try {
  ensureDirectoryExists(logsDir);
} catch (error) {
  canWriteLogs = false;
  console.warn('Logs directory unavailable — falling back to console transports only.', error);
}

const logLevel = envs.NODE_ENV === 'production' ? 'warn' : 'debug';

/** Build a daily-rotating file transport for a given severity. */
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

const transportsList = canWriteLogs
  ? [
      createTransport('application', 'info', 14),
      createTransport('warns', 'warn', 21),
      createTransport('debugs', 'debug', 21),
      createTransport('errors', 'error', 30),
    ]
  : [];

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

    ...(envs.LOKI_ENABLED === true ? [lokiTransport] : []),

    ...transportsList,
  ],

  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,

  exceptionHandlers: canWriteLogs ? [new transports.File({ filename: 'logs/exceptions.log' })] : [],
  rejectionHandlers: canWriteLogs ? [new transports.File({ filename: 'logs/rejections.log' })] : [],
});

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
