import { expect, test, type Page } from '@playwright/test';

import { CV_PATH } from '../../src/config';
import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// TitleBlock footer (SPEC §3.2; components.md TitleBlock; copy.md Global).

const SHEETS = [
  { path: '/', sheet: '01 / 05' },
  { path: '/experience/', sheet: '02 / 05' },
  { path: '/projects/', sheet: '03 / 05' },
  { path: '/projects/jamigos/', sheet: '03 / 05' },
  { path: '/certifications/', sheet: '04 / 05' },
  { path: '/nl/education/', sheet: '05 / 05' },
  { path: '/no-such-sheet', sheet: '?? / 05' },
];

/** The value drawn under a caption. */
const cell = (page: Page, caption: string) =>
  page
    .locator('footer.title-block dt', { hasText: caption })
    .locator('xpath=following-sibling::dd[1]');

for (const { path, sheet } of SHEETS) {
  test(`${path} has the title block with SHEET ${sheet}`, async ({ page }) => {
    await page.goto(path);
    const { titleBlock: caption } = ui(path.startsWith('/nl/') ? 'nl' : 'en');
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(cell(page, caption.project)).toHaveText('MICHAEL GOLDMAN');
    await expect(cell(page, caption.scale)).toHaveText('1 : 1');
    await expect(cell(page, caption.sheet)).toHaveText(sheet);
    await expect(cell(page, caption.drawn)).toHaveText('M. GOLDMAN');
    await expect(cell(page, caption.checked)).toHaveText('251 TESTS');
    await expect(cell(page, caption.rev)).toHaveText(/^\d{4}\.(0[1-9]|1[0-2])$/);
  });
}

test('the contact cell links email, LinkedIn, GitHub and the CV', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute(
    'href',
    'mailto:mikebgoldman95@gmail.com',
  );
  for (const [name, href] of [
    ['LinkedIn', 'https://linkedin.com/in/mikebg95'],
    ['GitHub', 'https://github.com/mikebg95'],
    ['CV', CV_PATH],
  ] as const) {
    const link = footer.getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  }
  await expectNoAxeViolations(page);
});

test('4 columns from tablet up, 2 on phone, right-aligned at most 761 px', async ({ page }) => {
  await page.goto('/experience/');
  const grid = page.locator('.title-block__grid');
  const layout = await grid.evaluate((el) => ({
    columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
    width: el.getBoundingClientRect().width,
    right: el.getBoundingClientRect().right,
    footerRight: (el.parentElement as Element).getBoundingClientRect().right,
  }));
  const phone = (page.viewportSize()?.width ?? 0) < 768;
  expect(layout.columns).toBe(phone ? 2 : 4);
  expect(layout.width).toBeLessThanOrEqual(761);
  expect(layout.right).toBeCloseTo(layout.footerRight, 0);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
});
