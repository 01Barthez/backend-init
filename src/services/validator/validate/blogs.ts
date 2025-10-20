import { body } from 'express-validator';

export const validate_blog = {
  blog: [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
};
