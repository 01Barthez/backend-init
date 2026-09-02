# Backend Init

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green.svg)](./docs/api/openapi.yaml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Production-minded Express + TypeScript modular monolith** — an open-source
backend template with JWT auth, OAuth, RBAC, uploads, queues, and observability
wired the way you would actually ship.

Replace the sample **Blog** domain with your own, keep the platform modules, and
move fast without inheriting a spaghetti `controllers/` dump.

---

## Why this template?

| Goal                 | How we deliver it                                           |
| -------------------- | ----------------------------------------------------------- |
| Scalable by team     | Code is organized by **domain module**, not by file type    |
| Extensible           | Add `modules/billing/` by copying the auth pattern          |
| Customizable         | Swap MinIO↔S3, SMTP providers, repositories via ports + DI |
| Testable             | Use cases take ports; Vitest mocks infra; 40+ API tests     |
| Documentable         | OpenAPI 3 for every endpoint + architecture ADRs            |
| Microservice-ready   | Modular monolith first — extract a module when it hurts     |
| Open source friendly | MIT, CoC, SECURITY, CONTRIBUTING, English docs only         |

---

## Features

- **Modular monolith** — `src/modules/*` with Presentation → Application →
  Domain ← Infrastructure
- **Auth** — RS256 JWT, refresh rotation / reuse detection, OTP email
  verification, password flows
- **OAuth 2.0** — Google, GitHub, Facebook, LinkedIn, Twitter, Instagram,
  Telegram
- **RBAC** — seeded roles & permissions (`super-admin`, `admin`, `user`,
  `guest`)
- **Users & Blog** — administration APIs + a reference domain to validate
  end-to-end wiring
- **Files** — validated uploads (MinIO), optional ClamAV scanning
- **Storage** — MinIO or S3 via `STORAGE_PROVIDER` (port + adapters)
- **Jobs** — BullMQ mail / backup / maintenance + Bull Board UI
- **Ops** — health, Prometheus metrics, Winston (+ optional Loki), Docker
  Compose stack
- **Quality** — Vitest, OpenAPI, ESLint (`process.env` / `console` banned),
  Prettier, Commitlint, Husky

---

## Architecture

```
src/
├── app/               # Composition root
│   ├── config/        # Typed env (ONLY place that reads environment variables)
│   ├── container/     # Manual DI wiring
│   ├── middleware/    # Cross-cutting HTTP middleware
│   ├── routes/        # Mounts module routers under /api/v1
│   └── app.ts         # Express factory + bootstrap
├── modules/           # Bounded contexts (auth, users, rbac, oauth, blog, files, …)
│   └── <module>/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
└── shared/            # Cross-cutting infra (database, cache, mail, queue, storage, logging)
```

```
┌─────────────────┐
│  Presentation   │  Express controllers / routes / schemas
└────────┬────────┘
         ↓
┌─────────────────┐
│   Application   │  Use cases (commands / queries) + DTOs
└────────┬────────┘
         ↓
┌─────────────────┐
│     Domain      │  Entities, ports, domain errors  (no Express / Prisma)
└─────────────────┘
         ↑
┌────────┴────────┐
│ Infrastructure  │  Prisma, Redis, MinIO/S3, SMTP, BullMQ
└─────────────────┘
```

Deep dive: [docs/architecture/overview.md](./docs/architecture/overview.md) ·
[dependency rules](./docs/architecture/dependency-rules.md) ·
[add a module](./docs/architecture/extending.md)

### Naming conventions

| Element       | Convention       | Example                             |
| ------------- | ---------------- | ----------------------------------- |
| Folders       | kebab-case       | `health-check`, `csrf-token`        |
| Files         | kebab-case       | `login.command.ts`, `user-cache.ts` |
| Functions     | camelCase        | `getUserById`, `generateOtp`        |
| Constants     | UPPER_SNAKE_CASE | `OTP_DELAY`, `SYSTEM_ROLES`         |
| Prisma models | PascalCase       | `User`, `Blog`, `OAuthAccount`      |
| Prisma fields | camelCase        | `firstName`, `createdAt`            |

### Configuration rule

**Never** read `process.env` outside `src/app/config`. Import `config` (or the
legacy flat `envs` mirror) from `@/app/config`. ESLint enforces this.

---

## Quick start

```bash
git clone https://github.com/barthez-kenwou/backend-init.git
cd backend-init
cp .env.example .env

npm install
npm run docker:up
npm run prisma:push
npm run prisma:seed
npm run dev
```

| Surface       | URL                                |
| ------------- | ---------------------------------- |
| API           | http://localhost:3000/api/v1       |
| Swagger UI    | http://localhost:3000/api-docs     |
| Health        | http://localhost:3000/health       |
| Metrics       | http://localhost:3000/metrics      |
| Bull Board    | http://localhost:3000/admin/queues |
| MailHog       | http://localhost:8025              |
| MinIO Console | http://localhost:9001              |
| Prisma Studio | http://localhost:5555 (dev only)   |

More detail:
[docs/development/getting-started.md](./docs/development/getting-started.md)

---

## API surface (documented in Swagger)

| Tag            | Prefix                                  | Highlights                                    |
| -------------- | --------------------------------------- | --------------------------------------------- |
| Authentication | `/api/v1/auth`                          | signup, OTP, login, refresh, password         |
| OAuth          | `/api/v1/auth/oauth`                    | provider authorize/callback, unlink, Telegram |
| Users          | `/api/v1/users`                         | profile, list/search, roles, soft/hard delete |
| Blogs          | `/api/v1/blogs`                         | public list/get + authenticated CRUD/publish  |
| System         | `/health`, `/metrics`, `/csrf-token`, … | ops & security                                |

Full contract: [docs/api/openapi.yaml](./docs/api/openapi.yaml)

---

## Documentation map

| Section                             | Link                                                |
| ----------------------------------- | --------------------------------------------------- |
| Documentation home                  | [docs/README.md](./docs/README.md)                  |
| Architecture & ADRs                 | [docs/architecture/](./docs/architecture/README.md) |
| Development / testing / standards   | [docs/development/](./docs/development/README.md)   |
| Docker & production                 | [docs/deployment/](./docs/deployment/README.md)     |
| Guides (auth, OAuth, storage, jobs) | [docs/guides/](./docs/guides/README.md)             |
| OpenAPI                             | [docs/api/](./docs/api/README.md)                   |

---

## Scripts

| Script                                      | Description                               |
| ------------------------------------------- | ----------------------------------------- |
| `npm run dev`                               | Dev server with hot reload (Bun)          |
| `npm run build` / `npm start`               | Compile and run production build          |
| `npm test` / `test:ci` / `test:coverage`    | Vitest (unit, integration, e2e, contract) |
| `npm run test:unit` / `integration` / `e2e` | Individual Vitest projects                |
| `npm run test:contract` / `test:docs`       | OpenAPI contract + swagger-cli            |
| `npm run validate`                          | Lint + types + test:ci + OpenAPI          |
| `npm run format` / `lint`                   | Prettier + ESLint                         |
| `npm run generate:openapi`                  | Regenerate `docs/api/openapi.yaml`        |
| `npm run docker:up` / `docker:build`        | Compose / local image build               |
| `npm run prisma:generate` / `push` / `seed` | Database tooling                          |
| `npm run prisma:studio`                     | Browse Mongo data (dev; localhost:5555)   |
| `npm run docker:tools`                      | Optional tools profile (Studio, RedisInsight) |

---

## Quality gates

Before opening a PR:

```bash
npm run format
npm run lint:ci
npm run type-check
npm run test:ci
npm run test:docs
```

Or simply: `npm run validate`.

---

## Tech stack

Express 4 · TypeScript · MongoDB + Prisma · Redis · BullMQ · MinIO/S3 ·
Nodemailer · Vitest · Docker Compose · OpenAPI 3 · Winston

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md).  
Security reports: [SECURITY.md](./SECURITY.md).  
Changelog: [CHANGELOG.md](./CHANGELOG.md).

## License

MIT © 2024–2026 [Barthez Kenwou](https://github.com/barthez-kenwou) — see
[LICENSE](./LICENSE).
