// The scroll-scrubbed set pieces (design/motion.md §M4, §M5): GSAP + ScrollTrigger, imported by a
// page's own module only, which its component script loads lazily through `startScrub`. Rules in
// docs/conventions/motion.md.

import { prefersReducedMotion } from './motion';

/**
 * On the set piece's root, its progress: `pending` in the markup (the script has not decided yet),
 * `waiting` (armed, nothing scrolled yet), `playing`, `done`. Its hidden start state is styled under
 * `.js` + no-preference while it is anything but `done`.
 */
export const SCRUB_ATTR = 'data-scrub';
export const SCRUB_STATES = ['pending', 'waiting', 'playing', 'done'] as const;
export type ScrubState = (typeof SCRUB_STATES)[number];

export const setScrubState = (element: HTMLElement, state: ScrubState) =>
  element.setAttribute(SCRUB_ATTR, state);

/**
 * Loads a set piece's module and runs it on `element` — never under reduced motion, where the
 * piece is `done` at once (its final state). A module that fails to load also ends `done`. The
 * piece ends its timelines and triggers when `signal` aborts (the page is swapped out).
 */
export function startScrub(
  element: HTMLElement,
  load: () => Promise<{ default: (element: HTMLElement, signal?: AbortSignal) => void }>,
  signal?: AbortSignal,
): void {
  if (prefersReducedMotion()) {
    setScrubState(element, 'done');
    return;
  }
  load()
    .then((piece) => {
      if (!signal?.aborted) piece.default(element, signal);
    })
    .catch(() => setScrubState(element, 'done'));
}

/** `cubic-bezier(x1, y1, x2, y2)` as an easing function of progress 0–1, like CSS draws it. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const slope = (a: number, b: number, t: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;
  return (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // x(t) is monotonic for 0 ≤ x1, x2 ≤ 1: Newton's method, then bisection if it stalls.
    let t = progress;
    for (let i = 0; i < 8; i++) {
      const error = at(x1, x2, t) - progress;
      if (Math.abs(error) < 1e-6) return at(y1, y2, t);
      const d = slope(x1, x2, t);
      if (Math.abs(d) < 1e-6) break;
      t -= error / d;
    }
    let [low, high] = [0, 1];
    t = progress;
    for (let i = 0; i < 30; i++) {
      if (at(x1, x2, t) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return at(y1, y2, t);
  };
}

/** The four numbers of a `cubic-bezier(…)` value, or null for anything else. */
export function parseCubicBezier(value: string): [number, number, number, number] | null {
  const match = /^\s*cubic-bezier\(([^)]*)\)\s*$/.exec(value);
  const numbers = match?.[1]?.split(',').map(Number) ?? [];
  const [x1, y1, x2, y2] = numbers;
  if (numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) return null;
  return [x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0];
}

/** A `--motion-ease-<name>` token as a GSAP ease; linear if the token cannot be read. */
export function tokenEase(name: 'plot' | 'out' | 'pop') {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    `--motion-ease-${name}`,
  );
  const points = parseCubicBezier(value);
  return points ? cubicBezier(...points) : (progress: number) => progress;
}
