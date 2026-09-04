/**
 * Auth express-validator rules (presentation layer).
 * Auth-owned — not shared with the users module.
 */
import { body } from 'express-validator';

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

  login: [
    emailValidation(),
    passwordValidation(),
    body('totpCode')
      .optional()
      .trim()
      .isString()
      .withMessage('TOTP code must be a string')
      .isLength({ min: 6, max: 8 })
      .withMessage('TOTP code must be 6 to 8 digits'),
  ],

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
    body('resetToken').trim().notEmpty().withMessage('Reset token is required'),
    passwordFieldValidation('new_password'),
  ],

  changePassword: [
    body('current_password').trim().notEmpty().withMessage('Current password is required'),
    passwordFieldValidation('new_password'),
  ],

  totpConfirm: [
    body('totpCode')
      .trim()
      .notEmpty()
      .withMessage('TOTP code is required')
      .isLength({ min: 6, max: 8 })
      .withMessage('TOTP code must be 6 to 8 digits'),
  ],

  totpDisable: [
    body('totpCode')
      .trim()
      .notEmpty()
      .withMessage('TOTP code is required')
      .isLength({ min: 6, max: 8 })
      .withMessage('TOTP code must be 6 to 8 digits'),
    body('current_password').trim().notEmpty().withMessage('Current password is required'),
  ],

  recoverTotp: [
    emailValidation(),
    passwordValidation(),
    body('recoveryCode')
      .trim()
      .notEmpty()
      .withMessage('Recovery code is required')
      .isString()
      .withMessage('Recovery code must be a string')
      .isLength({ min: 10, max: 10 })
      .withMessage('Recovery code must be 10 characters'),
  ],
};
