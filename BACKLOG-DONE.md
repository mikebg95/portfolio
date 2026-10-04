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
