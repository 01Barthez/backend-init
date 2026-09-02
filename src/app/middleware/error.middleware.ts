/**
 * Global Express error handler — maps AppError (and CSRF failures) to JSON responses.
 */
import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';
import { isAppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { sendErrorResponse } from '@/shared/utils/http/send-error-response';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): Response => {
  const includeStack = !config.app.isProduction;

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

  if ((err as { code?: string })?.code === 'EBADCSRFTOKEN') {
    return res
      .status(403)
      .json({ success: false, message: 'Invalid CSRF token', code: 'EBADCSRFTOKEN' });
  }

  return sendErrorResponse(res, err, includeStack);
};

export default errorHandler;
