# Backend Init

Production-ready **Express + TypeScript** backend template for building secure REST APIs. Use it as a starting point, replace the reference `Blog` domain with your own business schema, and ship.

## Goals

- Provide a **consistent, normalized codebase** (naming, structure, responses, validation)
- Demonstrate **real-world patterns**: JWT (RS256), OAuth 2.0, OTP email verification, Redis cache, MinIO uploads, cron jobs, observability
- Include a minimal **Blog** model to validate end-to-end wiring — swap it for your domain model later
- Ship with **Docker**, **OpenAPI**, **Vitest**, and **CI-ready** scripts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express 4 |
| Database | MongoDB + Prisma ORM |
| Cache | Redis + LRU (two-tier) |
| Storage | MinIO (S3-compatible) |
| Auth | JWT RS256, OAuth 2.0, OTP |
| Email | Nodemailer + EJS templates |
| Docs | OpenAPI 3 / Swagger UI |
| Tests | Vitest + Supertest |
| Infra | Docker Compose |

## Project Structure

```
src/
├── config/           # Environment, Prisma client, Swagger
├── controllers/      # HTTP handlers (auth, oauth, users, blogs, system)
├── core/             # Constants, interfaces, shared types
├── middlewares/      # Auth, errors, upload, logging
├── routes/           # Express route definitions
├── services/         # JWT, cache, mail, oauth, upload, scheduler, validator
├── utils/            # Helpers (responses, OTP, password, middleware setup)
├── index.ts          # Server bootstrap
└── server.ts         # Express app factory
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folders | kebab-case | `health-check`, `csrf-token` |
| Files | kebab-case | `login.ts`, `user-cache.ts` |
| Functions | camelCase | `getUserById`, `generateOtp` |
| Constants | UPPER_SNAKE_CASE | `OTP_DELAY` |
| Prisma models | PascalCase | `User`, `Blog`, `OAuthAccount` |
| Prisma fields | camelCase | `firstName`, `createdAt` |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (recommended)
- Copy `.env.example` to `.env`

### With Docker (recommended)

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:push
npm run dev
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/api-docs`  
MailHog UI: `http://localhost:8025`

### Local development (without Docker)

Ensure MongoDB and Redis are running, update `DATABASE_URL` and `REDIS_HOST` in `.env`, then:

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (Bun) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run Vitest test suite |
| `npm run test:coverage` | Tests with coverage report |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | ESLint with auto-fix |
| `npm run validate` | Lint + type-check + tests + OpenAPI validation |
| `npm run generate:openapi` | Regenerate `docs/openapi.yaml` |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to MongoDB |

## API Overview

Base URL: `/api/v1`

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Register (sends OTP email) |
| POST | `/auth/verify` | Verify OTP |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/login` | Login (JWT + refresh cookie) |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password/:token` | Reset password |
| POST | `/auth/change-password` | Change password (authenticated) |

### OAuth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/oauth/:provider` | Start OAuth flow |
| GET | `/auth/oauth/:provider/callback` | OAuth callback |
| POST | `/auth/oauth/telegram` | Telegram widget auth |
| GET | `/auth/oauth/accounts` | List linked accounts |
| DELETE | `/auth/oauth/:provider/unlink` | Unlink provider |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users |
| GET | `/users/search` | Search users |
| GET | `/users/:userId` | Get user |
| PUT | `/users/profile` | Update own profile |
| PUT | `/users/:userId/role` | Update role (admin) |
| DELETE | `/users/:userId` | Soft delete |
| DELETE | `/users/:userId/permanent` | Hard delete |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api-docs` | Swagger UI |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

- `DATABASE_URL` — MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT` — Redis cache
- `MINIO_*` — Object storage
- `JWT_*_KEY_PATH` — RS256 key pair paths
- `GOOGLE_CLIENT_ID`, etc. — OAuth provider credentials

## Database Schema

Prisma models (MongoDB):

- **User** — accounts, OTP, roles, soft delete
- **OAuthAccount** — linked social logins
- **Blacklist** — revoked JWT tokens
- **Blog** — reference domain model (replace with your business entity)

## Testing

```
tests/
├── setup.ts              # Global Vitest setup
├── helpers/              # Test server & utilities
├── fixtures/             # Test data factories
├── mocks/                # Module mocks
├── unit/                 # Unit tests
└── integration/          # API integration tests
```

```bash
npm test
npm run test:coverage
```

## Customization Guide

1. **Replace Blog** — edit `prisma/schema.prisma`, add controllers/routes/validators following the users module pattern
2. **Add business modules** — mirror structure: `controllers/`, `routes/`, `services/validator/`
3. **Configure OAuth** — set provider credentials in `.env`
4. **Production** — inject secrets at runtime, enable auth middlewares, tune rate limits

## License

MIT — see [LICENSE](LICENSE).

## Author

**Barthez Kenwou** — [github.com/barthez-kenwou](https://github.com/barthez-kenwou)
