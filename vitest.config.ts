import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const sharedResolve = {
  alias: {
    '@': resolve(__dirname, './src'),
    '@app': resolve(__dirname, './src/app'),
    '@modules': resolve(__dirname, './src/modules'),
    '@shared': resolve(__dirname, './src/shared'),
  },
};

const coverage = {
  provider: 'v8' as const,
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/tests/**',
    '**/docs/**',
    '**/infra/**',
    '**/*.d.ts',
    '**/index.ts',
  ],
  // Raise gradually; enforce in CI once the suite covers critical modules.
  // thresholds: { lines: 50, functions: 45, branches: 40, statements: 50 },
};

/**
 * Vitest multi-project layout:
 * - unit: pure use cases / domain / utils (mocked ports)
 * - integration: HTTP + module wiring (offline infra doubles)
 * - e2e: multi-step API journeys
 * - contract: OpenAPI / response contract
 *
 * Live containers: RUN_LIVE_INFRA=1 npm run test:integration:live
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: sharedResolve,
  test: {
    globals: true,
    environment: 'node',
    /** Must be set before app config loads so operator auth guards stay disabled in tests. */
    env: {
      NODE_ENV: 'test',
    },
    exclude: ['node_modules', 'dist', 'coverage', 'tests/load/**'],
    coverage,
    projects: [
      {
        plugins: [tsconfigPaths()],
        resolve: sharedResolve,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.{test,spec}.ts'],
          setupFiles: ['./tests/setup/unit.setup.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: sharedResolve,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.{test,spec}.ts'],
          setupFiles: ['./tests/setup/integration.setup.ts'],
          environment: 'node',
          testTimeout: 20_000,
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: sharedResolve,
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.{test,spec}.ts'],
          setupFiles: ['./tests/setup/e2e.setup.ts'],
          environment: 'node',
          testTimeout: 30_000,
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: sharedResolve,
        test: {
          name: 'contract',
          include: ['tests/contract/**/*.{test,spec}.ts'],
          setupFiles: ['./tests/setup/contract.setup.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
