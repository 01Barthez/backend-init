# Background Jobs

Asynchronous work uses **BullMQ** on Redis. Queue factories, repeatable cron
registration, and workers live under `@/shared/infrastructure/queue`. Domain
handlers may live in modules (e.g. backup).

Registration is skipped when `PROCESS_ROLE=api`. Workers run when the role is
`all` or `worker`. Overlap on cron handlers is prevented with a Redis lock
(`withDistributedLock`).

## Queues

Defined via `QUEUE_NAMES` in shared constants and created in `queue.service.ts`:

| Queue       | Typical jobs                                           |
| ----------- | ------------------------------------------------------ |
| Mail        | Templated / transactional email payloads               |
| Backup      | MongoDB encrypted backup (`runMongoBackup`)            |
| Maintenance | Purge unverified users; purge expired blacklist; audit |
| Heavy tasks | Reserved for expensive work                            |

Default job options: 3 attempts, exponential backoff, bounded `removeOnComplete`
/ `removeOnFail`.

## Crons (repeatable jobs)

`registerRepeatableJobs()` clears existing repeatable jobs on the
backup/maintenance queues and re-adds them when Flagsmith allows:

| Job                      | Env / config           | Flag                      | Handler                               |
| ------------------------ | ---------------------- | ------------------------- | ------------------------------------- |
| `mongodb-backup`         | `BACKUP_CRON`          | `enable_backup`           | `@/modules/backup` → `runMongoBackup` |
| `purge-unverified-users` | `MAINTENANCE_CRON`     | `enable_maintenance_jobs` | maintenance user-cleanup              |
| `purge-blacklist`        | `BLACKLIST_PURGE_CRON` | `enable_maintenance_jobs` | auth blacklist purge                  |
| `purge-audit-logs`       | `AUDIT_PURGE_CRON`     | (always when workers run) | `auditRepository.purgeOlderThan`      |

Flags default to **true** when Flagsmith is unreachable. Also configure backup
retention, encryption key, and admin notification emails
(`config.queue.backup`). Audit retention: `AUDIT_RETENTION_DAYS` (default 365).

## Workers

`startWorkers()` in `workers.ts` boots BullMQ `Worker` instances once per
process:

- Mail worker → `sendMailDirect`
- Backup worker → `runMongoBackup`
- Maintenance worker → dispatches by `job.name` (including audit purge)

Ensure Redis is available before workers start. Concurrency is intentionally low
for backup/maintenance (1).

## Enqueueing mail

Prefer the notifications facade / mail queue helpers:

```ts
import { queueMail, sendTemplatedMail } from '@/modules/notifications';
```

Templates remain in `src/shared/infrastructure/mail/templates/`.

## Operator UI

Bull Board is mounted at `/admin/queues` (HTTP Basic **then** JWT **then**
`isAdmin`). It is not published through public Nginx. See
[Observability](../deployment/observability.md) and
[Production](../deployment/production.md).

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
- [Backups](./backup.md)
- [Observability](../deployment/observability.md)
