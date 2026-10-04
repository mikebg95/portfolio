import { describe, expect, it } from 'vitest';

import {
  AXIS_OVERRUN,
  diamond,
  explode,
  EXPLODE,
  layout,
  partFromHash,
  partHash,
  PLATE_GAP,
  STACK_GAP,
} from './assembly';

// The five education parts as in src/content/education/en (PR-32).
const PARTS = [
  { item: 1, plate: { size: 'full', style: 'solid' } },
  { item: 2, plate: { size: 'full', style: 'solid' } },
  { item: 3, plate: { size: 'full', style: 'solid' } },
  { item: 4, plate: { size: 'small', style: 'solid' } },
  { item: 5, plate: { size: 'full', style: 'dashed' } },
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

describe('explode', () => {
  const a = layout(PARTS);
  const e = explode(a);
  const at = (item: number) => {
    const found = e.find((p) => p.item === item);
    if (!found) throw new Error(`no part ${item}`);
    return found;
  };

  it('piles the solid plates onto the base plate, 6 units apart', () => {
    const assembled = a.plates.map((p, i) => p.cy + (e[i]?.drop ?? 0));
    // Items 4, 3, 2, 1 (5 is dashed and not in the stack).
    expect(assembled.slice(1)).toEqual(
      [3, 2, 1, 0].map((level) => (a.plates[4]?.cy ?? 0) - level * STACK_GAP),
    );
    expect(at(1).drop).toBe(0);
    expect(at(5).drop).toBe(0);
    expect([4, 3, 2].every((item) => at(item).drop > 0)).toBe(true);
  });

  it('raises the top plate first and keeps the base plate still', () => {
    const starts = [4, 3, 2].map((item) => at(item).move?.[0]);
    expect(starts).toEqual([...starts].sort((x = 0, y = 0) => x - y));
    expect(starts[0]).toBe(0);
    expect(at(1).move).toBeNull();
    expect(at(5).move).toBeNull();
  });

  it('shows each callout as its plate arrives, the base one with the last plate', () => {
    for (const item of [4, 3, 2]) expect(at(item).callout[0]).toBe(at(item).move?.[1]);
    expect(at(1).callout).toEqual(at(2).callout);
  });

  it('fades the dashed plate in last, and keeps every window inside 0–1', () => {
    expect(at(5).fade).toEqual(EXPLODE.fade);
    const solidEnds = [1, 2, 3, 4].map((item) => at(item).callout[1]);
    expect(Math.max(...solidEnds)).toBeLessThanOrEqual(EXPLODE.fade[0]);
    for (const p of e) {
      for (const [from, to] of [p.move, p.callout, p.fade].filter((w) => w !== null)) {
        expect(from).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThanOrEqual(1);
        expect(to).toBeGreaterThan(from);
      }
    }
    expect(at(5).callout[1]).toBe(1);
  });
});

describe('partFromHash', () => {
  const items = [1, 2, 3, 4, 5];

  it('reads the part a #part-n hash names, and round-trips partHash', () => {
    expect(partFromHash('#part-4', items)).toBe(4);
    expect(partFromHash(partHash(1), items)).toBe(1);
  });

  it('ignores other hashes and parts that do not exist', () => {
    for (const hash of ['', '#', '#part-', '#part-6', '#part-0', '#part-3x', '#ckad', 'part-3']) {
      expect(partFromHash(hash, items)).toBeUndefined();
    }
  });
});
