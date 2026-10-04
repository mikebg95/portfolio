import { describe, expect, it } from 'vitest';

import {
  fitHeading,
  OG_HEIGHT,
  OG_WIDTH,
  ogImageParam,
  ogImagePath,
  renderOgPng,
  wrap,
  type OgCard,
} from '../../src/og';

/** A PNG's IHDR width and height. */
const pngSize = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

const card = (heading: string[]): OgCard => ({
  label: 'SHEET 02 — EXPERIENCE',
  heading,
  cells: [
    { caption: 'PROJECT', value: 'MICHAEL GOLDMAN' },
    { caption: 'SHEET', value: '02 / 05' },
  ],
  site: 'michaelgoldman.dev',
});

describe('ogImagePath', () => {
  it.each([
    ['en', '/', '/og/en/index.png'],
    ['nl', '/', '/og/nl/index.png'],
    ['en', '/experience', '/og/en/experience.png'],
    ['nl', '/projects/jamigos', '/og/nl/projects/jamigos.png'],
    ['en', '/404', '/og/en/404.png'],
  ] as const)('%s %s → %s', (lang, path, image) => {
    expect(ogImagePath(lang, path)).toBe(image);
    expect(`/og/${ogImageParam(lang, path)}.png`).toBe(image);
  });
});

// One unit per character: easy to reason about widths.
const chars = (text: string) => text.length;

describe('wrap', () => {
  it('keeps the given lines and breaks a line only where it overflows', () => {
    expect(wrap(['HOW THIS', 'ENGINEER WAS ASSEMBLED'], chars, 12)).toEqual([
      'HOW THIS',
      'ENGINEER WAS',
      'ASSEMBLED',
    ]);
  });

  it('never splits a word', () => {
    expect(wrap(['SUBSCRIPTION'], chars, 4)).toEqual(['SUBSCRIPTION']);
  });
});

describe('fitHeading', () => {
  const box = { width: 400, height: 300, max: 112, min: 40, lineHeight: 1 };
  const measure = (text: string, size: number) => text.length * size * 0.5;

  it('uses the largest size that fits on the lines given', () => {
    // 'GOLDMAN' at 112 px is 392 wide; two lines of 112 fit 300 high.
    expect(fitHeading(['MICHAEL', 'GOLDMAN'], measure, box)).toEqual({
      size: 112,
      lines: ['MICHAEL', 'GOLDMAN'],
    });
  });

  it('shrinks until the wrapped lines fit both width and height', () => {
    const { size, lines } = fitHeading(['WHERE I HAVE WORKED SO FAR'], measure, box);
    expect(lines.every((l) => measure(l, size) <= box.width)).toBe(true);
    expect(lines.length * size).toBeLessThanOrEqual(box.height);
    expect(size).toBeLessThan(112);
  });

  it('stops at the minimum size', () => {
    expect(fitHeading(['X'.repeat(100)], measure, box).size).toBe(40);
  });
});

describe('renderOgPng', () => {
  it('renders a 1200×630 PNG', async () => {
    const png = await renderOgPng(card(['EXPERIENCE', 'ON RECORD']));
    expect([...png.slice(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    expect(pngSize(png)).toEqual({ width: OG_WIDTH, height: OG_HEIGHT });
  });

  it('fails on a character the fonts cannot draw, rather than drawing a box', async () => {
    await expect(renderOgPng(card(['REV △']))).rejects.toThrow(/no glyph/);
  });
});
