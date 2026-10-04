import { expect, test, type Page } from '@playwright/test';

import { PRIMITIVES_PATH } from '../../src/config';
import { CARD_STAGGER_MS, FIRST_VIEW_CLASS, JS_CLASS, REVEALED_CLASS } from '../../src/motion';
import { notInFinalState } from './helpers/motion';
import { ROUTES } from './helpers/routes';

// The motion foundation (design/motion.md principles, §M3, "Testing motion"). The reveal kinds are
// exercised on the /_primitives page's motion specimens; the guards on every route.
const EVERY_PAGE = [
  ...ROUTES.map(({ path }) => path),
  '/no-such-sheet',
  '/nl/404',
  PRIMITIVES_PATH,
];
const SPECIMENS = '[data-motion-specimens]';

/** Scrolls to the bottom half a viewport at a time, two frames per step, so the observer sees each. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    while (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 1) {
      window.scrollBy(0, window.innerHeight / 2);
      await frame();
      await frame();
    }
  });
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of EVERY_PAGE) {
    test(`${path} is in its final state after load`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${JS_CLASS}\\b`));
      expect(await notInFinalState(page)).toEqual([]);
    });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of EVERY_PAGE) {
    test(`${path} shows all content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).not.toHaveClass(new RegExp(`\\b${JS_CLASS}\\b`));
      expect(await notInFinalState(page)).toEqual([]);
    });
  }
});

test.describe('scroll reveals', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('wait below the fold, then reveal once each and end in their final state', async ({
    page,
  }) => {
    await page.goto(PRIMITIVES_PATH);
    const reveals = page.locator(`${SPECIMENS} [data-reveal]`);
    await expect(reveals).toHaveCount(10);
    for (const element of await reveals.all()) {
      await expect(element).not.toHaveClass(new RegExp(REVEALED_CLASS));
    }
    await expect(page.locator(`${SPECIMENS} [data-reveal="ink"]`).first()).toHaveCSS(
      'opacity',
      '0',
    );
    await expect(page.locator(`${SPECIMENS} [data-reveal="cards"] > *`).first()).toHaveCSS(
      'opacity',
      '0',
    );

    await scrollThrough(page);
    for (const element of await reveals.all()) {
      await expect(element).toHaveClass(new RegExp(REVEALED_CLASS));
    }
    expect(await notInFinalState(page, SPECIMENS)).toEqual([]);
  });

  test('stagger rows by data-reveal-delay and cards by column', async ({ page }) => {
    await page.goto(PRIMITIVES_PATH);
    await scrollThrough(page);
    const rows = await page
      .locator(`${SPECIMENS} [data-reveal="ink"]`)
      .evaluateAll((all) =>
        all.map((row) => (row as HTMLElement).style.getPropertyValue('--reveal-delay')),
      );
    expect(rows).toEqual(['', '80ms', '160ms']);

    const cards = await page.locator(`${SPECIMENS} [data-reveal="cards"] > *`).evaluateAll((all) =>
      all.map((card) => ({
        left: Math.round(card.getBoundingClientRect().left),
        delay: (card as HTMLElement).style.getPropertyValue('--reveal-delay'),
      })),
    );
    const lefts = [...new Set(cards.map(({ left }) => left))].sort((a, b) => a - b);
    expect(cards.map(({ delay }) => delay)).toEqual(
      cards.map(({ left }) => `${lefts.indexOf(left) * CARD_STAGGER_MS}ms`),
    );
  });
});

test.describe('first page view', () => {
  test('is flagged once per session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${FIRST_VIEW_CLASS}\\b`));
    await page.goto('/projects');
    await expect(page.locator('html')).not.toHaveClass(new RegExp(`\\b${FIRST_VIEW_CLASS}\\b`));
  });

  test('is never flagged, without errors, when storage is blocked', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${JS_CLASS}\\b`));
    await expect(page.locator('html')).not.toHaveClass(new RegExp(`\\b${FIRST_VIEW_CLASS}\\b`));
    expect(errors).toEqual([]);
  });
});
