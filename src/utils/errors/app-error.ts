import type { Response } from 'express';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict'): AppError {
    return new AppError(409, message, 'CONFLICT');
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): AppError {
    return new AppError(422, message, 'UNPROCESSABLE', details);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message, 'INTERNAL_ERROR');
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export type ErrorResponseBody = {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
};

export const formatErrorResponse = (
  error: unknown,
  includeStack = false,
): { statusCode: number; body: ErrorResponseBody } => {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        ...(includeStack ? { stack: error.stack } : {}),
      },
    };
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return {
      statusCode: 400,
      body: { success: false, message: error.message, code: 'VALIDATION_ERROR' },
    };
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return {
    statusCode: 500,
    body: {
      success: false,
      message: includeStack ? message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(includeStack && error instanceof Error ? { stack: error.stack } : {}),
    },
  };
};

export const sendErrorResponse = (
  res: Response,
  error: unknown,
  includeStack = false,
): Response => {
  const { statusCode, body } = formatErrorResponse(error, includeStack);
  return res.status(statusCode).json(body);
};
