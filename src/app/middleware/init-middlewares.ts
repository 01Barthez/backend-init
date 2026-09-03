/**
 * Global Express middleware pipeline.
 *
 * Order: Helmet → request context → maintenance → parsers → log →
 * rate limits → CSRF → routes → error handlers.
 */
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';

import { config } from '@/app/config';
import errorHandler from '@/app/middleware/error.middleware';
import httpLogMiddleware from '@/app/middleware/http-log.middleware';
import maintenanceMiddleware from '@/app/middleware/maintenance.middleware';
import notFoundHandler from '@/app/middleware/not-found.middleware';
import requestContextMiddleware from '@/app/middleware/request-context.middleware';
import { cspConfig, rateLimiting } from '@/app/middleware/security-config';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void => {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (config.app.corsOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS origin not allowed: ${origin}`));
};

/**
 * Apply cross-cutting middleware, then invoke `registerRoutes` before error handlers.
 */
export const initMiddlewares = (app: Express, registerRoutes: () => void): void => {
  app.set('trust proxy', config.app.trustProxyHops);

  app.use(
    helmet({
      contentSecurityPolicy: cspConfig,
      hsts: {
        maxAge: config.security.hstsMaxAge,
        includeSubDomains: true,
        preload: config.security.hstsPreload,
      },
    }),
  );

  app.use(requestContextMiddleware);
  app.use(maintenanceMiddleware);

  app.use(cookieParser());
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(httpLogMiddleware);

  app.disable('x-powered-by');
  app.use(compression());
  app.use(rateLimiting);

  if (config.security.csrf.enabled) {
    app.use(
      csurf({
        cookie: {
          key: config.security.csrf.cookieName,
          secure: config.security.cookie.secure,
          httpOnly: true,
          sameSite: config.security.cookie.sameSite,
          ...(config.security.cookie.domain ? { domain: config.security.cookie.domain } : {}),
          path: '/',
          maxAge: config.security.csrf.expiresInMs,
        },
        // GET must stay ignored: /csrf-token and OAuth callbacks are GET.
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
      }),
    );
  }

  app.use(validationErrorHandler);

  registerRoutes();

  app.use(errorHandler);
  app.use(notFoundHandler);
};

export default initMiddlewares;
