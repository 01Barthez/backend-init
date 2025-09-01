// src/services/logging/securityLogger.ts
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';

import { envs } from '@/config/env/env';

const { combine, timestamp, json, errors } = winston.format;

/**
 * Custom log levels for security-related events.
 * Lower numbers indicate higher severity.
 */
const securityLevels = {
  levels: {
    critical: 0, // System is unusable, immediate attention required
    alert: 1, // Action must be taken immediately
    error: 2, // Error conditions
    warning: 3, // Warning conditions
    notice: 4, // Normal but significant condition
    info: 5, // Informational messages
    debug: 6, // Debug-level messages
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

/**
 * Security logger instance using Winston with daily rotation.
 * Logs are separated by severity and environment.
 */
const securityLogger = winston.createLogger({
  levels: securityLevels.levels,
  level: 'info', // Default log level
  format: combine(
    errors({ stack: true }), // Include stack trace for errors
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
    json(), // Output logs in JSON format
  ),
  defaultMeta: { service: 'security' }, // Add service metadata
  transports: [
    // Log critical errors to a separate file, rotated daily
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'security', 'critical-%DATE%.log'),
      level: 'critical',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    // Log audit and informational events to a separate file, rotated daily
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'security', 'audit-%DATE%.log'),
      level: 'info',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    // Output logs to console in non-production environments for easier debugging
    ...(envs.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(), // Colorize output for readability
              winston.format.simple(),
            ),
          }),
        ]
      : []),
  ],
});

/**
 * Utility methods for logging security events at various levels.
 * Each method accepts a message and optional metadata.
 */
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
 * Express middleware to log sensitive or security-related HTTP requests.
 * Automatically sanitizes sensitive fields and logs based on request type and status.
 */
export const securityRequestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers, body } = req;

  // Sanitize sensitive fields from request body before logging
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) sanitizedBody.password = '***';
  if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
  if (sanitizedBody.token) sanitizedBody.token = '***';

  res.on('finish', () => {
    const { statusCode } = res;
    const responseTime = Date.now() - start;

    // Prepare log data with relevant request information
    const logData = {
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent: headers['user-agent'],
      ...(Object.keys(sanitizedBody).length > 0 && { requestBody: sanitizedBody }),
    };

    // Log based on response status and request type
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
