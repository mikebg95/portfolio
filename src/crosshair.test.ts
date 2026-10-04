import { describe, expect, it } from 'vitest';

import { formatCoordinate, formatReadout } from './crosshair';

describe('formatCoordinate', () => {
  it('pads whole pixels to four digits', () => {
    expect(formatCoordinate(412)).toBe('0412');
    expect(formatCoordinate(232.6)).toBe('0233');
    expect(formatCoordinate(0)).toBe('0000');
    expect(formatCoordinate(12345)).toBe('12345');
  });

  it('never goes negative', () => {
    expect(formatCoordinate(-3)).toBe('0000');
  });
});

describe('formatReadout', () => {
  it('writes the §M6 readout', () => {
    expect(formatReadout(412, 233)).toBe('X 0412 · Y 0233');
  });
});
