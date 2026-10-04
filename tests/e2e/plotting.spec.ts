import { expect, test, type Page } from '@playwright/test';

import { notInFinalState } from './helpers/motion';

// design/motion.md §M1 on Sheet 01: the sheet plots itself on the session's first page view, with
// the reference preview's timings; text is readable within 1.3 s; later views and reduced motion
// show the final sheet at once.
test.use({ reducedMotion: 'no-preference' });

/** Text a visitor reads first: the header cells and the hero copy. */
const READING_TEXT = [
  '.sheet-header__mark',
  '.sheet-header__current',
  '.sheet-tab',
  '.sheet-header__utils',
  '.sheet-index',
  '.hero .sheet-label',
  '.hero__name-line',
  '.hero__role-text',
  '.hero__intro',
  '.hero__actions',
].join(', ');

/** Holds every animation on the page at `ms` after it started. */
async function seek(page: Page, ms: number) {
  await page.evaluate((ms) => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = ms;
    }
  }, ms);
}

test('the first view plays the timeline with the preview timings', async ({ page }) => {
  await page.goto('/');
  const timing = (selector: string, pseudo?: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element, pseudo) => {
        const style = getComputedStyle(element, pseudo);
        return `${style.animationName} ${style.animationDuration} ${style.animationDelay}`;
      }, pseudo);

  expect(await timing('.sheet__plot-edge--top')).toBe('reveal-draw 0.7s 0s');
  expect(await timing('.sheet__plot-edge--left')).toBe('reveal-draw 0.5s 0.75s');
  expect(await timing('.sheet__plot-grid')).toBe('plot-fade 0.9s 0.15s');
  expect(await timing('.sheet-header__mark')).toBe('plot-drop 0.45s 0.5s');
  expect(await timing(".sheet-tab[aria-current='page']", '::before')).toBe('reveal-draw 0.5s 0.9s');
  expect(await timing('.hero .sheet-label')).toBe('reveal-rise 0.7s 0.6s');
  expect(await timing('.hero__name-line + .hero__name-line')).toBe('reveal-wipe 0.8s 0.85s');
  expect(await timing('.hero__rule')).toBe('reveal-draw 0.5s 1.05s');
  expect(await timing('.hero__intro')).toBe('reveal-rise 0.7s 1.2s');
  expect(await timing('.portrait__line:nth-child(11)')).toBe('reveal-wipe 0.26s 0.77s');
  expect(await timing('.portrait__dim--v')).toBe('reveal-draw 0.6s 1.6s');
  expect(await timing('.portrait__callout:nth-child(3) .balloon')).toBe('plot-pop 0.45s 2.15s');
  expect(await timing('.hero .revision-note')).toBe('reveal-stamp 0.38s 2.3s');
});

test('text is readable within 1.3 s', async ({ page }) => {
  await page.goto('/');
  await seek(page, 1300);
  const unreadable = await page.evaluate((selector) => {
    const inset = (clip: string) => Number(/^inset\(\S+ (\S+)%/.exec(clip)?.[1] ?? 0);
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        let opacity = 1;
        for (let node: Element | null = element; node; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        return { element, opacity, hidden: inset(getComputedStyle(element).clipPath) };
      })
      .filter(({ opacity, hidden }) => opacity < 0.5 || hidden > 50)
      .map(({ element, opacity, hidden }) => `${element.className}: ${opacity} / ${hidden}%`);
  }, READING_TEXT);
  expect(unreadable).toEqual([]);
});

test('the sheet ends in its final state', async ({ page }) => {
  await page.goto('/');
  // Below the hero, §M3 reveals wait for a scroll; the plotting is the frame, header and hero.
  for (const scope of ['.sheet__plot', '.sheet-header', '.hero']) {
    expect(await notInFinalState(page, scope)).toEqual([]);
  }
  await expect(page.locator('.sheet__plot-edge')).toHaveCount(4);
  for (const edge of await page.locator('.sheet__plot-edge').all()) {
    await expect(edge).toBeVisible();
  }
});

test('a later page view of the session shows the sheet at once', async ({ page }) => {
  await page.goto('/');
  await page.goto('/');
  await expect(page.locator('.sheet__plot')).toBeHidden();
  const animated = await page
    .locator('.hero, .portrait, .sheet-header')
    .evaluateAll(
      (all) => all.flatMap((element) => element.getAnimations({ subtree: true })).length,
    );
  expect(animated).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the first view shows the final sheet, nothing plotted', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bfirst-view\b/);
    await expect(page.locator('.sheet__plot')).toBeHidden();
    await expect(page.locator('.hero__name-line').first()).toHaveCSS('animation-name', 'none');
  });
});
