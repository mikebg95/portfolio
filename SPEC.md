# michaelgoldman.dev — Specification

## 1. Overview

### 1.1 What it is
Michael Goldman's personal portfolio site, designed as a **set of engineering drawings** ("Drawing
set"). Every page is a drawing sheet on paper with a grid: a sheet frame, a sheet index (navigation),
dimension lines, numbered callout balloons, red "revision notes", spec tables, parts lists and a
title block. It presents his experience, projects, certifications and education. Static site, no
accounts, no backend.

### 1.2 Who it is for
Hiring managers, CTOs, tech leads and recruiters at Amsterdam Java / DevOps employers (consultancies,
product companies, government — see `docs/source/private/research-market.md (local only)`). They arrive from a CV, LinkedIn
or GitHub link, mostly on desktop, often on a phone. They spend 30 seconds to 3 minutes.

### 1.3 The one thing it must get right
Within 10 seconds the visitor sees: a **full-stack Java engineer who takes features from design to
production** (Spring Boot, secure, test-first, CI/CD, moving into Kubernetes/DevOps) — and that the
site itself was obviously made by someone who designs before building. It must feel original and
polished, never like a template, while staying instantly readable and easy to navigate.

### 1.4 Language and locale
- English at `/` (default) and Dutch at `/nl/` — same pages, same structure. Language switch in the
  header on every page, linking to the same page in the other language.
- Dates: month + year ("Jun 2026", Dutch "jun 2026"). No day precision anywhere.
- No currency, no time zones (one exception: the optional Amsterdam local time in OPEN-QUESTIONS).

## 2. Users, accounts and permissions
No accounts, no sign-in, no forms, no cookies, no analytics that set cookies, no personal data
collected. Everyone sees the same public pages.

## 3. Features

### 3.1 Sheet frame and drawing language
- Every page is one "sheet": paper background with a two-level grid (16 px minor, 80 px major), a
  double frame (2 px outer, 1 px inner, 10 px apart), zone numbers 1–8 along the top edge on desktop.
- Building blocks (see `design/components.md`): sheet label ("SHEET 02 — EXPERIENCE · ELEVATION"),
  display heading (uppercase, Archivo wide), dimension line (arrows + label), callout balloon (circle
  with number + leader line), revision note (red dashed box, slightly rotated, "REV. NOTE △"), spec
  table rows (code · label · value), general notes (numbered list), title block (grid of cells),
  parts list table, figure label ("FIG. 1 — CONTAINER VIEW"), stamp (round inspection stamp).
- Content never depends on decoration: every decorative element is `aria-hidden`; all information is
  in real text.

### 3.2 Navigation (sheet index)
- Header on every page: monogram "MG" + "DRAWING SET / michaelgoldman.dev" (links to `/`), then five
  tabs "SHEET 01 Overview · 02 Experience · 03 Projects · 04 Certifications · 05 Education". The
  current sheet's tab is filled ink (inverted). Project detail pages mark tab 03.
- Header also holds: language switch (EN / NL), theme switch (paper / blueprint), "CV" download link.
- Phone (< 768 px): monogram + current sheet name + a "Sheets" button opening a full-width sheet index
  panel (same five entries, plus language, theme, CV). Panel closes on Escape, on selection and on
  outside tap; focus is trapped while open and returns to the button.
- Footer on every page: title block (PROJECT: MICHAEL GOLDMAN · SCALE 1:1 · SHEET nn / 05 · DRAWN: M.
  GOLDMAN · CHECKED: 251 TESTS · REV: build date as YYYY.MM · CONTACT links: email, LinkedIn, GitHub).

### 3.3 Themes
- **Paper** (light, default when system is light) and **Blueprint** (dark: deep navy paper, pale
  blue-white lines, the grid in light lines; red notes stay red-orange). Values in `design/tokens.json`.
- Follows `prefers-color-scheme` until the visitor toggles; the choice is remembered in localStorage
  (wrapped in try/catch; works without storage). No flash of the wrong theme on load (inline script in
  `<head>` sets the theme before paint).
- Switching theme animates per `design/motion.md` §M7.

### 3.4 Motion system
The site must make visitors think "wow" — smooth, precise, drafting-themed animation that never blocks
reading or clicking. The full specification is `design/motion.md`; it is binding. Summary: the sheet
"plots itself" on first load (frame draws, headline wipes in like a pen plotter, ASCII portrait scans
in line by line, dimension lines extend, balloons pop, revision note stamps down); elements ink in on
scroll; sheet-to-sheet navigation uses the View Transitions API; the Experience timeline and the
Education exploded view are scroll-driven; a drafting crosshair with coordinates follows the pointer
on desktop. `prefers-reduced-motion: reduce` → every element in its final state, no motion.

### 3.5 CV download
"CV" in the header and "DOWNLOAD CV (PDF)" on Sheet 01 download `/michael-goldman-cv.pdf` (a copy of
`docs/source/cv.pdf`, build-time copied to `public/`). Opens in a new tab.

### 3.6 Content model
All page content lives in typed content files (Astro content collections), never hard-coded in
components: `experience` (one file per role), `projects` (one per project), `certifications`,
`education` (parts), `profile` (hero, how-I-work, specs, general notes, contact). Each entry has an
EN and NL version. Schemas reject missing fields, so a missing translation fails the build.
Exact EN wording: `design/copy.md`. Dutch: translated faithfully (natural Dutch, "je"-form, technical
terms stay English where Dutch developers use English).

### 3.7 Facts policy
Only facts from `docs/source/cv.md`, `docs/source/briefing.md` (Michael, 2026-10-04; wins where
older copy disagrees), `docs/source/research-repos.md` and the repositories themselves. DJI text also
obeys `docs/source/private/briefing-private.md` — local only (gitignored): never quote it, never
commit it. No invented numbers, clients, dates, users or results. Test counts: 63 / 109 / 79 (251).
Jamigos hosting is retired: never show a live-demo link.

### 3.8 SEO and sharing
Per page: `<title>` ("Michael Goldman — Portfolio" on Sheet 01, "Experience · Michael Goldman —
Portfolio" elsewhere), favicon set (the MG monogram cell), meta description,
canonical URL, `hreflang` en/nl alternates, Open Graph + Twitter card with a generated 1200×630 image
per sheet (a mini sheet with the sheet title, rendered at build time). `sitemap.xml`, `robots.txt`.
JSON-LD `Person` on `/` (name, jobTitle, url, sameAs LinkedIn + GitHub; no phone, no address beyond
"Amsterdam, NL").

### 3.9 Not found
`/404` (and `/nl/404`): a sheet titled "SHEET NOT FOUND" with a red revision note "This sheet isn't
in the set." and links to all five sheets.

## 4. Screens

All drawings: `design/screens/` (PNG + HTML source in `design/screens/html/`), index in
`design/screens/README.md`. The drawings are 1440 px desktop, paper theme; other widths and the
blueprint theme follow `design/README.md`.

### 4.1 Sheet 01 — Overview (`/`, `/nl/`)
Drawing: `overview-default-light-1440.png`. Motion reference: `html/motion-preview.dc.html`.
Top to bottom: header · hero (sheet label; name "MICHAEL / GOLDMAN" in display type; rule + role line;
intro paragraph; revision note; buttons VIEW PROJECTS → `/projects`, DOWNLOAD CV (PDF)) · portrait
(ASCII portrait from `docs/source/ascii-portrait.txt` as real text in a `<pre aria-hidden>`, with an
`sr-only` "Portrait of Michael Goldman", horizontal dimension "5+ YRS FULL-STACK", vertical "JAVA ·
SPRING", balloons 1 Spring certified → `/certifications`, 2 Speaks 7 languages, 3 Trains Muay Thai) ·
"How I work" — four numbered principles (§ copy) · Specification table S-01…S-06 · General notes 1–6 ·
"Current work" strip: one line per active item (OptieCon at Conspect; CKAD in progress; Journal P-04
in progress) linking to its sheet · title block footer.

### 4.2 Sheet 02 — Experience (`/experience`)
Drawing: `experience-default-light-1440.png`. Sheet label "EXPERIENCE · ELEVATION", heading "FIVE
YEARS, DRAWN TO SCALE". Timeline: year ruler 2021–2026 (columns to Jan 2027), bars positioned by
month (LinkPizza Feb 2021–Oct 2023, DJI Jan 2024–Jan 2026, sabbatical Jan–May 2026 hatched, OptieCon
Jun 2026–now with an open end), a Conspect dimension line above (Nov 2023–now), durations under bars.
Bars link to their detail block. Detail blocks newest first: 02.1 Java Consultant — Conspect (the
employer, Nov 2023–now) with its assignments nested inside — 02.1a OptieCon (internal product),
02.1b the sabbatical (small, hatched), 02.1c DJI (client assignment, secondment) — then 02.2
LinkPizza; each with dates, employer or engagement, place, context paragraph, bullets, stack line,
optional revision note (PR-60). Phone: the timeline becomes vertical (years down the left).

### 4.3 Sheet 03 — Projects (`/projects`)
Drawing: `projects-default-light-1440.png`. "DRAWING REGISTER", heading "DESIGNED FIRST. THEN
BUILT." Cards: P-01 Jamigos (wide, flagship, mini container diagram), P-05 Scentify (origin), then the
Series assembly row (label line "ASSEMBLY · SPRING PERSISTENCE & ARCHITECTURE SERIES · 251 TESTS ·
ALL TEST-FIRST") with P-02, P-03, P-04 (P-04 dashed, "in progress"). Each card: line-art mini diagram
(HTML/CSS boxes, not images), title, one-line summary, title-block strip of 3 facts. Whole card links
to the detail sheet. Hover: card lifts with a hard 6 px ink offset shadow and the mini diagram's
arrows re-draw.

### 4.4 Sheet 03.n — Project detail (`/projects/<slug>`: jamigos, subscription-tracker, recipe-book, journal, scentify)
Drawing: `project-detail-jamigos-default-light-1440.png` (template for all five). Back link to the
register; "DETAIL SHEET 03.n — P-0n"; title; summary; "REPOSITORY ON GITHUB ↗" button; dates/status
line. FIG. 1: an architecture drawing built from HTML boxes and arrows specific to the project (from
its repo: Jamigos container view; Subscription Tracker layers; Recipe Book OpenAPI → generated API →
aggregate; Journal hexagon with ports/adapters; Scentify question flow). Specification rows (5–7)
specific to the project. FIG. 2: one project-specific figure (Jamigos pipeline route; Subscription
Tracker test pyramid with counts; Recipe Book "design-first" flow contract → code → tests; Journal ADR
list with titles; Scentify demo GIF from the repo, captioned). Revision note with one honest fact
(hosting retired / in progress / first app). Previous / next project links at the bottom.

### 4.5 Sheet 04 — Certifications (`/certifications`)
Drawing: `certifications-default-light-1440.png`. "INSPECTION RECORD", heading "INSPECTED AND SIGNED
OFF". Four certificate cards (2 × 2; 1 column on phone): C-01 Spring Certified Professional, C-02
PSM I, C-03 OCA Java SE 8, C-04 CKAD (dashed, red "PENDING" stamp, no verify link). Each: round
stamp, code, name, issuer · date, what-I-learned paragraph, skill chips, "VERIFY ON <ISSUER> ↗" to the
exact URL in `docs/source/cv.md`.

### 4.6 Sheet 05 — Education (`/education`)
Drawing: `education-default-light-1440.png`. "ASSEMBLY, EXPLODED VIEW", heading "HOW THIS ENGINEER
WAS ASSEMBLED". Left: the exploded isometric assembly — plates bottom→top: 1 VWO (base), 2 BSc
Political Science, 3 Minor Programming, 4 Harvard CS50 (smaller plate), 5 CKAD (dashed red, "to be
fitted"); a dashed centre axis; numbered balloons with leader lines. Right: detail panel for the
selected part (default: 3) and the parts list table (ITEM · PART · SUPPLIER · YEAR). Selecting a part
(click a plate, a balloon or a table row; keyboard: the rows and balloons are buttons) highlights the
plate (lifts and fills ink-blue), the row and swaps the detail panel (content per part in
`design/copy.md`). Scroll-driven assembly per `design/motion.md` §M5. Phone: assembly above, scaled
to fit width; detail and parts list below.

### 4.7 404 (`/404`)
Not drawn. Built from the sheet frame, header, a display heading "SHEET NOT FOUND", a revision note,
and the five sheet links as a sheet index list.

## 5. Data
Content collections (§3.6), schema per collection in `src/content/schemas.ts`, wired up in `src/content.config.ts`:
- `experience`: id, order, role, employer, client?, place, start (YYYY-MM), end (YYYY-MM | null =
  now), context, bullets[], stack[], note?, lang.
- `projects`: slug, code (P-01…), order, title, summary, period, status (done | in-progress |
  retired-hosting), repo URL, tests?, facts[3] {label, value}, spec[] {label, text}, figures, note,
  lang.
- `certifications`: code, name, issuer, date (YYYY-MM | null), status (verified | pending), verifyUrl?,
  learned, skills[], lang.
- `education`: item, part, supplier, years, ec?, plate (size, style), detail {title, meta, body,
  rows[] {code, text, ec}}, lang.
- `profile`: hero, howIWork[4], specs[6], generalNotes[], current[], contact {email, linkedin,
  github}, lang.
- `ui`: the strings every page shares — header, title block, SEO titles/descriptions, 404 — lang
  (docs/RECORD.md 2026-10-04).

## 6. Integrations
None at runtime. Google Fonts are self-hosted at build (no request to Google from the visitor). The
Scentify GIF and any repo images are copied into `public/` with attribution, never hot-linked.

## 7. Non-functional
- Static site (Astro, `output: 'static'`), no server code. Total JS on any page ≤ 60 KB gzipped
  (GSAP included); HTML+CSS first paint must not wait for JS.
- Lighthouse (mobile) ≥ 95 performance, 100 accessibility, 100 best practices, 100 SEO on every page.
- WCAG 2.2 AA: contrast (both themes), focus visible (ink outline 2 px + 2 px offset), skip link,
  semantic headings (one h1 per page), every interactive element keyboard-reachable, `aria-current`
  on the active sheet tab, reduced motion honoured.
- Widths: works from 320 px to 2560 px; sheet max width 1320 px centred; phone < 768 px, tablet
  768–1023, desktop ≥ 1024.
- No cookies, no tracking, no personal data beyond the public contact links. Phone number never
  appears in HTML.
- Hosting: GitHub Pages at michaelgoldman.dev (`public/CNAME`); every push to `main` runs
  `.github/workflows/pages.yml`, which builds and publishes `dist/`. The build must stay a plain
  `dist/` that any static host can serve, plus a Dockerfile (nginx, non-root) so it can also run in a
  container.

## 8. Out of scope
Blog, contact form, CMS, analytics, comments, a terminal emulator, game mechanics, any live demo of
Jamigos, changing DNS.

## 9. Glossary
- **Sheet** — one page of the site, numbered 01–05 (03.n for project details).
- **Drawing set** — the whole site.
- **Revision note** — red dashed annotation box, "REV. NOTE △".
- **Balloon** — numbered circle with a leader line pointing at a part.
- **Title block** — the cell grid in the footer.
- **Plotting** — the first-load animation in which the sheet draws itself.
- **Paper / Blueprint** — light / dark theme.
