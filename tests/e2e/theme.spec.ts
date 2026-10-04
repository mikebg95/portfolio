import { readFileSync } from 'node:fs';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { THEME_STORAGE_KEY, type Theme } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';

// Paper / Blueprint switch (SPEC §3.3; copy.md Global; design/README.md rule 10).
const tokens = JSON.parse(
  readFileSync(new URL('../../design/tokens.json', import.meta.url), 'utf8'),
) as { color: Record<string, { light: string; dark: string }> };

/** A token's colour as getComputedStyle reports it. */
function rgb(token: string, theme: Theme): string {
  const hex = tokens.color[token]?.[theme === 'paper' ? 'light' : 'dark'] ?? '';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

/** The theme button the visitor can reach: in the header, or in the sheet index on phone. */
async function themeButton(page: Page) {
  const phone = (page.viewportSize()?.width ?? 0) < 768;
  if (phone) await page.getByRole('button', { name: 'Open sheet index' }).click();
  return page.locator('[data-theme-switch]:visible');
}

/** The visible label (the accessible name is the action, copy.md Global). */
const label = (button: Locator) => button.locator('.sheet-header__theme-label:visible');

async function expectTheme(page: Page, theme: Theme) {
  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', rgb('desk', theme));
  await expect(body).toHaveCSS('color', rgb('ink', theme));
  await expect(page.locator('.sheet')).toHaveCSS('background-color', rgb('paper', theme));
}

const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);

test('the button toggles paper ↔ blueprint and the choice survives a reload', async ({ page }) => {
  await page.goto('/experience');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  let button = await themeButton(page);
  await expect(button).toHaveAccessibleName('Switch to blueprint theme');
  await expect(label(button)).toHaveText('PAPER');
  await expectTheme(page, 'paper');

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
  await expect(button).toHaveAccessibleName('Switch to paper theme');
  await expect(label(button)).toHaveText('BLUEPRINT');
  await expectTheme(page, 'blueprint');
  expect(await stored(page)).toBe('blueprint');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
  await expectTheme(page, 'blueprint');
  button = await themeButton(page);
  await expect(label(button)).toHaveText('BLUEPRINT');

  // By keyboard this time; focus stays on the button.
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(button).toBeFocused();
  await expect(label(button)).toHaveText('PAPER');
  await expectTheme(page, 'paper');
  expect(await stored(page)).toBe('paper');
});

test('a dark system shows blueprint until the visitor picks paper', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/certifications');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  await expectTheme(page, 'blueprint');
  const button = await themeButton(page);
  await expect(button).toHaveAccessibleName('Switch to paper theme');
  await expect(label(button)).toHaveText('BLUEPRINT');
  await expectNoAxeViolations(page);

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expectTheme(page, 'paper');
  expect(await stored(page)).toBe('paper');

  await page.reload();
  await expectTheme(page, 'paper');
  await expect(label(await themeButton(page))).toHaveText('PAPER');
});

test('the label follows a system change while nothing is chosen', async ({ page }) => {
  await page.goto('/');
  const button = await themeButton(page);
  await expect(label(button)).toHaveText('PAPER');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(label(button)).toHaveText('BLUEPRINT');
  await expectTheme(page, 'blueprint');
});

test('the switch still works when storage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/projects');
  await (await themeButton(page)).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blueprint');
  await expectTheme(page, 'blueprint');
  expect(errors).toEqual([]);
});

// Every stub sheet in both themes, with axe (design/README.md rule 10: derived from tokens).
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
  '/nl/',
  '/no-such-sheet',
];

for (const path of PAGES) {
  test(`${path} renders in paper and in blueprint without axe violations`, async ({ page }) => {
    for (const theme of ['paper', 'blueprint'] as const) {
      await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
        THEME_STORAGE_KEY,
        theme,
      ] as const);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectTheme(page, theme);
      await expectNoAxeViolations(page);
    }
  });
}
