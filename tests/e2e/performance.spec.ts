import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

import { PRIMITIVES_PATH } from '../../src/config';
import { ROUTES } from './helpers/routes';

// PR-52, SPEC §7: the size half of the performance budget (Lighthouse CI, `lighthouserc.json`,
// holds the scores). Every built page's JavaScript — its module scripts, everything they import,
// statically or lazily (GSAP included), and its inline scripts — stays within 60 KB gzipped; and a
// font is preloaded only on a page that renders it.
const JS_BUDGET = 60 * 1024;

const DIST = new URL('../../dist/', import.meta.url).pathname;
const read = (path: string) => readFileSync(`${DIST}${path}`, 'utf8');
const gz = (text: string) => gzipSync(text).length;

/** Every built HTML page but the dev-only primitives specimen. */
const pages = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.html'))
  .filter((path) => !path.startsWith(PRIMITIVES_PATH.slice(1)));

/** The `_astro/` chunks a script names: `from"./x.js"`, `import(\`./x.js\`)`, `"_astro/x.js"`. */
const chunkRefs = (js: string) =>
  [...js.matchAll(/["'`](?:\.\/|\/?_astro\/)([\w.-]+\.js)["'`]/g)].map((m) => m[1]!);

/** A page's scripts: each inline script's text, and the closure of `_astro/` chunks it loads. */
function pageScripts(html: string) {
  const inline: string[] = [];
  const queue: string[] = [];
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/(ld\+)?json"/.test(attrs!)) continue;
    const src = /\bsrc="\/_astro\/([^"]+)"/.exec(attrs!)?.[1];
    if (src) queue.push(src);
    else {
      inline.push(body!);
      queue.push(...chunkRefs(body!));
    }
  }
  for (const [, href] of html.matchAll(/<link rel="modulepreload" href="\/_astro\/([^"]+)"/g)) {
    queue.push(href!);
  }
  const chunks = new Set<string>();
  while (queue.length > 0) {
    const chunk = queue.pop()!;
    if (chunks.has(chunk)) continue;
    chunks.add(chunk);
    queue.push(...chunkRefs(read(`_astro/${chunk}`)));
  }
  return { inline, chunks: [...chunks] };
}

test.describe('JavaScript budget', () => {
  // Read from dist/, the same at every viewport: one project is enough.
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'build only');

  test('the scan sees every page and the lazy chunks', () => {
    expect(pages.length).toBeGreaterThanOrEqual(ROUTES.length);
    // Experience lazy-loads its GSAP timeline: the closure must reach past the dynamic import.
    const { chunks } = pageScripts(read('experience/index.html'));
    expect(chunks.some((chunk) => chunk.startsWith('timeline-motion.'))).toBe(true);
  });

  for (const page of pages) {
    test(`${page} ships ≤ 60 KB of JS gzipped`, () => {
      const { inline, chunks } = pageScripts(read(page));
      const sizes = [
        ...inline.map((body) => gz(body)),
        ...chunks.map((chunk) => gz(read(`_astro/${chunk}`))),
      ];
      const total = sizes.reduce((sum, size) => sum + size, 0);
      expect(total, `${chunks.join(', ')}`).toBeLessThanOrEqual(JS_BUDGET);
    });
  }
});

/** fonts.css: font file → the face it declares (family + weight, as `FontFace` reports them). */
const fontsCss = readFileSync(new URL('../../src/styles/fonts.css', import.meta.url), 'utf8');
const faces = new Map(
  [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, block]) => [
    /url\('([^']+)'\)/.exec(block!)![1]!,
    {
      family: /font-family:\s*'([^']+)'/.exec(block!)![1]!,
      weight: /font-weight:\s*([^;]+);/.exec(block!)![1]!.trim(),
    },
  ]),
);

test.describe('font preloads', () => {
  for (const { path } of [...ROUTES, { path: '/404.html' }]) {
    test(`${path} preloads only fonts it renders`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const preloaded = await page
        .locator('link[rel="preload"][as="font"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
      const loaded = await page.evaluate(() =>
        [...document.fonts]
          .filter((face) => face.status === 'loaded')
          .map((face) => `${face.family.replace(/["']/g, '')} ${face.weight}`),
      );
      for (const href of preloaded) {
        const face = faces.get(href);
        expect(face, `${href} is declared in fonts.css`).toBeDefined();
        expect(loaded, `${href} is preloaded, so the page renders it`).toContain(
          `${face!.family} ${face!.weight}`,
        );
      }
    });
  }
});
