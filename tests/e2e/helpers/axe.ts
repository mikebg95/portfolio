import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import { settleAnimations } from './motion';

/** WCAG 2.2 AA, including every earlier A/AA level it builds on. */
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Audits the page once its animations have ended: a half-faded frame is no contrast to judge. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  await settleAnimations(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact ?? 'n/a'}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary, 'axe WCAG 2.2 AA violations').toEqual([]);
}
