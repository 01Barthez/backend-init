/**
 * Blogs paths — /api/v1/blogs
 */
const { okContent, bearer, mongoObjectId } = require('../helpers');

module.exports = {
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
  }
};
