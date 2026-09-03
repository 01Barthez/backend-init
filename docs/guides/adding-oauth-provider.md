# Adding an OAuth Provider

Social login is owned by `src/modules/oauth`. Built-in providers: Google,
GitHub, Facebook, LinkedIn, Twitter, Instagram, plus Telegram (widget flow).

Authorize, callback, Telegram, and unlink are gated by Flagsmith `enable_oauth`
(default **true** when the remote is unreachable). When the flag is off, those
routes fail closed (`OAuthFeatureDisabledError`). `GET /accounts` remains
available for an authenticated user to list links.

## Steps

### 1. Config

Add client id, secret, and redirect URI under `src/app/config/sections/oauth.ts`
and document them in `.env.example`. Wire keys onto the frozen `config.oauth`
object (and `envs` if legacy callers need them).

### 2. Domain enum / types

Extend `OAuthProvider` (and related types) in the oauth domain types so routes
and the manager recognize the new name.

### 3. Implement the provider class

Extend `BaseOAuthService` in `src/modules/oauth/infrastructure/providers/`:

- Supply authorization URL, token URL, scopes, and profile mapping
- Implement profile normalization to `IOAuthUserProfile`
- Handle provider-specific quirks (token auth headers, form bodies, etc.)

Use an existing provider (e.g. `github-oauth.service.ts`) as the template.

### 4. Register in `OAuthManager`

In `infrastructure/manager/oauth-manager.service.ts`, inside
`initializeProviders()`:

```ts
this.providers.set(OAuthProvider.YOUR_PROVIDER, new YourProviderOAuthService());
```

Telegram remains special-cased via `TelegramOAuthService` and `POST /telegram`.

### 5. Routes

The generic routes already cover:

- `GET /:provider` — authorize redirect
- `GET /:provider/callback` — callback
- `DELETE /:provider/unlink` — unlink (authenticated)
- `GET /accounts` — list linked accounts

Ensure validation schemas allow the new provider slug.

### 6. OpenAPI and docs

Update OpenAPI enums / path docs and this guide’s provider list. Run
`npm run generate:openapi` and `npm run test:docs`.

### 7. Tests

- Unit-test profile mapping with recorded fixtures (no live network).
- Override oauth deps in container tests if you assert linking behavior.

## Security checklist

- Validate `state` (TTL enforced by the manager).
- Never log access tokens or authorization codes.
- Allowlist post-login redirects (`CLIENT_URL`, `OAUTH_ALLOWED_ORIGINS`). Never
  put tokens in the callback URL.
- Encrypt provider tokens at rest (`AUTH_ENCRYPTION_KEY`) or leave the key empty
  to skip persistence.
- Redirect URIs must match the provider console **exactly**.
- Decide account-linking rules carefully when an email already exists (follow
  existing find-or-create behavior unless you intentionally change it).
- Keep `enable_oauth` in mind for incident response (disable social login
  without a deploy).

## Related

- OAuth module README: `src/modules/oauth/README.md`
- [Authentication](./authentication.md)
- [Modules catalog](../architecture/modules.md)
