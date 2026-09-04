export type AuditEntry = {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

/** Shared query filters for list + export (investigation / compliance). */
export type AuditQueryFilters = {
  actorId?: string;
  action?: string;
  resource?: string;
  requestId?: string;
  /** Inclusive lower bound (`createdAt >= from`). */
  from?: Date;
  /** Inclusive upper bound (`createdAt <= to`). */
  to?: Date;
};

export type AuditListFilters = AuditQueryFilters & {
  page: number;
  limit: number;
};

export type AuditListItem = {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  requestId: string | null;
  createdAt: Date;
};

/** Full entry for GET by id — includes metadata and userAgent. */
export type AuditDetail = AuditListItem & {
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditListResult = {
  items: AuditListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuditExportFormat = 'csv' | 'json';

export type AuditExportFilters = AuditQueryFilters & {
  format: AuditExportFormat;
};

export type AuditExportResult = {
  format: AuditExportFormat;
  /** CSV string or JSON array payload (already stringified when format=json). */
  body: string;
  count: number;
  contentType: string;
  filename: string;
};

/**
 * Append-only audit trail for security-sensitive mutations.
 * Implementations enrich entries with request context (ip, requestId).
 * HTTP surface is read-only; purge is ops/cron only.
 */
export interface AuditPort {
  record(entry: AuditEntry): Promise<void>;
  list(filters: AuditListFilters): Promise<AuditListResult>;
  getById(id: string): Promise<AuditDetail | null>;
  /** Bounded dump (default cap 10_000) for the same filters as list. */
  export(filters: AuditExportFilters): Promise<AuditExportResult>;
  purgeOlderThan(days: number): Promise<number>;
}
