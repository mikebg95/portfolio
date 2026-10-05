import { mkdirSync } from 'node:fs';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { THEME_STORAGE_KEY } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';
import { ui } from './helpers/content';
import { settleAnimations } from './helpers/motion';

// Sheet 02 on a phone (PR-62c, design/screens/experience-default-light-390): a year ruler to scale
// down the left, the Conspect bracket beside its cards, the entries as cards whose bullets and
// stack fold behind READ MORE — tap the card to open it in place; without JS all of it shows.
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone layout');
});

const SHOTS = '.e2e/experience-phone';
mkdirSync(SHOTS, { recursive: true });

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
};

const toggle = (page: Page, id: string) =>
  page.locator(`#${id} > .experience-detail__body > .experience-detail__toggle`);

test('years run down a ruler to scale, the cards beside it; the bars give way', async ({
  page,
}) => {
  await page.goto('/experience/');
  await settleAnimations(page);
  await expect(page.locator('.timeline')).toBeHidden();

  const marks = page.locator('.experience-ruler li');
  await expect(marks).toHaveText([
    ui('en').dates.now,
    '2026',
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
  ]);
  const tops = await Promise.all((await marks.all()).slice(1).map(async (m) => (await box(m)).y));
  const steps = tops.slice(1).map((y, i) => y - tops[i]!);
  for (const step of steps) expect(step).toBeCloseTo(steps[0]!, 0);
  // At least 14 px a month.
  expect(steps[0]!).toBeGreaterThanOrEqual(12 * 14 - 1);

  // Every card sits right of the ruler and the bracket, one under the other.
  const ruler = await box(page.locator('.experience-ruler'));
  const bracket = await box(page.locator('#conspect .experience-detail__bracket'));
  expect(bracket.x).toBeGreaterThanOrEqual(ruler.x + ruler.width);
  let previous = 0;
  for (const id of ['optiecon', 'sabbatical', 'dji', 'linkpizza']) {
    const card = await box(page.locator(`#${id}`));
    expect(card.x).toBeGreaterThanOrEqual(bracket.x + bracket.width);
    expect(card.y).toBeGreaterThan(previous);
    previous = card.y + card.height;
  }
  await expectNoAxeViolations(page);
});

test('the Conspect bracket spans the employer card and its assignments, named along it', async ({
  page,
}) => {
  await page.goto('/experience/');
  await settleAnimations(page);
  const conspect = await box(page.locator('#conspect'));
  const bracket = await box(page.locator('#conspect .experience-detail__bracket'));
  expect(Math.abs(bracket.y - conspect.y)).toBeLessThan(1);
  expect(Math.abs(bracket.y + bracket.height - (conspect.y + conspect.height))).toBeLessThan(1);
  const dji = await box(page.locator('#dji'));
  expect(bracket.y + bracket.height).toBeGreaterThanOrEqual(dji.y + dji.height - 1);
  const linkpizza = await box(page.locator('#linkpizza'));
  expect(bracket.y + bracket.height).toBeLessThan(linkpizza.y);
  await expect(page.locator('#conspect .experience-detail__bracket-label')).toHaveText(
    'CONSPECT · NOV 2023 – NOW',
    { useInnerText: true },
  );
  // The employer is the dark header card.
  await expect(page.locator('#conspect > .experience-detail__body')).not.toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
});

test('tapping a card opens its detail in place, and again closes it', async ({ page }) => {
  const { more, less } = ui('en').experience.toggle;
  await page.goto('/experience/');
  await settleAnimations(page);
  const button = toggle(page, 'dji');
  const bullets = page.locator('#dji .experience-detail__bullets');
  const stack = page.locator('#dji .experience-detail__stack');

  // Folded: the context and the revision note show, bullets and stack wait behind READ MORE.
  await expect(page.locator('#dji .experience-detail__context')).toBeVisible();
  await expect(page.locator('#dji .revision-note')).toBeVisible();
  await expect(bullets).toBeHidden();
  await expect(stack).toBeHidden();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAttribute('aria-controls', 'dji-bullets dji-stack');
  await expect(button).toHaveAccessibleName(`${more} · DJI — Full-Stack Java Engineer`);
  expect((await box(button)).height).toBeGreaterThanOrEqual(44);

  // A tap on the card's text (not the button's words) opens it in place: the toggle spans the card.
  const before = await box(page.locator('#dji'));
  await page.locator('#dji .experience-detail__context').scrollIntoViewIfNeeded();
  const context = await box(page.locator('#dji .experience-detail__context'));
  await page.touchscreen.tap(context.x + context.width / 2, context.y + context.height / 2);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(bullets).toBeVisible();
  await expect(stack).toBeVisible();
  await expect(button).toHaveAccessibleName(`${less} · DJI — Full-Stack Java Engineer`);
  // Its rows ink in as they appear and end fully drawn.
  await settleAnimations(page);
  await expect(bullets.locator('li').first()).toHaveCSS('opacity', '1');
  const after = await box(page.locator('#dji'));
  expect(after.height).toBeGreaterThan(before.height);
  // Its neighbours stay folded.
  await expect(page.locator('#optiecon .experience-detail__bullets')).toBeHidden();

  await button.tap();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(bullets).toBeHidden();

  // Keyboard: the toggle is a button.
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(bullets).toBeVisible();
  await expectNoAxeViolations(page);
});

test('a link to a card arrives with it open', async ({ page }) => {
  await page.goto('/experience/#optiecon');
  await expect(toggle(page, 'optiecon')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#optiecon .experience-detail__bullets')).toBeVisible();
  await expect(page.locator('#dji .experience-detail__bullets')).toBeHidden();
});

test('the Dutch cards read their own toggle and ruler', async ({ page }) => {
  const { dates, experience } = ui('nl');
  await page.goto('/nl/experience/');
  await expect(page.locator('.experience-ruler li').first()).toHaveText(dates.now);
  await expect(toggle(page, 'linkpizza')).toContainText(experience.toggle.more);
  await toggle(page, 'linkpizza').tap();
  await expect(toggle(page, 'linkpizza')).toContainText(experience.toggle.less);
});

test('no horizontal scroll at 320 px, open or folded; both themes drawn', async ({
  page,
}, testInfo) => {
  for (const theme of ['paper', 'blueprint'] as const) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [THEME_STORAGE_KEY, theme],
    );
    await page.goto('/experience/');
    await settleAnimations(page);
    for (const id of ['optiecon', 'dji', 'linkpizza']) await toggle(page, id).tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    // Reduced motion: the full-page capture shows every card, not the ones a scroll has revealed.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experience/');
    await settleAnimations(page);
    await page.screenshot({
      path: `${SHOTS}/experience-${theme}-390-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('an opened card shows its detail at once', async ({ page }) => {
    await page.goto('/experience/');
    await toggle(page, 'optiecon').tap();
    await expect(page.locator('#optiecon .experience-detail__bullets li').first()).toHaveCSS(
      'opacity',
      '1',
    );
  });
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('every card shows its full detail and no toggle', async ({ page }) => {
    await page.goto('/experience/');
    await expect(page.locator('.experience-detail__toggle')).toHaveCount(3);
    await expect(page.locator('.experience-detail__toggle').first()).toBeHidden();
    await expect(page.locator('#dji .experience-detail__bullets')).toBeVisible();
    await expect(page.locator('#linkpizza .experience-detail__stack')).toBeVisible();
    await expect(page.locator('.experience-ruler')).toBeVisible();
  });
});
