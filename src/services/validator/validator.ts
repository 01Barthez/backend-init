import { body } from 'express-validator';

import { emailValidation, nameValidation, passwordValidation } from './utils/utils';

export const validator = {
  signup: [
    emailValidation('email'),
    passwordValidation(),
    nameValidation('first_name'),
    nameValidation('last_name'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('phone number is required !')
      .isString()
      .withMessage('phone number have to be a string !')
      .isLength({ min: 5 })
      .withMessage('phone number is too short; min: 3 !')
      .isLength({ max: 20 })
      .withMessage('phone number is too long: max: 20')
      .escape(),
  ],
};
