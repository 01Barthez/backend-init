/**
 * Integration placeholders for MinIO / S3-compatible storage.
 */
import { describe, expect, it } from 'vitest';

import { isLiveInfraEnabled } from '../../helpers/test-database';

describe.skipIf(!isLiveInfraEnabled())('Storage (live MinIO)', () => {
  it('is gated behind RUN_LIVE_INFRA', () => {
    expect(isLiveInfraEnabled()).toBe(true);
  });
});
