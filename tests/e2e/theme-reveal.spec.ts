import { expect, test, type Page } from '@playwright/test';

// design/motion.md §M7: the theme switch is a View Transition whose new theme grows as a circle from
// the theme button (500 ms, ease-plot) over the whole page as one picture; reduced motion and
// browsers without the API swap at once. Chromium only: the assertions read its pseudo-elements.
test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium runs View Transitions');
});

interface Logged {
  /** The visible theme button's centre when the transition started. */
  button: { x: number; y: number };
  finished: boolean;
  animations: { pseudo: string; name: string; duration: number; from: string }[];
}

/** Logs every `document.startViewTransition` the page starts, with its pseudo-element animations. */
async function logTransitions(page: Page) {
  await page.addInitScript(() => {
    const log: Logged[] = [];
    Object.assign(window, { transitions: log });
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update?: ViewTransitionUpdateCallback) => {
      const transition = start(update);
      const rect = [...document.querySelectorAll('[data-theme-switch]')]
        .find((button) => button.checkVisibility())!
        .getBoundingClientRect();
      const entry: Logged = {
        button: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        finished: false,
        animations: [],
      };
      log.push(entry);
      void transition.ready.then(() => {
        entry.animations = document.getAnimations().flatMap((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          const pseudo = effect?.pseudoElement ?? '';
          if (!pseudo.startsWith('::view-transition')) return [];
          const first = effect?.getKeyframes()[0] as { clipPath?: string } | undefined;
          return [
            {
              pseudo,
              name: (animation as CSSAnimation).animationName,
              duration: Number(effect?.getTiming().duration),
              from: first?.clipPath ?? '',
            },
          ];
        });
      });
      void transition.finished.then(() => (entry.finished = true));
      return transition;
    }) as typeof document.startViewTransition;
  });
}

const logged = (page: Page) =>
  page.evaluate(() => (window as unknown as { transitions: Logged[] }).transitions);

// The phone header carries its own theme switch; only one is visible at a time.
const themeButton = (page: Page) => page.locator('[data-theme-switch]:visible');

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('no-preference', () => {
  test.use({ reducedMotion: 'no-preference', colorScheme: 'light' });

  test('the new theme grows as a circle from the button, twice', async ({ page }) => {
    const errors = collectErrors(page);
    await logTransitions(page);
    // A later view: on the first the header cells are still dropping in at the second click. Not a
    // reload of the same URL, which Chromium logs as an aborted transition.
    await page.goto('/');
    await page.goto('/projects/');
    const html = page.locator('html');

    for (const [i, theme] of [[0, 'blueprint'] as const, [1, 'paper'] as const]) {
      await themeButton(page).click();
      await expect(html).toHaveAttribute('data-theme', theme);
      await expect.poll(async () => (await logged(page))[i]?.finished).toBe(true);
      const { animations, button: centre } = (await logged(page))[i]!;

      // One picture: only the root takes part, none of the sheet transitions' names.
      expect(animations.map((a) => a.pseudo).filter((p) => !p.endsWith('(root)'))).toEqual([]);
      const reveal = animations.find((a) => a.pseudo === '::view-transition-new(root)');
      expect(reveal).toMatchObject({ name: 'theme-reveal', duration: 500 });
      const [, x, y] = /^circle\(0px at ([\d.]+)px ([\d.]+)px\)$/.exec(reveal!.from) ?? [];
      expect(Number(x)).toBeCloseTo(centre.x, 0);
      expect(Number(y)).toBeCloseTo(centre.y, 0);

      // The marks are cleared once it is done.
      await expect(html).not.toHaveAttribute('data-theme-switching');
      expect(await html.evaluate((root) => root.style.getPropertyValue('--theme-x'))).toBe('');
    }
    expect(errors).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', colorScheme: 'light' });

  test('the theme swaps at once, no transition', async ({ page }) => {
    const errors = collectErrors(page);
    await logTransitions(page);
    await page.goto('/');
    await themeButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
    expect(await logged(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
});
