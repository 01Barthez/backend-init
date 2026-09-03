/**
 * Global Express error handler — maps AppError (and CSRF failures) to JSON responses.
 */
import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';
import { isAppError } from '@/shared/domain/errors/app-error';
import { CsrfTokenError } from '@/shared/domain/errors/security.errors';
import log from '@/shared/infrastructure/logging/logger';
import { getLogMeta } from '@/shared/infrastructure/request-context';
import { sendErrorResponse } from '@/shared/utils/http/send-error-response';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): Response => {
  const includeStack = !config.app.isProduction;

  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      log.error(
        'Application error',
        getLogMeta({
          message: err.message,
          code: err.code,
          path: req.originalUrl,
          method: req.method,
          stack: err.stack,
        }),
      );
    }
  } else if (err instanceof Error) {
    log.error(
      'Unhandled error',
      getLogMeta({
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
      }),
    );
  }

  if ((err as { code?: string })?.code === 'EBADCSRFTOKEN') {
    return sendErrorResponse(res, CsrfTokenError(), includeStack);
  }

  return sendErrorResponse(res, err, includeStack);
};

export default errorHandler;
