import type { Page } from '@playwright/test';

// Elements whose opacity or clip-path is their drawn final state, not an animation's start.
const FINAL_STATE_EXCEPTIONS = [
  '.sheet-tab__number', // the current tab's number, dimmed (components.md Tab)
  '.sheet-index__number', // the same in the phone sheet index
  '.sheet-header__set', // visually hidden set name on phones
  ".sheet-index__panel[data-state='closed']", // the phone sheet index, closed (clipped away)
  '.mini-diagram__hexagon', // hexagon shapes
  '.hexagon',
  '.assembly[data-active] .plate[aria-pressed="false"]', // parts dimmed while another is selected
  '.assembly[data-active] .assembly__callout:not(.assembly__callout--selected)',
];

/**
 * Waits for every finite animation on the page to end — CSS and Web Animations, and the GSAP set
 * pieces (`data-scrub`, src/scrub.ts) about to play or playing; one armed for a scroll is at rest.
 */
export async function settleAnimations(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      !document.documentElement.classList.contains('js') ||
      !document.querySelector("[data-scrub='pending'], [data-scrub='playing']"),
    undefined,
    { polling: 100 },
  );
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

/**
 * design/motion.md "Testing motion": every element under `scope` that is not in its final state —
 * opacity below 1, or a clip-path — described as `tag.class` for the failure message.
 */
export async function notInFinalState(page: Page, scope = 'body'): Promise<string[]> {
  await settleAnimations(page);
  return page.evaluate(
    ({ scope, exceptions }) =>
      [...document.querySelectorAll(`${scope}, ${scope} *`)]
        .filter((element) => !element.matches(exceptions))
        .filter((element) => {
          const style = getComputedStyle(element);
          return Number(style.opacity) < 1 || style.clipPath !== 'none';
        })
        .map((element) => `${element.localName}.${[...element.classList].join('.')}`),
    { scope, exceptions: FINAL_STATE_EXCEPTIONS.join(', ') },
  );
}
