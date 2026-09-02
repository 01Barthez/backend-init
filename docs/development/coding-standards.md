# Coding Standards

Standards exist to keep forks readable and modules replaceable — not to perform
architecture theater.

## Naming

| Element             | Convention       | Example                    |
| ------------------- | ---------------- | -------------------------- |
| Folders / files     | kebab-case       | `refresh-token.command.ts` |
| Functions / methods | camelCase        | `createDefaultAuthDeps`    |
| Classes             | PascalCase       | `PrismaUserRepository`     |
| Constants           | UPPER_SNAKE_CASE | `QUEUE_NAMES`              |
| Prisma models       | PascalCase       | `OAuthAccount`             |
| Prisma fields       | camelCase        | `createdAt`                |
| Env vars            | UPPER_SNAKE_CASE | `STORAGE_PROVIDER`         |

Prefer domain verbs: `assignRole`, `runMongoBackup`, `sendTemplatedMail`. Avoid
`handleData`, `processItem`, `manager`, `helper` as primary names.

## Comments

Comment **why**, constraints, and hazards — not what the next line obviously
does.

Good: why refresh tokens rotate, why a cron is idempotent, why a port exists.  
Bad: `// create user` above `createUser()`.

## Layers (pragmatic SOLID / KISS)

Apply SOLID where it reduces coupling; ignore ceremony that does not.

| Principle | Practical rule here                                           |
| --------- | ------------------------------------------------------------- |
| S         | One use case class ≈ one user intention                       |
| O         | New storage provider = new adapter, not a rewrite of commands |
| L         | Port implementations honor the contract tests expect          |
| I         | Narrow ports (`MailerPort`) over god-interfaces               |
| D         | Domain depends on ports; container supplies adapters          |

KISS / YAGNI:

- Do not add a message bus, CQRS toolkit, or DI framework unless an ADR
  justifies it.
- Prefer a second copy of a five-line mapper over a premature shared
  abstraction.
- Blog is a **sample domain** — replace it; do not generalize it into a CMS
  framework inside the template.

## Module code shape

- Controllers stay thin: validate → call use case → serialize.
- Domain errors extend or map through shared `AppError` patterns.
- Infrastructure mappers isolate Prisma shapes from entities.
- Public surface is `index.ts`; deep imports of another module’s internals are a
  smell.

## Imports and style

- Run Prettier / ESLint; do not disable rules casually in app code.
- Prefer type-only imports where ESLint requires (`consistent-type-imports`).
- No secrets in source; no `console.log` for operational logging — use the
  shared logger.

## Security-minded defaults

- Authenticate before authorize; use existing middleware (`authenticate`,
  verified/active checks, RBAC).
- Validate uploads; treat scanners as defense in depth, not the only control.
- Never log tokens, passwords, or raw OTP values.

## Related

- [Dependency rules](../architecture/dependency-rules.md)
- [Contributing](./contributing.md)
