import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';
import { SecurityLogger } from '@/shared/infrastructure/logging/security-logger';
import { recordHttpRequest } from '@/shared/infrastructure/metrics/http-metrics';
import { getLogMeta, getRequestContext } from '@/shared/infrastructure/request-context';

const SKIP_PREFIXES = ['/api-docs', '/static/'];

const routeLabel = (req: Request): string => {
  const matched = req.route?.path;
  if (typeof matched === 'string') {
    return matched;
  }
  const base = req.baseUrl || '';
  const path = req.path || req.originalUrl.split('?')[0];
  return `${base}${path}` || 'unknown';
};

/**
 * Single HTTP access log + RED metrics + lightweight security signals.
 * Does not capture request/response bodies (avoid credential leaks).
 */
export const httpLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (SKIP_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }

  const startedAt = getRequestContext()?.startedAt ?? Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const label = routeLabel(req);

    recordHttpRequest(req.method, label, res.statusCode, durationMs);

    if (res.statusCode === 404) {
      return;
    }

    log.http(
      'HTTP request',
      getLogMeta({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        route: label,
      }),
    );

    if (res.statusCode >= 500) {
      SecurityLogger.error(
        'Server error',
        getLogMeta({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }),
      );
    } else if (res.statusCode >= 400) {
      SecurityLogger.warning(
        'Client error',
        getLogMeta({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }),
      );
    } else if (req.originalUrl.includes('/auth') && req.method !== 'GET') {
      SecurityLogger.notice(
        'Auth traffic',
        getLogMeta({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }),
      );
    } else if (req.method !== 'GET' && !config.app.isTest) {
      SecurityLogger.info(
        'Mutation',
        getLogMeta({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }),
      );
    }
  });

  next();
};

export default httpLogMiddleware;
