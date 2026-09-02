import { Router } from 'express';

import { createHealthController } from '../controllers/health.controller';

/**
 * Health routes — mounted at `/health` (application root).
 */
export function createHealthRoutes(): Router {
  const health = Router();
  const controller = createHealthController();

  /** GET / — Liveness check confirming the API process is responding. */
  health.get('/', controller.health);
  return health;
}
