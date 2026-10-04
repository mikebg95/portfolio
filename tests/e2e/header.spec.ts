import { expect, test, type Page } from '@playwright/test';

import { CV_PATH } from '../../src/config';
import { expectNoAxeViolations } from './helpers/axe';

// SheetHeader (SPEC §3.2, §3.5; components.md SheetHeader/SheetTab) on desktop and tablet.
// Phone gets the sheet index panel (PR-8) instead of the tab row.
const SHEET_PATHS = ['/', '/experience', '/projects', '/certifications', '/education'];
const LANGS = [
  { lang: 'en', prefix: '' },
  { lang: 'nl', prefix: '/nl' },
];
const url = (prefix: string, path: string) =>
  prefix && path === '/' ? `${prefix}/` : prefix + path;

const tabs = (page: Page) => page.locator('header nav .sheet-tab');

async function expectCurrentTab(page: Page, index: number | undefined) {
  const all = tabs(page);
  await expect(all).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    if (i === index) await expect(all.nth(i)).toHaveAttribute('aria-current', 'page');
    else await expect(all.nth(i)).not.toHaveAttribute('aria-current', /.*/);
  }
}

test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, 'phone uses the sheet index panel');
});

for (const { lang, prefix } of LANGS) {
  test(`every tab navigates to its sheet and becomes current (${lang})`, async ({ page }) => {
    await page.goto(url(prefix, '/education'));
    for (const [i, path] of SHEET_PATHS.entries()) {
      await tabs(page).nth(i).click();
      await expect(page).toHaveURL(new RegExp(`${url(prefix, path)}/?$`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expectCurrentTab(page, i);
    }
    await expect(tabs(page).locator('.sheet-tab__number')).toHaveText(
      SHEET_PATHS.map((_, i) => `SHEET 0${i + 1}`),
    );
  });

  test(`a project detail sheet marks tab 03 (${lang})`, async ({ page }) => {
    await page.goto(url(prefix, '/projects/jamigos'));
    await expectCurrentTab(page, 2);
  });
}

test('the not-found sheet marks no tab', async ({ page }) => {
  await page.goto('/no-such-sheet');
  await expectCurrentTab(page, undefined);
});

test('the monogram links to the overview in the page language', async ({ page }) => {
  await page.goto('/nl/experience');
  const mark = page.locator('.sheet-header__mark');
  await expect(mark).toContainText('MG');
  await expect(mark).toContainText('DRAWING SET');
  await expect(mark).toContainText('michaelgoldman.dev');
  await mark.click();
  await expect(page).toHaveURL(/\/nl\/$/);
});

test('the language switch goes to the same sheet in the other language', async ({ page }) => {
  await page.goto('/projects/recipe-book');
  const en = page.getByRole('link', { name: 'EN', exact: true });
  await expect(en).toHaveAttribute('aria-current', 'true');
  await page.getByRole('link', { name: 'NL', exact: true }).click();
  await expect(page).toHaveURL(/\/nl\/projects\/recipe-book\/?$/);
  await expect(page.getByRole('link', { name: 'NL', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/recipe-book\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the CV link opens the PDF in a new tab, and the theme button is there', async ({ page }) => {
  await page.goto('/');
  const cv = page.getByRole('link', { name: 'CV', exact: true });
  await expect(cv).toHaveAttribute('href', CV_PATH);
  await expect(cv).toHaveAttribute('target', '_blank');
  const pdf = await page.request.get(CV_PATH);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');

  const theme = page.getByRole('button', { name: 'Switch to blueprint theme' });
  await expect(theme.locator('.sheet-header__theme-label:visible')).toHaveText('PAPER');
  await expectNoAxeViolations(page);
});

test('on a tablet the five tabs stay in one row, without horizontal scroll', async ({ page }) => {
  for (const width of [768, 1023, 1024, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/certifications');
    const tops = await tabs(page).evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size, `tabs in one row at ${width}px`).toBe(1);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll, `no horizontal scroll at ${width}px`).toBeLessThanOrEqual(width);
  }
});
