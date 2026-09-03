/**
 * HTTP security, cookies, CSRF, CSP and rate-limiting knobs.
 */
import { fromEnv } from '../env';
import { parseDurationMs } from '../parse-duration';

const SEVEN_DAYS_MS = 7 * 86_400_000;
const FIFTEEN_MINUTES_MS = 15 * 60_000;

const nodeEnv = fromEnv.get('NODE_ENV').default('development').asString();
const isProduction = nodeEnv === 'production';

/** Prefer COOKIE_HTTP_ONLY; COOKIE_HTTP_STATUS remains a legacy alias. */
const cookieHttpOnly = fromEnv
  .get('COOKIE_HTTP_ONLY')
  .default(fromEnv.get('COOKIE_HTTP_STATUS').default('true').asString())
  .asBool();

export const securityConfig = {
  hstsMaxAge: fromEnv.get('HSTS_MAX_AGE').default(31536000).asInt(),
  /** HSTS preload is opt-in — do not submit a domain until HTTPS is guaranteed. */
  hstsPreload: fromEnv.get('HSTS_PRELOAD').default('false').asBool(),

  rateLimit: {
    windowMs: fromEnv.get('RATE_LIMIT_WINDOW_MS').default(900000).asInt(),
    maxRequests: fromEnv.get('RATE_LIMIT_MAX_REQUESTS').default(100).asInt(),
    globalMax: fromEnv.get('MAX_GLOBAL_QUERY_NUMBER').default(100).asInt(),
    globalWindowMs: fromEnv.get('MAX_GLOBAL_QUERY_WINDOW').default(900000).asInt(),
    uniqueMax: fromEnv.get('MAX_UNIQ_QUERY_NUMBER').default(50).asInt(),
    uniqueWindowMs: fromEnv.get('MAX_UNIQ_QUERY_WINDOW').default(900000).asInt(),
    /** Stricter bucket for login / OTP / forgot / reset. */
    authMax: fromEnv.get('MAX_AUTH_QUERY_NUMBER').default(10).asInt(),
    authWindowMs: fromEnv.get('MAX_AUTH_QUERY_WINDOW').default(900000).asInt(),
  },

  csrf: {
    enabled: fromEnv.get('ALLOW_CSRF_PROTECTION').default('true').asBool(),
    cookieName: fromEnv.get('CSRF_COOKIE_NAME').default('XSRF-TOKEN').asString(),
    headerName: fromEnv.get('CSRF_HEADER_NAME').default('X-XSRF-TOKEN').asString(),
    expiresInMs: parseDurationMs(
      fromEnv.get('CSRF_EXPIRES_IN').default('24h').asString(),
      86_400_000,
    ),
  },

  cspReportUri: fromEnv.get('CSP_REPORT_URI').default('/security/csp-violation').asString(),

  cookie: {
    /** Empty = host-only cookie (correct for localhost / most SPA setups). */
    domain: fromEnv.get('COOKIE_DOMAIN').default('').asString(),
    secure: fromEnv.get('COOKIE_SECURE').default('true').asBool(),
    httpOnly: cookieHttpOnly,
    sameSite: fromEnv.get('COOKIE_SAME_SITE').default('strict').asString() as
      | 'strict'
      | 'lax'
      | 'none',
    /** Refresh-cookie lifetime. Align with JWT_REFRESH_EXPIRES_IN (default 7d). */
    expiresInMs: parseDurationMs(
      fromEnv.get('COOKIE_EXPIRES_IN').default('7d').asString(),
      SEVEN_DAYS_MS,
    ),
  },

  swagger: {
    /** Off in production unless explicitly enabled. */
    enabled: fromEnv
      .get('SWAGGER_ENABLED')
      .default(isProduction ? 'false' : 'true')
      .asBool(),
    user: fromEnv.get('SWAGGER_USER').default('admin').asString(),
    password: fromEnv.get('SWAGGER_PASSWORD').default('admin').asString(),
  },

  /**
   * Basic auth for Swagger + Bull Board.
   * In production, ADMIN_BASIC_PASSWORD must not be empty or "admin".
   */
  adminBasic: {
    user: fromEnv.get('ADMIN_BASIC_USER').default('admin').asString(),
    password: fromEnv.get('ADMIN_BASIC_PASSWORD').default('').asString(),
  },

  lockout: {
    maxLoginAttempts: fromEnv.get('MAX_LOGIN_ATTEMPTS').default(5).asInt(),
    lockoutMs: fromEnv.get('LOGIN_LOCKOUT_MS').default(FIFTEEN_MINUTES_MS).asInt(),
    maxOtpAttempts: fromEnv.get('MAX_OTP_ATTEMPTS').default(5).asInt(),
  },
} as const;

export type SecurityConfig = typeof securityConfig;
