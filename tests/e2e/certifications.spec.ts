import { expect, test, type Page } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { certification } from './helpers/content';

// Sheet 04 inspection record (SPEC §4.5; copy.md Sheet 04; drawing
// certifications-default-light-1440): four certificate cards, three verified with a link to the
// issuer's record, CKAD pending with none.
const IDS = ['spring', 'psm', 'oca', 'ckad'];
const VERIFY = [
  ['VERIFY ON CREDLY', 'https://www.credly.com/badges/9136d66e-6e50-49ca-bcb6-794f9d291ecf'],
  ['VERIFY ON CREDLY', 'https://www.credly.com/badges/7a034eee-0a8c-44f4-97ca-47a0debf8019'],
  [
    'VERIFY ON ORACLE',
    'https://brm-certview.oracle.com/ords/certview/ecertificate?ssn=OC4839429&trackId=OCAJSE8&key=a4669f3d2385dfeeba797cb811e7aa1124657ed0',
  ],
];
const STAMPS = [
  'VERIFIED2025BROADCOM',
  'VERIFIED2025SCRUM.ORG',
  'VERIFIED2024ORACLE',
  'PENDINGCKADIN PROGRESS',
];

test('the sheet shows its label, heading and intro', async ({ page }) => {
  await page.goto('/certifications/');
  await expect(page.locator('.record__head .sheet-label')).toHaveText(
    'SHEET 04 — CERTIFICATIONS · INSPECTION RECORD',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('INSPECTED AND SIGNED OFF');
  await expect(page.locator('.record__intro')).toHaveText(
    "Every stamp links to the issuer's own record, so you can check it yourself.",
  );
});

for (const [prefix, lang] of [
  ['', 'en'],
  ['/nl', 'nl'],
] as const) {
  test(`${prefix}/certifications: four cards with ids, stamps and three verify links`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/certifications`);
    const cards = page.locator('.cert-card');
    await expect(cards).toHaveCount(4);
    expect(await cards.evaluateAll((els) => els.map((el) => el.id))).toEqual(IDS);
    // EN verbatim (copy.md); NL as its content files hold it.
    const stamps = IDS.map((id) => certification(lang, id).stamp.join(''));
    if (lang === 'en') expect(stamps).toEqual(STAMPS);
    await expect(cards.locator('.stamp')).toHaveText(stamps);
    await expect(cards.locator('.stamp--pending')).toHaveCount(1);
    await expect(page.locator('#ckad .stamp--pending')).toBeVisible();

    const links = cards.locator('a');
    await expect(links).toHaveCount(3);
    for (const [i, [enLabel, href]] of VERIFY.entries()) {
      const label = lang === 'en' ? enLabel! : certification(lang, IDS[i]!).verifyLabel!;
      const link = links.nth(i);
      await expect(link).toHaveAccessibleName(label);
      await expect(link).toHaveText(`${label} ↗`);
      await expect(link).toHaveAttribute('href', href!);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await expect(page.locator('#ckad a')).toHaveCount(0);
  });
}

test('each card shows code, name, issuer · date, text and chips', async ({ page }) => {
  await page.goto('/certifications/');
  const spring = page.locator('#spring');
  await expect(spring.locator('.cert-card__code')).toHaveText('C-01');
  await expect(spring.getByRole('heading', { level: 2 })).toHaveText(
    'Spring Certified Professional',
  );
  await expect(spring.locator('.cert-card__issuer')).toHaveText('VMware by Broadcom · AUG 2025');
  await expect(spring.locator('.chip')).toHaveCount(7);
  await expect(page.locator('#ckad .cert-card__issuer')).toHaveText(
    'The Linux Foundation · in progress',
  );
  await expect(page.locator('#ckad .chip')).toHaveText([
    'Pods & deployments',
    'Config & secrets',
    'Probes',
    'Services',
  ]);
  await expectNoAxeViolations(page);
});

/** Words of `selector`'s text that the browser broke across two lines. */
async function brokenWords(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((els) =>
    els.flatMap((el) => {
      const node = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const broken: string[] = [];
      for (let n = node.nextNode(); n; n = node.nextNode()) {
        for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
          if (tops.size > 1) broken.push(m[0]);
        }
      }
      return broken;
    }),
  );
}

for (const prefix of ['', '/nl']) {
  for (const width of [320, 390]) {
    test(`${prefix}/certifications: no heading breaks a word at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/certifications`);
      expect(await brokenWords(page, 'h1, .cert-card h2')).toEqual([]);
    });
  }

  test(`${prefix}/certifications: every stamp line fits inside its ring`, async ({ page }) => {
    await page.goto(`${prefix}/certifications`);
    // The 96 px stamp's inner ring leaves about 80 px for the top and bottom lines.
    const widths = await page
      .locator('.stamp > span, .stamp > strong')
      .evaluateAll((els) => els.map((el) => [el.textContent, (el as HTMLElement).offsetWidth]));
    for (const [text, width] of widths) expect(width, `${text}`).toBeLessThanOrEqual(80);
  });
}

test('cards lay out 2 × 2 from tablet up and in 1 column on phone', async ({ page }) => {
  await page.goto('/certifications/');
  const width = page.viewportSize()?.width ?? 0;
  const columns = async () =>
    new Set(
      await page
        .locator('.cert-card')
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().x))),
    ).size;
  expect(await columns()).toBe(width >= 768 ? 2 : 1);

  // Every card stays inside the sheet panel, and no heading breaks a word.
  const panel = await page.locator('.record').boundingBox();
  for (const box of await page
    .locator('.cert-card')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right))) {
    expect(box).toBeLessThanOrEqual(panel!.x + panel!.width);
  }
  expect(
    await page
      .locator('.record__line')
      .first()
      .evaluate((el) => el.getClientRects().length),
  ).toBe(1);

  // The stamp never covers the name or the issuer line: no line of their text reaches into its
  // circle (whose centre is the same however it is rotated).
  for (const id of IDS) {
    const stamp = await page.locator(`#${id} .stamp`).boundingBox();
    const circle = {
      x: stamp!.x + stamp!.width / 2,
      y: stamp!.y + stamp!.height / 2,
      r: 48,
    };
    for (const part of ['h2', '.cert-card__issuer']) {
      const lines = await page.locator(`#${id} ${part}`).evaluate((el) => {
        const range = document.createRange();
        // The heading's text sits in its fit span, whose own box would count as a line.
        range.selectNodeContents(el.querySelector('.display-heading__fit') ?? el);
        return [...range.getClientRects()].map((r) => ({
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        }));
      });
      for (const line of lines) {
        const beside = line.bottom > circle.y - circle.r && line.top < circle.y + circle.r;
        if (beside) expect(line.right, `${id} ${part}`).toBeLessThanOrEqual(circle.x - circle.r);
      }
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
});
