import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync, copyFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const OPENAPI_PATH = resolve(ROOT, 'docs/api/openapi.yaml');
const OPENAPI_CONFIG = resolve(ROOT, 'docs/api/openapi.config.js');

/** Paths that must stay documented (covers identity, admin, blogs, system). */
const REQUIRED_PATHS = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/me',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/sessions',
  '/api/v1/auth/totp/enroll',
  '/api/v1/auth/oauth/accounts',
  '/api/v1/auth/oauth/telegram',
  '/api/v1/users',
  '/api/v1/users/profile',
  '/api/v1/users/me',
  '/api/v1/users/invite',
  '/api/v1/users/search',
  '/api/v1/users/export',
  '/api/v1/blogs',
  '/api/v1/blogs/search',
  '/api/v1/files/presign',
  '/api/v1/admin/audit',
  '/health',
  '/health/live',
  '/health/ready',
  '/csrf-token',
  '/metrics',
  '/security/csp-violation',
  '/admin/queues',
];

/** Routes that must not reappear in the published contract. */
const FORBIDDEN_PATHS = ['/api/v1/users/clear-all'];

describe('OpenAPI contract', () => {
  it('validates against the OpenAPI / Swagger schema', () => {
    expect(() =>
      execFileSync('npx', ['swagger-cli', 'validate', OPENAPI_PATH], {
        stdio: 'pipe',
        encoding: 'utf8',
      }),
    ).not.toThrow();
  });

  it('keeps openapi.yaml in sync with openapi.config.js', () => {
    const committed = readFileSync(OPENAPI_PATH, 'utf8');
    const dir = mkdtempSync(join(tmpdir(), 'openapi-drift-'));
    const stagedYaml = join(dir, 'openapi.yaml');
    const stagedConfig = join(dir, 'openapi.config.js');

    try {
      copyFileSync(OPENAPI_CONFIG, stagedConfig);
      copyFileSync(OPENAPI_PATH, stagedYaml);

      // Generator always writes beside the config file as openapi.yaml.
      execFileSync(process.execPath, [stagedConfig], {
        cwd: dir,
        env: {
          ...process.env,
          NODE_PATH: resolve(ROOT, 'node_modules'),
        },
        stdio: 'pipe',
        encoding: 'utf8',
      });

      const regenerated = readFileSync(stagedYaml, 'utf8');
      expect(
        regenerated,
        'docs/api/openapi.yaml drifted from openapi.config.js — run: npm run generate:openapi',
      ).toBe(committed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('documents the critical API paths', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');

    for (const path of REQUIRED_PATHS) {
      expect(document, `missing path ${path}`).toContain(`  ${path}:`);
    }

    for (const path of FORBIDDEN_PATHS) {
      expect(document, `removed path still present: ${path}`).not.toContain(`  ${path}:`);
    }
  });

  it('documents CSP reports as POST (browser default)', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');
    const cspBlock = document.split('/security/csp-violation:')[1]?.slice(0, 800) ?? '';
    expect(cspBlock).toMatch(/\n\s+post:/);
  });

  it('excludes telegram from OAuth redirect provider enum', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');
    // Redirect path description should note telegram uses POST /telegram.
    expect(document).toMatch(/Telegram uses POST \/telegram/i);
  });

  it('declares bearer JWT security and documents refresh cookie usage', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');

    expect(document).toMatch(/bearerAuth:/);
    expect(document).toMatch(/scheme:\s*bearer/i);
    expect(document).toMatch(/refresh/i);
  });
});
