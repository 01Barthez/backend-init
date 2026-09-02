# Background Jobs

Asynchronous work uses **BullMQ** on Redis. Queue factories, repeatable cron
registration, and workers live under `@/shared/infrastructure/queue`. Domain
handlers may live in modules (e.g. backup).

## Queues

Defined via `QUEUE_NAMES` in shared constants and created in `queue.service.ts`:

| Queue       | Typical jobs                                            |
| ----------- | ------------------------------------------------------- |
| Mail        | Templated / transactional email payloads                |
| Backup      | MongoDB encrypted backup (`runMongoBackup`)             |
| Maintenance | Purge unverified users; purge expired blacklist entries |
| Heavy tasks | Reserved for expensive work                             |

Default job options: 3 attempts, exponential backoff, bounded `removeOnComplete`
/ `removeOnFail`.

## Crons (repeatable jobs)

`registerRepeatableJobs()` clears existing repeatable jobs on the
backup/maintenance queues and re-adds:

| Job                      | Env / config           | Handler                               |
| ------------------------ | ---------------------- | ------------------------------------- |
| `mongodb-backup`         | `BACKUP_CRON`          | `@/modules/backup` → `runMongoBackup` |
| `purge-unverified-users` | `MAINTENANCE_CRON`     | maintenance user-cleanup service      |
| `purge-blacklist`        | `BLACKLIST_PURGE_CRON` | auth blacklist purge                  |

Also configure backup-related settings: retention, encryption key, admin
notification emails (`config.queue.backup`).

## Workers

`startWorkers()` in `workers.ts` boots BullMQ `Worker` instances once per
process:

- Mail worker → `sendMailDirect`
- Backup worker → `runMongoBackup`
- Maintenance worker → dispatches by `job.name`

Ensure Redis is available before workers start. Concurrency is intentionally low
for backup/maintenance (1).

## Enqueueing mail

Prefer the notifications facade / mail queue helpers:

```ts
import { queueMail, sendTemplatedMail } from '@/modules/notifications';
```

Templates remain in `src/shared/infrastructure/mail/templates/`.

## Operator UI

Bull Board is mounted via the system module (`setupBullBoard`). Restrict access
in production. See [Observability](../deployment/observability.md).

## Adding a job

1. Choose an existing queue or add a name to `QUEUE_NAMES` + `createQueue`.
2. Implement the handler (module use case preferred).
3. Register a worker processor in `workers.ts`.
4. For schedules, add a repeatable job in `registerRepeatableJobs` and document
   the cron env var.
5. Add failure logging and, if user-visible, notification templates.

## Related

- [Modules — backup / notifications / system](../architecture/modules.md)
- [Storage providers](./storage-providers.md)
- [Observability](../deployment/observability.md)
