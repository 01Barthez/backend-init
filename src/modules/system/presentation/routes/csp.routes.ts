import express, { Router } from 'express';

import { createCspController } from '../controllers/csp.controller';

/**
 * CSP report routes — mounted at `CSP_REPORT_URI` (default `/security/csp-violation`).
 */
export function createCspRoutes(): Router {
  const csp = Router();
  const controller = createCspController();

  /** GET / — Accept Content-Security-Policy violation reports. */
  csp.get('/', express.json({ type: 'application/csp-report' }), controller.report);
  return csp;
}
