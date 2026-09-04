/**
 * OpenAPI 3.0.3 generator for Backend Init.
 *
 * Source of truth for the consolidated spec. Run:
 *   node docs/api/openapi.config.js
 *   npm run generate:openapi
 *
 * Writes:
 *   - docs/api/openapi.yaml
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
                  data:
                    typeof dataSchema === 'string' ? { $ref: dataSchema } : dataSchema,
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

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Backend Init API',
    description: [
      'Production-ready Express + TypeScript modular monolith template.',
      '',
      'Features: RS256 JWT auth (OTP + optional TOTP), OAuth 2.0, RBAC user admin,',
      'file uploads (MinIO / S3), Redis caching, BullMQ jobs, and operator surfaces.',
      '',
      '**Authentication:** send `Authorization: Bearer <access_token>` on protected routes.',
      'Refresh tokens use an HTTP-only cookie; `/auth/refresh` also accepts `refreshToken` in JSON.',
      '',
      '**Base paths:** domain APIs under `/api/v1`. System endpoints (`/health`, `/csrf-token`,',
      '`/metrics`, CSP report URI, Bull Board) are at the application root.',
      '',
      '**Operator UIs:** `/api-docs`, `/api-docs.json`, `/metrics`, and `/admin/queues` require',
      'HTTP Basic (`ADMIN_BASIC_*`, fallback `SWAGGER_*`) outside tests and are not published',
      'through the sample Nginx public surface.',
      '',
      '**Identity vs admin:** `GET /api/v1/auth/me` is the self snapshot (roles + permissions).',
      'User administration lives under `/api/v1/users`.',
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
      description:
        'Signup, OTP, login, refresh, password flows, current user (`/me`), sessions, and optional TOTP',
    },
    {
      name: 'OAuth',
      description:
        'Social login (redirect providers + Telegram widget), account linking and unlinking',
    },
    {
      name: 'Users',
      description:
        'Self-service profile and admin user lifecycle (invite, activate, unlock, export, GDPR delete)',
    },
    {
      name: 'Blogs',
      description: 'Reference blog domain used to validate the modular template',
    },
    {
      name: 'Files',
      description: 'Presigned object-storage URLs for large uploads/downloads',
    },
    {
      name: 'System',
      description: 'Health, CSRF, Prometheus metrics, CSP reports, audit list, and Bull Board',
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
        description: 'HTTP Basic for operator UIs (ADMIN_BASIC_* , fallback SWAGGER_*)',
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
          role: { type: 'string', enum: ['admin', 'user', 'guest', 'super-admin'] },
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
          provider: oauthAccountProviders,
          providerUserId: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          linkedAt: { type: 'string', format: 'date-time' },
        },
      },
      SessionFamily: {
        type: 'object',
        properties: {
          familyId: { type: 'string', description: 'Refresh-token family identifier' },
          createdAt: { type: 'string', format: 'date-time' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          userAgent: { type: 'string', nullable: true },
          ip: { type: 'string', nullable: true },
        },
      },
      TotpEnrollment: {
        type: 'object',
        properties: {
          otpauthUrl: {
            type: 'string',
            description: 'otpauth:// URI for authenticator apps (shown once)',
          },
          secret: {
            type: 'string',
            description: 'Base32 TOTP secret (shown once; store offline if needed)',
          },
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
      Unprocessable: {
        description: 'Semantic error (invalid or expired token)',
        ...errorContent,
      },
      TooManyRequests: {
        description: 'Rate limit or account lockout',
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
        description:
          'Sends a new one-time password when the account exists and is unverified. Response is identical for unknown emails (no enumeration).',
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
          200: okContent(null, 'Accepted (OTP sent when applicable)'),
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
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
                  totpCode: {
                    ...totpCodeSchema,
                    description: 'Required when TOTP is enabled on the account',
                  },
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
          429: { $ref: '#/components/responses/TooManyRequests' },
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
        description:
          'Always returns the same success payload. A single-use opaque token is emailed only when the account exists (no user enumeration).',
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
          200: okContent(null, 'Generic accepted response'),
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        description:
          'Consumes a single-use opaque `resetToken` from the email (JSON body, not the URL) and revokes all sessions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resetToken', 'new_password'],
                properties: {
                  resetToken: { type: 'string' },
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
          422: { $ref: '#/components/responses/Unprocessable' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and revoke session',
        description:
          'Clears the refresh cookie, blacklists the access `jti`, and revokes the refresh family. Account `isActive` is unchanged. Requires a verified user.',
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
    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Current user',
        description:
          'Returns a fresh account snapshot including roles and permissions (not JWT claims alone). Requires a verified account.',
        security: bearer,
        responses: {
          200: okContent('#/components/schemas/User', 'Current user'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/auth/sessions': {
      get: {
        tags: ['Authentication'],
        summary: 'List sessions',
        description: 'Refresh-token families for the authenticated user. Requires verified + active account.',
        security: bearer,
        responses: {
          200: okContent(
            {
              type: 'array',
              items: { $ref: '#/components/schemas/SessionFamily' },
            },
            'Session list',
          ),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/auth/sessions/{familyId}': {
      delete: {
        tags: ['Authentication'],
        summary: 'Revoke a session family',
        description: 'Revokes one device/session family. Requires verified + active account.',
        security: bearer,
        parameters: [
          {
            name: 'familyId',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
            description: 'Refresh-token family id from GET /auth/sessions',
          },
        ],
        responses: {
          200: okContent(null, 'Session revoked'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/auth/totp/enroll': {
      post: {
        tags: ['Authentication'],
        summary: 'Start TOTP enrollment',
        description:
          'Returns an otpauth URL and secret once. TOTP is not enabled until confirm. Requires verified + active account.',
        security: bearer,
        responses: {
          200: okContent('#/components/schemas/TotpEnrollment', 'Enrollment started'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/v1/auth/totp/confirm': {
      post: {
        tags: ['Authentication'],
        summary: 'Confirm TOTP enrollment',
        description: 'Enables TOTP after verifying a code from the authenticator app.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['totpCode'],
                properties: { totpCode: totpCodeSchema },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'TOTP enabled'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/auth/totp/recovery-codes': {
      post: {
        tags: ['Authentication'],
        summary: 'Generate TOTP recovery codes',
        description:
          'Generates 8 one-time recovery codes shown exactly once. Invalidates any previous set. TOTP must already be enabled.',
        security: bearer,
        responses: {
          200: okContent(
            { type: 'object', properties: { codes: { type: 'array', items: { type: 'string' } } } },
            'Recovery codes (shown once — store them securely)',
          ),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/auth/totp/recover': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with TOTP recovery code',
        description:
          'Authenticates with email + password + a one-time recovery code instead of the authenticator app. Single-use: each code is consumed on success. Use when the authenticator device is lost.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'recoveryCode'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  recoveryCode: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 10,
                    description: '10-character hex recovery code from the generated set',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/TokenPair', 'Login successful'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/api/v1/auth/totp/disable': {
      post: {
        tags: ['Authentication'],
        summary: 'Disable TOTP',
        description: 'Turns TOTP off. Requires current password and a valid authenticator code.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['totpCode', 'current_password'],
                properties: {
                  totpCode: totpCodeSchema,
                  current_password: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'TOTP disabled'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
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

    // -------------------------------------------------------------------------
    // Users — /api/v1/users
    // -------------------------------------------------------------------------
    '/api/v1/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Update own profile',
        description:
          'Updates the authenticated user profile. Optional avatar via multipart field `profile`. Own identity with roles remains `GET /api/v1/auth/me`.',
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
    '/api/v1/users/profile/avatar': {
      delete: {
        tags: ['Users'],
        summary: 'Remove own avatar',
        security: bearer,
        responses: {
          200: okContent('#/components/schemas/User', 'Avatar removed'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/me': {
      delete: {
        tags: ['Users'],
        summary: 'Delete own account',
        description: 'Soft-deletes the authenticated account and revokes sessions (GDPR self-service).',
        security: bearer,
        responses: {
          200: okContent(null, 'Account deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/invite': {
      post: {
        tags: ['Users'],
        summary: 'Invite a user',
        description:
          'Creates a verified+active user, assigns a role (`admin`|`user`|`guest`), and emails a set-password link. Requires `user:update:any`.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  role: {
                    type: 'string',
                    enum: ['admin', 'user', 'guest'],
                    default: 'user',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: okContent(null, 'User invited'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Paginated list with optional filters. Requires `user:read:any`. Limit capped at 100.',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'isVerified', in: 'query', schema: { type: 'boolean' } },
          { name: 'isDeleted', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string', minLength: 1, maxLength: 100 } },
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
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
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
        description: 'Paginated free-text search (email, name, phone, ObjectId). Requires `user:read:any`. Limit capped at 50.',
        security: bearer,
        parameters: [
          { name: 'search', in: 'query', required: true, schema: { type: 'string', minLength: 1, maxLength: 100 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/export': {
      get: {
        tags: ['Users'],
        summary: 'Export users',
        description: 'CSV export (max 10_000 rows). Optional filters. Requires `user:export`.',
        security: bearer,
        parameters: [
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'isVerified', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'CSV download',
            content: {
              'text/csv': { schema: { type: 'string', format: 'binary' } },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Admin detail including roles, lastLoginAt, lockedUntil. Requires `user:read:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'User details'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Admin update user profile',
        description: 'Update another user profile (not email/password). Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  clearAvatar: { type: 'boolean' },
                  profile: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: okContent('#/components/schemas/User', 'User updated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft-delete user',
        description: 'Soft-deletes and revokes sessions. Requires `user:delete:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent(null, 'User soft-deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/role': {
      put: {
        tags: ['Users'],
        summary: 'Assign user role',
        description: 'Assigns a system role slug. Requires `user:role:assign`. `super-admin` is not assignable via HTTP.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
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
                    enum: ['admin', 'user', 'guest'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'Role updated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/activate': {
      post: {
        tags: ['Users'],
        summary: 'Activate user',
        description: 'Sets `isActive=true`. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'User activated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/deactivate': {
      post: {
        tags: ['Users'],
        summary: 'Deactivate user',
        description: 'Sets `isActive=false` and revokes all sessions. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'User deactivated'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/verify-email': {
      post: {
        tags: ['Users'],
        summary: 'Mark email verified',
        description: 'Admin marks the account email as verified. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'Email verified'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/unlock': {
      post: {
        tags: ['Users'],
        summary: 'Unlock login lockout',
        description: 'Clears `failedLoginAttempts` / `lockedUntil`. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'User unlocked'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/revoke-sessions': {
      post: {
        tags: ['Users'],
        summary: 'Revoke all sessions',
        description: 'Force-logout every refresh family for the user. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent(null, 'Sessions revoked'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/sessions': {
      get: {
        tags: ['Users'],
        summary: 'List sessions for a user (admin)',
        description:
          'Returns all refresh-token session families for the target user. Requires `user:read:any`. Audited.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent(
            { type: 'array', items: { $ref: '#/components/schemas/SessionFamily' } },
            'User sessions',
          ),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/oauth/{provider}': {
      delete: {
        tags: ['Users'],
        summary: 'Admin: unlink OAuth provider from user',
        description:
          'Forcibly removes a linked OAuth provider from any user account. Requires `user:update:any`. Audited.',
        security: bearer,
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['google', 'github', 'facebook', 'instagram', 'twitter', 'linkedin', 'telegram'],
            },
          },
        ],
        responses: {
          200: okContent(null, 'Provider unlinked'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/permanent': {
      delete: {
        tags: ['Users'],
        summary: 'Permanently delete user',
        description:
          'GDPR hard-delete: anonymize PII, tombstone blogs, drop row when possible. Requires `user:delete:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent(null, 'User permanently deleted'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{userId}/restore': {
      post: {
        tags: ['Users'],
        summary: 'Restore soft-deleted user',
        description:
          'Clears soft-delete flags and reactivates when the account is verified. Requires `user:update:any`.',
        security: bearer,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent('#/components/schemas/User', 'User restored'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Blogs — /api/v1/blogs
    // -------------------------------------------------------------------------
    '/api/v1/blogs/search': {
      get: {
        tags: ['Blogs'],
        summary: 'Search published blogs',
        description: 'Mongo `contains` search over published public posts. Cap 100 results.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 200 },
            description: 'Search text (2–200 characters)',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          200: okContent(null, 'Search hits'),
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/v1/blogs': {
      get: {
        tags: ['Blogs'],
        summary: 'List blog posts',
        description: 'Returns a paginated list of blog posts (public listing). Limit capped at 100.',
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
          'Partial update of an existing blog. All body fields are optional. Requires `blog:update:own` (or elevated permission).',
        security: bearer,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: mongoObjectId,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  title: { type: 'string', minLength: 3, maxLength: 200 },
                  content: { type: 'string', minLength: 10, maxLength: 50000 },
                  excerpt: { type: 'string', maxLength: 500, nullable: true },
                  coverImage: { type: 'string', format: 'uri', nullable: true },
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
        summary: 'Readiness (Mongo + Redis)',
        description: 'Used by Docker HEALTHCHECK. Returns 503 if a dependency is down.',
        responses: {
          200: okContent(null, 'Ready'),
          503: { description: 'Dependency check failed' },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['System'],
        summary: 'Liveness',
        description: 'Process is up. Does not check Mongo or Redis.',
        responses: {
          200: okContent(null, 'Live'),
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['System'],
        summary: 'Readiness alias',
        responses: {
          200: okContent(null, 'Ready'),
          503: { description: 'Dependency check failed' },
        },
      },
    },
    '/csrf-token': {
      get: {
        tags: ['System'],
        summary: 'Issue CSRF token',
        description:
          'Returns a CSRF token in JSON. The httpOnly csurf secret cookie is owned by middleware — this endpoint does not overwrite it.',
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
        description:
          'Exposes default Node.js process metrics in Prometheus text format. Requires HTTP Basic (ADMIN_BASIC_*, fallback SWAGGER_*) except in tests. Not published through public Nginx.',
        security: [{ basicAuth: [] }],
        responses: {
          200: {
            description: 'Prometheus metrics scrape payload',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/security/csp-violation': {
      post: {
        tags: ['System'],
        summary: 'CSP violation report URI',
        description:
          'Receives Content-Security-Policy violation reports from browsers (POST). Mount path defaults to `CSP_REPORT_URI` (`/security/csp-violation`). GET is also accepted for legacy clients.',
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
          204: { description: 'Report accepted (no content)' },
        },
      },
      get: {
        tags: ['System'],
        summary: 'CSP violation report URI (legacy GET)',
        description:
          'Same handler as POST for clients that send reports with GET. Prefer POST.',
        responses: {
          204: { description: 'Report accepted (no content)' },
        },
      },
    },
    '/api/v1/admin/audit': {
      get: {
        tags: ['System'],
        summary: 'List audit log entries',
        description: 'Requires `audit:read`. Paginated; limit capped at 100.',
        security: bearer,
        parameters: [
          { name: 'actorId', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'resource', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: okContent(null, 'Audit entries'),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/files/presign': {
      post: {
        tags: ['Files'],
        summary: 'Create a presigned upload URL',
        description: 'Authenticated. Use for objects larger than the 2MB API multipart cap.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['filename', 'contentType', 'size'],
                properties: {
                  filename: { type: 'string' },
                  contentType: { type: 'string' },
                  size: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: okContent(null, 'Presigned PUT URL'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Files'],
        summary: 'Create a presigned download URL',
        security: bearer,
        parameters: [{ name: 'key', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: okContent(null, 'Presigned GET URL'),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/queues': {
      get: {
        tags: ['System'],
        summary: 'Bull Board queue admin UI',
        description:
          'Serves the Bull Board dashboard for mail, backup, maintenance, and heavy-task queues. Requires HTTP Basic (ADMIN_BASIC_*, fallback SWAGGER_*) plus a JWT for an admin or super-admin user. Not published through public Nginx.',
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

fs.writeFileSync(primaryPath, yamlContent, 'utf8');
console.log(`OpenAPI spec written to ${primaryPath}`);

module.exports = { definition };
