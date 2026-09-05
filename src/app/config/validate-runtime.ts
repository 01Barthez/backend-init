import { existsSync, readFileSync } from 'fs';

import { config } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

/**
 * Boot-time sanity checks beyond env-var parsing.
 * Fails fast in production when crypto material or operator auth is misconfigured.
 */
export const validateRuntimeConfig = (): void => {
  const paths = [
    config.auth.jwt.privateKeyPath,
    config.auth.jwt.publicKeyPath,
    config.auth.jwt.refreshPrivateKeyPath,
    config.auth.jwt.refreshPublicKeyPath,
  ];

  for (const keyPath of paths) {
    if (!existsSync(keyPath)) {
      throw new Error(`JWT key file missing: ${keyPath} — run npm run keys:generate`);
    }
    const pem = readFileSync(keyPath, 'utf8');
    if (!pem.trim()) {
      throw new Error(`JWT key file is empty: ${keyPath}`);
    }
  }

  if (config.security.cookie.expiresInMs < 1_000) {
    throw new Error('COOKIE_EXPIRES_IN resolves to less than 1 second — use a duration like 7d');
  }

  if (config.app.isProduction) {
    const adminPassword = config.security.adminBasic.password || config.security.swagger.password;
    if (!adminPassword || adminPassword === 'admin') {
      throw new Error(
        'Set ADMIN_BASIC_PASSWORD to a non-default value before enabling operator UIs in production',
      );
    }

    if (!config.auth.encryptionKey.trim()) {
      throw new Error(
        'AUTH_ENCRYPTION_KEY is required in production (OAuth tokens / TOTP at rest)',
      );
    }

    if (!config.security.csrf.enabled) {
      throw new Error('ALLOW_CSRF_PROTECTION must be true in production (fail-closed)');
    }

    if (!config.security.cookie.secure) {
      throw new Error('COOKIE_SECURE must be true in production (fail-closed)');
    }

    if (!config.storage.clamav.required) {
      throw new Error('CLAMAV_REQUIRED must be true in production (fail-closed)');
    }

    const backupKey = config.queue.backup.encryptionKey.trim();
    if (!backupKey || backupKey.startsWith('change-me')) {
      throw new Error('BACKUP_ENCRYPTION_KEY must be set to a non-placeholder value in production');
    }

    if (config.security.swagger.enabled) {
      log.warn('Swagger UI is enabled in production — keep it off the public internet');
    }
  }

  log.info('Runtime configuration validated');
};

export default validateRuntimeConfig;
