// The drafting crosshair (design/motion.md §M6, components.md Crosshair): two dashed redline
// hairlines follow the pointer across the sheet with an "X 0412 · Y 0233" readout in sheet
// coordinates. Desktop fine pointer only, never under reduced motion. Markup in
// src/components/Crosshair.astro; rules in docs/conventions/motion.md.

import { prefersReducedMotion } from './motion';

/** The pointers that get a crosshair; touch and coarse pointers never do. */
export const CROSSHAIR_MEDIA = '(hover: hover) and (pointer: fine)';

/** One sheet coordinate as the readout writes it: whole pixels, never negative, 4 digits. */
export function formatCoordinate(value: number): string {
  return String(Math.max(0, Math.round(value))).padStart(4, '0');
}

export function formatReadout(x: number, y: number): string {
  return `X ${formatCoordinate(x)} · Y ${formatCoordinate(y)}`;
}

/**
 * Wires every `[data-crosshair]` overlay to the sheet it sits in (its offset parent). The overlay
 * is shown only while the pointer is over the sheet; moves are throttled to one per frame. `signal`
 * (src/router.ts `onPage`) unwires it when the page is swapped out.
 */
export function crosshair(root: ParentNode = document, signal?: AbortSignal): void {
  const fine = window.matchMedia(CROSSHAIR_MEDIA);
  for (const overlay of root.querySelectorAll<HTMLElement>('[data-crosshair]')) {
    const sheet = overlay.parentElement;
    const readout = overlay.querySelector<HTMLElement>('[data-crosshair-readout]');
    if (!sheet || !readout) continue;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const draw = () => {
      frame = 0;
      if (!pointer || !fine.matches || prefersReducedMotion()) {
        overlay.hidden = true;
        return;
      }
      // From the sheet's padding edge, where the absolutely positioned overlay starts.
      const box = sheet.getBoundingClientRect();
      const x = pointer.x - box.left - sheet.clientLeft;
      const y = pointer.y - box.top - sheet.clientTop;
      overlay.style.setProperty('--crosshair-x', `${x}px`);
      overlay.style.setProperty('--crosshair-y', `${y}px`);
      readout.textContent = formatReadout(x, y);
      overlay.hidden = false;
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(draw);
    };

    sheet.addEventListener(
      'pointermove',
      (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        schedule();
      },
      { signal },
    );
    sheet.addEventListener(
      'pointerleave',
      () => {
        pointer = null;
        schedule();
      },
      { signal },
    );
    // The sheet scrolls under a still pointer: its sheet coordinates change.
    window.addEventListener('scroll', () => pointer && schedule(), { passive: true, signal });
  }
}
