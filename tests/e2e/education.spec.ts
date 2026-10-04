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
  test(`the assembly scales to fit ${width} px without scrolling sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/education');
    const panel = await page.locator('.education').boundingBox();
    const right = await page
      .locator('.assembly__drawing, .plate, .assembly__callout')
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
