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
 * Users HTTP routes — mounted at `/api/v1/users`.
 *
 * Self-service: profile, avatar delete, account delete.
 * Admin: list/search/export, get, update, role, lifecycle, invite, sessions.
 *
 * Own profile with roles/permissions remains `GET /api/v1/auth/me`.
 */
export function createUsersRoutes(controller: UsersController): Router {
  const users = Router();

  // --- Self-service ----------------------------------------------------------

  /** PUT /profile — Update own profile (optional avatar). */
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

  /** DELETE /profile/avatar — Clear own avatar. */
  users.delete(
    '/profile/avatar',
    authenticate,
    requireVerified,
    requireActive,
    controller.deleteAvatar,
  );

  /** DELETE /me — Soft-delete own account (GDPR self-service). */
  users.delete('/me', authenticate, requireVerified, requireActive, controller.deleteOwnAccount);

  // --- Admin collection ------------------------------------------------------

  /** POST /invite — Create verified user + set-password email (`user:update:any`). */
  users.post(
    '/invite',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.inviteUser,
    validationErrorHandler,
    controller.inviteUser,
  );

  /** GET /search — Paginated search (`user:read:any`). */
  users.get(
    '/search',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.searchUser,
    validationErrorHandler,
    controller.searchUsers,
  );

  /** GET / — Paginated list (`user:read:any`). */
  users.get(
    '/',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.listUsers,
    validationErrorHandler,
    controller.listUsers,
  );

  /** GET /export — CSV export (`user:export`). */
  users.get(
    '/export',
    authenticate,
    requirePermission('user:export'),
    usersSchemas.exportUsers,
    validationErrorHandler,
    controller.exportUsers,
  );

  // --- Admin by id -----------------------------------------------------------

  /** GET /:userId — Admin detail with roles (`user:read:any`). */
  users.get(
    '/:userId',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.getUserById,
    validationErrorHandler,
    controller.getUserById,
  );

  /** GET /:userId/sessions — Admin view of all refresh-token families (`user:read:any`). */
  users.get(
    '/:userId/sessions',
    authenticate,
    requirePermission('user:read:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.getUserSessions,
  );

  /** PATCH /:userId — Admin update profile (`user:update:any`). */
  users.patch(
    '/:userId',
    authenticate,
    requirePermission('user:update:any'),
    upload.single('profile'),
    usersSchemas.updateUserById,
    validationErrorHandler,
    controller.updateUserById,
  );

  /** PUT /:userId/role — Assign role (`user:role:assign`). */
  users.put(
    '/:userId/role',
    authenticate,
    requirePermission('user:role:assign'),
    usersSchemas.updateUserRole,
    validationErrorHandler,
    controller.updateUserRole,
  );

  /** POST /:userId/activate — Enable account (`user:update:any`). */
  users.post(
    '/:userId/activate',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.activateUser,
  );

  /** POST /:userId/deactivate — Disable account + revoke sessions (`user:update:any`). */
  users.post(
    '/:userId/deactivate',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.deactivateUser,
  );

  /** POST /:userId/verify-email — Mark email verified (`user:update:any`). */
  users.post(
    '/:userId/verify-email',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.verifyUserEmail,
  );

  /** POST /:userId/unlock — Clear login lockout (`user:update:any`). */
  users.post(
    '/:userId/unlock',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.unlockUser,
  );

  /** POST /:userId/revoke-sessions — Force logout all devices (`user:update:any`). */
  users.post(
    '/:userId/revoke-sessions',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.revokeUserSessions,
  );

  /** DELETE /:userId — Soft-delete (`user:delete:any`). */
  users.delete(
    '/:userId',
    authenticate,
    requirePermission('user:delete:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.deleteUser,
  );

  /** DELETE /:userId/permanent — GDPR hard-delete (`user:delete:any`). */
  users.delete(
    '/:userId/permanent',
    authenticate,
    requirePermission('user:delete:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.deleteUserPermanently,
  );

  /** POST /:userId/restore — Restore soft-deleted user (`user:update:any`). */
  users.post(
    '/:userId/restore',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.restoreUser,
  );

  /**
   * DELETE /:userId/oauth/:provider — Admin: forcibly unlink an OAuth provider
   * from any user account (`user:update:any`). Audited.
   */
  users.delete(
    '/:userId/oauth/:provider',
    authenticate,
    requirePermission('user:update:any'),
    usersSchemas.byUserId,
    validationErrorHandler,
    controller.adminUnlinkOAuth,
  );

  return users;
}
