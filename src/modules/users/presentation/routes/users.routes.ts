import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';
import { upload } from '@/modules/files';

import type { UsersController } from '../controllers/users.controller';
import { usersSchemas } from '../schemas/users.schemas';

/**
 * Users HTTP routes — path contract mirrors the legacy `users.router.ts`.
 * Mounted at `/api/v1/users`.
 */
export function createUsersRoutes(controller: UsersController): Router {
  const users = Router();

  /** PUT /profile — Update the authenticated user's profile (optional avatar). */
  users.put(
    '/profile',
    authenticate,
    requireVerified,
    requireActive,
    upload.single('profile'),
    usersSchemas.updateUserInfo,
    validationErrorHandler,
    controller.updateUser,
  );

  /** GET /search — Search users by name or email (`user:read:any`). */
  users.get(
    '/search',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.searchUser,
    validationErrorHandler,
    controller.searchUsers,
  );

  /** GET / — List users with pagination and filters (`user:read:any`). */
  users.get(
    '/',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.listUsers,
    validationErrorHandler,
    controller.listUsers,
  );

  /** GET /export — Export users (`user:export`). */
  users.get('/export', authenticate, requirePermission('user:export'), controller.exportUsers);

  // Registered before `/:userId` so "clear-all" is not captured as an id.
  /** DELETE /clear-all — Destructive clear of user records (`user:delete:any`). */
  users.delete(
    '/clear-all',
    authenticate,
    requirePermission('user:delete:any'),
    controller.clearAllUsers,
  );

  /** GET /:userId — Fetch a single user by id (`user:read:any`). */
  users.get(
    '/:userId',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.getUserById,
    validationErrorHandler,
    controller.getUserById,
  );

  /** PUT /:userId/role — Assign a system role slug (`user:role:assign`). */
  users.put(
    '/:userId/role',
    authenticate,
    requirePermission('user:role:assign'),
    usersSchemas.updateUserRole,
    validationErrorHandler,
    controller.updateUserRole,
  );

  /** DELETE /:userId — Soft-delete a user (`user:delete:any`). */
  users.delete(
    '/:userId',
    authenticate,
    requirePermission('user:delete:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.deleteUser,
  );

  /** DELETE /:userId/permanent — Hard-delete a user (`user:delete:any`). */
  users.delete(
    '/:userId/permanent',
    authenticate,
    requirePermission('user:delete:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.deleteUserPermanently,
  );

  /** POST /:userId/restore — Restore a soft-deleted user (`user:update:any`). */
  users.post(
    '/:userId/restore',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.restoreUser,
  );

  return users;
}
