import type { NextFunction, Request, Response } from 'express';

import {
  type RequestContextStore,
  resolveRequestId,
  resolveTraceId,
  runWithRequestContext,
} from '@/shared/infrastructure/request-context';

/**
 * Opens an ALS scope for the request and echoes X-Request-Id on every response.
 * Must run early — before logging, auth, and route handlers.
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = resolveRequestId(req.headers['x-request-id']);
  const traceId = resolveTraceId(req.headers.traceparent);
  res.setHeader('X-Request-Id', requestId);
  if (traceId) {
    res.setHeader('X-Trace-Id', traceId);
  }

  const store: RequestContextStore = {
    requestId,
    traceId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 512),
    startedAt: Date.now(),
  };

  runWithRequestContext(store, () => next());
};

export default requestContextMiddleware;
