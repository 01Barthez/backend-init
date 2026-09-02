/**
 * Integration placeholders for BullMQ / queue adapters.
 * Wire against a live Redis when RUN_LIVE_INFRA=1.
 */
import { describe, expect, it } from 'vitest';

import { isLiveInfraEnabled } from '../../helpers/test-database';

describe.skipIf(!isLiveInfraEnabled())('Queue (live)', () => {
  it('is gated behind RUN_LIVE_INFRA', () => {
    expect(isLiveInfraEnabled()).toBe(true);
  });
});
