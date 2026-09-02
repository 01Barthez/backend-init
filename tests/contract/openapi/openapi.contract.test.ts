import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';

const OPENAPI_PATH = resolve(process.cwd(), 'docs/api/openapi.yaml');

const REQUIRED_PATHS = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/users',
  '/api/v1/users/profile',
  '/api/v1/blogs',
];

describe('OpenAPI contract', () => {
  it('validates against the OpenAPI / Swagger schema', () => {
    expect(() =>
      execFileSync('npx', ['swagger-cli', 'validate', OPENAPI_PATH], {
        stdio: 'pipe',
        encoding: 'utf8',
      }),
    ).not.toThrow();
  });

  it('documents the critical API paths', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');

    for (const path of REQUIRED_PATHS) {
      expect(document, `missing path ${path}`).toContain(`  ${path}:`);
    }
  });

  it('declares bearer JWT security and documents refresh cookie usage', () => {
    const document = readFileSync(OPENAPI_PATH, 'utf8');

    expect(document).toMatch(/bearerAuth:/);
    expect(document).toMatch(/scheme:\s*bearer/i);
    expect(document).toMatch(/refresh/i);
  });
});
