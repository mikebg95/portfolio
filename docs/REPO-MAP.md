# REPO-MAP

Where things live, what owns what, and traps with their symptoms. Pointers,
not prose: `path:line` + one sentence. Never what a task did — that is the
commit's job. Read by section (`grep -n '^## ' docs/REPO-MAP.md`), never
whole. Cap: 300 lines and 40,000 bytes; at the cap, replace the least useful
line.

## Orchestrator

- `.orchestrator/config.sh` — every loop setting; run.sh holds none.
- `.orchestrator/progress.md` — plain-English log for a human; untracked.
- `.orchestrator/logs/latest/` — this run's transcripts, one per agent.

## Tooling

- `src/config.ts` — `SITE_URL`, the one place the origin is written; `astro.config.ts` imports it.
- `package.json` `verify` — the full chain: typecheck, lint, format, unit, build, e2e, Lighthouse CI.
- `.prettierignore` — `*.md`, `design/`, `docs/` excluded on purpose (docs/RECORD.md 2026-10-04).
- `vitest.config.ts` — includes `src/**/*.test.ts` and `tests/unit/**`; e2e specs live in `tests/e2e/` only, or Vitest would try to run them.
- TRAP: under an AI agent (AI_AGENT/CLAUDECODE set) Astro 7 `astro dev`/`astro preview` detach into the background and the npm script exits at once; pass `-- --ignore-lock` to stay in the foreground, or stop a detached one with `npx astro dev stop` / `npx astro preview stop`. Symptom: Playwright "Process from config.webServer exited early", then "4321 is already used".
- `playwright.config.ts` — projects chromium-desktop / chromium-phone / webkit-iphone; never reuses a server on 4321 (another project's could answer).
- `lighthouserc.json` — Lighthouse CI (`npm run lhci`, last leg of `verify`): mobile preset, 5 URLs × 3 runs against `npm run preview` on a built `dist/`; reports to `.lighthouseci/` (~40 MB, ignored); uses the system Chrome (override with `CHROME_PATH`).
- `tests/e2e/performance.spec.ts` — 60 KB gz JS budget per built page (static closure over `_astro/` chunks, lazy imports included) and "preload only fonts the page renders".
- `tests/e2e/responsive.spec.ts` — every route + 404 at 320…2560 px (chromium-desktop only): page scroll, heading/label overlap, text spilling out of its box, table frames; screenshots in `.e2e/responsive/`. A designed spill goes in `SPILL_EXCEPTIONS` with its reason, never a looser check.
- `src/favicon.ts` — the MG monogram icon set from one SVG source (`monogramSvg`): `favicon.svg` (blueprint under `prefers-color-scheme`), `.ico`, apple-touch, 512 + maskable PNGs, `webManifest`; one endpoint each in `src/pages/`, paths in `ICONS` (`src/config.ts`). Without the icon links Chrome asks for `/favicon.ico`, logs a 404 and Lighthouse best practices drops to 0.96.
- `src/glyphs.ts` — `openWoff2`/`run`: text as glyph outlines from `public/fonts/`, shared by the OG cards and the icons.
- `tests/e2e/facts.spec.ts` + `tests/e2e/facts-allowlist.yaml` — facts audit (SPEC §3.7) over the built EN pages: every number, month-year date, capitalised/camelCase word and outbound URL must be in `docs/source/` or the allowlist (grouped by reason + evidence). New copy with a fact the sources lack fails here: source it or drop it; an allowlist entry no page needs fails too. Also: phone number (read from cv.md) in no HTML, Jamigos has no live link.
- `tests/e2e/helpers/axe.ts` — `expectNoAxeViolations(page)`, WCAG 2.2 AA tags; every page's e2e calls it.

## Styles

- `scripts/tokens.ts` — tokens.json → `src/styles/tokens.css`; one parse rule per token group, throws on a description it cannot read (fix the rule or the token, never the CSS).
- `src/styles/base.css` — imports tokens.css + fonts.css; body, focus ring, `.sr-only`.
- `src/styles/fonts.ts` — `PRELOAD_FONTS`, used by `src/components/FontPreload.astro`; `fonts.css` must declare the same URLs (tests/unit/tokens.test.ts).
- `src/components/drawing/` — the shared drawing primitives (components.md); `src/revision-note.ts` splits a note's "REV. NOTE △" lead off.
- `src/dev/primitives.astro` — the `/_primitives` specimen page; `astro.config.ts` injects it only in dev or when `BUILD_PRIMITIVES=1` (Playwright's webServer sets it), so production builds never have it.
- TRAP: a token like `--border-normal: 1.5px solid var(--color-ink)` resolves where it is declared; in a nested `[data-theme]` it would keep the outer ink unless re-declared there (tokens.css does it for every `[data-theme]`). Symptom: borders in the page theme's colour inside the other theme's section.
- `public/fonts/` — vendored woff2 + OFL licences (docs/RECORD.md 2026-10-04).
- `src/motion.ts` — `reveal()`, `isFirstView()`, `prefersReducedMotion()` and the class/key names; `src/styles/motion.css` — reveal keyframes + the global reduced-motion clamp; SheetLayout's head script sets `js`/`first-view`, its module script runs `reveal()` (docs/conventions/motion.md).
- `tests/e2e/helpers/motion.ts` — `notInFinalState(page, scope)` + the list of elements whose opacity/clip-path is drawn on purpose; `tests/e2e/motion.spec.ts` runs it on every route (reduced motion, no JS). `tests/e2e/helpers/routes.ts` — `PAGES`/`ROUTES`, every route × language. `tests/e2e/helpers/content.ts` — `ui(lang)`/`profile(lang)` from the YAML, for e2e that walk both languages (NL text is never a literal there).
- `src/styles/plotting.css` — §M1 first-load plotting of the chrome on every page (via base.css) + the short `[data-plot]` hero variant; `plotting-overview.css` is Sheet 01's hero (imported by `src/pages/[...lang]/index.astro`); `tests/e2e/plotting.spec.ts` checks the timings, readability at 1.3 s (animations seeked, not slept), ≤ 1.2 s on the other sheets, later views.
- TRAP: every fresh Playwright context is a session's first view, so every page plots on load (the `.sheet` loses its border and grid to `.sheet__plot`); measure geometry or run axe after `settleAnimations` (`expectNoAxeViolations` does it), or `goto` twice for the static sheet. Symptom: leaders with zero width, contrast failures on half-faded text, `.sheet` background-size of one layer.
- `tests/e2e/motion.spec.ts` "every page, scrolled to the bottom" — every route ends in its final state and `[data-count]` text equals the served HTML; figures/rows/counts have their own tests there.
- TRAP: a component's scoped rule ties a global one of equal class count and loads later (SheetLabel chunk after the page chunk); prefix `html` where a global rule must win. Symptom: a component's final state shows while its animation runs behind it.
- `src/styles/transitions.css` — §M2 sheet transitions: the chrome's `view-transition-name`s (`sheet`, `sheet-header`, `active-tab` on `.sheet-tab__fill`, `sheet-content` on `#main`, `title-block`) and the pseudo-element animations; `src/view-transitions.ts` — `projectMorph(slug, part)` (card title/diagram ↔ detail h1/FIG. 1) the scrolled-swap mark and `revealTheme` (§M7 theme circle); `tests/e2e/view-transitions.spec.ts`, `tests/e2e/theme-reveal.spec.ts`.
- TRAP: the `@view-transition` opt-in must stay inline in SheetLayout's head; in the bundled CSS Chromium sometimes reveals the new page before reading it. Symptom: console "Transition was aborted because of invalid state. ViewTransition opt-in disabled", plain navigation now and then. A `page.goto` to the URL already open (a reload) logs the same line.
- TRAP: a `view-transition-name` makes its element a stacking context even with no transition running; a popover inside a named element paints under the named elements after it (transitions.css lifts `.sheet-header` with `z-index: 1`). Symptom: the phone sheet index panel opens but `main` intercepts its clicks.
- TRAP: a `[data-reveal]` element stays at opacity 0 if `reveal()` never runs on the page (a page not using SheetLayout, or a script error before it); symptom: content missing only with JS on and motion allowed.

## Content

- `src/content/schemas.ts` — zod schema per collection (SPEC §5), `LANGS`, `COLLECTIONS`; imported by `src/content.config.ts` and the tests.
- `src/content.config.ts` — glob loaders, `generateId` from the path; the only content config Astro 7 reads.
- `src/content/pairing.ts` — `findPairingErrors`: missing twin, lang ≠ folder, twin shape mismatch.
- `tests/unit/content-collections.test.ts` — reads every YAML from disk, runs schema + pairing; the "build-time" check.
- TRAP: the glob loader uses a `slug` data field as the entry id by default, so EN and NL twins collide ("multiple entries with the same slug" warning, one language silently dropped); `generateId` in content.config.ts prevents it.
- TRAP: the built data store is `node_modules/.astro/data-store.json`, not `.astro/`.
- `src/content/ui/<lang>/ui.yaml` — header, footer, SEO and 404 strings (copy.md Global/SEO/404); read via `t(lang)`.
- `tests/unit/helpers/content.ts` — `readCollection` (YAML from disk) and `fakeAstroContent` for `vi.mock('astro:content', …)`.
- TRAP: `astro:content` imports fine under Vitest but its store is empty — `getEntry` returns undefined, `getCollection` []; mock it with `fakeAstroContent`.
- `src/portrait.ts` — `PORTRAIT`, `docs/source/ascii-portrait.txt` inlined via `?raw` at build time; the only copy of the portrait.
- `tests/unit/profile-content.test.ts` — parses design/copy.md Sheet 01 and compares it with the EN profile; a copy.md wording change fails it.
- `tests/unit/experience-content.test.ts` — the same for Sheet 02 (`### … (id `…`)` blocks) plus ordering/overlap and the Conspect line in `profile.employers`.
- `tests/unit/project-content.test.ts` — Sheet 03 register table in copy.md vs EN `projects`; 251-test sum; scans `src/` and `public/` for any jamigos domain link.
- `tests/unit/certification-content.test.ts` — Sheet 04 `- C-0n …` lines in copy.md vs EN `certifications` (ids `spring` `psm` `oca` `ckad`); verify URLs must equal cv.md's link list; `verifyLabel` is stored without the ↗ (Link/Button draw it).
- `tests/unit/education-content.test.ts` — Sheet 05 balloons, parts-list rows and `n. **Title** — meta — `body`` panels in copy.md vs EN `education` (`part-1`…`part-5`); `part`/`supplier`/`years` are the parts-list cells, `detail.title`/`meta` the panel; part 3 rows sum to 30 EC.
- `tests/unit/claims-guard.test.ts` — bans claims PR-60–65 removed (EN, NL YAML and copy.md); a copy change that reintroduces one fails here, and its message names the file.
- `src/timeline.ts` — Sheet 02 timeline geometry (`ruler`, `place`, `layout`, `formatDuration`); pure, build date passed in; the Conspect dimension line uses `place`.

## Routes and languages

- `src/pages/[...lang]/` — every sheet once; `langPaths()` (src/i18n/paths.ts) yields `/x` and `/nl/x`.
- `src/pages/404.astro`, `src/pages/nl/404.astro` — the only per-language page files; built as `dist/404.html` and `dist/nl/404/index.html`.
- `src/components/NotFoundSheet.astro` — the 404 sheet both 404 pages render (label, heading, note, `[data-sheet-list]` of the five sheets); `tests/e2e/not-found.spec.ts`.
- Static host 404: answer unknown URLs with `dist/404.html` and status 404 (nginx `error_page 404 /404.html;`); for Dutch, `location /nl/ { error_page 404 /nl/404/index.html; }`. `astro preview` serves `404.html` for every unknown URL, `/nl/…` included.
- `src/i18n/paths.ts` — `DEFAULT_LANG`, `localize`, `delocalize`, `alternate`, `langPaths`; `astro.config.ts` i18n reads `LANGS`/`DEFAULT_LANG` from it.
- `src/i18n/routes.ts` — `SHEETS` (key, number, path) and `projectPath(slug)`.
- `src/i18n/content.ts` — `t(lang)`, `getLocalized`, `getAllLocalized`, `sharedId`.
- `tests/e2e/helpers/content.ts` — `ui`, `profile`, `certification` read straight from the YAML, so e2e that walks `/nl/` expects each language's own words; `tests/e2e/dutch.spec.ts` greps built `dist/nl/` for English UI words.
- TRAP: long Dutch compounds (Politicologie, LEVERANCIER) overflow fixed phone columns at 320 px; the education label column and parts list rely on `hyphens: auto` (the page's `lang` picks the dictionary).
- `src/seo.ts` — canonical/hreflang URLs (`neutralPath` strips Astro's trailing slash), `sitemap`, `robots`, `personJsonLd`; `SheetLayout` renders the head from its `description`/`noindex` props, pages add more via `slot="head"`.
- `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts` — endpoints; the sitemap is built from `SHEETS` + project slugs, so a new route is listed only if added there. `tests/e2e/seo.spec.ts` (chromium-desktop only).
- `src/og.ts` — Open Graph cards: `ogImagePath(lang, path)` (SheetLayout's og:image), the SVG layout, `renderOgPng`; `src/pages/og/[...card].png.ts` lists the cards from content (label + heading as the page draws them). `tests/unit/og.test.ts`; `tests/e2e/seo.spec.ts` checks every built page's image is a 1200×630 PNG.
- TRAP: fontkit's `getVariation` on a WOFF2 font throws "Cannot read properties of undefined (reading 'tables')"; `src/og.ts` decompresses with `wawoff2` first. A heading character missing from the latin subset fails the build ("has no glyph") instead of drawing a box.
- TRAP: under Vitest a `?raw` import of a `.css` file is an empty string; `src/og.ts` reads tokens.css and the fonts from disk relative to `process.cwd()` (build and Vitest both run at the root).
- TRAP: `Astro.url.pathname` in the build is `/experience/` (directory format) while links are `/experience`; canonicals and the sitemap use the slash-less form, so the static host must serve `/experience` without a redirect (nginx `try_files $uri $uri/index.html`).

## Sheet chrome

- `src/layouts/SheetLayout.astro` — the page shell: `<html lang>`, theme-init inline script, skip link, `SheetFrame` with `SheetHeader`, `<main id="main" tabindex="-1">` and `TitleBlock`; props `lang`, `title`, `sheet`.
- `src/components/SheetFrame.astro` — desk, paper + grid, double frame, zone strip 1–8 (desktop only, `aria-hidden`).
- `src/components/Crosshair.astro` + `src/crosshair.ts` — the §M6 crosshair, `.sheet`'s first child (so `.sheet` is `position: relative`; find the inner frame by `.sheet__inner`, not `firstElementChild`); `tests/e2e/crosshair.spec.ts`.
- `src/theme.ts` — `THEMES`, `THEME_STORAGE_KEY`, `effectiveTheme`, `otherTheme`; the head script and the theme switch both read them.
- `src/components/SheetHeader.astro` — monogram, tabs (`aria-current="page"` from SheetLayout's `sheet` prop; project details pass `projects`, 404 none), utilities, and the phone sheet index (`[data-sheet-index]`: `<details>` without JS, its `<script>` swaps in the button + `#sheet-index-panel`); TWO theme buttons render (header + panel), both `[data-theme-switch]`, wired by one script; their label/name is switched by CSS, not JS (docs/RECORD.md 2026-10-04).
- `src/config.ts` `CV_PATH` — `public/michael-goldman-cv.pdf`, a committed copy of `docs/source/cv.pdf`; `tests/unit/cv.test.ts` fails when they differ (re-copy, never edit).
- `tests/e2e/header.spec.ts` — tabs per language, language switch, CV, tablet one-row; skipped below 768 px.
- `tests/e2e/sheet-index.spec.ts` — phone panel: open, navigate, Escape, focus trap (Chromium only), outside tap, no-JS `<details>`; skipped at ≥ 768 px.
- `src/components/TitleBlock.astro` — the footer (rendered by SheetLayout, sheet number from its `sheet` prop); captions from `ui.titleBlock`, contact from `profile.contact`, REV/SHEET formatters in `src/title-block.ts`; cells draw only left+top rules so 2 and 4 columns both stay ruled.
- `tests/e2e/sheet.spec.ts` — skip link, frame widths/grid, zone strip per viewport, stored theme applied.
- `tests/e2e/theme.spec.ts` — toggle + reload, dark system, storage blocked.
- `tests/e2e/accessibility.spec.ts` — every route × language (+ both 404s) × both themes: axe + one h1; keyboard walk (Tab order = DOM order of rendered tabbables, 2 px ring on each, Chromium only); phone panel by keyboard. `tests/unit/contrast.test.ts` — muted/redline vs paper from tokens.json.
- TRAP: Playwright `toHaveText(…, { useInnerText: true })` still includes `.sr-only` text (clip is not "not rendered"); assert the visible label `.sheet-header__theme-label:visible` instead.

## Sheet 01 — Overview

- `src/pages/[...lang]/index.astro` — composes the Overview panels; each panel is a component in `src/components/overview/`.
- `src/components/overview/Hero.astro` — label, name, role, intro, note, buttons; reads `profile.hero`; links via `sheetPath(key)` (src/i18n/routes.ts) + `localize`.
- `src/components/overview/Portrait.astro` — `<pre aria-hidden>` portrait + sr-only figcaption, dimension lines, callouts (absolute on desktop, a list < 768 px; the phone font size fills the width via `cqi`).
- `src/components/overview/HowIWork.astro` — four principles + AI note; panel labels come from `profile.labels` (docs/RECORD.md 2026-10-04).
- `src/components/overview/SpecNotes.astro` — SPECIFICATION table + GENERAL NOTES; side by side (notes column 380 px) at ≥ 1024, stacked below; S-06's `pending` in redline.
- `src/components/overview/InProgress.astro` — the IN PROGRESS rows, hrefs from `profile.current` through `localize`; `#optiecon` is the experience detail block; `#ckad` a placeholder `<div id>` in the certifications stub until PR-31 moves it onto the real card (never two).
- TRAP: Astro compresses the whitespace between two elements on separate lines; text that needs a space between spans needs `{' '}`. Symptom: h1 accessible name "MICHAELGOLDMAN".
- `tests/e2e/overview.spec.ts` — hero text, links (EN + NL), portrait text vs. its source file, callouts per viewport, 320 px.

## Sheet 02 — Experience

- `src/pages/[...lang]/experience.astro` — label + heading (`ui.experience`), the timeline, then the entries newest first: `ExperienceDetail` per role (numbered `02.n` from `SHEETS`), `ExperienceBreak` for the sabbatical; each block's id is the entry id (bar and Overview targets).
- `src/components/experience/Timeline.astro` — ruler, employer dimension (`profile.employers`), bars, durations, legend; positions as `--start`/`--span` %, left/width ≥ 1024 px and top/height (8 px a month) below — one markup.
- `src/dates.ts` — `formatMonth` / `formatSpan` with `ui.dates` words; the only place a `YYYY-MM` becomes `NOV 2023`.
- `src/timeline-motion.ts` — §M4 (lazy, GSAP): one sweep drives every bar, intro vs scrub, pin + scale cursor ≥ 1024×640; `src/scrub.ts` — `startScrub`, `data-scrub` states, `tokenEase`; `tests/e2e/experience-motion.spec.ts`.
- TRAP: GSAP's pin wraps `.timeline` in a `.pin-spacer` div; select the timeline by class, never as a direct child of `.experience-head`. Detail blocks get `scroll-margin-top: var(--timeline-pinned)` so a bar link lands clear of the pinned strip.
- `tests/e2e/experience.spec.ts` — timeline text, bar order/hrefs, scale (month positions) per orientation, bar click → block; detail block titles/dates/order, one column on phone.

## Sheet 03 — Projects

- `src/pages/[...lang]/projects/index.astro` — the register: non-`series` cards first, then the series line (`ui.projects.series`, count = series `tests` summed) and the `series: true` cards; 1 / 2 / 3 columns at phone / 768 / 1024.
- `tests/e2e/projects.spec.ts` — card order + hrefs (EN and NL), sheet strings, series heading, columns per viewport.
- `src/components/projects/ProjectCard.astro` — one register card (whole card one link, `data-project` = slug); flagship = `order: 1` spans 2 grid columns from 768 px; `in-progress` dashed with a redline label.
- `src/components/projects/MiniDiagram.astro` — per-slug layouts fed by the entry's `diagram` labels (`LABELS` = count per slug); a new project needs a layout here or the build throws.
- `src/components/drawing/Box.astro` `mini`/`main`, `Arrow.astro` `mini` — the card-sized variants; `/_primitives` shows all five cards (`tests/e2e/primitives.spec.ts`).
- `src/pages/[...lang]/projects/[slug].astro` — the detail template: head (back, label, title, summary, repo button, meta), FIG. 1 panel, SPECIFICATION beside FIG. 2 + note (≥ 1024 px), pager; figures are `[data-figure="1|2"]` `Figure`s whose drawings PR-25…29 put in the slot.
- `src/project-detail.ts` — `neighbours` (prev/next, wrapping) and `detailMeta` (period · SERIES PART n · status) for the detail sheets.
- `tests/e2e/project-detail.spec.ts` — all five slugs: label, title, repo href, meta, figure captions, note, pager hrefs, tab + footer; NL navigation; spec/FIG. 2 layout per viewport.
- `src/components/projects/DetailFigure.astro` — the FIG. 1/2 drawings per slug from `figures[n].labels` (`LABELS` = count per figure); a new project's figure needs a layout here or the build throws.
- `tests/unit/project-content.test.ts` `detail sheets` — each written sheet's title in `it.each` checks it against copy.md; the Subscription Tracker pyramid's counts must sum to `tests`.
- `src/components/projects/DetailFigure.astro` `CHAINS` — box→arrow→box rows (each arrow wrapped with its box); `.hexagon` (Journal) — TRAP: padding in %, it resolves against the row's width and squeezes the text to one word per line.
- `public/projects/scentify/` — Scentify's demo (animated WebP + first-frame still), paths in `SCENTIFY_DEMO` (`src/config.ts`); rebuild steps in docs/RECORD.md.
- `src/components/drawing/PipelineRoute.astro` — stations `<ol>`, last filled; Arrow `turns` = right ≥ 768 px, down below.
- TRAP: ProjectCard's lift shadow is its `::after` (clip-path), not `box-shadow`; a test checks `getComputedStyle(card, '::after').clipPath` (tests/e2e/primitives.spec.ts).
- TRAP: after adding a schema field with a `.default()`, a cached `node_modules/.astro/data-store.json` keeps entries without it; symptom: build "Cannot read properties of undefined" on that field. Delete the file and rebuild.

## Sheet 04 — Certifications

- `src/pages/[...lang]/certifications.astro` — label + heading + intro (`ui.certifications`), then a `CertCard` per entry in code order; 1 column, 2 from 768 px; heading capped at `11.5cqi` so INSPECTED and Dutch AFGETEKEND fit a 320 px phone.
- `src/components/certifications/CertCard.astro` — card id = entry id (`#ckad` is the Overview's target); the Stamp floats in the head with `shape-outside: circle()` so code/name/issuer wrap round it.
- TRAP: card names need `overflow-wrap: normal` — with DisplayHeading's `break-word` a word too long to sit beside a float is split ("PROFESSIO NAL") instead of dropping below it.
- `tests/e2e/certifications.spec.ts` — four cards, ids, stamps, three verify links (exact cv.md URLs), CKAD none; `brokenWords` helper catches mid-word heading breaks at 320/390 px.

## Sheet 05 — Education

- `src/pages/[...lang]/education.astro` — label + heading + intro (`ui.education`), then `.education__body` holding the assembly; parts are `education` entries by `item`.
- `src/assembly.ts` — plate geometry in drawing units (`layout`, `diamond`, `DEFAULT_PART`); pure, unit-tested.
- `src/components/education/ExplodedAssembly.astro` — plates (`.plate[data-part]`) and Balloon buttons (`.balloon__mark[data-part]`), both `aria-pressed`; sizes are `calc(n * var(--u))`, `--u` = min(1 px, column minus `--labels` over the drawing width).
- TRAP: `--u` uses `cqi`, so it must be declared below the `container-type` element (`.assembly__drawing`, not `.assembly`); on the container itself `cqi` resolves against the next container up.
- `src/assembly-motion.ts` — §M5 (lazy, GSAP): one progress drives the plates (`translate`, piled by `--drop`), axis, callouts and CKAD fade on the schedule `explode` (src/assembly.ts) writes into each plate's `data-move/-callout/-fade`; scrubbed only when the drawing is below the 80 % line at load on ≥ 768 px, else one 1.2 s play; `tests/e2e/education-motion.spec.ts`.
- TRAP: the explosion moves plates by the `translate` property and selection lifts them by `transform`; animating the explosion through `transform` would fight the lift's 250 ms transition. `tests/e2e/education.spec.ts` opens pages through `open()` (goto + `settleAnimations`), or its geometry checks run mid-explosion.
- `src/components/education/DetailPanel.astro` — one `<article id="part-n" data-selected>` per part; `@media (scripting: enabled)` hides the unselected, so without JS all five stack.
- `src/pages/[...lang]/education.astro` `<script>` — selection: one delegated click on `[data-education]` (`button[data-part]`, `tr[data-part]`), syncs aria-pressed/classes/panel, `#part-n` via `replaceState`, `hashchange`; sets `.assembly[data-active]` (dim + lift) on the first selection and `[data-ready]` (transitions) after a frame.
- TRAP: transitions on `.plate` must wait for `.assembly[data-ready]`; a stylesheet landing after a first style pass made the plates animate into their tilt on load (flaky e2e overlap, plates 329 px wide).
- `src/components/education/PartsList.astro` — a real `<table>`, 5 → 1; each row's PART cell is the `aria-pressed` button (`.parts-list__select[data-part]`); the page script makes the whole row clickable and previews the plate lift on hover.
- TRAP: at 320 px the four columns fit only with 11 px type and 6 px cell padding (≤ 767 px); a `nowrap` year or wider padding pushes the table past the frame.
- `tests/e2e/education.spec.ts` — sheet strings, five plates + balloons with names and pressed state, one axis without overlap, default detail, parts rows, layout per viewport, fits 320/390/768 px; selection by mouse/keyboard/hash, hover preview, wipe vs reduced motion, no-JS stacked.
