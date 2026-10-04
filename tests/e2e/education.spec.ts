import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { settleAnimations } from './helpers/motion';

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

/** Opens a page once the §M5 explosion (tests/e2e/education-motion.spec.ts) has played. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await settleAnimations(page);
}

test('the sheet shows its label, heading and intro', async ({ page }) => {
  await open(page, '/education');
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
  await open(page, '/education');
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
  await open(page, '/education');
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

for (const prefix of ['', '/nl']) {
  for (const width of [320, 390, 768]) {
    test(`${prefix}/education: the assembly scales and the sheet fits ${width} px without scrolling sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, `${prefix}/education`);
      const panel = await page.locator('.education').boundingBox();
      const right = await page
        .locator('.assembly__drawing, .plate, .assembly__callout, .detail-panel, .parts-list')
        .evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().right)));
      expect(right).toBeLessThanOrEqual(panel!.x + panel!.width);
      // No balloon label spills out of its column (Dutch compounds are long).
      expect(
        await page
          .locator('.assembly__label')
          .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length),
      ).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  }
}

test('/nl/education renders the five parts too', async ({ page }) => {
  await open(page, '/nl/education');
  await expect(page.locator('.assembly .plate')).toHaveCount(5);
  await expect(page.locator('.assembly .balloon__mark')).toHaveCount(5);
});

test('the detail panel shows part 3 by default', async ({ page }) => {
  await open(page, '/education');
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
  await open(page, '/education');
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
  await open(page, '/education');
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

/** The part the sheet shows as selected: pressed controls, row, panel and hash agree on it. */
async function expectSelected(page: Page, item: number) {
  const pressed = page.locator('button[data-part][aria-pressed="true"]');
  await expect(pressed).toHaveCount(3);
  for (const el of await pressed.all()) await expect(el).toHaveAttribute('data-part', `${item}`);
  await expect(page.locator('.parts-list__row--selected')).toHaveAttribute('data-part', `${item}`);
  await expect(page.locator('.detail-panel:visible')).toHaveCount(1);
  await expect(page.locator('.detail-panel:visible')).toHaveId(`part-${item}`);
  await expect(page).toHaveURL(new RegExp(`#part-${item}$`));
}

const plate = (page: Page, item: number) => page.locator(`.plate[data-part="${item}"]`);
/** A plate's top in page coordinates, so scrolling to reach a row does not move it. */
const top = (page: Page, item: number) =>
  plate(page, item).evaluate((el) => el.getBoundingClientRect().top + scrollY);

test('clicking a plate, a balloon or a row selects that part', async ({ page }) => {
  await open(page, '/education');
  const restingTop = await top(page, 5);

  await plate(page, 5).click();
  await expectSelected(page, 5);
  await expect(page.locator('#part-5')).toContainText('CKAD (to be fitted)');
  // The chosen plate lifts 12 px and the others dim to 60 %.
  await expect.poll(async () => restingTop - (await top(page, 5))).toBeCloseTo(12, 0);
  await expect(plate(page, 1)).toHaveCSS('opacity', '0.6');
  await expect(plate(page, 5)).toHaveCSS('opacity', '1');

  await page.locator('.balloon__mark[data-part="2"]').click();
  await expectSelected(page, 2);
  await expect(page.locator('#part-2 .detail-panel__note')).toHaveText(
    'NOTE: part 2 is load-bearing.',
  );

  // Anywhere on a row, not only its part name.
  await page.locator('tr[data-part="4"] td').last().click();
  await expectSelected(page, 4);
  await expect(page.locator('#part-4 a')).toHaveAttribute(
    'href',
    'https://github.com/mikebg95/CS50-Psets',
  );
  await expectNoAxeViolations(page);
});

test('Enter and Space on a balloon, plate or row select its part', async ({ page }) => {
  await open(page, '/education');
  await page.locator('.balloon__mark[data-part="1"]').focus();
  await page.keyboard.press('Enter');
  await expectSelected(page, 1);

  await plate(page, 4).focus();
  await page.keyboard.press('Space');
  await expectSelected(page, 4);

  await page.getByRole('button', { name: 'BSc Political Science', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expectSelected(page, 2);
  await expect(page.locator('.parts-list__select[data-part="2"]')).toBeFocused();
});

test('a #part-n hash is honoured on load and on change', async ({ page }) => {
  await open(page, '/education#part-5');
  await expectSelected(page, 5);
  await page.evaluate(() => (location.hash = '#part-1'));
  await expectSelected(page, 1);
  // An unknown part leaves the default.
  await open(page, '/nl/education#part-9');
  await expect(page.locator('.detail-panel:visible')).toHaveId('part-3');
});

test('hovering a parts-list row previews the lift on its plate', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'hover is a desktop pointer');
  await open(page, '/education');
  const resting = await top(page, 1);
  await page.locator('tr[data-part="1"]').hover();
  await expect.poll(async () => resting - (await top(page, 1))).toBeCloseTo(12, 0);
  await page.mouse.move(0, 0);
  await expect.poll(() => top(page, 1)).toBeCloseTo(resting, 0);
});

test('the panel wipes in on selection, instantly under reduced motion', async ({ page }) => {
  await open(page, '/education');
  await page.locator('.balloon__mark[data-part="5"]').click();
  expect(
    await page
      .locator('#part-5')
      .evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName)),
  ).toEqual(['detail-panel-wipe']);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.balloon__mark[data-part="1"]').click();
  await expectSelected(page, 1);
  expect(await page.locator('#part-1').evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(plate(page, 1)).toHaveCSS('transition-duration', '0s');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all five details render stacked', async ({ page }) => {
    await open(page, '/education');
    await expect(page.locator('.detail-panel:visible')).toHaveCount(5);
    await expect(page.locator('.detail-panel h2')).toHaveText([
      'VWO',
      'BSc Political Science',
      'Minor Programming',
      'Harvard CS50',
      'CKAD (to be fitted)',
    ]);
  });
});
