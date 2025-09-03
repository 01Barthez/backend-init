// eslint.config.js
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
      'node_modules/**',
      'logs/**',
      'vitest.config.ts',
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
      'no-console': 'off', // Désactivé (trop de bruit en dev)
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

      // Import: Désactiver toutes les règles problématiques
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
      'import/no-deprecated': 'off', // Désactivé (faux positifs avec TS)

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

      // TS rules: Assouplir les règles strictes
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Désactivé (any n'est pas un crime)
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-require-imports': 'off', // Désactivé (compatible avec CommonJS)
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-var-requires': 'off', // Désactivé (compatible avec CommonJS)
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
      '@typescript-eslint/strict-boolean-expressions': 'off', // Désactivé (trop strict)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Désactivé (préférence personnelle)
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',

      // Performance: Assouplir les règles strictes
      'no-process-exit': 'warn',
      'no-sync': 'off', // Désactivé (sync n'est pas toujours un problème)

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
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-process-exit': 'off',
    },
  },
];
