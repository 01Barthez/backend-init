import notFoundHandler from '@middlewares/not-found.middleware';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { envs } from '@/config/env/env';
import disableLogsInProduction from '@/middlewares/disable-log';
import errorHandler from '@/middlewares/error-handler.middleware';
import paginationMiddleware from '@/middlewares/pagination.middleware';
import { errorLog, requestLog } from '@/middlewares/request-logger.middleware';
import { requestTimeMiddleware } from '@/middlewares/response-time.middleware';
import { validationErrorHandler } from '@/middlewares/validation-error-handler.middleware';
import { securityRequestLogger } from '@/services/logging/security-logger';

import setupRoutes from './routes-middleware';
import { cspConfig, morganFormat, morganOptions, rateLimiting } from './security-config';

const initMiddlewares = (app: Express): void => {
  app.use(helmet());
  app.use(
    helmet.hsts({
      maxAge: envs.HSTS_MAX_AGE,
      includeSubDomains: true,
      preload: true,
    }),
  );
  app.use(helmet.contentSecurityPolicy(cspConfig));
  app.use(securityRequestLogger);

  app.use(cookieParser());
  app.use(
    cors({
      origin: envs.CLIENT_URL || 'http://localhost:5173',
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
          maxAge: 86400,
        },
        ignoreMethods: ['HEAD', 'OPTIONS'],
      }),
    );

  app.use(validationErrorHandler);
  setupRoutes(app);

  app.use(errorLog);
  app.use(errorHandler);
  app.use(notFoundHandler);
};

export default initMiddlewares;
