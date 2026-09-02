# Testing

Backend Init uses **Vitest** with path aliases, a global setup file, and
Supertest for HTTP integration tests.

## Layout

```
tests/
├── setup.ts                 # Global Vitest setup
├── helpers/                 # Test server & utilities
├── fixtures/                # Static fixtures
├── factories/               # Test data builders
├── mocks/ / __mocks__/      # Shared mocks
├── unit/
│   ├── modules/             # Prefer module-aligned unit tests
│   ├── unit/
│   │   ├── modules/           # Use-case / domain tests
│   │   └── shared/            # Shared kernel tests
│   ├── integration/           # HTTP API tests (supertest)
│   └── e2e/                   # Reserved for full-stack scenarios
│   └── shared/
├── integration/
│   └── api/                 # HTTP + wiring tests
├── e2e/                     # Broader scenarios
├── load/                    # Load scenarios (e.g. k6-oriented assets)
└── utils/
```

Config: `vitest.config.ts` — `include: ['tests/**/*.{test,spec}.ts']`, setup
`./tests/setup.ts`.

## Commands

```bash
npm test                 # vitest run
npm run test:watch
npm run test:coverage
npm run validate         # lint + types + tests + OpenAPI
```

## Strategy by layer

| Kind        | Target                             | Doubles                                      |
| ----------- | ---------------------------------- | -------------------------------------------- |
| Unit        | Commands, domain rules, pure utils | Fake ports / in-memory repos                 |
| Integration | Routers + container wiring         | Override deps; may use test DB if configured |
| E2E         | Critical user journeys             | Prefer Dockerized dependencies               |

## Mocking ports

Modules expose `createDefaultXxxDeps(overrides)` and the app exposes
`createContainer(overrides)`. Prefer overriding **ports**, not mocking Prisma
globally, when testing use cases.

### Module-level

```ts
import { createAuthModule, createDefaultAuthDeps } from '@/modules/auth';

const auth = createAuthModule(
  createDefaultAuthDeps({
    mailer: {
      send: async () => undefined,
    },
    userRepository: fakeUserRepository,
  }),
);

await auth.useCases.login.execute({ email, password });
```

### Container-level

```ts
import { createContainer } from '@/app/container';

const container = createContainer({
  auth: {
    userRepository: fakeUserRepository,
  },
});

// mount container.auth.router on a test Express app
```

Reset the singleton between suites when tests call `getContainer()`:

```ts
import { resetContainer } from '@/app/container';

afterEach(() => {
  resetContainer();
});
```

## Guidelines

- Name tests after behavior (`rejects expired OTP`), not implementation details.
- Keep unit tests free of network I/O.
- Do not assert on private infrastructure helpers when a public use case exists.
- Align new unit folders with `src/modules/<name>/`.

## Related

- [Extending](../architecture/extending.md) — where to place new tests
- [ADR 003](../architecture/decisions/003-dependency-injection.md)
