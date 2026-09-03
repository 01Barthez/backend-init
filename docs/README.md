# Backend Init Documentation

This documentation explains how **Backend Init** is structured, how to extend
it, and how to run it in development and production. It is written for engineers
who will fork the template, replace the sample domain, and ship a real API.

## Documentation philosophy

Good template documentation does three jobs:

1. **Orient** — show where code lives and why, so a new contributor is
   productive in under an hour.
2. **Constrain** — state hard dependency rules so the modular monolith stays
   maintainable as modules grow.
3. **Enable** — give concrete recipes (new module, OAuth provider, storage swap)
   without inventing APIs that do not exist.

Prefer the source of truth in `src/` when docs and code diverge. Module-level
`README.md` files under `src/modules/*` are short, local contracts; this `docs/`
tree is the cross-cutting narrative.

## Quick links

| Audience            | Start here                                          |
| ------------------- | --------------------------------------------------- |
| First run           | [Getting started](./development/getting-started.md) |
| Architecture        | [Overview](./architecture/overview.md)              |
| Extend the template | [Extending](./architecture/extending.md)            |
| Ship to production  | [Production](./deployment/production.md)            |
| HTTP contract       | [OpenAPI](./api/README.md)                          |

## Contents

### Architecture

- [Overview](./architecture/overview.md) — modular monolith, layers, folder map,
  dependency flow
- [Platform kernel](./architecture/platform-kernel.md) — bootstrap, audit,
  flags, uploads, process roles
- [Modules catalog](./architecture/modules.md) — auth, users, rbac, oauth, blog,
  files, backup, notifications, system
- [Dependency rules](./architecture/dependency-rules.md) — what is allowed, what
  is forbidden
- [Extending](./architecture/extending.md) — add a module end to end
- [Configuration](./architecture/configuration.md) — `src/app/config` design
- [Architecture Decision Records](./architecture/decisions/README.md)

### Development

- [Getting started](./development/getting-started.md)
- [Contributing](./development/contributing.md) — also see root
  [CONTRIBUTING.md](../CONTRIBUTING.md)
- [Testing](./development/testing.md)
- [Coding standards](./development/coding-standards.md)

### Deployment

- [Docker](./deployment/docker.md)
- [Production](./deployment/production.md)
- [Observability](./deployment/observability.md)

### Guides

- [Authentication](./guides/authentication.md) — JWT, refresh rotation, OTP,
  TOTP
- [Storage providers](./guides/storage-providers.md) — MinIO vs S3, presign
- [Adding an OAuth provider](./guides/adding-oauth-provider.md)
- [Background jobs](./guides/background-jobs.md) — BullMQ queues and crons
- [Backups](./guides/backup.md) — encrypted Mongo dumps

### API

- [OpenAPI layout](./api/README.md) — components, paths, security,
  generate/validate
- Spec file: [`openapi.yaml`](./api/openapi.yaml)

## Related project files

| File                                        | Purpose                          |
| ------------------------------------------- | -------------------------------- |
| [README.md](../README.md)                   | Project overview and quick start |
| [CONTRIBUTING.md](../CONTRIBUTING.md)       | Contribution workflow            |
| [SECURITY.md](../SECURITY.md)               | Vulnerability reporting          |
| [CHANGELOG.md](../CHANGELOG.md)             | Release history                  |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Community standards              |
| [LICENSE](../LICENSE)                       | MIT                              |

## Conventions used in these docs

- Paths are repository-relative unless noted.
- Code samples use TypeScript and the `@/` path aliases defined in
  `tsconfig.json`.
- “Module” means a bounded context under `src/modules/<name>/`.
- Application code lives only under `src/app`, `src/modules`, and `src/shared`.
