# Prisma

MongoDB models for Backend Init. Prisma does **not** run SQL migrations against
Mongo — use `db push` (and `prisma generate`) in development.

```
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
