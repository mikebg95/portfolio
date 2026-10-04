import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// The phone chrome (PR-62, design/screens/overview-default-light-390): a one-row 56 px header and
// the title-block tab bar fixed to the screen bottom. Desktop and tablet: tests/e2e/header.spec.ts.
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'desktop and tablet show the tab row');
});

const KEYS = ['overview', 'experience', 'projects', 'certifications', 'education'] as const;
const SHEETS = [
  { lang: 'en', paths: ['/', '/experience', '/projects', '/certifications', '/education'] },
  {
    lang: 'nl',
    paths: ['/nl/', '/nl/experience', '/nl/projects', '/nl/certifications', '/nl/education'],
  },
] as const;

const bar = (page: Page, lang: 'en' | 'nl' = 'en') =>
  page.getByRole('navigation', { name: ui(lang).tabBar.label });

test('the header is one 56 px row: monogram, sheet number and name, language, theme', async ({
  page,
}) => {
  await page.goto('/projects/jamigos');
  const header = page.locator('.sheet-header');
  expect((await header.boundingBox())?.height).toBeCloseTo(56, 0);
  await expect(page.locator('.sheet-header__monogram')).toBeVisible();
  await expect(page.locator('.sheet-header__current')).toHaveText(/SHEET 03 \/ 05\s*Projects/);
  await expect(page.locator('.sheet-header__tabs')).toBeHidden();
  await expect(header.getByRole('link', { name: 'CV' })).toBeHidden();

  const lang = header.getByRole('link', { name: 'NL', exact: true });
  await expect(lang).toHaveAttribute('href', /^\/nl\/projects\/jamigos\/?$/);
  await expect(lang).toHaveText('EN/NL');
  const theme = header.getByRole('button', { name: 'Switch to blueprint theme' });
  await expect(theme).toBeVisible();

  // Every cell sits on the one row and is a 44 px+ target.
  for (const cell of [page.locator('.sheet-header__mark'), lang, theme]) {
    const box = await cell.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await lang.click();
  await expect(page).toHaveURL(/\/nl\/projects\/jamigos\/?$/);
  await expect(page.locator('.sheet-header__current')).toHaveText(/BLAD 03 \/ 05\s*Projecten/);
});

for (const { lang, paths } of SHEETS) {
  test(`${lang}: five short-named cells, the current one ink-filled`, async ({ page }) => {
    const names = ui(lang).tabBar.sheets;
    for (const [i, path] of paths.entries()) {
      await page.goto(path);
      const cells = bar(page, lang).getByRole('link');
      await expect(cells).toHaveText(KEYS.map((key, n) => `0${n + 1}${names[key]}`));
      for (const [n, href] of paths.entries()) {
        await expect(cells.nth(n)).toHaveAttribute('href', href);
        if (n === i) await expect(cells.nth(n)).toHaveAttribute('aria-current', 'page');
        else await expect(cells.nth(n)).not.toHaveAttribute('aria-current', /.*/);
      }
      await expect(cells.nth(i).locator('.tab-bar__fill')).toBeVisible();
    }
  });
}

test('the bar holds to the screen bottom while the page scrolls clear of it', async ({ page }) => {
  await page.goto('/experience');
  const viewport = page.viewportSize()!;
  const nav = bar(page);
  for (const scroll of [0, 2000, 1e6]) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    const box = (await nav.boundingBox())!;
    expect(box.y + box.height).toBeCloseTo(viewport.height, 0);
    expect(box.width).toBeCloseTo(viewport.width, 0);
  }
  // 62 px of cells (+ 2 px rule); each a full-height target.
  for (const cell of await nav.getByRole('link').all()) {
    const box = (await cell.boundingBox())!;
    expect(box.height).toBeCloseTo(62, 0);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  // Scrolled to the end, the footer's last line ends above the bar.
  const footer = (await page.locator('.sheet').boundingBox())!;
  const top = (await nav.boundingBox())!.y;
  expect(footer.y + footer.height).toBeLessThanOrEqual(top);
});

test('tapping a cell opens that sheet', async ({ page }) => {
  await page.goto('/');
  await bar(page).getByRole('link', { name: '02 Work' }).click();
  await expect(page).toHaveURL(/\/experience\/?$/);
  await expect(bar(page).getByRole('link', { name: '02 Work' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoAxeViolations(page);
});

test('the 404 sheet has no current cell', async ({ page }) => {
  await page.goto('/no-such-sheet');
  await expect(bar(page).getByRole('link')).toHaveCount(5);
  await expect(bar(page).locator('[aria-current]')).toHaveCount(0);
  await expect(page.locator('.sheet-header__current')).toHaveText('SHEET ?? / 05');
});

test.describe('320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('no sheet name is cut off and the page never scrolls sideways', async ({ page }) => {
    for (const { lang, paths } of SHEETS) {
      for (const path of paths) {
        await page.goto(path);
        const clipped = await page
          .locator('.sheet-header__current > span, .tab-bar__name')
          .evaluateAll((spans) =>
            spans.filter((s) => s.scrollWidth > s.clientWidth).map((s) => s.textContent),
          );
        expect(clipped, `${lang} ${path}`).toEqual([]);
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scroll, `${lang} ${path}`).toBeLessThanOrEqual(320);
      }
    }
  });
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('the cells are plain links', async ({ page }) => {
    await page.goto('/nl/certifications');
    await bar(page, 'nl')
      .getByRole('link', { name: `05 ${ui('nl').tabBar.sheets.education}` })
      .click();
    await expect(page).toHaveURL(/\/nl\/education\/?$/);
  });
});
