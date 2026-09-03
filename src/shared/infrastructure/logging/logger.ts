/**
 * Application Winston logger — rotating files and optional Loki.
 *
 * Process-level `uncaughtException` / `unhandledRejection` handlers live in
 * `registerProcessHandlers()` (entrypoint), not here. Winston must not swallow
 * those events while also registering Node listeners (double-handling).
 */
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';

import { config } from '@/app/config';
import { ensureDirectoryExists } from '@/shared/utils/fs-utils';

const logsDir = path.join(process.cwd(), 'logs');
let canWriteLogs = true;
try {
  ensureDirectoryExists(logsDir);
} catch (error) {
  canWriteLogs = false;
  console.warn('Logs directory unavailable — falling back to console transports only.', error);
}

const logLevel = config.app.isProduction ? 'warn' : 'debug';

const createTransport = (filename: string, level: string, maxFiles: number) =>
  new DailyRotateFile({
    filename: `logs/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '30m',
    maxFiles: `${maxFiles}d`,
    level,
  }).on('error', (err) => {
    console.error(`Error in transport ${filename}:`, err);
  });

const fileTransports = canWriteLogs
  ? [
      createTransport('application', 'info', 14),
      createTransport('warns', 'warn', 21),
      createTransport('debugs', 'debug', 21),
      createTransport('errors', 'error', 30),
    ]
  : [];

/** Construct Loki only when enabled — otherwise the client probes a dead host. */
const lokiTransports = config.observability.lokiEnabled
  ? [
      new LokiTransport({
        host: config.observability.lokiHost,
        labels: {
          app: config.app.name,
          env: config.app.nodeEnv,
          service: 'api',
          version: config.app.version,
        },
        json: true,
        replaceTimestamp: true,
        onConnectionError: (err) => {
          console.error('Failed to connect to Loki:', err);
        },
      }).on('error', (err) => {
        console.error('Error in loki transport:', err);
      }),
    ]
  : [];

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
      level: config.app.isProduction ? 'info' : 'debug',
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
    ...lokiTransports,
    ...fileTransports,
  ],
  handleExceptions: false,
  handleRejections: false,
  exitOnError: false,
});

export default log;
