export type CacheableData = string | number | object | null;

export enum CacheTTL {
  SHORT = 60, // 1 minute
  MEDIUM = 300, // 5 minutes
  LONG = 900, // 15 minutes
  VERY_LONG = 3600, // 1 hour
  DAY = 86400, // 24 hours
}
