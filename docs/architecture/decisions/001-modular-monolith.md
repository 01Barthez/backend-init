# ADR 001: Modular Monolith

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

Backend Init is an open-source starter for teams that need a production-shaped
Express API quickly. Microservices would force network boundaries, duplicated
auth, distributed tracing, and heavier ops before most forks have product-market
fit.

A classic layered folder dump (`controllers/`, `services/` only) scales poorly:
domains blur, tests couple to infrastructure, and extracting a feature later
requires archaeology.

## Decision

Ship a **modular monolith**:

- One deployable Node process
- Bounded contexts under `src/modules/*` with Presentation → Application →
  Domain ← Infrastructure
- Shared infrastructure under `src/shared/infrastructure`
- Explicit composition root under `src/app` (config, container, route mounting)

Modules may share the database and Redis. They must not import each other’s
infrastructure layers.

## Consequences

**Positive**

- Simple local development (one Compose stack)
- Clear ownership and onboarding path
- Modules can be extracted later by moving a folder + factory
- Tests override ports without spinning a service mesh

**Negative / trade-offs**

- Process-wide failure modes remain (one bad leak can affect all modules)
- Requires discipline; dependency rules need review (and ideally ESLint
  boundaries)
- Shared Prisma schema can become a coupling point if not curated

**Alternatives considered**

- Microservices from day one — rejected as operationally heavy for a template
- Pure layered architecture without modules — rejected for weak domain
  boundaries
