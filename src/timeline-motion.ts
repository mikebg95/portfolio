// design/motion.md §M4: the Sheet 02 timeline, scroll-scrubbed. Loaded lazily by Timeline.astro's
// script through `startScrub` (src/scrub.ts), so GSAP is only ever fetched on /experience.
//
// One sweep, 0 → 1 along the ruler, drives every bar: a bar extrudes while the sweep crosses its
// months, its duration counts with it, the sabbatical's hatching slides, its label and legend fade
// in over its last stretch. The sweep is scrubbed between "timeline top at 80 % of the viewport"
// and "at 35 %"; a timeline already past the 80 % line at load plays the sweep on its own instead,
// so no text waits for a scroll (principle 1; docs/RECORD.md 2026-10-04). Desktop ≥ 1024 px also
// pins the timeline over the detail blocks, with a scale cursor on the role being read.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { countFrame } from './motion';
import { setScrubState, tokenEase } from './scrub';
import { barProgress, between } from './timeline';

gsap.registerPlugin(ScrollTrigger);

/** §M4 scrub range, ScrollTrigger notation (trigger edge, viewport line). */
export const SCRUB_START = 'top 80%';
export const SCRUB_END = 'top 35%';
/** Seconds the bars take to catch up with the scroll: a pen, not a jump. */
export const SCRUB_SMOOTHING = 0.6;
/** The sweep played on its own when the timeline is in view at load; text in by ~1.2 s. */
export const INTRO_S = 0.9;
/** The ruler draws as the sweep starts (`--motion-draw`), its ticks popping in behind the pen. */
export const RULER_S = 0.6;
export const TICK_S = 0.35;
/** A bar's label fades in over the last 40 % of its extrusion, its duration over the first 15 %. */
export const LABEL_FROM = 0.6;
export const DURATION_TO = 0.15;
/** OptieCon's open-end arrow: two pulses (out and back twice), then still. */
export const ARROW_PULSE_PX = 4;
export const ARROW_PULSE_S = 0.3;
/** Wide enough for the horizontal ruler. */
export const DESKTOP = '(min-width: 1024px)';
/** §M4 sticky timeline: desktop, and tall enough that the pinned ~270 px leave room to read. */
export const PIN_MEDIA = `${DESKTOP} and (min-height: 640px)`;
/** The pinned timeline's distance from the viewport top, and the room kept under it. */
export const PIN_TOP_PX = 16;
export const PIN_GAP_PX = 24;
/** A detail block is "in view" while it spans this viewport line. */
export const READING_LINE = '55%';

interface Bar {
  entry: HTMLElement;
  start: number;
  span: number;
  segment: HTMLElement;
  fades: HTMLElement[];
  duration: HTMLElement | null;
  rules: HTMLElement[];
  count: [Text, string] | null;
}

const percent = (element: HTMLElement, name: string) =>
  Number(element.style.getPropertyValue(name)) || 0;

function readBar(entry: HTMLElement): Bar | null {
  const segment = entry.querySelector<HTMLElement>('.timeline__segment');
  if (!segment) return null;
  const duration = entry.querySelector<HTMLElement>('.timeline__duration');
  const text = [...(duration?.childNodes ?? [])]
    .flatMap((node) => [...node.childNodes])
    .find((node): node is Text => node instanceof Text && /\d/.test(node.data));
  return {
    entry,
    start: percent(entry, '--start'),
    span: percent(entry, '--span'),
    segment,
    fades: [...entry.querySelectorAll<HTMLElement>('.timeline__label, .timeline__legend')],
    duration,
    rules: [...(duration?.querySelectorAll<HTMLElement>('.timeline__rule') ?? [])],
    count: text ? [text, text.data] : null,
  };
}

/** Draws every bar at sweep `sweep`; inline values only, which `clear` removes at the end. */
function render(bars: readonly Bar[], sweep: number, horizontal: boolean) {
  for (const bar of bars) {
    const q = barProgress(sweep, bar.start, bar.span);
    bar.segment.style.transform = horizontal ? `scaleX(${q})` : `scaleY(${q})`;
    bar.segment.style.setProperty('--hatch', String(1 - q));
    for (const fade of bar.fades) fade.style.opacity = String(between(q, LABEL_FROM, 1));
    if (bar.duration) bar.duration.style.opacity = String(between(q, 0, DURATION_TO));
    for (const rule of bar.rules) rule.style.transform = `scaleX(${q})`;
    if (bar.count) bar.count[0].data = q < 1 ? countFrame(bar.count[1], q) : bar.count[1];
  }
}

function clear(bars: readonly Bar[]) {
  for (const bar of bars) {
    bar.segment.style.transform = '';
    bar.segment.style.removeProperty('--hatch');
    for (const element of [...bar.fades, ...bar.rules]) {
      element.style.opacity = '';
      element.style.transform = '';
    }
    if (bar.duration) bar.duration.style.opacity = '';
    if (bar.count) bar.count[0].data = bar.count[1];
  }
}

/** The ruler line wipes along, its year ticks popping in as the pen passes them. */
function drawRuler(ruler: HTMLElement, horizontal: boolean) {
  const ticks = [...ruler.children];
  return gsap
    .timeline({ paused: true })
    .fromTo(
      ruler,
      { clipPath: horizontal ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: RULER_S, ease: tokenEase('plot') },
    )
    .fromTo(
      ticks,
      horizontal ? { scaleY: 0 } : { scaleX: 0 },
      {
        scaleX: 1,
        scaleY: 1,
        duration: TICK_S,
        ease: tokenEase('pop'),
        stagger: (RULER_S - TICK_S / 2) / Math.max(1, ticks.length),
      },
      0.05,
    );
}

/** Desktop: pin the timeline while the detail blocks pass under it; mark the role being read. */
function pinWithCursor(timeline: HTMLElement, bars: readonly Bar[]) {
  const cursor = timeline.querySelector<HTMLElement>('.timeline__cursor');
  const blocks = bars.flatMap((bar) => {
    const id = bar.entry.querySelector('a')?.hash.slice(1);
    const block = id ? document.getElementById(id) : null;
    return block ? [{ bar, block }] : [];
  });
  const details = blocks[0]?.block.closest('section');
  if (!details) return;
  const root = document.documentElement;
  root.style.setProperty(
    '--timeline-pinned',
    `${PIN_TOP_PX + timeline.offsetHeight + PIN_GAP_PX}px`,
  );

  ScrollTrigger.create({
    trigger: timeline,
    start: `top ${PIN_TOP_PX}px`,
    endTrigger: details,
    end: () => `bottom ${PIN_TOP_PX + timeline.offsetHeight}px`,
    pin: true,
    pinSpacing: false,
    toggleClass: 'timeline--pinned',
  });
  for (const { bar, block } of blocks) {
    ScrollTrigger.create({
      trigger: block,
      start: `top ${READING_LINE}`,
      end: `bottom ${READING_LINE}`,
      onToggle: ({ isActive }) => {
        if (!isActive || !cursor) return;
        cursor.style.setProperty('--at', String(bar.start + bar.span / 2));
        cursor.dataset.at = block.id;
      },
    });
  }
  return () => {
    root.style.removeProperty('--timeline-pinned');
    if (cursor) delete cursor.dataset.at;
  };
}

export default function animateTimeline(timeline: HTMLElement): void {
  const horizontal = window.matchMedia(DESKTOP).matches;
  const bars = [...timeline.querySelectorAll<HTMLElement>('.timeline__entry')]
    .map(readBar)
    .filter((bar): bar is Bar => bar !== null);
  const ruler = timeline.querySelector<HTMLElement>('.timeline__ruler');
  const arrow = timeline.querySelector<HTMLElement>('.timeline__arrow');

  const sweep = { at: 0 };
  let rulerDrawn: Promise<unknown> = Promise.resolve();
  const begin = () => {
    setScrubState(timeline, 'playing');
    if (!ruler) return;
    const drawing = drawRuler(ruler, horizontal);
    rulerDrawn = new Promise((resolve) => drawing.eventCallback('onComplete', resolve).play());
  };
  const finish = async () => {
    await rulerDrawn;
    if (ruler) gsap.set([ruler, ...ruler.children], { clearProps: 'clipPath,transform' });
    clear(bars);
    setScrubState(timeline, 'done');
    if (arrow) {
      gsap.to(arrow, {
        x: ARROW_PULSE_PX,
        duration: ARROW_PULSE_S,
        repeat: 3,
        yoyo: true,
        ease: 'sine.inOut',
        onComplete: () => void gsap.set(arrow, { clearProps: 'transform' }),
      });
    }
  };
  const draw = () => render(bars, sweep.at, horizontal);

  if (timeline.getBoundingClientRect().top < window.innerHeight * 0.8) {
    begin();
    gsap.to(sweep, {
      at: 1,
      duration: INTRO_S,
      ease: tokenEase('plot'),
      onUpdate: draw,
      onComplete: () => void finish(),
    });
  } else {
    setScrubState(timeline, 'waiting');
    draw();
    const tween = gsap.to(sweep, { at: 1, ease: 'none', paused: true, onUpdate: draw });
    const trigger = ScrollTrigger.create({
      trigger: timeline,
      start: SCRUB_START,
      end: `clamp(${SCRUB_END})`,
      scrub: SCRUB_SMOOTHING,
      animation: tween,
      onEnter: begin,
    });
    // Drawn once, it stays drawn: scrolling back up never takes the facts away again.
    tween.eventCallback('onComplete', () => {
      requestAnimationFrame(() => trigger.kill());
      void finish();
    });
  }

  gsap.matchMedia().add(PIN_MEDIA, () => pinWithCursor(timeline, bars));
}
