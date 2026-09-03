import type { Express, Router } from 'express';

import metricsRouter from '@/shared/infrastructure/metrics/metrics';

import { setupBullBoard } from './presentation/routes/admin-queues.routes';
import { createAuditRoutes } from './presentation/routes/audit.routes';
import { createCspRoutes } from './presentation/routes/csp.routes';
import { createCsrfRoutes } from './presentation/routes/csrf.routes';
import { createHealthRoutes } from './presentation/routes/health.routes';

export type SystemRouters = {
  health: Router;
  csrf: Router;
  csp: Router;
  metrics: Router;
  audit: Router;
  setupBullBoard: (app: Express) => void;
};

/**
 * Composition root for ops / cross-cutting HTTP surfaces.
 */
export function createSystemRouters(): SystemRouters {
  return {
    health: createHealthRoutes(),
    csrf: createCsrfRoutes(),
    csp: createCspRoutes(),
    metrics: metricsRouter,
    audit: createAuditRoutes(),
    setupBullBoard,
  };
}

export { default, setupBullBoard } from './presentation/routes/admin-queues.routes';
export { createAuditRoutes } from './presentation/routes/audit.routes';
export { createCspRoutes } from './presentation/routes/csp.routes';
export { createCsrfRoutes } from './presentation/routes/csrf.routes';
export { createHealthRoutes } from './presentation/routes/health.routes';
export { default as metricsRouter } from '@/shared/infrastructure/metrics/metrics';
