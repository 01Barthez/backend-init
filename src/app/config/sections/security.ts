/**
 * HTTP security, cookies, CSRF, CSP and rate-limiting knobs.
 */
import { fromEnv } from '../env';

export const securityConfig = {
  hstsMaxAge: fromEnv.get('HSTS_MAX_AGE').default(31536000).asInt(),

  rateLimit: {
    windowMs: fromEnv.get('RATE_LIMIT_WINDOW_MS').default(900000).asInt(),
    maxRequests: fromEnv.get('RATE_LIMIT_MAX_REQUESTS').default(100).asInt(),
    globalMax: fromEnv.get('MAX_GLOBAL_QUERY_NUMBER').default(100).asInt(),
    globalWindowMs: fromEnv.get('MAX_GLOBAL_QUERY_WINDOW').default(900000).asInt(),
    uniqueMax: fromEnv.get('MAX_UNIQ_QUERY_NUMBER').default(50).asInt(),
    uniqueWindowMs: fromEnv.get('MAX_UNIQ_QUERY_WINDOW').default(900000).asInt(),
  },

  csrf: {
    enabled: fromEnv.get('ALLOW_CSRF_PROTECTION').default('true').asBool(),
    cookieName: fromEnv.get('CSRF_COOKIE_NAME').default('XSRF-TOKEN').asString(),
    headerName: fromEnv.get('CSRF_HEADER_NAME').default('X-XSRF-TOKEN').asString(),
    expiresIn: fromEnv.get('CSRF_EXPIRES_IN').default('2h').asString(),
  },

  cspReportUri: fromEnv.get('CSP_REPORT_URI').default('/security/csp-violation').asString(),

  cookie: {
    domain: fromEnv.get('COOKIE_DOMAIN').default('localhost').asString(),
    secure: fromEnv.get('COOKIE_SECURE').default('true').asBool(),
    httpOnly: fromEnv.get('COOKIE_HTTP_STATUS').default('true').asBool(),
    sameSite: fromEnv.get('COOKIE_SAME_SITE').default('strict').asString() as
      | 'strict'
      | 'lax'
      | 'none',
    expiresIn: fromEnv.get('COOKIE_EXPIRES_IN').default('2h').asInt(),
  },

  swagger: {
    enabled: fromEnv.get('SWAGGER_ENABLED').default('true').asBool(),
    user: fromEnv.get('SWAGGER_USER').default('admin').asString(),
    password: fromEnv.get('SWAGGER_PASSWORD').default('admin').asString(),
  },
} as const;

export type SecurityConfig = typeof securityConfig;
