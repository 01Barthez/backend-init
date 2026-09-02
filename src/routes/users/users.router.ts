import { Router } from 'express';

import usersController from '@/controllers/users/users.controller';
import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/middlewares/authenticate.middleware';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validation-error-handler.middleware';
import { validate_user } from '@/services/validator/validate/users';

const users = Router();

users.put(
  '/profile',
  authenticate,
  requireVerified,
  requireActive,
  upload.single('profile'),
  validate_user.updateUserInfo,
  validationErrorHandler,
  usersController.updateUser,
);

users.get(
  '/search',
  authenticate,
  requirePermission('user:read:any'),
  validate_user.searchUser,
  validationErrorHandler,
  usersController.searchUsers,
);

users.get(
  '/',
  authenticate,
  requirePermission('user:read:any'),
  validate_user.listUsers,
  validationErrorHandler,
  usersController.listUsers,
);

users.get('/export', authenticate, requirePermission('user:export'), usersController.exportUsers);

users.get(
  '/:userId',
  authenticate,
  requirePermission('user:read:any'),
  validate_user.getUserById,
  validationErrorHandler,
  usersController.getUserById,
);

users.put(
  '/:userId/role',
  authenticate,
  requirePermission('user:role:assign'),
  validate_user.updateUserRole,
  validationErrorHandler,
  usersController.updateUserRole,
);

users.delete(
  '/:userId',
  authenticate,
  requirePermission('user:delete:any'),
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.deleteUser,
);

users.delete(
  '/:userId/permanent',
  authenticate,
  requirePermission('user:delete:any'),
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.deleteUserPermanently,
);

users.post(
  '/:userId/restore',
  authenticate,
  requirePermission('user:update:any'),
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.restoreUser,
);

users.delete(
  '/clear-all',
  authenticate,
  requirePermission('user:delete:any'),
  usersController.clearAllUsers,
);

export default users;
