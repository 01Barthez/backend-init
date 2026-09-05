# Scaffolding a module

Use the built-in scaffold CLI to generate a **complete vertical slice** (not an
empty folder tree): domain, application, infrastructure, presentation, Prisma
model, OpenAPI paths, and a unit test.

## Quick start

```bash
# Generate files only
npm run scaffold:module -- orders

# Generate + wire container, routes, OpenAPI index/tags, permissions, RBAC seed
npm run scaffold:module -- orders --wire

# Preview
npm run scaffold:module -- invoice --wire --dry-run
```

## What you get

| Artefact                               | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| `src/modules/<plural>/`                | Full modular layout matching `blog`        |
| CRUD commands/queries                  | create / update / soft-delete / get / list |
| Ownership gates                        | `:own` + admin `:any` elevation            |
| `prisma/models/<singular>.prisma`      | Soft-delete Mongo model                    |
| `docs/api/generator/paths/<plural>.js` | OpenAPI path stubs                         |
| Unit test                              | `Create*Command` with fake repository      |

Placeholder fields are `title` + `description` + `ownerId` — replace them with
your real domain.

## Flags

| Flag             | Meaning                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--wire`         | Patch composition root, routes, OpenAPI, `SYSTEM_PERMISSIONS`, admin/user seed                                        |
| `--with-audit`   | Inject optional `AuditPort.record` into create / update / delete commands (and wire `auditRepository` in module deps) |
| `--force`        | Overwrite existing scaffold files                                                                                     |
| `--dry-run`      | Print actions without writing                                                                                         |
| `--mount <slug>` | Force folder/URL plural (e.g. `--mount order-items`)                                                                  |

```bash
npm run scaffold:module -- invoices --wire --with-audit
```

Reserved names (template modules) are rejected: `auth`, `users`, `blog`, …
`oauth`, `files`, `rbac`, `system`, etc.

## After scaffolding

1. Review the Prisma model → `npm run prisma:generate && npm run prisma:push`
2. If you did not use `--wire`, follow
   [Extending the template](../architecture/extending.md) steps 4–5
3. `npm run generate:openapi`
4. `npm run test:unit -- tests/unit/modules/<plural>`
5. Add a catalogue entry in [modules.md](../architecture/modules.md)
6. Restart the API (and re-seed RBAC if permissions were added while the process
   was already up)

## Design intent

The CLI optimizes for **shipping a credible first slice** aligned with this
template’s patterns. It does not invent a second architecture. Prefer editing
generated code over extending the generator with one-off flags. `--with-audit`
is the exception for a common security concern — keep metadata light.
