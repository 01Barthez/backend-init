/**
 * Files paths — /api/v1/files
 */
const { okContent, bearer } = require('../helpers');

module.exports = {
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
};
