import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Per-request correlation bag propagated via AsyncLocalStorage.
 * Infrastructure (logger, audit, queue) reads this — domain stays unaware.
 */
export type RequestContextStore = {
  requestId: string;
  traceId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  startedAt: number;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

const REQUEST_ID_PATTERN = /^[\w-]{8,128}$/;

/** Accept a client-supplied id when it looks sane; otherwise mint a new one. */
export const resolveRequestId = (header: string | string[] | undefined): string => {
  const candidate = Array.isArray(header) ? header[0] : header;
  if (candidate && REQUEST_ID_PATTERN.test(candidate.trim())) {
    return candidate.trim();
  }
  return randomUUID();
};

/** Parse W3C traceparent (00-<trace-id>-<span-id>-<flags>) when present. */
export const resolveTraceId = (header: string | string[] | undefined): string | undefined => {
  const candidate = Array.isArray(header) ? header[0] : header;
  if (!candidate) return undefined;
  const match = candidate.trim().match(/^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i);
  return match?.[1];
};

export const getRequestContext = (): RequestContextStore | undefined => storage.getStore();

export const runWithRequestContext = <T>(store: RequestContextStore, fn: () => T): T =>
  storage.run(store, fn);

/** Called from authenticate after JWT verification. */
export const setRequestContextUserId = (userId: string): void => {
  const store = storage.getStore();
  if (store) {
    store.userId = userId;
  }
};

/** Merge ALS fields into structured log metadata. */
export const getLogMeta = (extra: Record<string, unknown> = {}): Record<string, unknown> => {
  const ctx = getRequestContext();
  return {
    ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
    ...(ctx?.traceId ? { traceId: ctx.traceId } : {}),
    ...(ctx?.userId ? { userId: ctx.userId } : {}),
    ...extra,
  };
};

export default storage;
