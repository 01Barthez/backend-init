/**
 * OpenAPI components: schemas, securitySchemes, responses.
 */
const {
  errorContent,
  oauthAccountProviders,
} = require('./helpers');

module.exports = {
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
};
