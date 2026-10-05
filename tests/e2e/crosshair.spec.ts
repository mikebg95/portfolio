import { expect, test, type Page } from '@playwright/test';

import { PAGES } from './helpers/routes';

// The drafting crosshair (design/motion.md §M6, components.md Crosshair): desktop fine pointer
// only, off on touch and under reduced motion, never in the way of a click.
const CROSSHAIR = '[data-crosshair]';
const READOUT = /^X \d{4} · Y \d{4}$/;

/** Where the pointer is in sheet coordinates (from the sheet's padding edge). */
function sheetPoint(page: Page, x: number, y: number) {
  return page.locator('.sheet').evaluate(
    (sheet, { x, y }) => {
      const box = sheet.getBoundingClientRect();
      return { x: x - box.left - sheet.clientLeft, y: y - box.top - sheet.clientTop };
    },
    { x, y },
  );
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'fine pointer only');
  test.use({ reducedMotion: 'no-preference' });

  test('follows the pointer with a readout in sheet coordinates', async ({ page }) => {
    await page.goto('/');
    const crosshair = page.locator(CROSSHAIR);
    await expect(crosshair).toBeHidden();
    await expect(crosshair).toHaveAttribute('aria-hidden', 'true');
    await expect(crosshair).toHaveCSS('pointer-events', 'none');

    for (const [x, y] of [
      [400, 300],
      [911, 512],
    ] as const) {
      await page.mouse.move(x, y);
      const point = await sheetPoint(page, x, y);
      const readout = `X ${String(Math.round(point.x)).padStart(4, '0')} · Y ${String(Math.round(point.y)).padStart(4, '0')}`;
      await expect(crosshair.locator('[data-crosshair-readout]')).toHaveText(readout);
      await expect(crosshair).toBeVisible();
      const lines = await crosshair.evaluate((overlay) => {
        const [h, v] = [...overlay.querySelectorAll('.crosshair__line')].map((line) =>
          line.getBoundingClientRect(),
        );
        return { y: h?.top, x: v?.left };
      });
      expect(lines.x).toBeCloseTo(x, 0);
      expect(lines.y).toBeCloseTo(y, 0);
    }
  });

  test('never captures a click', async ({ page }) => {
    await page.goto('/');
    const tab = page.locator('.sheet-tab').nth(1);
    const box = (await tab.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator(CROSSHAIR)).toBeVisible();
    await page.mouse.down();
    await page.mouse.up();
    await expect(page).toHaveURL(/\/experience\/$/);
  });

  test('hides when the pointer leaves the sheet', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(400, 300);
    await expect(page.locator(CROSSHAIR)).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(page.locator(CROSSHAIR)).toBeHidden();
  });

  test('appears on every sheet', async ({ page }) => {
    for (const path of [...PAGES, '/no-such-sheet']) {
      await page.goto(path);
      await page.mouse.move(500, 400);
      await expect(page.locator(CROSSHAIR), path).toBeVisible();
      await expect(page.locator(`${CROSSHAIR} [data-crosshair-readout]`), path).toHaveText(READOUT);
      await page.mouse.move(2, 2);
    }
  });
});

test.describe('desktop, reduced motion', () => {
  test.skip(({ isMobile }) => isMobile, 'fine pointer only');
  test.use({ reducedMotion: 'reduce' });

  test('is off', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(400, 300);
    await page.mouse.move(420, 320);
    await expect(page.locator(CROSSHAIR)).toBeHidden();
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch only');

  test('is absent', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(200, 300);
    await page.mouse.move(220, 320);
    await page.locator('h1').tap();
    await expect(page.locator(CROSSHAIR)).toBeHidden();
  });
});
