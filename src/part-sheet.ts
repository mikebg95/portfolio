// Sheet 05 on a phone (PR-62d, drawing education-part3-sheet-light-390): a part's detail opens in
// a bottom sheet — a modal `<dialog>` (top layer, so it and its backdrop sit over the fixed tab
// bar). The page's `.education__details` moves into it while open and back on close, so there is
// one copy of each DetailPanel and the selection logic never knows where it is.

import { prefersReducedMotion } from './motion';

/** Below this width a selection opens the bottom sheet (the phone breakpoint, 768 px). */
export const PHONE_QUERY = '(max-width: 767px)';

/** A drag down further than this many px, or this share of the sheet's height, closes it. */
export const DISMISS_PX = 120;
export const DISMISS_SHARE = 0.25;
/** …or a flick faster than this (px per ms). */
export const DISMISS_SPEED = 0.5;

/** The parts either side of `item` in `items` (the ‹ › steps); none past either end. */
export function neighbours(
  items: readonly number[],
  item: number,
): { previous?: number; next?: number } {
  const sorted = [...items].sort((a, b) => a - b);
  const i = sorted.indexOf(item);
  if (i < 0) return {};
  return { previous: sorted[i - 1], next: sorted[i + 1] };
}

/** Whether a drag of `dy` px down over `ms` on a sheet `height` px tall closes it. */
export function dismisses(dy: number, ms: number, height: number): boolean {
  if (dy <= 0) return false;
  return dy > Math.min(DISMISS_PX, height * DISMISS_SHARE) || dy / Math.max(ms, 1) > DISMISS_SPEED;
}

interface Options {
  dialog: HTMLDialogElement;
  /** The element that moves into the sheet while it is open (`.education__details`). */
  content: HTMLElement;
  /** Selects a part and records it (the page's own selection). */
  step: (item: number) => void;
  /** The sheet's accessible name for a part. */
  name: (item: number) => string;
  items: readonly number[];
  /** What should stay in view above the sheet for a part (its plate). */
  keep?: (item: number) => Element | null;
  /** Aborts when the page is swapped out (src/router.ts `onPage`). */
  signal?: AbortSignal;
}

export interface PartSheet {
  open: (item: number, opener?: HTMLElement | null) => void;
  /** Shows `item` in the open sheet: its name and steps. */
  show: (item: number) => void;
  close: () => void;
  readonly isOpen: boolean;
}

/** How far to scroll so a box of `top`/`height` is centred in the `room` px above the sheet. */
export const scrollToKeep = (top: number, height: number, room: number) =>
  Math.round(top + height / 2 - room / 2);

export function partSheet({
  dialog,
  content,
  step,
  name,
  items,
  keep,
  signal,
}: Options): PartSheet {
  const home = content.parentElement;
  const anchor = content.nextSibling;
  const body = dialog.querySelector<HTMLElement>('[data-sheet-body]');
  const head = dialog.querySelector<HTMLElement>('[data-sheet-head]');
  const grip = dialog.querySelector<HTMLButtonElement>('[data-sheet-close]');
  const steps = {
    previous: dialog.querySelector<HTMLButtonElement>('[data-sheet-step="previous"]'),
    next: dialog.querySelector<HTMLButtonElement>('[data-sheet-step="next"]'),
  };
  let opener: HTMLElement | null = null;
  // Focus before opening: where the browser itself puts it back on close (WebKit: `<main>`).
  let before: Element | null = null;
  let current: number | undefined;
  // Set when a drag ends, so the click the browser may send to the handle does not also close.
  let dragged = false;

  // The chosen plate stays in sight above the sheet, as drawn.
  const reveal = (item: number) => {
    const box = keep?.(item)?.getBoundingClientRect();
    if (!box) return;
    const room = innerHeight - dialog.getBoundingClientRect().height;
    const by = scrollToKeep(box.top, box.height, room);
    if (by !== 0) scrollBy({ top: by, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
  };

  const show = (item: number) => {
    current = item;
    // Read before hiding anything: a focused element that hides loses focus at once.
    const focused = document.activeElement;
    dialog.setAttribute('aria-label', name(item));
    const around = neighbours(items, item);
    for (const key of ['previous', 'next'] as const) {
      const button = steps[key];
      const target = around[key];
      if (!button) continue;
      button.hidden = target === undefined;
      button.dataset.target = target === undefined ? '' : String(target);
      const number = button.querySelector('[data-sheet-n]');
      if (number) number.textContent = target === undefined ? '' : String(target);
    }
    dialog.toggleAttribute('data-ends', !around.previous || !around.next);
    // Stepped to an end: focus moves from the step that just hid to the one left.
    if (focused instanceof HTMLButtonElement && focused.hidden && dialog.contains(focused)) {
      (Object.values(steps).find((button) => button && !button.hidden) ?? grip)?.focus();
    }
    if (dialog.open) reveal(item);
  };

  const open = (item: number, from?: HTMLElement | null) => {
    show(item);
    if (dialog.open) return;
    opener = from ?? null;
    before = document.activeElement;
    dragged = false;
    body?.append(content);
    dialog.classList.remove('part-sheet--closing');
    dialog.style.removeProperty('translate');
    dialog.showModal();
    // The sheet itself takes focus (announced by its name, no ring on a tapped handle); Tab goes on.
    dialog.focus();
    body?.scrollTo(0, 0);
    reveal(item);
  };

  // Whatever closed it (Escape, the handle, a swipe, the backdrop): the details go home and focus
  // returns to what opened the sheet — a row's own button when the row was tapped.
  dialog.addEventListener('close', () => {
    // Reopened before this (queued) event ran: the new opening owns the details.
    if (dialog.open) return;
    dialog.classList.remove('part-sheet--closing');
    dialog.style.removeProperty('translate');
    home?.insertBefore(content, anchor);
    // `close` fires a task after the dialog closed: never take focus from where it went since.
    const now = document.activeElement;
    const target = opener?.matches('button') ? opener : opener?.querySelector('button');
    if (!now || now === document.body || now === before || dialog.contains(now)) {
      target?.focus({ preventScroll: true });
    }
    opener = null;
  });

  const close = () => {
    if (!dialog.open) return;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    dialog.classList.add('part-sheet--closing');
    // Reopened mid-way (the class is gone): stay open.
    const done = () => {
      if (dialog.open && dialog.classList.contains('part-sheet--closing')) dialog.close();
    };
    dialog.addEventListener('transitionend', done, { once: true });
    // A transition that never runs (nothing to move) must not leave the sheet open.
    setTimeout(done, 400);
  };

  grip?.addEventListener('click', () => {
    if (dragged) dragged = false;
    else close();
  });
  for (const button of Object.values(steps)) {
    button?.addEventListener('click', () => {
      const target = Number(button.dataset.target);
      if (!target) return;
      step(target);
      show(target);
      body?.scrollTo(0, 0);
    });
  }

  // A click on the dialog itself is the backdrop (the sheet's own box is filled by its content).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  // Focus stays in the sheet: Tab past the last control wraps to the first, and back.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const tabbables = [
      ...dialog.querySelectorAll<HTMLElement>('button:not([hidden]), a[href], [tabindex="0"]'),
    ].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = tabbables[0];
    const last = tabbables.at(-1);
    if (!first || !last) return;
    if (document.activeElement === dialog) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Swipe down on the head (handle row) to close; a short drag springs back.
  // The drag follows the pointer on the window, not by pointer capture: a captured mouse click is
  // sent to the head, never to the handle button, so the handle would not close (QA-69).
  let drag: { id: number; y: number; t: number; dy: number; stop: AbortController } | null = null;
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.dy = Math.max(0, event.clientY - drag.y);
    dialog.style.translate = `0 ${drag.dy}px`;
  };
  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { dy, t, stop } = drag;
    drag = null;
    stop.abort();
    dialog.classList.remove('part-sheet--dragging');
    if (dismisses(dy, event.timeStamp - t, dialog.offsetHeight)) {
      close();
    } else {
      dialog.style.removeProperty('translate');
    }
    // A real drag is not also a tap on the handle.
    dragged = dy > 8;
  };
  head?.addEventListener('pointerdown', (event) => {
    if ((event.target as Element).closest('[data-sheet-step]')) return;
    drag?.stop.abort();
    const stop = new AbortController();
    drag = { id: event.pointerId, y: event.clientY, t: event.timeStamp, dy: 0, stop };
    dragged = false;
    dialog.classList.add('part-sheet--dragging');
    for (const type of ['pointerup', 'pointercancel'] as const) {
      addEventListener(type, release, { signal: stop.signal });
    }
    addEventListener('pointermove', move, { signal: stop.signal });
  });

  // Grown past the phone breakpoint while open: the details belong inline again.
  matchMedia(PHONE_QUERY).addEventListener(
    'change',
    (event) => {
      if (!event.matches && dialog.open) dialog.close();
    },
    { signal },
  );

  return {
    open,
    show,
    close,
    get isOpen() {
      return dialog.open && current !== undefined;
    },
  };
}
