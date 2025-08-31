import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import YAML from 'yamljs';
import fs from 'fs';

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
    }
  };

  // Swagger documentation route
  app.use('/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, optionsUI)
  );

  // Generate openapi.json file
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

export default setupSwagger;