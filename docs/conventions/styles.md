# Styles (tokens, fonts, base)

- Colours, sizes, spacing, borders, shadows, motion values come from custom properties in
  `src/styles/tokens.css`, generated from `design/tokens.json` by `scripts/tokens.ts`
  (`npm run tokens`; `dev` and `build` run it). Never hard-code a value tokens.json has; never edit
  tokens.css by hand — change tokens.json and regenerate (the unit test fails on a stale file).
- Names: `--<group>-<key>[-<qualifier>]` — `--color-ink`, `--space-5`, `--size-display-xl`,
  `--size-label-letter-spacing`, `--font-display-stretch`, `--sheet-content-padding-phone`,
  `--border-box`, `--shadow-lift`, `--motion-ease-plot`, `--motion-wipe`.
- Themes: paper values in `:root`; blueprint under `[data-theme='blueprint']` on `<html>` and under
  the system dark preference unless `data-theme='paper'`. Components only use `var(--color-*)`.
- `@media` cannot read custom properties: phone `(max-width: 767px)`, tablet `(min-width: 768px)`,
  desktop `(min-width: 1024px)`.
- Faces: `var(--font-display)` (Archivo, variable: use `font-stretch` 112–118% and weight 800–850),
  `var(--font-body)` (IBM Plex Sans), `var(--font-mono)` (IBM Plex Mono); 400/500/600 only.
  Declared in `src/styles/fonts.css`; files in `public/fonts/`. Glyphs outside the latin subset
  (→ ↗ △ ◐) fall back to a system font.
- Every page imports `src/styles/base.css` (tokens + fonts + body + focus ring + `.sr-only`) and
  renders `src/components/FontPreload.astro` in its head (SheetLayout will own both).
- Preload only a font the page renders above the fold: SheetLayout preloads `PRELOAD_FONTS`
  (display + body, `src/styles/fonts.ts`); a page without one of them passes `preloadFonts` (the
  404 sheets: `[DISPLAY_FONT]`). `tests/e2e/performance.spec.ts` fails on a preload the page never uses.
- Page content inside `<main>` is a stack of `<section class="sheet-panel">` (base.css): content
  padding 56 px / 24 px on phone, and a full-width 1 px ink rule between consecutive panels — the
  sheet is divided into panels, never by empty space alone. Override the padding per page when a
  drawing differs; keep the class.
- A section can carry its own `data-theme` (paper or blueprint): tokens.css re-declares the colours
  and the colour-built tokens (`--border-*`, `--shadow-*`) on every `[data-theme]`. Set
  `background`/`color` on that element yourself — `<body>` already computed them in the page theme.
- Drawing parts come from `src/components/drawing/` (SheetLabel, DisplayHeading, Button, Link,
  DimensionLine, Balloon, RevisionNote, SpecTable/SpecRow, Figure/Box/Arrow, Stamp, Chip/ChipList);
  pages compose them and never restyle their insides. They take text as props/slots (from content)
  and pass `class` and other attributes through to their root (Balloon: to the circle). A new
  variant goes into the component and onto the `/_primitives` page (src/dev/Specimens.astro).
- Display headings never break inside a word (PR-61): DisplayHeading sets `overflow-wrap: normal;
  word-break: keep-all; hyphens: none` and wraps its slot in `.display-heading__fit`, sized
  `min(1em, 100cqi / --display-fit)` from the longest word's em-width measured at build time
  (`src/display-fit.ts`). Cap a heading's size on the heading itself (`min(token, Ncqi)`), never on
  the span; never set `overflow-wrap`/`hyphens` on one. A heading that must flow around a float
  passes `fitTo="container"` (CertCard) and needs an inline-size container around it. A new display
  title that is not a DisplayHeading is wrong — use the component.
- A dashed border is a whole pixel on a 3× screen (QA-63): end the component's style with
  `@media (min-resolution: 2.5dppx) { .x { border-width: 1px; } }` — WebKit there draws no dashed
  side at a fractional width. 1× and 2× keep the drawn width. A long vertical dashed line inside a
  drawing (the assembly axis) is a `repeating-linear-gradient` there instead: a whole-pixel side is
  still dropped where it straddles x = 2ⁿ px. `tests/e2e/dashed-borders.spec.ts` checks every page.
