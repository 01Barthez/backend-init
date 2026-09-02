import { body } from 'express-validator';

import { validate } from '@/shared/constants/validator.constants';

/** Reusable field builders for express-validator chains. */

export const nameValidation = (field: string) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isString()
    .withMessage(`${field} must be a string`)
    .isLength({
      min: validate.MIN_NAME,
      max: validate.MAX_NAME,
    })
    .withMessage(
      `${field} must be between ${validate.MIN_NAME} and ${validate.MAX_NAME} characters`,
    )
    .escape();

export const emailValidation = (field = 'email') =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .escape();

export const passwordFieldValidation = (field: string) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
    );

/** Default login/signup password field (`password`). */
export const passwordValidation = () => passwordFieldValidation('password');
