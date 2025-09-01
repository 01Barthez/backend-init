// docs/openapi.config.js
module.exports = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AGTA IT API Documentation',
      description: `|
        API complète pour la gestion des items avec authentification, validation des données
        et pagination. Cette documentation décrit tous les endpoints disponibles pour interagir
        avec les ressources d'items.
      `,
      version: '1.0.0',
      contact: {
        name: 'Support API',
        email: 'support@example.com',
        phone: '+237 655 646 688',
        address: {
          street: '',
          city: 'Yaounde',
          state: 'Centre',
          country: 'Cameroun',
        },
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement local',
      },
      {
        url: 'https://api.example.com',
        description: 'Serveur de production',
      },
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
  apis: [
    './src/routes/*.ts',
    './src/controllers/**/*.ts',
    './docs/paths/**/*.yaml',
    './docs/components/*.yaml',
    './docs/schemas/*.yaml',
  ],
};
