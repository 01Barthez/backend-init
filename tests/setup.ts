import { vi, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanUpTestDatabase, setupTestDatabase } from './utils/test-database';
import { createTestServer } from './utils/test-server';

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Utilise un port aléatoire pour les tests

// Configuration des timeouts globaux
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 30000,
});

// Configuration des mocks globaux
vi.mock('@/services/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Hooks globaux
beforeAll(async () => {
  await setupTestDatabase();
  global.testServer = await createTestServer();
});

afterEach(async () => {
  await cleanUpTestDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await global.testServer.close();
  await cleanUpTestDatabase(true);
});

// Extensions personnalisées pour expect
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

// Déclarations globales
declare global {
  // eslint-disable-next-line no-var
  var testServer: {
    app: Express.Application;
    server: import('http').Server;
    close: () => Promise<void>;
  };
}
