# Prisma

MongoDB models for Backend Init. Prisma does **not** run SQL migrations against
Mongo — use `db push` (and `prisma generate`) in development.

```text
prisma/
├── schema.prisma          # generator + datasource only
├── models/
│   ├── user.prisma        # User + OTP embed; totpSecret / totpEnabled
│   ├── auth.prisma        # RefreshToken, blacklist
│   ├── oauth.prisma       # OAuthAccount
│   ├── rbac.prisma        # Role, Permission, UserRole, RolePermission
│   ├── blog.prisma        # Reference domain; author has no onDelete cascade
│   └── audit.prisma       # AuditLog indexes
├── seed.ts                # rbacService.seedSystemRolesAndPermissions()
└── README.md
```

## Commands

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run prisma:studio      # localhost:5555, dev only
```

Seed only creates system roles and permissions. Application bootstrap also seeds
RBAC at process start (skipped in tests).

## TOTP

`User.totpSecret` is AES-256-GCM ciphertext (`AUTH_ENCRYPTION_KEY`).
`totpEnabled` gates login (`TOTP_REQUIRED`).

## Hard-delete vs blogs

`Blog.author` references `User` **without** cascade. GDPR hard-delete anonymizes
PII first; if blogs remain, the user row is kept as a stub so posts stay valid.
See `prisma-users.repository.ts`.

## Indexes — never silent-push to production

Indexes live in `prisma/models/*.prisma` (`@@index`, `@@unique`). They are
applied via `prisma db push`, not via SQL migrations.

Checklist before production sync:

1. Review the model diff for new/changed indexes.
2. Estimate collection size / write load.
3. Apply in staging first; confirm query plans.
4. Schedule production sync; watch index builds (Atlas or `currentOp`).
5. Document rollback (drop unused indexes) if the code change is reverted.

Do **not** run an unattended `db push` as part of a blind production deploy.
Full guidance: [MongoDB indexes](../docs/guides/mongodb-indexes.md).

## Atlas Search

Users/blog free-text search defaults to Prisma `contains` (hard-capped). For
production relevance ranking, implement Atlas Search (or another engine) behind
`SearchPort` — see the same guide.
