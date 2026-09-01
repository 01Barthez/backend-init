import { type Express, Router } from 'express';

import { envs } from '@/config/env/env';
import CSP from '@/routes/_config/csp/csp.router';
import CSRF from '@/routes/_config/csrf-token/csrf.router';
import health from '@/routes/_config/health-check/health.router';
import auth from '@/routes/users/auth.router';
import oauth from '@/routes/users/oauth.router';
import users from '@/routes/users/users.router';

import { rateLimitingSubRoute } from './securityConfig';

const apiPrefix = envs.API_PREFIX || '/api/v1';

const api = Router();

const setupRoutes = (app: Express): void => {
  app.use(envs.CSP_REPORT_URI, rateLimitingSubRoute, CSP);
  app.use('/csrf-token', rateLimitingSubRoute, CSRF);
  app.use('/health', rateLimitingSubRoute, health);

  api.use('/auth', rateLimitingSubRoute, auth);
  api.use('/auth/oauth', rateLimitingSubRoute, oauth);
  api.use('/users', rateLimitingSubRoute, users);

  app.use(apiPrefix, api);
};

export default setupRoutes;
