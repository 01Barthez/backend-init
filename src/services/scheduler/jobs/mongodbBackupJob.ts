import { exec } from 'child_process';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

import log from '@/services/logging/logger';
import type { Uploader } from '@/services/upload/core/Uploader';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';
import backupConfig from '../_config/backup';
import { getCurrentDatePath, getOldBackupDates } from '../_utils/dateUtils';
import type { NotificationService } from '../notifications/backup.notifications';

const execAsync = promisify(exec);

export class MongodbBackupJob {
  private isRunning = false;
  private task: any = null;
  private uploader?: Uploader;
  private notificationService?: NotificationService;

  constructor(dependencies?: { uploader?: Uploader; notificationService?: NotificationService }) {
    if (dependencies) {
      this.uploader = dependencies.uploader;
      this.notificationService = dependencies.notificationService;
    }
  }

  // Set uploader (can be called after construction if needed)
  setUploader(uploader: Uploader) {
    this.uploader = uploader;
  }

  // Set notification service (can be called after construction if needed)
  setNotificationService(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  async execute(): Promise<void> {
    if (!this.uploader) {
      log.error('Uploader is not available. Cannot execute backup job.');
      return;
    }

    if (this.isRunning) {
      log.warn('A backup is already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const backupId = uuidv4();
    const datePath = getCurrentDatePath();
    const timestamp = format(toZonedTime(new Date(), backupConfig.timezone), 'HH-mm-ss');
    const backupDir = path.join(backupConfig.mongo.dumpPath, backupId);
    const archiveName = `mongodb-${datePath}-${timestamp}.tar.gz`;
    const archivePath = path.join('/tmp', archiveName);

    try {
      log.info(`Starting MongoDB backup (ID: ${backupId})`);

      await fs.ensureDir(backupDir);

      await this.runMongoDump(backupDir);

      await this.createBackupArchive(backupDir, archivePath);

      const objectName = `mongodb/${datePath}/${backupConfig.mongo.dbName}/${archiveName}`;

      const fileContent = await fs.readFile(archivePath);
      const metadataString = `backup-type=mongodb;db=${backupConfig.mongo.dbName};created=${new Date().toISOString()}`;
      const filenameWithMetadata = `${path.basename(objectName, '.tar.gz')}_meta_${Buffer.from(metadataString).toString('base64')}.tar.gz`;

      await this.uploader.uploadBuffer(
        fileContent,
        {
          filename: filenameWithMetadata,
          contentType: 'application/gzip',
          size: fileContent.length,
        },
        {
          prefix: path.dirname(objectName),
        },
      );

      await this.cleanupOldBackups();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = (await fs.stat(archivePath)).size;
      const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

      if (this.notificationService) {
        try {
          await this.notificationService.sendBackupSuccess({
            backupPath: objectName,
            size: `${sizeInMB} MB`,
            duration: `${duration} seconds`,
          });
        } catch (error) {
          log.error('Failed to send backup success notification:', error);
        }
      }

      log.info(`Backup completed successfully in ${duration} seconds`);
    } catch (error) {
      if (this.notificationService) {
        try {
          await this.notificationService.sendBackupError(error as Error);
        } catch (notifError) {
          log.error('Failed to send backup error notification:', notifError);
        }
      }
      log.error('MongoDB backup error:', error);
    } finally {
      await fs
        .remove(backupDir)
        .catch((err) => log.error('Error cleaning up temporary directory:', err));
      await fs
        .remove(archivePath)
        .catch((err) => log.error('Error removing temporary archive:', err));
      this.isRunning = false;
    }
  }

  private async runMongoDump(outputDir: string): Promise<void> {
    try {
      const collections =
        backupConfig.mongo.collections.length > 0
          ? `--collection ${backupConfig.mongo.collections.join(' --collection ')}`
          : '';

      const command = `mongodump \
      --uri="${backupConfig.mongo.uri}" \
      --db=${backupConfig.mongo.dbName} \
      ${collections} \
      --out=${outputDir} \
      --gzip`;

      log.debug(`Running command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 50,
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/bin`,
        },
      });

      if (stderr) {
        log.warn('mongodump warnings:', stderr);
      }

      log.debug('mongodump output:', stdout);
    } catch (error) {
      throw new Error(`mongodump failed: ${error}`);
    }
  }

  private async createBackupArchive(sourceDir: string, outputPath: string): Promise<void> {
    try {
      const tarCommand = `tar -czf ${outputPath} -C ${path.dirname(sourceDir)} ${path.basename(sourceDir)}`;
      await execAsync(tarCommand);
      log.debug(`Archive created: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to create archive: ${error}`);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const oldBackupDates = getOldBackupDates(backupConfig.retentionDays);

      for (const date of oldBackupDates) {
        const prefix = `mongodb/${date}/`;
        // Implement deletion logic with storageService when available
      }
    } catch (error) {
      log.error('Error cleaning up old backups:', error);
    }
  }

  start(): void {
    if (!this.uploader) {
      log.warn('Uploader is not available. MongoDB backup job will not start.');
      return;
    }

    if (this.task) {
      this.task.stop();
    }

    const { schedule: cronSchedule, options } = schedulerConfig.backupJob;
    this.task = scheduler.schedule(cronSchedule, this.execute.bind(this), options);
    log.info('********************MongoDB Backup Job started********************');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
    }
    log.info('MongoDB backup job stopped');
  }
}
