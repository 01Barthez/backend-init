import { body, param } from 'express-validator';

const VISIBILITY = ['PUBLIC', 'PRIVATE', 'MEMBERS_ONLY'] as const;

const titleRule = (opts: { optional?: boolean } = {}) => {
  const chain = opts.optional ? body('title').optional() : body('title');
  return chain
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape();
};

const contentRule = (opts: { optional?: boolean } = {}) => {
  const chain = opts.optional ? body('content').optional() : body('content');
  return chain
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .isLength({ min: 10, max: 50_000 })
    .withMessage('Content must be between 10 and 50 000 characters');
};

const optionalExcerpt = body('excerpt')
  .optional({ values: 'null' })
  .trim()
  .isString()
  .withMessage('Excerpt must be a string')
  .isLength({ max: 500 })
  .withMessage('Excerpt must be at most 500 characters');

const optionalCoverImage = body('coverImage')
  .optional({ values: 'null' })
  .trim()
  .isURL()
  .withMessage('coverImage must be a valid URL');

const optionalVisibility = body('visibility')
  .optional()
  .isIn([...VISIBILITY])
  .withMessage(`visibility must be one of: ${VISIBILITY.join(', ')}`);

const blogIdParam = param('id')
  .trim()
  .notEmpty()
  .withMessage('Blog id is required')
  .isMongoId()
  .withMessage('Blog id must be a valid Mongo ObjectId');

const blogSlugParam = param('slug')
  .trim()
  .notEmpty()
  .withMessage('Slug is required')
  .isString()
  .withMessage('Slug must be a string')
  .isLength({ min: 1, max: 220 })
  .withMessage('Slug must be between 1 and 220 characters')
  .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
  .withMessage('Slug must be URL-safe (letters, numbers, hyphens)');

/**
 * Blog express-validator rules — presentation boundary only.
 * Lives in the blog module; do not re-export from `shared/utils/validation`.
 */
export const blogSchemas = {
  create: [titleRule(), contentRule(), optionalExcerpt, optionalCoverImage, optionalVisibility],

  update: [
    blogIdParam,
    titleRule({ optional: true }),
    contentRule({ optional: true }),
    optionalExcerpt,
    optionalCoverImage,
    optionalVisibility,
  ],

  getBySlug: [blogSlugParam],

  byId: [blogIdParam],
};
