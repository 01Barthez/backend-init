// eslint.config.mjs
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import path from 'path';

/** Forbid direct process.env access — use @/app/config instead. */
const noProcessEnv = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: 'Use config from @/app/config instead of process.env',
};

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '.eslintrc.js',
      'eslint.config.js',
      '.prettierrc.js',
      '.lintstagedrc.js',
      'commitlint.config.js',
      'docs/**/*.js',
      'module-alias.config.js',
      'mongo-init.js',
      'tests/**',
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'logs/**',
      'vitest.config.ts',
      'prisma/seed.ts',
      '*.config.js',
      'commitlint.config.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: path.resolve(),
      },
      globals: {
        node: true,
        es2022: true,
        jest: false,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json'],
        },
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
      'simple-import-sort': simpleImportSort,
      sonarjs: sonarjsPlugin,
      security: securityPlugin,
      promise: promisePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Base
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'no-return-await': 'error',
      'require-await': 'off',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-optional-chaining': 'warn',
      'no-useless-backreference': 'error',
      'no-restricted-syntax': ['error', noProcessEnv],

      // Import: disable noisy / false-positive rules under TypeScript
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'off',
      'import/no-duplicates': 'off',
      'import/no-cycle': 'off',
      'import/no-self-import': 'off',
      'import/no-useless-path-segments': 'off',
      'import/no-relative-parent-imports': 'off',
      'import/no-deprecated': 'off',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import sorting
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'error',

      // TypeScript: keep practical defaults for a template codebase
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 5,
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Process / sync
      'no-process-exit': 'warn',
      'no-sync': 'off',

      // Promise
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'warn',
      'promise/valid-params': 'warn',

      // Prettier
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  // Domain layer must stay free of HTTP, ORM, and broker SDKs.
  {
    files: ['src/**/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'express', message: 'Domain must not import Express.' },
            { name: '@prisma/client', message: 'Domain must not import Prisma.' },
            { name: 'ioredis', message: 'Domain must not import Redis clients.' },
            { name: 'axios', message: 'Domain must not import HTTP clients.' },
            { name: 'bullmq', message: 'Domain must not import queue SDKs.' },
          ],
        },
      ],
    },
  },
  // Application modules / shared: no console.* except logger bootstrap + CLI banner
  {
    files: ['src/modules/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/infrastructure/logging/logger.ts', 'src/shared/utils/startup-message.ts'],
    rules: {
      'no-console': 'error',
    },
  },
  // CLI startup banner (intentional console UX)
  {
    files: ['src/index.ts', 'src/shared/utils/startup-message.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Logger bootstrap: chicken-egg before Winston exists — warn/error only
  {
    files: ['src/shared/infrastructure/logging/logger.ts'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Config layer: process.env is allowed here only
  {
    files: ['src/app/config/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-process-exit': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
