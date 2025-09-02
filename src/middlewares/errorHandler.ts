import type { NextFunction, Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { response } from '@/utils/responses/helpers';
import { sendResponse } from '@/utils/responses/response';

/**
 * Global Error Handler Middleware
 *
 * This middleware catches all errors thrown in the application
 * (synchronous and asynchronous if using next(err)).
 *
 * - Logs the error using Winston
 * - Returns a standardized error response
 * - Never exposes internal error details to the client (unless in dev mode)
 */

/**
 * Format error stack trace for better readability
 */
const _formatErrorStack = (stack?: string): string[] | undefined => {
  if (!stack) return undefined;
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Optionally hide stack traces in production
  const extraMeta: Record<string, any> = {};
  if (process.env.NODE_ENV !== 'production') {
    extraMeta.stack = err.stack;
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return sendResponse(req, res, 403, 'Invalid CSRF token', null, { details: err.meta?.message });
  }

  // Specific Prisma errors
  if (err.code === 'P2023')
    return sendResponse(req, res, 400, 'Prisma Validation error', null, {
      details: err.meta?.message,
    });

  // MongoDB errors (invalid ObjectId)
  if (err.message.includes('Cast to ObjectId failed'))
    return response.badRequest(req, res, 'Invalid ID format');

  const error = envs.NODE_ENV === 'development' ? err.message : undefined;
  response.serverError(req, res, `An error occurred on the server: ${error}`);
};

export default errorHandler;
