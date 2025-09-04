import dotenvSafe from 'dotenv-safe';
import env from 'env-var';

dotenvSafe.config();

export const envs = {
  PORT: env.get('PORT').required().asPortNumber(),
  API_PREFIX: env.get('DEFAULT_API_PREFIX').default('/api/v1').asString(),
  NODE_ENV: env.get('NODE_ENV').default('development').asString(),

  DB_TYPE: env.get('DB_TYPE').default('mongodb').asString(),
  APP_NAME: env.get('APP_NAME').default('My Backend APP').asString(),
  APP_VERSION: env.get('APP_VERSION').default('1.0.0').asString(),
  APP_DESCRIPTION: env.get('APP_DESCRIPTION').default('This is my backend application').asString(),
  APP_AUTHOR: env.get('APP_AUTHOR').default('Barthez Kenwou').asString(),
  APP_LICENSE: env.get('APP_LICENSE').default('MIT').asString(),

  DISABLE_CONSOLE_LOGS: env.get('DISABLE_CONSOLE_LOGS').default('true').asBool(),

  // Database
  DATABASE_URL: env.get('DATABASE_URL').required().asString(),
  MONGO_USER: env.get('MONGO_USER').required().asString(),
  MONGO_PASSWORD: env.get('MONGO_PASSWORD').required().asString(),
  MONGO_DB: env.get('MONGO_DB').required().asString(),
  LOG_TO_MONGODB: env.get('LOG_TO_MONGODB').default('false').asBool(),

  // Redis
  MINIO_ACCESS_KEY: env.get('MINIO_ACCESS_KEY').required().asString(),
  MINIO_SECRET_KEY: env.get('MINIO_SECRET_KEY').required().asString(),
  MINIO_PORT: env.get('MINIO_PORT').required().asPortNumber(),
  MINIO_ENDPOINT: env.get('MINIO_ENDPOINT').default('localhost').asString(),

  // Redis
  REDIS_HOST: env.get('REDIS_HOST').required().asString(),
  REDIS_PORT: env.get('REDIS_PORT').required().asPortNumber(),

  // MailHog SMTP
  SMTP_HOST: env.get('SMTP_HOST').required().asString(),
  SMTP_PORT: env.get('SMTP_PORT').required().asPortNumber(),
  SMTP_USER: env.get('SMTP_USER').required().asString(),
  SMTP_PASS: env.get('SMTP_PASS').required().asString(),
  USER_EMAIL: env.get('USER_EMAIL').required().asEmailString(),

  // Logging
  LOG_LEVEL: env.get('LOG_LEVEL').default('info').asString(),
  LOG_TO_FILE: env.get('LOG_TO_FILE').default('false').asBool(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: env.get('RATE_LIMIT_WINDOW_MS').default(900000).asInt(),
  RATE_LIMIT_MAX_REQUESTS: env.get('RATE_LIMIT_MAX_REQUESTS').default(100).asInt(),

  // Security
  HSTS_MAX_AGE: env.get('HSTS_MAX_AGE').default(31536000).asInt(),
  MAX_GLOBAL_QUERY_NUMBER: env.get('MAX_GLOBAL_QUERY_NUMBER').default(100).asInt(),
  MAX_GLOBAL_QUERY_WINDOW: env.get('MAX_GLOBAL_QUERY_WINDOW').default(900000).asInt(),
  MAX_UNIQ_QUERY_NUMBER: env.get('MAX_UNIQ_QUERY_NUMBER').default(50).asInt(),
  MAX_UNIQ_QUERY_WINDOW: env.get('MAX_UNIQ_QUERY_WINDOW').default(900000).asInt(),

  // JWT
  JWT_SECRET: env.get('JWT_SECRET').required().asString(),
  JWT_EXPIRES_IN: env.get('JWT_EXPIRES_IN').default('1h').asString(),
  JWT_COOKIE_SECURITY: env.get('JWT_COOKIE_SECURITY').default('true').asBool(),
  JWT_COOKIE_HTTP_STATUS: env.get('JWT_COOKIE_HTTP_STATUS').default('true').asBool(),

  // URL
  CLIENT_URL: env.get('CLIENT_URL').default('http://localhost:5173').asString(),
  SERVER_URL: env
    .get('SERVER_URL')
    .default(`http://localhost:${env.get('PORT').default(3000).asInt()}`)
    .asString(),

  // Loki
  LOKI_ENABLED: env.get('LOKI_ENABLED').default('false').asBool(),

  // CSRF
  CSRF_COOKIE_NAME: env.get('CSRF_COOKIE_NAME').default('XSRF-TOKEN').asString(),
  CSRF_HEADER_NAME: env.get('CSRF_HEADER_NAME').default('X-XSRF-TOKEN').asString(),
  CSRF_EXPIRES_IN: env.get('CSRF_EXPIRES_IN').default('2h').asString(),
  ALLOW_CSRF_PROTECTION: env.get('ALLOW_CSRF_PROTECTION').default('true').asBool(),

  // CSP Reorting
  CSP_REPORT_URI: env.get('CSP_REPORT_URI').default('/security/csp-violation').asString(),

  // Cookie
  COOKIE_DOMAIN: env.get('COOKIE_DOMAIN').default('localhost').asString(),
  COOKIE_SECURE: env.get('COOKIE_SECURE').default('true').asBool(),
  COOKIE_HTTP_STATUS: env.get('COOKIE_HTTP_STATUS').default('true').asBool(),
  COOKIE_SAME_SITE: env.get('COOKIE_SAME_SITE').default('strict').asString(),
  COOKIE_EXPIRES_IN: env.get('COOKIE_EXPIRES_IN').default('2h').asInt(),

  // Swagger
  SWAGGER_ENABLED: env.get('SWAGGER_ENABLED').default('true').asBool(),
  SWAGGER_USER: env.get('SWAGGER_USER').default('admin').asString(),
  SWAGGER_PASSWORD: env.get('SWAGGER_PASSWORD').default('admin').asString(),

  // Otp delay
  OTP_DELAY: env.get('OTP_DELAY').default(900000).asInt(),

  // OAuth
  // OAUTH_GOOGLE_CLIENT_ID: env.get('OAUTH_GOOGLE_CLIENT_ID').required().asString(),
  // OAUTH_GOOGLE_CLIENT_SECRET: env.get('OAUTH_GOOGLE_CLIENT_SECRET').required().asString(),
  // OAUTH_GOOGLE_CALLBACK_URL: env.get('OAUTH_GOOGLE_CALLBACK_URL').required().asString(),

  // OAUTH_GITHUB_CLIENT_ID: env.get('OAUTH_GITHUB_CLIENT_ID').required().asString(),
  // OAUTH_GITHUB_CLIENT_SECRET: env.get('OAUTH_GITHUB_CLIENT_SECRET').required().asString(),
  // OAUTH_GITHUB_CALLBACK_URL: env.get('OAUTH_GITHUB_CALLBACK_URL').required().asString(),

  // OAUTH_FACEBOOK_CLIENT_ID: env.get('OAUTH_FACEBOOK_CLIENT_ID').required().asString(),
  // OAUTH_FACEBOOK_CLIENT_SECRET: env.get('OAUTH_FACEBOOK_CLIENT_SECRET').required().asString(),
  // OAUTH_FACEBOOK_CALLBACK_URL: env.get('OAUTH_FACEBOOK_CALLBACK_URL').required().asString(),

  // OAUTH_LINKEDIN_CLIENT_ID: env.get('OAUTH_LINKEDIN_CLIENT_ID').required().asString(),
  // OAUTH_LINKEDIN_CLIENT_SECRET: env.get('OAUTH_LINKEDIN_CLIENT_SECRET').required().asString(),
  // OAUTH_LINKEDIN_CALLBACK_URL: env.get('OAUTH_LINKEDIN_CALLBACK_URL').required().asString(),

  // OAUTH_TWITTER_CLIENT_ID: env.get('OAUTH_TWITTER_CLIENT_ID').required().asString(),
  // OAUTH_TWITTER_CLIENT_SECRET: env.get('OAUTH_TWITTER_CLIENT_SECRET').required().asString(),
  // OAUTH_TWITTER_CALLBACK_URL: env.get('OAUTH_TWITTER_CALLBACK_URL').required().asString(),

  // OAUTH_GITHUB_ADMIN: env.get('OAUTH_GITHUB_ADMIN').required().asString(),
};
