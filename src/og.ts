import { Resvg } from '@resvg/resvg-js';
import type { Font } from 'fontkit';

import { OG_IMAGE_DIR } from './config';
import { openWoff2, run } from './glyphs';
import type { Lang } from './i18n/paths';
import { token, tokenNumber } from './tokens-file';

// SPEC §3.8, design/README.md "Not drawn": the Open Graph image of a page, rendered at build time
// as a mini sheet — desk, paper + grid, double frame, zone strip, the sheet label, the page's
// display heading, a small title block with the site's host. Paper theme. Text is drawn as glyph
// outlines from the site's own font files, so the PNG needs no fonts installed where it is built.

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The image of a page: `('nl', '/projects/jamigos')` → `/og/nl/projects/jamigos.png`. */
export const ogImagePath = (lang: Lang, path: string) =>
  `${OG_IMAGE_DIR}/${ogImageParam(lang, path)}.png`;

/** The `[...card]` route param of that image: `nl/projects/jamigos`; `/` is `index`. */
export const ogImageParam = (lang: Lang, path: string) =>
  `${lang}/${path === '/' ? 'index' : path.replace(/^\/+|\/+$/g, '')}`;

export interface OgCard {
  /** The page's SheetLabel, `SHEET 02 — EXPERIENCE · …`. */
  label: string;
  /** The page's display heading, one entry per drawn line (re-wrapped to fit). */
  heading: readonly string[];
  /** The title block's top row, `PROJECT MICHAEL GOLDMAN` · `SHEET 02 / 05`. */
  cells: readonly { caption: string; value: string }[];
  /** The bottom row: the site's host, `michaelgoldman.dev`. */
  site: string;
}

const px = tokenNumber;
/** `0.12em` → 0.12. */
const em = tokenNumber;

const COLOR = {
  desk: token('color-desk'),
  paper: token('color-paper'),
  ink: token('color-ink'),
  muted: token('color-muted'),
  line: token('color-line'),
  gridMajor: token('color-grid-major'),
  gridMinor: token('color-grid-minor'),
};

/** The site's sizes, scaled up: a link preview shows the card at about 500 px wide. */
const LAYOUT = {
  deskPadding: 24,
  frameOuter: px('sheet-frame-outer'),
  frameGap: px('sheet-frame-gap'),
  frameInner: px('sheet-frame-inner'),
  gridMinor: px('sheet-grid-minor'),
  gridMajor: px('sheet-grid-major'),
  zoneHeight: 24,
  zoneSize: 13,
  padding: px('sheet-content-padding'),
  labelSize: 22,
  headingGap: 30,
  headingMax: 112,
  headingMin: 40,
  headingLineHeight: 0.9,
  titleBlockWidth: 560,
  captionSize: 13,
  valueSize: 20,
  siteSize: 26,
};

interface Faces {
  display: Font;
  mono: Font;
  monoMedium: Font;
}

let faces: Promise<Faces> | undefined;
const loadFaces = () =>
  (faces ??= (async () => ({
    // components.md DisplayHeading: Archivo at the token weight and stretch.
    display: await openWoff2('archivo-latin-wdth-normal.woff2', {
      wght: px('font-display-weight'),
      wdth: px('font-display-stretch'),
    }),
    mono: await openWoff2('ibm-plex-mono-latin-400-normal.woff2'),
    monoMedium: await openWoff2('ibm-plex-mono-latin-500-normal.woff2'),
  }))());

/** Greedy word wrap of each given line to `maxWidth`. */
export function wrap(
  lines: readonly string[],
  measure: (text: string) => number,
  maxWidth: number,
): string[] {
  return lines.flatMap((line) => {
    const out: string[] = [];
    for (const word of line.split(/\s+/).filter(Boolean)) {
      const last = out.at(-1);
      if (last !== undefined && measure(`${last} ${word}`) <= maxWidth)
        out[out.length - 1] = `${last} ${word}`;
      else out.push(word);
    }
    return out;
  });
}

/** The largest heading size (in 4 px steps) whose wrapped lines fit the box; the minimum if none. */
export function fitHeading(
  heading: readonly string[],
  measure: (text: string, size: number) => number,
  box: { width: number; height: number; max: number; min: number; lineHeight: number },
): { size: number; lines: string[] } {
  for (let size = box.max; ; size -= 4) {
    const lines = wrap(heading, (text) => measure(text, size), box.width);
    const fits =
      lines.every((l) => measure(l, size) <= box.width) &&
      lines.length * size * box.lineHeight <= box.height;
    if (fits || size - 4 < box.min) return { size, lines };
  }
}

const rect = (x: number, y: number, w: number, h: number, attrs: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs}/>`;
const path = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

/** The card as SVG, every text already outlined. */
export function ogSvg(card: OgCard, f: Faces): string {
  const L = LAYOUT;
  const sheet = { x: L.deskPadding, y: L.deskPadding };
  const sheetW = OG_WIDTH - 2 * L.deskPadding;
  const sheetH = OG_HEIGHT - 2 * L.deskPadding;
  const innerX = sheet.x + L.frameOuter + L.frameGap;
  const innerY = sheet.y + L.frameOuter + L.frameGap;
  const innerW = sheetW - 2 * (L.frameOuter + L.frameGap);
  const innerH = sheetH - 2 * (L.frameOuter + L.frameGap);
  const innerRight = innerX + innerW;
  const innerBottom = innerY + innerH;
  const out: string[] = [];

  // Desk, paper, grid (the CSS gradients: a 1 px line on the top and left of every cell).
  const gridOrigin = `x="${sheet.x + L.frameOuter}" y="${sheet.y + L.frameOuter}"`;
  const grid = (id: string, size: number, color: string) =>
    `<pattern id="${id}" ${gridOrigin} width="${size}" height="${size}" patternUnits="userSpaceOnUse">` +
    `${rect(0, 0, size, 1, `fill="${color}"`)}${rect(0, 0, 1, size, `fill="${color}"`)}</pattern>`;
  out.push(
    `<defs>${grid('minor', L.gridMinor, COLOR.gridMinor)}${grid('major', L.gridMajor, COLOR.gridMajor)}</defs>`,
    rect(0, 0, OG_WIDTH, OG_HEIGHT, `fill="${COLOR.desk}"`),
    rect(sheet.x, sheet.y, sheetW, sheetH, `fill="${COLOR.paper}"`),
    rect(sheet.x, sheet.y, sheetW, sheetH, 'fill="url(#minor)"'),
    rect(sheet.x, sheet.y, sheetW, sheetH, 'fill="url(#major)"'),
  );

  // The double frame: outer and inner borders, drawn inside their boxes as CSS borders are.
  const border = (x: number, y: number, w: number, h: number, width: number) =>
    rect(
      x + width / 2,
      y + width / 2,
      w - width,
      h - width,
      `fill="none" stroke="${COLOR.ink}" stroke-width="${width}"`,
    );
  out.push(
    border(sheet.x, sheet.y, sheetW, sheetH, L.frameOuter),
    border(innerX, innerY, innerW, innerH, L.frameInner),
  );

  // Zone strip 1–8 along the top edge.
  const zoneBottom = innerY + L.zoneHeight;
  out.push(rect(innerX, zoneBottom, innerW, L.frameInner, `fill="${COLOR.ink}"`));
  for (let zone = 1; zone <= 8; zone++) {
    const centre = innerX + ((zone - 0.5) * innerW) / 8;
    const digit = run(f.mono, String(zone), L.zoneSize);
    const baseline = innerY + L.zoneHeight / 2 + L.zoneSize * 0.35;
    out.push(
      path(
        run(f.mono, String(zone), L.zoneSize, centre - digit.width / 2, baseline).d,
        COLOR.muted,
      ),
    );
  }

  // Sheet label, then the display heading below it.
  const left = innerX + L.padding;
  const contentWidth = innerW - 2 * L.padding;
  const labelBaseline = zoneBottom + L.padding * 0.8 + L.labelSize * 0.75;
  const labelTracking = em('size-label-letter-spacing');
  out.push(
    path(
      run(f.mono, card.label.toUpperCase(), L.labelSize, left, labelBaseline, labelTracking).d,
      COLOR.line,
    ),
  );

  // Title block, bottom-right, flush with the inner frame: two cells over the site's host.
  const tbX = innerRight - L.titleBlockWidth;
  const rowH = [56, 56];
  const tbY = innerBottom - rowH[0]! - rowH[1]!;
  const cellPad = 14;
  const micro = em('size-micro-letter-spacing');
  out.push(
    rect(tbX, tbY, L.titleBlockWidth, L.frameInner * 2, `fill="${COLOR.ink}"`),
    rect(tbX, tbY, L.frameInner * 2, rowH[0]! + rowH[1]!, `fill="${COLOR.ink}"`),
    rect(tbX, tbY + rowH[0]!, L.titleBlockWidth, L.frameInner, `fill="${COLOR.ink}"`),
  );
  const cellW = L.titleBlockWidth / card.cells.length;
  card.cells.forEach(({ caption, value }, i) => {
    const x = tbX + i * cellW;
    if (i > 0) out.push(rect(x, tbY, L.frameInner, rowH[0]!, `fill="${COLOR.ink}"`));
    out.push(
      path(
        run(f.mono, caption.toUpperCase(), L.captionSize, x + cellPad, tbY + 20, micro).d,
        COLOR.muted,
      ),
      path(run(f.monoMedium, value, L.valueSize, x + cellPad, tbY + 44).d, COLOR.ink),
    );
  });
  out.push(
    path(run(f.monoMedium, card.site, L.siteSize, tbX + cellPad, innerBottom - 19).d, COLOR.ink),
  );

  const tracking = em('font-display-letter-spacing');
  const headingTop = labelBaseline + L.headingGap;
  const { size, lines } = fitHeading(
    card.heading.map((l) => l.toUpperCase()),
    (text, s) => run(f.display, text, s, 0, 0, tracking).width,
    {
      width: contentWidth,
      height: tbY - L.headingGap - headingTop,
      max: L.headingMax,
      min: L.headingMin,
      lineHeight: L.headingLineHeight,
    },
  );
  lines.forEach((line, i) => {
    // Cap height ≈ 0.72 em: the first line's caps start at headingTop.
    const baseline = headingTop + size * 0.72 + i * size * L.headingLineHeight;
    out.push(path(run(f.display, line, size, left, baseline, tracking).d, COLOR.ink));
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${out.join('')}</svg>`;
}

/** The card as a 1200×630 PNG. */
export async function renderOgPng(card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  const svg = ogSvg(card, await loadFaces());
  return new Uint8Array(new Resvg(svg).render().asPng());
}
