import { expect, test, type Page } from '@playwright/test';

import { ROUTES } from './helpers/routes';

// design/motion.md §M2: moving between sheets is a cross-document View Transition — the frame,
// header and title block stay put, the active tab's fill slides, the content leaves up (180 ms)
// and enters from below (320 ms), a project card's title and diagram morph into the detail sheet.
// Chromium only: the assertions read Chromium's transition pseudo-elements; desktop only: the
// header tabs show from 768 px.
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(({ browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Chromium runs cross-document View Transitions');
  test.skip(testInfo.project.name !== 'chromium-desktop', 'the header tabs show from 768 px');
});

const SWAP_KEY = 'e2e-view-transition-swap';

interface Recorded {
  /** The old page's `pageswap` carried a transition (it opted in and Chromium started one). */
  swapped: string | null;
  /** This page's `pagereveal` carried one. */
  transition: boolean | null;
  finished: boolean;
  animations: { pseudo: string; name: string; duration: number }[];
}

/** Records, on every page the context opens, whether it left and arrived with a View Transition and
 * the transition's pseudo-element animations. */
async function record(page: Page) {
  await page.addInitScript((key) => {
    const recorded: Recorded = {
      swapped: sessionStorage.getItem(key),
      transition: null,
      finished: false,
      animations: [],
    };
    sessionStorage.removeItem(key);
    Object.assign(window, { recorded });
    window.addEventListener('pageswap', (event) => {
      sessionStorage.setItem(key, String(Boolean(event.viewTransition)));
    });
    window.addEventListener('pagereveal', (event) => {
      const transition = event.viewTransition;
      recorded.transition = Boolean(transition);
      void transition?.ready.then(() => {
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
      });
      void transition?.finished.then(() => (recorded.finished = true));
    });
  }, SWAP_KEY);
}

/** What the page now showing recorded; waits for its transition to end if it had one. */
async function recorded(page: Page): Promise<Recorded> {
  await page.waitForFunction(() => {
    const r = (window as unknown as { recorded?: Recorded }).recorded;
    return r && r.transition !== null && (!r.transition || r.finished);
  });
  return page.evaluate(() => (window as unknown as { recorded: Recorded }).recorded);
}

/** Opens `from`, does `act` (which navigates) and returns what the new page recorded; the old page
 * must have started a transition. */
async function navigate(page: Page, from: string, act: (page: Page) => Promise<void>) {
  // Already there: a goto would be a reload, which Chromium logs as an aborted transition.
  if (new URL(page.url()).pathname !== from) await page.goto(from);
  // A click before the page's own reveal starts no transition.
  await recorded(page);
  const url = page.url();
  await act(page);
  await page.waitForURL((next) => next.href !== url);
  const r = await recorded(page);
  expect(r.swapped, `${from} → ${page.url()}`).toBe('true');
  return r;
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
    ['/experience', 'Projects'],
    ['/projects', 'Certifications'],
    ['/certifications', 'Education'],
    ['/education', 'Overview'],
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
  let r = await navigate(page, '/projects', (page) =>
    page.locator('[data-project="journal"]').click(),
  );
  await expect(page).toHaveURL(/\/projects\/journal$/);
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

  r = await navigate(page, '/projects/journal', (page) =>
    page.locator('.detail-head__back').click(),
  );
  await expect(page).toHaveURL(/\/projects$/);
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
  const r = await navigate(page, '/projects/jamigos', async (page) => {
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
    await page.goto('/');
    await recorded(page);
    await tab('Experience')(page);
    await expect(page).toHaveURL(/\/experience$/);
    const r = await recorded(page);
    expect(r.swapped).toBe('false');
    expect(r.transition).toBe(false);
    expect(errors).toEqual([]);
  });
});
