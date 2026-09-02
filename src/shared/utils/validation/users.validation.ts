import { body, param, query } from 'express-validator';

import {
  emailValidation,
  nameValidation,
  passwordValidation,
} from '@/shared/utils/validation-helpers';

export const validate_user = {
  signup: [
    emailValidation('email'),
    passwordValidation(),
    nameValidation('firstName'),
    nameValidation('lastName'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('phone number is required !')
      .isString()
      .withMessage('phone number have to be a string !')
      .isLength({ min: 5 })
      .withMessage('phone number is too short; min: 5 !')
      .isLength({ max: 20 })
      .withMessage('phone number is too long: max: 20')
      .escape(),
  ],

  login: [emailValidation('email'), passwordValidation()],

  verifyAccount: [
    emailValidation('email'),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP code is required')
      .isString()
      .withMessage('OTP must be a string')
      .isLength({ min: 4, max: 8 })
      .withMessage('OTP must be between 4 and 8 characters'),
  ],

  resendOtp: [emailValidation('email')],

  forgotPassword: [emailValidation('email')],

  resetPassword: [
    param('resetToken').notEmpty().withMessage('Reset token is required'),
    body('new_password')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol',
      ),
  ],

  changePassword: [
    body('current_password').trim().notEmpty().withMessage('Current password is required'),
    body('new_password')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol',
      ),
  ],

  updateUserInfo: [
    nameValidation('firstName').optional(),
    nameValidation('lastName').optional(),
    body('phone')
      .optional()
      .trim()
      .isString()
      .withMessage('phone number must be a string')
      .isLength({ min: 5, max: 20 })
      .withMessage('phone number must be between 5 and 20 characters')
      .escape(),
  ],

  updateUserRole: [
    param('userId').notEmpty().withMessage('User ID is required'),
    body('role')
      .trim()
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['USER', 'ADMIN', 'MODERATOR'])
      .withMessage('Invalid role. Must be USER, ADMIN, or MODERATOR'),
  ],

  deleteUser: [param('userId').notEmpty().withMessage('User ID is required')],

  searchUser: [
    query('search')
      .optional()
      .trim()
      .isString()
      .withMessage('Search query must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
  ],

  listUsers: [
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
    query('isDeleted').optional().isBoolean().withMessage('isDeleted must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],

  getUserById: [param('userId').notEmpty().withMessage('User ID is required')],
};
