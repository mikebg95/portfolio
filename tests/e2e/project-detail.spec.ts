import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// Sheet 03.n project detail template (SPEC §4.4; copy.md "Detail sheets"; drawing
// project-detail-jamigos-default-light-1440). Register order; previous/next wrap.
const PROJECTS = [
  { slug: 'jamigos', code: 'P-01', title: 'Jamigos', repo: 'jamigos' },
  { slug: 'subscription-tracker', code: 'P-02', title: 'Subscription Tracker' },
  { slug: 'recipe-book', code: 'P-03', title: 'Recipe Book' },
  { slug: 'journal', code: 'P-04', title: 'Journal' },
  { slug: 'scentify', code: 'P-05', title: 'Scentify', repo: 'Scentify' },
];
const META: Record<string, RegExp> = {
  jamigos: / · HOSTING RETIRED$/,
  'subscription-tracker': / · SERIES PART 1$/,
  'recipe-book': / · SERIES PART 2$/,
  journal: / · SERIES PART 3 · IN PROGRESS$/,
};

PROJECTS.forEach((project, i) => {
  const previous = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length]!;
  const next = PROJECTS[(i + 1) % PROJECTS.length]!;

  test(`/projects/${project.slug} renders the detail sheet`, async ({ page }) => {
    await page.goto(`/projects/${project.slug}`);
    const main = page.locator('main');

    const back = main.getByRole('link', { name: 'SHEET 03 · DRAWING REGISTER' });
    await expect(back).toHaveAttribute('href', '/projects');
    await expect(main.locator('.sheet-label').first()).toHaveText(
      `DETAIL SHEET 03.${i + 1} — ${project.code}`,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
    await expect(main.locator('.detail-head__summary')).not.toBeEmpty();

    const repo = main.getByRole('link', { name: /^REPOSITORY ON GITHUB/ });
    await expect(repo).toHaveText(/^REPOSITORY ON GITHUB\s*↗$/);
    await expect(repo).toHaveAttribute(
      'href',
      `https://github.com/mikebg95/${project.repo ?? project.slug}`,
    );
    await expect(repo).toHaveAttribute('target', '_blank');
    await expect(main.locator('.detail-head__meta')).toHaveText(META[project.slug] ?? /\d{4}/);

    await expect(main.locator('[data-figure="1"] figcaption')).toHaveText(/^FIG\. 1 — /);
    await expect(main.locator('[data-figure="2"] figcaption')).toHaveText(/^FIG\. 2 — /);
    await expect(main.locator('.detail-body__spec .sheet-label')).toHaveText('SPECIFICATION');
    await expect(main.locator('.detail-body .revision-note')).toBeVisible();

    const prev = main.locator('[data-pager="previous"]');
    await expect(prev).toHaveAttribute('href', `/projects/${previous.slug}`);
    await expect(prev).toContainText('PREVIOUS SHEET');
    await expect(prev).toContainText(`${previous.code} · ${previous.title}`);
    const nxt = main.locator('[data-pager="next"]');
    await expect(nxt).toHaveAttribute('href', `/projects/${next.slug}`);
    await expect(nxt).toContainText('NEXT SHEET');
    await expect(nxt).toContainText(`${next.code} · ${next.title}`);

    await expect(
      page
        .locator('footer.title-block dt', { hasText: 'SHEET' })
        .locator('xpath=following-sibling::dd[1]'),
    ).toHaveText('03 / 05');
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      await expect(page.locator('header nav .sheet-tab[aria-current="page"]')).toContainText(
        'Projects',
      );
    }
    await expectNoAxeViolations(page);
  });
});

test('next and back links navigate, in Dutch too', async ({ page }) => {
  await page.goto('/nl/projects/scentify');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await page.locator('[data-pager="next"]').click();
  await expect(page).toHaveURL('/nl/projects/jamigos');
  await expect(page.locator('[data-pager="previous"]')).toHaveAttribute(
    'href',
    '/nl/projects/scentify',
  );
  await page.locator('.detail-head__back').click();
  await expect(page).toHaveURL('/nl/projects');
});

test('the specification sits beside FIG. 2 on desktop and above it below 1024 px', async ({
  page,
}) => {
  await page.goto('/projects/jamigos');
  const spec = await page.locator('.detail-body__spec').boundingBox();
  const aside = await page.locator('.detail-body__aside').boundingBox();
  expect(spec && aside).toBeTruthy();
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    expect(aside!.x).toBeGreaterThan(spec!.x + spec!.width - 1);
    expect(Math.abs(aside!.y - spec!.y)).toBeLessThan(1);
  } else {
    expect(aside!.y).toBeGreaterThanOrEqual(spec!.y + spec!.height - 1);
  }
});
