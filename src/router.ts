// PR-63b, design/motion.md §M2: sheet changes go through Astro's ClientRouter, which swaps the body
// in place instead of loading a new document. A module script therefore runs once per visit, not
// once per page: `onPage` re-runs a page's wiring after every swap; `startRouter` carries the
// visit's state across a swap, keeps the persisted chrome current and moves focus to the new
// sheet. Rules in docs/conventions/motion.md.
import { JS_CLASS, prefersReducedMotion, REVEALED_CLASS } from './motion';

/** What `transition:persist` writes: the header, tab bar and title block stay the same elements. */
const PERSIST_ATTR = 'data-astro-transition-persist';

/** Classes a script adds for state that a persisted element keeps when it is brought up to date
 * (a revealed or counted title block never plays again). */
const KEPT_CLASSES = [REVEALED_CLASS];

let page = 0;
let controller: AbortController | undefined;
let counting = false;

function countSwaps() {
  if (counting) return;
  counting = true;
  document.addEventListener('astro:before-swap', () => {
    controller?.abort();
    controller = undefined;
    page += 1;
  });
}

/**
 * Runs `init` for the page showing now and again for every page the router swaps in — once per
 * page, whether the script loaded with the first page or arrived with a later one. `signal` aborts
 * when that page is swapped out: listeners on `window` or `document`, observers and timelines that
 * would outlive the page's markup end with it.
 */
export function onPage(init: (signal: AbortSignal) => void): void {
  countSwaps();
  let ran = -1;
  const run = () => {
    if (ran === page) return;
    ran = page;
    controller ??= new AbortController();
    init(controller.signal);
  };
  run();
  document.addEventListener('astro:page-load', run);
}

/**
 * Brings `from` up to date with `to` in place: attributes and text where the two trees have the
 * same shape, fresh children where they do not (the tab that gains the ink fill, another language).
 * `KEPT_CLASSES` a script added stay.
 */
export function morph(from: Element, to: Element): void {
  const target = new Map([...to.attributes].map(({ name, value }) => [name, value]));
  const kept = KEPT_CLASSES.filter((name) => from.classList.contains(name));
  if (kept.length) target.set('class', [target.get('class'), ...kept].filter(Boolean).join(' '));
  for (const { name } of [...from.attributes]) if (!target.has(name)) from.removeAttribute(name);
  for (const [name, value] of target) {
    if (from.getAttribute(name) !== value) from.setAttribute(name, value);
  }

  const mine = [...from.childNodes];
  const theirs = [...to.childNodes];
  if (
    mine.length !== theirs.length ||
    mine.some((node, i) => node.nodeName !== theirs[i]?.nodeName)
  ) {
    from.replaceChildren(...theirs.map((node) => document.importNode(node, true)));
    return;
  }
  mine.forEach((node, i) => {
    const twin = theirs[i]!;
    if (node instanceof Element) morph(node, twin as Element);
    else if (node.nodeValue !== twin.nodeValue) node.nodeValue = twin.nodeValue;
  });
}

/** Wires the router's events once per visit (SheetLayout). */
export function startRouter(): void {
  let swapped = false;
  document.addEventListener('astro:before-swap', (event) => {
    const root = document.documentElement;
    const next = event.newDocument.documentElement;
    // The head scripts ran on the first page only: `js` and a chosen theme hold for the visit
    // (the swap copies the new page's root attributes); `first-view` does not — only the first
    // page plots.
    next.classList.add(JS_CLASS);
    if (root.dataset.theme) next.dataset.theme = root.dataset.theme;
    for (const old of document.querySelectorAll(`[${PERSIST_ATTR}]`)) {
      const id = old.getAttribute(PERSIST_ATTR);
      const twin = event.newDocument.querySelector(`[${PERSIST_ATTR}="${id}"]`);
      if (twin) morph(old, twin);
    }
    // Reduced motion: the sheet is swapped at once (principle 6).
    if (prefersReducedMotion()) event.viewTransition.skipTransition();
    swapped = true;
  });
  // Focus moves to the new sheet's heading; the router announces the page title itself.
  document.addEventListener('astro:page-load', () => {
    if (!swapped) return;
    swapped = false;
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });
}
