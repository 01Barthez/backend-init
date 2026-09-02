/**
 * Unit project setup — env + logger/infra mocks so accidental imports stay offline.
 * Prefer mocking ports inside each suite; do not hit real Mongo/Redis.
 */
import './mocks.infrastructure';

import { vi } from 'vitest';

vi.setConfig({
  testTimeout: 10_000,
  hookTimeout: 15_000,
});
