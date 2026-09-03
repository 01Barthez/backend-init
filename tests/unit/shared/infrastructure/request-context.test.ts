import { describe, expect, it } from 'vitest';

import {
  getLogMeta,
  getRequestContext,
  resolveRequestId,
  runWithRequestContext,
  setRequestContextUserId,
} from '@/shared/infrastructure/request-context';

describe('request-context', () => {
  it('accepts a valid client request id', () => {
    expect(resolveRequestId('abc-12345')).toBe('abc-12345');
  });

  it('mints a uuid when the header is missing or invalid', () => {
    expect(resolveRequestId(undefined)).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
    );
    expect(resolveRequestId('!!!')).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
    );
  });

  it('propagates store values through ALS', () => {
    runWithRequestContext(
      {
        requestId: 'req-1',
        startedAt: Date.now(),
        method: 'GET',
        path: '/health',
      },
      () => {
        expect(getRequestContext()?.requestId).toBe('req-1');
        setRequestContextUserId('user-42');
        expect(getRequestContext()?.userId).toBe('user-42');
        expect(getLogMeta({ extra: true })).toEqual({
          requestId: 'req-1',
          userId: 'user-42',
          extra: true,
        });
      },
    );
  });
});
