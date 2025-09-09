import { Client as Minio } from 'minio';

import { envs } from '@/config/env/env';

export const minioClient = new Minio({
  endPoint: envs.MINIO_ENDPOINT || 'localhost',
  port: envs.MINIO_PORT ? Number(envs.MINIO_PORT) : 9000,
  useSSL: envs.MINIO_USE_SSL,
  accessKey: envs.MINIO_ACCESS_KEY!,
  secretKey: envs.MINIO_SECRET_KEY!,
});
