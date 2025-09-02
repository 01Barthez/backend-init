import type { Express } from 'express';

import { envs } from '@/config/env/env';
import CSP from '@/router/CSP/csp.router';
import CSRF from '@/router/CSRF-token/csrf.router';
import health from '@/router/healtcheck/health.router';
import items from '@/router/items/items.router';

import { rateLimitingSubRoute } from './securityConfig';

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
};

export default setupRoutes;
