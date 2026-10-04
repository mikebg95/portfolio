// design/motion.md §M2: moving between sheets with View Transitions (Astro's ClientRouter, a
// cross-document one where the router does not run); §M7: the
// theme switch's circular reveal. The chrome's names and the animations are
// src/styles/transitions.css; this holds what markup and the page scripts need.
import { prefersReducedMotion } from './motion';

/** Set on the old page's `<html>` when it leaves scrolled; transitions.css then drops the chrome's
 * names, so the frame, header and content never fly in from their scrolled-away place: the old
 * page fades as a whole while the new sheet lays down. */
export const SWAP_ATTRIBUTE = 'data-swap';

/** The `view-transition-class` every project morph carries (transitions.css animates it). */
export const PROJECT_MORPH_CLASS = 'project-morph';

/** A project register card's title and mini diagram morph into the detail sheet's heading and
 * FIG. 1: one name per slug and part, unique on every page. */
export function projectMorph(slug: string, part: 'title' | 'figure'): string {
  return `view-transition-name: project-${part}-${slug}; view-transition-class: ${PROJECT_MORPH_CLASS};`;
}

/** Marks a page leaving scrolled (see `SWAP_ATTRIBUTE`). Under the router (src/router.ts) the mark
 * is set before the old picture is taken and the swap drops it with the old page's root
 * attributes; a plain cross-document navigation (no JS run by the router) marks in `pageswap`, and
 * a page back from the back/forward cache clears it. */
export function markScrolledSwaps(): void {
  const root = document.documentElement;
  document.addEventListener('astro:after-preparation', () => {
    if (window.scrollY > 0) root.setAttribute(SWAP_ATTRIBUTE, 'scrolled');
  });
  document.addEventListener('astro:page-load', () => root.removeAttribute(SWAP_ATTRIBUTE));
  window.addEventListener('pageswap', (event) => {
    if (event.viewTransition && window.scrollY > 0) root.setAttribute(SWAP_ATTRIBUTE, 'scrolled');
  });
  window.addEventListener('pageshow', () => root.removeAttribute(SWAP_ATTRIBUTE));
}

/** On `<html>` while the theme reveal runs: transitions.css then captures the page as one picture
 * (no chrome names) and plays the circle from `--theme-x/-y` out to `--theme-r`. */
export const THEME_SWITCH_ATTRIBUTE = 'data-theme-switching';

const REVEAL_PROPERTIES = ['--theme-x', '--theme-y', '--theme-r'];

let latest: ViewTransition | undefined;

/** §M7: runs `update` (the theme swap) as a View Transition whose new picture grows as a circle
 * from the middle of `origin`, out to the farthest viewport corner. Reduced motion or no support:
 * `update` at once. */
export function revealTheme(update: () => void, origin: Element): void {
  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
    update();
    return;
  }
  const { left, top, width, height } = origin.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement;
  [x, y, r].forEach((value, i) => root.style.setProperty(REVEAL_PROPERTIES[i]!, `${value}px`));
  root.setAttribute(THEME_SWITCH_ATTRIBUTE, '');

  const transition = document.startViewTransition(update);
  latest = transition;
  // A second click skips this one and starts its own: only the latest clears the marks.
  void transition.finished.finally(() => {
    if (latest !== transition) return;
    root.removeAttribute(THEME_SWITCH_ATTRIBUTE);
    REVEAL_PROPERTIES.forEach((property) => root.style.removeProperty(property));
  });
}
