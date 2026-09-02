import type { NextFunction, Request, Response } from 'express';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';
import { isAppError, sendErrorResponse } from '@/utils/errors/app-error';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): Response => {
  const includeStack = envs.NODE_ENV !== 'production';

  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      log.error('Application error', {
        message: err.message,
        code: err.code,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
      });
    }
  } else if (err instanceof Error) {
    log.error('Unhandled error', {
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  if ((err as any)?.code === 'EBADCSRFTOKEN') {
    return res
      .status(403)
      .json({ success: false, message: 'Invalid CSRF token', code: 'CSRF_ERROR' });
  }

  if ((err as any)?.code === 'P2023') {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid ID format', code: 'INVALID_ID' });
  }

  return sendErrorResponse(res, err, includeStack);
};

export default errorHandler;
