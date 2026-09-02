import { RunMongoBackupCommand } from './application/commands/run-mongo-backup.command';
import { MongoBackupProvider, mongoBackupProvider } from './infrastructure/mongodb-backup.provider';

export type BackupModuleDeps = {
  backupProvider: MongoBackupProvider;
};

export type BackupModule = {
  deps: BackupModuleDeps;
  useCases: {
    runMongoBackup: RunMongoBackupCommand;
  };
};

export function createDefaultBackupDeps(
  overrides: Partial<BackupModuleDeps> = {},
): BackupModuleDeps {
  return {
    backupProvider: overrides.backupProvider ?? mongoBackupProvider,
  };
}

export function createBackupModule(deps: BackupModuleDeps): BackupModule {
  return {
    deps,
    useCases: {
      runMongoBackup: new RunMongoBackupCommand(deps),
    },
  };
}

/** Queue-worker entry point — runs the default backup use case. */
export async function runMongoBackup(): Promise<void> {
  await createBackupModule(createDefaultBackupDeps()).useCases.runMongoBackup.execute();
}

export { MongoBackupProvider, mongoBackupProvider };
export { RunMongoBackupCommand };
export default runMongoBackup;
