import { Client as Minio } from 'minio';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

// Configuration du client MinIO avec timeouts appropriés
const minioConfig = {
  endPoint: envs.MINIO_ENDPOINT || 'localhost',
  port: envs.MINIO_PORT ? Number(envs.MINIO_PORT) : 9000,
  useSSL: envs.MINIO_USE_SSL,
  accessKey: envs.MINIO_ACCESS_KEY!,
  secretKey: envs.MINIO_SECRET_KEY!,
};

log.info('Initializing MinIO client', {
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey?.substring(0, 4) + '***',
});

export const minioClient = new Minio(minioConfig);
