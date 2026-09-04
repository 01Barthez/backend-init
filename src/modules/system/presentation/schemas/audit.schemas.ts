/**
 * Audit express-validator rules — operator read API only.
 */
import { param, query } from 'express-validator';

const optionalFilterString = (name: string) =>
  query(name)
    .optional()
    .trim()
    .isString()
    .withMessage(`${name} must be a string`)
    .isLength({ min: 1, max: 128 })
    .withMessage(`${name} must be between 1 and 128 characters`);

const optionalIsoDate = (name: string) =>
  query(name)
    .optional()
    .trim()
    .isISO8601({ strict: true })
    .withMessage(`${name} must be a valid ISO-8601 date-time`);

const sharedFilters = [
  optionalFilterString('actorId'),
  optionalFilterString('action'),
  optionalFilterString('resource'),
  optionalFilterString('requestId'),
  optionalIsoDate('from'),
  optionalIsoDate('to'),
];

export const auditSchemas = {
  list: [
    ...sharedFilters,
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],

  export: [
    ...sharedFilters,
    query('format')
      .optional()
      .trim()
      .isIn(['csv', 'json'])
      .withMessage('format must be csv or json'),
  ],

  getById: [
    param('auditId')
      .trim()
      .notEmpty()
      .withMessage('Audit ID is required')
      .isMongoId()
      .withMessage('Audit ID must be a valid Mongo ObjectId'),
  ],
};
