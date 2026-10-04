import { describe, expect, it } from 'vitest';

import { formatDuration, layout, monthIndex, nowIndex, place, ruler } from './timeline';

// The four experience entries as in src/content/experience/en (PR-17).
const ENTRIES = [
  { id: 'optiecon', start: '2026-06', end: null },
  { id: 'sabbatical', start: '2026-01', end: '2026-05' },
  { id: 'dji', start: '2024-01', end: '2026-01' },
  { id: 'linkpizza', start: '2021-02', end: '2023-10' },
];
const BUILD = new Date(Date.UTC(2026, 9, 4));

const bar = (id: string, now = BUILD) => {
  const found = layout(ENTRIES, now).bars.find((b) => b.entry.id === id);
  if (!found) throw new Error(`no bar ${id}`);
  return found;
};

describe('ruler', () => {
  it('runs from Jan of the first start year to the January after the build date', () => {
    const r = ruler(ENTRIES, BUILD);
    expect(r.start).toBe(monthIndex('2021-01'));
    expect(r.end).toBe(monthIndex('2027-01'));
    expect(r.years).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
  });

  it('grows a column when the build date crosses into a new year', () => {
    const r = ruler(ENTRIES, new Date(Date.UTC(2027, 0, 1)));
    expect(r.end).toBe(monthIndex('2028-01'));
    expect(r.years.at(-1)).toBe(2027);
  });

  it('covers an end later than the build year', () => {
    expect(ruler([{ start: '2025-03', end: '2028-02' }], BUILD).end).toBe(monthIndex('2029-01'));
  });
});

describe('layout — the drawing (experience-default-light-1440)', () => {
  it('places LinkPizza at 1.4% / 44.4%', () => {
    expect(bar('linkpizza').left).toBeCloseTo(1.4, 1);
    expect(bar('linkpizza').width).toBeCloseTo(44.4, 1);
  });

  it('places DJI at 50% / 33.3%', () => {
    expect(bar('dji').left).toBeCloseTo(50, 1);
    expect(bar('dji').width).toBeCloseTo(33.3, 1);
  });

  it('draws the sabbatical at 83.3% / 6.9%, up to the next start', () => {
    expect(bar('sabbatical').left).toBeCloseTo(83.3, 1);
    expect(bar('sabbatical').width).toBeCloseTo(6.9, 1);
    expect(bar('sabbatical').left + bar('sabbatical').width).toBeCloseTo(bar('optiecon').left, 6);
  });

  it('starts OptieCon at 90.3% with an open end to the right edge', () => {
    const o = bar('optiecon');
    expect(o.left).toBeCloseTo(90.3, 1);
    expect(o.open).toBe(true);
    expect(o.left + o.width).toBe(100);
  });

  it('sorts bars by start, whatever the input order', () => {
    expect(layout(ENTRIES, BUILD).bars.map((b) => b.entry.id)).toEqual([
      'linkpizza',
      'dji',
      'sabbatical',
      'optiecon',
    ]);
  });

  it('does not stretch a bar across a real gap or a shared month', () => {
    expect(bar('linkpizza').months).toBe(32); // Oct 2023 → Jan 2024: a gap
    expect(bar('dji').months).toBe(24); // ends the month the sabbatical starts
  });

  it('places the Conspect dimension line at 47.2%, open-ended', () => {
    const p = place({ start: '2023-11', end: null }, ruler(ENTRIES, BUILD), BUILD);
    expect(p.left).toBeCloseTo(47.2, 1);
    expect(p.width).toBeCloseTo(52.8, 1);
  });
});

describe('durations', () => {
  it('labels the drawn durations', () => {
    expect(formatDuration(bar('linkpizza').months)).toBe('2 Y 8 M');
    expect(formatDuration(bar('dji').months)).toBe('2 Y 0 M');
  });

  it('formats whole years and months', () => {
    expect(formatDuration(0)).toBe('0 Y 0 M');
    expect(formatDuration(11)).toBe('0 Y 11 M');
    expect(formatDuration(12)).toBe('1 Y 0 M');
    expect(formatDuration(65)).toBe('5 Y 5 M');
  });

  it('counts an open end to the build date, rounded to the nearest month', () => {
    // Jun 2026 → 4 Oct 2026: 4.1 months → 4
    expect(bar('optiecon').months).toBe(4);
    // Jun 2026 → 20 Oct 2026: 4.6 months → 5
    expect(bar('optiecon', new Date(Date.UTC(2026, 9, 20))).months).toBe(5);
    // Jun 2026 → 1 Jun 2027: exactly 12
    expect(formatDuration(bar('optiecon', new Date(Date.UTC(2027, 5, 1))).months)).toBe('1 Y 0 M');
  });

  it('reads the build date in UTC', () => {
    expect(nowIndex(new Date('2026-10-01T00:00:00Z'))).toBe(monthIndex('2026-10'));
    expect(nowIndex(new Date('2026-09-30T23:30:00-02:00'))).toBe(monthIndex('2026-10'));
  });
});

describe('monthIndex', () => {
  it('rejects anything but YYYY-MM', () => {
    expect(() => monthIndex('2026-13')).toThrow();
    expect(() => monthIndex('2026')).toThrow();
  });
});
