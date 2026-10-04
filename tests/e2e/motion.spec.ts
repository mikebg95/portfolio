import { expect, test, type Page } from '@playwright/test';

import { PRIMITIVES_PATH } from '../../src/config';
import {
  CARD_STAGGER_MS,
  FIGURE_FADE_MS,
  FIRST_VIEW_CLASS,
  FLOW_STAGGER_MS,
  JS_CLASS,
  REVEALED_CLASS,
} from '../../src/motion';
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

/** The text of every `[data-count]` element as the server sent it: what a count-up must end on. */
async function servedCounts(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  return page.evaluate(
    (html) =>
      [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('[data-count]')].map(
        (element) => element.textContent,
      ),
    html,
  );
}

/** Records every text a `[data-count]` element shows from now on. */
async function recordCounts(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    Object.assign(window, { seenCounts: seen });
    new MutationObserver((records) => {
      for (const record of records) {
        const count = record.target.parentElement?.closest('[data-count]');
        if (count) seen.push(count.textContent ?? '');
      }
    }).observe(document.body, { subtree: true, characterData: true });
  });
}

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
    await expect(reveals).toHaveCount(15);
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
    // A later view: a first view holds every reveal until the sheet is plotted.
    await page.goto(PRIMITIVES_PATH);
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

test.describe('every page, scrolled to the bottom', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const path of EVERY_PAGE) {
    test(`${path} ends in its final state, counts on their numbers`, async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);
      for (const element of await page.locator('[data-reveal]').all()) {
        await expect(element).toHaveClass(new RegExp(REVEALED_CLASS));
      }
      expect(await notInFinalState(page)).toEqual([]);
      const served = await servedCounts(page, path);
      await expect.poll(() => page.locator('[data-count]').allTextContents()).toEqual(served);
    });
  }
});

test.describe('figures and counts', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a figure fades in, then draws its arrows in data-flow order', async ({ page }) => {
    await page.goto('/projects/recipe-book');
    await page.goto('/projects/recipe-book');
    await scrollThrough(page);
    for (const figure of await page.locator('[data-reveal="figure"]').all()) {
      await expect(figure).toHaveCSS('animation-name', 'reveal-fade');
      const delays = await figure
        .locator('[data-flow]')
        .evaluateAll((all) =>
          all.map((arrow) => (arrow as HTMLElement).style.getPropertyValue('--reveal-delay')),
        );
      expect(delays).toEqual(delays.map((_, i) => `${FIGURE_FADE_MS + i * FLOW_STAGGER_MS}ms`));
    }
    await expect(page.locator('[data-figure="1"] [data-flow]').first()).toHaveCSS(
      'animation-name',
      'reveal-wipe',
    );
  });

  test('a spec row inks in and then draws its rule', async ({ page }) => {
    await page.goto('/projects/jamigos');
    const row = page.locator('[data-reveal="row"]').first();
    await row.scrollIntoViewIfNeeded();
    await expect(row).toHaveClass(new RegExp(REVEALED_CLASS));
    await expect(row).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
    expect(
      await row.evaluate((element) => {
        const rule = getComputedStyle(element, '::after');
        return `${rule.animationName} ${rule.height} ${rule.bottom}`;
      }),
    ).toBe('reveal-rule 1px -1px');
  });

  test('numbers count up once, from 0, to the served text', async ({ page }) => {
    await page.goto('/projects');
    const served = await servedCounts(page, '/projects');
    await recordCounts(page);
    await scrollThrough(page);
    await expect.poll(() => page.locator('[data-count]').allTextContents()).toEqual(served);
    const seen = await page.evaluate(
      () => (window as unknown as { seenCounts: string[] }).seenCounts,
    );
    expect(seen).toContain(served.find((text) => text?.includes('TESTS'))?.replace(/\d+/, '0'));
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('numbers never count', async ({ page }) => {
      await page.goto('/projects');
      await recordCounts(page);
      await scrollThrough(page);
      expect(
        await page.evaluate(() => (window as unknown as { seenCounts: string[] }).seenCounts),
      ).toEqual([]);
    });
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

test.describe('certification stamps (§M6)', () => {
  /** A later view of Sheet 04 once its first stamp is revealed: the first stamp's animations as
   * `name@delay`, every stamp's reveal delay, and the CKAD ring's iteration counts. */
  async function stamps(page: Page) {
    await page.goto('/certifications');
    await page.goto('/certifications');
    // Stamps slam "on enter" (§M6): on an iPhone 14 the first one starts below the fold. Scrolled
    // in the page, not with scrollIntoViewIfNeeded, which waits for the slam to end.
    const stamp = page.locator('.stamp').first();
    await stamp.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(stamp).toHaveClass(new RegExp(REVEALED_CLASS));
    return page.evaluate(() => ({
      first: document
        .querySelector('.stamp')!
        .getAnimations()
        .map(
          (a) =>
            `${(a as CSSAnimation).animationName}@${Math.round(Number(a.effect?.getTiming().delay))}`,
        ),
      delays: [...document.querySelectorAll<HTMLElement>('.stamp')].map(
        (stamp) => stamp.dataset.revealDelay,
      ),
      ring: document
        .querySelector('.stamp__ring circle')!
        .getAnimations()
        .map((a) => a.effect?.getTiming().iterations),
    }));
  }

  test('slam in card order 120 ms apart, then bleed; the CKAD ring turns forever', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const { first, delays, ring } = await stamps(page);
    expect(first).toEqual(['reveal-stamp@300', 'stamp-bleed@680']);
    expect(delays).toEqual(['300', '420', '540', '660']);
    expect(ring).toEqual([Infinity]);
  });

  test('under reduced motion nothing slams and the ring is still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { first, ring } = await stamps(page);
    expect(first).toEqual([]);
    expect(ring).toEqual([]);
  });
});
