import notFoundHandler from '@middlewares/notFoundRoutes';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { envs } from '@/config/env/env';
import disableLogsInProduction from '@/middlewares/disableLog';
import errorHandler from '@/middlewares/errorHandler';
import { errorLog, requestLog } from '@/middlewares/requestLogger';
import { requestTimeMiddleware } from '@/middlewares/responseTime';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { securityRequestLogger } from '@/services/logging/securityLogger';

import setupRoutes from './routes-middleware';
import { cspConfig, morganFormat, morganOptions, rateLimiting } from './securityConfig';

/**
 * @file _initMiddlewares.ts
 * @description Initializes and configures all core middlewares for the Express application.
 *
 * Initializes and configures all global middlewares for the Express application.
 *
 * This function sets up a comprehensive middleware stack to enhance security, logging,
 * request parsing, CORS, compression, rate limiting, CSRF protection, error handling,
 * and route management. The order of middleware registration is important for correct
 * application behavior and security.
 *
 * Middleware setup includes:
 * - Security headers (Helmet, HSTS, CSP)
 * - Security request logging
 * - Cookie parsing and CORS configuration
 * - Request body parsing (JSON, URL-encoded)
 * - Request and error logging (Morgan, custom loggers)
 * - Request timing and log disabling in production
 * - Disabling 'x-powered-by' header for security
 * - Response compression
 * - Rate limiting
 * - CSRF protection (must be after cookieParser and before routes)
 * - Route setup
 * - Data validation error handling
 * - Centralized error handling
 * - 404 Not Found handler (must be last)
 *
 * @param app - The Express application instance to configure.
 */

const initMiddlewares = (app: Express): void => {
  // 1. Security middlewares: Set HTTP headers for security
  app.use(helmet()); // Basic security headers
  app.use(
    helmet.hsts({
      maxAge: envs.HSTS_MAX_AGE, // HTTP Strict Transport Security
      includeSubDomains: true,
      preload: true,
    }),
  );
  app.use(helmet.contentSecurityPolicy(cspConfig)); // Content Security Policy
  app.use(securityRequestLogger); // Log security-related requests

  // 2. Core middlewares: Cookie parsing and CORS configuration
  app.use(cookieParser()); // Parse cookies from incoming requests
  app.use(
    cors({
      origin: envs.CLIENT_URL || 'http://localhost:5173', // Allow requests from client
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true, // Allow cookies to be sent
    }),
  );

  // 3. Parsing middlewares: Parse request bodies
  app.use(express.json({ limit: '20kb' })); // Parse JSON bodies with size limit
  app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded bodies

  // 4. Logging middlewares: Log requests and measure response time
  app.use(morgan(morganFormat, morganOptions)); // HTTP request logging
  app.use(requestLog); // Custom request logger
  app.use(requestTimeMiddleware); // Track response time
  app.use(disableLogsInProduction); // Disable logs in production environment

  // 5. Additional security and performance middlewares
  app.disable('x-powered-by'); // Hide Express signature
  app.use(compression()); // Enable gzip compression
  app.use(rateLimiting); // Rate limiting to prevent abuse

  // 6. CSRF protection middleware (must be after cookieParser and before routes)
  if (envs.ALLOW_CSRF_PROTECTION)
    app.use(
      csurf({
        cookie: {
          key: envs.CSRF_COOKIE_NAME,
          secure: envs.COOKIE_SECURE as boolean,
          httpOnly: envs.COOKIE_HTTP_STATUS as boolean,
          sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
          domain: envs.COOKIE_DOMAIN as string,
          path: '/',
          maxAge: 86400, // 24 hours
        },
        ignoreMethods: ['HEAD', 'OPTIONS'], // Do not require CSRF token for safe methods
      }),
    );

  // 8. Data validation error handler
  app.use(validationErrorHandler); // Handle validation errors from request data

  // 7. Route configuration middleware
  setupRoutes(app); // Register all application routes

  // 9. Centralized error handling (must be after routes and before not found handler)
  app.use(errorLog); // Log errors
  app.use(errorHandler); // Handle errors and send response

  // 10. 404 Not Found handler (must be the last middleware)
  app.use(notFoundHandler); // Handle unmatched routes
};

export default initMiddlewares;
