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
  scentify: /^NOV 2020 – JAN 2021 · ANDROID$/,
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

test('Jamigos: container view, pipeline route and no live link (copy.md 03.1)', async ({
  page,
}) => {
  await page.goto('/projects/jamigos');
  const fig1 = page.locator('[data-figure="1"]');
  await expect(fig1.locator('figcaption')).toHaveText('FIG. 1 — CONTAINER VIEW');
  await expect(fig1.locator('.box__title')).toHaveText([
    'Browser · Vue 3',
    'Spring Boot API',
    'PostgreSQL',
    'MongoDB',
    'Keycloak',
  ]);
  await expect(fig1.locator('.box--main')).toContainText('@PreAuthorize · @RequireOwner');
  await expect(fig1.locator('.box--external')).toContainText('Keycloak');
  await expect(fig1.locator('.arrow__label')).toHaveText('JWT');

  const fig2 = page.locator('[data-figure="2"]');
  await expect(fig2.locator('figcaption')).toHaveText('FIG. 2 — PIPELINE ROUTE');
  const stations = fig2.locator('.pipeline-route > li');
  await expect(stations).toHaveCount(4);
  await expect(stations.last()).toHaveText('deploy');
  // The final station is filled, the others open.
  const fill = (i: number) =>
    stations
      .nth(i)
      .locator('.pipeline-route__dot')
      .evaluate((d) => getComputedStyle(d).backgroundColor);
  expect(await fill(3)).not.toBe(await fill(0));

  await expect(page.locator('.detail-body .spec-row dt')).toHaveText([
    'SECURITY',
    'DATA',
    'TESTING',
    'FRONTEND',
    'DELIVERY',
  ]);
  await expect(page.locator('.detail-body .revision-note')).toContainText(
    'The jamigos.app domain is retired.',
  );
  await expect(page.getByRole('link', { name: /^REPOSITORY ON GITHUB/ })).toHaveAttribute(
    'href',
    'https://github.com/mikebg95/jamigos',
  );
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => /jamigos\.(app|com|dev|io|nl)/i.test(h ?? ''))).toEqual([]);

  // Phone: the container view's row stacks, so nothing overflows the figure.
  const box = await fig1.boundingBox();
  const row = await fig1.locator('.detail-figure__row').boundingBox();
  expect(row!.x + row!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
});

test('Subscription Tracker: layers and a test pyramid of 63 (copy.md 03.2)', async ({ page }) => {
  await page.goto('/projects/subscription-tracker');
  const fig1 = page.locator('[data-figure="1"]');
  await expect(fig1.locator('figcaption')).toHaveText('FIG. 1 — LAYERS');
  await expect(fig1.locator('.box__title')).toHaveText([
    'Controller',
    'Service',
    'DAO · JdbcTemplate',
    'PostgreSQL 16',
  ]);
  await expect(fig1.locator('.box--main')).toContainText('hand-written SQL');
  await expect(fig1.locator('.arrow__label')).toHaveText(['DTOs', 'entity', 'SQL']);

  const fig2 = page.locator('[data-figure="2"]');
  await expect(fig2.locator('figcaption')).toHaveText('FIG. 2 — TEST PYRAMID — 63 TESTS');
  const levels = fig2.locator('.test-pyramid > li');
  await expect(levels).toHaveText([
    /^2\s*end-to-end on Testcontainers$/,
    /^22\s*DAO integration$/,
    /^25\s*web slice$/,
    /^14\s*unit$/,
  ]);
  const counts = await fig2.locator('.test-pyramid__count').allTextContents();
  expect(counts.map(Number).reduce((a, b) => a + b, 0)).toBe(63);
  // Each level is wider than the one above it.
  const widths = await levels.evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect().width));
  widths.slice(1).forEach((w, i) => expect(w).toBeGreaterThan(widths[i]!));

  await expect(page.locator('.detail-body .spec-row dt')).toHaveText([
    'LAYERS',
    'DATA ACCESS',
    'MIGRATIONS',
    'API',
    'ERRORS',
    'TESTING',
  ]);
  await expect(page.locator('.detail-body .revision-note')).toContainText(
    'case-insensitive unique index',
  );

  // Phone: the layers row stacks, so nothing overflows the figure.
  const box = await fig1.boundingBox();
  const row = await fig1.locator('.detail-figure__row').boundingBox();
  expect(row!.x + row!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
});

test('Recipe Book: design-first flow, the aggregate and 109 tests (copy.md 03.3)', async ({
  page,
}) => {
  await page.goto('/projects/recipe-book');
  const fig1 = page.locator('[data-figure="1"]');
  await expect(fig1.locator('figcaption')).toHaveText('FIG. 1 — DESIGN-FIRST FLOW');
  await expect(fig1.locator('.box__title')).toHaveText([
    'openapi.yaml',
    'API interfaces & DTOs',
    'Controllers',
    'Recipe aggregate',
    'PostgreSQL 18',
  ]);
  await expect(fig1.locator('.box--main')).toContainText('openapi.yaml');
  await expect(fig1.locator('.arrow__label')).toHaveText(['generates', 'DTOs', 'mapper', 'JPA']);

  const fig2 = page.locator('[data-figure="2"]');
  await expect(fig2.locator('figcaption')).toHaveText('FIG. 2 — AGGREGATE');
  await expect(fig2.locator('.box--main')).toContainText('@Version');
  await expect(fig2.locator('.box__title')).toHaveText(['Recipe', 'Step', 'Ingredient']);
  await expect(fig2.locator('.arrow__label')).toHaveText('cascade ALL · orphanRemoval');
  // The root sits above the two parts it owns, which sit side by side (not a chain) at every width.
  const root = await fig2.locator('.box--main').boundingBox();
  const [step, ingredient] = await fig2
    .locator('.detail-figure__parts > *')
    .evaluateAll((ps) => ps.map((p) => p.getBoundingClientRect()));
  expect(step!.y).toBeGreaterThan(root!.y + root!.height);
  expect(ingredient!.y).toBe(step!.y);
  expect(ingredient!.x).toBeGreaterThan(step!.x + step!.width);

  await expect(page.locator('.detail-body .spec-row dt')).toHaveText([
    'AGGREGATE',
    'PERSISTENCE',
    'CONCURRENCY',
    'QUERIES',
    'INTEGRITY',
    'API',
    'TESTING',
  ]);
  await expect(page.locator('.detail-body .spec-row dd').last()).toContainText('109 tests');
  await expect(page.locator('.detail-body .revision-note')).toContainText(
    'deferrable unique constraints',
  );

  const box = await fig1.boundingBox();
  const row = await fig1.locator('.detail-figure__row').boundingBox();
  expect(row!.x + row!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
});

test('Journal: ports & adapters, 7 ADR links and the status in redline (copy.md 03.4)', async ({
  page,
}) => {
  await page.goto('/projects/journal');
  const meta = page.locator('.detail-head__meta');
  const status = meta.locator('.detail-head__status');
  await expect(status).toHaveText('IN PROGRESS');
  const colour = (l: typeof meta) => l.evaluate((e) => getComputedStyle(e).color);
  expect(await colour(status)).not.toBe(await colour(meta));

  const fig1 = page.locator('[data-figure="1"]');
  await expect(fig1.locator('figcaption')).toHaveText('FIG. 1 — PORTS & ADAPTERS');
  const hexagon = fig1.locator('.hexagon');
  await expect(hexagon).toContainText('Application');
  await expect(hexagon.locator('.box--main .box__title')).toHaveText('Domain');
  expect(await hexagon.evaluate((e) => getComputedStyle(e).clipPath)).toMatch(/^polygon/);
  await expect(fig1.locator('.box__title')).toHaveText(['Web', 'Domain', 'Persistence', 'AI']);
  await expect(fig1.locator('.arrow__label')).toHaveText([
    'EntryUseCases',
    'EntryStore · TagStore',
    'EntryEnricher',
  ]);

  const fig2 = page.locator('[data-figure="2"]');
  await expect(fig2.locator('figcaption')).toHaveText('FIG. 2 — DECISION RECORDS');
  const adrs = fig2.getByRole('link');
  await expect(adrs).toHaveCount(7);
  await expect(adrs.first()).toHaveText(/^ADR-0001\s*Hexagonal architecture at P3/);
  for (const [i, adr] of (await adrs.all()).entries()) {
    await expect(adr).toHaveAttribute(
      'href',
      new RegExp(
        `^https://github\\.com/mikebg95/journal/blob/main/docs/architecture/adr/000${i + 1}-`,
      ),
    );
    await expect(adr).toHaveAttribute('target', '_blank');
  }

  await expect(page.locator('.detail-body .spec-row dt')).toHaveText([
    'ARCHITECTURE',
    'DOMAIN',
    'AI',
    'PERSISTENCE',
    'CONCURRENCY',
    'API',
    'TESTING',
  ]);
  await expect(page.locator('.detail-body .revision-note')).toContainText('In progress:');

  // Persistence and AI both hang off the application, side by side on phone too: never one
  // above the other, which would read as persistence → AI.
  const [persistence, ai] = await fig1
    .locator('.detail-figure__stack--fan .box')
    .evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect()));
  const hex = await fig1.locator('.hexagon').boundingBox();
  if (persistence!.y > hex!.y + hex!.height) {
    expect(ai!.y).toBeLessThan(persistence!.y + persistence!.height);
    expect(ai!.x).toBeGreaterThan(persistence!.x + persistence!.width);
  }

  const box = await fig1.boundingBox();
  const row = await fig1.locator('.detail-figure__row').boundingBox();
  expect(row!.x + row!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
});

test('Scentify: question flow and the demo, still under reduced motion (copy.md 03.5)', async ({
  page,
}) => {
  await page.goto('/projects/scentify');
  const fig1 = page.locator('[data-figure="1"]');
  await expect(fig1.locator('figcaption')).toHaveText('FIG. 1 — QUESTION FLOW');
  await expect(fig1.locator('.box__title')).toHaveText([
    '4 questions',
    'Filter',
    'Results list',
    'Detail',
  ]);
  await expect(fig1.locator('.box--main')).toContainText('52 fragrances');

  const fig2 = page.locator('[data-figure="2"]');
  await expect(fig2.locator('figcaption')).toHaveText('FIG. 2 — DEMO');
  const image = fig2.getByRole('img', { name: /^Scentify in use/ });
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('width', '360');
  await expect(image).toHaveAttribute('height', '800');
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(360);
  expect(await image.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(/\/demo\.webp$/);
  await expect(fig2.locator('.demo__caption')).toContainText(
    'Scentify running on an Android emulator.',
  );
  await expect(fig2.locator('.demo__credit')).toHaveText(
    'Source: scentify_gif.gif, github.com/mikebg95/Scentify',
  );

  await expect(page.locator('.detail-body .spec-row dt')).toHaveText([
    'PLATFORM',
    'SCREENS',
    'MATCHING',
    'LIST',
    'CATALOGUE',
    'LIMITATIONS',
  ]);
  await expect(page.locator('.detail-body .revision-note')).toContainText('Where it started');

  // Reduced motion: the first frame, not the animation.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const still = page.locator('[data-figure="2"] img');
  await still.scrollIntoViewIfNeeded();
  await expect(still).toHaveJSProperty('complete', true);
  expect(await still.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(
    /\/demo-still\.webp$/,
  );
});
