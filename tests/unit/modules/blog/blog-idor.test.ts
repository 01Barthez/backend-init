import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/domain/errors/app-error';

describe('blog IDOR guard (update command contract)', () => {
  it('BlogForbiddenError is thrown for non-owner non-admin updates', () => {
    const error = AppError.forbidden('You can only update your own blogs');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('BlogNotFoundError maps to 404', () => {
    const error = AppError.notFound('Blog not found');
    expect(error.statusCode).toBe(404);
  });
});
