import { Router } from 'express';

import usersController from '@/controllers/users/users.controller';
import { isActive, isAdmin, isAuthenticated, isVerified } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const users = Router();

users.put(
  '/profile',
  isAuthenticated,
  isVerified,
  isActive,
  upload.single('profile'),
  validate_user.updateUserInfo,
  validationErrorHandler,
  usersController.updateUser,
);

users.get(
  '/search',
  validate_user.searchUser,
  validationErrorHandler,
  usersController.searchUsers,
);

users.get(
  '/',
  validate_user.listUsers,
  validationErrorHandler,
  usersController.listUsers,
);

users.get('/export', usersController.exportUsers);

users.get(
  '/:userId',
  validate_user.getUserById,
  validationErrorHandler,
  usersController.getUserById,
);

users.put(
  '/:userId/role',
  validate_user.updateUserRole,
  validationErrorHandler,
  usersController.updateUserRole,
);

users.delete(
  '/:userId',
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.deleteUser,
);

users.delete(
  '/:userId/permanent',
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.deleteUserPermanently,
);

users.post(
  '/:userId/restore',
  isAuthenticated,
  isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  usersController.restoreUser,
);

users.delete('/clear-all', usersController.clearAllUsers);

export default users;
