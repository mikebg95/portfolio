# Motion (reveals, first view, guards)

design/motion.md is the spec; this is how it is built. Every animation task uses these pieces —
never a second system.

- **Values:** easings and durations are the `--motion-*` tokens (`--motion-ease-plot`,
  `--motion-ease-out`, `--motion-ease-pop`, `--motion-fast` 150, `--motion-normal` 250,
  `--motion-draw` 600, `--motion-wipe` 800 ms). A spec number with no token (380 ms stamp, 400 ms
  label wipe) is written where it is used, with its §.
- **`js` on `<html>`** — set by SheetLayout's inline head script. A hidden start state is only ever
  written under `.js` AND `@media (prefers-reduced-motion: no-preference)`; outside that block the
  element's own styles are its final state. No JS / reduced motion → final state, by construction.
- **Keyframes give only the start** (`from`), so the element ends in its own styles; never
  `animation-fill-mode: forwards` to reach a final state the element's CSS does not have.
- **Reduced motion:** `src/styles/motion.css` forces every CSS animation to 1 ms, one iteration,
  no delay — so a `forwards` animation still lands on its end and `animationend` still fires.
  Transitions are NOT clamped: a component with a transition sets its own reduced-motion rule
  (usually `transition: none`). Scroll-scrubbed (GSAP) and JS-driven motion must check
  `prefersReducedMotion()` itself.
- **First view:** the head script sets sessionStorage `plotted` and adds `first-view` to `<html>` on
  the session's first page view; §M1's full plotting is styled under `.js.first-view`. Storage
  blocked → never `first-view` (docs/RECORD.md 2026-10-04). In scripts: `isFirstView()`.
- **First-load plotting (§M1):** `src/styles/plotting.css` (every page, via base.css) plots the
  chrome — frame, grid, header, active tab — and the other sheets' short hero variant: put
  `data-plot="label|heading|hero|note"` on a hero's sheet label, h1, other hero blocks and note;
  all are in by 1.2 s. Sheet 01's long hero timeline is `src/styles/plotting-overview.css`,
  imported by the Overview page only, and Sheet 01 carries no `data-plot`. Rules sit under
  `.js.first-view` in a no-preference block, reuse the `reveal-*` keyframes (start-only, `backwards`
  fill, delay written on the element). Frame and grid draw on SheetFrame's `.sheet__plot` layer
  (`display: none` elsewhere); the portrait is one inline-block `.portrait__line` per row with
  `--line: <i>`. Only animate a header cell at the widths where it shows.
- **Scroll reveals (§M3):** put `data-reveal="<kind>"` on an element; `reveal()` (src/motion.ts,
  run by SheetLayout on every page) adds `is-revealed` once 20 % of it is visible, or once its top
  passes 80 % of the viewport (tall elements, jumps). Kinds:
  - `ink` — fade + rise 8 px, 500 ms (list items, table rows, meta lines).
  - `row` — `ink`, then the row's bottom rule draws (600 ms after a 250 ms hold) — only for rows
    ruled by a 1 px `--color-rule` bottom border with a bare last row (SpecRow, IN PROGRESS): the
    border turns transparent and an `::after` draws in its place. Table rows (`border-collapse`)
    use `ink`.
  - `rise` — fade + rise 14 px, 700 ms (§M1 role line, intro).
  - `wipe` — plotter wipe left→right, 800 ms (headings); SheetLabel sets its own
    `--reveal-duration: 400ms` (§M3 section labels). `--reveal-clip` changes the start inset.
  - `stamp` — from scale 1.25, −6°, fading in, 380 ms with overshoot (revision notes).
  - `draw` — `scaleX(0)` from the left, 600 ms; `--reveal-from: scaleY(0)` and `--reveal-origin`
    change axis/origin. On an SVG `path`/`line`/… it draws the stroke instead — give it
    `pathLength="1"`.
  - `cards` — on the container; each child rises 16 px, staggered 70 ms by column (from layout).
  - `route` — PipelineRoute carries it (delay 400 = after a figure's fade): nothing is hidden; a
    dot travels the route once (900 ms, linear) and each station ticks as it passes (§M6).
  - `figure` — on a Figure: the drawing fades in (400 ms), then every `[data-flow]` inside (Arrow
    renders it) wipes in along its direction, 120 ms apart in DOM order — so a figure's markup must
    list its arrows in data-flow order. A down/up/left arrow sets `--reveal-clip`.
- **A `span` with `data-reveal`** is made `inline-block` (under `.js` + no-preference): an inline box
  has no transform and clips oddly.
- **Count-up (§M6):** `data-count` on an element whose text holds the number(s); when it enters,
  every whole number in its text counts from 0 (600 ms, ease-out) and the text is restored exactly.
  Never under reduced motion. Marked: series and title-block test counts, a card's TESTS fact, the
  test pyramid. PR-43's timeline durations can reuse it (`countFrame` handles "2 Y 8 M").
- **First view:** `reveal()` holds every reveal until 800 ms after navigation start
  (`FIRST_VIEW_REVEAL_MS`), so what is in view at load joins the plotting instead of racing it.
- **Where reveals go:** below each sheet's hero — labels `wipe`, below-fold headings `wipe`, rows
  `row`/`ink` staggered `i * 80`, notes `stamp`, figures `figure`, card grids `cards`. Never on a
  `data-plot` element or inside Sheet 01's `.hero` (both are the first-load plotting).
- **Stagger:** `data-reveal-delay="<ms>"` (e.g. `i * 80` for rows). `--reveal-delay` and
  `--reveal-duration` are not inherited (`@property`), so set them on the element itself.
- A new reveal kind = a keyframe + a `[data-reveal='x']` rule in motion.css, a specimen on
  `/_primitives` (`[data-motion-specimens]`), and a line here.
- **Scroll-scrubbed set pieces (§M4, §M5):** the piece's own module (`src/timeline-motion.ts`, `src/assembly-motion.ts`)
  imports GSAP + ScrollTrigger statically; its component script loads it lazily with
  `startScrub(root, () => import(…))` (src/scrub.ts), which never loads it under reduced motion and
  ends `done` if it fails. The root carries `data-scrub="pending"` in the markup; the module sets
  `waiting` / `playing` / `done`. Its hidden start state is styled under `.js` + no-preference while
  `:not([data-scrub='done'])`; at `done` it clears every inline style it wrote. Easings: `tokenEase('plot'|'out'|'pop')`
  reads the token. `settleAnimations` (e2e) waits for `pending`/`playing`.
  A piece already above the 80 % line at load plays its progress on its own instead of scrubbing
  (principle 1: no text waits for a scroll); once done it stays done. A spec that measures the
  drawing waits for `settleAnimations` first.
- **Small interactions (§M6):** every hover state has the same look on `:focus-visible`
  (`:is(:hover, :focus-visible)`); the focus ring itself never animates. Hover motion is a
  `transition` on transform or clip-path with its own reduced-motion `transition: none`; a replayed
  drawing (card arrows) is an `animation` under no-preference, which plays again on each hover.
  A shadow that grows is a clipped pseudo-element, never an animated `box-shadow` (ProjectCard).
  `tests/unit/motion-properties.test.ts` fails on any keyframe or transition of a layout property.
- **Stamps (§M6):** CertCard gives its Stamp `data-reveal="stamp"`, 300 ms + 120 ms per card; the
  Stamp adds the ink bleed (`scale`, after the slam). The pending ring is an SVG circle whose
  dash rotates (12 s, infinite, no-preference only) — the one infinite animation.
- **Crosshair (§M6):** SheetFrame renders `Crosshair.astro` as `.sheet`'s first child, under the
  inner frame's content as in the preview; `src/crosshair.ts` moves it by `--crosshair-x/y`
  (transforms only) once per frame. Shown only for `(hover: hover) and (pointer: fine)` without
  reduced motion — enforced in both the script and CSS. Its 45 % is a `color-mix` colour, not
  opacity, so `notInFinalState` needs no exception.
- **Sheet transitions (§M2):** cross-document View Transitions. The opt-in is the inline `<style>`
  in SheetLayout's head (never move it into a bundle — docs/RECORD.md 2026-10-04); names and
  pseudo-element animations live in `src/styles/transitions.css`, the one place a chrome name is
  given. A name must be unique on every rendered page (`tests/e2e/view-transitions.spec.ts` checks
  every route); per-item names come from a helper (`projectMorph(slug, part)` in
  src/view-transitions.ts) and carry a `view-transition-class` so one rule animates them all. The
  names also join any same-document transition, so one marks `<html>` while it runs and clears
  the names under that mark — as the theme switch does.
- **Theme switch (§M7):** `revealTheme(update, button)` (src/view-transitions.ts) runs the swap as
  a same-document transition with `html[data-theme-switching]` set: every name is dropped (one
  picture) and `::view-transition-new(root)` grows a `clip-path` circle from `--theme-x/-y` to
  `--theme-r`. Reduced motion or no API → `update()` at once. Storage is written in the click
  handler, not in `update`.
- **Tests:** `tests/e2e/motion.spec.ts` checks every route under reduced motion and without JS with
  `notInFinalState` (tests/e2e/helpers/motion.ts). An element whose opacity < 1 or clip-path IS its
  drawn final state goes on that helper's exception list, with a reason.
