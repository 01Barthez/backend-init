export type AuditEntry = {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export type AuditListFilters = {
  actorId?: string;
  action?: string;
  resource?: string;
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

export type AuditListResult = {
  items: AuditListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Append-only audit trail for security-sensitive mutations.
 * Implementations enrich entries with request context (ip, requestId).
 */
export interface AuditPort {
  record(entry: AuditEntry): Promise<void>;
  list(filters: AuditListFilters): Promise<AuditListResult>;
  purgeOlderThan(days: number): Promise<number>;
}
