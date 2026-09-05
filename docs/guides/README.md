# Guides

Task-oriented recipes for common Backend Init extensions.

## Documents

| Document                                               | Purpose                                  |
| ------------------------------------------------------ | ---------------------------------------- |
| [Authentication](./authentication.md)                  | JWT, refresh, OTP, TOTP + recovery codes |
| [Feature flags](./feature-flags.md)                    | Flagsmith + `FEATURE_*` env overrides    |
| [Scaffolding a module](./scaffolding-a-module.md)      | `npm run scaffold:module`                |
| [MongoDB indexes](./mongodb-indexes.md)                | Index push checklist + Atlas Search      |
| [Storage providers](./storage-providers.md)            | MinIO vs S3-compatible storage           |
| [Adding an OAuth provider](./adding-oauth-provider.md) | Wire a new social login provider         |
| [Background jobs](./background-jobs.md)                | BullMQ queues and cron workers           |
| [Backups](./backup.md)                                 | Encrypted Mongo dumps                    |

These guides assume the modular layout under `src/modules` and centralized
config from `@/app/config`.
