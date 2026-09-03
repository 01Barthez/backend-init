/**
 * E2E project setup — multi-step HTTP journeys (offline infra by default).
 */
import { vi } from 'vitest';

import './mocks.infrastructure';

vi.setConfig({
  testTimeout: 30_000,
  hookTimeout: 45_000,
});
