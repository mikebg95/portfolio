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
- **Scroll reveals (§M3):** put `data-reveal="<kind>"` on an element; `reveal()` (src/motion.ts,
  run by SheetLayout on every page) adds `is-revealed` once 20 % of it is visible, or once its top
  passes 80 % of the viewport (tall elements, jumps). Kinds:
  - `ink` — fade + rise 8 px, 500 ms (rows; the row-rule draw is added per component).
  - `rise` — fade + rise 14 px, 700 ms (§M1 role line, intro).
  - `wipe` — plotter wipe left→right, 800 ms (headings); section labels set `--reveal-duration: 400ms`.
  - `stamp` — from scale 1.25, −6°, fading in, 380 ms with overshoot (revision notes).
  - `draw` — `scaleX(0)` from the left, 600 ms; `--reveal-from: scaleY(0)` and `--reveal-origin`
    change axis/origin. On an SVG `path`/`line`/… it draws the stroke instead — give it
    `pathLength="1"`.
  - `cards` — on the container; each child rises 16 px, staggered 70 ms by column (from layout).
- **Stagger:** `data-reveal-delay="<ms>"` (e.g. `i * 80` for rows). `--reveal-delay` and
  `--reveal-duration` are not inherited (`@property`), so set them on the element itself.
- A new reveal kind = a keyframe + a `[data-reveal='x']` rule in motion.css, a specimen on
  `/_primitives` (`[data-motion-specimens]`), and a line here.
- **Crosshair (§M6):** SheetFrame renders `Crosshair.astro` as `.sheet`'s first child, under the
  inner frame's content as in the preview; `src/crosshair.ts` moves it by `--crosshair-x/y`
  (transforms only) once per frame. Shown only for `(hover: hover) and (pointer: fine)` without
  reduced motion — enforced in both the script and CSS. Its 45 % is a `color-mix` colour, not
  opacity, so `notInFinalState` needs no exception.
- **Tests:** `tests/e2e/motion.spec.ts` checks every route under reduced motion and without JS with
  `notInFinalState` (tests/e2e/helpers/motion.ts). An element whose opacity < 1 or clip-path IS its
  drawn final state goes on that helper's exception list, with a reason.
