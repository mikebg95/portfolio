import { mkdirSync } from 'node:fs';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { THEMES, THEME_STORAGE_KEY } from '../../src/theme';
import { ROUTES } from './helpers/routes';
import { settleAnimations } from './helpers/motion';

// Every page on a phone (PR-62e): Projects, Certifications and the project details in the card
// language of the phone drawings (design/screens/*-390) — full-width cards closed off by ruled
// title-block strips — every target 44 px or more, no sideways scroll at 320 px, and a full-page
// screenshot of every page in both themes in `.e2e/phone-pages/` to compare by eye.
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone layout');
});

const SHOTS = '.e2e/phone-pages';
mkdirSync(SHOTS, { recursive: true });

// The assembly's plates and balloons are drawn to scale; each one's part is also the parts list's
// 44 px button (WCAG 2.5.8's equivalent-control exception), so the drawing keeps its proportions.
const SMALL_ON_PURPOSE = '.assembly *';

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
};

/** Every visible link and button smaller than 44 × 44 px, as "text w×h". */
function smallTargets(page: Page) {
  return page.evaluate((exempt) => {
    const found: string[] = [];
    for (const el of document.querySelectorAll('a[href], button, summary, [tabindex="0"]')) {
      if (el.closest('.sr-only, [hidden], dialog:not([open])') || el.matches(exempt)) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.width < 44 || rect.height < 44) {
        const name = (el.textContent ?? '').trim().slice(0, 32);
        found.push(`${name} ${Math.round(rect.width)}×${Math.round(rect.height)}`);
      }
    }
    return found;
  }, SMALL_ON_PURPOSE);
}

for (const { path } of ROUTES) {
  test(`${path}: 44 px targets and no sideways scroll at 320 px; drawn in both themes`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await settleAnimations(page);
    expect(await smallTargets(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );

    // Reduced motion: the full-page capture shows everything, not what a scroll has revealed.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const name = path === '/' ? 'en' : path.slice(1).replaceAll('/', '-');
    for (const theme of THEMES) {
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key!, value!),
        [THEME_STORAGE_KEY, theme],
      );
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.screenshot({
        path: `${SHOTS}/${name}-${theme}-${testInfo.project.name}.png`,
        fullPage: true,
      });
    }
  });
}

test('project cards open on a ruled title strip', async ({ page }) => {
  await page.goto('/projects');
  for (const card of await page.locator('.project-card').all()) {
    const head = card.locator('.project-card__head');
    await expect(head).toHaveCSS('border-bottom-width', '1px');
    const [c, h] = [await box(card), await box(head)];
    // The strip spans the card inside its 1.5 px border.
    expect(h.width).toBeGreaterThanOrEqual(c.width - 4);
  }
});

test('certification cards: a strip over the full-width name, the stamp in a ruled foot', async ({
  page,
}) => {
  await page.goto('/certifications');
  await settleAnimations(page);
  for (const id of ['spring', 'psm', 'oca', 'ckad']) {
    const card = page.locator(`#${id}`);
    const c = await box(card);
    const code = await box(card.locator('.cert-card__code'));
    const issuer = await box(card.locator('.cert-card__issuer'));
    const name = await box(card.locator('h2'));
    const chips = await box(card.locator('.chip-list'));
    const stamp = await box(card.locator('.stamp'));

    // Code and issuer share the top strip, ruled off below it.
    expect(Math.abs(code.y - issuer.y)).toBeLessThan(2);
    expect(code.y - c.y).toBeLessThan(4);
    await expect(card.locator('.cert-card__issuer')).toHaveCSS('border-bottom-width', '1px');
    // The name takes the card's width: nothing floats beside it.
    expect(name.y).toBeGreaterThanOrEqual(code.y + code.height);
    expect(name.width).toBeGreaterThanOrEqual(c.width - 48);
    // The stamp sits in the foot, below the chips, at the card's right (its box is turned, so
    // measure its centre: the 96 px ring clears the chips).
    expect(stamp.y + stamp.height / 2 - 48).toBeGreaterThanOrEqual(chips.y + chips.height);
    expect(c.x + c.width - (stamp.x + stamp.width)).toBeLessThan(32);
    const verify = card.locator('.cert-card__verify');
    if (await verify.count()) {
      const v = await box(verify);
      expect(v.y).toBeGreaterThanOrEqual(chips.y + chips.height);
      expect(v.x + v.width).toBeLessThanOrEqual(stamp.x);
    }
  }
});

test('a project detail: FIG. 1 captioned on a strip, the pager two full-width cards', async ({
  page,
}) => {
  await page.goto('/projects/jamigos');
  const figure = page.locator('[data-figure="1"]');
  const caption = figure.locator('.figure__label');
  await expect(caption).toHaveCSS('border-bottom-width', '1px');
  expect((await box(caption)).width).toBeGreaterThanOrEqual((await box(figure)).width - 4);

  const panel = await box(page.locator('.detail-pager'));
  const previous = await box(page.locator('[data-pager="previous"]'));
  const next = await box(page.locator('[data-pager="next"]'));
  for (const card of [previous, next]) expect(card.width).toBeGreaterThan(panel.width - 64);
  expect(next.y).toBeGreaterThanOrEqual(previous.y + previous.height);
  await expect(page.locator('.detail-pager__direction').first()).toHaveCSS(
    'border-bottom-width',
    '1px',
  );
});
