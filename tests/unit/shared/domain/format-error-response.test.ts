import { describe, expect, it } from 'vitest';

import { formatErrorResponse } from '@/shared/domain/errors/format-error-response';

describe('formatErrorResponse', () => {
  it('includes requestId when provided', () => {
    const { body } = formatErrorResponse(new Error('boom'), false, 'req-abc');
    expect(body.requestId).toBe('req-abc');
    expect(body.success).toBe(false);
  });
});
