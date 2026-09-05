# Feature flags

Kill-switches for optional platform surfaces. Resolution order (highest wins):

1. **`FEATURE_*` env overrides** — local ops (no UI required)
2. **Flagsmith remote** — dashboard toggles (when `FLAGSMITH_API_KEY` is set)
3. **Code defaults** — `enable_*=true` in `src/app/config/sections/features.ts`
4. **Caller fallback** — last argument to `isEnabled(flag, fallback)`

## Built-in flags

| Flag                      | Env override                      | Effect                              |
| ------------------------- | --------------------------------- | ----------------------------------- |
| `enable_oauth`            | `FEATURE_ENABLE_OAUTH`            | OAuth authorize / callback / unlink |
| `enable_backup`           | `FEATURE_ENABLE_BACKUP`           | Repeatable Mongo backup job         |
| `enable_maintenance_jobs` | `FEATURE_ENABLE_MAINTENANCE_JOBS` | Unverified-user + blacklist purge   |

Values for overrides: `true` / `false` / `1` / `0` / `on` / `off`. Empty =
unset.

## Local Flagsmith UI (Compose tools)

```bash
npm run docker:tools
# or: docker compose --profile tools up -d flagsmith flagsmith-db
```

Open **http://localhost:8000** (override with `FLAGSMITH_PORT`):

1. Sign up (registration without invite is enabled for the tools profile)
2. Create a project
3. Create the three features above (boolean)
4. Toggle them per environment
5. Copy the **Environment Key** into root `.env`:

```env
FLAGSMITH_API_KEY=<environment_key>
# API on the host:
FLAGSMITH_API_URL=http://127.0.0.1:8000/api/v1/
# API when the backend container talks to Flagsmith on the compose network:
# FLAGSMITH_API_URL=http://flagsmith:8000/api/v1/
FLAGSMITH_REFRESH_SECONDS=60
```

Restart the API process so `featureFlagService.start()` loads the key.

## Emergency kill-switch (no UI)

```env
FEATURE_ENABLE_OAUTH=false
```

Wins over Flagsmith until you clear the variable.

## SDK notes

Server SDK: `flagsmith-nodejs`. Flags load at bootstrap and refresh every
`FLAGSMITH_REFRESH_SECONDS` (default 60). A remote **OFF** is stored as `false`
and is never rebound to the code default.
