import { body, param } from 'express-validator';

/**
 * OAuth express-validator rules.
 */
export const oauthSchemas = {
  providerParam: [param('provider').notEmpty().withMessage('Provider is required')],
  telegram: [body('hash').notEmpty().withMessage('Telegram hash is required')],
};
