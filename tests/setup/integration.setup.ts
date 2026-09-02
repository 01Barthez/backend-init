/**
 * Integration project setup — API wiring tests with offline infra doubles.
 * For live Mongo/Redis/MinIO, set RUN_LIVE_INFRA=1 (see helpers/test-database.ts).
 */
import './mocks.infrastructure';

import { vi } from 'vitest';

vi.setConfig({
  testTimeout: 20_000,
  hookTimeout: 30_000,
});

declare global {
  // eslint-disable-next-line no-var
  var testServer: import('../helpers/test-server').TestServer | undefined;
}
