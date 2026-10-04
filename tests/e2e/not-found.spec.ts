import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// The 404 sheet (SPEC §3.9 / §4.7; copy.md 404): label, heading, redline note and the five sheets
// as a sheet index list. `astro preview` answers an unknown URL with `dist/404.html`, as the
// static host does (docs/REPO-MAP.md "Routes and languages").
const SHEETS = [
  ['01', 'Overview', '/'],
  ['02', 'Experience', '/experience'],
  ['03', 'Projects', '/projects'],
  ['04', 'Certifications', '/certifications'],
  ['05', 'Education', '/education'],
];

for (const { url, lang, prefix } of [
  { url: '/no-such-sheet', lang: 'en', prefix: '' },
  { url: '/nl/404', lang: 'nl', prefix: '/nl' },
]) {
  test(`${url} is the not-found sheet with links to the five sheets`, async ({ page }) => {
    const response = await page.goto(url);
    if (lang === 'en') expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page).toHaveTitle('Sheet not found — Michael Goldman');
    await expect(page.locator('.not-found .sheet-label')).toHaveText('SHEET ?? — NOT IN SET');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SHEET NOT FOUND');
    await expect(page.locator('.not-found .revision-note')).toHaveText(
      "REV. NOTE △ This sheet isn't in the set. Try one of these:",
    );

    const links = page.locator('[data-sheet-list] a');
    await expect(links).toHaveText(SHEETS.map(([n, name]) => `${n}${name}→`));
    expect(await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))).toEqual(
      SHEETS.map(([, , path]) => (prefix && path === '/' ? `${prefix}/` : `${prefix}${path}`)),
    );
    // No tab is current: the 404 sheet belongs to no sheet.
    await expect(page.locator('.sheet-header [aria-current="page"]')).toHaveCount(0);
    await expectNoAxeViolations(page);
  });
}

test('a sheet link on the not-found sheet leads to that sheet', async ({ page }) => {
  await page.goto('/no-such-sheet');
  await page.locator('[data-sheet-list] a', { hasText: 'Experience' }).click();
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('the not-found sheet fits a 320 px phone without breaking a word', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/no-such-sheet');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  // Each word of the heading sits on one line: SHEET NOT / FOUND, never NO / T.
  const broken = await page.getByRole('heading', { level: 1 }).evaluate((el) => {
    const text = el.firstChild;
    if (text?.nodeType !== Node.TEXT_NODE) return ['(no text node)'];
    const words: string[] = [];
    for (const m of (text.textContent ?? '').matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(text, m.index);
      range.setEnd(text, m.index + m[0].length);
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      if (tops.size > 1) words.push(m[0]);
    }
    return words;
  });
  expect(broken).toEqual([]);
});
