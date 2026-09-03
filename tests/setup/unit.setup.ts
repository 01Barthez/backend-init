/**
 * Unit project setup — env + logger/infra mocks so accidental imports stay offline.
 * Prefer mocking ports inside each suite; do not hit real Mongo/Redis.
 */
import { vi } from 'vitest';

import './mocks.infrastructure';

vi.setConfig({
  testTimeout: 10_000,
  hookTimeout: 15_000,
});
