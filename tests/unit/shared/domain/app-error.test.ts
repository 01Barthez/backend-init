import { describe, expect, it } from 'vitest';

import { AppError, formatErrorResponse, isAppError } from '@/shared/domain/errors';

describe('AppError', () => {
  it('badRequest creates a 400 error', () => {
    const error = AppError.badRequest('Invalid input', { field: 'email' });

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('unauthorized creates a 401 error', () => {
    const error = AppError.unauthorized('No token');

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('No token');
  });

  it('forbidden creates a 403 error', () => {
    const error = AppError.forbidden();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Forbidden');
  });

  it('notFound creates a 404 error', () => {
    const error = AppError.notFound('User missing');

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User missing');
  });

  it('conflict creates a 409 error', () => {
    const error = AppError.conflict('Already exists');

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('unprocessable creates a 422 error', () => {
    const error = AppError.unprocessable('Bad entity', { reason: 'x' });

    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('UNPROCESSABLE');
    expect(error.details).toEqual({ reason: 'x' });
  });

  it('tooManyRequests creates a 429 error', () => {
    const error = AppError.tooManyRequests();

    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('internal creates a 500 error', () => {
    const error = AppError.internal('Boom');

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('Boom');
  });

  it('isAppError narrows AppError instances', () => {
    expect(isAppError(AppError.notFound())).toBe(true);
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('formatErrorResponse maps AppError to stable body', () => {
    const { statusCode, body } = formatErrorResponse(AppError.unauthorized('Nope'));

    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      success: false,
      message: 'Nope',
      code: 'UNAUTHORIZED',
    });
  });

  it('formatErrorResponse hides unexpected error details by default', () => {
    const { statusCode, body } = formatErrorResponse(new Error('secret internals'));

    expect(statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
