import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { isActive, isAdmin, isAuthenticated, isVerified } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validator } from '@/services/validator/validator';

const users = Router();

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

// Sign up
users.post(
  '/auth/signup',
  upload.single('profile'),
  validator.signup,
  validationErrorHandler,
  users_controller.signup,
);

// Verify account with OTP
users.post(
  '/auth/verify',
  validator.verifyAccount,
  validationErrorHandler,
  users_controller.verify_account,
);

// Resend OTP
users.post(
  '/auth/resend-otp',
  validator.resendOtp,
  validationErrorHandler,
  users_controller.resend_otp,
);

// Login
users.post('/auth/login', validator.login, validationErrorHandler, users_controller.login);

// Forgot password
users.post(
  '/auth/forgot-password',
  validator.forgotPassword,
  validationErrorHandler,
  users_controller.forgot_password,
);

// Reset password
users.post(
  '/auth/reset-password/:resetToken',
  validator.resetPassword,
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
  validator.changePassword,
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
  validator.updateUserInfo,
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
  validator.listUsers,
  validationErrorHandler,
  users_controller.list_users,
);

// Search users
users.get(
  '/users/search',
  isAuthenticated,
  isAdmin,
  validator.searchUser,
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
  validator.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

// Delete user (soft delete)
users.delete(
  '/users/:user_id',
  isAuthenticated,
  isAdmin,
  validator.deleteUser,
  validationErrorHandler,
  users_controller.delete_user,
);

// Clear all users (development only)
users.delete('/users/clear-all', isAuthenticated, isAdmin, users_controller.clear_all_users);

export default users;
