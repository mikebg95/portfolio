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
- Page content inside `<main>` is a stack of `<section class="sheet-panel">` (base.css): content
  padding 56 px / 24 px on phone, and a full-width 1 px ink rule between consecutive panels — the
  sheet is divided into panels, never by empty space alone. Override the padding per page when a
  drawing differs; keep the class.
