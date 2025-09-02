import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

/**
 * Sets up Swagger UI and OpenAPI documentation routes for the provided Express application.
 *
 * This function loads the OpenAPI configuration from an absolute path, generates the Swagger documentation,
 * and configures the Swagger UI with custom options. It also exposes the raw OpenAPI JSON at `/api-docs.json`.
 *
 * @param app - The Express application instance to which Swagger documentation routes will be attached.
 *
 * @remarks
 * - The OpenAPI configuration file is expected at `../../../docs/openapi.config.js` relative to this file.
 * - If the configuration file is not found, an error is logged and Swagger is not set up.
 * - The Swagger UI is available at `/api-docs`.
 * - The raw OpenAPI JSON is available at `/api-docs.json`.
 */
const setupSwagger = (app: Express) => {
  // Use absolute path to load the configuration
  const configPath = path.resolve(__dirname, '../../../docs/openapi.config.js');

  if (!fs.existsSync(configPath)) {
    console.error(`OpenAPI config file not found at: ${configPath}`);
    return;
  }

  const swaggerDocument = require('swagger-jsdoc')(require(configPath));

  // Custom Swagger UI options
  const optionsUI = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GTA-API Documentation',
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      docExpansion: 'none',
    },
  };

  // Swagger documentation route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, optionsUI));

  // Generate openapi.json file
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

export default setupSwagger;
