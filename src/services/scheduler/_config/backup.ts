import { envs } from '@/config/env/env';

import type { BackupConfig } from '../_types/backup';

// Configuration for database backups using MongoDB and MinIO
const backupConfig: BackupConfig = {
  mongo: {
    uri: envs.MONGO_URL,
    dbName: envs.MONGO_DB,
    collections: ['users', 'posts'],
    dumpPath: '/tmp/mongodump',
  },
  minio: {
    endpoint: envs.MINIO_ENDPOINT,
    port: envs.MINIO_PORT,
    useSSL: envs.MINIO_USE_SSL,
    accessKey: envs.MINIO_ACCESS_KEY,
    secretKey: envs.MINIO_SECRET_KEY,
    bucketName: `${envs.APP_NAME}-db-backups`,
  },
  retentionDays: parseInt(envs.BACKUP_RETENTION_DAYS || '30', 10),
  timezone: envs.TIMEZONE,
  email: {
    from: envs.BACKUP_ADMIN_EMAIL,
    to: envs.BACKUP_ADMIN_EMAIL,
  },
};

export default backupConfig;
