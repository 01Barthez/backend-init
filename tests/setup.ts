import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '0';

vi.mock('@/services/logging/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
  },
}));

vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 30000,
});

declare global {
  // eslint-disable-next-line no-var
  var testServer: import('./helpers/test-server').TestServer | undefined;
}
