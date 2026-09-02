/**
 * Security-oriented Winston logger with custom severity levels
 * (critical → debug) and dedicated rotating files under logs/security/.
 */
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';

import { envs } from '@/app/config';

const { combine, timestamp, json, errors } = winston.format;

/** Custom log levels for security-related events (lower = higher severity). */
const securityLevels = {
  levels: {
    critical: 0,
    alert: 1,
    error: 2,
    warning: 3,
    notice: 4,
    info: 5,
    debug: 6,
  },
  colors: {
    critical: 'red',
    alert: 'red',
    error: 'red',
    warning: 'yellow',
    notice: 'blue',
    info: 'green',
    debug: 'white',
  },
};

const securityLogger = winston.createLogger({
  levels: securityLevels.levels,
  level: 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'security', 'critical-%DATE%.log'),
      level: 'critical',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'security', 'audit-%DATE%.log'),
      level: 'info',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    ...(envs.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          }),
        ]
      : []),
  ],
});

/** Typed helpers for security events at each severity level. */
export const SecurityLogger = {
  critical: (message: string, meta?: Record<string, unknown>) =>
    (securityLogger as any).critical(message, meta),

  alert: (message: string, meta?: Record<string, unknown>) =>
    (securityLogger as any).alert(message, meta),

  error: (message: string, meta?: Record<string, unknown>) => securityLogger.error(message, meta),

  warning: (message: string, meta?: Record<string, unknown>) =>
    (securityLogger as any).warning(message, meta),

  notice: (message: string, meta?: Record<string, unknown>) =>
    (securityLogger as any).notice(message, meta),

  info: (message: string, meta?: Record<string, unknown>) => securityLogger.info(message, meta),

  debug: (message: string, meta?: Record<string, unknown>) => securityLogger.debug(message, meta),
};

/**
 * Express middleware that records security-relevant HTTP traffic.
 * Sensitive body fields are redacted before logging.
 */
export const securityRequestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers, body } = req;

  const sanitizedBody = { ...body };
  if (sanitizedBody.password) sanitizedBody.password = '***';
  if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
  if (sanitizedBody.token) sanitizedBody.token = '***';

  res.on('finish', () => {
    const { statusCode } = res;
    const responseTime = Date.now() - start;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent: headers['user-agent'],
      ...(Object.keys(sanitizedBody).length > 0 && { requestBody: sanitizedBody }),
    };

    if (statusCode >= 500) {
      securityLogger.error('Server error', logData);
    } else if (statusCode >= 400) {
      securityLogger.warning('Client error', logData);
    } else if (originalUrl.includes('/auth') || originalUrl.includes('/login')) {
      securityLogger.notice('Authentication attempt', logData);
    } else if (method !== 'GET') {
      securityLogger.info('Modification attempt', logData);
    }
  });
  next();
};

export default securityLogger;
