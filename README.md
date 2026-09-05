# Backend Init

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green.svg)](./docs/api/openapi.yaml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Production-minded Express + TypeScript modular monolith** — an open-source
backend template with JWT auth, OAuth, RBAC, uploads, queues, feature flags, and
observability wired the way you would actually ship.

Replace the sample **Blog** domain with your own, keep the platform modules, and
move fast without inheriting a spaghetti `controllers/` dump.

---

## Why this template

| Goal                 | How we deliver it                                                         |
| -------------------- | ------------------------------------------------------------------------- |
| Scalable by team     | Code is organized by **domain module**, not by file type                  |
| Extensible           | `npm run scaffold:module` (+ optional `--wire` / `--with-audit`)          |
| Customizable         | Swap MinIO↔S3, SMTP, repositories via ports + DI                         |
| Testable             | Use cases take ports; Vitest unit / integration / e2e / contract; k6 load |
| Documentable         | OpenAPI 3 for every endpoint + architecture ADRs                          |
| Ops-ready            | GHCR publish, VPS deploy workflow, fail-closed prod checks                |
| Microservice-ready   | Modular monolith first — extract a module when it hurts                   |
| Open source friendly | MIT, CoC, SECURITY, CONTRIBUTING, English docs only                       |

---

## Features

- **Modular monolith** — `src/modules/*` with Presentation → Application →
  Domain ← Infrastructure
- **Auth** — RS256 JWT only, refresh rotation / reuse detection, OTP email
  verification (atomic claim + cooldown), optional TOTP + recovery codes,
  sessions (`/me`, list/revoke), Redis jti blacklist
- **OAuth 2.0** — Google, GitHub, Facebook, LinkedIn, Twitter, Instagram,
  Telegram
- **RBAC** — seeded roles & permissions (`super-admin`, `admin`, `user`,
  `guest`); role **replace** (not append); auth-context cache
- **Users & Blog** — admin lifecycle APIs, last-admin / self guards, reference
  Blog domain for end-to-end wiring
- **Files** — 2MB avatar multipart, magic-byte checks, optional ClamAV
  (`CLAMAV_REQUIRED` to fail closed), ownership-locked presigned PUT/GET +
  post-upload scan worker
- **Storage** — MinIO or S3 via `STORAGE_PROVIDER` (port + adapters)
- **Feature flags** — Flagsmith Node SDK + `FEATURE_*` env kill-switches (env
  wins); UI under Compose `tools` profile
- **Jobs** — BullMQ mail / backup / audit purge / maintenance / heavy tasks +
  Bull Board UI
- **Process roles** — `PROCESS_ROLE=all|api|worker`; fail-closed bootstrap;
  graceful shutdown
- **Audit** — list / detail / CSV|JSON export (`audit:read`), retention purge
- **Ops** — `/health/live` + `/ready`, Prometheus metrics (Basic auth), Winston
  (+ optional Loki), Docker Compose; Nginx publishes `/health` and `/api/` only
- **Quality & security** — Vitest, OpenAPI contract tests, ESLint (`process.env`
  / `console` banned), Prettier, Commitlint, Husky, gitleaks, npm audit / Trivy
  / OSV in CI

---

## Architecture

```text
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
└── shared/            # Cross-cutting infra (database, cache, mail, queue, storage, logging, flags)
```

```text
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
│ Infrastructure  │  Prisma, Redis, MinIO/S3, SMTP, BullMQ, Flagsmith
└─────────────────┘
```

Deep dive: [docs/architecture/overview.md](./docs/architecture/overview.md) ·
[platform kernel](./docs/architecture/platform-kernel.md) ·
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

Single env file at the **repo root**: `.env` (from `.env.example`). Compose and
deploy compose files reference that file — do not maintain a second copy under
`infra/docker/`.

---

## Quick start

```bash
git clone https://github.com/barthez-kenwou/backend-init.git
cd backend-init
cp .env.example .env

npm install
npm run keys:generate
npm run docker:up
npm run prisma:push
npm run prisma:seed
npm run dev
```

| Surface       | URL                                                   | Notes                                     |
| ------------- | ----------------------------------------------------- | ----------------------------------------- |
| API           | [`/api/v1`](http://localhost:3000/api/v1)             | Versioned REST                            |
| Swagger UI    | [`/api-docs`](http://localhost:3000/api-docs)         | HTTP Basic; not on public Nginx           |
| Health        | [`/health`](http://localhost:3000/health)             | Mongo + Redis (`/live` process-only)      |
| Metrics       | [`/metrics`](http://localhost:3000/metrics)           | HTTP Basic; scrape on the private network |
| Bull Board    | [`/admin/queues`](http://localhost:3000/admin/queues) | Basic + JWT admin; not on public Nginx    |
| MailHog       | [`:8025`](http://localhost:8025)                      | Dev SMTP UI                               |
| MinIO Console | [`:9001`](http://localhost:9001)                      | Object storage                            |
| Prisma Studio | [`:5555`](http://localhost:5555)                      | `npm run docker:tools`                    |
| Flagsmith     | [`:8000`](http://localhost:8000)                      | Feature-flag UI (`docker:tools`)          |

More detail:
[docs/development/getting-started.md](./docs/development/getting-started.md)

---

## API surface (documented in Swagger)

| Tag            | Prefix                                  | Highlights                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------ |
| Authentication | `/api/v1/auth`                          | signup, OTP, login, `/me`, sessions, TOTP, password, refresh |
| OAuth          | `/api/v1/auth/oauth`                    | provider authorize/callback, unlink, Telegram                |
| Users          | `/api/v1/users`                         | profile, invite, lifecycle, list/search/export, roles        |
| Blogs          | `/api/v1/blogs`                         | public list/search/get + authenticated CRUD/publish          |
| Files          | `/api/v1/files`                         | presigned PUT/GET (auth + ownership)                         |
| System         | `/health`, `/metrics`, `/csrf-token`, … | ops; `GET /api/v1/admin/audit` (+ detail / export)           |

Full contract: [docs/api/openapi.yaml](./docs/api/openapi.yaml)

---

## Documentation map

| Section                                 | Link                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Documentation home                      | [docs/README.md](./docs/README.md)                                             |
| Architecture & ADRs                     | [docs/architecture/](./docs/architecture/README.md)                            |
| Development / testing / standards       | [docs/development/](./docs/development/README.md)                              |
| Git hooks (Husky)                       | [docs/development/git-hooks.md](./docs/development/git-hooks.md)               |
| Docker & production                     | [docs/deployment/](./docs/deployment/README.md)                                |
| Security scanning (audit / Trivy / OSV) | [docs/deployment/security-scanning.md](./docs/deployment/security-scanning.md) |
| GitHub → GHCR → VPS deploy              | [guide-github-config.md](./guide-github-config.md)                             |
| Guides (auth, flags, storage, jobs, …)  | [docs/guides/](./docs/guides/README.md)                                        |
| Feature flags                           | [docs/guides/feature-flags.md](./docs/guides/feature-flags.md)                 |
| OpenAPI                                 | [docs/api/](./docs/api/README.md)                                              |

---

## Scripts

| Script                                      | Description                                   |
| ------------------------------------------- | --------------------------------------------- |
| `npm run dev`                               | Dev server with hot reload (`tsx watch`)      |
| `npm run dev:api` / `dev:worker`            | Split HTTP vs BullMQ (`PROCESS_ROLE`)         |
| `npm run keys:generate`                     | Create RS256 PEMs under `keys/`               |
| `npm run build` / `npm start`               | Compile and run production build              |
| `npm test` / `test:ci` / `test:coverage`    | Vitest (unit, integration, e2e, contract)     |
| `npm run test:unit` / `integration` / `e2e` | Individual Vitest projects                    |
| `npm run test:contract` / `test:docs`       | OpenAPI contract + swagger-cli                |
| `npm run test:load` / `test:load:smoke`     | k6 load scenarios                             |
| `npm run validate`                          | Lint + types + test:ci + OpenAPI              |
| `npm run format` / `lint` / `lint:md`       | Prettier + ESLint + markdownlint              |
| `npm run generate:openapi`                  | Regenerate `docs/api/openapi.yaml`            |
| `npm run scaffold:module`                   | Full domain module (`--wire`, `--with-audit`) |
| `npm run docker:up` / `docker:build`        | Compose / local image build                   |
| `npm run docker:tools`                      | Studio, RedisInsight, Flagsmith, …            |
| `npm run prisma:generate` / `push` / `seed` | Database tooling                              |
| `npm run prisma:studio`                     | Browse Mongo data (dev; localhost:5555)       |
| `npm run security:audit`                    | `npm audit` (high+, omit dev)                 |
| `npm run security:secrets`                  | Gitleaks against the working tree             |
| `npm run security:trivy`                    | Trivy filesystem scan (Docker required)       |

---

## Deploy (short path)

1. Configure GitHub secrets / Environments — see
   [guide-github-config.md](./guide-github-config.md).
2. Push to `main` →
   [`.github/workflows/docker.yml`](./.github/workflows/docker.yml) builds and
   pushes to GHCR (`main`, `latest`, `sha-<full>`).
3. [`.github/workflows/deploy-vps.yml`](./.github/workflows/deploy-vps.yml) SSHs
   to the VPS, pulls `IMAGE_REF`, and brings up
   [`infra/docker/docker-compose.deploy.yml`](./infra/docker/docker-compose.deploy.yml)
   against the **root** `.env`.

Runtime hardening notes:
[docs/deployment/production.md](./docs/deployment/production.md).

---

## Quality gates

Hooks run on commit / push (see
[docs/development/git-hooks.md](./docs/development/git-hooks.md)). Before
opening a PR:

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
Nodemailer · Flagsmith · Vitest · k6 · Docker Compose · OpenAPI 3 · Winston ·
GitHub Actions (CI, CodeQL, Trivy, GHCR, VPS deploy)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md).  
Security reports: [SECURITY.md](./SECURITY.md).  
Changelog: [CHANGELOG.md](./CHANGELOG.md).

## License

MIT © 2024–2026 [Barthez Kenwou](https://github.com/barthez-kenwou) — see
[LICENSE](./LICENSE).
