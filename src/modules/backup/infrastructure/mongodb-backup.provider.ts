import { execFile } from 'child_process';
import crypto from 'crypto';
import { format } from 'date-fns';
import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';

import { config, envs } from '@/app/config';
import { STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';
import { queueMail } from '@/shared/infrastructure/mail/mail.service';
import { storageService } from '@/shared/infrastructure/storage';

const execFileAsync = promisify(execFile);

/**
 * Stream AES-256-GCM encryption. Salt is random per backup (not a hardcoded string).
 */
const encryptFileStreaming = async (inputPath: string, outputPath: string): Promise<void> => {
  const keyMaterial = config.queue.backup.encryptionKey || envs.BACKUP_ENCRYPTION_KEY;
  if (!keyMaterial) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required for encrypted backups');
  }

  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(keyMaterial, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  await fs.writeFile(outputPath, Buffer.concat([salt, iv]));
  await pipeline(
    createReadStream(inputPath),
    cipher,
    createWriteStream(outputPath, { flags: 'a' }),
  );

  const authTag = cipher.getAuthTag();
  await fs.appendFile(outputPath, authTag);
};

/**
 * Infrastructure provider: mongodump → AES-256-GCM (streamed) → object storage + admin mail.
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

      await encryptFileStreaming(archivePath, encryptedPath);

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
