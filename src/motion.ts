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

export const REVEAL_KINDS = ['ink', 'rise', 'wipe', 'stamp', 'draw', 'cards'] as const;
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

export const isFirstView = () => document.documentElement.classList.contains(FIRST_VIEW_CLASS);

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function show(element: HTMLElement) {
  const delay = parseDelay(element.dataset.revealDelay);
  if (element.dataset.reveal === 'cards') {
    const cards = [...element.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const columns = columnIndices(cards.map((card) => card.getBoundingClientRect().left));
    cards.forEach((card, i) =>
      card.style.setProperty('--reveal-delay', `${delay + (columns[i] ?? 0) * CARD_STAGGER_MS}ms`),
    );
  } else if (delay) {
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  }
  element.classList.add(REVEALED_CLASS);
}

/**
 * Reveals every `[data-reveal]` element under `root` once, as it scrolls into view (§M3). Under
 * reduced motion or without IntersectionObserver everything is revealed at once.
 */
export function reveal(root: ParentNode = document): void {
  const pending = new Set(
    root.querySelectorAll<HTMLElement>(`[data-reveal]:not(.${REVEALED_CLASS})`),
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
  onScroll();
}
