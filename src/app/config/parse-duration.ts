/**
 * Parse human durations used in env files into milliseconds.
 *
 * Accepted: `500` (ms), `15s`, `15m`, `2h`, `7d`.
 * Bare integers are milliseconds (Express `maxAge` convention).
 */
export const parseDurationMs = (raw: string | number, fallbackMs: number): number => {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }

  const value = String(raw ?? '').trim();
  if (!value) return fallbackMs;

  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i.exec(value);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return fallbackMs;

  const unit = (match[2] ?? 'ms').toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const ms = amount * (multipliers[unit] ?? 1);
  return ms > 0 ? Math.floor(ms) : fallbackMs;
};
