import { Router } from 'express';

import { createCsrfController } from '../controllers/csrf.controller';

/**
 * CSRF routes — mounted at `/csrf-token` (application root).
 */
export function createCsrfRoutes(): Router {
  const csrf = Router();
  const controller = createCsrfController();

  /** GET / — Issue a CSRF token and set the CSRF cookie. */
  csrf.get('/', controller.sendToken);
  return csrf;
}
