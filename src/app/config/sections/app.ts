/**
 * Application identity and runtime settings.
 * These values describe *what* the product is, not how it connects to infra.
 */
import { fromEnv } from '../env';

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

  nodeEnv: fromEnv.get('NODE_ENV').default('development').asString(),
  isProduction: fromEnv.get('NODE_ENV').default('development').asString() === 'production',
  isTest: fromEnv.get('NODE_ENV').default('development').asString() === 'test',

  timezone: fromEnv.get('APP_TZ').default('UTC').asString(),
  locale: fromEnv.get('APP_LOCALE').default('en-US').asString(),

  clientUrl: fromEnv.get('CLIENT_URL').default('http://localhost:5173').asString(),
  serverUrl: fromEnv
    .get('SERVER_URL')
    .default(`http://localhost:${fromEnv.get('PORT').default(3000).asInt()}`)
    .asString(),

  /** When true, suppress noisy console output in production. */
  disableConsoleLogs: fromEnv.get('DISABLE_CONSOLE_LOGS').default('true').asBool(),
} as const;

export type AppConfig = typeof appConfig;
