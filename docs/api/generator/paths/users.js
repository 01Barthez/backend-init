/**
 * Users paths — /api/v1/users
 */
const { okContent, bearer } = require('../helpers');

module.exports = {
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
      description:
        'Soft-deletes the authenticated account and revokes sessions (GDPR self-service).',
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
      description:
        'Paginated list with optional filters. Requires `user:read:any`. Limit capped at 100.',
      security: bearer,
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
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
      description:
        'Paginated free-text search (email, name, phone, ObjectId). Requires `user:read:any`. Limit capped at 50.',
      security: bearer,
      parameters: [
        {
          name: 'search',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 1, maxLength: 100 },
        },
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
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
      description:
        'Admin detail including roles, lastLoginAt, lockedUntil. Requires `user:read:any`.',
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
      description:
        'Assigns a system role slug. Requires `user:role:assign`. `super-admin` is not assignable via HTTP.',
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
};
