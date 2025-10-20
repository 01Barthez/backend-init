import type { Express } from 'express';

import { envs } from '@/config/env/env';
import CSP from '@/router/_config/CSP/csp.router';
import CSRF from '@/router/_config/CSRF-token/csrf.router';
import health from '@/router/_config/healtcheck/health.router';
import items from '@/router/items/items.router';
import auth from '@/router/users/auth.router';
import users from '@/router/users/users.router';

import { rateLimitingSubRoute } from './securityConfig';

const _api_version = envs.API_PREFIX || '/api/v1';

//? program routes
const setupRoutes = (app: Express): void => {
  // Content Security Policy route
  app.use(envs.CSP_REPORT_URI, rateLimitingSubRoute, CSP);

  // CSRF token route
  app.use('/csrf-token', rateLimitingSubRoute, CSRF);

  // Items routes
  app.use('/items', rateLimitingSubRoute, items);

  // Health check routes
  app.use('/health', rateLimitingSubRoute, health);

  // Users check routes
  app.use('/auth', rateLimitingSubRoute, auth);
  app.use('/users', rateLimitingSubRoute, users);
};

export default setupRoutes;
