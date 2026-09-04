import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requirePermission,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';
import { auditRepository } from '@/shared/infrastructure/audit';

import { createAuditController } from '../controllers/audit.controller';
import { auditSchemas } from '../schemas/audit.schemas';

/**
 * Operator audit log — mounted at `/api/v1/admin/audit`.
 * Append-only trail: HTTP is read-only (`audit:read`). Purge is cron/ops only.
 *
 * Route order: `/` → `/export` → `/:auditId` (static paths before param).
 */
export function createAuditRoutes(): Router {
  const audit = Router();
  const controller = createAuditController({ audit: auditRepository });

  /** GET / — Paginated list with filters. */
  audit.get(
    '/',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('audit:read'),
    auditSchemas.list,
    validationErrorHandler,
    controller.list,
  );

  /** GET /export — CSV or JSON dump (max 10_000 rows), same filters as list. */
  audit.get(
    '/export',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('audit:read'),
    auditSchemas.export,
    validationErrorHandler,
    controller.exportEntries,
  );

  /** GET /:auditId — Full entry including metadata + userAgent. */
  audit.get(
    '/:auditId',
    authenticate,
    requireVerified,
    requireActive,
    requirePermission('audit:read'),
    auditSchemas.getById,
    validationErrorHandler,
    controller.getById,
  );

  return audit;
}
