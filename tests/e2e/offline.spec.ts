import { expect, test, type Page } from '@playwright/test';

import { CV_PATH } from '../../src/config';
import { isPrecached } from '../../src/precache';
import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';
import { ROUTES } from './helpers/routes';

// PR-63: after one visit the service worker has stored the whole set, so every sheet and project
// page opens with no connection; a page it has not stored gets the offline sheet in its language.
// The other specs block service workers (playwright.config.ts); this one needs it.
test.use({ serviceWorkers: 'allow' });
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'Playwright offline + workers: Chromium',
);

/** Opens `/` online and waits until the worker controls the page (installed = all stored). */
async function installOffline(page: Page) {
  await page.goto('/');
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
}

test('every sheet and project page opens offline after one visit', async ({ page, context }) => {
  await installOffline(page);
  await context.setOffline(true);
  // A request the worker should have answered from its store and could not.
  const missing: string[] = [];
  page.on('requestfailed', (request) => {
    const { pathname } = new URL(request.url());
    if (isPrecached(pathname)) missing.push(`${pathname} ${request.failure()?.errorText}`);
  });

  for (const { path, lang } of ROUTES) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('html'), path).toHaveAttribute('lang', lang);
    await expect(page.locator('h1'), path).toHaveCount(1);
    await expect(page, path).not.toHaveTitle(ui(lang).seo.offline.title);
  }
  expect(await page.evaluate((cv) => fetch(cv).then((r) => r.status), CV_PATH)).toBe(200);
  expect(missing).toEqual([]);
});

for (const lang of ['en', 'nl']) {
  test(`a page not stored shows the ${lang} offline sheet`, async ({ page, context }) => {
    const copy = ui(lang);
    await installOffline(page);
    await context.setOffline(true);

    await page.goto(lang === 'en' ? '/no-such-sheet' : '/nl/no-such-sheet');
    await expect(page).toHaveTitle(copy.seo.offline.title);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toHaveText(copy.offline.heading);
    await expect(page.locator('[data-sheet-list] a')).toHaveCount(5);
    await expectNoAxeViolations(page);

    // Its links lead to stored sheets.
    await page.locator('[data-sheet-list] a').nth(1).click();
    await expect(page).not.toHaveTitle(copy.seo.offline.title);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('one cache per build: the worker keeps only its own', async ({ page }) => {
  await installOffline(page);
  const names = await page.evaluate(() => caches.keys());
  expect(names).toHaveLength(1);
});
