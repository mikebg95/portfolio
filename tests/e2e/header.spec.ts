import { expect, test, type Page } from '@playwright/test';

import { CV_PATH } from '../../src/config';
import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// SheetHeader (SPEC §3.2, §3.5; components.md SheetHeader/SheetTab) on desktop and tablet.
// Phone gets the one-row header and the bottom tab bar instead (tests/e2e/tab-bar.spec.ts).
const SHEET_PATHS = ['/', '/experience/', '/projects/', '/certifications/', '/education/'];
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
  test.skip((page.viewportSize()?.width ?? 0) < 768, 'phone uses the tab bar');
});

for (const { lang, prefix } of LANGS) {
  test(`every tab navigates to its sheet and becomes current (${lang})`, async ({ page }) => {
    await page.goto(url(prefix, '/education/'));
    for (const [i, path] of SHEET_PATHS.entries()) {
      await tabs(page).nth(i).click();
      await expect(page).toHaveURL(new RegExp(`${url(prefix, path)}/?$`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expectCurrentTab(page, i);
    }
    await expect(tabs(page).locator('.sheet-tab__number')).toHaveText(
      SHEET_PATHS.map((_, i) => `${ui(lang).sheet} 0${i + 1}`),
    );
  });

  test(`a project detail sheet marks tab 03 (${lang})`, async ({ page }) => {
    await page.goto(url(prefix, '/projects/jamigos/'));
    await expectCurrentTab(page, 2);
  });
}

test('the not-found sheet marks no tab', async ({ page }) => {
  await page.goto('/no-such-sheet');
  await expectCurrentTab(page, undefined);
});

test('the monogram links to the overview in the page language', async ({ page }) => {
  await page.goto('/nl/experience/');
  const mark = page.locator('.sheet-header__mark');
  await expect(mark).toContainText('MG');
  await expect(mark).toContainText(ui('nl').monogram.set);
  await expect(mark).toContainText('michaelgoldman.dev');
  await mark.click();
  await expect(page).toHaveURL(/\/nl\/$/);
});

test('the language switch goes to the same sheet in the other language', async ({ page }) => {
  await page.goto('/projects/recipe-book/');
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
  const cv = page.getByRole('banner').getByRole('link', { name: 'CV', exact: true });
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
    await page.goto('/certifications/');
    const tops = await tabs(page).evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size, `tabs in one row at ${width}px`).toBe(1);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scroll, `no horizontal scroll at ${width}px`).toBeLessThanOrEqual(width);
  }
});

// DESIGN-FIX-4: from 1280 px monogram, five tabs (≥ 140 px) and utilities share one row, laid out
// the same in paper and blueprint (the longer BLUEPRINT label once pushed the utilities down).
for (const { lang, prefix } of LANGS) {
  test(`from 1280 px the header is one row in both themes (${lang})`, async ({ page }) => {
    const layouts: Record<string, string> = {};
    for (const width of [1280, 1440]) {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 900 });
        await page.goto(url(prefix, '/projects/'));
        const cells = await page
          .locator('.sheet-header__mark, header nav .sheet-tab, .sheet-header__utils')
          // Layout offsets, not client rects: the first-view plotting moves the boxes meanwhile.
          .evaluateAll((els) =>
            (els as HTMLElement[]).map(({ offsetTop: top, offsetWidth: width }) => ({
              top,
              width,
            })),
          );
        const where = `${width}px ${colorScheme}`;
        expect(new Set(cells.map(({ top }) => top)).size, `one row at ${where}`).toBe(1);
        for (const { width: tab } of cells.slice(1, 6))
          expect(tab, `tab width at ${where}`).toBeGreaterThanOrEqual(140);
        layouts[width] ??= JSON.stringify(cells);
        expect(JSON.stringify(cells), `paper and blueprint alike at ${width}px`).toBe(
          layouts[width],
        );
      }
    }
  });
}

// PR-67: a tab name never breaks inside a word and never spills out of its cell, at any desktop
// or tablet width (the same per-word check as display-headings.spec.ts).
const TAB_WIDTHS = [768, ...Array.from({ length: (1440 - 770) / 10 + 1 }, (_, i) => 770 + i * 10)];

function tabFaults(): string[] {
  const faults: string[] = [];
  for (const tab of document.querySelectorAll<HTMLElement>('header nav .sheet-tab')) {
    const box = tab.getBoundingClientRect();
    const name = tab.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (tab.scrollWidth > tab.clientWidth + 1) faults.push(`"${name}" overflows its cell`);
    const walker = document.createTreeWalker(tab, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      for (const match of text.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        const tops = new Set(rects.map((r) => Math.round(r.top)));
        if (tops.size > 1) faults.push(`"${name}": "${match[0]}" breaks across lines`);
        if (rects.some((r) => r.left < box.left - 1 || r.right > box.right + 1))
          faults.push(`"${name}": "${match[0]}" sits outside its cell`);
      }
    }
  }
  return faults;
}

for (const { lang, prefix } of LANGS) {
  test(`no tab name breaks a word or leaves its cell, 768–1440 px (${lang})`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'a width sweep: one browser is enough');
    await page.goto(url(prefix, '/'));
    const faults: string[] = [];
    for (const width of TAB_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      faults.push(...(await page.evaluate(tabFaults)).map((fault) => `${width} px: ${fault}`));
    }
    expect(faults).toEqual([]);
  });
}
