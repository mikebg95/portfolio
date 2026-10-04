import { describe, expect, it } from 'vitest';

import { detailMeta, neighbours } from './project-detail';

const text = {
  seriesPart: 'SERIES PART {n}',
  status: { 'in-progress': 'IN PROGRESS', 'retired-hosting': 'HOSTING RETIRED' },
};

// Register order, as getAllLocalized returns it.
const projects = [
  { slug: 'jamigos', series: false },
  { slug: 'subscription-tracker', series: true },
  { slug: 'recipe-book', series: true },
  { slug: 'journal', series: true },
  { slug: 'scentify', series: false },
];

describe('neighbours', () => {
  it('links to the projects either side', () => {
    const { previous, next } = neighbours(projects, 'recipe-book');
    expect([previous.slug, next.slug]).toEqual(['subscription-tracker', 'journal']);
  });

  it('wraps at both ends', () => {
    expect(neighbours(projects, 'jamigos').previous.slug).toBe('scentify');
    expect(neighbours(projects, 'scentify').next.slug).toBe('jamigos');
  });

  it('throws for a slug that is not there', () => {
    expect(() => neighbours(projects, 'nope')).toThrow('nope');
  });
});

describe('detailMeta', () => {
  it('adds the status unless done (copy.md 03.1)', () => {
    const jamigos = { slug: 'jamigos', period: 'AUG 2025 – NOV 2025', series: false };
    expect(detailMeta({ ...jamigos, status: 'retired-hosting' }, projects, text)).toBe(
      'AUG 2025 – NOV 2025 · HOSTING RETIRED',
    );
    expect(detailMeta({ ...jamigos, status: 'done' }, projects, text)).toBe('AUG 2025 – NOV 2025');
  });

  it('numbers a series entry by its place in the series (copy.md 03.2, 03.4)', () => {
    expect(
      detailMeta(
        { slug: 'subscription-tracker', period: 'JUN 2026', series: true, status: 'done' },
        projects,
        text,
      ),
    ).toBe('JUN 2026 · SERIES PART 1');
    expect(
      detailMeta(
        { slug: 'journal', period: 'JUL 2026 – NOW', series: true, status: 'in-progress' },
        projects,
        text,
      ),
    ).toBe('JUL 2026 – NOW · SERIES PART 3 · IN PROGRESS');
  });
});
