# ADR 002: Prisma + MongoDB

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

The template needs a documented, typed persistence layer that works well in
Docker, supports flexible document-shaped aggregates (users, OAuth accounts,
blog posts, RBAC), and stays approachable for open-source contributors.

## Decision

Use **MongoDB** as the primary database and **Prisma** as the ORM / client
generation layer.

- Schema lives under `prisma/` (split models such as `auth`, `user`, `oauth`,
  `rbac`, `blog`)
- Runtime access goes through a shared Prisma client in
  `@/shared/infrastructure/database`
- Module repositories implement domain ports and map Prisma records to domain
  entities

Scripts:

- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:seed`

## Consequences

**Positive**

- Strong TypeScript types for queries and models
- Familiar workflow for many Node teams
- Easy local Bring-up with Compose (`mongo` service + replica set helper script)
- Repository ports keep domain code free of Prisma imports

**Negative / trade-offs**

- Prisma’s MongoDB feature set differs from relational workflows (no classic SQL
  migrations story in the same way)
- Schema design must respect MongoDB + Prisma constraints (e.g. id strategies)
- Swapping to PostgreSQL later requires new adapters and schema work — ports
  make this feasible but not free

**Alternatives considered**

- Mongoose alone — less unified typing story across the template
- PostgreSQL + Prisma — excellent fit for relational domains; deferred to keep
  the current document-oriented sample models
- Raw Mongo driver — too much boilerplate for a starter
