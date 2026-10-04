import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { profile } from './helpers/content';
import { settleAnimations } from './helpers/motion';

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
    'Java software engineer — backend-first, full-stack, building towards DevOps.',
  );
  await expect(hero.locator('.hero__intro')).toHaveText(
    /^Five years of Java backends — Spring Boot, Spring and Jakarta EE on PostgreSQL — .* from first design to handover\.$/,
  );
  await expect(hero.locator('.revision-note')).toHaveText(
    'REV. NOTE △ Every project in my Spring series started as a drawing: requirements, a C4 model, a database schema and an API contract. Then the tests. Then the code.',
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
  const { hero } = profile('nl');
  await page.goto('/nl/');
  await expect(page.getByRole('link', { name: hero.buttons.projects })).toHaveAttribute(
    'href',
    '/nl/projects',
  );
  await expect(page.getByRole('link', { name: hero.balloons[0]!.text })).toHaveAttribute(
    'href',
    '/nl/certifications',
  );
});

test('the Dutch sheet is written in Dutch', async ({ page }) => {
  await page.goto('/nl/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await expect(page.locator('#main')).toContainText(
    'Java software engineer — backend-first, full-stack, op weg naar DevOps.',
  );
  await expect(page.locator('#main')).toContainText('Ik ontwerp het systeem voordat ik het bouw');
  await expect(page.getByRole('link', { name: 'BEKIJK PROJECTEN →' })).toBeVisible();
  await expect(page).toHaveTitle('Michael Goldman — Portfolio');
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    /Op weg naar Kubernetes en DevOps\.$/,
  );
  await expect(page.getByRole('link', { name: 'Ga naar de inhoud van het blad' })).toBeAttached();
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
  await expect(dims).toHaveText(['5+ YRS JAVA · FULL-STACK', 'SPRING · JAKARTA EE']);
  for (const dim of await dims.all()) await expect(dim).toBeVisible();
});

test('balloons 1–3 are numbered callouts; balloon 1 links to the certifications', async ({
  page,
}) => {
  await page.goto('/');
  const callouts = page.locator('.portrait__callout');
  await expect(callouts).toHaveText([
    /^1\s*Spring certified$/,
    /^2\s*Dutch & English native$/,
    /^3\s*Trains Muay Thai$/,
  ]);
  await expect(callouts.getByRole('link')).toHaveCount(1);
  await page.getByRole('link', { name: 'Spring certified' }).click();
  await expect(page).toHaveURL(/\/certifications\/?$/);
});

test('desktop: callouts sit right of the portrait on leaders', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop layout');
  await page.goto('/');
  await settleAnimations(page); // the first view plots the callouts in (motion.md §M1)
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
  await settleAnimations(page); // the first view plots the callouts in (motion.md §M1)
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

test('how I work: four numbered principles in a 4 / 2 / 1 column grid, then the AI note', async ({
  page,
}) => {
  await page.goto('/');
  const panel = page.locator('section.how-i-work');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('HOW I WORK');
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText([
    'Design before build',
    'Test first',
    'Secure by design',
    'Own it end to end',
  ]);
  await expect(panel.locator('.how-i-work__number')).toHaveText(['01', '02', '03', '04']);
  await expect(panel.locator('.how-i-work__ai')).toHaveText(
    /^ON AI — I build with AI coding agents/,
  );

  for (const [width, columns] of [
    [1440, 4],
    [900, 2],
    [390, 1],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    const tops = await panel
      .locator('.how-i-work__cell')
      .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().top)));
    expect(
      tops.filter((top) => top === tops[0]),
      `${width} px`,
    ).toHaveLength(columns);
  }
});

test('specification S-01…S-07 and general notes 1–6, side by side on desktop', async ({ page }) => {
  await page.goto('/');
  const spec = page.locator('.spec-notes__spec');
  await expect(spec.getByRole('heading', { level: 2 })).toHaveText('SPECIFICATION');
  const rows = spec.locator('.spec-row');
  await expect(rows.locator('dt')).toHaveText([
    /^S-01\s*BACKEND$/,
    /^S-02\s*SECURITY$/,
    /^S-03\s*DATA$/,
    /^S-04\s*TESTING$/,
    /^S-05\s*FRONTEND$/,
    /^S-06\s*DEVOPS$/,
    /^S-07\s*DESIGN$/,
  ]);
  await expect(rows.locator('dd')).toHaveText([
    'Java 17 / 21 / 25+ · Spring Framework · Spring Boot 3 & 4 · Spring MVC · Jakarta EE · JAX-RS · WildFly · REST · OpenAPI · Maven',
    'Spring Security · OAuth2 / OIDC · Keycloak · Microsoft Entra ID · JWT',
    'PostgreSQL · SQL · JPA / Hibernate · Spring Data JPA · JDBC / JdbcTemplate · Flyway · MongoDB',
    'TDD · JUnit · Mockito · Testcontainers · ArchUnit · Unit & integration tests',
    'Angular · Vue · TypeScript · JSF / PrimeFaces · HTML / CSS',
    'Docker · Docker Compose · GitHub Actions · CI/CD · Git · GitLab · Bitbucket · Kubernetes — CKAD in progress',
    'Layered & hexagonal architecture · DDD · Clean code · C4 models · ADRs · Design-first APIs',
  ]);
  // Only Kubernetes is in redline.
  const pending = spec.locator('.spec-notes__pending');
  await expect(pending).toHaveText('Kubernetes — CKAD in progress');
  const redline = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-redline').trim(),
  );
  const probe = await page.evaluate((colour) => {
    const el = document.createElement('span');
    el.style.color = colour;
    document.body.append(el);
    const rgb = getComputedStyle(el).color;
    el.remove();
    return rgb;
  }, redline);
  await expect(pending).toHaveCSS('color', probe);
  await expect(rows.nth(5).locator('dd')).not.toHaveCSS('color', probe);

  const notes = page.locator('.spec-notes__notes');
  await expect(notes.getByRole('heading', { level: 2 })).toHaveText('GENERAL NOTES');
  await expect(notes.locator('ol > li')).toHaveText([
    'Dutch and American, based in Amsterdam.',
    'Native Dutch and English. Italian C1, Portuguese B2, Spanish, French and German B1.',
    'Off-sheet: kickboxing, surfing, guitar, chess, reading.',
    'Studied political science first — I read stakeholders as carefully as stack traces.',
    'Spent the first months of 2026 at a Muay Thai camp, backpacking and surfing in South-East Asia.',
    'All dimensions in years unless stated otherwise.',
  ]);

  // Side by side from 1024 px, stacked below (notes under the table).
  for (const [width, beside] of [
    [1440, true],
    [900, false],
    [390, false],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    const a = await spec.boundingBox();
    const b = await notes.boundingBox();
    expect(
      a && b && (beside ? b.x >= a.x + a.width - 1 : b.y >= a.y + a.height - 1),
      `${width} px`,
    ).toBe(true);
  }
  await expectNoAxeViolations(page);
});

test('in progress: three redline rows above the title block, each link lands on its target', async ({
  page,
}) => {
  const targets = ['#optiecon', '#ckad', 'h1'];
  const items = (lang: string) =>
    profile(lang).current.map(({ text, href }, i) => [text, href, targets[i]!] as const);
  expect(items('en').map(([text, href]) => [text, href])).toEqual([
    ['OptieCon — security and sign-in, at Conspect', '/experience#optiecon'],
    ['CKAD — Certified Kubernetes Application Developer', '/certifications#ckad'],
    ['Journal — hexagonal architecture, part 3 of the series', '/projects/journal'],
  ]);
  await page.goto('/');
  const panel = page.locator('section.in-progress');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('IN PROGRESS');
  await expect(panel.locator('.in-progress__row')).toHaveCount(3);
  await expect(panel.locator('.in-progress__marker')).toHaveText(['◐', '◐', '◐']);
  // The last panel of the sheet: the title block follows it.
  const strip = await panel.boundingBox();
  const footer = await page.locator('footer').last().boundingBox();
  expect(strip && footer && footer.y).toBeGreaterThanOrEqual(
    (strip?.y ?? 0) + (strip?.height ?? 0),
  );
  await expectNoAxeViolations(page);

  for (const [lang, prefix] of [
    ['en', ''],
    ['nl', '/nl'],
  ] as const) {
    for (const [text, href, target] of items(lang)) {
      await page.goto(lang === 'en' ? '/' : '/nl/');
      const link = page.locator('section.in-progress').getByRole('link', { name: text });
      await expect(link).toHaveAttribute('href', prefix + href);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${prefix}${href.replace(/[/#]/g, '\\$&')}$`));
      await expect(page.locator(target)).toHaveCount(1);
    }
  }
});
