# Dependency Injection Container

Composition root for the backend template.

## Why a manual container?

Framework DI (tsyringe, awilix, inversify) works well, but for an open-source
starter we prefer **explicit factories**:

- Zero decorator magic — easier onboarding
- Trivial to override ports in tests
- Easy to extract a module into a microservice later (take its factory with you)

## Usage

```ts
import { createContainer, getContainer } from '@/app/container';

// Production boot
const container = getContainer();
app.use('/api/v1/auth', container.auth.router);

// Tests
const testContainer = createContainer({
  auth: { userRepository: fakeUserRepo },
});
```

## Adding a module

1. Export `createXxxModule` + `createDefaultXxxDeps` from the module `index.ts`.
2. Register them inside `createContainer`.
3. Mount the router in `src/app/routes/index.ts`.
