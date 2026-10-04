import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// Sheet 01 hero and portrait (SPEC §4.1; copy.md Sheet 01; design/README.md "Responsive").

// The source file without its blank lead lines and trailing whitespace.
const PORTRAIT = readFileSync('docs/source/ascii-portrait.txt', 'utf8')
  .replace(/^(?:[ \t]*\n)+/, '')
  .trimEnd();

test('the hero shows the drawn text in order', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('section.hero');
  await expect(hero.locator('.sheet-label').first()).toHaveText('SHEET 01 — GENERAL ARRANGEMENT');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MICHAEL GOLDMAN');
  await expect(hero.locator('.hero__role')).toHaveText(
    'Java software engineer — full-stack, building towards DevOps.',
  );
  await expect(hero.locator('.hero__intro')).toHaveText(
    /^Five years of Spring Boot applications with Angular and Vue frontends: .* stay until it runs in production\.$/,
  );
  await expect(hero.locator('.revision-note')).toHaveText(
    'REV. NOTE △ Every project on these sheets started as a drawing: a C4 model, a database schema and an API contract. Then the tests. Then the code.',
  );
  await expectNoAxeViolations(page);
});

test('the buttons go to the projects sheet and the CV', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'VIEW PROJECTS →' })).toHaveAttribute(
    'href',
    '/projects',
  );
  const cv = page.getByRole('link', { name: 'DOWNLOAD CV (PDF)' });
  await expect(cv).toHaveAttribute('href', '/michael-goldman-cv.pdf');
  await expect(cv).toHaveAttribute('target', '_blank');
  await expect(cv).toHaveAttribute('rel', 'noopener');

  await page.getByRole('link', { name: 'VIEW PROJECTS →' }).click();
  await expect(page).toHaveURL(/\/projects\/?$/);
});

test('the Dutch sheet links stay in Dutch', async ({ page }) => {
  await page.goto('/nl/');
  await expect(page.getByRole('link', { name: 'VIEW PROJECTS →' })).toHaveAttribute(
    'href',
    '/nl/projects',
  );
  await expect(page.getByRole('link', { name: 'Spring certified' })).toHaveAttribute(
    'href',
    '/nl/certifications',
  );
});

test('the portrait is real text, hidden from assistive tech, with a text alternative', async ({
  page,
}) => {
  await page.goto('/');
  const ascii = page.locator('pre.portrait__ascii');
  await expect(ascii).toHaveAttribute('aria-hidden', 'true');
  expect(await ascii.textContent()).toBe(PORTRAIT);
  await expect(page.locator('figure.portrait figcaption.sr-only')).toHaveText(
    'Portrait of Michael Goldman, drawn in ASCII characters.',
  );
  const dims = page.locator('figure.portrait .dimension');
  await expect(dims).toHaveText(['5+ YRS FULL-STACK', 'JAVA · SPRING']);
  for (const dim of await dims.all()) await expect(dim).toBeVisible();
});

test('balloons 1–3 are numbered callouts; balloon 1 links to the certifications', async ({
  page,
}) => {
  await page.goto('/');
  const callouts = page.locator('.portrait__callout');
  await expect(callouts).toHaveText([
    /^1\s*Spring certified$/,
    /^2\s*Speaks 7 languages$/,
    /^3\s*Trains Muay Thai$/,
  ]);
  await expect(callouts.getByRole('link')).toHaveCount(1);
  await page.getByRole('link', { name: 'Spring certified' }).click();
  await expect(page).toHaveURL(/\/certifications\/?$/);
});

test('desktop: callouts sit right of the portrait on leaders', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop layout');
  await page.goto('/');
  const frame = await page.locator('pre.portrait__ascii').boundingBox();
  const leaders = page.locator('.portrait__leader');
  await expect(leaders).toHaveCount(3);
  for (const leader of await leaders.all()) {
    const box = await leader.boundingBox();
    // The leader starts inside the frame and runs out past its right edge.
    expect(box && frame && box.x < frame.x + frame.width).toBe(true);
    expect(box && frame && box.x + box.width > frame.x + frame.width).toBe(true);
  }
});

test('phone: callouts become a numbered list under a full-width portrait', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone layout');
  await page.goto('/');
  const frame = await page.locator('pre.portrait__ascii').boundingBox();
  const figure = await page.locator('.hero__figure').boundingBox();
  expect(frame && figure && frame.width).toBeGreaterThan((figure?.width ?? 0) - 40);
  await expect(page.locator('.portrait__leader').first()).toBeHidden();
  let previous = (frame?.y ?? 0) + (frame?.height ?? 0);
  for (const callout of await page.locator('.portrait__callout').all()) {
    const box = await callout.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(previous);
    previous = (box?.y ?? 0) + (box?.height ?? 0);
  }
});

test('no horizontal scroll at 320 px and the name never breaks inside a word', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(320);
  // Each name line is one line box: a word broken in two would double its height.
  for (const line of await page.locator('.hero__name-line').all()) {
    const rects = await line.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects().length;
    });
    expect(rects).toBe(1);
  }
  await expectNoAxeViolations(page);
});
