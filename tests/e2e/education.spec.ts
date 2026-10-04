import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

// Sheet 05 exploded assembly (SPEC §4.6; copy.md Sheet 05; drawing
// education-default-light-1440): five plates top to bottom 5 → 1, a balloon each, part 3 selected.
const BALLOONS = [
  'CKAD — to be fitted',
  'Harvard CS50',
  'Minor Programming',
  'BSc Political Science',
  'VWO — base',
];
const NAMES = BALLOONS.map((b, i) => `Part ${5 - i}: ${b}`);

test('the sheet shows its label, heading and intro', async ({ page }) => {
  await page.goto('/education');
  await expect(page.locator('.education__head .sheet-label')).toHaveText(
    'SHEET 05 — ASSEMBLY, EXPLODED VIEW',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'HOW THIS ENGINEER WAS ASSEMBLED',
  );
  await expect(page.locator('.education__intro')).toHaveText(
    'Not a straight line from a computer-science degree. Each layer below carries load in the final build — select a part to open its detail.',
  );
});

test('the assembly has five parts: a plate and a balloon button each, part 3 pressed', async ({
  page,
}) => {
  await page.goto('/education');
  const assembly = page.getByRole('group', { name: 'Exploded assembly of the education parts' });
  const plates = assembly.locator('.plate');
  const balloons = assembly.locator('.balloon__mark');
  await expect(plates).toHaveCount(5);
  await expect(balloons).toHaveCount(5);
  await expect(assembly.locator('.assembly__label')).toHaveText(BALLOONS);
  await expect(balloons).toHaveText(['5', '4', '3', '2', '1']);

  for (const [i, name] of NAMES.entries()) {
    for (const button of [plates.nth(i), balloons.nth(i)]) {
      await expect(button).toHaveRole('button');
      await expect(button).toHaveAccessibleName(name);
      await expect(button).toHaveAttribute('aria-pressed', i === 2 ? 'true' : 'false');
    }
  }
  await expect(assembly.getByRole('button', { name: NAMES[2], pressed: true })).toHaveCount(2);
  await expectNoAxeViolations(page);
});

test('plates sit on one axis, top to bottom, never overlapping the next one', async ({ page }) => {
  await page.goto('/education');
  const boxes = await page
    .locator('.plate')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
  const centres = new Set(boxes.map((b) => Math.round(b.x + b.width / 2)));
  expect(centres.size).toBe(1);
  for (const [i, box] of boxes.entries()) {
    const next = boxes[i + 1];
    if (next) expect(next.top).toBeGreaterThanOrEqual(box.bottom);
  }
  // CS50's plate is the small one.
  expect(boxes[1]!.width).toBeLessThan(boxes[0]!.width * 0.7);
});

for (const width of [320, 390, 768]) {
  test(`the assembly scales and the sheet fits ${width} px without scrolling sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/education');
    const panel = await page.locator('.education').boundingBox();
    const right = await page
      .locator('.assembly__drawing, .plate, .assembly__callout, .detail-panel, .parts-list')
      .evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().right)));
    expect(right).toBeLessThanOrEqual(panel!.x + panel!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('/nl/education renders the five parts too', async ({ page }) => {
  await page.goto('/nl/education');
  await expect(page.locator('.assembly .plate')).toHaveCount(5);
  await expect(page.locator('.assembly .balloon__mark')).toHaveCount(5);
});

test('the detail panel shows part 3 by default', async ({ page }) => {
  await page.goto('/education');
  const panel = page.locator('.detail-panel:visible');
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveId('part-3');
  await expect(panel.locator('.detail-panel__label')).toHaveText('DETAIL 3 · SCALE 2:1');
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Minor Programming');
  await expect(panel.locator('.detail-panel__meta')).toHaveText(
    'University of Amsterdam · 2018 · 30 EC',
  );
  await expect(panel.locator('.detail-panel__row')).toHaveText([
    '3.1CS50 — C, memory, algorithms, Python, SQL6 EC',
    '3.2Android app development in Java12 EC',
    '3.3Programming theory — heuristics12 EC',
  ]);
  await expect(panel.locator('.detail-panel__note')).toHaveCount(0);
});

test('the parts list has five rows, 5 → 1, part 3 selected and CKAD pending', async ({ page }) => {
  await page.goto('/education');
  const table = page.getByRole('table', { name: 'Parts list' });
  await expect(table.getByRole('columnheader')).toHaveText(['ITEM', 'PART', 'SUPPLIER', 'YEAR']);
  const rows = table.locator('tbody tr');
  await expect(rows).toHaveText([
    '5CKAD (in progress)Linux Foundation—',
    '4CS50 Intro to CSHarvard / UvA2018',
    '3Minor ProgrammingUvA2018',
    '2BSc Political ScienceUvA2016–19',
    '1VWOAmsterdams Lyceum2007–13',
  ]);
  const buttons = table.getByRole('button');
  await expect(buttons).toHaveCount(5);
  await expect(table.getByRole('button', { pressed: false })).toHaveCount(4);
  await expect(table.getByRole('button', { pressed: true })).toHaveText('Minor Programming');
  await expect(rows.nth(2)).toHaveClass(/parts-list__row--selected/);
  await expect(rows.nth(0)).toHaveClass(/parts-list__row--pending/);
  await expectNoAxeViolations(page);
});

test('the panel and parts list sit beside the assembly on desktop, below it otherwise', async ({
  page,
}) => {
  await page.goto('/education');
  const width = page.viewportSize()?.width ?? 0;
  const assembly = (await page.locator('.assembly').boundingBox())!;
  const panel = (await page.locator('.detail-panel:visible').boundingBox())!;
  const table = (await page.locator('.parts-list').boundingBox())!;
  if (width >= 1024) {
    expect(panel.x).toBeGreaterThanOrEqual(assembly.x + assembly.width);
  } else {
    expect(panel.y).toBeGreaterThanOrEqual(assembly.y + assembly.height);
  }
  expect(table.y).toBeGreaterThanOrEqual(panel.y + panel.height);
});
