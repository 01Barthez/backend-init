/**
 * System paths — health, CSRF, metrics, CSP, audit, Bull Board
 */
const { okContent, bearer, mongoObjectId } = require('../helpers');

/** Shared investigation filters for list + export. */
const auditFilterParams = [
  { name: 'actorId', in: 'query', schema: { type: 'string' }, description: 'Filter by actor user id' },
  { name: 'action', in: 'query', schema: { type: 'string' }, description: 'Exact action key (e.g. user.role.changed)' },
  { name: 'resource', in: 'query', schema: { type: 'string' }, description: 'Resource type (e.g. user, blog)' },
  {
    name: 'requestId',
    in: 'query',
    schema: { type: 'string' },
    description: 'Correlate with `X-Request-Id` from application logs',
  },
  {
    name: 'from',
    in: 'query',
    schema: { type: 'string', format: 'date-time' },
    description: 'Inclusive lower bound on `createdAt` (ISO-8601)',
  },
  {
    name: 'to',
    in: 'query',
    schema: { type: 'string', format: 'date-time' },
    description: 'Inclusive upper bound on `createdAt` (ISO-8601)',
  },
];

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
      description:
        'Append-only security trail. Requires `audit:read`. Paginated (limit ≤ 100). ' +
        'Filter by actor, action, resource, requestId, and date range. ' +
        'List rows omit metadata — use `GET /admin/audit/{auditId}` for full detail.',
      security: bearer,
      parameters: [
        ...auditFilterParams,
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: {
        200: {
          description: 'Paginated audit entries',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AuditLogEntry' },
                  },
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
  '/api/v1/admin/audit/export': {
    get: {
      tags: ['System'],
      summary: 'Export audit log',
      description:
        'Download matching entries as CSV or JSON (max 10_000 rows). Same filters as list. ' +
        'Requires `audit:read`. Response includes `Content-Disposition` and `X-Export-Count`. ' +
        'Not a mutation API — trail remains append-only; retention purge is cron-only.',
      security: bearer,
      parameters: [
        ...auditFilterParams,
        {
          name: 'format',
          in: 'query',
          schema: { type: 'string', enum: ['csv', 'json'], default: 'csv' },
          description: 'Export format (default csv)',
        },
      ],
      responses: {
        200: {
          description: 'Audit export download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AuditLogDetail' },
              },
            },
          },
          headers: {
            'X-Export-Count': {
              description: 'Number of rows in this export (≤ 10_000)',
              schema: { type: 'integer' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1/admin/audit/{auditId}': {
    get: {
      tags: ['System'],
      summary: 'Get audit entry by id',
      description:
        'Full entry including `metadata` and `userAgent`. Requires `audit:read`.',
      security: bearer,
      parameters: [
        {
          name: 'auditId',
          in: 'path',
          required: true,
          schema: mongoObjectId,
          description: 'AuditLog ObjectId',
        },
      ],
      responses: {
        200: okContent('#/components/schemas/AuditLogDetail', 'Audit entry detail'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
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
