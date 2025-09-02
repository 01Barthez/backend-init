import log from '@services/logging/logger';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware: Request Logger
 * Logs incoming HTTP requests and outgoing responses
 * (excluding swagger/docs and static files).
 *
 * - Captures method, URL, status code, response time, content length
 * - Optionally logs request body and response body (only if JSON and not too large)
 */
export const requestLog = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api-docs') || req.path.startsWith('/static/')) {
    return next();
  }

  const start = Date.now();
  const originalEnd = res.end;
  const chunks: Buffer[] = [];

  // Override res.end to capture response body
  res.end = ((chunk?: any, encoding?: any, cb?: any) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }

    const responseTime = Date.now() - start;
    let responseBody: any = null;

    try {
      if (chunks.length > 0) {
        const buffer = Buffer.concat(chunks);
        const contentType = res.getHeader('content-type');

        if (
          contentType &&
          typeof contentType === 'string' &&
          contentType.includes('application/json')
        ) {
          responseBody = safeJsonParse(buffer.toString('utf8'));
        } else {
          responseBody = '[Non-JSON response]';
        }
      }
    } catch {
      responseBody = '[Error parsing response]';
    }

    // Avoid logging excessive payloads
    const MAX_LOG_SIZE = 5 * 1024; // 5 KB
    const trimmedResponse =
      responseBody && JSON.stringify(responseBody).length > MAX_LOG_SIZE
        ? '[Response too large]'
        : responseBody;

    if (res.statusCode !== 404) {
      log.http('Outgoing Response', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length') || 0,
        ...(req.body && Object.keys(req.body).length > 0 && { requestBody: req.body }),
        ...(trimmedResponse && { responseBody: trimmedResponse }),
      });
    }

    return originalEnd.call(res, chunk, encoding, cb);
  }) as any;

  next();
};

/**
 * Middleware: Error Logger
 * Logs application errors before passing them to the global error handler.
 *
 * - Captures error message, stack trace (only in dev), path, method and IP
 */
export const errorLog = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.statusCode !== 404) {
    log.error('Error occurred', {
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }
  next(err);
};

/**
 * Utility: Safe JSON Parse
 * Attempts to parse a string to JSON, falls back to string if invalid.
 */
function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
