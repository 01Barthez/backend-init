/**
 * Cross-cutting constants shared by multiple modules.
 * Keep this file thin — module-specific constants belong inside that module.
 */

/** Cookie names used by the auth presentation layer. */
export const AUTH_COOKIES = {
  REFRESH_TOKEN: 'refresh_token',
} as const;

/** Built-in role slugs seeded at bootstrap. */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

/**
 * Built-in permission catalogue seeded at bootstrap.
 * Role/permission CRUD APIs are not shipped — those names are omitted so the
 * catalogue matches enforced routes. `blog:read` remains for guest seed only
 * (public list/search do not require it).
 */
export const SYSTEM_PERMISSIONS = [
  { name: 'user:read:any', resource: 'user', action: 'read:any' },
  { name: 'user:update:any', resource: 'user', action: 'update:any' },
  { name: 'user:delete:any', resource: 'user', action: 'delete:any' },
  { name: 'user:export', resource: 'user', action: 'export' },
  { name: 'user:role:assign', resource: 'user', action: 'role:assign' },
  { name: 'blog:read', resource: 'blog', action: 'read' },
  { name: 'blog:create', resource: 'blog', action: 'create' },
  { name: 'blog:update:own', resource: 'blog', action: 'update:own' },
  { name: 'blog:update:any', resource: 'blog', action: 'update:any' },
  { name: 'blog:delete:own', resource: 'blog', action: 'delete:own' },
  { name: 'blog:delete:any', resource: 'blog', action: 'delete:any' },
  { name: 'blog:publish', resource: 'blog', action: 'publish' },
  { name: 'audit:read', resource: 'audit', action: 'read' },
] as const;

/**
 * Logical storage bucket *defaults*. Runtime names come from
 * `config.storage.minio.appBucket` / `backupBucket` (MINIO_*_BUCKET env).
 */
export const STORAGE_BUCKETS = {
  UPLOADS: 'app-uploads',
  BACKUPS: 'backups',
} as const;

/** Object-key prefixes inside the uploads bucket. */
export const STORAGE_PATHS = {
  USER_AVATARS: 'users/avatars',
} as const;

/** BullMQ queue names. */
export const QUEUE_NAMES = {
  MAIL: 'mail',
  BACKUP: 'backup',
  MAINTENANCE: 'maintenance',
  HEAVY_TASKS: 'heavy-tasks',
} as const;
