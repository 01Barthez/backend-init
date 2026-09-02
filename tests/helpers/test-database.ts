/**
 * Test database helpers.
 *
 * Default CI/local Vitest suites use offline Prisma mocks (see setup/mocks.infrastructure.ts).
 *
 * Live Mongo:
 *   RUN_LIVE_INFRA=1 npm run test:integration:live
 *
 * Modes:
 * 1. External URL — set TEST_DATABASE_URL (or DATABASE_URL).
 * 2. Testcontainers — install `@testcontainers/mongodb` + Docker, then
 *    TESTCONTAINERS_MONGO=1 RUN_LIVE_INFRA=1 npm run test:integration:live
 */

export const isLiveInfraEnabled = (): boolean =>
  process.env.RUN_LIVE_INFRA === '1' || process.env.RUN_LIVE_INFRA === 'true';

export type LiveDatabaseHandle = {
  url: string;
  stop: () => Promise<void>;
};

/**
 * Resolve a live Mongo connection for integration/database suites.
 * Returns null when live infra is disabled (callers should skip).
 */
export const setupTestDatabase = async (): Promise<LiveDatabaseHandle | null> => {
  if (!isLiveInfraEnabled()) {
    return null;
  }

  const useContainers = process.env.TESTCONTAINERS_MONGO === '1';
  const externalUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!useContainers) {
    if (!externalUrl) {
      throw new Error(
        'RUN_LIVE_INFRA=1 requires TEST_DATABASE_URL/DATABASE_URL, or TESTCONTAINERS_MONGO=1 with @testcontainers/mongodb installed',
      );
    }
    return {
      url: externalUrl,
      stop: async () => undefined,
    };
  }

  try {
    const { MongoDBContainer } = await import('@testcontainers/mongodb');
    const container = await new MongoDBContainer('mongo:6.0').start();
    return {
      url: container.getConnectionString(),
      stop: async () => {
        await container.stop();
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Testcontainers Mongo failed. Install with: npm i -D @testcontainers/mongodb testcontainers. Detail: ${detail}`,
    );
  }
};

export const cleanUpTestDatabase = async (handle: LiveDatabaseHandle | null): Promise<void> => {
  if (!handle) return;
  await handle.stop();
};
