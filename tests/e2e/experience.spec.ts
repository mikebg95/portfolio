import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// Sheet 02 timeline (SPEC §4.2; copy.md Sheet 02; drawing experience-default-light-1440):
// horizontal from 1024 px, vertical below.

test('the sheet shows its label, heading and the drawn timeline', async ({ page }) => {
  await page.goto('/experience');
  await expect(page.locator('.sheet-label').first()).toHaveText(
    'SHEET 02 — EXPERIENCE · ELEVATION',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FIVE YEARS, DRAWN TO SCALE');

  const timeline = page.locator('.timeline');
  const years = await timeline.locator('.timeline__ruler li').allTextContents();
  expect(years[0]).toBe('2021');
  expect(Number(years.at(-1))).toBeGreaterThanOrEqual(2026);

  await expect(timeline.locator('.timeline__employer')).toHaveText('CONSPECT · NOV 2023 – NOW', {
    useInnerText: true,
  });
  await expect(timeline.locator('.timeline__employer-note')).toHaveText(
    'Conspect — IT consultancy in agile software development and data analytics.',
  );

  // Oldest first, each linking to its detail block; the hatched sabbatical has no visible label.
  const bars = timeline.locator('.timeline__bar');
  await expect(bars).toHaveCount(4);
  expect(await bars.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual([
    '#linkpizza',
    '#dji',
    '#sabbatical',
    '#optiecon',
  ]);
  const labels = timeline.locator('.timeline__label:visible');
  expect(await labels.evaluateAll((ls) => ls.map((l) => (l as HTMLElement).innerText))).toEqual([
    'LINKPIZZA · FULL-STACK JAVA DEVELOPER',
    'DJI · FULL-STACK JAVA ENGINEER',
    'OPTIECON →',
  ]);
  await expect(page.getByRole('link', { name: 'Sabbatical · JAN 2026 – MAY 2026' })).toHaveCount(1);
  await expect(timeline.locator('.timeline__entry--break .timeline__segment')).toBeVisible();

  await expect(timeline.locator('.timeline__duration')).toHaveText(['2 Y 8 M', '2 Y 0 M']);
  await expect(timeline.locator('.timeline__legend span')).toHaveText([
    'HATCHED: SABBATICAL',
    'MUAY THAI · SURFING',
  ]);
  await expectNoAxeViolations(page);
});

test('bars are drawn to scale along the ruler', async ({ page }) => {
  await page.goto('/experience');
  const width = page.viewportSize()?.width ?? 0;
  const horizontal = width >= 1024;
  const box = async (selector: string) => {
    const b = await page.locator(selector).first().boundingBox();
    if (!b) throw new Error(`${selector} is not rendered`);
    return b;
  };
  const ruler = await box('.timeline__ruler');
  const linkpizza = await box('.timeline__entry--fill-1 .timeline__segment');
  const dji = await box('.timeline__entry--fill-2 .timeline__segment');
  const length = (b: { width: number; height: number }) => (horizontal ? b.width : b.height);
  const along = (b: { x: number; y: number }) => (horizontal ? b.x - ruler.x : b.y - ruler.y);

  // Vertical below desktop: bars become segments taller than they are wide.
  expect(linkpizza.height > linkpizza.width).toBe(!horizontal);
  // 32 months against 24 (Feb 2021 – Oct 2023, Jan 2024 – Jan 2026), from month starts.
  expect(length(linkpizza) / length(dji)).toBeCloseTo(32 / 24, 1);
  const month = length(dji) / 24;
  expect(along(linkpizza) / month).toBeCloseTo(1, 0);
  expect(along(dji) / month).toBeCloseTo(36, 0);
});

test('a bar leads to its detail block', async ({ page }) => {
  await page.goto('/experience');
  await page
    .getByRole('link', { name: 'DJI · Full-Stack Java Engineer · JAN 2024 – JAN 2026' })
    .click();
  await expect(page).toHaveURL(/\/experience#dji$/);
  // Scrolled to it: its top edge is on screen.
  const top = await page.locator('#dji').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(page.viewportSize()?.height ?? 0);
});

test('the Dutch sheet draws the same timeline', async ({ page }) => {
  await page.goto('/nl/experience');
  await expect(page.locator('.timeline__bar')).toHaveCount(4);
  await expect(page.locator('.timeline__bar').first()).toHaveAttribute('href', '#linkpizza');
  await expect(
    page.getByRole('link', { name: 'OptieCon · Full-Stack Java Engineer · JUN 2026 – NOW' }),
  ).toHaveAttribute('href', '#optiecon');
});
