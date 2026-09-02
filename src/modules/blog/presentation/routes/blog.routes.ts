import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import paginationMiddleware from '@/app/middleware/pagination.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';

import type { BlogController } from '../controllers/blog.controller';
import { blogSchemas } from '../schemas/blog.schemas';

/**
 * Blog HTTP routes — path contract mirrors the legacy `blogs.routes.ts`.
 * Mounted at `/api/v1/blogs`.
 */
export function createBlogRoutes(controller: BlogController): Router {
  const blogs = Router();

  /** GET / — List blog posts (paginated, public). */
  blogs.get('/', paginationMiddleware, controller.list);

  /** GET /:slug — Fetch a single blog post by URL slug. */
  blogs.get('/:slug', controller.getBySlug);

  /** POST / — Create a blog post (`blog:create`). */
  blogs.post(
    '/',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('blog:create'),
    blogSchemas.blog,
    validationErrorHandler,
    controller.create,
  );

  /** PUT /:id — Update a blog post (`blog:update:own`). */
  blogs.put(
    '/:id',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('blog:update:own'),
    blogSchemas.blog,
    validationErrorHandler,
    controller.update,
  );

  /** PATCH /:id/publish — Publish a blog post (`blog:publish`). */
  blogs.patch(
    '/:id/publish',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('blog:publish'),
    controller.publish,
  );

  /** DELETE /:id — Delete a blog post (`blog:delete:own`). */
  blogs.delete(
    '/:id',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('blog:delete:own'),
    controller.delete,
  );

  return blogs;
}
