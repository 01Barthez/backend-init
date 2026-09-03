# Dependency Rules

These rules are the main defense against a modular monolith collapsing into a
ball of mud. Treat violations as review blockers. Domain-layer SDK imports are
also **enforced by ESLint**.

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

## ESLint / boundaries

`eslint.config.mjs` already fails the build when `src/**/domain/**` imports:

- `express`
- `@prisma/client`
- `ioredis`
- `axios`
- `bullmq`

`process.env` is banned outside `src/app/config` (`no-restricted-syntax`).
Application `console.log` is banned in `src/modules` and `src/shared` (logger
bootstrap and the CLI banner are excepted).

Recommended extras for forks:

1. **Review checklist** — still reject MinIO/Nodemailer in `domain/` (not yet in
   the restricted-import list).
2. **Optional plugin** — `eslint-plugin-boundaries` with elements
   `domain | application | infrastructure | presentation | shared | app`.
3. **Keep tests free to mock** — test doubles belong under `tests/`; do not
   weaken production import rules to make tests pass.

Module `README.md` dependency tables remain normative for layer direction.

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

| Alias       | Target        |
| ----------- | ------------- |
| `@/`        | `src/`        |
| `@/app`     | `src/app`     |
| `@/modules` | `src/modules` |
| `@/shared`  | `src/shared`  |

Use these aliases only. There are no legacy `@/services` / `@/controllers`
paths.

## Related

- [Overview](./overview.md)
- [Extending](./extending.md)
- [ADR 003 — Dependency injection](./decisions/003-dependency-injection.md)
