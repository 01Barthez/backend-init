import type { Prisma } from '@prisma/client';

import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';
import { getLogMeta, getRequestContext } from '@/shared/infrastructure/request-context';

import type { AuditEntry, AuditListFilters, AuditListResult, AuditPort } from './audit.port';

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
    const where = {
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.resource ? { resource: filters.resource } : {}),
    };

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
