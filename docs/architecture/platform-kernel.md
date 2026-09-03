# Platform kernel

Cross-cutting infrastructure shared by all modules. Keeps domain code free of
Express, Prisma, Redis, and outbound HTTP details.

## Bootstrap and shutdown

HTTP listen is **not** part of `createApp()`. `src/index.ts` calls
`bootstrapApplication()` first (RBAC seed, buckets, SMTP verify, workers), then
listens unless `PROCESS_ROLE=worker`. SIGTERM/SIGINT drain HTTP (25s), stop
workers, close queues/Redis/Prisma. Details:
[production.md](../deployment/production.md).

## Request context (AsyncLocalStorage)

Every HTTP request opens an ALS scope via `requestContextMiddleware`:

- **`X-Request-Id`** — echoed on responses; included in error JSON and
  structured logs.
- **`userId`** — set after JWT authentication for audit and log correlation.
- **`ip` / `userAgent`** — captured for audit entries.
- **W3C `traceparent`** — parsed into ALS. `OTEL_ENABLED` is reserved; this
  template does **not** start the OpenTelemetry SDK.

Use `getRequestContext()` and `getLogMeta()` from
`@/shared/infrastructure/request-context` in infrastructure code only.

## HTTP pipeline

| Concern          | Implementation                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| Access logging   | `http-log.middleware.ts` (no body capture)                              |
| RED metrics      | `http_request_duration_seconds`, `http_requests_total`                  |
| HPP mitigation   | `firstValueQueryParser` — first duplicate query value wins              |
| Maintenance mode | `MAINTENANCE_MODE=true` → 503 (health/metrics bypass)                   |
| Console noise    | Muted once at process boot in production                                |
| Operator Basic   | Swagger, `/metrics`, Bull Board (`ADMIN_BASIC_*`, fallback `SWAGGER_*`) |

Nginx (`infra/nginx/default.conf`) publishes only `/health` and `/api/`. See
[docker.md](../deployment/docker.md).

## Health

| Path                | Checks            |
| ------------------- | ----------------- |
| `GET /health`       | Mongo + Redis     |
| `GET /health/ready` | Same as `/health` |
| `GET /health/live`  | Process only      |

## Audit trail

`AuditPort` (`@/shared/infrastructure/audit`) appends security events to
`AuditLog` (Mongo via Prisma). Wired on:

- Password change / reset
- User soft-delete and hard-delete
- Role change
- OAuth unlink
- Blog publish
- TOTP enroll / confirm / disable
- Session revoke

Failures are logged and never block the use case.

Operators with `audit:read` can list entries at `GET /api/v1/admin/audit` (limit
capped at 100). Retention: `AUDIT_PURGE_CRON` / `AUDIT_RETENTION_DAYS`
(maintenance worker).

## Distributed locks

`LockPort` + `withDistributedLock` wrap BullMQ cron handlers so only one
instance runs backup, maintenance, and audit-purge jobs in multi-node
deployments.

## Outbound HTTP

`createSafeHttpClient` defaults: 10s timeout, no redirects, 1 MB response cap.
OAuth providers use this client. Add private-IP blocking when URLs become
user-controlled.

## Search

`SearchPort` with a Mongo `contains` adapter for demo blog search
(`GET /api/v1/blogs/search?q=`). Swap for Typesense/Meilisearch at scale.

## Feature flags

Defaults when Flagsmith is unreachable (`config.features.flagsmith.defaults`):

| Flag                      | Default | Effect                                  |
| ------------------------- | ------- | --------------------------------------- |
| `enable_oauth`            | true    | Authorize, callback, Telegram, unlink   |
| `enable_backup`           | true    | Repeatable Mongo backup job             |
| `enable_maintenance_jobs` | true    | Unverified-user + blacklist purge crons |

## Idempotency

Opt-in via `Idempotency-Key` header on `POST /auth/signup`. The Redis key is
bound to the actor (user id or client IP). An in-flight `SET NX` lock returns
409 if the same key is reused concurrently. Successful responses are cached for
24h.

## Uploads

| Path                    | Limit                        |
| ----------------------- | ---------------------------- |
| Multipart avatars (API) | `API_UPLOAD_MAX_BYTES` (2MB) |
| Presigned PUT           | `PRESIGN_UPLOAD_MAX_BYTES`   |
| Presign TTL             | `PRESIGN_TTL_SECONDS`        |
| Nginx body              | 2m                           |

Magic-byte sniff on multipart. ClamAV fail-open unless `CLAMAV_REQUIRED=true`.

## Process roles

`PROCESS_ROLE=all` (default), `api` (HTTP only, no BullMQ workers), or `worker`
(workers only, no HTTP listen). Invalid values fall back to `all`.

## Configuration

| Variable                                    | Purpose                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| `MAINTENANCE_MODE`                          | Global 503 except probes                               |
| `DISABLE_CONSOLE_LOGS`                      | Mute console at boot in production                     |
| `TRUST_PROXY_HOPS`                          | Express `trust proxy` hop count (set `1` behind Nginx) |
| `PROCESS_ROLE`                              | `all` / `api` / `worker`                               |
| `CLIENT_URLS`                               | Extra CORS origins (CSV)                               |
| `REDIS_TLS`                                 | Enable TLS for Redis                                   |
| `CLAMAV_REQUIRED`                           | Fail uploads when ClamAV is unreachable                |
| `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` | Operator HTTP Basic                                    |
| `AUDIT_PURGE_CRON` / `AUDIT_RETENTION_DAYS` | Audit retention worker                                 |
| `LOKI_HOST`                                 | Loki push URL when `LOKI_ENABLED`                      |
| `OTEL_ENABLED`                              | Reserved; this template does not start the OTEL SDK    |

Boot-time JWT key and cookie TTL validation runs via `validateRuntimeConfig()`
(skipped in `NODE_ENV=test`).

## ESLint boundaries

`src/**/domain/**` files must not import Express, Prisma, Redis, axios, or
BullMQ. Enforced via `no-restricted-imports` in `eslint.config.mjs`.
