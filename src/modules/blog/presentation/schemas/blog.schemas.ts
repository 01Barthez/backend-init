import { body } from 'express-validator';

/**
 * Blog express-validator rules.
 */
export const blogSchemas = {
  blog: [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
};

/** Legacy alias used by older imports. */
export const validate_blog = blogSchemas;
