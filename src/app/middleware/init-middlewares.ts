/**
 * Global Express middleware pipeline.
 *
 * Order matters: security headers → parsers → logging → rate limits → CSRF →
 * routes (injected) → error handlers.
 */
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from '@/app/config';
import disableLogsInProduction from '@/app/middleware/disable-log.middleware';
import errorHandler from '@/app/middleware/error.middleware';
import notFoundHandler from '@/app/middleware/not-found.middleware';
import paginationMiddleware from '@/app/middleware/pagination.middleware';
import { errorLog, requestLog } from '@/app/middleware/request-logger.middleware';
import { requestTimeMiddleware } from '@/app/middleware/response-time.middleware';
import {
  cspConfig,
  morganFormat,
  morganOptions,
  rateLimiting,
} from '@/app/middleware/security-config';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';
import { securityRequestLogger } from '@/shared/infrastructure/logging/security-logger';

/**
 * Apply cross-cutting middleware, then invoke `registerRoutes` before error handlers.
 */
export const initMiddlewares = (app: Express, registerRoutes: () => void): void => {
  app.use(helmet());
  app.use(
    helmet.hsts({
      maxAge: config.security.hstsMaxAge,
      includeSubDomains: true,
      preload: true,
    }),
  );
  app.use(helmet.contentSecurityPolicy(cspConfig));
  app.use(securityRequestLogger);

  app.use(cookieParser());
  app.use(
    cors({
      origin: config.app.clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(paginationMiddleware);

  app.use(morgan(morganFormat, morganOptions));
  app.use(requestLog);
  app.use(requestTimeMiddleware);
  app.use(disableLogsInProduction);

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

  // Module routes are registered here — before error / 404 handlers.
  registerRoutes();

  app.use(errorLog);
  app.use(errorHandler);
  app.use(notFoundHandler);
};

export default initMiddlewares;
