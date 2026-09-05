/**
 * Cross-module facade for blacklist operations (maintenance workers, etc.).
 * Prefer importing from `@/modules/auth` instead of deep infrastructure paths.
 */
export { BlacklistProvider, blacklistProvider, hashToken } from './blacklist.provider';
