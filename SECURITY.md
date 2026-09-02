# Security Policy

## Supported versions

| Version                                 | Supported        |
| --------------------------------------- | ---------------- |
| `1.x` (default branch / latest release) | Yes              |
| Older tags / forks                      | Best effort only |

Backend Init is a template. Consumers are responsible for hardening deployments,
rotating secrets, and applying dependency updates in their own forks.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please email **kenwoubarthez@gmail.com** with:

1. A clear description of the issue and impact
2. Steps to reproduce or a proof of concept
3. Affected commit / tag if known
4. Any suggested remediation (optional)

You should receive an acknowledgement within **7 days**. We will work with you
on a fix timeline appropriate to severity and coordinate disclosure when a patch
is available.

## Scope (examples)

In scope for this repository:

- Authentication / authorization bypass in template modules
- Remote code execution or injection in sample endpoints
- Insecure defaults that would harm typical production deployments of the
  template
- Secrets accidentally committed in tracked files

Out of scope:

- Denial of service against a privately deployed instance you do not own
- Issues only present after unsafe local configuration (e.g. disabled auth in a
  personal experiment)
- Vulnerabilities solely in third-party dependencies — prefer upstream
  reporting; we still appreciate a heads-up with CVE links

## Secure use of the template

- Mount JWT keys and inject secrets at runtime
  ([docs/deployment/production.md](./docs/deployment/production.md))
- Disable or protect Swagger and Bull Board in public environments
- Keep `STORAGE_PROVIDER`, upload validation, and ClamAV configured for
  untrusted uploads
- Run `npm audit` / Dependabot (or equivalent) on your fork

Thank you for helping keep Backend Init and its downstream users safer.
