# Backup module

Scheduled MongoDB dump → AES-256-GCM encryption → object storage upload + admin
notification mail.

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

// Called by BullMQ BACKUP worker
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

## Compatibility

- `src/services/backup/mongodb-backup.service.ts` re-exports `runMongoBackup`.
