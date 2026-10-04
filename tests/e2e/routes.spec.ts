import { expect, test } from '@playwright/test';

// Every route in SPEC §4, in both languages: English at `/`, Dutch under `/nl/` (SPEC §1.4).
const PAGES = [
  '/',
  '/experience',
  '/projects',
  '/projects/jamigos',
  '/projects/subscription-tracker',
  '/projects/recipe-book',
  '/projects/journal',
  '/projects/scentify',
  '/certifications',
  '/education',
];
const ROUTES = PAGES.flatMap((path) => [
  { path, lang: 'en' },
  { path: path === '/' ? '/nl/' : `/nl${path}`, lang: 'nl' },
]);

for (const { path, lang } of ROUTES) {
  test(`${path} is a ${lang} sheet with a heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('an unknown URL gets the not-found sheet', async ({ page }) => {
  const response = await page.goto('/no-such-sheet');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('/nl/404 is a Dutch not-found sheet', async ({ page }) => {
  await page.goto('/nl/404');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
