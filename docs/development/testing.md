# Testing

Backend Init uses **Vitest** multi-project suites, path aliases, and Supertest.

See also: [`tests/README.md`](../../tests/README.md) and
[`.github/README.md`](../../.github/README.md).

## Layout

```
tests/
├── setup/            # unit / integration / e2e / contract setups
├── fixtures/
├── factories/
├── helpers/
├── unit/modules|shared
├── integration/api|database|cache|queue|storage
├── e2e/journeys
├── contract/openapi
└── load/             # not executed by Vitest
```

## Commands

```bash
npm run test:unit
npm run test:integration
npm run test:integration:live   # RUN_LIVE_INFRA=1 (+ optional Testcontainers)
npm run test:e2e
npm run test:contract
npm run test:coverage
npm run test:ci
npm run validate
```

## Strategy

| Kind             | Target                        | Doubles                         |
| ---------------- | ----------------------------- | ------------------------------- |
| Unit             | Commands, domain, utils       | Fake ports                      |
| Integration API  | Routers + middleware          | Offline Prisma/Redis mocks      |
| Integration live | Mongo / Redis / MinIO / queue | Real services or Testcontainers |
| E2E              | Multi-step HTTP journeys      | Offline doubles by default      |
| Contract         | OpenAPI document              | File-based                      |

Stack note: **MongoDB + Redis + MinIO** (not PostgreSQL / RabbitMQ).

Contract tests validate the **generated** `docs/api/openapi.yaml`, not the
modular YAML fragments under `docs/api/paths/`. After changing routes, update
`openapi.config.js` (and fragments if you keep them), then
`npm run generate:openapi`.

## Mocking ports

Prefer `createDefaultXxxDeps(overrides)` / `createContainer(overrides)` over
global Prisma mocks when testing a single use case.

## CI

GitHub Actions `ci.yml` runs lint → typecheck → unit → integration → e2e →
contract → coverage → build.
