import { describe, expect, it } from 'vitest';

import { formatRev, formatSheet } from './title-block';

describe('formatRev', () => {
  it('writes the build month as YYYY.MM with a two-digit month', () => {
    expect(formatRev(new Date(Date.UTC(2026, 9, 4)))).toBe('2026.10');
    expect(formatRev(new Date(Date.UTC(2027, 0, 15)))).toBe('2027.01');
  });

  it('reads the month in UTC, not the build machine zone', () => {
    expect(formatRev(new Date('2026-12-31T23:30:00Z'))).toBe('2026.12');
    expect(formatRev(new Date('2027-01-01T00:00:00Z'))).toBe('2027.01');
  });
});

describe('formatSheet', () => {
  it('pads the sheet number and the set size', () => {
    expect(formatSheet(1, 5)).toBe('01 / 05');
    expect(formatSheet(3, 5)).toBe('03 / 05');
  });

  it('marks a page outside the set with ??', () => {
    expect(formatSheet(undefined, 5)).toBe('?? / 05');
  });
});
