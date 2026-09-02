import { AppError } from '@/shared/domain/errors/app-error';

/**
 * Blog-specific domain errors for clear failure modes in use cases.
 */
export class BlogNotFoundError extends AppError {
  constructor(message = 'Blog not found') {
    super(404, message, 'BLOG_NOT_FOUND');
    this.name = 'BlogNotFoundError';
  }
}

export class BlogForbiddenError extends AppError {
  constructor(message = 'You do not have permission to modify this blog') {
    super(403, message, 'BLOG_FORBIDDEN');
    this.name = 'BlogForbiddenError';
  }
}
