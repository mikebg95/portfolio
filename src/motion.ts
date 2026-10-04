// The motion foundation (design/motion.md principles, §M3). Every animation task builds on this:
// `data-reveal` scroll reveals, the first-view flag and the guards. Styles in src/styles/motion.css;
// rules in docs/conventions/motion.md.

/** On `<html>` when JS runs (SheetLayout's head script); every hidden start state requires it. */
export const JS_CLASS = 'js';
/** On `<html>` on the session's first page view: the full §M1 plotting plays only then. */
export const FIRST_VIEW_CLASS = 'first-view';
/** sessionStorage key set on the first page view of a session. */
export const FIRST_VIEW_KEY = 'plotted';
/** Added to a `[data-reveal]` element when it enters the viewport; its animation then plays. */
export const REVEALED_CLASS = 'is-revealed';
/** §M3: an element reveals once this share of it is visible. */
export const REVEAL_THRESHOLD = 0.2;
/** §M3 cards: each column of a `data-reveal="cards"` container starts this much later. */
export const CARD_STAGGER_MS = 70;
/** §M3 figures: the drawing fades in this long before its first arrow draws… */
export const FIGURE_FADE_MS = 400;
/** …then each arrow (`[data-flow]`, in DOM = data-flow order) this much after the one before. */
export const FLOW_STAGGER_MS = 120;
/** §M6: a `[data-count]` element's numbers count up from 0 this long when it enters. */
export const COUNT_MS = 600;
/** §M1 "≥ 1.40 §M3 takes over": on a first view nothing reveals before the sheet is mostly plotted
 * (frame drawn, heading mid-wipe), so what is in view at load still reads by 1.3 s. */
export const FIRST_VIEW_REVEAL_MS = 800;

export const REVEAL_KINDS = [
  'ink',
  'row',
  'rise',
  'wipe',
  'stamp',
  'draw',
  'cards',
  'figure',
  'route',
] as const;
export type RevealKind = (typeof REVEAL_KINDS)[number];

/** `data-reveal-delay` in milliseconds; anything but a non-negative number is no delay. */
export function parseDelay(value: string | null | undefined): number {
  const ms = Number(value);
  return value && Number.isFinite(ms) && ms > 0 ? Math.round(ms) : 0;
}

/** The column of each item from its left edge: 0 for the leftmost, one more per distinct edge. */
export function columnIndices(lefts: readonly number[]): number[] {
  const edges = [...new Set(lefts.map(Math.round))].sort((a, b) => a - b);
  return lefts.map((left) => edges.indexOf(Math.round(left)));
}

/** `text` with each whole number scaled by `progress` (0–1) and rounded: one frame of a count-up. */
export function countFrame(text: string, progress: number): string {
  return text.replace(/\d+/g, (digits) => String(Math.round(Number(digits) * progress)));
}

export const isFirstView = () => document.documentElement.classList.contains(FIRST_VIEW_CLASS);

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts every number in `element`'s text up from 0 (ease-out), then restores the text exactly. */
function countUp(element: HTMLElement, delay: number) {
  const texts: [Text, string][] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) texts.push([node, node.data]);
  }
  // A non-inline box keeps its final width, so fewer digits never shift what follows.
  element.style.minWidth = `${element.getBoundingClientRect().width}px`;
  const render = (progress: number) => {
    for (const [node, text] of texts) node.data = progress < 1 ? countFrame(text, progress) : text;
  };
  render(0);
  let start = 0;
  const frame = (now: number) => {
    start ||= now + delay;
    const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
    render(1 - (1 - t) ** 3);
    if (t < 1) requestAnimationFrame(frame);
    else element.style.minWidth = '';
  };
  requestAnimationFrame(frame);
}

function show(element: HTMLElement) {
  const motion = !prefersReducedMotion();
  const wait = motion && isFirstView() ? Math.max(0, FIRST_VIEW_REVEAL_MS - performance.now()) : 0;
  const delay = parseDelay(element.dataset.revealDelay) + Math.round(wait);
  if (element.dataset.reveal === 'cards') {
    const cards = [...element.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const columns = columnIndices(cards.map((card) => card.getBoundingClientRect().left));
    cards.forEach((card, i) =>
      card.style.setProperty('--reveal-delay', `${delay + (columns[i] ?? 0) * CARD_STAGGER_MS}ms`),
    );
  } else if (delay) {
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  }
  if (element.dataset.reveal === 'figure') {
    element
      .querySelectorAll<HTMLElement>('[data-flow]')
      .forEach((arrow, i) =>
        arrow.style.setProperty(
          '--reveal-delay',
          `${delay + FIGURE_FADE_MS + i * FLOW_STAGGER_MS}ms`,
        ),
      );
  }
  if (element.dataset.count !== undefined && motion) countUp(element, delay);
  element.classList.add(REVEALED_CLASS);
}

/**
 * Reveals every `[data-reveal]` element under `root` once, as it scrolls into view (§M3), and counts
 * up every `[data-count]` one (§M6). Under reduced motion or without IntersectionObserver everything
 * is revealed at once and nothing counts. `signal` (src/router.ts `onPage`) stops watching when the
 * page is swapped out.
 */
export function reveal(root: ParentNode = document, signal?: AbortSignal): void {
  const pending = new Set(
    root.querySelectorAll<HTMLElement>(`:is([data-reveal], [data-count]):not(.${REVEALED_CLASS})`),
  );
  if (pending.size === 0) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    pending.forEach(show);
    return;
  }

  const done = (element: HTMLElement) => {
    pending.delete(element);
    observer.unobserve(element);
    show(element);
    if (pending.size === 0) window.removeEventListener('scroll', onScroll);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= REVEAL_THRESHOLD) {
          done(entry.target as HTMLElement);
        }
      }
    },
    { threshold: REVEAL_THRESHOLD },
  );

  // The observer never fires for an element taller than five viewports, nor for one jumped past
  // (a hash link, scroll restoration): reveal those once their top passes the same line.
  let frame = 0;
  const check = () => {
    frame = 0;
    const line = window.innerHeight * (1 - REVEAL_THRESHOLD);
    for (const element of pending) {
      if (element.getBoundingClientRect().top < line) done(element);
    }
  };
  function onScroll() {
    frame ||= requestAnimationFrame(check);
  }

  pending.forEach((element) => observer.observe(element));
  window.addEventListener('scroll', onScroll, { passive: true });
  signal?.addEventListener('abort', () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
  });
  onScroll();
}
