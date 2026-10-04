import { Resvg } from '@resvg/resvg-js';
import type { Font } from 'fontkit';

import tokens from '../design/tokens.json';
import { openWoff2, run } from './glyphs';

// The site icons (SPEC §3.8): every one is the header's monogram cell — a 2 px ink square, "MG" in
// Archivo 800 wide, paper fill (SheetHeader `.sheet-header__monogram`). One source, `monogramSvg`;
// the PNGs and the ICO are renders of it. Colours from design/tokens.json; only the SVG carries the
// blueprint set, under `prefers-color-scheme` (a favicon cannot see the site's own theme toggle).
type Theme = 'light' | 'dark';

/** The cell in its own units: 32 square with a 2 border, so the 32 px favicon draws the header's
 * 2 px rule exactly (1 px at 16, 3 px at 48). */
const CELL = 32;
const BORDER = 2;
/** The header's face: weight 800, `font-stretch: 112%`. */
const FACE = { wght: 800, wdth: 112 };
/** "MG" spans this much of the cell's width. The header sets it at 15 px in a 38 px cell (≈ 0.55);
 * an icon is read at 16 px, so the letters are drawn larger. */
const TEXT_WIDTH = 0.7;

let face: Promise<Font> | undefined;
const loadFace = () => (face ??= openWoff2('archivo-latin-wdth-normal.woff2', FACE));

const rules = (theme: Theme) =>
  `.paper{fill:${tokens.color.paper[theme]}}` +
  `.frame{stroke:${tokens.color.ink[theme]}}.text{fill:${tokens.color.ink[theme]}}`;

export interface MonogramOptions {
  /** Paper margin round the cell, as a share of the canvas side: 0 is the cell full-bleed. */
  margin?: number;
  /** Add the blueprint colours under `prefers-color-scheme: dark` (the SVG favicon only). */
  dark?: boolean;
}

/** The monogram cell as an SVG, square, "MG" as glyph outlines (no font needed to show it). */
export async function monogramSvg({
  margin = 0,
  dark = false,
}: MonogramOptions = {}): Promise<string> {
  const font = await loadFace();
  // Sized by its width, centred on the cap height (the G's overshoot is the font's business).
  const probe = run(font, 'MG', 100);
  const size = (100 * CELL * TEXT_WIDTH) / probe.width;
  const capHeight = (font.capHeight / font.unitsPerEm) * size;
  const text = run(
    font,
    'MG',
    size,
    (CELL - probe.width * (size / 100)) / 2,
    (CELL + capHeight) / 2,
  );
  const pad = (CELL * margin) / (1 - 2 * margin);
  const side = CELL + 2 * pad;
  const n = (v: number) => +v.toFixed(3);
  const style =
    rules('light') + (dark ? `@media (prefers-color-scheme:dark){${rules('dark')}}` : '');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(-pad)} ${n(-pad)} ${n(side)} ${n(side)}">` +
    `<style>${style}</style>` +
    (pad > 0
      ? `<rect class="paper" x="${n(-pad)}" y="${n(-pad)}" width="${n(side)}" height="${n(side)}"/>`
      : '') +
    `<rect class="paper frame" x="${BORDER / 2}" y="${BORDER / 2}" width="${CELL - BORDER}" height="${CELL - BORDER}" stroke-width="${BORDER}"/>` +
    `<path class="text" d="${text.d}"/>` +
    '</svg>'
  );
}

/** The favicon: the cell full-bleed, blueprint colours when the system is dark. */
export const faviconSvg = () => monogramSvg({ dark: true });

/** `svg` rendered to a `px`-wide PNG. */
export const renderPng = (svg: string, px: number) =>
  new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: px } }).render().asPng());

/** The PNG icons: full-bleed where the platform shows the square as is; on paper where it rounds
 * the corners (iOS, ~22 % radius) or crops to the maskable safe zone (a circle of 40 % radius,
 * which a cell of 50 % fits). */
export const PNG_ICONS = {
  appleTouch: { px: 180, margin: 0.15 },
  any: { px: 512, margin: 0 },
  maskable: { px: 512, margin: 0.25 },
} as const;

export const renderIcon = async (icon: keyof typeof PNG_ICONS) =>
  renderPng(await monogramSvg({ margin: PNG_ICONS[icon].margin }), PNG_ICONS[icon].px);

/** The sizes inside favicon.ico. */
export const ICO_SIZES = [16, 32, 48] as const;

/** favicon.ico: the full-bleed cell at each of `ICO_SIZES`, stored as PNG images (ICO since
 * Windows Vista accepts PNG entries). */
export async function faviconIco(): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await monogramSvg();
  const pngs = ICO_SIZES.map((px) => renderPng(svg, px));
  const head = 6 + 16 * pngs.length;
  const out = new Uint8Array(head + pngs.reduce((sum, png) => sum + png.length, 0));
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, pngs.length, true);
  let offset = head;
  pngs.forEach((png, i) => {
    const entry = 6 + 16 * i;
    const px = ICO_SIZES[i]!;
    view.setUint8(entry, px % 256); // 0 means 256
    view.setUint8(entry + 1, px % 256);
    view.setUint16(entry + 4, 1, true); // colour planes
    view.setUint16(entry + 6, 32, true); // bits per pixel
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  });
  return out;
}

/** The web app manifest for `name`/`shortName`, pointing at the PNG icons at `paths`. */
export const webManifest = (
  name: string,
  shortName: string,
  paths: { any: string; maskable: string },
) => ({
  name,
  short_name: shortName,
  start_url: '/',
  display: 'browser',
  theme_color: tokens.color.paper.light,
  background_color: tokens.color.paper.light,
  icons: [
    {
      src: paths.any,
      sizes: `${PNG_ICONS.any.px}x${PNG_ICONS.any.px}`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: paths.maskable,
      sizes: `${PNG_ICONS.maskable.px}x${PNG_ICONS.maskable.px}`,
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
});
