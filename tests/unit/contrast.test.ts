import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// SPEC §7: AA contrast (4.5:1 for text) in both themes, computed from design/tokens.json.
const colors = JSON.parse(
  readFileSync(new URL('../../design/tokens.json', import.meta.url), 'utf8'),
).color as Record<string, { light: string; dark: string }>;

/** WCAG 2.x relative luminance of a `#RRGGBB` colour. */
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function hex(token: string, mode: 'light' | 'dark'): string {
  const value = colors[token]?.[mode];
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${token}.${mode} is not #RRGGBB`);
  return value;
}

describe('text contrast from tokens', () => {
  it('reads #RRGGBB the WCAG way', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  // Paper is the light theme, blueprint the dark one (src/styles/tokens.css).
  for (const [theme, mode] of [
    ['paper', 'light'],
    ['blueprint', 'dark'],
  ] as const) {
    for (const text of ['muted', 'redline']) {
      it(`${text} on the ${theme} sheet is at least 4.5:1`, () => {
        expect(contrast(hex(text, mode), hex('paper', mode))).toBeGreaterThanOrEqual(4.5);
      });
    }

    // Pending rows may sit on a fill (docs/RECORD.md, redline darkened).
    for (const fill of ['fill-1', 'fill-3']) {
      it(`redline on ${fill} in ${theme} is at least 4.5:1`, () => {
        expect(contrast(hex('redline', mode), hex(fill, mode))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
