import type { Prisma } from '@prisma/client';

import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';
import { getLogMeta, getRequestContext } from '@/shared/infrastructure/request-context';

import type {
  AuditDetail,
  AuditEntry,
  AuditExportFilters,
  AuditExportResult,
  AuditListFilters,
  AuditListResult,
  AuditPort,
  AuditQueryFilters,
} from './audit.port';

const EXPORT_MAX_ROWS = 2000;

const csvEscape = (value: unknown): string => {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const toMetadata = (value: unknown): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
};

const buildWhere = (filters: AuditQueryFilters): Prisma.AuditLogWhereInput => {
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from) createdAt.gte = filters.from;
  if (filters.to) createdAt.lte = filters.to;

  return {
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.resource ? { resource: filters.resource } : {}),
    ...(filters.requestId ? { requestId: filters.requestId } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  };
};

/**
 * Mongo-backed audit log via Prisma.
 * Failures on write are logged but never block the calling use case.
 */
export class PrismaAuditRepository implements AuditPort {
  async record(entry: AuditEntry): Promise<void> {
    const ctx = getRequestContext();

    try {
      await prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? ctx?.userId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          ip: ctx?.ip ?? null,
          userAgent: ctx?.userAgent ?? null,
          requestId: ctx?.requestId ?? null,
          metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      log.warn('Failed to write audit log', getLogMeta({ action: entry.action, error: message }));
    }
  }

  async list(filters: AuditListFilters): Promise<AuditListResult> {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action,
        resource: row.resource,
        resourceId: row.resourceId,
        ip: row.ip,
        requestId: row.requestId,
        createdAt: row.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async getById(id: string): Promise<AuditDetail | null> {
    const row = await prisma.auditLog.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      ip: row.ip,
      userAgent: row.userAgent,
      requestId: row.requestId,
      metadata: toMetadata(row.metadata),
      createdAt: row.createdAt,
    };
  }

  async export(filters: AuditExportFilters): Promise<AuditExportResult> {
    const where = buildWhere(filters);
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: EXPORT_MAX_ROWS,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const count = rows.length;

    if (filters.format === 'json') {
      const payload = rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action,
        resource: row.resource,
        resourceId: row.resourceId,
        ip: row.ip,
        userAgent: row.userAgent,
        requestId: row.requestId,
        metadata: toMetadata(row.metadata),
        createdAt: row.createdAt.toISOString(),
      }));

      log.info('Audit log exported', { format: 'json', count });

      return {
        format: 'json',
        body: JSON.stringify(payload),
        count,
        contentType: 'application/json; charset=utf-8',
        filename: `audit-export-${stamp}.json`,
      };
    }

    const header =
      'id,actorId,action,resource,resourceId,ip,userAgent,requestId,metadata,createdAt\n';
    const csvRows = rows
      .map((row) =>
        [
          csvEscape(row.id),
          csvEscape(row.actorId),
          csvEscape(row.action),
          csvEscape(row.resource),
          csvEscape(row.resourceId),
          csvEscape(row.ip),
          csvEscape(row.userAgent),
          csvEscape(row.requestId),
          csvEscape(row.metadata == null ? '' : JSON.stringify(row.metadata)),
          csvEscape(row.createdAt.toISOString()),
        ].join(','),
      )
      .join('\n');

    log.info('Audit log exported', { format: 'csv', count });

    return {
      format: 'csv',
      body: header + csvRows,
      count,
      contentType: 'text/csv; charset=utf-8',
      filename: `audit-export-${stamp}.csv`,
    };
  }

  async purgeOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - Math.max(1, days) * 86_400_000);
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    log.info('Audit logs purged', { count: result.count, cutoff: cutoff.toISOString() });
    return result.count;
  }
}

export const auditRepository = new PrismaAuditRepository();

export default auditRepository;
