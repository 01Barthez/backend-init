/**
 * Contract project setup — OpenAPI / envelope checks (no Express app required).
 */
import './env';

import { vi } from 'vitest';

vi.setConfig({
  testTimeout: 15_000,
  hookTimeout: 15_000,
});
