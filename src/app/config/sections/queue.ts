/**
 * Background job / backup scheduling.
 * Cron expressions follow standard 5-field syntax (minute hour day month weekday).
 */
import { fromEnv } from '../env';

export const queueConfig = {
  backup: {
    name: fromEnv.get('BACKUP_NAME').default('BACKEND_BACKUP').asString(),
    cron: fromEnv.get('BACKUP_CRON').default('0 0 * * *').asString(),
    retentionDays: fromEnv.get('BACKUP_RETENTION_DAYS').default('30').asString(),
    encryptionKey: fromEnv.get('BACKUP_ENCRYPTION_KEY').default('').asString(),
    serviceEmail: fromEnv.get('BACKUP_SERVICE_EMAIL').default('backup@example.com').asString(),
    adminEmail: fromEnv.get('BACKUP_ADMIN_EMAIL').default('admin@example.com').asString(),
  },
  maintenanceCron: fromEnv.get('MAINTENANCE_CRON').default('0 0 * * *').asString(),
  blacklistPurgeCron: fromEnv.get('BLACKLIST_PURGE_CRON').default('0 */6 * * *').asString(),
} as const;

export type QueueConfig = typeof queueConfig;
