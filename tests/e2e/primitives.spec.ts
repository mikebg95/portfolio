import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { PRIMITIVES_PATH } from '../../src/config';
import { THEMES, type Theme } from '../../src/theme';
import { expectNoAxeViolations } from './helpers/axe';

// The drawing primitives specimen page (PR-11): every variant, once per theme. The screenshot is
// an artifact for a human to look at, never compared against the design PNGs.
const tokens = JSON.parse(
  readFileSync(new URL('../../design/tokens.json', import.meta.url), 'utf8'),
) as { color: Record<string, { light: string; dark: string }> };

function rgb(token: string, theme: Theme): string {
  const hex = tokens.color[token]?.[theme === 'paper' ? 'light' : 'dark'] ?? '';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

const SPECIMENS = [
  'sheet-label',
  'display-heading',
  'button',
  'link',
  'dimension-line',
  'balloon',
  'revision-note',
  'spec-row',
  'figure',
  'project-card',
  'stamp',
  'chip',
];

test.beforeEach(async ({ page }) => {
  await page.goto(PRIMITIVES_PATH);
});

test('shows every primitive in both themes, each drawn in its own colours', async ({ page }) => {
  for (const theme of THEMES) {
    const column = page.locator(`[data-primitives-theme="${theme}"]`);
    await expect(column).toHaveCSS('background-color', rgb('paper', theme));
    for (const name of SPECIMENS) {
      await expect(column.locator(`[data-specimen="${name}"]`), `${theme} ${name}`).toBeVisible();
    }
    await expect(column.locator('[data-specimen="display-heading"] .display-heading')).toHaveCount(
      4,
    );
    // Borders come from tokens built on a colour: they must follow the column's theme too.
    await expect(column.locator('.box').first()).toHaveCSS('border-top-color', rgb('line', theme));
    await expect(column.locator('.figure:not(.figure--bare)')).toHaveCSS(
      'border-top-color',
      rgb('ink', theme),
    );
    await expect(column.locator('.figure--bare')).toHaveCSS('border-top-style', 'none');
    await expect(column.locator('.revision-note').first()).toHaveCSS(
      'border-top-color',
      rgb('redline', theme),
    );
    await expect(column.locator('.stamp--pending')).toHaveCSS('color', rgb('redline', theme));
  }
});

test('keeps decoration out of the accessibility tree and names what is interactive', async ({
  page,
}) => {
  const column = page.locator('[data-primitives-theme="paper"]');
  for (const dimension of await column.locator('.dimension').all()) {
    await expect(dimension).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(column.locator('span.balloon[aria-hidden="true"]')).toHaveCount(3);
  await expect(column.getByRole('link', { name: '1: Spring certified' })).toBeVisible();
  await expect(column.getByRole('button', { name: 'Part 3: Minor Programming' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const external of await column.locator('a[target="_blank"]').all()) {
    await expect(external).toHaveAttribute('rel', 'noopener');
    await expect(external.locator('[aria-hidden="true"]')).toHaveText(/↗/);
  }
  await expect(column.locator('a[target="_blank"]')).toHaveCount(2);
  await expect(column.locator('.revision-note').first()).toHaveText(
    /^REV\. NOTE △ Every project on these sheets started as a drawing:/,
  );
  await expect(column.locator('.revision-note__lead').first()).toHaveText('REV. NOTE △');
  await expectNoAxeViolations(page);
});

// PR-22: the five register cards, each one link with its own mini diagram.
const DIAGRAMS: Record<string, string[]> = {
  jamigos: [
    'VUE 3 SPA',
    'KEYCLOAK\nOIDC + PKCE',
    'SPRING BOOT API\n3 SECURITY CHAINS',
    'POSTGRESQL',
    'MONGODB',
  ],
  'subscription-tracker': ['CONTROLLER', 'SERVICE', 'DAO · SQL'],
  'recipe-book': ['OPENAPI 3.1', 'RECIPE ⟶ STEPS'],
  journal: [],
  scentify: ['4 QUESTIONS', '52 SCENTS'],
};

test('shows the five project cards, each one link with its mini diagram', async ({ page }) => {
  for (const theme of THEMES) {
    const cards = page.locator(`[data-primitives-theme="${theme}"] .project-card`);
    await expect(cards).toHaveCount(5);
    for (const [slug, boxes] of Object.entries(DIAGRAMS)) {
      const card = cards.and(page.locator(`[data-project="${slug}"]`));
      await expect(card).toHaveAttribute('href', `/projects/${slug}`);
      await expect(card.locator('.project-card__strip > div')).toHaveCount(3);
      const diagram = card.locator('.mini-diagram');
      await expect(diagram).toHaveAttribute('aria-hidden', 'true');
      const texts = await diagram
        .locator('.box')
        .evaluateAll((els) => els.map((el) => (el as HTMLElement).innerText));
      expect(texts, slug).toEqual(boxes);
    }
    const label = (slug: string) =>
      page.locator(`[data-primitives-theme="${theme}"] [data-project="${slug}"] .sheet-label`);
    await expect(label('jamigos')).toHaveText('P-01 · FLAGSHIP');
    await expect(cards.and(page.locator('[data-project="jamigos"]'))).toContainText(
      'SECURITY · CI/CD',
    );
    // "↓ generates": the glyph is drawn left of its label.
    const arrow = cards.and(page.locator('[data-project="recipe-book"]')).locator('.arrow');
    await expect(arrow).toHaveText('generates↓');
    const glyph = await arrow.locator('[aria-hidden="true"]').boundingBox();
    const word = await arrow.locator('.arrow__label').boundingBox();
    expect(glyph!.x).toBeLessThan(word!.x);
    await expect(
      cards.and(page.locator('[data-project="journal"]')).locator('.mini-diagram__hexagon'),
    ).toHaveText('DOMAIN');
    // In progress: dashed card, redline label; the others solid, line-colour label.
    const journal = cards.and(page.locator('[data-project="journal"]'));
    await expect(journal).toHaveCSS('border-top-style', 'dashed');
    await expect(label('journal')).toHaveCSS('color', rgb('redline', theme));
    await expect(cards.first()).toHaveCSS('border-top-style', 'solid');
    await expect(label('scentify')).toHaveCSS('color', rgb('line', theme));
  }
});

test('the flagship card spans two columns and a card lifts on hover and focus', async ({
  page,
}) => {
  const cards = page.locator('[data-primitives-theme="paper"] .project-card');
  const flagship = await cards.first().boundingBox();
  const other = await cards.nth(1).boundingBox();
  const wide = (page.viewportSize()?.width ?? 0) >= 768;
  expect(flagship!.width / other!.width).toBeCloseTo(wide ? 2 : 1, 0);

  await expect(cards.nth(1)).toHaveCSS('box-shadow', 'none');
  await cards.nth(1).hover();
  await expect(cards.nth(1)).toHaveCSS('box-shadow', /6px 6px 0px/);
  await page.mouse.move(0, 0);
  // After a key press, focus counts as keyboard focus (:focus-visible) — WebKit does not Tab to
  // links by default, so the card is focused directly.
  await page.keyboard.press('Tab');
  await cards.nth(2).focus();
  await expect(cards.nth(2)).toHaveCSS('box-shadow', /6px 6px 0px/);
});

test('every interactive primitive has a 44 px hit area', async ({ page }) => {
  const column = page.locator('[data-primitives-theme="paper"]');
  for (const target of await column.locator('.button').all()) {
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const balloon = column.locator('button.balloon__mark');
  const size = await balloon.evaluate((el) => {
    const hit = getComputedStyle(el, '::before');
    const { width, height } = el.getBoundingClientRect();
    return Math.min(
      width - parseFloat(hit.left) - parseFloat(hit.right),
      height - parseFloat(hit.top) - parseFloat(hit.bottom),
    );
  });
  expect(size).toBeGreaterThanOrEqual(44);
});

test('screenshot of the page for review', async ({ page }, testInfo) => {
  await page.evaluate(() => document.fonts.ready);
  await testInfo.attach('primitives', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
