import { describe, expect, it } from 'vitest';

import { railIndex } from './rail';

describe('railIndex', () => {
  const offsets = [0, 294, 588, 882];

  it('is the card whose left edge is nearest the scroll position', () => {
    expect(railIndex(0, 900, offsets)).toBe(0);
    expect(railIndex(140, 900, offsets)).toBe(0);
    expect(railIndex(160, 900, offsets)).toBe(1);
    expect(railIndex(600, 900, offsets)).toBe(2);
  });

  it('is the last card once the rail is at its end', () => {
    expect(railIndex(700, 700, offsets)).toBe(3);
    expect(railIndex(699.5, 700, offsets)).toBe(3);
  });

  it('is the first card when nothing scrolls', () => {
    expect(railIndex(0, 0, offsets)).toBe(0);
    expect(railIndex(0, 0, [])).toBe(0);
  });
});
