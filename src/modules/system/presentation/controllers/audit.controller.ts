import type { Request, Response } from 'express';

import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditExportFormat, AuditPort, AuditQueryFilters } from '@/shared/infrastructure/audit';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

export type AuditControllerDeps = {
  audit: AuditPort;
};

const parseOptionalDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseQueryFilters = (req: Request): AuditQueryFilters => {
  const from = parseOptionalDate(req.query.from);
  const to = parseOptionalDate(req.query.to);

  if (from && to && from.getTime() > to.getTime()) {
    throw AppError.badRequest('`from` must be before or equal to `to`');
  }

  return {
    actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
    action: typeof req.query.action === 'string' ? req.query.action : undefined,
    resource: typeof req.query.resource === 'string' ? req.query.resource : undefined,
    requestId: typeof req.query.requestId === 'string' ? req.query.requestId : undefined,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
};

export function createAuditController(deps: AuditControllerDeps) {
  const list = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.audit.list({
      ...parseQueryFilters(req),
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

  const getById = asyncHandler(async (req: Request, res: Response) => {
    const entry = await deps.audit.getById(req.params.auditId);
    if (!entry) {
      throw AppError.notFound('Audit entry not found');
    }
    return response.ok(req, res, entry, 'Audit entry');
  });

  const exportEntries = asyncHandler(async (req: Request, res: Response) => {
    const formatRaw = typeof req.query.format === 'string' ? req.query.format : 'csv';
    const format: AuditExportFormat = formatRaw === 'json' ? 'json' : 'csv';

    const result = await deps.audit.export({
      ...parseQueryFilters(req),
      format,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
    res.setHeader('X-Export-Count', String(result.count));
    return res.send(result.body);
  });

  return { list, getById, exportEntries };
}

export type AuditController = ReturnType<typeof createAuditController>;
