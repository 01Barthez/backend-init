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

// Sign up
users.post(
  '/auth/signup',
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  users_controller.signup,
);

// Verify account with OTP
users.post(
  '/auth/verify',
  validate_user.verifyAccount,
  validationErrorHandler,
  users_controller.verify_account,
);

// Resend OTP
users.post(
  '/auth/resend-otp',
  validate_user.resendOtp,
  validationErrorHandler,
  users_controller.resend_otp,
);

// Login
users.post('/auth/login', validate_user.login, validationErrorHandler, users_controller.login);

// Forgot password
users.post(
  '/auth/forgot-password',
  validate_user.forgotPassword,
  validationErrorHandler,
  users_controller.forgot_password,
);

// Reset password
users.post(
  '/auth/reset-password/:resetToken',
  validate_user.resetPassword,
  validationErrorHandler,
  users_controller.reset_password,
);

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================

// Logout
users.post('/auth/logout', isAuthenticated, users_controller.logout);

// Change password
users.post(
  '/auth/change-password',
  isAuthenticated,
  validate_user.changePassword,
  validationErrorHandler,
  users_controller.change_password,
);

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

// ============================================
// ADMIN ROUTES - Require Admin privileges
// ============================================

// List all users
users.get(
  '/users',
  // isAuthenticated,
  // isAdmin,
  validate_user.listUsers,
  validationErrorHandler,
  users_controller.list_users,
);

// Search users
users.get(
  '/users/search',
  isAuthenticated,
  isAdmin,
  validate_user.searchUser,
  validationErrorHandler,
  users_controller.search_user,
);

// Export users to CSV
users.get('/users/export', isAuthenticated, isAdmin, users_controller.export_users);

// Update user role
users.put(
  '/users/:user_id/role',
  isAuthenticated,
  isAdmin,
  validate_user.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

// Delete user (soft delete)
users.delete(
  '/users/:user_id',
  isAuthenticated,
  isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.delete_user,
);

// Clear all users (development only)
users.delete('/users/clear-all', isAuthenticated, isAdmin, users_controller.clear_all_users);

export default users;
