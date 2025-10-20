import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
// import { isActive, isAdmin, isAuthenticated, isVerified } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const auth = Router();

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

// Sign up
auth.post(
  '/signup',
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  users_controller.signup,
);

// Verify account with OTP
auth.post(
  '/verify',
  validate_user.verifyAccount,
  validationErrorHandler,
  users_controller.verify_otp,
);

// Resend OTP
auth.post(
  '/resend-otp',
  validate_user.resendOtp,
  validationErrorHandler,
  users_controller.resend_otp,
);

// Login
auth.post('/login', validate_user.login, validationErrorHandler, users_controller.login);

// Forgot password
auth.post(
  '/forgot-password',
  validate_user.forgotPassword,
  validationErrorHandler,
  users_controller.forgot_password,
);

// Reset password
auth.post(
  '/reset-password/:resetToken',
  validate_user.resetPassword,
  validationErrorHandler,
  users_controller.reset_password,
);

// ============================================
// OAUTH2.0 ROUTES - Social Authentication
// ============================================

// Initiate OAuth flow (redirects to provider)
// Supported providers: google, github, facebook, instagram, twitter, linkedin
auth.get('/oauth/:provider', users_controller.oauth_authorize);

// OAuth callback (provider redirects here after authorization)
auth.get('/oauth/:provider/callback', users_controller.oauth_callback);

// Telegram authentication (widget-based)
auth.post('/oauth/telegram', users_controller.telegram_auth);

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================

// Logout
auth.post(
  '/logout',
  // isAuthenticated,
  users_controller.logout,
);

// Change password
auth.post(
  '/change-password',
  // isAuthenticated,
  validate_user.changePassword,
  validationErrorHandler,
  users_controller.change_password,
);

// ============================================
// OAUTH2.0 PROTECTED ROUTES
// ============================================

// Get user's linked OAuth accounts
auth.get(
  '/oauth/accounts',
  // isAuthenticated,
  users_controller.oauth_accounts,
);

// Unlink OAuth provider from account
auth.delete(
  '/oauth/:provider/unlink',
  // isAuthenticated,
  users_controller.oauth_unlink,
);

export default auth;
