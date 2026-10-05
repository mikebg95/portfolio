import { expect, test, type Page } from '@playwright/test';

import { CV_PATH } from '../../src/config';

// PR-63 (2): every sheet link is fetched ahead while it is on screen; a project detail page only
// once its card is hovered or focused; the CV never. Astro's prefetch adds a
// `<link rel="prefetch">` per URL in Chromium (a plain fetch elsewhere).
test.skip(({ browserName }) => browserName !== 'chromium', '<link rel="prefetch"> is Chromium');
test.skip(({ isMobile }) => isMobile, 'the desktop header shows every sheet tab');

/** The paths prefetched so far (Astro writes each link's absolute URL). */
const prefetched = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('head link[rel="prefetch"]')].map(
      (link) => new URL(link.href).pathname,
    ),
  );

test('the sheet tabs on screen are prefetched; project pages wait for a hover', async ({
  page,
}) => {
  await page.goto('/projects/');
  const sheets = ['/', '/experience/', '/certifications/', '/education/'];
  await expect.poll(() => prefetched(page)).toEqual(expect.arrayContaining(sheets));
  expect(await prefetched(page)).not.toContain('/projects/jamigos/');

  await page.locator('a[data-project="jamigos"]').hover();
  await expect.poll(() => prefetched(page)).toContain('/projects/jamigos/');
  expect(await prefetched(page)).not.toContain(CV_PATH);
});
