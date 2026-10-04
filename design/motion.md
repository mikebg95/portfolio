# Motion — the binding animation spec

Goal (Michael, 2026-10-04): a visitor opens the site and thinks **"wow, this is awesome"** — smooth,
professional, clearly cool, *not* subtle-to-invisible, but never childish, never over the top and
never in the way of reading or clicking. Every animation comes from the drawing-office world: pens
plotting lines, sheets being laid on a table, stamps, measuring, assembling parts.

Reference implementation of §M1: `design/screens/html/motion-preview.dc.html` (its `<helmet><style>`
holds the exact keyframes, durations and delays; its script holds the portrait-line stagger and the
crosshair). Port it; don't reinvent it.

## Principles (all binding)
1. **Content first.** Text is readable within 1.3 s of first paint on every page. Nothing hides text
   for longer, and no animation ever blocks a click, scroll or keyboard focus.
2. **Only cheap properties:** transform, opacity, clip-path, stroke-dashoffset. Never animate layout
   (width/height/top/left/margin). 60 fps on a mid-range phone.
3. **One easing family.** `--ease-plot: cubic-bezier(.7,0,.2,1)` (pen lines, wipes), `--ease-out:
   cubic-bezier(.2,.7,.1,1)` (things settling), `--ease-pop: cubic-bezier(.34,1.7,.5,1)` (balloons,
   stamps only). Durations 150–900 ms; nothing loops forever except the CKAD dashed outline (§M6).
4. **Once, not every time.** The full first-load "plotting" (§M1) plays on the first page view of a
   session (sessionStorage flag, try/catch); later page views get the short sheet transition (§M2)
   and scroll reveals only.
5. **Reduced motion:** `prefers-reduced-motion: reduce` → everything rendered in its final state, no
   transforms, no View Transitions animation, no crosshair, no scroll-driven movement. Must be tested.
6. **No JS, no problem.** Without JS every element is visible in its final state (animations are
   opted into by a `js` class on `<html>` set by an inline head script).
7. **Libraries:** CSS keyframes + View Transitions API + `IntersectionObserver` for most of it;
   **GSAP + ScrollTrigger** (free, MIT-like "no charge" licence since 2025) only for the two
   scroll-scrubbed set pieces (§M4, §M5). Lazy-load GSAP only on those two pages.

## M1 — First load: the sheet plots itself (Sheet 01; shorter variant on other sheets)
Timeline (seconds from first paint; matches the preview):
| t | What |
|---|---|
| 0.00–0.70 | Outer frame draws: top edge left→right, bottom edge right→left, then right and left edges (scaleX/scaleY from the corner, `--ease-plot`). |
| 0.15–1.05 | Grid fades in (opacity 0→1). |
| 0.50–0.80 | Header cells drop in, staggered 60 ms (translateY −8 px → 0, fade). |
| 0.90–1.40 | The active tab's ink fill wipes in left→right. |
| 0.60 | Sheet label rises in. |
| 0.70 / 0.85 | Headline lines wipe in left→right like a plotter pen (`clip-path: inset(0 100% 0 0)` → 0), 800 ms each. |
| 1.05 | Role-line rule extends; role line, then intro paragraph rise in (1.1 s, 1.2 s). |
| 0.55–1.50 | ASCII portrait scans in top→bottom: each line of `docs/source/ascii-portrait.txt` wipes left→right in 260 ms, staggered 22 ms. |
| 1.50–2.10 | Dimension lines extend from their centre (scaleX / scaleY), arrowheads ride the ends; labels fade in at 1.95 s. |
| 1.75–2.35 | Callout leaders draw (300 ms) then balloons pop (`--ease-pop`, staggered 100 ms), labels slide in. |
| 2.30 | Revision note stamps down: from scale 1.25, rotate −6°, opacity 0 → scale 1, rotate −1.2°, 380 ms, slight overshoot. |
| ≥1.40 | Below the fold: §M3 scroll reveals take over. |
Other sheets on first load: frame + grid + header (same timing), then their heading wipe and hero
elements in ≤ 1.2 s.

## M2 — Moving between sheets (View Transitions API, cross-document)
`@view-transition { navigation: auto; }`. Named elements: the sheet frame, the header and the title
block **stay put** (shared names → they morph in place, so the "table" is constant); the active tab's
ink fill **slides** from the old tab to the new one (shared `view-transition-name: active-tab`).
The sheet content transitions like laying a new drawing on the table: old content slides up 24 px
and fades out (180 ms), new content slides in from 24 px below and fades in (320 ms, `--ease-out`).
Project register card → detail sheet: the card's title and mini diagram morph into the detail
heading and FIG. 1 (shared names per slug). Browsers without support: plain navigation.

## M3 — Scroll reveals ("inking in")
`IntersectionObserver`, threshold 0.2, each element animates once:
- Spec rows and table rows: text fades/rises 8 px, then the row's bottom rule draws left→right
  (600 ms), rows staggered 80 ms.
- Section labels: type in characters is NOT used; they wipe in left→right (400 ms).
- Display headings below the fold: plotter wipe (§M1).
- Revision notes: stamp (§M1) when they enter.
- Figures (project detail FIG. 1/2): boxes fade in, then each connecting arrow draws along its path
  (stroke-dashoffset or scaleX), in data-flow order, 120 ms apart.
- Cards: rise 16 px + fade, staggered 70 ms by column.

## M4 — Experience timeline (Sheet 02), scroll-scrubbed
- As the timeline enters, the year ruler draws left→right with tick marks popping in.
- Bars extrude from their start month to their end month (scaleX from left) scrubbed to scroll
  between "timeline top at 80% viewport" and "timeline top at 35% viewport"; durations count up
  (0 Y 0 M → 2 Y 8 M) in step with the bar.
- The sabbatical hatching slides diagonally while it extrudes; OptieCon's open end gets a pulsing
  arrow (2 pulses, then still).
- Detail blocks below: a thin vertical "scale cursor" on the timeline marks the role whose detail
  block is in view (sticky timeline on desktop ≥ 1024 px only; on phones no stickiness).

## M5 — Education exploded view (Sheet 05), scroll-scrubbed — the set piece
- Starts **assembled**: plates stacked tight (gap 6 px), balloons hidden.
- Scrubbed by scroll across the section, the assembly **explodes**: plates separate upward to their
  drawn positions (staggered, top plate first), the centre axis draws, then each leader line and
  balloon appear as their plate arrives. The CKAD plate fades in last as a dashed outline.
- Selecting a part (click/Enter on plate, balloon or row): that plate lifts 12 px and fills ink-blue
  (250 ms), others dim to 60%; the detail panel swaps with a quick wipe (clip-path, 250 ms).
- Hovering a parts-list row previews the same lift on its plate.
- Phone: no scrubbing — plays once as a 1.2 s timeline when the section enters.

## M6 — Small interactions
- **Drafting crosshair (desktop, fine pointer only):** two dashed red hairlines follow the pointer
  across the sheet with a coordinate readout "X 0412 · Y 0233" (sheet coordinates, 4 digits). Hidden
  over text inputs/links? No — it never captures events (`pointer-events: none`). Throttled to rAF.
  Off on touch and under reduced motion.
- Buttons: ink fill wipes in from left on hover (200 ms); focus ring never animated.
- Tabs: hover draws an underline left→right.
- Project cards: hover lift with a hard 6 px ink offset shadow (150 ms) and the mini diagram arrows
  redraw.
- Certification stamps: on enter, stamps slam down in sequence (§M1 stamp, 120 ms apart) with a
  brief ink-bleed (scale 1→1.03→1 on the ring). CKAD's dashed stamp outline slowly rotates its dash
  (`stroke-dashoffset`, 12 s linear, infinite) — the only infinite animation.
- Balloons on Sheet 01 link targets: hover scales 1.08.
- Numbers (test counts, durations) count up once when they enter (600 ms).

## M7 — Theme switch (paper ↔ blueprint)
View Transition with a circular clip-path reveal growing from the theme toggle (500 ms,
`--ease-plot`): the new theme "washes" across the sheet like a blueprint exposure. Reduced motion:
instant swap.

## Testing motion
- Playwright: with `reducedMotion: 'reduce'` every page's content is visible immediately (no element
  with opacity < 1 or a non-none clip-path after load).
- Playwright: with JS disabled, all content is visible.
- A test asserts text is visible within 1.3 s on Sheet 01 first load.
- Visual check against the preview by the QA gate.
