import { describe, expect, it } from 'vitest';

import { firstValueQueryParser } from '@/app/config/query-parser';

describe('firstValueQueryParser', () => {
  it('keeps the first value when duplicate keys are present', () => {
    const parsed = firstValueQueryParser('id=1&id=2&page=3');
    expect(parsed.id).toBe('1');
    expect(parsed.page).toBe('3');
  });

  it('returns scalar values unchanged', () => {
    const parsed = firstValueQueryParser('q=hello&limit=10');
    expect(parsed.q).toBe('hello');
    expect(parsed.limit).toBe('10');
  });
});
