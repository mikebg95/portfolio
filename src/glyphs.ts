import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { create, type Font } from 'fontkit';
import { decompress } from 'wawoff2';

import { FONT_DIR } from './styles/fonts';

// Text drawn as glyph outlines from the site's own font files, for images rendered at build time
// (the Open Graph cards, the site icons): the output needs no fonts installed where it is built.

/** A font file from `public/fonts/`, at the given variation axes (`wght`, `wdth`) if any. */
export async function openWoff2(file: string, variation?: Record<string, number>): Promise<Font> {
  // Paths from the project root: `astro build` and Vitest both run there.
  const woff2 = readFileSync(join(process.cwd(), 'public', FONT_DIR, file));
  // fontkit reads WOFF2 but cannot apply a variation to it; a TTF it can.
  const font = create(Buffer.from(await decompress(woff2)));
  if (!('getVariation' in font)) throw new Error(`${file} is a font collection`);
  return variation ? font.getVariation(variation) : font;
}

export interface Run {
  /** SVG path data, the baseline's left end at (x, y). */
  d: string;
  width: number;
}

/** `text` as glyph outlines at `size` px, `tracking` em added after each glyph (CSS letter-spacing). */
export function run(font: Font, text: string, size: number, x = 0, y = 0, tracking = 0): Run {
  const scale = size / font.unitsPerEm;
  const { glyphs, positions } = font.layout(text);
  let pen = x;
  let d = '';
  glyphs.forEach((glyph, i) => {
    // A missing glyph would be drawn as a box: fail the build instead.
    if (glyph.id === 0) throw new Error(`${font.familyName} has no glyph for "${text}"`);
    const position = positions[i]!;
    d += glyph.path
      .scale(scale, -scale)
      .translate(pen + position.xOffset * scale, y - position.yOffset * scale)
      .toSVG();
    pen += position.xAdvance * scale + tracking * size;
  });
  return { d, width: pen - x - (glyphs.length > 0 ? tracking * size : 0) };
}
