/**
 * Contract project setup — OpenAPI / envelope checks (no Express app required).
 */
import { vi } from 'vitest';

import './env';

vi.setConfig({
  testTimeout: 15_000,
  hookTimeout: 15_000,
});
