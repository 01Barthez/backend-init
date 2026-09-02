import { Router } from 'express';

import blogController from '@/controllers/blogs/blog.controller';
import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/middlewares/authenticate.middleware';
import paginationMiddleware from '@/middlewares/pagination.middleware';
import { validationErrorHandler } from '@/middlewares/validation-error-handler.middleware';
import { validate_blog } from '@/services/validator/validate/blogs';

const blogs = Router();

blogs.get('/', paginationMiddleware, blogController.list);
blogs.get('/:slug', blogController.getBySlug);

blogs.post(
  '/',
  authenticate,
  requireVerified,
  requireActive,
  requirePermission('blog:create'),
  validate_blog.blog,
  validationErrorHandler,
  blogController.create,
);

blogs.put(
  '/:id',
  authenticate,
  requireVerified,
  requireActive,
  requirePermission('blog:update:own'),
  validate_blog.blog,
  validationErrorHandler,
  blogController.update,
);

blogs.patch(
  '/:id/publish',
  authenticate,
  requireVerified,
  requireActive,
  requirePermission('blog:publish'),
  blogController.publish,
);

blogs.delete(
  '/:id',
  authenticate,
  requireVerified,
  requireActive,
  requirePermission('blog:delete:own'),
  blogController.delete,
);

export default blogs;
