import type { Font } from 'fontkit';

import { openWoff2 } from './glyphs';
import { DISPLAY_FONT, FONT_DIR } from './styles/fonts';
import { tokenNumber } from './tokens-file';

// PR-61: a display heading never breaks inside a word. Its font size is capped at
// `100cqi / fit`, where `fit` is the em-width of its longest word, measured here once at build
// time from the site's own Archivo file at the token weight and stretch (DisplayHeading.astro).

/** Rendering differs from fontkit's layout by a hair (hinting, subpixel positions): keep 2 %. */
export const FIT_MARGIN = 1.02;

/** Width taken by a character the latin subset lacks (→ ↗ △ fall back to a system font). */
const MISSING_GLYPH_EM = 1;

let display: Promise<Font> | undefined;
const loadDisplay = () =>
  (display ??= openWoff2(DISPLAY_FONT.slice(FONT_DIR.length + 1), {
    wght: tokenNumber('font-display-weight'),
    wdth: tokenNumber('font-display-stretch'),
  }));

/**
 * The words a heading may not break inside, uppercased as the heading shows them: split at white
 * space, and after a hyphen or slash, where a browser may break a line too ("FULL-" / "STACK").
 */
export function headingWords(text: string): string[] {
  return text
    .toUpperCase()
    .split(/\s+/)
    .flatMap((word) => word.split(/(?<=[-/])/))
    .filter(Boolean);
}

/** The visible text of rendered HTML: tags are word boundaries, Astro's entities decoded. */
export function htmlText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** A word's width in em at the display weight and stretch, letter-spacing included. */
export function wordEm(font: Font, word: string, tracking: number): number {
  const { glyphs, positions } = font.layout(word);
  const advance = glyphs.reduce(
    (sum, glyph, i) =>
      sum + (glyph.id === 0 ? MISSING_GLYPH_EM : positions[i]!.xAdvance / font.unitsPerEm),
    0,
  );
  // CSS adds the tracking after every character; the last one's is space after the ink.
  return advance + tracking * Math.max(glyphs.length - 1, 0);
}

/** The `--display-fit` of a heading's text: its longest word's em-width, with the margin. */
export async function displayFit(text: string): Promise<number> {
  const font = await loadDisplay();
  const tracking = tokenNumber('font-display-letter-spacing');
  const widest = Math.max(0, ...headingWords(text).map((word) => wordEm(font, word, tracking)));
  return Math.ceil(widest * FIT_MARGIN * 1000) / 1000;
}
