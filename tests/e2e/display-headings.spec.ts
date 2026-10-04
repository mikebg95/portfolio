import { expect, test } from '@playwright/test';

import { settleAnimations } from './helpers/motion';
import { ROUTES } from './helpers/routes';

// PR-61: a display heading never breaks inside a word, at any width — the size shrinks instead —
// and never spills out of its box. Every route and the 404, both languages, every width from 280
// to 1440 px in 10 px steps. Widths are what matter here, so one browser project runs it.

const WIDTHS = Array.from({ length: (1440 - 280) / 10 + 1 }, (_, i) => 280 + i * 10);
const PAGES = [
  ...ROUTES,
  { path: '/no-such-sheet', lang: 'en' },
  { path: '/nl/no-such-sheet', lang: 'nl' },
];

/** Per visible display heading: words on more than one line, and words outside its box. */
function headingFaults(): string[] {
  const faults: string[] = [];
  for (const heading of document.querySelectorAll<HTMLElement>('.display-heading')) {
    if (heading.getClientRects().length === 0) continue;
    const box = heading.getBoundingClientRect();
    const name = heading.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (heading.scrollWidth > heading.clientWidth + 1) faults.push(`"${name}" overflows its box`);
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      // Words as headingWords (src/display-fit.ts) splits them: at spaces, after - and /.
      for (const match of text.matchAll(/[^\s/-]+[/-]?|[/-]/g)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        const tops = new Set(rects.map((r) => Math.round(r.top)));
        if (tops.size > 1) faults.push(`"${name}": "${match[0]}" breaks across lines`);
        if (rects.some((r) => r.left < box.left - 1 || r.right > box.right + 1))
          faults.push(`"${name}": "${match[0]}" sits outside the heading`);
      }
    }
  }
  return faults;
}

for (const { path, lang } of PAGES) {
  test(`${path} (${lang}): no display heading breaks a word, 280–1440 px`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'a width sweep: one browser is enough');
    test.setTimeout(120_000);
    await page.goto(path);
    await settleAnimations(page);
    expect(await page.locator('.display-heading').count()).toBeGreaterThan(0);
    const faults: string[] = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      faults.push(...(await page.evaluate(headingFaults)).map((fault) => `${width} px: ${fault}`));
    }
    expect(faults).toEqual([]);
  });
}
