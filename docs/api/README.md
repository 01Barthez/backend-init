# OpenAPI Documentation

HTTP contracts for Backend Init are described with **OpenAPI 3** and served
locally by Swagger UI when enabled. All operation summaries and descriptions
are written in **English**.

## Live UI

When the API is running and `SWAGGER_ENABLED` is true:

- UI: http://localhost:3000/api-docs
- Raw document: http://localhost:3000/api-docs.json

Both require HTTP Basic (`ADMIN_BASIC_*`, fallback `SWAGGER_*`) except when
`NODE_ENV=test`. The runtime loader uses **`docs/api/openapi.yaml` only**.

## Source of truth

`docs/api/openapi.config.js` generates the consolidated spec. Modular YAML
under `paths/` are human-editable fragments kept aligned with routers — they
are **not** loaded at runtime. After route changes:

1. Update Express routes.
2. Update `openapi.config.js` (and the matching `paths/*.yaml` fragment).
3. `npm run generate:openapi`
4. `npm run test:docs`
5. Contract tests also fail if `openapi.yaml` drifts from the generator.

## Coverage rule

Every Express route mounted in `src/app/routes/index.ts` and module routers
must appear in the generated OpenAPI document. Operator UIs (`/api-docs`,
`/api-docs.json`) are documented in prose here; they are not OpenAPI operations.

## Layout

```
docs/api/
├── openapi.yaml           # Consolidated spec (generated — runtime + Swagger)
├── openapi.config.js      # Generator entry — run via npm run generate:openapi
├── README.md              # This file
├── paths/
│   ├── index.yaml
│   ├── auth.yaml
│   ├── users.yaml
│   ├── oauth.yaml
│   ├── blogs.yaml
│   ├── files.yaml
│   └── system.yaml
├── schemas/
│   └── schemas.yaml
└── security/
    └── bearerAuth.yml
```

### Paths

One file per tag area. Document only endpoints that exist in module routers
(auth, users, oauth, blogs, files, system). Do not invent product APIs that are
not implemented.

Keep in sync with:

- `src/modules/*/presentation/routes`
- Mount table in `src/app/routes/index.ts`

### Security

Bearer JWT for domain APIs. Operator UIs also use HTTP Basic (`basicAuth` in the
generated spec). Refresh tokens use the HTTP-only cookie flow — they are not
passed as Bearer tokens.

## Generate

```bash
npm run generate:openapi
```

Writes `docs/api/openapi.yaml`.

## Validate

```bash
npm run test:docs
npm run test:contract
```

Also included in `npm run validate`.

## Related

- [Authentication guide](../guides/authentication.md)
- [Modules catalog](../architecture/modules.md)
- Spec: [openapi.yaml](./openapi.yaml)
