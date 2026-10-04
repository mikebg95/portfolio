import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { PRIMITIVES_PATH } from '../../src/config';
import { THEMES, type Theme } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';

// The drawing primitives specimen page (PR-11): every variant, once per theme. The screenshot is
// an artifact for a human to look at, never compared against the design PNGs.
const tokens = JSON.parse(
  readFileSync(new URL('../../design/tokens.json', import.meta.url), 'utf8'),
) as { color: Record<string, { light: string; dark: string }> };

function rgb(token: string, theme: Theme): string {
  const hex = tokens.color[token]?.[theme === 'paper' ? 'light' : 'dark'] ?? '';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

const SPECIMENS = [
  'sheet-label',
  'display-heading',
  'button',
  'link',
  'dimension-line',
  'balloon',
  'revision-note',
  'spec-row',
  'figure',
  'stamp',
  'chip',
];

test.beforeEach(async ({ page }) => {
  await page.goto(PRIMITIVES_PATH);
});

test('shows every primitive in both themes, each drawn in its own colours', async ({ page }) => {
  for (const theme of THEMES) {
    const column = page.locator(`[data-primitives-theme="${theme}"]`);
    await expect(column).toHaveCSS('background-color', rgb('paper', theme));
    for (const name of SPECIMENS) {
      await expect(column.locator(`[data-specimen="${name}"]`), `${theme} ${name}`).toBeVisible();
    }
    await expect(column.locator('.display-heading')).toHaveCount(4);
    // Borders come from tokens built on a colour: they must follow the column's theme too.
    await expect(column.locator('.box').first()).toHaveCSS('border-top-color', rgb('line', theme));
    await expect(column.locator('.figure')).toHaveCSS('border-top-color', rgb('ink', theme));
    await expect(column.locator('.revision-note').first()).toHaveCSS(
      'border-top-color',
      rgb('redline', theme),
    );
    await expect(column.locator('.stamp--pending')).toHaveCSS('color', rgb('redline', theme));
  }
});

test('keeps decoration out of the accessibility tree and names what is interactive', async ({
  page,
}) => {
  const column = page.locator('[data-primitives-theme="paper"]');
  for (const dimension of await column.locator('.dimension').all()) {
    await expect(dimension).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(column.locator('span.balloon[aria-hidden="true"]')).toHaveCount(3);
  await expect(column.getByRole('link', { name: '1: Spring certified' })).toBeVisible();
  await expect(column.getByRole('button', { name: 'Part 3: Minor Programming' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const external of await column.locator('a[target="_blank"]').all()) {
    await expect(external).toHaveAttribute('rel', 'noopener');
    await expect(external.locator('[aria-hidden="true"]')).toHaveText(/↗/);
  }
  await expect(column.locator('a[target="_blank"]')).toHaveCount(2);
  await expect(column.locator('.revision-note').first()).toHaveText(
    /^REV\. NOTE △ Every project on these sheets started as a drawing:/,
  );
  await expect(column.locator('.revision-note__lead').first()).toHaveText('REV. NOTE △');
  await expectNoAxeViolations(page);
});

test('every interactive primitive has a 44 px hit area', async ({ page }) => {
  const column = page.locator('[data-primitives-theme="paper"]');
  for (const target of await column.locator('.button').all()) {
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const balloon = column.locator('button.balloon__mark');
  const size = await balloon.evaluate((el) => {
    const hit = getComputedStyle(el, '::before');
    const { width, height } = el.getBoundingClientRect();
    return Math.min(
      width - parseFloat(hit.left) - parseFloat(hit.right),
      height - parseFloat(hit.top) - parseFloat(hit.bottom),
    );
  });
  expect(size).toBeGreaterThanOrEqual(44);
});

test('screenshot of the page for review', async ({ page }, testInfo) => {
  await page.evaluate(() => document.fonts.ready);
  await testInfo.attach('primitives', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
