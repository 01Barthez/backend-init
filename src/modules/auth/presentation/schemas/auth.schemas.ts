/**
 * Auth express-validator rules (presentation layer).
 * Auth-owned — not shared with the users module.
 */
import { body, param } from 'express-validator';

import {
  emailValidation,
  nameValidation,
  passwordFieldValidation,
  passwordValidation,
} from '@/shared/utils/validation-helpers';

const phoneRequired = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Phone number is required')
  .isString()
  .withMessage('Phone number must be a string')
  .isLength({ min: 5, max: 20 })
  .withMessage('Phone number must be between 5 and 20 characters')
  .escape();

export const authSchemas = {
  signup: [
    emailValidation(),
    passwordValidation(),
    nameValidation('firstName'),
    nameValidation('lastName'),
    phoneRequired,
  ],

  login: [emailValidation(), passwordValidation()],

  verifyAccount: [
    emailValidation(),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP code is required')
      .isString()
      .withMessage('OTP must be a string')
      .isLength({ min: 4, max: 8 })
      .withMessage('OTP must be between 4 and 8 characters'),
  ],

  resendOtp: [emailValidation()],

  forgotPassword: [emailValidation()],

  resetPassword: [
    param('resetToken').trim().notEmpty().withMessage('Reset token is required'),
    passwordFieldValidation('new_password'),
  ],

  changePassword: [
    body('current_password').trim().notEmpty().withMessage('Current password is required'),
    passwordFieldValidation('new_password'),
  ],
};
