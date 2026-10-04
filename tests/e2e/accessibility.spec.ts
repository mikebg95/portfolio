import { expect, test, type Page } from '@playwright/test';

import { THEME_STORAGE_KEY } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';
import { settleAnimations } from './helpers/motion';
import { ROUTES } from './helpers/routes';

// SPEC §7 (WCAG 2.2 AA): axe, one h1, keyboard reach and visible focus on every page.
const NOT_FOUND = [
  { path: '/no-such-sheet', lang: 'en' },
  { path: '/nl/404', lang: 'nl' },
];
const EVERY_PAGE = [...ROUTES, ...NOT_FOUND];

for (const { path } of EVERY_PAGE) {
  test(`${path}: one h1 and no axe violations in paper and in blueprint`, async ({ page }) => {
    for (const theme of ['paper', 'blueprint'] as const) {
      await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
        THEME_STORAGE_KEY,
        theme,
      ] as const);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('h1')).toHaveCount(1);
      await expectNoAxeViolations(page);
    }
  });
}

/** What a stop is called in a failure message: its index in DOM order, tag and name. */
type Stop = string;

/**
 * Every element the keyboard should reach, in DOM order (no positive tabindex exists, so that is
 * the tab order): rendered, not inert, tabIndex ≥ 0. Each is marked with its index.
 */
function tabbableStops(page: Page): Promise<{ stops: Stop[]; positive: Stop[] }> {
  return page.evaluate(() => {
    const describe = (el: HTMLElement, i: number) =>
      `${i}:${el.tagName.toLowerCase()} ${(el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}`;
    const candidates = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]',
    );
    const stops = [...candidates].filter(
      (el) =>
        el.tabIndex >= 0 &&
        !(el as HTMLButtonElement).disabled &&
        !el.closest('[inert]') &&
        el.checkVisibility({ visibilityProperty: true }),
    );
    stops.forEach((el, i) => (el.dataset.a11yStop = describe(el, i)));
    return {
      stops: stops.map((el) => el.dataset.a11yStop ?? ''),
      positive: [...candidates].filter((el) => el.tabIndex > 0).map((el) => describe(el, -1)),
    };
  });
}

/** The focused element after a Tab: its stop name, and whether its focus ring is drawn. */
function focused(page: Page): Promise<{ stop: Stop; ring: boolean } | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    // The ring may sit on a descendant (the timeline rings its bar segment, not the link box).
    const ringed = [el, ...el.querySelectorAll('*')].some((node) => {
      const style = getComputedStyle(node);
      return (
        style.outlineStyle !== 'none' &&
        parseFloat(style.outlineWidth) >= 2 &&
        style.outlineColor !== 'rgba(0, 0, 0, 0)'
      );
    });
    return {
      stop: el.dataset.a11yStop ?? `unexpected ${el.tagName.toLowerCase()}.${el.className}`,
      ring: el.matches(':focus-visible') && ringed,
    };
  });
}

test.describe('keyboard', () => {
  // WebKit tabs to links only with the OS "keyboard navigation" setting on.
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit does not tab to links');

  for (const { path } of EVERY_PAGE) {
    test(`${path}: Tab reaches every control in reading order, each visibly focused`, async ({
      page,
    }) => {
      await page.goto(path);
      await settleAnimations(page);
      const { stops, positive } = await tabbableStops(page);
      expect(positive, 'positive tabindex reorders the page').toEqual([]);
      expect(stops[0], 'the skip link comes first').toMatch(/^0:a /);

      const walked: Stop[] = [];
      const unringed: Stop[] = [];
      for (let i = 0; i < stops.length + 3; i++) {
        await page.keyboard.press('Tab');
        const now = await focused(page);
        if (!now || now.stop === walked[0]) break;
        walked.push(now.stop);
        if (!now.ring) unringed.push(now.stop);
      }
      expect(walked).toEqual(stops);
      expect(unringed, 'focused without a visible 2 px ring').toEqual([]);
    });
  }

  test('phone: the sheet index opens, traps focus and closes by keyboard alone', async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'desktop and tablet show the tab row');
    await page.goto('/nl/education');
    const toggle = page.locator('.sheet-index button[aria-controls]');
    const items = page.locator('#sheet-index-panel').locator('a[href], button');

    // Tab to the toggle like a visitor would, rather than focusing it from script.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      if (await toggle.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const count = await items.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(items.nth(i)).toBeFocused();
    }
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(items.last()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});
