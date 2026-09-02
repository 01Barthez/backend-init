/**
 * E2E project setup — multi-step HTTP journeys (offline infra by default).
 */
import './mocks.infrastructure';

import { vi } from 'vitest';

vi.setConfig({
  testTimeout: 30_000,
  hookTimeout: 45_000,
});
