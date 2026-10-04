# BACKLOG-DONE.md

Finished tasks, moved here verbatim by `.orchestrator/prune-backlog.py`.
History, not a queue.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Foundation

- [x] **PR-1 Scaffold the Astro app and record the stack**
  - Done when: an Astro (latest stable) + TypeScript strict (`noUncheckedIndexedAccess`) static site exists at the repo root; npm scripts `dev` (port 4321), `build`, `preview` (port 4321), `typecheck` (`astro check && tsc --noEmit`), `lint` (ESLint flat config incl. astro + typescript plugins), `format:check` (Prettier with prettier-plugin-astro), `test` (Vitest, runs once), `test:e2e` (Playwright), `verify` (`typecheck && lint && format:check && test && build && test:e2e`); `.nvmrc` 22; `.gitignore` adds `dist`, `.astro`, `node_modules`, `test-results`, `playwright-report`, `.e2e`; `site` set to `https://michaelgoldman.dev` via one config constant; CLAUDE.md "Stack" lists every NOTES.md stack choice with installed versions ("(chosen)" for later ones); CLAUDE.md "Start the app for walking it" says `npm run dev` → http://localhost:4321; `npm run typecheck` and `npm run lint` pass.
  - Spec: NOTES.md "Stack preferences", SPEC §7
  - Out of scope: tests beyond an empty Vitest run (PR-2), styling, pages.

- [x] **PR-2 Set up Vitest, Playwright and axe**
  - Done when: Vitest with one passing smoke test; Playwright projects `chromium-desktop` (1440×900), `chromium-phone` (Pixel 7) and `webkit-iphone` (iPhone 14), `webServer` runs `npm run build && npm run preview` on 4321, traces on failure, output under `.e2e/`; `@axe-core/playwright` with a shared `expectNoAxeViolations(page)` helper (WCAG 2.2 AA tags); one passing e2e test loading `/`; `npm run verify` passes.
  - Spec: NOTES.md "Stack preferences", SPEC §7
  - Out of scope: real pages.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Foundation

- [x] **PR-3 Content collections and schemas**
  - Done when: `src/content/config.ts` defines `experience`, `projects`, `certifications`, `education`, `profile` exactly per SPEC §5 with zod, each entry carrying `lang: 'en' | 'nl'`; a build-time check (Vitest test over the collections) fails when any entry exists in one language but not the other, or a field is missing; placeholder minimal EN+NL entries exist so the build passes; every schema has `translated: boolean` (default true) — until PR-48–50, each EN content task also creates the NL twin with the English text and `translated: false`; tests cover the pairing check.
  - Spec: SPEC §3.6, §5
  - Out of scope: real copy (content tasks below).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Foundation

- [x] **PR-4 Design tokens to CSS and self-hosted fonts**
  - Done when: a script (`npm run tokens`, run by `build` and `dev`) generates `src/styles/tokens.css` from `design/tokens.json` with `:root` (paper) and `[data-theme="blueprint"]` values plus `@media (prefers-color-scheme: dark) :root:not([data-theme="paper"])`; Archivo (variable, wdth+wght), IBM Plex Sans and Mono (400/500/600) are self-hosted woff2 latin subsets with `font-display: swap` and preload for the two above-the-fold faces; `src/styles/base.css` sets body font, colours, focus ring and the `.sr-only` utility; a Vitest test asserts every token in tokens.json appears in tokens.css; no request leaves the site for fonts.
  - Spec: design/tokens.json, design/README.md rules 1–4, SPEC §6
  - Out of scope: components.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Foundation

- [x] **PR-5 i18n routing and string helper**
  - Done when: Astro i18n with `en` default at `/` and `nl` at `/nl/`; a `t(lang)`/`getEntry`-based helper returns content for the current language; `alternate(lang, path)` returns the same page in the other language; unit tests for both; a stub page exists for every route in SPEC §4 in both languages (empty sheets with an h1) so later tasks fill them.
  - Spec: SPEC §1.4, §3.6
  - Out of scope: Dutch copy (PR-60).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet chrome

- [x] **PR-6 SheetFrame and SheetLayout**
  - Done when: `SheetLayout.astro` renders desk background → sheet (paper + 16/80 px grid) with the double frame and the desktop zone strip 1–8, slots for header, main and footer, a skip link "Skip to sheet content", `<html lang>` per language, and the theme-init inline head script (SPEC §3.3, no flash); every stub page uses it; matches the frame in `design/screens/overview-default-light-1440.png`; e2e: skip link focuses main.
  - Spec: SPEC §3.1, §3.3; design/components.md SheetFrame, SkipLink; design/screens/html/overview-default-light-1440.html
  - Out of scope: header contents (PR-7), footer (PR-9), motion.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet chrome

- [x] **PR-7 SheetHeader with tabs (desktop/tablet)**
  - Done when: monogram cell + five tabs exactly as drawn, active tab ink-filled with `aria-current="page"` (project detail pages mark tab 03), hover underline, utilities cluster (EN/NL links via `alternate()`, theme button placeholder, CV link to `/michael-goldman-cv.pdf` with the PDF copied from `docs/source/cv.pdf` into `public/`); e2e: every tab navigates to its route in both languages and the correct tab is current.
  - Spec: SPEC §3.2, §3.5; design/components.md SheetHeader/SheetTab; design/copy.md Global
  - Out of scope: phone panel (PR-8), theme behaviour (PR-10).

- [x] **PR-8 Phone sheet index panel**
  - Done when: below 768 px the header shows monogram + current sheet name + `SHEETS` button; the panel lists the five sheets, language, theme, CV; opens/closes with a clip-path wipe (250 ms), closes on Escape/selection/outside tap, traps focus and returns it to the button; `aria-expanded`/`aria-controls` correct; works without JS as a `<details>` fallback; e2e on chromium-phone covers open, navigate, Escape.
  - Spec: SPEC §3.2; design/components.md SheetIndexPanel
  - Out of scope: desktop header.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet chrome

- [x] **PR-9 TitleBlock footer**
  - Done when: footer title block as drawn (PROJECT ×2, SCALE, SHEET nn / 05, DRAWN, CHECKED 251 TESTS, REV = build year.month, CONTACT email/LinkedIn/GitHub) on every page; 2 columns on phone; sheet number correct per page (project details "03 / 05"); unit test for the REV formatter.
  - Spec: SPEC §3.2; design/components.md TitleBlock; design/copy.md Global
  - Out of scope: anything else in the footer.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet chrome

- [x] **PR-10 Paper / Blueprint theme switch**
  - Done when: the theme button toggles `data-theme` between paper and blueprint, persists in localStorage (try/catch), follows the system until toggled, labels/aria-labels per copy.md; blueprint values from tokens render correctly on every stub page; axe passes in both themes; e2e covers toggle + reload persistence + system preference.
  - Spec: SPEC §3.3; design/README.md rule 10; design/tokens.json
  - Out of scope: the circular reveal animation (PR-46).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet chrome

- [x] **PR-11 Shared drawing primitives**
  - Done when: Astro components `SheetLabel`, `DisplayHeading` (xl/l/m/s), `Button` (primary/secondary with hover wipe), `Link` (external ↗ variant), `DimensionLine` (h/v), `Balloon` (+leader; default/active/pending; renders as button/link/span), `RevisionNote`, `SpecRow`, `Figure`/`Box`/`Arrow`, `Stamp`, `Chip` exist per design/components.md, all decoration `aria-hidden`; a `/_primitives` dev-only page (excluded from build/sitemap) shows every variant in both themes; Playwright screenshot test of that page exists (not asserted against PNGs).
  - Spec: design/components.md; design/screens/html/*.html (class vocabulary)
  - Out of scope: page compositions.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 01 — Overview

- [x] **PR-12 Profile content (EN)**
  - Done when: the `profile` EN entry holds every Sheet 01 string from design/copy.md (hero, buttons, dimensions, balloons, how I work + AI note, S-01…S-07, general notes, in-progress items, contact) verbatim; the ASCII portrait is loaded from `docs/source/ascii-portrait.txt` at build time (single source); Vitest asserts the content matches copy.md for the hero and spec rows.
  - Spec: design/copy.md Sheet 01; SPEC §3.6, §3.7
  - Out of scope: NL (PR-60).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 01 — Overview

- [x] **PR-13 Overview hero and portrait**
  - Done when: `/` renders the hero exactly as `design/screens/overview-default-light-1440.png` (label, MICHAEL/GOLDMAN display-xl, rule + role line, intro, revision note, VIEW PROJECTS and DOWNLOAD CV buttons) and the portrait block (`<pre aria-hidden>` portrait + sr-only text, horizontal and vertical dimension lines, balloons 1–3 with leaders; balloon 1 links to /certifications); phone layout per design/README.md "Responsive" (balloons become a numbered list under the portrait); e2e checks text, links and no horizontal scroll at 320 px.
  - Spec: SPEC §4.1; design/screens/html/overview-default-light-1440.html
  - Out of scope: motion (PR-41).


## Pruned from the queue

3 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 01 — Overview

- [x] **PR-14 Overview "How I work" panel**
  - Done when: a panel below the hero (split by 1 px ink rule, label `HOW I WORK`) shows the four numbered principles as a 4-column drawing grid (2 on tablet, 1 on phone) in the drawing language (numbers as mono `01`–`04` in line colour, display-s titles, body text), plus the mono AI note beneath; no rounded corners, no icons; e2e asserts the four titles.
  - Spec: SPEC §4.1; design/copy.md "How I work"; design/README.md
  - Out of scope: other panels.

- [x] **PR-15 Overview specification and general notes**
  - Done when: the two-panel row as drawn: SPECIFICATION S-01…S-07 (S-06 Kubernetes in redline) and GENERAL NOTES 1–6; stacks on phone; e2e asserts all rows.
  - Spec: SPEC §4.1; design/screens/overview-default-light-1440.png
  - Out of scope: motion.

- [x] **PR-16 Overview "In progress" strip**
  - Done when: a panel labelled `IN PROGRESS` lists the three current items as rows (redline ◐ marker, text, → link to the target anchor/page), above the title block; links resolve (anchors exist or are added as ids by their page tasks — if a target page is still a stub, the id is added there now); e2e follows each link.
  - Spec: SPEC §4.1; design/copy.md "Current work"
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 02 — Experience

- [x] **PR-17 Experience content (EN)**
  - Done when: `experience` EN entries for OptieCon, sabbatical, DJI, LinkPizza with every field from design/copy.md verbatim (ids optiecon, sabbatical, dji, linkpizza; start/end YYYY-MM); Conspect employer line in profile or a small `employers` field; Vitest checks dates and ordering.
  - Spec: design/copy.md Sheet 02; SPEC §5
  - Out of scope: NL.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 02 — Experience

- [x] **PR-18 Timeline maths**
  - Done when: a pure module computes, from start/end months and a ruler range (Jan 2021 – Jan 2027 derived from the data, end extended to the next January after today's build date), each bar's left %/width % and the duration label ("2 Y 8 M"); "now" uses the build date; Vitest covers LinkPizza 1.4%/44.4%, DJI 50%/33.3%, sabbatical 83.3%/6.9%, OptieCon start 90.3%, and duration rounding.
  - Spec: SPEC §4.2
  - Out of scope: rendering.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 02 — Experience

- [x] **PR-19 Experience timeline drawing**
  - Done when: `/experience` shows label, heading and the timeline as drawn (ruler, Conspect dimension line, bars with links to `#<id>`, hatched sabbatical with caption, open-ended OptieCon, duration dimensions) using PR-18; on phone the timeline is vertical (years down the left, bars as vertical segments) with the same information; e2e clicks a bar and lands on its detail.
  - Spec: SPEC §4.2; design/screens/html/experience-default-light-1440.html; design/components.md TimelineRuler/TimelineBar
  - Out of scope: scroll motion (PR-43).

- [x] **PR-20 Experience detail blocks**
  - Done when: detail blocks 02.1 OptieCon, 02.2 DJI, 02.3 LinkPizza (+ small hatched sabbatical block between 02.1 and 02.2) exactly as drawn, newest first, with ids, DJI revision note, stack lines, Conspect employer line; stacks to one column on phone; e2e asserts each block's title and dates.
  - Spec: SPEC §4.2; design/copy.md Sheet 02; design/components.md ExperienceDetail
  - Out of scope: motion.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 03 — Projects

- [x] **PR-21 Project content (EN) — register fields**
  - Done when: `projects` EN entries for the five projects with slug, code, order, title, summary, period, status, repo URL, tests, the three card facts, and kind label from design/copy.md; Vitest asserts tests sum to 251 for P-02..P-04 and Jamigos has no live URL anywhere.
  - Spec: design/copy.md Sheet 03; docs/source/research-repos.md; SPEC §3.7
  - Out of scope: detail fields (PR-25…).


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 03 — Projects

- [x] **PR-22 ProjectCard and mini diagrams**
  - Done when: `ProjectCard` per design/components.md (flagship spanning 2 columns, in-progress dashed variant, title-block strip, whole card one link, hover/focus lift) with a per-project mini diagram component (Jamigos container chain, Scentify 4 questions → 52 scents, Subscription Tracker 3 stacked layers, Recipe Book OpenAPI ↓ generates → Recipe ⟶ Steps, Journal hexagon) built from `.box` HTML; `/_primitives` shows all five.
  - Spec: SPEC §4.3; design/screens/html/projects-default-light-1440.html
  - Out of scope: page layout (PR-23).
  - Note (PR-21): the drawn Jamigos card tag `SECURITY · CI/CD` has no copy.md string and no schema field — see docs/RECORD.md 2026-10-04.

- [x] **PR-23 Projects register page**
  - Done when: `/projects` shows label, heading, intro, row 1 (Jamigos wide + Scentify), the series assembly line with `251 TESTS · ALL TEST-FIRST`, row 2 (P-02, P-03, P-04) exactly as drawn; 1 column on phone, 2 on tablet; every card links to `/projects/<slug>`; e2e asserts five cards and their links.
  - Spec: SPEC §4.3; design/screens/projects-default-light-1440.png
  - Out of scope: detail pages.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 03 — Projects

- [x] **PR-24 Project detail template**
  - Done when: `/projects/[slug]` (static paths from the collection, both languages) renders back link, label `DETAIL SHEET 03.n — P-0n`, title, summary, repo button, meta line, a FIG. 1 slot, specification rows, a FIG. 2 slot, revision note, previous/next links (wrapping), header tab 03 active, footer SHEET 03 / 05; matches `project-detail-jamigos-default-light-1440.png` structure; e2e visits all five slugs.
  - Spec: SPEC §4.4; design/screens/html/project-detail-jamigos-default-light-1440.html
  - Out of scope: per-project figures (PR-25…29).

- [x] **PR-25 Jamigos detail sheet**
  - Done when: Jamigos detail content (summary, meta, spec rows, note) from copy.md; FIG. 1 container view and FIG. 2 PipelineRoute exactly as drawn; no live link; e2e asserts figures and repo link `https://github.com/mikebg95/jamigos`.
  - Spec: design/copy.md 03.1; docs/source/research-repos.md P-01
  - Out of scope: other projects.


## Pruned from the queue

4 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 03 — Projects

- [x] **PR-26 Subscription Tracker detail sheet**
  - Done when: content from copy.md 03.2 plus 5–6 spec rows written from research-repos.md P-02 and the repo (layering, JDBC/JdbcTemplate, Flyway incl. the case-insensitive index, code-first OpenAPI, RFC 9457 errors, tests); FIG. 1 layers, FIG. 2 test pyramid with the real per-level counts read from the repo (sum 63); e2e asserts 63.
  - Spec: design/copy.md 03.2; github.com/mikebg95/subscription-tracker
  - Out of scope: other projects.
  - Note (PR-25): figure words go in `figures[n].labels`, layouts in `src/components/projects/DetailFigure.astro`; add the title to the `detail sheets` test in tests/unit/project-content.test.ts (docs/RECORD.md 2026-10-04).

- [x] **PR-27 Recipe Book detail sheet**
  - Done when: content from copy.md 03.3 plus spec rows from research-repos.md P-03 (aggregate, SEQUENCE ids, @Version + 409, open-in-view off, summary projection, deferrable constraints, ArchUnit, 109 tests); FIG. 1 design-first flow, FIG. 2 aggregate drawing; e2e asserts 109.
  - Spec: design/copy.md 03.3; github.com/mikebg95/recipe-book
  - Out of scope: other projects.

- [x] **PR-28 Journal detail sheet**
  - Done when: content from copy.md 03.4 plus spec rows from research-repos.md P-04 (hexagonal packages, rich domain model, Spring AI with graceful degradation, MapStruct, optimistic locking, ArchUnit, 79 tests); FIG. 1 ports & adapters hexagon (CSS clip-path hexagon + boxes), FIG. 2 the 7 ADR titles read from the repo's `docs/architecture/adr/`, each linking to the ADR on GitHub; status "in progress" styling (redline); e2e asserts 7 ADR links.
  - Spec: design/copy.md 03.4; github.com/mikebg95/journal
  - Out of scope: other projects.

- [x] **PR-29 Scentify detail sheet**
  - Done when: content from copy.md 03.5 plus spec rows (Android, Java, Activities, custom ArrayAdapter, catalogue of 52, limitations noted honestly); FIG. 1 question flow; FIG. 2 the demo GIF copied from the repo into `public/projects/scentify/` (optimised; `loading="lazy"`, width/height set, alt text, caption, source credited) — paused (static first frame) under reduced motion; e2e asserts the image and caption.
  - Spec: design/copy.md 03.5; github.com/mikebg95/Scentify
  - Out of scope: other projects.
  - Note (PR-24): the meta line is composed by `detailMeta` (src/project-detail.ts) and cannot produce copy.md's `· ANDROID`; add it without hard-coding the slug (docs/RECORD.md 2026-10-04).


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 04 — Certifications

- [x] **PR-30 Certification content (EN)**
  - Done when: `certifications` EN entries C-01…C-04 from copy.md with exact verify URLs from docs/source/cv.md (CKAD none); Vitest asserts URLs and statuses.
  - Spec: design/copy.md Sheet 04; docs/source/cv.md
  - Out of scope: NL.

- [x] **PR-31 Certifications page**
  - Done when: `/certifications` as drawn: label, heading, intro, 2×2 CertCards with Stamp (verified/pending), skill chips, verify links (external ↗); 1 column on phone; ids `spring`, `psm`, `oca`, `ckad`; e2e asserts four cards and three verify links.
  - Spec: SPEC §4.5; design/screens/html/certifications-default-light-1440.html
  - Out of scope: stamp motion (PR-47).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 05 — Education

- [x] **PR-32 Education content (EN)**
  - Done when: `education` EN entries for parts 1–5 with every field and detail panel text from copy.md; Vitest asserts ordering and that part 3 has three sub-rows totalling 30 EC.
  - Spec: design/copy.md Sheet 05
  - Out of scope: NL.


## Pruned from the queue

3 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Sheet 05 — Education

- [x] **PR-33 Exploded assembly (static)**
  - Done when: `/education` renders label, heading, intro and the isometric exploded assembly as drawn (5 plates, CS50 smaller, CKAD dashed redline, centre axis, balloons + leaders), with vertical spacing so plates don't overlap beyond their thickness; scales to width on phone; plates/balloons are buttons with accessible names; e2e asserts five parts.
  - Spec: SPEC §4.6; design/screens/html/education-default-light-1440.html; design/components.md ExplodedAssembly
  - Out of scope: selection (PR-35), scroll motion (PR-44).

- [x] **PR-34 Parts list and detail panel**
  - Done when: DetailPanel (default part 3) and PartsList table exactly as drawn, rows as buttons (`aria-pressed`), pending row in redline; panel stacks below assembly on phone/tablet; e2e asserts default detail and table rows.
  - Spec: SPEC §4.6; design/components.md PartsList, DetailPanel
  - Out of scope: interaction (PR-35).

- [x] **PR-35 Part selection**
  - Done when: clicking/Enter/Space on a plate, balloon or row selects that part: plate lifts 12 px and fills, others dim to 60%, row highlights, panel content swaps (clip-path wipe 250 ms; instant under reduced motion), URL hash `#part-n` updates and is honoured on load; without JS all five details render stacked (progressive enhancement); hover on a row previews the lift; e2e covers mouse, keyboard and hash.
  - Spec: SPEC §4.6; design/motion.md §M5
  - Out of scope: scroll-scrubbed explode (PR-44).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### 404 and SEO

- [x] **PR-36 404 sheet**
  - Done when: `/404` and `/nl/404` per SPEC §3.9 / §4.7 and copy.md, built from the sheet primitives, listing the five sheets; static host config notes in docs/REPO-MAP.md; e2e visits an unknown URL in preview and gets this sheet.
  - Spec: SPEC §3.9, §4.7
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### 404 and SEO

- [x] **PR-37 SEO metadata, sitemap, robots, JSON-LD**
  - Done when: per-page title/description from copy.md SEO table (NL from content), canonical, hreflang en/nl/x-default, sitemap.xml (both languages, excluding `/_primitives` and 404), robots.txt, JSON-LD Person on `/` (no phone/address); a Vitest/e2e test parses each built page's head and asserts all of it.
  - Spec: SPEC §3.8; design/copy.md SEO
  - Out of scope: OG images (PR-38).


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### 404 and SEO

- [x] **PR-38 Open Graph images**
  - Done when: a build step renders a 1200×630 PNG per sheet and per project in both languages (mini sheet: frame, grid, sheet label, display heading, small title block with michaelgoldman.dev) using satori/resvg or Playwright at build time; og:image and twitter:card tags point at them; test asserts every page has an existing og:image file of 1200×630.
  - Spec: SPEC §3.8; design/README.md "Not drawn"
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-39 Motion foundation**
  - Done when: an inline head script adds `js` to `<html>`; CSS custom properties for the three easings and durations; a tiny `motion.ts` with `reveal()` (IntersectionObserver, threshold 0.2, once, `data-reveal="ink|rise|wipe|stamp|draw|cards"`, stagger via `data-reveal-delay`), a sessionStorage first-visit flag (try/catch), and global guards so reduced motion and no-JS show final states; documented in `docs/conventions/motion.md` and indexed in CLAUDE.md; Playwright tests: reduced motion → no element with opacity < 1 or non-none clip-path after load; JS disabled → all content visible.
  - Spec: design/motion.md principles, §M3
  - Out of scope: the specific animations.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-40 Crosshair**
  - Done when: the drafting crosshair per design/motion.md §M6 on every sheet: dashed redline hairlines + "X 0000 · Y 0000" readout in sheet coordinates, rAF-throttled, `pointer-events: none`, `aria-hidden`, only for `(hover: hover) and (pointer: fine)`, off under reduced motion; ported from the preview's script; e2e asserts it appears on mouse move (desktop) and is absent on phone.
  - Spec: design/motion.md §M6; design/screens/html/motion-preview.dc.html
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-41 First-load plotting — Sheet 01**
  - Done when: the full §M1 timeline on `/` ported from `design/screens/html/motion-preview.dc.html` (frame draw, grid, header stagger, active tab fill, headline plotter wipe, rule/role/intro, portrait line scan, dimension lines, leaders + balloons, revision note stamp) with identical durations/delays/easings; plays only on the session's first page view; text readable within 1.3 s (e2e measures); reduced motion → final state.
  - Spec: design/motion.md §M1
  - Out of scope: other sheets (PR-42).


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-42a First-load plotting — other sheets**
  - Done when: the short first-load variant on sheets 02–05, project details and 404 (frame, grid, header, heading wipe ≤ 1.2 s).
  - Spec: design/motion.md §M1 (other sheets)
  - Out of scope: timeline, exploded view, stamps, theme switch.

- [x] **PR-42b Scroll reveals everywhere + count-ups**
  - Done when: §M3 reveals applied across all pages (spec/table rows ink in with rule draw, section labels wipe, below-fold headings wipe, revision notes stamp, figures' boxes then arrows draw in data-flow order, cards rise staggered); counts (tests, durations) count up once; e2e: after scrolling to the bottom every element is in its final state.
  - Learned (PR-42a): no component carries `data-reveal` yet — add it at call sites (SheetLabel, DisplayHeading, RevisionNote, SpecTable, Figure spread their props). Hero elements are `data-plot` (plotting.css) and Sheet 01's `.hero` is plotting-overview.css: never give those a `data-reveal` too. Other-sheet content right under the hero (timeline, cards, FIG. 1, assembly) is visible at load, so its reveal plays at load.
  - Spec: design/motion.md §M3, §M6 numbers
  - Out of scope: timeline, exploded view, stamps, theme switch.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-43 Experience timeline scroll animation**
  - Done when: §M4 with GSAP ScrollTrigger lazy-loaded only on `/experience`: ruler draws with ticks, bars extrude scrubbed to scroll, durations count with the bar, hatching slides, OptieCon arrow pulses twice, sticky timeline with scale cursor on desktop ≥ 1024 marking the role in view; no stickiness on phone; reduced motion → final state; JS weight budget respected; e2e scrolls and asserts final widths.
  - Spec: design/motion.md §M4
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-44 Education exploded-view scroll animation**
  - Done when: §M5: starts assembled (6 px gaps, balloons hidden), explodes scrubbed by scroll (top plate first, axis draws, leaders + balloons appear as plates arrive, CKAD dashed outline fades in last); phone plays a one-off 1.2 s timeline on enter; selection (PR-35) keeps working at any scroll position; reduced motion → exploded final state; e2e scrolls through and asserts final positions.
  - Spec: design/motion.md §M5
  - Out of scope: —


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-45 Sheet-to-sheet View Transitions**
  - Done when: §M2: cross-document view transitions enabled; frame, header and title block keep shared names and stay put; the active-tab fill slides between tabs; content leaves up/fades (180 ms) and enters from below (320 ms); project card title + mini diagram morph into the detail heading + FIG. 1 (per-slug names, unique per page); no transition under reduced motion; graceful in browsers without support; e2e (chromium) navigates between sheets without console errors and with `document.startViewTransition`/`@view-transition` present.
  - Spec: design/motion.md §M2
  - Out of scope: theme switch.

- [x] **PR-46 Theme switch reveal**
  - Done when: §M7 circular clip-path reveal from the theme button via `document.startViewTransition` (500 ms, ease-plot); instant fallback; reduced motion instant; e2e toggles twice without errors.
  - Spec: design/motion.md §M7
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Motion

- [x] **PR-47 Micro-interactions**
  - Done when: §M6 small interactions: button ink-wipe hover, tab underline draw, card lift + mini-diagram arrow redraw, stamps slam in sequence with ink bleed on Sheet 04, CKAD dashed stamp ring rotating (the only infinite animation, paused under reduced motion), balloon hover scale, PipelineRoute travelling dot on Jamigos; all focus-visible equivalents for keyboard users; no layout-affecting properties animated (lint rule or test grepping CSS for animated width/height/top/left).
  - Spec: design/motion.md §M6; design/components.md
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Dutch

- [x] **PR-48 Dutch translation — profile, global, SEO**
  - Done when: NL `profile` entry and all global/header/footer/SEO strings translated per SPEC §3.6 (natural Dutch, "je", English tech terms); `/nl/` renders fully in Dutch; the language switch on every page goes to the same page; e2e asserts `/nl/` hero text is Dutch and `<html lang="nl">`.
  - Spec: SPEC §1.4, §3.6; design/copy.md Sheet 01, Global, SEO
  - Out of scope: other collections.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Dutch

- [x] **PR-49 Dutch translation — experience and certifications**
  - Done when: NL entries for every experience and certification entry; dates as "jun 2026"; `/nl/experience` and `/nl/certifications` fully Dutch; pairing test passes.
  - Spec: SPEC §3.6
  - Out of scope: —

- [x] **PR-50 Dutch translation — projects and education**
  - Done when: NL entries for all five projects (register + detail fields) and five education parts; `/nl/projects/*` and `/nl/education` fully Dutch; pairing test passes; a test greps the built `dist/nl/**` for a list of English UI words from copy.md Global (e.g. "Skip to sheet content", "Overview") and finds none; a test asserts no content entry has `translated: false`.
  - Spec: SPEC §3.6
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-51 Accessibility pass**
  - Done when: axe passes (0 violations) on every route × both languages × both themes × desktop and phone; keyboard walk e2e: tab order logical on each page, every interactive element reachable and visibly focused, phone panel trap works; one h1 per page; contrast of muted/redline on paper and blueprint ≥ 4.5:1 (unit test computing it from tokens).
  - Spec: SPEC §7
  - Out of scope: new features.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-52 Performance budget**
  - Done when: Lighthouse CI (`@lhci/cli`, mobile preset, against `npm run preview`) runs on `/`, `/experience`, `/projects/jamigos`, `/education`, `/nl/` with assertions perf ≥ 0.95, a11y = 1, best-practices = 1, SEO = 1; a size test asserts each page's JS ≤ 60 KB gz and fonts preloaded only where used; fixes whatever fails; `lhci` added to `verify`.
  - Spec: SPEC §7
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-53 Responsive pass 320–2560**
  - Done when: Playwright visits every route at 320, 390, 768, 1024, 1440 and 2560 px wide and asserts no horizontal page scroll, no overlapping text (bounding-box check on headings/labels), tables scroll inside their framed box; screenshots saved as artifacts; fixes applied.
  - Spec: design/README.md "Responsive"; SPEC §7
  - Out of scope: —


## Pruned from the queue

3 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-60 Content pass: wire the new briefing, then the Overview hero**
  - Michael, 2026-10-04: *"the orchestrator who built it didn't know all the info about me … many of the texts don't showcase everything accurately or good enough."* PR-60 to PR-66 are a recruiter-eye content pass (target: medior/senior Java roles around Amsterdam, backend-first with a full-stack profile, growing into DevOps). Layout, styling and motion stay exactly as they are. New facts are in `docs/source/briefing.md`; DJI limits are in `docs/source/private/briefing-private.md` (local only — never quote it, never commit it). For every task in this pass: update `design/copy.md` first (it wins on wording), then the EN and NL YAML; Dutch per SPEC §3.6.
  - Done when: SPEC §3.7 and CLAUDE.md list `docs/source/briefing.md` (and the private file, as "local only") as fact sources; on Sheet 01 — role line `Java software engineer — backend-first, full-stack, building towards DevOps.`; intro `Five years of Java backends — Spring Boot, Spring and Jakarta EE on PostgreSQL — with Angular, Vue and JSF frontends: for an influencer-marketing platform, a government agency and a consultancy's own product. I design the system before I build it, write the test before the code, and take what I build from first design to handover.` (the current intro overclaims Spring Boot for all five years and claims production for work that never reached it; "scale-up" is not in the sources); dimensions `5+ YRS JAVA · FULL-STACK` / `SPRING · JAKARTA EE`; balloon 2 `Dutch & English native` (the seven languages stay in General notes); revision note `REV. NOTE △ Every project in my Spring series started as a drawing: requirements, a C4 model, a database schema and an API contract. Then the tests. Then the code.` (Jamigos and Scentify did not); SEO descriptions — `/`: `Java software engineer in Amsterdam: Spring Boot and Jakarta EE backends with Angular and Vue frontends, secure by design and test-first. Moving into Kubernetes and DevOps.`, `/experience`: `Five years of full-stack Java — at LinkPizza, then for Conspect at DJI and on OptieCon — drawn to scale.`; NL twins faithful; screenshots of Sheet 01 at 390 and 1440 in both themes show nothing overflowing (if a string is too long, shorten the wording, never the layout); all tests green.
  - Spec: SPEC §3.6, §3.7, §4.1; design/copy.md Sheet 01 + SEO; docs/source/briefing.md
  - Out of scope: `<title>` strings (PR-58); How I work and Specification (PR-61, PR-62); the AI note; any component or CSS change.

- [x] **PR-61 Content pass: "How I work" with proof from real jobs**
  - Michael, 2026-10-04: the four cards read as claims; a recruiter wants each backed by something he did at work, not only in side projects. "Own it to production" is false for DJI (see the private briefing).
  - Done when: the four cards read (EN, same voice, tighter is fine if the facts stay): 1 **Design before build** — `Requirements, a C4 model, a database schema and an API contract come first, with the trade-offs written down as decision records. Then the code follows the drawing — in every project of my Spring series, and for the authentication and frontend I designed at DJI.` · 2 **Test first** — `The test comes before the code: unit, slice, integration against real databases with Testcontainers, and architecture rules with ArchUnit. TDD with JUnit and Mockito in my day-to-day work at DJI; 251 hand-written tests across my Spring series.` · 3 **Secure by design** — `Sign-in and permissions are where I go deepest: Microsoft Entra ID single sign-on at OptieCon, JWT authentication and authorisation at DJI, Keycloak with OAuth2 / OIDC in Jamigos — and tests that prove it, like the ~30 security tests at OptieCon.` · 4 title **Own it end to end** (NL `Eigenaar van begin tot eind`) — `At DJI I was the only developer on a new application inside a running system: from first design to knowledge sessions and a thorough handover. At LinkPizza I took the Media Kit from concept to the version that is still in use. Docker and CI/CD pipelines I build in my own projects; Kubernetes is next.`; the AI note stays exactly as it is — never add a line saying this site was built by AI agents (Michael, 2026-10-04: leave that out); NL twins; no card claims production, CI/CD or deployment at DJI; Sheet 01 screenshots at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 01 "How I work"; docs/source/briefing.md; docs/source/private/briefing-private.md
  - Out of scope: card layout and styling; the AI note.

- [x] **PR-62 Content pass: Specification rows match the CV and the market's keywords**
  - Michael, 2026-10-04: Spring itself, Spring MVC, JAX-RS, WildFly, SQL and Bitbucket are on his CV but missing here; "Java 21 · Spring Boot 3" undersells (he works with Java 17–26 and Spring Boot 3 and 4); recruiters search for "TDD", not "Test-first". Keep DDD.
  - Done when: S-01 BACKEND `Java 17 / 21 / 25+ · Spring Framework · Spring Boot 3 & 4 · Spring MVC · Jakarta EE · JAX-RS · WildFly · REST · OpenAPI · Maven`; S-02 SECURITY unchanged; S-03 DATA `PostgreSQL · SQL · JPA / Hibernate · Spring Data JPA · JDBC / JdbcTemplate · Flyway · MongoDB`; S-04 TESTING `TDD · JUnit · Mockito · Testcontainers · ArchUnit · Unit & integration tests`; S-05 FRONTEND `Angular · Vue · TypeScript · JSF / PrimeFaces · HTML / CSS`; S-06 DEVOPS `Docker · Docker Compose · GitHub Actions · CI/CD · Git · GitLab · Bitbucket` + the redline `Kubernetes — CKAD in progress`; S-07 DESIGN `Layered & hexagonal architecture · DDD · Clean code · C4 models · ADRs · Design-first APIs`; only if it fits the existing table without a layout change at 390 and 1440, add S-08 WAY OF WORKING `Scrum (PSM I) · Agile DevOps teams · Code review · Knowledge sessions` — otherwise skip S-08 and say so in the commit; every item traceable to `cv.md`, `briefing.md` or a repo; NL twin; tests green.
  - Spec: design/copy.md Sheet 01 Specification; docs/source/cv.md TECHNICAL SKILLS; docs/source/briefing.md
  - Out of scope: General notes and In progress (they are fine).


## Pruned from the queue

3 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-63 Content pass: Experience texts — accurate claims, more substance**
  - Michael, 2026-10-04: the DJI revision note is false (read the private briefing); "I own its security end to end" overstates OptieCon; the LinkPizza Media Kit bullet hides the backend work, and LinkPizza is where his code went through a real CI/CD pipeline to production — the strongest honest production proof he has.
  - Done when: **OptieCon** context ends `I built its sign-in and security layer.` (not "own its security end to end"); stack says `Microsoft Entra ID`. **DJI** note `REV. NOTE △ The only developer on a new application inside a running system — from first design to knowledge sessions and a thorough handover.`; nothing on the DJI block says production, go-live, empty repository or greenfield, and no detail goes beyond `cv.md`. **LinkPizza** context `Influencer-marketing platform, team of 3–4 developers. A JSF monolith on WildFly being migrated to Quarkus microservices on Kubernetes; every change went from Bitbucket through Jenkins pipelines to WildFly test and production servers.`; Media Kit bullet uses the CV wording `…Developed the Angular frontend and much of the backend: business logic, data access and REST endpoints (JAX-RS). When the company stayed on JSF, rebuilt the frontend in JSF/PrimeFaces; it is still in use. Also shaped its concept and design.`; stack adds `Jenkins`; never imply he built the pipeline or the Quarkus services. NL twins; Sheet 02 screenshots at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 02; docs/source/cv.md; docs/source/briefing.md; docs/source/private/briefing-private.md
  - Out of scope: the timeline drawing, dates and durations.

- [x] **PR-64 Content pass: project sheets — honest labels and finished-vs-planned in the right tense**
  - Michael, 2026-10-04: Jamigos' "Capacitor builds for iOS and Android" presents AI-generated work as his (his README says so); Journal's card says it has an AI step that is only planned; Scentify was not built at the end of the minor; "FLAGSHIP" oversells a deliberately minimal practice app.
  - Done when: **Jamigos** — kind `FULL-STACK` (NL `FULL-STACK`) instead of FLAGSHIP; card summary `A full-stack app built to practise security and delivery: Keycloak sign-in, roles, ownership checks and audit logging, tested on Testcontainers and shipped by its own GitHub Actions pipeline.`; FRONTEND row `Vue 3, Pinia, Vite and keycloak-js, signing in with OIDC + PKCE. The mobile build, the frontend unit tests and a later UI restyle were AI-generated and are labelled that way in the README.`; DELIVERY row `GitHub Actions builds and tests only what changed, pushes Docker images to GHCR and deployed three services — frontend, backend and Keycloak — to Render. Local, dev, test and prod profiles; Docker Compose for local work.`. **Journal** — card summary `Hexagonal architecture, a rich domain model and 7 written design decisions. The AI step that summarises each entry is designed and comes next.`; detail summary in a tense that matches its status (`…designed so that one AI call turns each entry into…`). **Scentify** — card summary `My first real app: an Android fragrance recommender in Java, built during a year of self-study before my first developer job.`. NL twins; no project text presents AI-generated work as his or planned work as built; screenshots of Sheet 03 and detail sheets 03.1, 03.4, 03.5 at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 03; docs/source/research-repos.md; docs/source/briefing.md; the repos' READMEs
  - Out of scope: figures and diagrams; Subscription Tracker and Recipe Book (accurate as they are).

- [x] **PR-65 Content pass: Education closes the gap between the minor and the first job**
  - Michael, 2026-10-04: a recruiter reading 2018 minor → 2019 BSc → 2021 first job sees an unexplained gap; the self-study year that produced Scentify fills it.
  - Done when: the Minor Programming detail body (part 3) ends with `In 2020 I spent a year teaching myself Java and Android — Scentify (P-05) is from then — and in 2021 I started at LinkPizza.` (or the same facts, tighter); NL twin; the Sheet 05 detail panel at 390 and 1440 shows no overflow; tests green.
  - Spec: design/copy.md Sheet 05; docs/source/briefing.md
  - Out of scope: the exploded view, the parts list, adding a new part.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-66 Content pass: a guard test so the corrected claims stay corrected**
  - Michael, 2026-10-04: later tasks (PR-54 facts audit included) must not reintroduce what PR-60–65 removed.
  - Done when: a Vitest test reads the EN and NL content YAML (and copy.md) and fails if — the profile says "five years of Spring Boot" / "vijf jaar Spring Boot"; any How-I-work title or text contains "to production" / "tot in productie"; the DJI files (EN, NL) contain production/productie, "empty repository"/"lege repository", greenfield or go-live; OptieCon says "end to end"; the Jamigos spec mentions Capacitor without "AI-generated"/"AI-gegenereerd"; the Journal card summary describes the AI step without "next"/"designed" (NL equivalents); Scentify mentions the minor; Jamigos' kind is FLAGSHIP/VLAGGENSCHIP. The test file contains no confidential DJI terms — only the generic phrases above. PR-54's allowlist (when it runs) treats `docs/source/briefing.md` as a source; tests green.
  - Spec: SPEC §3.7; docs/source/briefing.md
  - Out of scope: changing any copy.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-54 Facts audit**
  - Done when: a test (or script in `verify`) extracts every number, date, URL and proper noun from the built EN pages and checks each appears in `docs/source/` or is a GitHub repo path that exists (using a committed allowlist file reviewed by this task against the sources); any invented fact is removed; Jamigos has no live link; phone number absent from all HTML.
  - Sources include `docs/source/briefing.md` (it wins over older copy); `tests/unit/claims-guard.test.ts` (PR-66) must stay green.
  - Spec: SPEC §3.7; NOTES "Never / always"
  - Out of scope: —


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-58 Tab title "Michael Goldman — Portfolio" and the MG favicon set**
  - Michael, 2026-10-04: *"in the tab in the browser it should be called Michael Goldman -- Portfolio"*; icon: *"the MG one is good, forget about the ASCII portrait."* Every icon is the **MG monogram cell** from the header (2 px ink square, "MG" in Archivo 800 wide, paper fill) — no ASCII portrait in any icon.
  - Done when: `<title>` is exactly `Michael Goldman — Portfolio` on `/` and `/nl/`, and `<Page> · Michael Goldman — Portfolio` on every other page in both languages (copy.md SEO table updated; og:title follows); `favicon.svg` (with a `prefers-color-scheme: dark` blueprint variant inside the SVG), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-512.png` + maskable and `site.webmanifest` (name "Michael Goldman — Portfolio", short_name "M. Goldman", theme colour from tokens) are generated by a build script from one source, linked in `<head>`; a test asserts the titles and every icon's existence and size.
  - Spec: SPEC §3.8; design/README.md; design/copy.md SEO
  - Out of scope: anything else in `<head>`.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-59 The ASCII portrait uses its dark-background version in the blueprint theme**
  - Michael, 2026-10-04: the portrait *"looks really good in lightmode but less good in darkmode"*. Cause: ASCII art maps dense glyphs (`@#%`) to dark areas; with light text on navy the light-mode file reads as a photo negative. `docs/source/ascii-portrait-dark.txt` (from his GitHub profile card, density inverted for dark backgrounds) is the fix.
  - Done when: `src/portrait.ts` exports both files; the portrait renders the dark file in the blueprint theme (both `[data-theme="blueprint"]` and system-dark-without-override) and the light file in paper — via two `<pre aria-hidden>` blocks toggled by CSS so it works without JS and never flashes the wrong one; the line-by-line scan-in animation (motion.md §M1) works for whichever is visible; colour in blueprint is tuned (try `--color-ink`/near-white vs `--color-line`) so contrast against the navy paper reads as a portrait, judged by screenshots of both themes saved to `.e2e/`; a test asserts the right file is visible per theme.
  - Spec: SPEC §4.1; design/motion.md §M1
  - Out of scope: the portrait's layout.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-60 Conspect is the employer; DJI and OptieCon are assignments inside it**
  - Michael, 2026-10-04: *"from 1 november 2023 until now i work at conspect. dji is a consultancy project that i was gedetacheerd to, but now i'm back again at conspect … is it intentional that conspect was not mentioned here?"* It was not. Today the Experience sheet reads as if DJI and OptieCon were employers.
  - Done when: (1) content: a `conspect` employer entry — **Java Consultant · Conspect · Almere · Nov 2023 – now**, "IT consultancy in agile software development and data analytics." — owns three assignments in order: **DJI (client assignment / secondment, Jan 2024 – Jan 2026)**, **Sabbatical (Jan – May 2026)**, **OptieCon (internal Conspect product, Jun 2026 – now, between client assignments)**; LinkPizza stays a separate employer; schema change in its own commit (CLAUDE.md contract); EN + NL (NL may say "gedetacheerd bij DJI"; never "op de bank" — EN wording "between client assignments"); (2) timeline: a Conspect employer bar spanning Nov 2023 – now drawn as the outer assembly, with DJI, the hatched sabbatical and OptieCon as sub-bars inside/under it (drawing language: a bracket or dimension line labelled CONSPECT), LinkPizza as its own bar; (3) detail blocks: one 02.1 block "Java Consultant — Conspect" with nested assignment blocks 02.1a OptieCon, 02.1b Sabbatical, 02.1c DJI (newest first), each keeping its existing content; 02.2 LinkPizza; (4) Overview "In progress" and any other mention name Conspect as employer; (5) e2e asserts Conspect is the visible employer heading and DJI is labelled a client assignment; screenshots both themes, desktop + phone.
  - Spec: SPEC §4.2; design/copy.md Sheet 02; docs/source/cv.md
  - Out of scope: other sheets' layout.


## Pruned from the queue

1 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-61 The name never breaks inside a word, at any width**
  - Michael, 2026-10-04: on small screens the hero showed "MICHAE / L / GOLDMA / N" — *"this should NEVER HAPPEN. as soon as it doesnt fit on the same lines then the font should be smaller."*
  - Done when: every display heading (DisplayHeading xl/l/m/s and any uppercase Archivo title) never breaks inside a word: `overflow-wrap: normal; word-break: keep-all; hyphens: none`, and the hero name is sized from its container so the longest word ("GOLDMAN", also NL) always fits on one line — `font-size: min(<token clamp>, <container-width>/<measured em-width of the longest word>)` via container query units (`cqi`) with the ratio measured once from the font, plus a JS-free fallback; long section/project titles may wrap only between words; a Playwright test at every width from 280 to 1440 px in 10 px steps (both languages) asserts each heading word sits on one line (bounding-box check per word span) and no heading overflows its box.
  - Spec: design/tokens.json size; design/README.md Responsive
  - Out of scope: other typography.


## Pruned from the queue

2 finished task(s), moved verbatim by `prune-backlog.py` so the live queue holds only live work.

### Hardening

- [x] **PR-62a Phone chrome: one-row header + fixed bottom tab bar** (split from PR-62, items 1, 2)
  - Done: below 768 px the header is one 56 px row (MG · SHEET 0n / 05 + name · EN/NL · theme swatch); the SHEETS panel is replaced by `SheetTabBar` fixed to the screen bottom (5 cells, short names from `ui.tabBar`, current ink-filled, safe-area inset, 62 px, body padded); CV in the title block's CONTACT cell; `tests/e2e/tab-bar.spec.ts`.

- [x] **PR-62b Phone Overview per the drawing** (rest of PR-62, item 3)
  - Michael, 2026-10-04: *"on mobile the app doesnt look so great. i want to have a more beautiful modern professional creative app layout"*. Drawing: `design/screens/overview-default-light-390.png` (+ `html/overview-default-light-390.html`).
  - Done when, below 768 px: name fit-to-width (PR-61, already), portrait in a "FIG. 0 — PORTRAIT · SCALE 1:1" framed card with balloons 1–3 on its right edge and a 3-cell caption strip under it (balloon 1 still links to /certifications), two-button row (projects + CV, 48 px), "How I work" as a horizontal snap-scroll card rail with a position indicator (works without JS: plain overflow scroll; indicator is decoration or JS-enhanced), spec rows stacked label-over-value; 44 px+ targets, no horizontal page scroll at 320 px, reduced motion; Playwright phone screenshots in both themes in `.e2e/` compared by eye; e2e for the rail.
  - Spec: design/screens overview 390, design/components.md, design/motion.md
  - Out of scope: desktop layout; the header/tab bar (PR-62a, done).
