/**
 * Application Winston logger — stdout by default, optional Loki, optional files.
 *
 * Ops path for the template: stdout (+ Loki when enabled). File transports are
 * opt-in via `LOG_TO_FILE=true` for local debugging only — not a production archive.
 *
 * Process-level `uncaughtException` / `unhandledRejection` handlers live in
 * `registerProcessHandlers()` (entrypoint), not here.
 */
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';

import { config } from '@/app/config';
import { ensureDirectoryExists } from '@/shared/utils/fs-utils';

const configuredLevel = config.observability.logLevel || 'info';

let canWriteLogs = false;
if (config.observability.logToFile) {
  try {
    ensureDirectoryExists(path.join(process.cwd(), 'logs'));
    canWriteLogs = true;
  } catch (error) {
    console.warn('LOG_TO_FILE=true but logs/ is not writable — console only.', error);
  }
}

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
  level: configuredLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errorFormatter(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      level: configuredLevel,
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
