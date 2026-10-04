import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';

// The 404 sheet (SPEC §3.9 / §4.7; copy.md 404): label, heading, redline note and the five sheets
// as a list of links. `astro preview` answers an unknown URL with `dist/404.html`, as the
// static host does (docs/REPO-MAP.md "Routes and languages"). English is copy.md verbatim; Dutch is
// its translation in the NL content.
const PATHS = ['/', '/experience', '/projects', '/certifications', '/education'];
const nl = ui('nl');

for (const { url, lang, prefix, title, label, heading, note, names } of [
  {
    url: '/no-such-sheet',
    lang: 'en',
    prefix: '',
    title: 'Sheet not found · Michael Goldman — Portfolio',
    label: 'SHEET ?? — NOT IN SET',
    heading: 'SHEET NOT FOUND',
    note: "REV. NOTE △ This sheet isn't in the set. Try one of these:",
    names: ['Overview', 'Experience', 'Projects', 'Certifications', 'Education'],
  },
  {
    url: '/nl/404',
    lang: 'nl',
    prefix: '/nl',
    title: nl.seo.notFound.title,
    label: nl.notFound.label,
    heading: nl.notFound.heading,
    note: nl.notFound.note,
    names: Object.values(nl.sheets),
  },
]) {
  test(`${url} is the not-found sheet with links to the five sheets`, async ({ page }) => {
    const response = await page.goto(url);
    if (lang === 'en') expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
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
