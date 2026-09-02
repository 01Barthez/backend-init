import { describe, expect, it } from 'vitest';

import { cleanUpTestDatabase, isLiveInfraEnabled, setupTestDatabase } from '../../helpers/test-database';

/**
 * Live Mongo connectivity check.
 * Skipped in default CI — enable with:
 *   RUN_LIVE_INFRA=1 npm run test:integration:live
 * Optional: TESTCONTAINERS_MONGO=1 to boot ephemeral mongo:6 via Testcontainers.
 */
describe.skipIf(!isLiveInfraEnabled())('Database (live Mongo)', () => {
  it('obtains a Mongo connection handle', async () => {
    const handle = await setupTestDatabase();
    expect(handle).not.toBeNull();
    expect(handle?.url).toMatch(/^mongodb/);
    await cleanUpTestDatabase(handle);
  }, 120_000);
});
