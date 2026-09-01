import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { envs } from '@/config/env/env';

/**
 * Mounts Swagger UI and exposes the raw OpenAPI JSON document.
 */
const setupSwagger = (app: Express): void => {
  if (!envs.SWAGGER_ENABLED) {
    return;
  }

  const specPath = path.resolve(__dirname, '../../../docs/openapi.yaml');

  if (!fs.existsSync(specPath)) {
    console.error(`OpenAPI spec not found at: ${specPath}`);
    return;
  }

  const swaggerDocument = YAML.load(specPath);

  const uiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Backend Init API',
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, uiOptions));

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

export default setupSwagger;
