import { describe, expect, it } from 'vitest';

import { AXIS_OVERRUN, diamond, layout, PLATE_GAP } from './assembly';

// The five education parts as in src/content/education/en (PR-32).
const PARTS = [
  { item: 1, plate: { size: 'full' } },
  { item: 2, plate: { size: 'full' } },
  { item: 3, plate: { size: 'full' } },
  { item: 4, plate: { size: 'small' } },
  { item: 5, plate: { size: 'full' } },
] as const;

describe('diamond', () => {
  it('is the square diagonal wide and cos 58° of it tall', () => {
    const d = diamond(250);
    expect(d.width).toBeCloseTo(353.55, 2);
    expect(d.height).toBeCloseTo(187.35, 2);
  });
});

describe('layout', () => {
  const a = layout(PARTS);

  it('stacks the highest item on top and the base plate at the bottom', () => {
    expect(a.plates.map((p) => p.part.item)).toEqual([5, 4, 3, 2, 1]);
  });

  it('centres every plate on one axis, the widest touching the left edge', () => {
    expect(a.plates.every((p) => p.cx === a.axis)).toBe(true);
    expect(a.axis).toBeCloseTo(diamond(250).width / 2);
  });

  it('draws CS50 smaller than the rest', () => {
    expect(a.plates.map((p) => p.side)).toEqual([250, 150, 250, 250, 250]);
    expect(a.plates[1]?.right).toBeLessThan(a.plates[0]?.right ?? 0);
  });

  it('never lets one plate overlap the next', () => {
    for (const [i, plate] of a.plates.entries()) {
      const next = a.plates[i + 1];
      if (next) expect(next.top - plate.bottom).toBeCloseTo(PLATE_GAP);
    }
  });

  it('puts every balloon right of the widest plate and fits the axis overrun in the height', () => {
    expect(a.plates.every((p) => p.right < a.balloon)).toBe(true);
    expect(a.plates[0]?.top).toBe(AXIS_OVERRUN);
    expect(a.height - (a.plates.at(-1)?.bottom ?? 0)).toBeCloseTo(AXIS_OVERRUN);
  });
});
