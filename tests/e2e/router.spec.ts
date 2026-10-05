import { expect, test, type Page } from '@playwright/test';

// PR-63b: sheet changes go through Astro's ClientRouter (src/router.ts) — the page is swapped in
// place, never reloaded: a marker set on `window` survives, the header, tab bar and title block
// stay the same elements yet show the new sheet, every page's scripts run once per page, focus
// lands on the new heading and the title is announced, and Back restores the scroll.

/** Marks the document; `kept` is true while no navigation has reloaded it. */
const mark = (page: Page) =>
  page.evaluate(() => {
    Object.assign(window, { routerMarker: true });
    for (const selector of ['.sheet-header', '.tab-bar', '.title-block']) {
      Object.assign(document.querySelector(selector) ?? {}, { routerMarker: true });
    }
  });

const kept = (page: Page) =>
  page.evaluate(() => ({
    window: 'routerMarker' in window,
    chrome: ['.sheet-header', '.tab-bar', '.title-block'].map(
      (selector) => 'routerMarker' in (document.querySelector(selector) ?? {}),
    ),
  }));

/** Clicks a link without Playwright scrolling it into view first (that would move the page). */
const clickInPlace = (page: Page, selector: string) =>
  page.evaluate((s) => document.querySelector<HTMLElement>(s)?.click(), selector);

const desktop = (isMobile: boolean) => test.skip(isMobile, 'the header tabs show from 768 px');

test('the header tabs swap sheets without reloading; the chrome stays and follows', async ({
  page,
  isMobile,
}) => {
  desktop(isMobile);
  await page.goto('/');
  await mark(page);
  for (const path of ['/experience/', '/projects/', '/certifications/', '/education/', '/']) {
    await page.locator(`header nav a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveAttribute('href', path);
    await expect(page.locator('header nav .sheet-tab__fill')).toHaveCount(1);
    // The language links point at this sheet's twin.
    const twin = path === '/' ? '/nl/' : `/nl${path}`;
    await expect(page.locator('.sheet-header__lang[hreflang="nl"]')).toHaveAttribute('href', twin);
    expect(await kept(page), path).toEqual({ window: true, chrome: [true, true, true] });
  }
});

test('the phone tab bar swaps sheets without reloading', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the tab bar shows below 768 px');
  await page.goto('/');
  await mark(page);
  for (const path of ['/experience/', '/projects/', '/']) {
    await page.locator(`.tab-bar a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('.tab-bar a[aria-current="page"]')).toHaveAttribute('href', path);
    await expect(page.locator('.tab-bar .tab-bar__fill')).toHaveCount(1);
    expect(await kept(page), path).toEqual({ window: true, chrome: [true, true, true] });
  }
});

test('switching language swaps the page in place, in the other language', async ({
  page,
  isMobile,
}) => {
  desktop(isMobile);
  await page.goto('/experience/');
  await mark(page);
  await page.locator('.sheet-header__lang[hreflang="nl"]').click();
  await expect(page).toHaveURL(/\/nl\/experience\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expect(page.locator('header nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    '/nl/experience/',
  );
  expect((await kept(page)).window).toBe(true);
});

test('focus moves to the new heading and the new title is announced', async ({
  page,
  isMobile,
}) => {
  desktop(isMobile);
  await page.goto('/');
  await page.locator('header nav a[href="/projects/"]').click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('main h1')).toBeFocused();
  const title = await page.title();
  await expect(page.locator('.astro-route-announcer')).toHaveText(title);
  await expect(page.locator('.astro-route-announcer')).toHaveAttribute('aria-live', 'assertive');
});

test('Back restores the scroll position of the sheet left', async ({ page, isMobile }) => {
  desktop(isMobile);
  await page.goto('/experience/');
  await page.evaluate(() => window.scrollTo(0, 1200));
  // The router records the position on `scrollend`.
  await page.waitForFunction(() => (history.state as { scrollY?: number })?.scrollY === 1200);
  await clickInPlace(page, 'header nav a[href="/projects/"]');
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/experience\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1200);
});

test.describe('motion on a swapped-in sheet', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('runs once per page: reveals, set pieces, no second plotting', async ({
    page,
    isMobile,
  }) => {
    desktop(isMobile);
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/first-view/);
    await mark(page);

    await page.locator('header nav a[href="/experience/"]').click();
    await expect(page).toHaveURL(/\/experience\/$/);
    // The visit's `js` holds; the full plotting played on the first page only.
    await expect(page.locator('html')).toHaveClass(/\bjs\b/);
    await expect(page.locator('html')).not.toHaveClass(/first-view/);
    await expect(page.locator('.timeline')).not.toHaveAttribute('data-scrub', 'pending');
    const lastReveal = page.locator('main [data-reveal]').last();
    await lastReveal.scrollIntoViewIfNeeded();
    await expect(lastReveal).toHaveClass(/is-revealed/);

    await page.locator('header nav a[href="/education/"]').click();
    await expect(page).toHaveURL(/\/education\/$/);
    await expect(page.locator('.assembly')).not.toHaveAttribute('data-scrub', 'pending');
    // The education sheet's script wired this page: a parts-list row selects its part.
    const row = page.locator('tr[data-part]').first();
    await row.click();
    await expect(page).toHaveURL(/#part-\d+$/);
    expect((await kept(page)).window).toBe(true);
  });

  test('the theme switch flips once however many sheets were visited; the choice stays', async ({
    page,
    isMobile,
  }) => {
    desktop(isMobile);
    await page.goto('/');
    for (const path of ['/experience/', '/projects/', '/']) {
      await page.locator(`header nav a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme ?? '');
    const before = await theme();
    await page.locator('.sheet-header__theme').click();
    await expect.poll(theme).not.toBe(before);
    const chosen = await theme();
    await page.locator('header nav a[href="/certifications/"]').click();
    await expect(page).toHaveURL(/\/certifications\/$/);
    expect(await theme()).toBe(chosen);
  });

  test('a phone card toggle opens once after visiting its sheet twice', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'READ MORE shows on the phone cards');
    await page.goto('/experience/');
    for (const path of ['/', '/experience/']) {
      await page.locator(`.tab-bar a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
    const toggle = page.locator('.experience-detail__toggle').first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a tab is a plain link to the next sheet', async ({ page, isMobile }) => {
    await page.goto('/');
    const tabs = isMobile ? '.tab-bar' : 'header nav';
    await page.locator(`${tabs} a[href="/projects/"]`).click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator('main h1')).toHaveCount(1);
  });
});
