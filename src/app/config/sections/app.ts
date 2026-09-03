/**
 * Application identity and runtime settings.
 * These values describe *what* the product is, not how it connects to infra.
 */
import { fromEnv } from '../env';

const nodeEnv = fromEnv.get('NODE_ENV').default('development').asString();

const clientUrl = fromEnv.get('CLIENT_URL').default('http://localhost:5173').asString();
const extraOrigins = fromEnv
  .get('CLIENT_URLS')
  .default('')
  .asString()
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const processRoleRaw = fromEnv.get('PROCESS_ROLE').default('all').asString();
const processRole =
  processRoleRaw === 'api' || processRoleRaw === 'worker' || processRoleRaw === 'all'
    ? processRoleRaw
    : 'all';

export const appConfig = {
  name: fromEnv.get('APP_NAME').default('Backend Init').asString(),
  version: fromEnv.get('APP_VERSION').default('1.0.0').asString(),
  description: fromEnv
    .get('APP_DESCRIPTION')
    .default('Production-ready Express + TypeScript backend template')
    .asString(),
  author: fromEnv.get('APP_AUTHOR').default('Barthez Kenwou').asString(),
  license: fromEnv.get('APP_LICENSE').default('MIT').asString(),

  /** HTTP listen port. */
  port: fromEnv.get('PORT').required().asPortNumber(),

  /** Mount prefix for versioned REST routes (e.g. /api/v1). */
  apiPrefix: fromEnv.get('DEFAULT_API_PREFIX').default('/api/v1').asString(),

  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',

  timezone: fromEnv.get('APP_TZ').default('UTC').asString(),
  locale: fromEnv.get('APP_LOCALE').default('en-US').asString(),

  clientUrl,
  /**
   * CORS allowlist. `CLIENT_URLS` is a CSV; `CLIENT_URL` is always included.
   * Credentials require an explicit list — never `*`.
   */
  corsOrigins: [...new Set([clientUrl, ...extraOrigins])],
  serverUrl: fromEnv
    .get('SERVER_URL')
    .default(`http://localhost:${fromEnv.get('PORT').default(3000).asInt()}`)
    .asString(),

  /** When true, suppress noisy console output in production. */
  disableConsoleLogs: fromEnv.get('DISABLE_CONSOLE_LOGS').default('true').asBool(),

  /** When true, non-probe routes return 503 (health/metrics still respond). */
  maintenanceMode: fromEnv.get('MAINTENANCE_MODE').default('false').asBool(),

  /**
   * Express `trust proxy` hop count. Set to 1 behind a single Nginx/ELB.
   * Required so `req.ip`, rate-limits, and audit logs see the client, not the proxy.
   */
  trustProxyHops: fromEnv.get('TRUST_PROXY_HOPS').default(1).asInt(),

  /**
   * Process role: `all` (template default), `api` (HTTP only), `worker` (BullMQ only).
   * Production replicas should split API and workers.
   */
  processRole,

  /** HTTP server request timeout (ms). */
  requestTimeoutMs: fromEnv.get('HTTP_REQUEST_TIMEOUT_MS').default(30_000).asInt(),
} as const;

export type AppConfig = typeof appConfig;
