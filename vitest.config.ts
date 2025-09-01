import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'coverage', '**/__mocks__/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/__mocks__/**',
        '**/*.d.ts',
        '**/index.ts',
        '**/types/**',
        '**/interfaces/**',
        '**/config/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
