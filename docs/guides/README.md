# Guides

Task-oriented recipes for common Backend Init extensions.

## Documents

| Document                                               | Purpose                          |
| ------------------------------------------------------ | -------------------------------- |
| [Authentication](./authentication.md)                  | JWT, refresh rotation, OTP       |
| [Storage providers](./storage-providers.md)            | MinIO vs S3-compatible storage   |
| [Adding an OAuth provider](./adding-oauth-provider.md) | Wire a new social login provider |
| [Background jobs](./background-jobs.md)                | BullMQ queues and cron workers   |

These guides assume the modular layout under `src/modules` and centralized
config from `@/app/config`.
