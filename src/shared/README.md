# Shared Kernel

Code that is genuinely transversal across modules.

## Rules

1. **Do not** dump module-specific services here. If it belongs to `users` or
   `billing`, put it in that module.
2. Prefer interfaces (ports) in `domain/` or `infrastructure/*/port.ts`, and
   concrete adapters in `infrastructure/*/`.
3. Utilities must stay small and pure (`slugify`, `hashPassword`, …).

## Layout

```
shared/
├── domain/           # AppError, Result helpers, base types
├── infrastructure/   # database, cache, queue, storage, mail, logging, metrics
├── constants/        # Cross-module constants only
├── types/            # Ambient / shared TypeScript types
└── utils/            # Pure helpers (crypto, otp, http, validation)
```

## Dependency direction

```
modules/*  →  shared/*
shared     ✗→  modules/*   (forbidden)
```
