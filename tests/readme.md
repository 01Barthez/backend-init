# Tests

Vitest suite for the modular backend template.

```
tests/
├── setup.ts                 # Global mocks (Prisma, Redis, BullMQ, logger)
├── helpers/                 # Test server / DB helpers
├── fixtures/                # Sample domain data
├── unit/                    # Pure unit tests (no HTTP)
├── integration/             # Supertest against createApp()
└── e2e/                     # Reserved for full-stack scenarios
```

## Commands

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Guiding rules

1. Mock **ports**, not Express handlers, when testing application use cases.
2. Keep `tests/setup.ts` mocks in sync with `@/shared/...` import paths.
3. Prefer `createContainer({ ...overrides })` for isolated module tests.
