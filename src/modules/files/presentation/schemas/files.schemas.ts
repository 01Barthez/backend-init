import { body, query } from 'express-validator';

export const filesSchemas = {
  presignPut: [
    body('filename').trim().notEmpty().withMessage('filename is required'),
    body('contentType').trim().notEmpty().withMessage('contentType is required'),
    body('size').isInt({ min: 1 }).withMessage('size must be a positive integer'),
  ],
  presignGet: [query('key').trim().notEmpty().withMessage('key is required')],
};
