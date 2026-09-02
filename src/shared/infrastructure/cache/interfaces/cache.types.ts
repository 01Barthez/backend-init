/** Values that may be stored in the multi-tier cache. */
export type CacheableData = string | number | object | null;

/** Common TTL presets in seconds. */
export enum CacheTTL {
  SHORT = 60,
  MEDIUM = 300,
  LONG = 900,
  VERY_LONG = 3600,
  DAY = 86400,
}
