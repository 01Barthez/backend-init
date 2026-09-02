/**
 * OpenAPI 3.0.3 generator for Backend Init.
 *
 * Source of truth for the consolidated spec. Run:
 *   node docs/api/openapi.config.js
 *   npm run generate:openapi
 *
 * Writes:
 *   - docs/api/openapi.yaml
 *   - docs/openapi.yaml (legacy fallback for Swagger UI)
 *
 * Keep in sync with module routers under src/modules/.../presentation/routes
 * and the mount table in src/app/routes/index.ts.
 */
const path = require('path');
const fs = require('fs');
const yaml = require('yamljs');

const errorContent = {
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const okContent = (schemaRef, description) => ({
  description,
  content: {
    'application/json': {
      schema: schemaRef
        ? {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                type: 'object',
                properties: {
                  data: { $ref: schemaRef },
                },
              },
            ],
          }
        : { $ref: '#/components/schemas/ApiResponse' },
    },
  },
});

const bearer = [{ bearerAuth: [] }];

const oauthProviders = {
  type: 'string',
  enum: ['google', 'github', 'facebook', 'instagram', 'twitter', 'linkedin', 'telegram'],
  description: 'OAuth provider identifier',
};

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Backend Init API',
    description: [
      'Production-ready Express + TypeScript backend template.',
      '',
      'Features: JWT authentication (RS256), OAuth 2.0, email OTP verification,',
      'user management, file uploads (MinIO), Redis caching, and scheduled jobs.',
      '',
      '**Authentication:** send `Authorization: Bearer <access_token>` on protected routes.',
      'Refresh tokens are typically stored in an HTTP-only cookie; `/auth/refresh` also accepts `refreshToken` in the JSON body.',
      '',
      '**Base paths:** domain APIs live under `/api/v1`. System endpoints (`/health`, `/csrf-token`, `/metrics`, CSP report URI, Bull Board) are mounted at the application root.',
    ].join('\n'),
    version: '1.0.0',
    contact: {
      name: 'Barthez Kenwou',
      email: 'kenwoubarthez@gmail.com',
      url: 'https://github.com/barthez-kenwou/backend-init',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Signup, login, OTP verification, token refresh, and password management',
    },
    {
      name: 'OAuth',
      description: 'Social login providers, Telegram auth, account linking and unlinking',
    },
    {
      name: 'Users',
      description: 'Profile updates and administrative user management',
    },
    {
      name: 'Blogs',
      description: 'Reference blog domain used to validate the modular template',
    },
    {
      name: 'System',
      description: 'Health, CSRF, Prometheus metrics, CSP reports, and Bull Board admin UI',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token issued by login, verify, refresh, or OAuth flows',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'HTTP Basic credentials for Bull Board (SWAGGER_USER / SWAGGER_PASSWORD)',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          isVerified: { type: 'boolean' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'MODERATOR'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Blog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          excerpt: { type: 'string', nullable: true },
          content: { type: 'string' },
          coverImage: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'],
          },
          visibility: {
            type: 'string',
            enum: ['PUBLIC', 'PRIVATE', 'MEMBERS_ONLY'],
          },
          authorId: { type: 'string' },
          views: { type: 'integer' },
          likes: { type: 'integer' },
          shares: { type: 'integer' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: {
            type: 'string',
            description: 'May also be set as an HTTP-only cookie',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object', nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 },
        },
      },
      OAuthAccount: {
        type: 'object',
        properties: {
          provider: oauthProviders,
          providerUserId: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          linkedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Validation failed or malformed request',
        ...errorContent,
      },
      Unauthorized: {
        description: 'Missing or invalid authentication',
        ...errorContent,
      },
      Forbidden: {
        description: 'Authenticated but lacking required permission or role',
        ...errorContent,
      },
      NotFound: {
        description: 'Resource not found',
        ...errorContent,
      },
      Conflict: {
        description: 'Conflict with existing resource state',
        ...errorContent,
      },
      ServerError: {
        description: 'Unexpected server error',
        ...errorContent,
      },
    },
  },
  paths: {
    // -------------------------------------------------------------------------
    // Authentication — /api/v1/auth
    // -------------------------------------------------------------------------
    '/api/v1/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description:
          'Creates a user account and sends an email OTP for verification. Optional profile image via multipart field `profile`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'phone'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    description: 'Must include uppercase, lowercase, number, and symbol',
                  },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string', minLength: 5, maxLength: 20 },
                  profile: {
                    type: 'string',
                    format: 'binary',
                    description: 'Optional avatar image',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: okContent('#/components/schemas/User', 'User created; OTP sent to email'),
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/verify': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify account with OTP',
        description: 'Confirms the email OTP and returns an authenticated session (JWT pair).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', minLength: 4, maxLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/TokenPair', 'Account verified; tokens issued'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/resend-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend verification OTP',
        description: 'Sends a new one-time password to the given email address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'OTP resent successfully'),
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description:
          'Authenticates credentials and issues a JWT access token plus refresh cookie/token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/TokenPair', 'Login successful'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description:
          'Issues a new access token using the refresh token from the HTTP-only cookie or JSON body field `refreshToken`.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: {
                    type: 'string',
                    description: 'Optional when the refresh cookie is present',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/TokenPair', 'Token refreshed'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset',
        description: 'Sends a password-reset link/token to the user email when the account exists.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'Reset instructions sent when the account exists'),
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/reset-password/{resetToken}': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        description:
          'Sets a new password using the reset token from the email link. The Express route also accepts an optional path segment (`/reset-password/:resetToken?`).',
        parameters: [
          {
            name: 'resetToken',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Password reset token from the email link',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['new_password'],
                properties: {
                  new_password: {
                    type: 'string',
                    minLength: 8,
                    description: 'Must include uppercase, lowercase, number, and symbol',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'Password reset successful'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and revoke session',
        description:
          'Clears the refresh cookie and revokes the current session. Requires a verified, active user.',
        security: bearer,
        responses: {
          200: okContent(null, 'Logged out'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change password (authenticated)',
        description: 'Updates the password for the current verified, active user.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password: {
                    type: 'string',
                    minLength: 8,
                    description: 'Must include uppercase, lowercase, number, and symbol',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'Password changed'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // -------------------------------------------------------------------------
    // OAuth — /api/v1/auth/oauth
    // -------------------------------------------------------------------------
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
        description: 'Redirects the browser to the selected OAuth provider consent screen.',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: oauthProviders,
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
          'Handles the provider redirect, exchanges the authorization code, and completes login or account linking.',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: oauthProviders,
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
          302: { description: 'Redirect to the frontend success or error URL' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/oauth/{provider}/unlink': {
      delete: {
        tags: ['OAuth'],
        summary: 'Unlink an OAuth provider',
        description:
          'Removes the linked social account for the given provider from the current user.',
        security: bearer,
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: oauthProviders,
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

    // -------------------------------------------------------------------------
    // Users — /api/v1/users
    // -------------------------------------------------------------------------
    '/api/v1/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Update own profile',
        description:
          'Updates the authenticated user profile. Optional avatar via multipart field `profile`.',
        security: bearer,
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string', minLength: 5, maxLength: 20 },
                  profile: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/User', 'Profile updated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Returns a paginated user list. Requires `user:read:any`.',
        security: bearer,
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'isActive',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'isVerified',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'isDeleted',
            in: 'query',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          200: {
            description: 'Paginated user list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
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
    '/api/v1/users/search': {
      get: {
        tags: ['Users'],
        summary: 'Search users',
        description: 'Searches users by name or email. Requires `user:read:any`.',
        security: bearer,
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 100 },
            description: 'Search term',
          },
        ],
        responses: {
          200: {
            description: 'Matching users',
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
                          items: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/export': {
      get: {
        tags: ['Users'],
        summary: 'Export users',
        description: 'Exports users (typically CSV/file download). Requires `user:export`.',
        security: bearer,
        responses: {
          200: {
            description: 'Export payload or file download',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
              'text/csv': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/clear-all': {
      delete: {
        tags: ['Users'],
        summary: 'Clear all users',
        description:
          'Destructive admin operation that clears user records. Requires `user:delete:any`. Registered before `/:userId` so the path is not captured as an id.',
        security: bearer,
        responses: {
          200: okContent(null, 'Users cleared'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Returns a single user. Requires `user:read:any`.',
        security: bearer,
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent('#/components/schemas/User', 'User details'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft-delete user',
        description: 'Soft-deletes the user. Requires `user:delete:any`.',
        security: bearer,
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent(null, 'User soft-deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/{userId}/role': {
      put: {
        tags: ['Users'],
        summary: 'Assign user role',
        description: 'Updates the role for a user. Requires `user:role:assign`.',
        security: bearer,
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['USER', 'ADMIN', 'MODERATOR'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/User', 'Role updated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/{userId}/permanent': {
      delete: {
        tags: ['Users'],
        summary: 'Permanently delete user',
        description: 'Hard-deletes the user record. Requires `user:delete:any`.',
        security: bearer,
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent(null, 'User permanently deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/users/{userId}/restore': {
      post: {
        tags: ['Users'],
        summary: 'Restore soft-deleted user',
        description: 'Restores a previously soft-deleted user. Requires `user:update:any`.',
        security: bearer,
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent('#/components/schemas/User', 'User restored'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Blogs — /api/v1/blogs
    // -------------------------------------------------------------------------
    '/api/v1/blogs': {
      get: {
        tags: ['Blogs'],
        summary: 'List blog posts',
        description: 'Returns a paginated list of blog posts (public listing).',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Paginated blog list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Blog' },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        tags: ['Blogs'],
        summary: 'Create blog post',
        description: 'Creates a blog post. Requires authentication and `blog:create`.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  excerpt: { type: 'string' },
                  coverImage: { type: 'string' },
                  visibility: {
                    type: 'string',
                    enum: ['PUBLIC', 'PRIVATE', 'MEMBERS_ONLY'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: okContent('#/components/schemas/Blog', 'Blog created'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/blogs/{slug}': {
      get: {
        tags: ['Blogs'],
        summary: 'Get blog by slug',
        description: 'Returns a single blog post identified by its URL slug.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'getting-started-with-nodejs',
          },
        ],
        responses: {
          200: okContent('#/components/schemas/Blog', 'Blog details'),
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/blogs/{id}': {
      put: {
        tags: ['Blogs'],
        summary: 'Update blog post',
        description:
          'Updates an existing blog. Requires `blog:update:own` (or elevated permission).',
        security: bearer,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  excerpt: { type: 'string' },
                  coverImage: { type: 'string' },
                  visibility: {
                    type: 'string',
                    enum: ['PUBLIC', 'PRIVATE', 'MEMBERS_ONLY'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/Blog', 'Blog updated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      delete: {
        tags: ['Blogs'],
        summary: 'Delete blog post',
        description: 'Deletes a blog post. Requires `blog:delete:own`.',
        security: bearer,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent(null, 'Blog deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/blogs/{id}/publish': {
      patch: {
        tags: ['Blogs'],
        summary: 'Publish blog post',
        description: 'Transitions a blog to published status. Requires `blog:publish`.',
        security: bearer,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: okContent('#/components/schemas/Blog', 'Blog published'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // -------------------------------------------------------------------------
    // System — application root (not under /api/v1)
    // -------------------------------------------------------------------------
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Liveness endpoint confirming the API process is responding.',
        responses: {
          200: okContent(null, 'Service is healthy'),
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/csrf-token': {
      get: {
        tags: ['System'],
        summary: 'Issue CSRF token',
        description:
          'Returns a CSRF token and sets the CSRF cookie used by mutating requests when CSRF protection is enabled.',
        responses: {
          200: {
            description: 'CSRF token issued',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            csrfToken: { type: 'string' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['System'],
        summary: 'Prometheus metrics',
        description: 'Exposes default Node.js process metrics in Prometheus text format.',
        responses: {
          200: {
            description: 'Prometheus metrics scrape payload',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/security/csp-violation': {
      get: {
        tags: ['System'],
        summary: 'CSP violation report URI',
        description:
          'Receives Content-Security-Policy violation reports. Mount path defaults to `CSP_REPORT_URI` (`/security/csp-violation`). The Express route currently registers GET.',
        requestBody: {
          required: false,
          content: {
            'application/csp-report': {
              schema: {
                type: 'object',
                properties: {
                  'csp-report': {
                    type: 'object',
                    properties: {
                      'document-uri': { type: 'string' },
                      referrer: { type: 'string' },
                      'blocked-uri': { type: 'string' },
                      'violated-directive': { type: 'string' },
                      'original-policy': { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Report accepted' },
          204: { description: 'Report accepted (no content)' },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/admin/queues': {
      get: {
        tags: ['System'],
        summary: 'Bull Board queue admin UI',
        description:
          'Serves the Bull Board dashboard for mail, backup, maintenance, and heavy-task queues. Requires HTTP Basic (`SWAGGER_USER` / `SWAGGER_PASSWORD`) plus a JWT for an admin user.',
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Bull Board HTML UI' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

const yamlContent = yaml.stringify(definition, 10, 2);
const primaryPath = path.join(__dirname, 'openapi.yaml');
const legacyPath = path.join(__dirname, '..', 'openapi.yaml');

fs.writeFileSync(primaryPath, yamlContent, 'utf8');
fs.writeFileSync(legacyPath, yamlContent, 'utf8');
console.log(`OpenAPI spec written to ${primaryPath}`);
console.log(`OpenAPI spec copied to ${legacyPath}`);

module.exports = { definition };
