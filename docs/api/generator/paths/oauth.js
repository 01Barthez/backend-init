/**
 * OAuth paths — /api/v1/auth/oauth
 */
const { okContent, bearer, oauthRedirectProviders, oauthAccountProviders } = require('../helpers');

module.exports = {
  '/api/v1/auth/oauth/accounts': {
    get: {
      tags: ['OAuth'],
      summary: 'List linked OAuth accounts',
      description: 'Returns social accounts linked to the authenticated user.',
      security: bearer,
      responses: {
        200: {
          description: 'Linked OAuth accounts',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/OAuthAccount' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/api/v1/auth/oauth/telegram': {
    post: {
      tags: ['OAuth'],
      summary: 'Authenticate with Telegram Login Widget',
      description:
        'Validates Telegram Login Widget payload (`hash` required) and issues JWT credentials.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['hash'],
              properties: {
                id: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                username: { type: 'string' },
                photo_url: { type: 'string' },
                auth_date: { type: 'integer' },
                hash: { type: 'string', description: 'Telegram widget integrity hash' },
              },
            },
          },
        },
      },
      responses: {
        200: okContent(null, 'Telegram login successful'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/api/v1/auth/oauth/{provider}': {
    get: {
      tags: ['OAuth'],
      summary: 'Start OAuth authorization',
      description:
        'Redirects the browser to the selected OAuth provider consent screen. Query `redirectUrl` must match `CLIENT_URL` or `OAUTH_ALLOWED_ORIGINS`. Telegram uses POST /telegram instead of this redirect flow.',
      parameters: [
        {
          name: 'provider',
          in: 'path',
          required: true,
          schema: oauthRedirectProviders,
        },
        {
          name: 'redirectUrl',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'uri' },
          description: 'Post-login SPA URL (allowlisted origin only)',
        },
      ],
      responses: {
        302: { description: 'Redirect to the OAuth provider' },
        400: { $ref: '#/components/responses/BadRequest' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/api/v1/auth/oauth/{provider}/callback': {
    get: {
      tags: ['OAuth'],
      summary: 'OAuth provider callback',
      description:
        'Completes login, sets the refresh cookie, and redirects without putting tokens in the query string. Telegram uses POST /telegram instead.',
      parameters: [
        {
          name: 'provider',
          in: 'path',
          required: true,
          schema: oauthRedirectProviders,
        },
        {
          name: 'code',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Authorization code from the provider',
        },
        {
          name: 'state',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'CSRF/state value from the authorize step',
        },
        {
          name: 'error',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Provider error code when consent is denied',
        },
      ],
      responses: {
        302: { description: 'Redirect to the allowlisted frontend URL (no tokens in the query)' },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/api/v1/auth/oauth/{provider}/unlink': {
    delete: {
      tags: ['OAuth'],
      summary: 'Unlink an OAuth provider',
      description:
        'Removes the linked social account for the given provider from the current user. Includes telegram when linked via the Login Widget.',
      security: bearer,
      parameters: [
        {
          name: 'provider',
          in: 'path',
          required: true,
          schema: oauthAccountProviders,
        },
      ],
      responses: {
        200: okContent(null, 'Provider unlinked'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
