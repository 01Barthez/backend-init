# Crypto helpers

Pure Node `crypto` / bcrypt utilities shared across modules.

| Export | Use for |
|---|---|
| `hashPassword` / `comparePassword` | User credentials (bcrypt, 12 rounds) |
| `DUMMY_PASSWORD_HASH` | Timing-safe unknown-email login path |
| `hashToken` / `tokenHashesEqual` | Opaque secrets at rest (SHA-256) |
| `randomHex` | CSRF/OAuth state, family IDs, reset tokens |
| `encryptSecret` / `decryptSecret` | Provider OAuth tokens at rest (AES-256-GCM) |

Keep this free of Express, Prisma, and module imports.
