# Modules

Each folder under `modules/` is a **bounded context** (auth, users, blog, files,
oauth, backup, notifications, system, …).

## Required layout

```
module-name/
├── domain/           # Entities, value objects, repository ports, domain errors
├── application/      # Use cases (commands / queries), DTOs, application services
├── infrastructure/   # Prisma repos, external providers, mappers
├── presentation/     # Controllers, routes, Zod/express-validator schemas, serializers
├── index.ts          # Public module API (routes + bootstrap hooks)
└── README.md         # Module purpose & extension points
```

## Dependency rules

```
presentation  →  application  →  domain
infrastructure → domain (implements ports)
domain ✗→ express | prisma | redis | aws
```

## Adding a new module

1. Copy the skeleton from `modules/auth/` (or create folders as above).
2. Register routes in `src/app/routes/index.ts`.
3. Wire dependencies in `src/app/container/index.ts`.
4. Document the module in `docs/architecture/modules.md`.

Files expose HTTP at `{API_PREFIX}/files` (presign). System owns health,
metrics, Bull Board, and `GET {API_PREFIX}/admin/audit`. Recipe:
[docs/architecture/extending.md](../../docs/architecture/extending.md).
