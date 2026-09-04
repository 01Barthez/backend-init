# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Fail-closed bootstrap: HTTP listen happens after RBAC seed, bucket ensure, and
  (non-api) workers.
- JWT keys live in `keys/` (gitignored). Image does not `COPY` PEMs; Compose
  mounts `./keys`.
- Swagger/Bull Board/metrics require operator Basic auth. Nginx exposes only
  `/health` and `/api`.
- Redis-backed rate limits; probes skipped. Auth limiter skips successful
  requests.
- Multer API uploads capped at 2MB; magic-byte checks; ClamAV injected
  (fail-open unless `CLAMAV_REQUIRED`).
- Optional TOTP (`AUTH_ENCRYPTION_KEY`). Login returns `TOTP_REQUIRED` when
  enabled.
- Hard-delete anonymizes PII before attempting row removal (blogs keep an author
  stub).
- Idempotency keys bound to actor/IP with an in-flight lock.
- Audit query (`GET /api/v1/admin/audit`, `audit:read`) and retention purge
  cron.
- Audit investigation: `GET /admin/audit/{auditId}` (metadata + userAgent),
  `GET /admin/audit/export` (CSV/JSON, ≤ 10_000), filters `requestId` /
  `from` / `to` on list and export.

### Added

- `npm run scaffold:module` — full vertical-slice module generator (CRUD,
  Prisma, OpenAPI, unit test, optional `--wire` for container/routes/RBAC).

### Changed

- `PROCESS_ROLE` (`all` / `api` / `worker`). Dev runner is `tsx watch`, not Bun.
- Streaming backup encryption with a random salt.
- Removed HTTP `DELETE /users/clear-all` and the `usersHandlers` singleton.
- OpenAPI lives only at `docs/api/openapi.yaml`.

### Added

- Operator and architecture documentation for process roles, fail-closed boot,
  Nginx public surface, Basic-auth operator UIs, files/presign, audit admin,
  TOTP/sessions, JWT `keys/` layout, ADRs 004–005, and Prisma README.
- Enterprise users admin/self-service routes: invite, activate/deactivate,
  verify-email, unlock, revoke-sessions, admin PATCH, avatar delete,
  self-delete, paginated search, filtered export; restore reactivates verified
  accounts.
- `GET /api/v1/auth/me`, sessions, TOTP enroll/confirm/disable.
- `GET`/`POST /api/v1/files/presign` for large objects.
- `GET /health/live` and `/health/ready`.
- `docs/guides/backup.md` and `keys/README.md`.

- Auth sessions no longer use `isActive` as a logout switch; logout blacklists
  the access `jti` and refresh family.
- Login lockout, hashed OTPs, single-use opaque password-reset tokens, and
  session revoke on password change.
- Login no longer re-activates admin-disabled accounts; `authenticate` reloads
  live `isActive` / `isVerified`.
- OAuth callback no longer puts tokens in the URL; post-login redirects are
  origin-allowlisted; provider tokens encrypted at rest.
- JWT verify pins RS256 + token `type`; PEM keys cached; cookie `maxAge` parsed
  as a real duration (`7d`).
- Stricter rate limit on login/OTP/forgot/reset; CSRF token endpoint no longer
  overwrites the csurf secret cookie.

### Changed

- Middleware pipeline: removed Morgan/per-request console mute/body logging;
  pagination is per-route only.
- Error JSON includes `requestId`; mail queue jobs carry correlation id from
  ALS.
- OAuth uses `createSafeHttpClient`; sensitive commands write audit entries.
- Migrated the codebase to a **modular monolith**: bounded contexts under
  `src/modules/*` with Presentation → Application → Domain ← Infrastructure
  layering.
- Introduced `src/app` as the composition root (typed `config`, manual DI
  `container`, central route mounting).
- Consolidated cross-cutting adapters under `src/shared/infrastructure`
  (database, cache, mail, queue, storage, logging, metrics).
- Reorganized OpenAPI assets under `docs/api/` and expanded English project
  documentation under `docs/`.

### Added

- Platform kernel: request context (ALS + `X-Request-Id`), unified HTTP
  logging/RED metrics, maintenance mode, HPP-safe query parser, audit trail,
  Redis distributed locks for crons, safe outbound HTTP client, blog search,
  OAuth feature flag, opt-in signup idempotency.
- `docs/architecture/platform-kernel.md` — cross-cutting infrastructure
  reference.
- Module factories (`createXxxModule` / `createDefaultXxxDeps`) for auth, users,
  rbac, oauth, blog, files, backup, notifications, and system surfaces.
- Architecture Decision Records for modular monolith, Prisma + MongoDB, and
  manual DI.
- Root community files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `LICENSE`.
- ESLint bans on `process.env` (outside `app/config`) and application
  `console.log`.

### Removed

- Legacy trees `src/controllers`, `src/services`, `src/routes`,
  `src/middlewares`, `src/utils`, `src/core`, and `src/config`. Source of truth
  is only `src/app`, `src/modules`, and `src/shared`.

## [1.0.0] - 2024-12-19

### Added

- Initial Express + TypeScript backend template with JWT auth, OAuth providers,
  MongoDB/Prisma, Redis, MinIO, OpenAPI, Vitest, and Docker Compose tooling.
