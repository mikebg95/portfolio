import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

test('the home page loads with a heading and no axe violations', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoAxeViolations(page);
});
