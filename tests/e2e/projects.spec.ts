import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// Sheet 03 drawing register (SPEC §4.3; copy.md Sheet 03; drawing projects-default-light-1440):
// row 1 Jamigos (wide) + Scentify, then the series line and P-02, P-03, P-04.
const ORDER = ['jamigos', 'scentify', 'subscription-tracker', 'recipe-book', 'journal'];

for (const prefix of ['', '/nl']) {
  test(`${prefix || '/'}: five cards, each linking to its detail sheet`, async ({ page }) => {
    await page.goto(`${prefix}/projects`);
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(5);
    expect(await cards.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(
      ORDER.map((slug) => `${prefix}/projects/${slug}/`),
    );
    await cards.nth(1).click();
    await expect(page).toHaveURL(`${prefix}/projects/scentify/`);
  });
}

test('the sheet shows its label, heading, intro and the series line', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.locator('.register__head .sheet-label')).toHaveText(
    'SHEET 03 — PROJECTS · DRAWING REGISTER',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DESIGNED FIRST. THEN BUILT.');
  await expect(page.locator('.register__intro')).toHaveText(
    'Each project has its own detail sheet: the architecture, the decisions, the tests and the repository.',
  );
  const series = page.getByRole('heading', { level: 2, name: /^ASSEMBLY/ });
  await expect(series).toHaveText(
    'ASSEMBLY · SPRING PERSISTENCE & ARCHITECTURE SERIES 251 TESTS · ALL TEST-FIRST',
  );
  // The series cards sit under the series line, a level below it.
  const seriesCards = page.locator('.register__series .project-card');
  expect(await seriesCards.evaluateAll((as) => as.map((a) => a.dataset.project))).toEqual(
    ORDER.slice(2),
  );
  await expect(seriesCards.locator('h3')).toHaveCount(3);
  await expectNoAxeViolations(page);
});

test('cards lay out in 3 columns on desktop, 2 on tablet and 1 on phone', async ({ page }) => {
  await page.goto('/projects/');
  const width = page.viewportSize()?.width ?? 0;
  const columns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
  const xs = async () =>
    new Set(
      await page
        .locator('.register__series .project-card')
        .evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().x))),
    ).size;
  expect(await xs()).toBe(columns);

  await page.setViewportSize({ width: 800, height: 1000 });
  expect(await xs()).toBe(2);
  // The flagship spans both columns of the first row; Scentify starts the next.
  const [jamigos, scentify] = await Promise.all(
    ['jamigos', 'scentify'].map((slug) => page.locator(`[data-project="${slug}"]`).boundingBox()),
  );
  expect(scentify!.y).toBeGreaterThan(jamigos!.y + jamigos!.height);

  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(await xs()).toBe(3);
  const [wide, origin] = await Promise.all(
    ['jamigos', 'scentify'].map((slug) => page.locator(`[data-project="${slug}"]`).boundingBox()),
  );
  expect(origin!.y).toBeCloseTo(wide!.y, 0);
  expect(wide!.width / origin!.width).toBeGreaterThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
