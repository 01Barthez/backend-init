import qs from 'qs';

/**
 * Deterministic query parsing: duplicate keys keep the first value only.
 * Prevents HTTP parameter pollution (?id=1&id=2) from yielding arrays mid-stack.
 */
export const firstValueQueryParser = (str: string): qs.ParsedQs => {
  const parsed = qs.parse(str);
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(parsed)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }

  return normalized as qs.ParsedQs;
};
