import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

import type { MongoBackupProvider } from '../../infrastructure/mongodb-backup.provider';

export type RunMongoBackupCommandDeps = {
  backupProvider: MongoBackupProvider;
};

/**
 * Runs an encrypted MongoDB dump and uploads it to object storage.
 * Intended to be invoked by the backup queue worker.
 */
export class RunMongoBackupCommand {
  constructor(private readonly deps: RunMongoBackupCommandDeps) {}

  async execute(): Promise<void> {
    log.info('Starting MongoDB backup', { database: envs.MONGO_DB });
    await this.deps.backupProvider.run();
  }
}
