import { Router } from 'express';

import { createHealthController } from '../controllers/health.controller';

/**
 * Health routes — mounted at `/health`.
 * `/` and `/ready` require Mongo + Redis. `/live` is process-only.
 */
export function createHealthRoutes(): Router {
  const health = Router();
  const controller = createHealthController();

  health.get('/', controller.health);
  health.get('/live', controller.live);
  health.get('/ready', controller.ready);
  return health;
}
