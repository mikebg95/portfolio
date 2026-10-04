import { expect, test, type Page } from '@playwright/test';

import { SCRUB_ATTR } from '../../src/scrub';
import { PIN_TOP_PX } from '../../src/timeline-motion';
import { countGsap, settleAnimations } from './helpers/motion';

// design/motion.md §M4: the Sheet 02 timeline on GSAP + ScrollTrigger, lazy-loaded on /experience.
test.use({ reducedMotion: 'no-preference' });

const TIMELINE = '.timeline';
const DURATIONS = ['2 Y 8 M', '2 Y 0 M'];

/** The horizontal (or, below desktop, vertical) scale of the first bar's segment. */
const firstBarScale = (page: Page) =>
  page
    .locator('.timeline__segment')
    .first()
    .evaluate((segment) => {
      const { a, d } = new DOMMatrix(getComputedStyle(segment).transform);
      return window.innerWidth >= 1024 ? a : d;
    });

/** LinkPizza (32 months) against DJI (24 months), as laid out on the page. */
async function expectDrawnToScale(page: Page) {
  const horizontal = (page.viewportSize()?.width ?? 0) >= 1024;
  const length = async (selector: string) => {
    const box = await page.locator(`${selector} .timeline__segment`).boundingBox();
    if (!box) throw new Error(`${selector} is not rendered`);
    return horizontal ? box.width : box.height;
  };
  const ratio =
    (await length('.timeline__entry--fill-1')) / (await length('.timeline__entry--fill-2'));
  expect(ratio).toBeCloseTo(32 / 24, 1);
}

test('GSAP is fetched on the experience sheet only, and never under reduced motion', async ({
  page,
}) => {
  const gsap = countGsap(page);
  await page.goto('/');
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  expect(gsap.count).toBe(0);
  await page.goto('/experience');
  await expect(page.locator(TIMELINE)).toHaveAttribute(SCRUB_ATTR, /playing|done/);
  await page.waitForLoadState('networkidle');
  expect(gsap.count).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const before = gsap.count;
  await page.goto('/nl/experience');
  await expect(page.locator(TIMELINE)).toHaveAttribute(SCRUB_ATTR, 'done');
  await page.waitForLoadState('networkidle');
  expect(gsap.count).toBe(before);
});

test('in view at load, the bars extrude on their own and end drawn to scale', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, 'phone draws cards, not bars');
  await page.addInitScript(() => {
    const seen = { scales: [] as number[], durations: [] as string[], arrow: [] as string[] };
    Object.assign(window, { seen });
    const sample = () => {
      const segment = document.querySelector('.timeline__segment');
      const duration = document.querySelector('.timeline__duration');
      const arrow = document.querySelector('.timeline__arrow');
      if (segment) {
        const { a, d } = new DOMMatrix(getComputedStyle(segment).transform);
        seen.scales.push(window.innerWidth >= 1024 ? a : d);
      }
      if (duration?.textContent) seen.durations.push(duration.textContent.trim());
      if (arrow) seen.arrow.push(getComputedStyle(arrow).transform);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto('/experience');
  await settleAnimations(page);
  await expect(page.locator(TIMELINE)).toHaveAttribute(SCRUB_ATTR, 'done');
  // OptieCon's arrow pulses after the sweep, then stands still.
  await expect(page.locator('.timeline__arrow')).toHaveCSS('transform', 'none');

  const seen = await page.evaluate(
    () =>
      (window as unknown as { seen: { scales: number[]; durations: string[]; arrow: string[] } })
        .seen,
  );
  expect(seen.scales.some((scale) => scale > 0.05 && scale < 0.95)).toBe(true);
  expect(seen.durations).toContain('0 Y 0 M');
  expect(seen.arrow.some((transform) => transform !== 'none')).toBe(true);

  await expect(page.locator('.timeline__duration')).toHaveText(DURATIONS);
  await expect(page.locator('.timeline__segment').first()).toHaveCSS('transform', 'none');
  await expect(page.locator('.timeline__label').first()).toHaveCSS('opacity', '1');
  await expectDrawnToScale(page);
});

test('below the 80 % line at load, the bars are scrubbed by the scroll and stay drawn', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'a short desktop window');
  await page.setViewportSize({ width: 1440, height: 480 });
  await page.goto('/experience');
  const timeline = page.locator(TIMELINE);
  await expect(timeline).toHaveAttribute(SCRUB_ATTR, 'waiting');
  expect(await firstBarScale(page)).toBe(0);
  await expect(page.locator('.timeline__duration').first()).toHaveText('0 Y 0 M');

  // A little way into the 80 % → 35 % range: LinkPizza part-drawn, its count part-way.
  await page.evaluate(() => window.scrollTo(0, 90));
  await expect(timeline).toHaveAttribute(SCRUB_ATTR, 'playing');
  await expect.poll(() => firstBarScale(page)).toBeGreaterThan(0.2);
  await page.waitForTimeout(1000);
  const part = await firstBarScale(page);
  expect(part).toBeLessThan(0.95);
  await expect(page.locator('.timeline__duration').first()).not.toHaveText(DURATIONS[0] ?? '');

  // Back up: the scrub runs backwards.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => firstBarScale(page)).toBeLessThan(part);

  // Through the range: drawn, and drawn it stays.
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(timeline).toHaveAttribute(SCRUB_ATTR, 'done');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await expect(timeline).toHaveAttribute(SCRUB_ATTR, 'done');
  await expect(page.locator('.timeline__segment').first()).toHaveCSS('transform', 'none');
  await expect(page.locator('.timeline__duration')).toHaveText(DURATIONS);
  await expectDrawnToScale(page);
});

test('desktop pins the timeline over the details, its cursor on the role being read', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop only');
  await page.goto('/experience');
  await settleAnimations(page);
  const timeline = page.locator(TIMELINE);
  const cursor = page.locator('.timeline__cursor');

  for (const [id, entry] of [
    ['dji', '.timeline__entry--fill-2'],
    ['linkpizza', '.timeline__entry--fill-1'],
  ] as const) {
    await page.locator(`.timeline__bar[href="#${id}"]`).click();
    await expect(timeline).toHaveClass(/timeline--pinned/);
    await expect(cursor).toHaveAttribute('data-at', id);
    const pinned = await timeline.boundingBox();
    const block = await page.locator(`#${id}`).boundingBox();
    if (!pinned || !block) throw new Error('timeline or block not rendered');
    expect(Math.round(pinned.y)).toBe(PIN_TOP_PX);
    // The block lands clear of the pinned strip, not under it.
    expect(block.y).toBeGreaterThanOrEqual(pinned.y + pinned.height);

    const segment = await page.locator(`${entry} .timeline__segment`).boundingBox();
    if (!segment) throw new Error('bar not rendered');
    await expect
      .poll(async () => (await cursor.boundingBox())?.x ?? 0)
      .toBeCloseTo(segment.x + segment.width / 2, 0);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(timeline).not.toHaveClass(/timeline--pinned/);
});

test('on a tablet the timeline never sticks', async ({ page }) => {
  // No tablet project: the desktop one, narrowed (a phone draws cards, not bars).
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop project, narrowed');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/experience');
  await settleAnimations(page);
  await page.locator('.timeline__bar[href="#dji"]').click();
  await expect(page.locator('#dji')).toBeInViewport();
  await expect(page.locator(TIMELINE)).not.toHaveClass(/timeline--pinned/);
  await expect(page.locator('.timeline__ruler')).not.toBeInViewport();
  await expect(page.locator('.timeline__cursor')).toBeHidden();
});
