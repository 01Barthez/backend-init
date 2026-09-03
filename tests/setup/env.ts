/**
 * Shared test environment defaults.
 * Imported by every Vitest project setup file.
 *
 * dotenv-safe requires every `.env.example` key to exist when a `.env` file
 * is present; these defaults cover CI sandboxes that have no `.env`.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.REDIS_HOST = '127.0.0.1';
process.env.ALLOW_CSRF_PROTECTION = 'false';
process.env.COOKIE_EXPIRES_IN = '7d';
process.env.MAINTENANCE_MODE ??= 'false';
process.env.PRISMA_STUDIO_NAME ??= 'PRISMA_STUDIO';
process.env.PRISMA_STUDIO_PORT ??= '5555';
process.env.PROCESS_ROLE ??= 'all';
process.env.TRUST_PROXY_HOPS ??= '1';
process.env.HTTP_REQUEST_TIMEOUT_MS ??= '30000';
process.env.CLIENT_URLS ??= '';
process.env.REDIS_USERNAME ??= '';
process.env.REDIS_TLS ??= 'false';
process.env.REDIS_TLS_REJECT_UNAUTHORIZED ??= 'true';
process.env.REDIS_DB ??= '0';
process.env.COOKIE_HTTP_ONLY ??= 'true';
process.env.HSTS_PRELOAD ??= 'false';
process.env.LOKI_HOST ??= 'http://127.0.0.1:3100';
process.env.OTEL_ENABLED ??= 'false';
process.env.AUDIT_PURGE_CRON ??= '15 3 * * *';
process.env.AUDIT_RETENTION_DAYS ??= '365';
process.env.CLAMAV_REQUIRED ??= 'false';
process.env.API_UPLOAD_MAX_BYTES ??= '2097152';
process.env.PRESIGN_UPLOAD_MAX_BYTES ??= '52428800';
process.env.PRESIGN_TTL_SECONDS ??= '300';
process.env.ADMIN_BASIC_USER ??= 'admin';
process.env.ADMIN_BASIC_PASSWORD ??= 'test-operator-password';
process.env.JWT_PRIVATE_KEY_PATH ??= 'keys/jwt-access-private.pem';
process.env.JWT_PUBLIC_KEY_PATH ??= 'keys/jwt-access-public.pem';
process.env.JWT_REFRESH_PRIVATE_KEY_PATH ??= 'keys/jwt-refresh-private.pem';
process.env.JWT_REFRESH_PUBLIC_KEY_PATH ??= 'keys/jwt-refresh-public.pem';
process.env.AUTH_ENCRYPTION_KEY ??=
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.APP_TZ ??= 'UTC';
process.env.APP_LOCALE ??= 'en-US';
process.env.SERVER_URL ??= 'http://localhost:3000';
process.env.MONGO_URL ??= 'mongodb://127.0.0.1:27017/';
process.env.LOG_TO_MONGODB ??= 'false';
process.env.LOG_LEVEL ??= 'info';
process.env.LOG_TO_FILE ??= 'false';
process.env.BACKUP_NAME ??= 'BACKEND_BACKUP';
process.env.BACKUP_RETENTION_DAYS ??= '30';
process.env.BACKUP_ADMIN_EMAIL ??= 'admin@example.com';
process.env.BACKUP_SERVICE_EMAIL ??= 'backup@example.com';
process.env.S3_BUCKET ??= '';
process.env.BACKUP_ENCRYPTION_KEY ??= 'change-me-to-a-32-char-secret-key!!';
