/**
 * Swagger / OpenAPI UI setup.
 * Spec lives under `docs/api/openapi.yaml` (with a root fallback for migration).
 */
import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { config } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

const resolveSpecPath = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'docs/api/openapi.yaml'),
    path.resolve(process.cwd(), 'docs/openapi.yaml'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
};

/**
 * Mounts Swagger UI and exposes the raw OpenAPI JSON document.
 */
const setupSwagger = (app: Express): void => {
  if (!config.security.swagger.enabled) {
    return;
  }

  const specPath = resolveSpecPath();
  if (!specPath) {
    log.error('OpenAPI spec not found under docs/api/ or docs/');
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

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, uiOptions));

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

export default setupSwagger;
