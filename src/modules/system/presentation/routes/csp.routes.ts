import express, { Router } from 'express';

import { createCspController } from '../controllers/csp.controller';

/**
 * CSP report routes — mounted at `CSP_REPORT_URI` (default `/security/csp-violation`).
 * Browsers send `application/csp-report` via POST; GET remains for legacy clients.
 */
export function createCspRoutes(): Router {
  const csp = Router();
  const controller = createCspController();
  const parseReport = express.json({ type: 'application/csp-report' });

  /** POST / — Accept Content-Security-Policy violation reports (browser default). */
  csp.post('/', parseReport, controller.report);

  /** GET / — Legacy clients that POST-body over GET. Prefer POST. */
  csp.get('/', parseReport, controller.report);

  return csp;
}
