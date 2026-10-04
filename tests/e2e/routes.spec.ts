import { expect, test } from '@playwright/test';

import { ROUTES } from './helpers/routes';

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
