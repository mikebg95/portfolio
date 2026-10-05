import { mkdirSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { THEME_STORAGE_KEY } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';
import { settleAnimations } from './helpers/motion';

// Sheet 05 on a phone (PR-62d, design/screens/education-part3-sheet-light-390): tapping a part
// opens its detail in a bottom sheet over the tab bar — drag handle (close), ‹ › steps, swipe down
// or Escape to close, focus kept inside; the parts list stays below the assembly. Without JS the
// details stay inline (tests/e2e/education.spec.ts).
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone layout');
});

const SHOTS = '.e2e/education-sheet';
mkdirSync(SHOTS, { recursive: true });

const { sheet: strings } = ui('en').education;
const sheet = (page: Page) => page.locator('dialog.part-sheet');

async function open(page: Page, url = '/education/') {
  await page.goto(url);
  await settleAnimations(page);
}

/** Taps a balloon and waits for the sheet to finish sliding up. */
async function tapPart(page: Page, item: number) {
  await page.locator(`.balloon__mark[data-part="${item}"]`).tap();
  await expect(sheet(page)).toBeVisible();
  await settleAnimations(page);
}

test('the details wait in the sheet; the parts list sits below the assembly', async ({ page }) => {
  await open(page);
  await expect(sheet(page)).toBeHidden();
  await expect(page.locator('.detail-panel:visible')).toHaveCount(0);
  const assembly = (await page.locator('.assembly').boundingBox())!;
  const table = (await page.locator('.parts-list').boundingBox())!;
  expect(table.y).toBeGreaterThanOrEqual(assembly.y + assembly.height);
});

test('tapping a part opens its detail in a bottom sheet over the tab bar', async ({ page }) => {
  await open(page);
  await tapPart(page, 3);
  const dialog = page.getByRole('dialog', { name: 'Part 3: Minor Programming' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.detail-panel:visible')).toHaveId('part-3');
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Minor Programming');
  // Focus is on the sheet itself (announced by its name); Tab goes on to the handle.
  await expect(dialog).toBeFocused();
  await expect(dialog.getByRole('button', { name: `${strings.previous} 2` })).toBeVisible();
  await expect(dialog.getByRole('button', { name: `${strings.next} 4` })).toBeVisible();

  // The sheet ends at the tab bar, which sits under the backdrop: a tap there hits the dialog.
  const bar = (await page.locator('.tab-bar').boundingBox())!;
  const cell = (await page.locator('.tab-bar__cell').first().boundingBox())!;
  const box = (await dialog.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(cell.y + 0.5);
  expect(
    await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.closest('dialog, .tab-bar')?.tagName,
      [bar.x + bar.width / 2, bar.y + bar.height / 2],
    ),
  ).toBe('DIALOG');
  // The chosen plate stays in sight above the sheet.
  const plate = page.locator('.plate[data-part="3"]');
  await expect
    .poll(async () => {
      const rect = (await plate.boundingBox())!;
      return rect.y >= 0 && rect.y + rect.height <= box.y;
    })
    .toBe(true);
  // Every target in the sheet is at least 44 px.
  for (const button of await dialog.locator('button:visible').all()) {
    const target = (await button.boundingBox())!;
    expect(Math.min(target.width, target.height)).toBeGreaterThanOrEqual(44);
  }
  await expectNoAxeViolations(page);
});

test('‹ › step through the parts, one at a time, to either end', async ({ page }) => {
  await open(page);
  await tapPart(page, 3);
  const dialog = sheet(page);
  const next = dialog.locator('[data-sheet-step="next"]');
  const previous = dialog.locator('[data-sheet-step="previous"]');

  await next.tap();
  await expect(dialog).toHaveAccessibleName('Part 4: Harvard CS50');
  await expect(dialog.locator('.detail-panel:visible')).toHaveId('part-4');
  await expect(page).toHaveURL(/#part-4$/);
  await expect(page.locator('.plate[aria-pressed="true"]')).toHaveAttribute('data-part', '4');

  await next.focus();
  await page.keyboard.press('Enter');
  await expect(dialog.locator('.detail-panel:visible')).toHaveId('part-5');
  // Part 5 is the last: no next step, and focus moved to the one left.
  await expect(next).toBeHidden();
  await expect(previous).toBeFocused();
  await expect(previous).toHaveAccessibleName(`${strings.previous} 4`);

  for (const item of [4, 3, 2, 1]) {
    await previous.tap();
    await expect(dialog.locator('.detail-panel:visible')).toHaveId(`part-${item}`);
  }
  await expect(previous).toBeHidden();
  await expect(page).toHaveURL(/#part-1$/);
});

test('the handle, Escape and the backdrop close it; focus returns to the part', async ({
  page,
}) => {
  await open(page);
  await tapPart(page, 2);
  await sheet(page).getByRole('button', { name: strings.close }).tap();
  await expect(sheet(page)).toBeHidden();
  await expect(page.locator('.balloon__mark[data-part="2"]')).toBeFocused();
  // The selection survives the close.
  await expect(page).toHaveURL(/#part-2$/);
  await expect(page.locator('.detail-panel[data-selected="true"]')).toHaveId('part-2');

  await page.locator('.parts-list__select[data-part="4"]').focus();
  await page.keyboard.press('Enter');
  await expect(sheet(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toBeHidden();
  await expect(page.locator('.parts-list__select[data-part="4"]')).toBeFocused();

  // The details are back in place for the no-sheet widths.
  await expect(page.locator('.education__side > .education__details > .detail-panel')).toHaveCount(
    5,
  );

  await tapPart(page, 1);
  await page.mouse.click(10, 10);
  await expect(sheet(page)).toBeHidden();
});

// QA-69: a narrow desktop window, mouse only — the handle is a plain button to a click too.
test.describe('with a mouse, no touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: false, isMobile: false });

  test('clicking the handle closes the sheet; focus returns to the row', async ({ page }) => {
    await open(page);
    const row = page.locator('.parts-list__select[data-part="3"]');
    await row.click();
    await expect(sheet(page)).toBeVisible();
    await settleAnimations(page);
    await sheet(page).getByRole('button', { name: strings.close }).click();
    await expect(sheet(page)).toBeHidden();
    await expect(row).toBeFocused();
  });
});

/** Drags the sheet's handle row down by `dy` px with the mouse (pointer events). */
async function drag(page: Page, dy: number) {
  const head = (await sheet(page).locator('[data-sheet-head]').boundingBox())!;
  const x = head.x + 40;
  const y = head.y + head.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(x, y + (dy * step) / 10);
    await page.waitForTimeout(30);
  }
  await page.mouse.up();
}

test('a swipe down closes the sheet; a short drag springs back', async ({ page }) => {
  await open(page);
  await tapPart(page, 5);
  await drag(page, 30);
  await page.waitForTimeout(400);
  await expect(sheet(page)).toBeVisible();
  expect(await sheet(page).evaluate((el) => getComputedStyle(el).translate)).toMatch(
    /^(none|0px)$/,
  );

  await drag(page, 220);
  await expect(sheet(page)).toBeHidden();
  await expect(page.locator('.balloon__mark[data-part="5"]')).toBeFocused();
});

test('Tab and Shift+Tab stay inside the open sheet', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebKit tabs to links only, by default');
  await open(page);
  await tapPart(page, 4);
  const dialog = sheet(page);
  const inside = () => page.evaluate(() => !!document.activeElement?.closest('dialog'));
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: strings.close })).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await inside()).toBe(true);
  }
  await dialog.getByRole('button', { name: strings.close }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: strings.close })).toBeFocused();
});

test('a #part-n link opens that part in the sheet', async ({ page }) => {
  await open(page, '/nl/education/#part-2');
  const { sheet: nl } = ui('nl').education;
  const dialog = page.getByRole('dialog', { name: 'Onderdeel 2: BSc Politicologie' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: nl.close })).toBeVisible();
  await expect(dialog.getByRole('button', { name: `${nl.next} 3` })).toBeVisible();
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the sheet opens and closes without sliding', async ({ page }) => {
    await open(page);
    await page.locator('.balloon__mark[data-part="3"]').tap();
    await expect(sheet(page)).toHaveCSS('transition-duration', '0s');
    await sheet(page).getByRole('button', { name: strings.close }).tap();
    expect(await sheet(page).evaluate((el) => (el as HTMLDialogElement).open)).toBe(false);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('no sheet: every detail is inline below the assembly', async ({ page }) => {
    await page.goto('/education/');
    await expect(sheet(page)).toBeHidden();
    await expect(page.locator('.education__details .detail-panel:visible')).toHaveCount(5);
  });
});

test('the open sheet is drawn in both themes', async ({ page }, testInfo) => {
  for (const theme of ['paper', 'blueprint'] as const) {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [THEME_STORAGE_KEY, theme],
    );
    await open(page);
    await tapPart(page, 3);
    await page.screenshot({
      path: `${SHOTS}/education-sheet-${theme}-${testInfo.project.name}.png`,
    });
  }
});
