import { body } from 'express-validator';

import { validate } from '@/core/constant/validator.constant';

export const nameValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field.replace('_', ' ')} is required!`)
    .isString()
    .withMessage(`${field.replace('_', ' ')} must be a string!`)
    .isLength({
      min: validate.MIN_NAME,
      max: validate.MAX_NAME,
    })
    .withMessage(
      `${field.replace('_', ' ')} must be between ${validate.MIN_NAME} and ${validate.MAX_NAME} characters`,
    )
    .escape();
};

export const emailValidation = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage('email is required !')
    .isEmail()
    .withMessage('invalid email address !')
    .escape();
};

export const passwordValidation = () => {
  return body('password')
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
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol',
    );
};
