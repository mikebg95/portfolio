import { mkdirSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { ROUTES } from './helpers/routes';

// PR-53, SPEC §7 / design/README.md "Responsive": every route, both languages and the 404 sheet,
// at six widths from the smallest phone to the widest desktop. At each: no horizontal page scroll,
// no two headings or labels drawn over each other, no text spilling sideways out of its own box,
// and every table inside a framed box that scrolls sideways rather than the page. A full-page
// screenshot of each lands in `.e2e/responsive/` and is attached to the HTML report.
const WIDTHS = [320, 390, 768, 1024, 1440, 2560];
const SHOTS = '.e2e/responsive';

// Headings and labels: the text a reader scans. SVG text is the drawings' labels.
const TEXT = [
  'h1, h2, h3, h4, h5, h6',
  'dt, th, caption, figcaption, label, legend',
  '[class*="label"], [class*="title"], [class*="heading"]',
  'svg text',
].join(', ');

// Text out of the layout on purpose: visually hidden, or the phone index panel while closed.
const HIDDEN = ".sr-only, [hidden], .sheet-index__panel[data-state='closed']";

// Text that runs past its box as drawn: the employer note on the desktop timeline runs left of a
// dimension line shorter than it (src/components/experience/Timeline.astro).
const SPILL_EXCEPTIONS = '.timeline__employer-note';

mkdirSync(SHOTS, { recursive: true });

/** Pairs of heading/label texts whose drawn text boxes intersect, as "a ⟂ b" for the message. */
function overlappingText(page: Page) {
  return page.evaluate(
    ({ selector, hidden }) => {
      const boxes = [...document.querySelectorAll(selector)]
        .filter((el) => !el.closest(hidden))
        .filter((el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
        // A label wrapping another (a title block cell around its label) is one text, not two.
        .filter((el) => !el.querySelector(selector))
        .map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
          return { el, rects, name: (el.textContent ?? '').trim().slice(0, 40) };
        })
        .filter((box) => box.rects.length && box.name);
      const hit = (a: DOMRect, b: DOMRect) =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      const found: string[] = [];
      boxes.forEach((a, i) =>
        boxes.slice(i + 1).forEach((b) => {
          if (a.el.contains(b.el) || b.el.contains(a.el)) return;
          if (a.rects.some((ra) => b.rects.some((rb) => hit(ra, rb))))
            found.push(`"${a.name}" ⟂ "${b.name}"`);
        }),
      );
      return found;
    },
    { selector: TEXT, hidden: HIDDEN },
  );
}

/**
 * Texts that spill out of their own element sideways — a long word wider than its grid cell runs
 * into the next column. Elements that clip or scroll their overflow are left alone.
 */
function spillingText(page: Page) {
  return page.evaluate(
    ({ hidden, exceptions }) => {
      const found: string[] = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest(hidden) || el.closest('svg') || el.matches(exceptions)) continue;
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        if (getComputedStyle(el).overflowX !== 'visible') continue;
        const box = el.getBoundingClientRect();
        // Inside a 1 px visually hidden box (the phone header's set name).
        if (box.width <= 1) continue;
        for (const node of el.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          if (text.right > box.right + 1 || text.left < box.left - 1)
            found.push(`${el.localName}: "${node.textContent.trim().slice(0, 40)}"`);
        }
      }
      return found;
    },
    { hidden: HIDDEN, exceptions: SPILL_EXCEPTIONS },
  );
}

/** Each table's framed box: it must scroll sideways itself and end inside the viewport. */
function tableFrames(page: Page) {
  return page.locator('table').evaluateAll((tables) =>
    tables.map((table) => {
      const frame = table.parentElement!;
      return {
        overflowX: getComputedStyle(frame).overflowX,
        right: frame.getBoundingClientRect().right,
      };
    }),
  );
}

for (const { path } of [...ROUTES, { path: '/no-such-sheet' }, { path: '/nl/404' }]) {
  test(`${path} fits every width from 320 to 2560 px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'widths are set here, one engine');
    test.slow();
    // The layout under test is the drawn final state, not a frame of the plotting sequence.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const slug = path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const file = `${SHOTS}/${slug}-${width}.png`;
      await page.screenshot({ path: file, fullPage: true });
      await testInfo.attach(`${slug}-${width}`, { path: file, contentType: 'image/png' });

      const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(scroll, `${path} at ${width} px scrolls sideways`).toBeLessThanOrEqual(width);
      expect.soft(await overlappingText(page), `${path} at ${width} px overlaps`).toEqual([]);
      expect.soft(await spillingText(page), `${path} at ${width} px spills`).toEqual([]);
      for (const frame of await tableFrames(page)) {
        expect.soft(frame.overflowX, `${path} at ${width} px: table frame`).toBe('auto');
        expect.soft(frame.right, `${path} at ${width} px: table frame`).toBeLessThanOrEqual(width);
      }
    }
  });
}

// The two text checks above find nothing on a good sheet; this proves they would find a bad one.
test('the overlap and spill checks catch a planted defect', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'one engine is enough');
  await page.goto('/');
  await page.evaluate(() => {
    const plant = (html: string) => document.body.insertAdjacentHTML('beforeend', html);
    plant('<h2 style="position:fixed;top:0;left:0;margin:0">Planted heading</h2>');
    plant(
      '<span class="planted-label" style="position:fixed;top:4px;left:4px">Planted label</span>',
    );
    plant('<p style="width:40px">Programmeertheorie</p>');
  });
  expect(await overlappingText(page)).toContain('"Planted heading" ⟂ "Planted label"');
  expect(await spillingText(page)).toContain('p: "Programmeertheorie"');
});
