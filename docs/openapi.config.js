// docs/openapi.config.js
module.exports = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GTA API Documentation',
      description: `|
        # Documentation de l'API GTA
        
        API complète pour la gestion des utilisateurs et de l'authentification avec support OAuth2.0.
        
        ## Authentification
        
        Cette API utilise les méthodes d'authentification suivantes :
        - JWT (JSON Web Tokens)
        - OAuth2.0 avec plusieurs fournisseurs (Google, GitHub, Facebook, etc.)
        - Authentification par email/mot de passe
        
        ## Sécurité
        
        Toutes les requêtes doivent inclure un token JWT valide dans le header 'Authorization: Bearer <token>',
        sauf pour les endpoints marqués comme publics.
      `,
      version: '1.0.0',
      contact: {
        name: 'Équipe Support API',
        email: 'support@gtamarket.com',
        url: 'https://gtamarket.com/support',
      },
      license: {
        name: 'Propriétaire',
        url: 'https://gtamarket.com/terms',
      },
    },
    externalDocs: {
      description: 'Documentation complète',
      url: 'https://docs.gtamarket.com/api',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Environnement de développement local',
      },
      {
        url: 'https://api.staging.gtamarket.com/api/v1',
        description: 'Environnement de staging',
      },
      {
        url: 'https://api.gtamarket.com/api/v1',
        description: 'Production',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'OAuth',
        description: 'Third-party authentication (Google, GitHub, etc.)',
      },
      {
        name: 'Items',
        description: 'Items management',
      },
      {
        name: 'Blogs',
        description: 'Blog posts management',
      },
      {
        name: 'System',
        description: 'System health and configuration',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtained after authentication',
        },
        OAuth2: {
          type: 'oauth2',
          description: 'OAuth2 authentication',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              scopes: {
                openid: 'OpenID authentication',
                profile: 'Access to profile information',
                email: 'Access to email address',
              },
            },
          },
        },
      },
    },
  },
  apis: [
    // Fichiers de documentation YAML/JSON
    './docs/paths/*.yaml',
    './docs/components/parameters/*.yaml',
    './docs/components/responses/*.yaml',
    './docs/components/schemas/*.yaml',
    // Fichiers source pour l'extraction automatique
    './src/routes/*.ts',
    './src/controllers/**/*.ts',
  ],
};
