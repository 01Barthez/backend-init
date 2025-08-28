/**
 * Advanced Winston Logger – Portable, Modular, Production Ready
 * Features:
 *  - Daily rotating log files per level (info, warn, debug, error)
 *  - Formatted console logs based on environment
 *  - Handles uncaught exceptions & unhandled promise rejections
 *
 */

import winston, { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { envs } from '../../config/env/env';
import { ensureDirectoryExists } from '../../utils/fsUtils';
import path from 'path';

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
  });
  transport.on('error', (err) => {
    console.error(`Error in transport ${filename}:`, err);
  });
  return transport;
};

// File transports
const transportsList = [
  createTransport('application', 'info', 14),
  createTransport('warns', 'warn', 21),
  createTransport('debugs', 'debug', 21),
  createTransport('errors', 'error', 30),
];

// Winston logger configuration
const log = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.align(),
    envs.NODE_ENV === 'production'
      ? format.json()
      : format.combine(
        format.colorize({ all: true }),
        format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level}]: ${message}`
        )
      )
  ),
  defaultMeta: { service: 'your-service-name' },
  transports: [
    new transports.Console({
      level: envs.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
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
