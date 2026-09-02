# ADR 003: Manual Dependency Injection Container

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

Modules need swappable adapters (Prisma repos, JWT, mailer, uploaders) for tests
and for forks that change infrastructure. DI frameworks (tsyringe, Awilix,
Inversify) offer lifetime management and decorators, but increase conceptual
load for a template audience and obscure wiring.

## Decision

Use a **manual composition root**:

- Each module exports `createDefaultXxxDeps` and `createXxxModule`
- `src/app/container/index.ts` builds an `AppContainer` with explicit factories
- Production code uses `getContainer()`; tests call
  `createContainer({ …overrides })` or module-level overrides
- No reflect-metadata requirement, no decorator-based injection

## Consequences

**Positive**

- Wiring is readable in one file
- Zero framework lock-in
- Trivial fakes in Vitest
- Easy to extract a module: take its factory with you

**Negative / trade-offs**

- Container file grows as modules are added (acceptable at template scale)
- No automatic circular-dependency detection from a DI graph
- Contributors must remember to register new modules in two places (container +
  routes)

**Alternatives considered**

- Awilix / tsyringe — rejected for onboarding and magic cost in an OSS starter
- Service locator antipattern scattered across modules — rejected; keep a single
  composition root
