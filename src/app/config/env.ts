/**
 * Environment bootstrap.
 *
 * Loads `.env` once at process start and exposes a thin `env-var` wrapper.
 * Domain-specific settings live in `sections/` — do not scatter `process.env`
 * reads across the codebase.
 */
import dotenvSafe from 'dotenv-safe';
import env from 'env-var';

// Allow empty values so optional integrations (OAuth, Flagsmith, …) can be disabled
// without forcing placeholder secrets into every environment.
dotenvSafe.config({ allowEmptyValues: true });

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
  oauthCallback(path: string): string {
    const base = env.get('SERVER_URL').default('http://localhost:3000').asString();
    return `${base}${path}`;
  },
};
