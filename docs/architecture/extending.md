# Extending the Template

This guide walks through adding a new bounded context — using a fictional
**billing** module as the example — and wiring it into the composition root.

## Prerequisites

- Read [Overview](./overview.md) and [Dependency rules](./dependency-rules.md).
- Prefer copying structure from `src/modules/auth/` or `src/modules/blog/`
  rather than inventing a new layout.

## Step 1 — Scaffold the module

Prefer the CLI (full vertical slice: CRUD, Prisma, OpenAPI, unit test):

```bash
npm run scaffold:module -- billing --wire
```

See [Scaffolding a module](../guides/scaffolding-a-module.md).

Manual layout (if you prefer to copy by hand):

```
src/modules/billing/
├── domain/
│   ├── entities/
│   ├── errors/
│   └── repositories/          # ports only (interfaces)
├── application/
│   ├── commands/
│   ├── queries/
│   ├── dto/
│   └── services/              # application ports (mailer, etc.)
├── infrastructure/
│   ├── repositories/          # Prisma (or other) adapters
│   └── providers/
├── presentation/
│   ├── controllers/
│   ├── routes/
│   ├── schemas/
│   └── serializers/
├── index.ts
└── README.md
```

Keep domain free of Express and Prisma. Define repository ports in
`domain/repositories` and implement them under `infrastructure/repositories`.

## Step 2 — Implement a use case

Example shape (illustrative):

```ts
// application/commands/create-invoice.command.ts
export class CreateInvoiceCommand {
  constructor(private readonly invoices: InvoiceRepositoryPort) {}

  async execute(input: CreateInvoiceDto): Promise<InvoiceEntity> {
    // validate / domain rules / persist via port
    return this.invoices.create(input);
  }
}
```

## Step 3 — Export factories from `index.ts`

Mirror the existing modules:

```ts
export type BillingModuleDeps = {
  invoiceRepository: InvoiceRepositoryPort;
  // …
};

export function createDefaultBillingDeps(
  overrides: Partial<BillingModuleDeps> = {},
): BillingModuleDeps {
  return {
    invoiceRepository: overrides.invoiceRepository ?? new PrismaInvoiceRepository(),
    ...overrides,
  };
}

export function createBillingModule(deps: BillingModuleDeps): BillingModule {
  const createInvoice = new CreateInvoiceCommand(deps.invoiceRepository);
  const controller = createBillingController({ createInvoice });
  const router = createBillingRoutes(controller);
  return { deps, useCases: { createInvoice }, controller, router };
}

export function createBillingRouter(
  overrides?: Partial<BillingModuleDeps>,
) {
  return createBillingModule(createDefaultBillingDeps(overrides)).router;
}
```

Document purpose and extension points in `README.md`.

## Step 4 — Wire the container

Edit `src/app/container/index.ts`:

```ts
import {
  createBillingModule,
  createDefaultBillingDeps,
  type BillingModule,
} from '@/modules/billing';

export type AppContainer = {
  // …existing
  billing: BillingModule;
};

export type ContainerOverrides = {
  // …existing
  billing?: Parameters<typeof createDefaultBillingDeps>[0];
};

export function createContainer(overrides: ContainerOverrides = {}): AppContainer {
  // …existing modules
  const billing = createBillingModule(createDefaultBillingDeps(overrides.billing));
  return { /* … */, billing };
}
```

Order matters when modules depend on each other (RBAC is created before
auth/users today).

## Step 5 — Mount routes

Edit `src/app/routes/index.ts`:

```ts
api.use('/billing', rateLimitingSubRoute, container.billing.router);
```

Routes then live under `{API_PREFIX}/billing/...`.

## Step 6 — Persistence (if needed)

1. Add or extend Prisma models under `prisma/models/` (or the project’s Prisma
   schema layout).
2. Run `npm run prisma:generate` and `npm run prisma:push` (or your migration
   workflow).
3. Implement the Prisma repository adapter in the module’s infrastructure layer.

## Step 7 — Configuration

If billing needs new env vars:

1. Add a section under `src/app/config/sections/` (e.g. `billing.ts`).
2. Register it on the frozen `config` object in `src/app/config/index.ts`.
3. Document variables in `.env.example`.

Never read `process.env` inside the module.

## Step 8 — OpenAPI

Document real endpoints only:

1. Prefer the scaffold’s `docs/api/generator/paths/<module>.js` (or add one).
2. Ensure it is merged from `docs/api/generator/paths/index.js` (`--wire` does
   this).
3. Run `npm run generate:openapi`.
4. Validate with `npm run test:docs`.

See [API docs](../api/README.md).

## Step 9 — Tests

| Layer       | What to test            | How                                               |
| ----------- | ----------------------- | ------------------------------------------------- |
| Unit        | Commands / domain rules | Fake repository ports                             |
| Integration | HTTP routes             | `createContainer({ billing: { … } })` + Supertest |
| E2E         | Critical happy paths    | Against Dockerized stack when needed              |

Example unit pattern:

```ts
const billing = createBillingModule(
  createDefaultBillingDeps({
    invoiceRepository: fakeInvoiceRepo,
  }),
);

await billing.useCases.createInvoice.execute({ /* … */ });
```

Place tests under:

```
tests/unit/modules/billing/
tests/integration/api/billing/
```

See [Testing](../development/testing.md).

## Step 10 — Catalog and changelog

1. Add an entry to [modules.md](./modules.md).
2. Note the change under `[Unreleased]` in [CHANGELOG.md](../../CHANGELOG.md).

## Checklist

- [ ] Domain has no framework imports
- [ ] `createDefaultXxxDeps` + `createXxxModule` exported
- [ ] Container + routes updated (or `scaffold:module --wire`)
- [ ] Env documented if required
- [ ] OpenAPI updated for real HTTP surfaces
- [ ] Unit tests with port fakes
- [ ] Module README written
- [ ] Prisma generate + push when a model was added
