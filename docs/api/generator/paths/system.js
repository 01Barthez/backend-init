/**
 * System paths — health, CSRF, metrics, CSP, audit, Bull Board
 */
const { okContent, bearer } = require('../helpers');

module.exports = {
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
  }
};
