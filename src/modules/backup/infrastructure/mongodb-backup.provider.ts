import { execFile } from 'child_process';
import crypto from 'crypto';
import { format } from 'date-fns';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

import { envs } from '@/app/config';
import { STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';
import { queueMail } from '@/shared/infrastructure/mail/mail.service';
import { storageService } from '@/shared/infrastructure/storage';

const execFileAsync = promisify(execFile);

const encryptFile = async (inputPath: string, outputPath: string): Promise<void> => {
  if (!envs.BACKUP_ENCRYPTION_KEY) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required for encrypted backups');
  }

  const key = crypto.scryptSync(envs.BACKUP_ENCRYPTION_KEY, 'backup-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const input = await fs.readFile(inputPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();

  await fs.writeFile(outputPath, Buffer.concat([iv, authTag, encrypted]));
};

/**
 * Infrastructure provider: mongodump → AES-256-GCM → object storage + admin mail.
 */
export class MongoBackupProvider {
  async run(): Promise<void> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const backupDir = path.join('/tmp', 'backups');
    const archivePath = path.join(backupDir, `${envs.MONGO_DB}_${timestamp}.gz`);
    const encryptedPath = `${archivePath}.enc`;

    await fs.ensureDir(backupDir);

    try {
      await execFileAsync('mongodump', [
        `--uri=${envs.DATABASE_URL}`,
        `--archive=${archivePath}`,
        '--gzip',
      ]);

      await encryptFile(archivePath, encryptedPath);

      const objectKey = `mongodb/${format(new Date(), 'yyyy/MM/dd')}/${path.basename(encryptedPath)}`;
      await storageService.uploadFile({
        bucket: STORAGE_BUCKETS.BACKUPS,
        key: objectKey,
        filePath: encryptedPath,
        contentType: 'application/octet-stream',
      });

      await queueMail({
        to: envs.BACKUP_ADMIN_EMAIL,
        subject: `[${envs.APP_NAME}] Backup successful`,
        template: 'db-notification-success',
        data: { timestamp, objectKey },
      });

      log.info('MongoDB backup completed', { objectKey });
    } catch (error) {
      log.error('MongoDB backup failed', { error });

      await queueMail({
        to: envs.BACKUP_ADMIN_EMAIL,
        subject: `[${envs.APP_NAME}] Backup failed`,
        template: 'db-notification-error',
        data: { timestamp, error: String(error) },
      });

      throw error;
    } finally {
      await fs.remove(backupDir).catch(() => undefined);
    }
  }
}

export const mongoBackupProvider = new MongoBackupProvider();
