/**
 * Shared OpenAPI generator helpers and small schemas.
 */
const errorContent = {
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const okContent = (dataSchema, description) => ({
  description,
  content: {
    'application/json': {
      schema: dataSchema
        ? {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                type: 'object',
                properties: {
                  data: typeof dataSchema === 'string' ? { $ref: dataSchema } : dataSchema,
                },
              },
            ],
          }
        : { $ref: '#/components/schemas/ApiResponse' },
    },
  },
});

const bearer = [{ bearerAuth: [] }];

/** Redirect/callback providers — Telegram uses POST /telegram instead. */
const oauthRedirectProviders = {
  type: 'string',
  enum: ['google', 'github', 'facebook', 'instagram', 'twitter', 'linkedin'],
  description: 'OAuth 2.0 redirect provider (not telegram)',
};

/** Linked-account provider identifiers including Telegram. */
const oauthAccountProviders = {
  type: 'string',
  enum: ['google', 'github', 'facebook', 'instagram', 'twitter', 'linkedin', 'telegram'],
  description: 'Linked OAuth account provider',
};

const totpCodeSchema = {
  type: 'string',
  minLength: 6,
  maxLength: 8,
  description: 'Time-based one-time password from the authenticator app',
};

const mongoObjectId = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  example: '507f1f77bcf86cd799439011',
  description: 'MongoDB ObjectId',
};

module.exports = {
  errorContent,
  okContent,
  bearer,
  oauthRedirectProviders,
  oauthAccountProviders,
  totpCodeSchema,
  mongoObjectId,
};
