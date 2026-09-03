# Backup module

Scheduled MongoDB dump → streaming AES-256-GCM encryption (random salt per run)
→ object storage upload + admin notification mail.

`BACKUP_ENCRYPTION_KEY` must be set for a useful archive. Jobs register when
`PROCESS_ROLE` is `all` or `worker` and Flagsmith `enable_backup` is on (default
true).

Full operator notes: [docs/guides/backup.md](../../../docs/guides/backup.md).

## Layout

```
backup/
├── application/commands/run-mongo-backup.command.ts
├── infrastructure/mongodb-backup.provider.ts
├── index.ts
└── README.md
```

## Public API

```ts
import { runMongoBackup, createBackupModule, createDefaultBackupDeps } from '@/modules/backup';

await runMongoBackup();
```

## Wiring

`src/shared/infrastructure/queue/workers.ts` imports `runMongoBackup` from
`@/modules/backup`.

## Extension points

- Swap `MongoBackupProvider` for another dump strategy (e.g. filesystem-only,
  different cipher).
- Mail templates: `db-notification-success` / `db-notification-error` in shared
  mail templates.
