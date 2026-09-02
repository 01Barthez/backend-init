# Crypto helpers

Pure Node `crypto` / bcrypt utilities shared across modules.

| Export | Use for |
|---|---|
| `hashPassword` / `comparePassword` | User credentials (bcrypt) |
| `hashToken` | Opaque secrets at rest (SHA-256) |
| `randomHex` | CSRF/OAuth state, family IDs, nonces |

Keep this free of Express, Prisma, and module imports.

Domain-specific crypto (Telegram login HMAC, backup AES-GCM) stays in the
owning module — only extract here when a second consumer appears.
