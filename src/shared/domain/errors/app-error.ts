/**
 * Domain-level application error.
 *
 * Lives in `shared/domain` so every module can throw typed errors without
 * depending on Express or any infrastructure package.
 *
 * Presentation maps these to HTTP via `formatErrorResponse` /
 * `sendErrorResponse` — Domain never imports Response helpers.
 */
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
