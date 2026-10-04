import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// SheetIndexPanel (SPEC §3.2; components.md SheetIndexPanel): the phone header below 768 px.
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'desktop and tablet show the tab row');
});

const toggle = (page: Page) => page.locator('.sheet-index button[aria-controls]');
const panel = (page: Page) => page.locator('#sheet-index-panel');
const nl = ui('nl');

test('the phone header shows monogram, current sheet and the SHEETS button', async ({ page }) => {
  await page.goto('/projects/jamigos');
  await expect(page.locator('.sheet-header__monogram')).toBeVisible();
  await expect(page.locator('.sheet-header__current')).toHaveText(/SHEET 03\s*Projects/);
  await expect(page.locator('.sheet-header__tabs')).toBeHidden();
  const button = page.getByRole('button', { name: 'Open sheet index' });
  await expect(button).toHaveText('SHEETS');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAttribute('aria-controls', 'sheet-index-panel');
  await expect(panel(page)).toBeHidden();
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
});

test('opening lists the five sheets, language, theme and CV; a sheet navigates', async ({
  page,
}) => {
  await page.goto('/nl/certifications');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle(page)).toHaveText(nl.sheetIndex.close);
  const sheets = panel(page).locator('.sheet-index__sheet');
  await expect(sheets).toHaveCount(5);
  await expect(sheets.nth(3)).toHaveAttribute('aria-current', 'page');
  await expect(panel(page).getByRole('link', { name: 'EN', exact: true })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: nl.theme.toBlueprint })).toBeVisible();
  await expect(panel(page).getByRole('link', { name: 'CV', exact: true })).toBeVisible();
  await expect(panel(page)).toHaveCSS('clip-path', /inset\(0(px)?\)|none/);
  await expectNoAxeViolations(page);

  await sheets.nth(1).click();
  await expect(page).toHaveURL(/\/nl\/experience\/?$/);
  await expect(page.locator('.sheet-header__current')).toHaveText(
    new RegExp(`${nl.sheet} 02\\s*${nl.sheets.experience}`),
  );
  await expect(panel(page)).toBeHidden();
});

test('Escape closes the panel and returns focus to the button', async ({ page }) => {
  await page.goto('/');
  await toggle(page).click();
  await expect(panel(page)).toBeVisible();
  await panel(page).locator('.sheet-index__sheet').first().focus();
  await page.keyboard.press('Escape');
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle(page)).toBeFocused();
  await expect(panel(page)).toBeHidden();
  await expect(toggle(page)).toHaveAccessibleName('Open sheet index');
});

test('focus is trapped in the open panel', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not tab to links unless the OS setting is on');
  await page.goto('/');
  await toggle(page).click();
  const stops = await panel(page).locator('a[href], button').count();
  await toggle(page).focus();
  for (let i = 0; i < stops; i++) await page.keyboard.press('Tab');
  await expect(panel(page).locator('a[href], button').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle(page)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(panel(page).locator('a[href], button').last()).toBeFocused();
});

test('a tap outside closes the panel', async ({ page }) => {
  await page.goto('/education');
  await toggle(page).click();
  await expect(panel(page)).toBeVisible();
  const box = await page.locator('main').boundingBox();
  if (!box) throw new Error('no main');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 8);
  await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(panel(page)).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the index is a <details> that opens and navigates', async ({ page }) => {
    await page.goto('/');
    await expect(toggle(page)).toBeHidden();
    const summary = page.locator('.sheet-index summary');
    await expect(summary).toHaveText('SHEETS');
    await expect(panel(page)).toBeHidden();
    await summary.click();
    await expect(panel(page)).toBeVisible();
    await panel(page).locator('.sheet-index__sheet').nth(4).click();
    await expect(page).toHaveURL(/\/education\/?$/);
  });
});
