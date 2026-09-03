import type { Request, Response } from 'express';

import type { AuditPort } from '@/shared/infrastructure/audit';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

export type AuditControllerDeps = {
  audit: AuditPort;
};

export function createAuditController(deps: AuditControllerDeps) {
  const list = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.audit.list({
      actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      resource: typeof req.query.resource === 'string' ? req.query.resource : undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });

    return response.paginated(
      req,
      res,
      result.items,
      result.total,
      result.totalPages,
      result.page,
      'Audit log',
    );
  });

  return { list };
}

export type AuditController = ReturnType<typeof createAuditController>;
