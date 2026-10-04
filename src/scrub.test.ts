import { describe, expect, it } from 'vitest';

import { cubicBezier, parseCubicBezier } from './scrub';

describe('parseCubicBezier', () => {
  it('reads a token value as the browser serialises it', () => {
    expect(parseCubicBezier('cubic-bezier(0.7, 0, 0.2, 1)')).toEqual([0.7, 0, 0.2, 1]);
    expect(parseCubicBezier(' cubic-bezier(.34,1.7,.5,1) ')).toEqual([0.34, 1.7, 0.5, 1]);
  });

  it('refuses anything else', () => {
    for (const value of ['', 'ease-out', 'cubic-bezier(1, 2, 3)', 'cubic-bezier(a, 0, 0, 1)']) {
      expect(parseCubicBezier(value)).toBeNull();
    }
  });
});

describe('cubicBezier', () => {
  it('starts at 0 and ends at 1', () => {
    const plot = cubicBezier(0.7, 0, 0.2, 1);
    expect(plot(0)).toBe(0);
    expect(plot(1)).toBe(1);
    expect(plot(-1)).toBe(0);
    expect(plot(2)).toBe(1);
  });

  it('is the identity for a straight curve', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0.1, 0.25, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 4);
  });

  it('matches the CSS curves the motion tokens name', () => {
    const plot = cubicBezier(0.7, 0, 0.2, 1);
    // Slow off the mark, fast through the middle, settling (values bisected independently).
    expect(plot(0.2)).toBeCloseTo(0.03767, 4);
    expect(plot(0.5)).toBeCloseTo(0.63577, 4);
    expect(plot(0.8)).toBeCloseTo(0.9731, 4);
    // --ease-pop overshoots before it settles.
    const pop = cubicBezier(0.34, 1.7, 0.5, 1);
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8].map(pop))).toBeGreaterThan(1);
  });
});
