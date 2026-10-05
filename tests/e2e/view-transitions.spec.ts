import { expect, test, type Page } from '@playwright/test';

import { ROUTES } from './helpers/routes';

// design/motion.md §M2: moving between sheets is a View Transition, run by Astro's ClientRouter as
// a same-document one (PR-63b) — the frame, header and title block stay put, the active tab's fill
// slides, the content leaves up (180 ms) and enters from below (320 ms), a project card's title
// and diagram morph into the detail sheet. Chromium only: the assertions read Chromium's
// transition pseudo-elements; desktop only: the header tabs show from 768 px.
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(({ browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Chromium runs the View Transitions read here');
  test.skip(testInfo.project.name !== 'chromium-desktop', 'the header tabs show from 768 px');
});

interface Recorded {
  /** The swap ran as a transition (false: skipped, or none started). */
  transition: boolean | null;
  finished: boolean;
  animations: { pseudo: string; name: string; duration: number }[];
}

/** Records every swap the router makes on the page: whether it ran as a View Transition and the
 * transition's pseudo-element animations. */
async function record(page: Page) {
  await page.addInitScript(() => {
    const swaps: Recorded[] = [];
    Object.assign(window, { swaps });
    document.addEventListener('astro:before-swap', (event) => {
      const recorded: Recorded = { transition: null, finished: false, animations: [] };
      swaps.push(recorded);
      const transition = event.viewTransition;
      void transition.ready.then(
        () => {
          recorded.transition = true;
          recorded.animations = document.getAnimations().flatMap((animation) => {
            const effect = animation.effect as KeyframeEffect | null;
            const pseudo = effect?.pseudoElement ?? '';
            return pseudo.startsWith('::view-transition')
              ? [
                  {
                    pseudo,
                    name: (animation as CSSAnimation).animationName,
                    duration: Number(effect?.getTiming().duration),
                  },
                ]
              : [];
          });
        },
        () => (recorded.transition = false),
      );
      void transition.finished.finally(() => (recorded.finished = true));
    });
  });
}

const swapCount = (page: Page) =>
  page.evaluate(() => (window as unknown as { swaps: Recorded[] }).swaps.length);

/** Opens `from`, does `act` (which navigates) and returns what the swap recorded, once its
 * transition has ended. */
async function navigate(page: Page, from: string, act: (page: Page) => Promise<void>) {
  if (new URL(page.url()).pathname !== from) await page.goto(from);
  const before = await swapCount(page);
  await act(page);
  await page.waitForFunction((n) => {
    const swaps = (window as unknown as { swaps: Recorded[] }).swaps;
    const r = swaps[n];
    return r && r.transition !== null && r.finished;
  }, before);
  return page.evaluate((n) => (window as unknown as { swaps: Recorded[] }).swaps[n]!, before);
}

/** Console errors and uncaught exceptions for the whole test. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

const animation = (r: Recorded, pseudo: string) => r.animations.find((a) => a.pseudo === pseudo);

const tab = (name: string) => (page: Page) =>
  page.locator('header nav .sheet-tab', { hasText: name }).click();

// Without JS the router does not run: the inline opt-in still gives a cross-document transition.
test('every page opts in to cross-document transitions under no-preference only', async ({
  page,
}) => {
  await page.goto('/');
  const optIn = await page.evaluate(() => {
    const found: string[] = [];
    const walk = (rules: CSSRuleList, media: string) => {
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule) walk(rule.cssRules, rule.conditionText);
        else if (rule.cssText.startsWith('@view-transition'))
          found.push(`${media} ${rule.cssText}`);
      }
    };
    for (const sheet of document.styleSheets) walk(sheet.cssRules, '');
    return { found, api: 'startViewTransition' in document };
  });
  expect(optIn.api).toBe(true);
  expect(optIn.found).toEqual([
    '(prefers-reduced-motion: no-preference) @view-transition { navigation: auto; }',
  ]);
});

test('every page names its chrome once and no name twice', async ({ page }) => {
  for (const { path } of ROUTES) {
    await page.goto(path);
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => getComputedStyle(element).viewTransitionName)
        .filter((name) => name !== 'none'),
    );
    expect(new Set(names).size, `${path}: ${names.join(' ')}`).toBe(names.length);
    expect(names, path).toEqual(
      expect.arrayContaining([
        'sheet',
        'sheet-header',
        'active-tab',
        'sheet-content',
        'title-block',
      ]),
    );
  }
});

test('moving between sheets keeps the chrome, slides the tab fill and swaps the content', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await record(page);
  const steps = [
    ['/', 'Experience'],
    ['/experience/', 'Projects'],
    ['/projects/', 'Certifications'],
    ['/certifications/', 'Education'],
    ['/education/', 'Overview'],
  ] as const;

  for (const [from, name] of steps) {
    const r = await navigate(page, from, tab(name));
    expect(r.transition, name).toBe(true);
    // The fill slides: its group morphs from the old tab to the new one.
    expect(animation(r, '::view-transition-group(active-tab)'), name).toMatchObject({
      name: expect.stringMatching(/group-anim/),
      duration: 320,
    });
    // The chrome stays put: no morph of its boxes; the frame shows at once.
    for (const chrome of ['sheet', 'sheet-header', 'sheet-content', 'title-block']) {
      expect(
        animation(r, `::view-transition-group(${chrome})`),
        `${name} ${chrome}`,
      ).toBeUndefined();
    }
    expect(animation(r, '::view-transition-new(sheet)'), name).toBeUndefined();
    expect(animation(r, '::view-transition-new(sheet-header)')?.name, name).toBe('sheet-fade-in');
    expect(animation(r, '::view-transition-old(sheet-content)'), name).toMatchObject({
      name: 'sheet-content-leave',
      duration: 180,
    });
    expect(animation(r, '::view-transition-new(sheet-content)'), name).toMatchObject({
      name: 'sheet-content-enter',
      duration: 320,
    });
    await expect(page.locator('header nav .sheet-tab[aria-current="page"]')).toContainText(name);
  }
  expect(errors).toEqual([]);
});

test('a project card morphs into its detail sheet and back', async ({ page }) => {
  const errors = collectErrors(page);
  await record(page);
  let r = await navigate(page, '/projects/', (page) =>
    page.locator('[data-project="journal"]').click(),
  );
  await expect(page).toHaveURL(/\/projects\/journal\/$/);
  expect(r.transition).toBe(true);
  for (const part of ['title', 'figure']) {
    // Both pages carry the name, so the group morphs; neither picture leaves or enters alone.
    expect(animation(r, `::view-transition-group(project-${part}-journal)`)?.name).toMatch(
      /group-anim/,
    );
    expect(animation(r, `::view-transition-new(project-${part}-journal)`)?.name).not.toBe(
      'sheet-content-enter',
    );
  }
  // The other cards' titles leave with the content.
  expect(animation(r, '::view-transition-old(project-title-jamigos)')?.name).toBe(
    'sheet-content-leave',
  );

  r = await navigate(page, '/projects/journal/', (page) =>
    page.locator('.detail-head__back').click(),
  );
  await expect(page).toHaveURL(/\/projects\/$/);
  expect(r.transition).toBe(true);
  expect(animation(r, '::view-transition-group(project-title-journal)')?.name).toMatch(
    /group-anim/,
  );
  expect(animation(r, '::view-transition-new(project-title-jamigos)')?.name).toBe(
    'sheet-content-enter',
  );
  expect(errors).toEqual([]);
});

test('leaving a scrolled page fades it as a whole instead of flying the chrome in', async ({
  page,
}) => {
  await record(page);
  const r = await navigate(page, '/projects/jamigos/', async (page) => {
    const next = page.locator('[data-pager="next"]');
    await next.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await next.click();
  });
  expect(r.transition).toBe(true);
  expect(animation(r, '::view-transition-old(sheet-content)')).toBeUndefined();
  expect(animation(r, '::view-transition-new(sheet-content)')?.name).toBe('sheet-content-enter');
  expect(animation(r, '::view-transition-new(sheet)')?.name).toBe('sheet-fade-in');
  expect(animation(r, '::view-transition-new(sheet-header)')?.name).toBe('sheet-fade-in');
  expect(animation(r, '::view-transition-new(active-tab)')?.name).toBe('sheet-fade-in');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('navigation has no transition', async ({ page }) => {
    const errors = collectErrors(page);
    await record(page);
    const r = await navigate(page, '/', tab('Experience'));
    await expect(page).toHaveURL(/\/experience\/$/);
    expect(r.transition).toBe(false);
    expect(errors).toEqual([]);
  });
});
