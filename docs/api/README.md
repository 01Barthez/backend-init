# OpenAPI Documentation

HTTP contracts for Backend Init are described with **OpenAPI 3** and served
locally by Swagger UI when enabled.

## Live UI

When the API is running and `SWAGGER_ENABLED` is true:

- UI: http://localhost:3000/api-docs
- Raw document: http://localhost:3000/api-docs.json

The runtime loader prefers `docs/api/openapi.yaml`, then falls back to
`docs/openapi.yaml` during migration (`src/app/config/swagger.ts`).

## Layout

```
docs/api/
├── openapi.yaml           # Consolidated spec (generated / maintained)
├── openapi.config.js      # Generator entry — run via npm run generate:openapi
├── README.md              # This file
├── components/
│   ├── parameters/
│   ├── responses/
│   └── schemas/
├── paths/
│   ├── index.yaml
│   ├── auth.yaml
│   ├── users.yaml
│   ├── oauth.yaml
│   ├── blogs.yaml
│   └── system.yaml
├── schemas/
│   └── schemas.yaml
└── security/
    └── bearerAuth.yml
```

### Components

Reusable **parameters**, **responses**, and **schemas**. Path fragments under
`paths/` reference them with relative `$ref` paths such as
`../components/schemas/…` (correct from the `paths/` directory).

### Paths

One file per tag area. Only document endpoints that exist in module routers
(auth, users, oauth, blogs, system). Do not invent product APIs that are not
implemented.

### Security

Bearer JWT:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Protected operations set `security: [{ bearerAuth: [] }]`. Clients send
`Authorization: Bearer <access_token>`. Refresh tokens use the HTTP-only cookie
flow described in the authentication guide — they are not passed as Bearer
tokens.

## Generate

```bash
npm run generate:openapi
```

This runs `node docs/api/openapi.config.js`, which writes
`docs/api/openapi.yaml`.

Keep the generator and any modular YAML fragments aligned with real routes
under:

- `src/modules/auth/presentation/routes`
- `src/modules/users/presentation/routes`
- `src/modules/oauth/presentation/routes`
- `src/modules/blog/presentation/routes`
- `src/modules/system/presentation/routes`
- Mount table in `src/app/routes/index.ts`

## Validate

```bash
npm run test:docs
# swagger-cli validate docs/api/openapi.yaml
```

Also included in `npm run validate`.

## Editing guidance

1. Change the real Express route first.
2. Update OpenAPI (generator definition and/or path YAML).
3. Regenerate and validate.
4. Mentions in root README or guides should match the same paths.

## Related

- [Authentication guide](../guides/authentication.md)
- [Modules catalog](../architecture/modules.md)
- Spec: [openapi.yaml](./openapi.yaml)
