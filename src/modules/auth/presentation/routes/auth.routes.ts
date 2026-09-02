import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';
import { upload } from '@/modules/files';

import type { AuthController } from '../controllers/auth.controller';
import { authSchemas } from '../schemas/auth.schemas';

/**
 * Auth HTTP routes — path contract mirrors the legacy `auth.router.ts`.
 * Mounted at `/api/v1/auth`.
 */
export function createAuthRoutes(controller: AuthController): Router {
  const auth = Router();

  /** POST /signup — Register a new user (multipart) and send email OTP. */
  auth.post(
    '/signup',
    upload.single('profile'),
    authSchemas.signup,
    validationErrorHandler,
    controller.signup,
  );

  /** POST /verify — Confirm email OTP and issue JWT credentials. */
  auth.post('/verify', authSchemas.verifyAccount, validationErrorHandler, controller.verifyOtp);

  /** POST /resend-otp — Resend the account verification OTP. */
  auth.post('/resend-otp', authSchemas.resendOtp, validationErrorHandler, controller.resendOtp);

  /** POST /login — Authenticate with email/password and issue JWT pair. */
  auth.post('/login', authSchemas.login, validationErrorHandler, controller.login);

  /** POST /refresh — Issue a new access token from refresh cookie or body. */
  auth.post('/refresh', controller.refreshToken);

  /** POST /forgot-password — Email a password-reset token/link. */
  auth.post(
    '/forgot-password',
    authSchemas.forgotPassword,
    validationErrorHandler,
    controller.forgotPassword,
  );

  /** POST /reset-password/:resetToken? — Set a new password using the reset token. */
  auth.post(
    '/reset-password/:resetToken?',
    authSchemas.resetPassword,
    validationErrorHandler,
    controller.resetPassword,
  );

  /** POST /logout — Revoke session and clear refresh cookie (auth required). */
  auth.post('/logout', authenticate, requireVerified, requireActive, controller.logout);

  /** POST /change-password — Change password for the authenticated user. */
  auth.post(
    '/change-password',
    authenticate,
    requireVerified,
    requireActive,
    authSchemas.changePassword,
    validationErrorHandler,
    controller.changePassword,
  );

  return auth;
}
