import { describe, expect, it } from 'vitest';

import { parseDurationMs } from '@/app/config/parse-duration';

describe('parseDurationMs', () => {
  it('parses unit suffixes', () => {
    expect(parseDurationMs('15s', 0)).toBe(15_000);
    expect(parseDurationMs('15m', 0)).toBe(900_000);
    expect(parseDurationMs('2h', 0)).toBe(7_200_000);
    expect(parseDurationMs('7d', 0)).toBe(604_800_000);
  });

  it('treats bare integers as milliseconds', () => {
    expect(parseDurationMs('604800000', 0)).toBe(604_800_000);
  });

  it('falls back on garbage', () => {
    expect(parseDurationMs('nope', 42)).toBe(42);
  });
});
