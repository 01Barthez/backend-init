import type { Request, Response } from 'express';

import { SecurityLogger } from '@/shared/infrastructure/logging/security-logger';

/**
 * Accepts CSP violation reports from browsers.
 * Always returns 204 — reporting is best-effort and must not break page loads.
 */
export function createCspController() {
  const report = async (req: Request, res: Response): Promise<void> => {
    try {
      const violation = req.body?.['csp-report'] ?? req.body?.cspReport ?? req.body;
      if (violation) {
        SecurityLogger.warning('CSP Violation', {
          violation,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        });
      }
      res.status(204).end();
    } catch (error) {
      // Still acknowledge — browsers retry aggressively on CSP endpoint failures.
      SecurityLogger.error('Failed to process CSP report', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(204).end();
    }
  };

  return { report };
}

export type CspController = ReturnType<typeof createCspController>;
