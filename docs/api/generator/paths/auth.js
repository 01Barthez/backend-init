/**
 * Authentication paths — /api/v1/auth
 */
const { okContent, bearer, totpCodeSchema } = require('../helpers');

module.exports = {
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
        'Sends a new one-time password when the account exists and is unverified. ' +
        'Enforces OTP_RESEND_COOLDOWN (default 60s) after the previous issue. ' +
        'Unknown / already-verified emails still return 200 (no enumeration).',
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
      description:
        'Refresh-token families for the authenticated user. Requires verified + active account.',
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
};
