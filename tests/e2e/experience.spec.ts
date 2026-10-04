import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';
import { settleAnimations } from './helpers/motion';

// Sheet 02 timeline (SPEC §4.2; copy.md Sheet 02; drawing experience-default-light-1440):
// horizontal from 1024 px, vertical below; on a phone (< 768 px) the cards are the timeline
// instead (experience-phone.spec.ts).
const PHONE = 'phone draws cards beside a ruler, not bars';
const phone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

test('the sheet shows its label, heading and the drawn timeline', async ({ page }) => {
  test.skip(phone(page), PHONE);
  await page.goto('/experience');
  await expect(page.locator('.sheet-label').first()).toHaveText(
    'SHEET 02 — EXPERIENCE · ELEVATION',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FIVE YEARS, DRAWN TO SCALE');

  const timeline = page.locator('.timeline');
  const years = await timeline.locator('.timeline__ruler li').allTextContents();
  expect(years[0]).toBe('2021');
  expect(Number(years.at(-1))).toBeGreaterThanOrEqual(2026);

  await expect(timeline.locator('.timeline__employer-label')).toHaveText(
    'CONSPECT · NOV 2023 – NOW',
    { useInnerText: true },
  );
  // The dimension line is the employer's own bar: it leads to the Conspect block.
  await expect(
    page.getByRole('link', { name: 'Conspect · NOV 2023 – NOW · Java Consultant' }),
  ).toHaveAttribute('href', '#conspect');
  await expect(timeline.locator('.timeline__employer-note')).toHaveText(
    'Conspect — IT consultancy in agile software development and data analytics.',
  );

  // Oldest first, each linking to its detail block; the hatched sabbatical has no visible label.
  const bars = timeline.locator('.timeline__bar');
  await expect(bars).toHaveCount(4);
  expect(await bars.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual([
    '#linkpizza',
    '#dji',
    '#sabbatical',
    '#optiecon',
  ]);
  const labels = timeline.locator('.timeline__label:visible');
  expect(await labels.evaluateAll((ls) => ls.map((l) => (l as HTMLElement).innerText))).toEqual([
    'LINKPIZZA · FULL-STACK JAVA DEVELOPER',
    'DJI · FULL-STACK JAVA ENGINEER',
    'OPTIECON →',
  ]);
  await expect(page.getByRole('link', { name: 'Sabbatical · JAN 2026 – MAY 2026' })).toHaveCount(1);
  await expect(timeline.locator('.timeline__entry--break .timeline__segment')).toBeVisible();

  await expect(timeline.locator('.timeline__duration')).toHaveText(['2 Y 8 M', '2 Y 0 M']);
  await expect(timeline.locator('.timeline__legend span')).toHaveText([
    'HATCHED: SABBATICAL',
    'MUAY THAI · SURFING',
  ]);
  await expectNoAxeViolations(page);
});

test('bars are drawn to scale along the ruler', async ({ page }) => {
  test.skip(phone(page), PHONE);
  await page.goto('/experience');
  await settleAnimations(page);
  const width = page.viewportSize()?.width ?? 0;
  const horizontal = width >= 1024;
  const box = async (selector: string) => {
    const b = await page.locator(selector).first().boundingBox();
    if (!b) throw new Error(`${selector} is not rendered`);
    return b;
  };
  const ruler = await box('.timeline__ruler');
  const linkpizza = await box('.timeline__entry--fill-1 .timeline__segment');
  const dji = await box('.timeline__entry--fill-2 .timeline__segment');
  const length = (b: { width: number; height: number }) => (horizontal ? b.width : b.height);
  const along = (b: { x: number; y: number }) => (horizontal ? b.x - ruler.x : b.y - ruler.y);

  // Vertical below desktop: bars become segments taller than they are wide.
  expect(linkpizza.height > linkpizza.width).toBe(!horizontal);
  // 32 months against 24 (Feb 2021 – Oct 2023, Jan 2024 – Jan 2026), from month starts.
  expect(length(linkpizza) / length(dji)).toBeCloseTo(32 / 24, 1);
  const month = length(dji) / 24;
  expect(along(linkpizza) / month).toBeCloseTo(1, 0);
  expect(along(dji) / month).toBeCloseTo(36, 0);
});

test('a bar leads to its detail block', async ({ page }) => {
  test.skip(phone(page), PHONE);
  await page.goto('/experience');
  await page
    .getByRole('link', { name: 'DJI · Full-Stack Java Engineer · JAN 2024 – JAN 2026' })
    .click();
  await expect(page).toHaveURL(/\/experience#dji$/);
  await expect(page.locator('#dji')).toBeInViewport();
  await expect(page.locator('#dji h3')).toHaveText('DJI — Full-Stack Java Engineer');
});

test('the Dutch sheet draws the same timeline', async ({ page }) => {
  test.skip(phone(page), PHONE);
  const { dates } = ui('nl');
  await page.goto('/nl/experience');
  await expect(page.locator('.timeline__bar')).toHaveCount(4);
  await expect(page.locator('.timeline__bar').first()).toHaveAttribute('href', '#linkpizza');
  await expect(
    page.getByRole('link', {
      name: `OptieCon · Full-Stack Java Engineer · ${dates.months[5]} 2026 – ${dates.now}`,
    }),
  ).toHaveAttribute('href', '#optiecon');
});

// Detail blocks (SPEC §4.2; copy.md Sheet 02; components.md ExperienceDetail): Conspect is the
// employer, its assignments nest in its block (PR-60).
const BLOCKS = [
  [
    'optiecon',
    '02.1a',
    'OptieCon — Full-Stack Java Engineer',
    'JUN 2026 — NOW',
    'INTERNAL CONSPECT PRODUCT, BETWEEN CLIENT ASSIGNMENTS',
    'ALMERE',
  ],
  [
    'dji',
    '02.1c',
    'DJI — Full-Stack Java Engineer',
    'JAN 2024 — JAN 2026',
    'CLIENT ASSIGNMENT (SECONDMENT)',
    'VEENHUIZEN',
  ],
] as const;

test('Conspect is the employer; its assignments nest in its block, newest first', async ({
  page,
}) => {
  await page.goto('/experience');
  const top = page.locator('.experience-details > article');
  expect(await top.evaluateAll((as) => as.map((a) => a.id))).toEqual(['conspect', 'linkpizza']);

  // The employer heading is the visible h2; the assignments are h3s under it.
  const conspect = page.locator('#conspect');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Java Consultant — Conspect' }),
  ).toBeVisible();
  await expect(conspect.locator('> .experience-detail__meta > span')).toHaveText(
    ['02.1', 'NOV 2023 — NOW', 'CONSPECT · ALMERE'],
    { useInnerText: true },
  );
  await expect(conspect.locator('> .experience-detail__body > p').first()).toHaveText(
    'IT consultancy in agile software development and data analytics.',
  );
  const nested = conspect.locator('.experience-detail__assignments > article');
  expect(await nested.evaluateAll((as) => as.map((a) => a.id))).toEqual([
    'optiecon',
    'sabbatical',
    'dji',
  ]);

  for (const [id, number, title, dates, engagement, place] of BLOCKS) {
    const block = page.locator(`#${id}`);
    await expect(block.getByRole('heading', { level: 3 })).toHaveText(title);
    await expect(block.locator('.experience-detail__meta > span')).toHaveText(
      [number, dates, engagement, place],
      { useInnerText: true },
    );
  }
  // DJI reads as a client assignment, not an employer.
  await expect(page.locator('#dji .experience-detail__engagement')).toBeVisible();
  await expect(page.locator('#dji')).not.toContainText('CONSPECT · VEENHUIZEN', {
    useInnerText: true,
  });

  await expect(page.locator('#linkpizza h2')).toHaveText('LinkPizza — Full-Stack Java Developer');
  await expect(page.locator('#linkpizza .experience-detail__meta > span')).toHaveText(
    ['02.2', 'FEB 2021 — OCT 2023', 'LINKPIZZA · AMSTERDAM'],
    { useInnerText: true },
  );

  await expect(page.locator('#dji .revision-note')).toHaveText(
    'REV. NOTE △ The only developer on a new application inside a running system — from first design to knowledge sessions and a thorough handover.',
  );
  await expect(page.locator('.revision-note')).toHaveCount(1);
  await expect(page.locator('#optiecon .experience-detail__stack')).toHaveText(
    'Java 21 · Spring Boot 3.5 · Spring Security · Microsoft Entra ID · Angular 20 · PostgreSQL · Docker',
  );
  await expect(page.locator('#dji li')).toHaveCount(3);

  const sabbatical = page.locator('#sabbatical');
  await expect(sabbatical.locator('h3')).toHaveText('Sabbatical');
  await expect(sabbatical).toContainText('02.1b');
  await expect(sabbatical).toContainText('JAN 2026 — MAY 2026');
  await expect(sabbatical).toContainText('A Muay Thai camp, backpacking and surfing.');
  await expectNoAxeViolations(page);
});

test('the Dutch sheet names Conspect as employer and DJI a secondment', async ({ page }) => {
  await page.goto('/nl/experience');
  await expect(page.locator('#conspect h2')).toHaveText('Java Consultant — Conspect');
  await expect(page.locator('#dji .experience-detail__engagement')).toHaveText(
    'Klantopdracht (gedetacheerd bij DJI)',
  );
  await expect(page.locator('#optiecon .experience-detail__engagement')).toContainText(
    'tussen klantopdrachten',
  );
});

test('a detail block is two columns on desktop and one on phone', async ({ page }) => {
  await page.goto('/experience');
  const meta = await page.locator('#dji .experience-detail__meta').boundingBox();
  const body = await page.locator('#dji .experience-detail__body').boundingBox();
  if (!meta || !body) throw new Error('detail block not rendered');
  const phone = (page.viewportSize()?.width ?? 0) < 768;
  expect(body.y >= meta.y + meta.height).toBe(phone);
});
