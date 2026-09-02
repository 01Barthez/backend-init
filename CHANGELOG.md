# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Auth sessions no longer use `isActive` as a logout switch; logout blacklists the access `jti` and refresh family.
- Login lockout, hashed OTPs, single-use opaque password-reset tokens, and session revoke on password change.
- Login no longer re-activates admin-disabled accounts; `authenticate` reloads live `isActive` / `isVerified`.
- OAuth callback no longer puts tokens in the URL; post-login redirects are origin-allowlisted; provider tokens encrypted at rest.
- JWT verify pins RS256 + token `type`; PEM keys cached; cookie `maxAge` parsed as a real duration (`7d`).
- Stricter rate limit on login/OTP/forgot/reset; CSRF token endpoint no longer overwrites the csurf secret cookie.

### Changed

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
