import { describe, expect, it } from 'vitest';

import { formatMonth, formatSpan } from './dates';

const words = {
  months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  now: 'NOW',
};

describe('formatMonth', () => {
  it('writes the month word and the year', () => {
    expect(formatMonth('2023-11', words)).toBe('NOV 2023');
    expect(formatMonth('2021-02', words)).toBe('FEB 2021');
    expect(formatMonth('2026-12', words)).toBe('DEC 2026');
  });

  it('writes an open end as now', () => {
    expect(formatMonth(null, words)).toBe('NOW');
  });

  it('refuses what is not a month', () => {
    expect(() => formatMonth('2023-13', words)).toThrow();
    expect(() => formatMonth('2023', words)).toThrow();
  });
});

describe('formatSpan', () => {
  it('joins start and end with an en dash by default', () => {
    expect(formatSpan({ start: '2023-11', end: null }, words)).toBe('NOV 2023 – NOW');
  });

  it('takes the detail blocks’ separator', () => {
    expect(formatSpan({ start: '2024-01', end: '2026-01' }, words, ' — ')).toBe(
      'JAN 2024 — JAN 2026',
    );
  });
});
