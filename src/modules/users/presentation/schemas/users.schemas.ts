/**
 * Users express-validator rules (presentation layer).
 * Profile / admin user routes — not auth credential flows.
 */
import { body, param, query } from 'express-validator';

import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { nameValidation } from '@/shared/utils/validation-helpers';

/**
 * Roles assignable via PUT /:userId/role.
 * Sourced from SYSTEM_ROLES (RBAC seed) — not a parallel enum.
 * `super-admin` stays bootstrap-only; do not expose it on this endpoint.
 */
const ASSIGNABLE_ROLE_SLUGS = [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.USER, SYSTEM_ROLES.GUEST] as const;

const userIdParam = param('userId')
  .trim()
  .notEmpty()
  .withMessage('User ID is required')
  .isMongoId()
  .withMessage('User ID must be a valid Mongo ObjectId');

export const usersSchemas = {
  updateUserInfo: [
    nameValidation('firstName').optional(),
    nameValidation('lastName').optional(),
    body('phone')
      .optional()
      .trim()
      .isString()
      .withMessage('Phone number must be a string')
      .isLength({ min: 5, max: 20 })
      .withMessage('Phone number must be between 5 and 20 characters')
      .escape(),
  ],

  updateUserRole: [
    userIdParam,
    body('role')
      .trim()
      .notEmpty()
      .withMessage('Role is required')
      .isIn([...ASSIGNABLE_ROLE_SLUGS])
      .withMessage(`Invalid role. Must be one of: ${ASSIGNABLE_ROLE_SLUGS.join(', ')}`),
  ],

  /** Soft-delete / hard-delete / restore — all keyed by `:userId`. */
  byUserId: [userIdParam],

  getUserById: [userIdParam],

  searchUser: [
    query('search')
      .optional()
      .trim()
      .isString()
      .withMessage('Search query must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
  ],

  listUsers: [
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
    query('isDeleted').optional().isBoolean().withMessage('isDeleted must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
};
