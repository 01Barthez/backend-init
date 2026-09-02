import { describe, expect, it } from 'vitest';

import { isLiveInfraEnabled } from '../../helpers/test-database';

/**
 * Placeholder for Redis live checks (ioredis ping).
 * Enable with RUN_LIVE_INFRA=1 and a reachable REDIS_HOST.
 */
describe.skipIf(!isLiveInfraEnabled())('Cache (live Redis)', () => {
  it('documents the live Redis gate', () => {
    expect(process.env.REDIS_HOST || '127.0.0.1').toBeTruthy();
  });
});
