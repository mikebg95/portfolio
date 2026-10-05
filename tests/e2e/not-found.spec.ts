import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// The 404 sheet (SPEC §3.9 / §4.7; copy.md 404): label, heading, redline note and the five sheets
// as a list of links. `astro preview` answers an unknown URL with `dist/404.html`, as the
// static host does (docs/REPO-MAP.md "Routes and languages"). English is copy.md verbatim; Dutch is
// its translation in the NL content. GitHub Pages serves the root `404.html` for every unknown URL,
// `/nl/…` included, so under `/nl/` that page swaps itself for the Dutch sheet (QA-70).
const PATHS = ['/', '/experience/', '/projects/', '/certifications/', '/education/'];
const nl = ui('nl');

const dutch = {
  lang: 'nl',
  prefix: '/nl',
  title: nl.seo.notFound.title,
  label: nl.notFound.label,
  heading: nl.notFound.heading,
  note: nl.notFound.note,
  names: Object.values(nl.sheets),
};

for (const { url, status, lang, prefix, title, label, heading, note, names } of [
  {
    url: '/no-such-sheet',
    status: 404,
    lang: 'en',
    prefix: '',
    title: 'Sheet not found · Michael Goldman — Portfolio',
    label: 'SHEET ?? — NOT IN SET',
    heading: 'SHEET NOT FOUND',
    note: "REV. NOTE △ This sheet isn't in the set. Try one of these:",
    names: ['Overview', 'Experience', 'Projects', 'Certifications', 'Education'],
  },
  { url: '/nl/404', status: undefined, ...dutch },
  { url: '/nl/no-such-sheet', status: 404, ...dutch },
  { url: '/nl/projects/nope', status: 404, ...dutch },
]) {
  test(`${url} is the not-found sheet with links to the five sheets`, async ({ page }) => {
    const response = await page.goto(url);
    if (status) expect(response?.status()).toBe(status);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page).toHaveTitle(title);
    await expect(page.locator('.not-found .sheet-label')).toHaveText(label);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('.not-found .revision-note')).toHaveText(note);

    const links = page.locator('[data-sheet-list] a');
    await expect(links).toHaveText(names.map((name, i) => `0${i + 1}${name}→`));
    expect(await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))).toEqual(
      PATHS.map((path) => (prefix && path === '/' ? `${prefix}/` : `${prefix}${path}`)),
    );
    // No tab is current: the 404 sheet belongs to no sheet.
    await expect(page.locator('.sheet-header [aria-current="page"]')).toHaveCount(0);
    // The address the reader typed stays; the sheet is shown, not hidden behind the swap.
    expect(new URL(page.url()).pathname).toBe(url);
    await expect(page.locator('html')).not.toHaveCSS('visibility', 'hidden');
    await expectNoAxeViolations(page);
  });
}

test('Back to an unknown Dutch URL shows the Dutch not-found sheet again', async ({ page }) => {
  await page.goto('/nl/no-such-sheet');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(dutch.heading);
  await page.locator('[data-sheet-list] a').nth(1).click();
  await expect(page).toHaveURL(/\/nl\/experience\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/nl\/no-such-sheet$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(dutch.heading);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('an unknown Dutch URL shows the English not-found sheet, never a hidden page', async ({
    page,
  }) => {
    const response = await page.goto('/nl/no-such-sheet');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SHEET NOT FOUND');
    await expect(page.locator('html')).not.toHaveCSS('visibility', 'hidden');
  });
});

test('a sheet link on the not-found sheet leads to that sheet', async ({ page }) => {
  await page.goto('/no-such-sheet');
  await page.locator('[data-sheet-list] a', { hasText: 'Experience' }).click();
  await expect(page).toHaveURL(/\/experience\/$/);
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
    const text = el.querySelector('.display-heading__fit')?.firstChild;
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
