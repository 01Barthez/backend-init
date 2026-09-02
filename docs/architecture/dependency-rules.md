# Dependency Rules

These rules are the main defense against a modular monolith collapsing into a
ball of mud. They are enforced by convention today; treat violations as review
blockers even when ESLint does not yet fail the build.

## Hard rules

1. **Domain depends on nothing framework-specific.** No Express, Prisma Client,
   Redis, MinIO, BullMQ, Nodemailer, or Axios inside `domain/`.
2. **Dependencies point inward.** `presentation → application → domain`.
   `infrastructure → domain` (implements ports). Never the reverse.
3. **Modules do not import each other’s infrastructure.** Cross-module
   collaboration goes through:
   - Application ports / adapters (preferred), or
   - Explicit public exports from the other module’s `index.ts` / domain types.
4. **Never read `process.env` outside `src/app/config`.** Import `config` or the
   transitional `envs` mirror from `@/app/config`.
5. **`shared/` is cross-cutting only.** If only one module needs it, it belongs
   in that module.
6. **Presentation does not talk to Prisma.** Controllers call use cases;
   repositories live in infrastructure.
7. **Composition root owns wiring.** Concrete adapters are constructed in
   `createDefaultXxxDeps` and assembled in `src/app/container`.

## Forbidden patterns

| Forbidden                                                     | Prefer                                           |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `import prisma from '…'` in a controller                      | Inject a repository port / use a command         |
| Module A importing Module B’s `infrastructure/repositories/*` | Export a port or facade from B’s public API      |
| Putting blog-specific helpers in `shared/utils`               | Keep them under `modules/blog`                   |
| New DI framework (tsyringe, awilix) without an ADR            | Extend the manual container                      |
| Circular imports between modules                              | Extract a shared port or move the type to domain |
| Duplicating the User entity in users                          | Import from `@/modules/auth` domain              |

## Allowed cross-module edges (current design)

```
rbac  ◄── auth (default role, permission context)
rbac  ◄── users (assign role)
auth  ◄── users (User entity types)
files ◄── auth / users (avatar upload adapters)
notifications / shared mail  ◄── auth, users, backup, oauth
shared storage  ◄── backup, files (as appropriate)
```

OAuth shares token / mail / RBAC-style ports with auth via adapters, not by
reaching into auth infrastructure folders.

## ESLint / boundaries guidance

The current `eslint.config.mjs` focuses on TypeScript hygiene, import cleanup,
security, and Sonar rules. It does **not** yet ship `eslint-plugin-boundaries`
or a hard `no-restricted-imports` matrix for layers.

Recommended practice for contributors and forks:

1. **Review checklist** — reject PRs that import Prisma or Express into
   `domain/`.
2. **Optional hardening** — add path-based `no-restricted-imports` for
   `**/domain/**` blocking `@prisma/client`, `express`, `ioredis`, `bullmq`,
   `minio`.
3. **Optional plugin** — `eslint-plugin-boundaries` with elements
   `domain | application | infrastructure | presentation | shared | app`.
4. **Keep tests free to mock** — test doubles belong under `tests/`; do not
   weaken production import rules to make tests pass.

Until automated boundaries land, module `README.md` dependency tables are
normative.

## `shared/` hygiene

**Belong in shared**

- Prisma client singleton
- Logger / security logger
- Redis + local cache facade
- Mail transporter, templates, queue helpers
- Object storage facade (`STORAGE_PROVIDER`)
- BullMQ queue factory and worker bootstrap
- Prometheus metrics helpers
- HTTP response helpers, OTP/password utilities used by multiple modules
- `AppError` and truly shared constants

**Do not put in shared**

- Use cases for a single domain
- Prisma mappers for a single aggregate
- Provider-specific OAuth implementations (those live in `modules/oauth`)
- One-off controllers or routes

When in doubt: start inside the module. Promote to `shared/` only after a second
consumer appears.

## Path aliases

Prefer aliases over deep relative imports:

| Alias          | Target           |
| -------------- | ---------------- |
| `@/`           | `src/`           |
| `@/app`        | `src/app`        |
| `@/modules`    | `src/modules`    |
| `@/shared`     | `src/shared`     |

Use these aliases only. There are no legacy `@/services` / `@/controllers` paths.

## Related

- [Overview](./overview.md)
- [Extending](./extending.md)
- [ADR 003 — Dependency injection](./decisions/003-dependency-injection.md)
