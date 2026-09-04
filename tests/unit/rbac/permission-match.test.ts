import { describe, expect, it } from 'vitest';

import { permissionSatisfied } from '@/modules/rbac/domain/permission-match';

describe('permissionSatisfied', () => {
  it('matches exact permission', () => {
    expect(permissionSatisfied(['blog:create'], 'blog:create')).toBe(true);
    expect(permissionSatisfied(['blog:create'], 'blog:publish')).toBe(false);
  });

  it('lets :any satisfy a required :own permission', () => {
    expect(permissionSatisfied(['blog:update:any'], 'blog:update:own')).toBe(true);
    expect(permissionSatisfied(['blog:delete:any'], 'blog:delete:own')).toBe(true);
  });

  it('does not let :own satisfy :any', () => {
    expect(permissionSatisfied(['blog:update:own'], 'blog:update:any')).toBe(false);
  });

  it('does not cross resources', () => {
    expect(permissionSatisfied(['user:update:any'], 'blog:update:own')).toBe(false);
  });
});
