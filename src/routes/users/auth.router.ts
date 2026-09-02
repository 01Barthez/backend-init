import { Router } from 'express';

import usersController from '@/controllers/users/users.controller';
import {
  authenticate,
  requireActive,
  requireVerified,
} from '@/middlewares/authenticate.middleware';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validation-error-handler.middleware';
import { validate_user } from '@/services/validator/validate/users';

const auth = Router();

auth.post(
  '/signup',
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  usersController.signup,
);

auth.post(
  '/verify',
  validate_user.verifyAccount,
  validationErrorHandler,
  usersController.verifyOtp,
);

auth.post(
  '/resend-otp',
  validate_user.resendOtp,
  validationErrorHandler,
  usersController.resendOtp,
);

auth.post('/login', validate_user.login, validationErrorHandler, usersController.login);

auth.post('/refresh', usersController.refreshToken);

auth.post(
  '/forgot-password',
  validate_user.forgotPassword,
  validationErrorHandler,
  usersController.forgotPassword,
);

auth.post(
  '/reset-password/:resetToken?',
  validate_user.resetPassword,
  validationErrorHandler,
  usersController.resetPassword,
);

auth.post('/logout', authenticate, requireVerified, requireActive, usersController.logout);

auth.post(
  '/change-password',
  authenticate,
  requireVerified,
  requireActive,
  validate_user.changePassword,
  validationErrorHandler,
  usersController.changePassword,
);

export default auth;
