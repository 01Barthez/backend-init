/**
 * Swagger / OpenAPI UI setup.
 * Spec lives under `docs/api/openapi.yaml`. Disabled in production by default.
 */
import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { config } from '@/app/config';
import { adminBasicAuth } from '@/app/middleware/admin-basic-auth.middleware';
import log from '@/shared/infrastructure/logging/logger';

const resolveSpecPath = (): string | null => {
  const specPath = path.resolve(process.cwd(), 'docs/api/openapi.yaml');
  return fs.existsSync(specPath) ? specPath : null;
};

/**
 * Mounts Swagger UI and exposes the raw OpenAPI JSON document.
 * Behind Basic auth outside tests — the spec is a map of the attack surface.
 */
const setupSwagger = (app: Express): void => {
  if (!config.security.swagger.enabled) {
    return;
  }

  const specPath = resolveSpecPath();
  if (!specPath) {
    log.error('OpenAPI spec not found under docs/api/openapi.yaml');
    return;
  }

  const swaggerDocument = YAML.load(specPath);

  const uiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: `${config.app.name} API`,
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
    },
  };

  const specGuards = config.app.isTest ? [] : [adminBasicAuth];

  app.use('/api-docs', ...specGuards, swaggerUi.serve, swaggerUi.setup(swaggerDocument, uiOptions));

  app.get('/api-docs.json', ...specGuards, (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

export default setupSwagger;
