import { describe, expect, it } from 'vitest';

import tokens from '../../design/tokens.json';
import {
  faviconIco,
  faviconSvg,
  ICO_SIZES,
  monogramSvg,
  PNG_ICONS,
  renderIcon,
  webManifest,
} from '../../src/favicon';

/** A PNG's IHDR width and height. */
const pngSize = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

// PR-52: the site icon every page links (a missing one 404s and costs Lighthouse best practices).
// PR-58: every icon is the header's MG monogram cell, rendered from one SVG source.
describe('faviconSvg', () => {
  it('is a standalone square SVG: the ruled cell and MG as outlines, no text or font', async () => {
    const svg = await faviconSvg();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 32 32">/);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain(
      '<rect class="paper frame" x="1" y="1" width="30" height="30" stroke-width="2"/>',
    );
    expect(svg).toMatch(/<path class="text" d="M[^"]+"\/>/);
    expect(svg).not.toMatch(/<text|font-family/);
  });

  it('draws in the paper and ink tokens of both themes, blueprint under prefers-color-scheme', async () => {
    const [light, dark] = (await faviconSvg()).split('@media (prefers-color-scheme:dark)');
    for (const name of ['paper', 'ink'] as const) {
      expect(light).toContain(tokens.color[name].light);
      expect(dark).toContain(tokens.color[name].dark);
    }
  });

  it('puts the cell on paper when given a margin', async () => {
    const svg = await monogramSvg({ margin: 0.25 });
    expect(svg).toContain('viewBox="-16 -16 64 64"');
    expect(svg).not.toContain('prefers-color-scheme');
  });
});

describe('PNG icons', () => {
  it.each(Object.entries(PNG_ICONS))('%s is a square PNG of its size', async (icon, { px }) => {
    const png = await renderIcon(icon as keyof typeof PNG_ICONS);
    expect(pngSize(png)).toEqual({ width: px, height: px });
  });
});

describe('faviconIco', () => {
  it('holds a PNG at 16, 32 and 48 px', async () => {
    const ico = await faviconIco();
    const view = new DataView(ico.buffer);
    expect([view.getUint16(0, true), view.getUint16(2, true)]).toEqual([0, 1]);
    expect(view.getUint16(4, true)).toBe(ICO_SIZES.length);
    ICO_SIZES.forEach((px, i) => {
      const entry = 6 + 16 * i;
      expect([view.getUint8(entry), view.getUint8(entry + 1)]).toEqual([px, px]);
      const length = view.getUint32(entry + 8, true);
      const offset = view.getUint32(entry + 12, true);
      const png = ico.subarray(offset, offset + length);
      expect([...png.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]); // "PNG"
      expect(pngSize(png)).toEqual({ width: px, height: px });
    });
  });
});

describe('webManifest', () => {
  it('names the site and lists the any and maskable icons in the paper colour', () => {
    const manifest = webManifest('Michael Goldman — Portfolio', 'M. Goldman', {
      any: '/icon-512.png',
      maskable: '/icon-512-maskable.png',
    });
    expect(manifest).toMatchObject({
      name: 'Michael Goldman — Portfolio',
      short_name: 'M. Goldman',
      theme_color: tokens.color.paper.light,
      icons: [
        { src: '/icon-512.png', sizes: '512x512', purpose: 'any' },
        { src: '/icon-512-maskable.png', sizes: '512x512', purpose: 'maskable' },
      ],
    });
  });
});
