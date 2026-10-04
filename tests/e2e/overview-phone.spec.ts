import { expect, test, type Locator, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { profile } from './helpers/content';
import { settleAnimations } from './helpers/motion';

// Sheet 01 on a phone (PR-62b, design/screens/overview-default-light-390): the portrait as a
// framed FIG. 0 card with balloons on its edge and a caption strip, the two-button row, "How I
// work" as a snap-scrolling card rail with a position indicator, spec rows label over value.
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone layout');
});

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
};

test('the portrait is a FIG. 0 card between the role and the intro', async ({ page }) => {
  for (const [lang, path] of [
    ['en', '/'],
    ['nl', '/nl/'],
  ] as const) {
    await page.goto(path);
    await settleAnimations(page);
    const { figure } = profile(lang).hero;
    await expect(page.locator('.portrait__strip')).toHaveText(
      new RegExp(`^\\s*${figure.label}\\s*${figure.scale}\\s*$`),
    );
    const role = await box(page.locator('.hero__role'));
    const card = await box(page.locator('.portrait__drawing'));
    const intro = await box(page.locator('.hero__intro'));
    expect(card.y).toBeGreaterThan(role.y + role.height);
    expect(intro.y).toBeGreaterThan(card.y + card.height);

    // The portrait fills the card; the dimension lines are not drawn on it.
    const ascii = await box(page.locator('pre.portrait__ascii:visible'));
    expect(ascii.width).toBeGreaterThan(card.width - 4);
    await expect(page.locator('.portrait__dim').first()).toBeHidden();

    // Balloons 1–3 centred on the card's right rule, top to bottom, inside the viewport.
    const balloons = page.locator('.portrait__edge .balloon__mark');
    await expect(balloons).toHaveText(['1', '2', '3']);
    let previous = card.y;
    for (const balloon of await balloons.all()) {
      const b = await box(balloon);
      expect(Math.abs(b.x + b.width / 2 - (card.x + card.width))).toBeLessThan(2);
      expect(b.y).toBeGreaterThan(previous);
      expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      previous = b.y + b.height;
    }
  }
});

test('the callouts are a 3-cell caption strip under the card; cell 1 links to the certifications', async ({
  page,
}) => {
  await page.goto('/');
  await settleAnimations(page);
  const card = await box(page.locator('.portrait__drawing'));
  const cells = page.locator('.portrait__callout');
  await expect(cells).toHaveText([
    /Spring certified$/,
    /Dutch & English native$/,
    /Trains Muay Thai$/,
  ]);
  const boxes = await Promise.all((await cells.all()).map(box));
  for (const [i, cell] of boxes.entries()) {
    expect(Math.abs(cell.y - (card.y + card.height))).toBeLessThan(3);
    expect(cell.height).toBeGreaterThanOrEqual(44);
    if (i) expect(cell.x).toBeGreaterThan(boxes[i - 1]!.x);
  }
  const link = page.getByRole('link', { name: 'Spring certified' });
  expect((await box(link)).height).toBeGreaterThanOrEqual(44);
  await link.click();
  await expect(page).toHaveURL(/\/certifications\/?$/);
});

test('the two buttons share one row, 48 px tall', async ({ page }) => {
  await page.goto('/');
  const projects = await box(page.getByRole('link', { name: 'VIEW PROJECTS →' }));
  const cv = await box(page.getByRole('link', { name: 'DOWNLOAD CV (PDF)' }));
  expect(Math.abs(projects.y - cv.y)).toBeLessThan(1);
  expect(Math.abs(projects.width - cv.width)).toBeLessThan(1);
  expect(projects.height).toBeGreaterThanOrEqual(48);
  expect(cv.height).toBeGreaterThanOrEqual(48);
});

const rail = (page: Page) => page.locator('.how-i-work__grid');
const current = (page: Page) =>
  page
    .locator('.how-i-work__bar')
    .evaluateAll((bars) => bars.findIndex((bar) => bar.hasAttribute('data-current')));

test('how I work is a snap-scrolling rail whose indicator follows the scroll', async ({ page }) => {
  await page.goto('/');
  await settleAnimations(page);
  const list = rail(page);
  await expect(list).toHaveCSS('scroll-snap-type', 'x mandatory');
  const cells = list.locator('.how-i-work__cell');
  await expect(cells).toHaveCount(4);
  // One card in view and the next one's edge.
  const first = await box(cells.first());
  const second = await box(cells.nth(1));
  const width = page.viewportSize()!.width;
  expect(first.x + first.width).toBeLessThan(width);
  expect(second.x).toBeLessThan(width);
  expect(second.x + second.width).toBeGreaterThan(width);

  await expect(page.locator('.how-i-work__index')).toBeVisible();
  await expect(page.locator('.how-i-work__index')).toHaveAttribute('aria-hidden', 'true');
  expect(await current(page)).toBe(0);

  for (const target of [2, 3, 1]) {
    await cells
      .nth(target)
      .evaluate((cell) =>
        cell.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' }),
      );
    await expect.poll(() => current(page)).toBe(target);
  }

  // The page itself never scrolls sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  await expectNoAxeViolations(page);
});

test('the rail is a tab stop and scrolls by keyboard', async ({ page }) => {
  await page.goto('/');
  await settleAnimations(page);
  const list = rail(page);
  await expect(list).toHaveAttribute('tabindex', '0');
  await list.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => current(page)).toBeGreaterThan(0);
});

test('320 px: no sideways page scroll, the caption strip and the rail stay inside', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['/', '/nl/']) {
    await page.goto(path);
    await settleAnimations(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    // No caption text runs out of its cell (Dutch "gecertificeerd" hyphenates).
    for (const cell of await page.locator('.portrait__callout').all()) {
      const overflow = await cell.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  }
});

test('spec rows: the value sits under the label, beside the code', async ({ page }) => {
  await page.goto('/');
  for (const row of await page.locator('.spec-notes__spec .spec-row').all()) {
    const code = await box(row.locator('.spec-row__code'));
    const label = await box(row.locator('.spec-row__label'));
    const value = await box(row.locator('dd'));
    expect(value.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
    expect(Math.abs(value.x - label.x)).toBeLessThan(1);
    expect(value.x).toBeGreaterThan(code.x + code.width);
  }
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('the rail is a plain scroller and the indicator is not drawn', async ({ page }) => {
    await page.goto('/');
    const list = rail(page);
    await expect(list).toHaveCSS('overflow-x', 'auto');
    expect(await list.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await list.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
    expect(await list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expect(page.locator('.how-i-work__index')).toBeHidden();
  });
});
