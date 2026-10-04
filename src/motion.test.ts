import { describe, expect, it } from 'vitest';

import { columnIndices, countFrame, parseDelay } from './motion';

describe('parseDelay', () => {
  it('reads milliseconds', () => {
    expect(parseDelay('80')).toBe(80);
    expect(parseDelay('160.4')).toBe(160);
  });

  it('treats anything else as no delay', () => {
    for (const value of [undefined, null, '', '-80', 'abc', 'Infinity', '0']) {
      expect(parseDelay(value), String(value)).toBe(0);
    }
  });
});

describe('columnIndices', () => {
  it('numbers the columns from the left, rows repeating', () => {
    expect(columnIndices([24, 340.2, 656, 24, 339.8, 656])).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('puts a single column at 0', () => {
    expect(columnIndices([24, 24, 24])).toEqual([0, 0, 0]);
  });

  it('is empty for no items', () => {
    expect(columnIndices([])).toEqual([]);
  });
});

describe('countFrame', () => {
  it('scales every whole number and keeps the words', () => {
    expect(countFrame('251 TESTS', 0)).toBe('0 TESTS');
    expect(countFrame('251 TESTS', 0.5)).toBe('126 TESTS');
    expect(countFrame('2 Y 8 M', 0.5)).toBe('1 Y 4 M');
    expect(countFrame('63', 1)).toBe('63');
  });
});
