/**
 * Environment bootstrap.
 *
 * - Local/dev: load `.env` and validate against `.env.example` via dotenv-safe.
 * - Docker/K8s: orchestrator injects env vars; if `.env.example` is missing we
 *   skip file loading so startup does not crash (Compose already set process env).
 * - Vitest: load `.env` for required secrets/URLs, then re-pin `NODE_ENV=test`
 *   so operator guards and bootstrap skips stay consistent (see vitest.config.ts).
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
 * Docker images may omit `.env` (vars come from `env_file` / secrets) but should
 * still ship `.env.example` for schema checks when desired.
 */
if (fs.existsSync(examplePath)) {
  dotenvSafe.config({
    allowEmptyValues: true,
    example: examplePath,
    // If `.env` is absent (typical in containers), validate against process env only.
    ...(fs.existsSync(envPath) ? { path: envPath } : {}),
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
