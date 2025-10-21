import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { isActive, isAdmin, isAuthenticated, isVerified } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const users = Router();

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

// Update user info
users.put(
  '/profile',
  isAuthenticated,
  isVerified,
  isActive,
  upload.single('profile'),
  validate_user.updateUserInfo,
  validationErrorHandler,
  users_controller.update_user_info,
);

// Search users
users.get(
  '/search',
  // isAuthenticated,
  validate_user.searchUser,
  validationErrorHandler,
  users_controller.search_user,
);

// List all users
users.get(
  '/',
  // isAuthenticated,
  validate_user.listUsers,
  validationErrorHandler,
  users_controller.list_users,
);

// ============================================
// ADMIN ROUTES - Require Admin privileges
// ============================================

// Export users to CSV
users.get(
  '/export',
  // isAuthenticated,
  // isAdmin,
  users_controller.export_users,
);

// Get One User
users.get(
  '/:user_id',
  // isAuthenticated,
  validate_user.get_user_by_id,
  validationErrorHandler,
  users_controller.get_user_by_id,
);

// Update user role
users.put(
  '/:user_id/role',
  // isAuthenticated,
  // isAdmin,
  validate_user.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

// Delete user (soft delete)
users.delete(
  '/:user_id',
  // isAuthenticated,
  // isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.delete_user,
);

// Delete user (hard delete)
users.delete(
  '/:user_id',
  // isAuthenticated,
  // isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.delete_user_permently,
);

// Restore deleted user,
users.post(
  '/:user_id/restore',
  isAuthenticated,
  isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.restore_deleted_user,
);

// Clear all users (development only)
users.delete(
  '/clear-all',
  // isAuthenticated,
  // isAdmin,
  users_controller.clear_all_users,
);

export default users;
