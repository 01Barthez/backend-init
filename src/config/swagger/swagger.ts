import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { envs } from '../env/env';

const setupSwagger = (app: Express) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'GTA IT API Documentation',
        version: '1.0.0',
        description: 'Documentation complète de l\'API',
        contact: {
          name: "Barthez Kenwou",
          email: "kenwoubarthez@gmail.com",
          phone: "+237 655 646 688",
          address: {
            street: "",
            city: "Yaounde",
            state: "Centre",
            country: "Cameroun"
          }
        }
      },
      servers: [
        {
          url: `https://localhost:${envs.PORT}`,
          description: 'Serveur de développement',
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    // Chemins vers les fichiers contenant la documentation
    apis: [
      './src/routes/*.ts',
      './src/docs/**/*.yaml',
      './src/docs/**/*.ts',
    ],
  };

  const specs = swaggerJsdoc(options);

  // Options personnalisées pour Swagger UI
  const optionsUI = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GTA-API Documentation',
    // swaggerOptions: {
    //   defaultModelsExpandDepth: -1,
    //   docExpansion: 'none',
    // }
  };

  // Route pour la documentation Swagger
  app.use('/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, optionsUI)
  );

  // Génère le fichier openapi.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default setupSwagger;