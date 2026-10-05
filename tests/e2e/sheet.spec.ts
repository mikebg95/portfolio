import { expect, test } from '@playwright/test';

import { THEME_STORAGE_KEY } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';

// SheetLayout + SheetFrame (SPEC §3.1, §3.3; components.md SheetFrame, SkipLink).

test('the skip link is the first stop and moves focus to the sheet content', async ({
  page,
  browserName,
}) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Skip to sheet content' });
  await expect(skip).not.toBeInViewport();
  // WebKit does not tab to links unless the OS setting is on, so focus it directly there.
  if (browserName === 'webkit') await skip.focus();
  else await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('the sheet has the double frame, and zone numbers 1–8 on desktop only', async ({ page }) => {
  // A later view: on a session's first view the frame and grid are being plotted on their own layer.
  await page.goto('/experience/');
  await page.goto('/experience/');
  const frame = await page.locator('.sheet').evaluate((sheet) => {
    const outer = getComputedStyle(sheet);
    const inner = getComputedStyle(sheet.querySelector('.sheet__inner') as Element);
    return {
      outer: outer.borderTopWidth,
      gap: outer.paddingTop,
      inner: inner.borderTopWidth,
      grid: outer.backgroundSize,
    };
  });
  expect(frame).toEqual({
    outer: '2px',
    gap: '10px',
    inner: '1px',
    grid: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
  });

  const zones = page.locator('.sheet__zones');
  await expect(zones).toHaveAttribute('aria-hidden', 'true');
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (desktop)
    await expect(zones.locator('span')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8']);
  else await expect(zones).toBeHidden();

  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
  await expectNoAxeViolations(page);
});

test('the head script puts a remembered theme on <html>', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'blueprint'), THEME_STORAGE_KEY);
  await page.goto('/nl/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expectNoAxeViolations(page);
});

test('with nothing remembered the theme follows the system', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
});
