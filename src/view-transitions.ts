// design/motion.md §M2: moving between sheets with cross-document View Transitions. The opt-in,
// the chrome's names and the animations are src/styles/transitions.css; this holds what markup
// and the page script need.

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

/** Marks a page leaving scrolled (see `SWAP_ATTRIBUTE`), and clears the mark when the page comes
 * back from the back/forward cache. */
export function markScrolledSwaps(): void {
  window.addEventListener('pageswap', (event) => {
    if (event.viewTransition && window.scrollY > 0) {
      document.documentElement.setAttribute(SWAP_ATTRIBUTE, 'scrolled');
    }
  });
  window.addEventListener('pageshow', () => {
    document.documentElement.removeAttribute(SWAP_ATTRIBUTE);
  });
}
