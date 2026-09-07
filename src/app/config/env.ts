/**
 * Environment bootstrap.
 *
 * - Local/dev: load `.env` and validate against `.env.example` via dotenv-safe.
 * - CI / containers without a mounted `.env`: load `.env.example` as the value
 *   source (allowEmptyValues) so schema keys exist; Compose/K8s should still
 *   inject real secrets via process env (they override file values).
 * - Vitest: after load, re-pin `NODE_ENV=test` (see vitest.config.ts).
 *
 * Domain settings live in `sections/` — do not read `process.env` elsewhere.
 */
import dotenvSafe from 'dotenv-safe';
import env from 'env-var';
import fs from 'fs';
import path from 'path';

const examplePath = path.join(process.cwd(), '.env.example');
const envPath = path.join(process.cwd(), '.env');

/**
 * Only run dotenv-safe when the example schema file exists.
 * Prefer `.env` when present; otherwise fall back to `.env.example` so CI
 * runners (no secrets file) and slim images do not crash on MissingEnvVarsError.
 */
if (fs.existsSync(examplePath)) {
  dotenvSafe.config({
    allowEmptyValues: true,
    example: examplePath,
    path: fs.existsSync(envPath) ? envPath : examplePath,
  });
}

/** Local `.env` often sets NODE_ENV=development; Vitest must stay in test profile. */
if (process.env.VITEST === 'true') {
  process.env.NODE_ENV = 'test';
}

/**
 * Typed accessor for a single environment variable.
 * Prefer importing `config` from `@/app/config` rather than calling this directly.
 */
export const fromEnv = env;

/**
 * Convenience helpers used by section builders.
 */
export const envHelpers = {
  /** Build an absolute callback URL from SERVER_URL + path. */
  oauthCallback(pathSuffix: string): string {
    const base = env.get('SERVER_URL').default('http://localhost:3000').asString();
    return `${base}${pathSuffix}`;
  },
};
