import { describe, expect, it } from 'vitest';

import { dismisses, neighbours, scrollToKeep } from './part-sheet';

describe('neighbours', () => {
  const items = [1, 2, 3, 4, 5];

  it('steps to the parts either side', () => {
    expect(neighbours(items, 3)).toEqual({ previous: 2, next: 4 });
  });

  it('has no step past either end', () => {
    expect(neighbours(items, 1)).toEqual({ previous: undefined, next: 2 });
    expect(neighbours(items, 5)).toEqual({ previous: 4, next: undefined });
  });

  it('orders by item, whatever order the page lists them in', () => {
    expect(neighbours([5, 4, 3, 2, 1], 4)).toEqual({ previous: 3, next: 5 });
  });

  it('has no steps for an unknown part', () => {
    expect(neighbours(items, 9)).toEqual({});
  });
});

describe('dismisses', () => {
  it('closes on a long drag down, or a quarter of a short sheet', () => {
    expect(dismisses(130, 1000, 600)).toBe(true);
    expect(dismisses(110, 1000, 600)).toBe(false);
    expect(dismisses(80, 1000, 300)).toBe(true);
  });

  it('closes on a fast flick', () => {
    expect(dismisses(60, 80, 600)).toBe(true);
    expect(dismisses(60, 400, 600)).toBe(false);
  });

  it('never closes on a drag up or none', () => {
    expect(dismisses(0, 10, 600)).toBe(false);
    expect(dismisses(-200, 10, 600)).toBe(false);
  });
});

describe('scrollToKeep', () => {
  it('centres the box in the room above the sheet', () => {
    expect(scrollToKeep(500, 100, 400)).toBe(350);
    expect(scrollToKeep(150, 100, 400)).toBe(0);
    expect(scrollToKeep(-100, 100, 400)).toBe(-250);
  });
});
