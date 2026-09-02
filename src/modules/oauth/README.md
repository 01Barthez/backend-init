# OAuth module

Social login for Google, GitHub, Facebook, LinkedIn, Twitter, Instagram, and
Telegram.

## Layout

```
oauth/
├── domain/            # IOAuthService port, profile types, errors
├── application/       # Authorize, Callback, Unlink, ListAccounts, TelegramAuth
├── infrastructure/    # BaseOAuth, OAuthManager, 7 providers
├── presentation/      # Controllers, routes, schemas
├── index.ts           # createOAuthModule / createOAuthRouter
└── README.md
```

## Public API

```ts
import { createOAuthRouter, createOAuthModule, createDefaultOAuthDeps } from '@/modules/oauth';

app.use(`${prefix}/auth/oauth`, createOAuthRouter());
```

## Routes

| Method | Path                  | Auth              |
| ------ | --------------------- | ----------------- |
| GET    | `/accounts`           | required          |
| POST   | `/telegram`           | public            |
| GET    | `/:provider`          | public (redirect) |
| GET    | `/:provider/callback` | public            |
| DELETE | `/:provider/unlink`   | required          |

## Extension points

1. **Add a provider** — extend `BaseOAuthService`, register in
   `OAuthManager.initializeProviders`.
2. **TokenServicePort / RbacPort / MailerPort** — shared with auth; override via
   `createDefaultOAuthDeps`.
3. **OAuthManager** — swap find-or-create / linking strategy for tests.

## Security

- Validate `state` (TTL enforced by the manager).
- Never log access tokens or authorization codes.
- Post-login `redirectUrl` is origin-allowlisted (`CLIENT_URL` + `OAUTH_ALLOWED_ORIGINS`).
- Callback never puts JWTs in the query string (cookie + `Authorization` header only).
- Provider tokens at rest: `AUTH_ENCRYPTION_KEY` (AES-256-GCM). Empty key = do not persist.
- Redirect URIs must match the provider console **exactly**.
- Inactive accounts cannot complete login or linking.
