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

## Compatibility

- `src/routes/users/oauth.router.ts` re-exports `createOAuthRouter()`.
- `src/core/interfaces/oauth.interface.ts` re-exports domain types.
- `src/services/oauth/**` re-exports infrastructure from this module.
