import { expect, test, type Page } from '@playwright/test';

import { STACK_GAP } from '../../src/assembly';
import { PLAY_S } from '../../src/assembly-motion';
import { SCRUB_ATTR } from '../../src/scrub';
import { countGsap, settleAnimations } from './helpers/motion';

// design/motion.md §M5: the Sheet 05 exploded view on GSAP + ScrollTrigger, lazy-loaded on
// /education. It starts assembled and explodes to the drawing; reduced motion shows the drawing.
test.use({ reducedMotion: 'no-preference' });

const ASSEMBLY = '.assembly';
const PARTS = '.plate, .balloon__mark, .balloon__leader, .assembly__label, .assembly__axis';

/** Every part's box, relative to the drawing, so scrolling does not change it. */
const boxes = (page: Page) =>
  page.locator('.assembly__drawing').evaluate((drawing, selector) => {
    const origin = drawing.getBoundingClientRect();
    return [...drawing.querySelectorAll(selector)].map((el) => {
      const box = el.getBoundingClientRect();
      return [box.x - origin.x, box.y - origin.y, box.width, box.height].map(Math.round);
    });
  }, PARTS);

/** A plate's top relative to the drawing. */
const plateTop = (page: Page, item: number) =>
  page
    .locator(`.plate[data-part="${item}"]`)
    .evaluate(
      (plate) =>
        plate.getBoundingClientRect().top - (plate.parentElement?.getBoundingClientRect().top ?? 0),
    );

/** The drawing as reduced motion shows it (its final state), after `prepare`. */
async function drawn(page: Page, prepare: (page: Page) => Promise<void> = async () => {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/education/');
  await expect(page.locator(ASSEMBLY)).toHaveAttribute(SCRUB_ATTR, 'done');
  await prepare(page);
  const final = await boxes(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return final;
}

/** Selects a part as a click would, without scrolling the page to it. */
const selectWithoutScrolling = (page: Page, item: number) =>
  page.locator(`tr[data-part="${item}"]`).evaluate((row) => (row as HTMLElement).click());

/** Records when the drawing starts and stops playing, and plate 4's top on every frame. */
const recordPlay = (page: Page) =>
  page.addInitScript(() => {
    const seen = { playing: 0, done: 0, tops: [] as number[] };
    Object.assign(window, { seen });
    const sample = () => {
      const assembly = document.querySelector<HTMLElement>('.assembly');
      const plate = document.querySelector('.plate[data-part="4"]');
      if (assembly && plate) {
        const state = assembly.dataset.scrub;
        if (state === 'playing' && !seen.playing) seen.playing = performance.now();
        if (state === 'done' && !seen.done) seen.done = performance.now();
        seen.tops.push(plate.getBoundingClientRect().top - assembly.getBoundingClientRect().top);
      }
      if (!seen.done) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

const played = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { seen: { playing: number; done: number; tops: number[] } }).seen,
  );

/** Assembled: plates 4, 3, 2 piled on the base plate, 6 units apart; nothing else shown yet. */
async function expectAssembled(page: Page) {
  const base = await page
    .locator('.plate[data-part="1"]')
    .evaluate((el) => el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
  for (const item of [2, 3, 4]) {
    const centre = await page
      .locator(`.plate[data-part="${item}"]`)
      .evaluate((el) => el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
    expect(base - centre).toBeGreaterThan(0);
    expect(base - centre).toBeLessThanOrEqual((item - 1) * STACK_GAP + 1);
  }
  await expect(page.locator('.plate--dashed')).toHaveCSS('opacity', '0');
  for (const mark of await page.locator('.balloon__mark').all()) {
    expect((await mark.boundingBox())?.width ?? 0).toBeLessThan(1);
  }
  for (const label of await page.locator('.assembly__label').all()) {
    await expect(label).toHaveCSS('opacity', '0');
  }
}

test('GSAP is fetched on the education sheet, and never under reduced motion', async ({ page }) => {
  const gsap = countGsap(page);
  await page.goto('/education/');
  await expect(page.locator(ASSEMBLY)).toHaveAttribute(SCRUB_ATTR, /playing|done/);
  await page.waitForLoadState('networkidle');
  expect(gsap.count).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const before = gsap.count;
  await page.goto('/nl/education/');
  await expect(page.locator(ASSEMBLY)).toHaveAttribute(SCRUB_ATTR, 'done');
  await page.waitForLoadState('networkidle');
  expect(gsap.count).toBe(before);
  // Reduced motion: no inline motion styles, the drawing as drawn.
  expect(
    await page.locator('.plate').evaluateAll((els) => els.map((el) => el.style.translate)),
  ).toEqual(['', '', '', '', '']);
});

test('in view at load, the drawing explodes on its own in 1.2 s and ends as drawn', async ({
  page,
}) => {
  const final = await drawn(page);
  await recordPlay(page);
  await page.goto('/education/');
  await settleAnimations(page);
  await expect(page.locator(ASSEMBLY)).toHaveAttribute(SCRUB_ATTR, 'done');

  const seen = await played(page);
  const seconds = (seen.done - seen.playing) / 1000;
  expect(seconds).toBeGreaterThan(PLAY_S - 0.1);
  expect(seconds).toBeLessThan(PLAY_S + 0.6);
  // Plate 4 rose out of the stack to its place.
  const rest = seen.tops.at(-1) ?? 0;
  expect(Math.max(...seen.tops)).toBeGreaterThan(rest + 50);
  expect(await boxes(page)).toEqual(final);
});

test('on a phone the drawing waits below the fold, then plays once without scrubbing', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-phone', 'a short phone window');
  await page.setViewportSize({ width: 390, height: 480 });
  const final = await drawn(page);
  await page.goto('/education/');
  const assembly = page.locator(ASSEMBLY);
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'waiting');
  await expectAssembled(page);

  // Its top just past the 80 % line: the whole explosion plays, though the page stops there.
  await page.evaluate(() => {
    const top = document.querySelector('.assembly')?.getBoundingClientRect().top ?? 0;
    window.scrollTo(0, top - innerHeight * 0.7);
  });
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'playing');
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'done', { timeout: 3000 });
  expect(await boxes(page)).toEqual(final);
});

test('in a short desktop window the explosion is scrubbed by the scroll, selection still works', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'a short desktop window');
  await page.setViewportSize({ width: 1440, height: 480 });
  const final = await drawn(page, (page) => selectWithoutScrolling(page, 2));
  await page.goto('/education/');
  const assembly = page.locator(ASSEMBLY);
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'waiting');
  await expectAssembled(page);
  const assembled = await plateTop(page, 4);

  // Part-way: plate 4 on its way up, the scrub at rest there.
  await page.evaluate(() => window.scrollTo(0, 180));
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'playing');
  await page.waitForTimeout(1000);
  const partWay = await plateTop(page, 4);
  expect(partWay).toBeLessThan(assembled - 20);

  // Selecting a part mid-way lifts its plate 12 px and opens its detail.
  const resting = await plateTop(page, 2);
  await selectWithoutScrolling(page, 2);
  await expect(page.locator('.plate[data-part="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#part-2')).toBeVisible();
  await expect.poll(async () => resting - (await plateTop(page, 2))).toBeCloseTo(12, 0);

  // Back up: the scrub runs backwards.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => plateTop(page, 4)).toBeGreaterThan(partWay + 20);

  // Through the range: exploded as drawn, and exploded it stays.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'done');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await expect(assembly).toHaveAttribute(SCRUB_ATTR, 'done');
  expect(await boxes(page)).toEqual(final);
});
