# Notifications module

Thin facade over shared mail infrastructure for transactional / templated
emails.

**Status:** intentionally deferred as a first-class product surface. There are
no HTTP routes. Prefer `@/shared/infrastructure/mail` (`queueMail` /
`sendMailDirect`) from other modules. This package remains a thin re-export so
callers can migrate later without hunting imports.

## Layout

```text
notifications/
├── application/commands/send-templated-mail.command.ts
├── index.ts
└── README.md
```

## Mail templates

**Templates live in** `src/shared/infrastructure/mail/templates/`:

| Template                                            | Purpose                      |
| --------------------------------------------------- | ---------------------------- |
| `otp`                                               | Signup / verify OTP          |
| `welcome`                                           | New account welcome          |
| `reset-password`                                    | Password reset link          |
| `alert-login`                                       | Login notification           |
| `password-changed`                                  | Password change confirmation |
| `role-changed`                                      | Role assignment notice       |
| `user-invited`                                      | Admin invite set-password    |
| `account-deleted` / `account-restored`              | Soft-delete lifecycle        |
| `db-notification-success` / `db-notification-error` | Backup job results           |

Do not duplicate EJS files inside this module — import and queue via the facade.

## Public API

```ts
import { sendTemplatedMail, queueMail, createNotificationsModule } from '@/modules/notifications';

await sendTemplatedMail({
  to: user.email,
  subject: 'Welcome',
  template: 'welcome',
  data: { name: user.firstName },
});
```

## Extension points

- Swap SMTP / queue implementation in `@/shared/infrastructure/mail` without
  changing callers.
- Add presentation routes later if you need an admin “send test email” endpoint.
