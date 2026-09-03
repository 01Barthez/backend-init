import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { auditRepository } from '@/shared/infrastructure/audit';

import { createAuditController } from '../controllers/audit.controller';

/**
 * Operator audit log — mounted at `/api/v1/admin/audit`.
 * Requires `audit:read`.
 */
export function createAuditRoutes(): Router {
  const audit = Router();
  const controller = createAuditController({ audit: auditRepository });

  audit.get(
    '/',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('audit:read'),
    controller.list,
  );

  return audit;
}
