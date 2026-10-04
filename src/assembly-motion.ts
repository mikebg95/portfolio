// design/motion.md §M5: the Sheet 05 exploded view, scroll-scrubbed. Loaded lazily by
// ExplodedAssembly.astro's script through `startScrub` (src/scrub.ts), so GSAP is only ever fetched
// on /education.
//
// One progress, 0 → 1, drives the whole drawing on the schedule `explode` (src/assembly.ts) gives:
// the axis draws up from the base, the solid plates rise out of the stack top plate first, each
// callout (leader, balloon, label) appears as its plate arrives, the dashed CKAD plate fades in
// last. Scrubbed between "drawing top at 80 % of the viewport" and "drawing bottom at the viewport
// bottom"; on a phone, or when the drawing is already past the 80 % line at load, the same progress
// plays once as a 1.2 s timeline instead, so no text waits for a scroll (principle 1; docs/RECORD.md
// 2026-10-04). Selection (the page script) lifts plates by `transform`; the explosion moves them by
// `translate`, so the two never fight.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { EXPLODE, type Window } from './assembly';
import { setScrubState, tokenEase } from './scrub';
import { between } from './timeline';

gsap.registerPlugin(ScrollTrigger);

/** §M5 scrub range, ScrollTrigger notation (trigger edge, viewport line). */
export const SCRUB_START = 'top 80%';
export const SCRUB_END = 'bottom bottom';
/** Seconds the drawing takes to catch up with the scroll. */
export const SCRUB_SMOOTHING = 0.6;
/** §M5 phone timeline, also played when the drawing is in view at load. */
export const PLAY_S = 1.2;
/** No scrubbing below this width (the assembly's own phone breakpoint). */
export const PHONE = '(max-width: 767px)';

interface Part {
  plate: HTMLElement;
  leader: HTMLElement | null;
  mark: HTMLElement | null;
  label: HTMLElement | null;
  drop: number;
  move: Window | null;
  callout: Window;
  fade: Window | null;
}

const windowOf = (value: string | undefined): Window | null => {
  const [from, to] = (value ?? '').split(' ').map(Number);
  return from !== undefined && to !== undefined && Number.isFinite(from) && Number.isFinite(to)
    ? [from, to]
    : null;
};

function readPart(assembly: HTMLElement, plate: HTMLElement): Part {
  const callout = assembly.querySelector<HTMLElement>(
    `.assembly__callout[data-part="${plate.dataset.part}"]`,
  );
  return {
    plate,
    leader: callout?.querySelector<HTMLElement>('.balloon__leader') ?? null,
    mark: callout?.querySelector<HTMLElement>('.balloon__mark') ?? null,
    label: callout?.querySelector<HTMLElement>('.assembly__label') ?? null,
    drop: Number(plate.style.getPropertyValue('--drop')) || 0,
    move: windowOf(plate.dataset.move),
    callout: windowOf(plate.dataset.callout) ?? [0, 0],
    fade: windowOf(plate.dataset.fade),
  };
}

export default function animateAssembly(assembly: HTMLElement): void {
  const axis = assembly.querySelector<HTMLElement>('.assembly__axis');
  const parts = [...assembly.querySelectorAll<HTMLElement>('.plate')].map((plate) =>
    readPart(assembly, plate),
  );
  const plot = tokenEase('plot');
  const out = tokenEase('out');
  const pop = tokenEase('pop');

  /** Draws the drawing at `at`; inline values only, which `clear` removes at the end. */
  const render = (at: number) => {
    if (axis) axis.style.transform = `scaleY(${plot(between(at, ...EXPLODE.axis))})`;
    for (const part of parts) {
      if (part.move) {
        const rest = 1 - out(between(at, ...part.move));
        part.plate.style.translate = `0 calc(${rest * part.drop} * var(--u))`;
      }
      if (part.fade) part.plate.style.setProperty('--shown', String(between(at, ...part.fade)));
      const q = between(at, ...part.callout);
      if (part.leader) part.leader.style.transform = `scaleX(${plot(q)})`;
      if (part.mark) part.mark.style.transform = `scale(${pop(q)})`;
      if (part.label) part.label.style.opacity = String(q);
    }
  };

  const clear = () => {
    if (axis) axis.style.transform = '';
    for (const part of parts) {
      part.plate.style.translate = '';
      part.plate.style.removeProperty('--shown');
      for (const element of [part.leader, part.mark]) if (element) element.style.transform = '';
      if (part.label) part.label.style.opacity = '';
    }
  };

  const progress = { at: 0 };
  const draw = () => render(progress.at);
  const finish = () => {
    clear();
    setScrubState(assembly, 'done');
  };
  const play = () => {
    setScrubState(assembly, 'playing');
    gsap.to(progress, {
      at: 1,
      duration: PLAY_S,
      ease: 'none',
      onUpdate: draw,
      onComplete: finish,
    });
  };

  setScrubState(assembly, 'waiting');
  draw();
  const inView = assembly.getBoundingClientRect().top < window.innerHeight * 0.8;
  if (window.matchMedia(PHONE).matches || inView) {
    ScrollTrigger.create({ trigger: assembly, start: SCRUB_START, once: true, onEnter: play });
    return;
  }
  const tween = gsap.to(progress, { at: 1, ease: 'none', paused: true, onUpdate: draw });
  const trigger = ScrollTrigger.create({
    trigger: assembly,
    start: SCRUB_START,
    end: `clamp(${SCRUB_END})`,
    scrub: SCRUB_SMOOTHING,
    animation: tween,
    onEnter: () => setScrubState(assembly, 'playing'),
  });
  // Exploded once, it stays exploded: scrolling back up never packs the parts away again.
  tween.eventCallback('onComplete', () => {
    requestAnimationFrame(() => trigger.kill());
    finish();
  });
}
