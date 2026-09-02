/**
 * Central route registry.
 *
 * Each domain module owns its router; this file only mounts them under the
 * versioned API prefix. Adding a module = one line here + container wiring.
 */
import { type Express, Router } from 'express';

import { config } from '@/app/config';
import type { AppContainer } from '@/app/container';
import { rateLimitingSubRoute } from '@/app/middleware/security-config';

/**
 * Mount module routers and system endpoints on the Express application.
 */
export function registerRoutes(app: Express, container: AppContainer): void {
  const apiPrefix = config.app.apiPrefix;
  const api = Router();

  // --- Cross-cutting system surfaces -----------------------------------------
  app.use(config.security.cspReportUri, rateLimitingSubRoute, container.system.csp);
  app.use('/csrf-token', rateLimitingSubRoute, container.system.csrf);
  app.use('/health', rateLimitingSubRoute, container.system.health);
  app.use('/metrics', container.system.metrics);

  // --- Versioned domain API --------------------------------------------------
  api.use('/auth', rateLimitingSubRoute, container.auth.router);
  api.use('/auth/oauth', rateLimitingSubRoute, container.oauth.router);
  api.use('/users', rateLimitingSubRoute, container.users.router);
  api.use('/blogs', rateLimitingSubRoute, container.blog.router);

  app.use(apiPrefix, api);
}

export default registerRoutes;
