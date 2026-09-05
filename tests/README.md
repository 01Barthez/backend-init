# Tests

Professional Vitest layout for this modular Express template.

```
tests/
├── setup/                 # Per-project Vitest setup (unit / integration / e2e / contract)
├── fixtures/              # Static sample payloads
├── factories/             # Domain builders (prefer over fixtures in unit tests)
├── helpers/               # Test server, DB, assertions
├── mocks/                 # Shared doubles (optional)
├── unit/
│   ├── modules/           # Use cases / domain per module (mocked ports)
│   ├── shared/            # Shared kernel (errors, crypto, …)
│   └── fixtures/          # Fixture unit checks
├── integration/
│   ├── api/               # HTTP + wiring (offline Prisma/Redis doubles)
│   ├── database/          # Live Mongo (gated by RUN_LIVE_INFRA)
│   ├── cache/             # Live Redis gate
│   ├── queue/             # Live BullMQ gate
│   └── storage/           # Live MinIO gate
├── e2e/
│   └── journeys/          # Multi-step API journeys
├── contract/
│   └── openapi/           # OpenAPI document contract
└── load/
    └── k6/                # k6 scenarios + helpers (not run by Vitest)
```

## What each layer covers

| Layer                  | Tests                                     | Real DB?                   |
| ---------------------- | ----------------------------------------- | -------------------------- |
| **Unit**               | Commands, domain errors, pure utils       | No — mock ports            |
| **Integration (api)**  | Express routes + middleware + controllers | No — Prisma/Redis mocked   |
| **Integration (live)** | Mongo / Redis / MinIO / queue             | Yes — `RUN_LIVE_INFRA=1`   |
| **E2E**                | Cross-route journeys as an HTTP client    | Offline doubles by default |
| **Contract**           | OpenAPI validity + critical paths         | N/A                        |

This stack uses **MongoDB** (Prisma), **Redis**, **MinIO** — not
PostgreSQL/RabbitMQ. Live suites can use an external URL or Testcontainers
(`TESTCONTAINERS_MONGO=1`).

## Commands

```bash
npm test                      # all Vitest projects
npm run test:unit
npm run test:integration      # API + skipped live gates
npm run test:integration:live # RUN_LIVE_INFRA=1
npm run test:e2e
npm run test:e2e:live         # full live route suite (running API)
npm run test:contract
npm run test:load             # k6 capacity suite (raises rate limits briefly)
npm run test:load:smoke       # k6 public health smoke
npm run test:coverage
npm run test:ci               # unit+integration+e2e+contract + coverage
npm run test:docs             # swagger-cli validate
npm run validate              # lint + types + test:ci + docs
```

## Rules

1. Mock **ports**, not Express handlers, in unit tests.
2. Prefer `tests/factories/*` for domain entities.
3. Keep setup mocks aligned with `@/shared/...` import paths.
4. Do not assert on private infrastructure when a public use case exists.
5. Load tests under `tests/load/k6/` are run with k6 (`npm run test:load`), not
   Vitest.

Contract tests follow `docs/api/openapi.yaml` as produced by
`npm run generate:openapi`. Path fragments under `docs/api/paths/` are
documentation aids; keep them aligned, but the generator is the runtime spec.
