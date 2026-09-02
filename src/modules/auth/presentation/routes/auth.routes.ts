import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { rateLimitingAuth } from '@/app/middleware/security-config';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';
import { upload } from '@/modules/files';

import type { AuthController } from '../controllers/auth.controller';
import { authSchemas } from '../schemas/auth.schemas';

/**
 * Auth HTTP routes — mounted at `/api/v1/auth`.
 * Credential endpoints use a stricter rate-limit bucket.
 */
export function createAuthRoutes(controller: AuthController): Router {
  const auth = Router();

  /** POST /signup — Register a new user (multipart) and send email OTP. */
  auth.post(
    '/signup',
    rateLimitingAuth,
    upload.single('profile'),
    authSchemas.signup,
    validationErrorHandler,
    controller.signup,
  );

  /** POST /verify — Confirm email OTP. */
  auth.post(
    '/verify',
    rateLimitingAuth,
    authSchemas.verifyAccount,
    validationErrorHandler,
    controller.verifyOtp,
  );

  /** POST /resend-otp — Resend the account verification OTP. */
  auth.post(
    '/resend-otp',
    rateLimitingAuth,
    authSchemas.resendOtp,
    validationErrorHandler,
    controller.resendOtp,
  );

  /** POST /login — Authenticate with email/password and issue JWT pair. */
  auth.post('/login', rateLimitingAuth, authSchemas.login, validationErrorHandler, controller.login);

  /** POST /refresh — Issue a new access token from refresh cookie or body. */
  auth.post('/refresh', controller.refreshToken);

  /** POST /forgot-password — Email a password-reset token/link. */
  auth.post(
    '/forgot-password',
    rateLimitingAuth,
    authSchemas.forgotPassword,
    validationErrorHandler,
    controller.forgotPassword,
  );

  /** POST /reset-password — Set a new password using the opaque reset token (body). */
  auth.post(
    '/reset-password',
    rateLimitingAuth,
    authSchemas.resetPassword,
    validationErrorHandler,
    controller.resetPassword,
  );

  /** POST /logout — Revoke current access + refresh family. Account stays active. */
  auth.post('/logout', authenticate, requireVerified, controller.logout);

  /** POST /change-password — Change password and revoke all sessions. */
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
