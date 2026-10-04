# BACKLOG.md

## How this backlog works

`.orchestrator/run.sh` hands each iteration to a fresh agent with no memory of
any previous one. Everything it needs is in this file, `CLAUDE.md`, `SPEC.md`,
`design/`, `docs/`, and the repository itself.

**One task per iteration.** Take the FIRST `- [ ]` line, top to bottom, do it
fully, stop. `.orchestrator/prompt.md` says when consecutive tasks may be
batched; when in doubt, one.

**The checkbox is the only signal.** Flip your task's `- [ ]` to `- [x]` as
your last commit. The loop measures progress by settled checkboxes; a task
implemented and committed but still reading `- [ ]` looks like nothing
happened, and the next agent does it again.

**Blocked, not skipped.** If you genuinely cannot proceed — after checking the
machine for what you think is missing — rewrite the line as
`- [!] <text> - BLOCKED: <reason>` and commit. `- [!]` counts as settled and
the run continues past it. Never weaken a test or silence a failure to make a
task look done.

**Task anatomy.** `- [ ] **ID-n Title**` with nested bullets:
- *Done when* — the acceptance condition; meet all of it.
- *Out of scope* — a boundary. That work belongs to a later task that exists.
- *Spec* — the `SPEC.md` sections or `design/` files that govern this task.
  Read them first; they carry constraints the line does not repeat.

**Splitting.** An iteration is capped at 90 working minutes and loses what is
uncommitted when killed. If your task will not fit, commit what works, give
the shipped part its own `- [x]` line (`ID-n` → `ID-na` done), and add the rest
as `- [ ]` right beneath it with what you learned. Split only when you have
looked and know it will not fit.

**Never invent a decision the spec left to a human.** The TODO-MANUAL section
at the end lists work that needs an account, credential, device, a file only
the owner can supply, or a business decision. Plain bullets, not tasks. If your
task depends on one, that is `- [!] BLOCKED`.

**`- [~]`** marks a task deferred by decision. Never take one or flip one.

**Finished tasks move to `BACKLOG-DONE.md`** automatically between iterations,
verbatim, under the heading they sat beneath. Nothing reads that file as a
queue.

**`CLAUDE.md` outranks your judgement on stack and conventions.**

---

## Backlog

### Foundation

### Sheet chrome

### Sheet 01 — Overview

### Sheet 02 — Experience

- [x] **PR-19 Experience timeline drawing**
  - Done when: `/experience` shows label, heading and the timeline as drawn (ruler, Conspect dimension line, bars with links to `#<id>`, hatched sabbatical with caption, open-ended OptieCon, duration dimensions) using PR-18; on phone the timeline is vertical (years down the left, bars as vertical segments) with the same information; e2e clicks a bar and lands on its detail.
  - Spec: SPEC §4.2; design/screens/html/experience-default-light-1440.html; design/components.md TimelineRuler/TimelineBar
  - Out of scope: scroll motion (PR-43).

- [x] **PR-20 Experience detail blocks**
  - Done when: detail blocks 02.1 OptieCon, 02.2 DJI, 02.3 LinkPizza (+ small hatched sabbatical block between 02.1 and 02.2) exactly as drawn, newest first, with ids, DJI revision note, stack lines, Conspect employer line; stacks to one column on phone; e2e asserts each block's title and dates.
  - Spec: SPEC §4.2; design/copy.md Sheet 02; design/components.md ExperienceDetail
  - Out of scope: motion.

### Sheet 03 — Projects

- [ ] **PR-21 Project content (EN) — register fields**
  - Done when: `projects` EN entries for the five projects with slug, code, order, title, summary, period, status, repo URL, tests, the three card facts, and kind label from design/copy.md; Vitest asserts tests sum to 251 for P-02..P-04 and Jamigos has no live URL anywhere.
  - Spec: design/copy.md Sheet 03; docs/source/research-repos.md; SPEC §3.7
  - Out of scope: detail fields (PR-25…).

- [ ] **PR-22 ProjectCard and mini diagrams**
  - Done when: `ProjectCard` per design/components.md (flagship spanning 2 columns, in-progress dashed variant, title-block strip, whole card one link, hover/focus lift) with a per-project mini diagram component (Jamigos container chain, Scentify 4 questions → 52 scents, Subscription Tracker 3 stacked layers, Recipe Book OpenAPI ↓ generates → Recipe ⟶ Steps, Journal hexagon) built from `.box` HTML; `/_primitives` shows all five.
  - Spec: SPEC §4.3; design/screens/html/projects-default-light-1440.html
  - Out of scope: page layout (PR-23).

- [ ] **PR-23 Projects register page**
  - Done when: `/projects` shows label, heading, intro, row 1 (Jamigos wide + Scentify), the series assembly line with `251 TESTS · ALL TEST-FIRST`, row 2 (P-02, P-03, P-04) exactly as drawn; 1 column on phone, 2 on tablet; every card links to `/projects/<slug>`; e2e asserts five cards and their links.
  - Spec: SPEC §4.3; design/screens/projects-default-light-1440.png
  - Out of scope: detail pages.

- [ ] **PR-24 Project detail template**
  - Done when: `/projects/[slug]` (static paths from the collection, both languages) renders back link, label `DETAIL SHEET 03.n — P-0n`, title, summary, repo button, meta line, a FIG. 1 slot, specification rows, a FIG. 2 slot, revision note, previous/next links (wrapping), header tab 03 active, footer SHEET 03 / 05; matches `project-detail-jamigos-default-light-1440.png` structure; e2e visits all five slugs.
  - Spec: SPEC §4.4; design/screens/html/project-detail-jamigos-default-light-1440.html
  - Out of scope: per-project figures (PR-25…29).

- [ ] **PR-25 Jamigos detail sheet**
  - Done when: Jamigos detail content (summary, meta, spec rows, note) from copy.md; FIG. 1 container view and FIG. 2 PipelineRoute exactly as drawn; no live link; e2e asserts figures and repo link `https://github.com/mikebg95/jamigos`.
  - Spec: design/copy.md 03.1; docs/source/research-repos.md P-01
  - Out of scope: other projects.

- [ ] **PR-26 Subscription Tracker detail sheet**
  - Done when: content from copy.md 03.2 plus 5–6 spec rows written from research-repos.md P-02 and the repo (layering, JDBC/JdbcTemplate, Flyway incl. the case-insensitive index, code-first OpenAPI, RFC 9457 errors, tests); FIG. 1 layers, FIG. 2 test pyramid with the real per-level counts read from the repo (sum 63); e2e asserts 63.
  - Spec: design/copy.md 03.2; github.com/mikebg95/subscription-tracker
  - Out of scope: other projects.

- [ ] **PR-27 Recipe Book detail sheet**
  - Done when: content from copy.md 03.3 plus spec rows from research-repos.md P-03 (aggregate, SEQUENCE ids, @Version + 409, open-in-view off, summary projection, deferrable constraints, ArchUnit, 109 tests); FIG. 1 design-first flow, FIG. 2 aggregate drawing; e2e asserts 109.
  - Spec: design/copy.md 03.3; github.com/mikebg95/recipe-book
  - Out of scope: other projects.

- [ ] **PR-28 Journal detail sheet**
  - Done when: content from copy.md 03.4 plus spec rows from research-repos.md P-04 (hexagonal packages, rich domain model, Spring AI with graceful degradation, MapStruct, optimistic locking, ArchUnit, 79 tests); FIG. 1 ports & adapters hexagon (CSS clip-path hexagon + boxes), FIG. 2 the 7 ADR titles read from the repo's `docs/architecture/adr/`, each linking to the ADR on GitHub; status "in progress" styling (redline); e2e asserts 7 ADR links.
  - Spec: design/copy.md 03.4; github.com/mikebg95/journal
  - Out of scope: other projects.

- [ ] **PR-29 Scentify detail sheet**
  - Done when: content from copy.md 03.5 plus spec rows (Android, Java, Activities, custom ArrayAdapter, catalogue of 52, limitations noted honestly); FIG. 1 question flow; FIG. 2 the demo GIF copied from the repo into `public/projects/scentify/` (optimised; `loading="lazy"`, width/height set, alt text, caption, source credited) — paused (static first frame) under reduced motion; e2e asserts the image and caption.
  - Spec: design/copy.md 03.5; github.com/mikebg95/Scentify
  - Out of scope: other projects.

### Sheet 04 — Certifications

- [ ] **PR-30 Certification content (EN)**
  - Done when: `certifications` EN entries C-01…C-04 from copy.md with exact verify URLs from docs/source/cv.md (CKAD none); Vitest asserts URLs and statuses.
  - Spec: design/copy.md Sheet 04; docs/source/cv.md
  - Out of scope: NL.

- [ ] **PR-31 Certifications page**
  - Done when: `/certifications` as drawn: label, heading, intro, 2×2 CertCards with Stamp (verified/pending), skill chips, verify links (external ↗); 1 column on phone; ids `spring`, `psm`, `oca`, `ckad`; e2e asserts four cards and three verify links.
  - Spec: SPEC §4.5; design/screens/html/certifications-default-light-1440.html
  - Out of scope: stamp motion (PR-47).

### Sheet 05 — Education

- [ ] **PR-32 Education content (EN)**
  - Done when: `education` EN entries for parts 1–5 with every field and detail panel text from copy.md; Vitest asserts ordering and that part 3 has three sub-rows totalling 30 EC.
  - Spec: design/copy.md Sheet 05
  - Out of scope: NL.

- [ ] **PR-33 Exploded assembly (static)**
  - Done when: `/education` renders label, heading, intro and the isometric exploded assembly as drawn (5 plates, CS50 smaller, CKAD dashed redline, centre axis, balloons + leaders), with vertical spacing so plates don't overlap beyond their thickness; scales to width on phone; plates/balloons are buttons with accessible names; e2e asserts five parts.
  - Spec: SPEC §4.6; design/screens/html/education-default-light-1440.html; design/components.md ExplodedAssembly
  - Out of scope: selection (PR-35), scroll motion (PR-44).

- [ ] **PR-34 Parts list and detail panel**
  - Done when: DetailPanel (default part 3) and PartsList table exactly as drawn, rows as buttons (`aria-pressed`), pending row in redline; panel stacks below assembly on phone/tablet; e2e asserts default detail and table rows.
  - Spec: SPEC §4.6; design/components.md PartsList, DetailPanel
  - Out of scope: interaction (PR-35).

- [ ] **PR-35 Part selection**
  - Done when: clicking/Enter/Space on a plate, balloon or row selects that part: plate lifts 12 px and fills, others dim to 60%, row highlights, panel content swaps (clip-path wipe 250 ms; instant under reduced motion), URL hash `#part-n` updates and is honoured on load; without JS all five details render stacked (progressive enhancement); hover on a row previews the lift; e2e covers mouse, keyboard and hash.
  - Spec: SPEC §4.6; design/motion.md §M5
  - Out of scope: scroll-scrubbed explode (PR-44).

### 404 and SEO

- [ ] **PR-36 404 sheet**
  - Done when: `/404` and `/nl/404` per SPEC §3.9 / §4.7 and copy.md, built from the sheet primitives, listing the five sheets; static host config notes in docs/REPO-MAP.md; e2e visits an unknown URL in preview and gets this sheet.
  - Spec: SPEC §3.9, §4.7
  - Out of scope: —

- [ ] **PR-37 SEO metadata, sitemap, robots, JSON-LD**
  - Done when: per-page title/description from copy.md SEO table (NL from content), canonical, hreflang en/nl/x-default, sitemap.xml (both languages, excluding `/_primitives` and 404), robots.txt, JSON-LD Person on `/` (no phone/address); a Vitest/e2e test parses each built page's head and asserts all of it.
  - Spec: SPEC §3.8; design/copy.md SEO
  - Out of scope: OG images (PR-38).

- [ ] **PR-38 Open Graph images**
  - Done when: a build step renders a 1200×630 PNG per sheet and per project in both languages (mini sheet: frame, grid, sheet label, display heading, small title block with michaelgoldman.dev) using satori/resvg or Playwright at build time; og:image and twitter:card tags point at them; test asserts every page has an existing og:image file of 1200×630.
  - Spec: SPEC §3.8; design/README.md "Not drawn"
  - Out of scope: —

### Motion

- [ ] **PR-39 Motion foundation**
  - Done when: an inline head script adds `js` to `<html>`; CSS custom properties for the three easings and durations; a tiny `motion.ts` with `reveal()` (IntersectionObserver, threshold 0.2, once, `data-reveal="ink|rise|wipe|stamp|draw|cards"`, stagger via `data-reveal-delay`), a sessionStorage first-visit flag (try/catch), and global guards so reduced motion and no-JS show final states; documented in `docs/conventions/motion.md` and indexed in CLAUDE.md; Playwright tests: reduced motion → no element with opacity < 1 or non-none clip-path after load; JS disabled → all content visible.
  - Spec: design/motion.md principles, §M3
  - Out of scope: the specific animations.

- [ ] **PR-40 Crosshair**
  - Done when: the drafting crosshair per design/motion.md §M6 on every sheet: dashed redline hairlines + "X 0000 · Y 0000" readout in sheet coordinates, rAF-throttled, `pointer-events: none`, `aria-hidden`, only for `(hover: hover) and (pointer: fine)`, off under reduced motion; ported from the preview's script; e2e asserts it appears on mouse move (desktop) and is absent on phone.
  - Spec: design/motion.md §M6; design/screens/html/motion-preview.dc.html
  - Out of scope: —

- [ ] **PR-41 First-load plotting — Sheet 01**
  - Done when: the full §M1 timeline on `/` ported from `design/screens/html/motion-preview.dc.html` (frame draw, grid, header stagger, active tab fill, headline plotter wipe, rule/role/intro, portrait line scan, dimension lines, leaders + balloons, revision note stamp) with identical durations/delays/easings; plays only on the session's first page view; text readable within 1.3 s (e2e measures); reduced motion → final state.
  - Spec: design/motion.md §M1
  - Out of scope: other sheets (PR-42).

- [ ] **PR-42 First-load plotting — other sheets + scroll reveals everywhere**
  - Done when: the short first-load variant on sheets 02–05, project details and 404 (frame, grid, header, heading wipe ≤ 1.2 s); §M3 reveals applied across all pages (spec/table rows ink in with rule draw, section labels wipe, below-fold headings wipe, revision notes stamp, figures' boxes then arrows draw in data-flow order, cards rise staggered); counts (tests, durations) count up once; e2e: after scrolling to the bottom every element is in its final state.
  - Spec: design/motion.md §M1 (other sheets), §M3, §M6 numbers
  - Out of scope: timeline, exploded view, stamps, theme switch.

- [ ] **PR-43 Experience timeline scroll animation**
  - Done when: §M4 with GSAP ScrollTrigger lazy-loaded only on `/experience`: ruler draws with ticks, bars extrude scrubbed to scroll, durations count with the bar, hatching slides, OptieCon arrow pulses twice, sticky timeline with scale cursor on desktop ≥ 1024 marking the role in view; no stickiness on phone; reduced motion → final state; JS weight budget respected; e2e scrolls and asserts final widths.
  - Spec: design/motion.md §M4
  - Out of scope: —

- [ ] **PR-44 Education exploded-view scroll animation**
  - Done when: §M5: starts assembled (6 px gaps, balloons hidden), explodes scrubbed by scroll (top plate first, axis draws, leaders + balloons appear as plates arrive, CKAD dashed outline fades in last); phone plays a one-off 1.2 s timeline on enter; selection (PR-35) keeps working at any scroll position; reduced motion → exploded final state; e2e scrolls through and asserts final positions.
  - Spec: design/motion.md §M5
  - Out of scope: —

- [ ] **PR-45 Sheet-to-sheet View Transitions**
  - Done when: §M2: cross-document view transitions enabled; frame, header and title block keep shared names and stay put; the active-tab fill slides between tabs; content leaves up/fades (180 ms) and enters from below (320 ms); project card title + mini diagram morph into the detail heading + FIG. 1 (per-slug names, unique per page); no transition under reduced motion; graceful in browsers without support; e2e (chromium) navigates between sheets without console errors and with `document.startViewTransition`/`@view-transition` present.
  - Spec: design/motion.md §M2
  - Out of scope: theme switch.

- [ ] **PR-46 Theme switch reveal**
  - Done when: §M7 circular clip-path reveal from the theme button via `document.startViewTransition` (500 ms, ease-plot); instant fallback; reduced motion instant; e2e toggles twice without errors.
  - Spec: design/motion.md §M7
  - Out of scope: —

- [ ] **PR-47 Micro-interactions**
  - Done when: §M6 small interactions: button ink-wipe hover, tab underline draw, card lift + mini-diagram arrow redraw, stamps slam in sequence with ink bleed on Sheet 04, CKAD dashed stamp ring rotating (the only infinite animation, paused under reduced motion), balloon hover scale, PipelineRoute travelling dot on Jamigos; all focus-visible equivalents for keyboard users; no layout-affecting properties animated (lint rule or test grepping CSS for animated width/height/top/left).
  - Spec: design/motion.md §M6; design/components.md
  - Out of scope: —

### Dutch

- [ ] **PR-48 Dutch translation — profile, global, SEO**
  - Done when: NL `profile` entry and all global/header/footer/SEO strings translated per SPEC §3.6 (natural Dutch, "je", English tech terms); `/nl/` renders fully in Dutch; the language switch on every page goes to the same page; e2e asserts `/nl/` hero text is Dutch and `<html lang="nl">`.
  - Spec: SPEC §1.4, §3.6; design/copy.md Sheet 01, Global, SEO
  - Out of scope: other collections.

- [ ] **PR-49 Dutch translation — experience and certifications**
  - Done when: NL entries for every experience and certification entry; dates as "jun 2026"; `/nl/experience` and `/nl/certifications` fully Dutch; pairing test passes.
  - Spec: SPEC §3.6
  - Out of scope: —

- [ ] **PR-50 Dutch translation — projects and education**
  - Done when: NL entries for all five projects (register + detail fields) and five education parts; `/nl/projects/*` and `/nl/education` fully Dutch; pairing test passes; a test greps the built `dist/nl/**` for a list of English UI words from copy.md Global (e.g. "Skip to sheet content", "Overview") and finds none; a test asserts no content entry has `translated: false`.
  - Spec: SPEC §3.6
  - Out of scope: —

### Hardening

- [ ] **PR-51 Accessibility pass**
  - Done when: axe passes (0 violations) on every route × both languages × both themes × desktop and phone; keyboard walk e2e: tab order logical on each page, every interactive element reachable and visibly focused, phone panel trap works; one h1 per page; contrast of muted/redline on paper and blueprint ≥ 4.5:1 (unit test computing it from tokens).
  - Spec: SPEC §7
  - Out of scope: new features.

- [ ] **PR-52 Performance budget**
  - Done when: Lighthouse CI (`@lhci/cli`, mobile preset, against `npm run preview`) runs on `/`, `/experience`, `/projects/jamigos`, `/education`, `/nl/` with assertions perf ≥ 0.95, a11y = 1, best-practices = 1, SEO = 1; a size test asserts each page's JS ≤ 60 KB gz and fonts preloaded only where used; fixes whatever fails; `lhci` added to `verify`.
  - Spec: SPEC §7
  - Out of scope: —

- [ ] **PR-53 Responsive pass 320–2560**
  - Done when: Playwright visits every route at 320, 390, 768, 1024, 1440 and 2560 px wide and asserts no horizontal page scroll, no overlapping text (bounding-box check on headings/labels), tables scroll inside their framed box; screenshots saved as artifacts; fixes applied.
  - Spec: design/README.md "Responsive"; SPEC §7
  - Out of scope: —

- [ ] **PR-54 Facts audit**
  - Done when: a test (or script in `verify`) extracts every number, date, URL and proper noun from the built EN pages and checks each appears in `docs/source/` or is a GitHub repo path that exists (using a committed allowlist file reviewed by this task against the sources); any invented fact is removed; Jamigos has no live link; phone number absent from all HTML.
  - Spec: SPEC §3.7; NOTES "Never / always"
  - Out of scope: —

### Delivery

- [ ] **PR-55 Dockerfile**
  - Done when: multi-stage Dockerfile (node:22 build → nginxinc/nginx-unprivileged serving `dist/` on 8080) with gzip/brotli-static, long cache headers for hashed assets, no-cache for HTML, 404 page wired, `.dockerignore`; `docker build` + `docker run` smoke test script `scripts/docker-smoke.sh` curls `/`, `/nl/`, an unknown URL (404) — run it if Docker is available, otherwise document; docs/REPO-MAP.md notes it.
  - Spec: NOTES.md "Stack preferences", SPEC §7
  - Out of scope: deploying anywhere.

- [ ] **PR-56 GitHub Actions CI**
  - Done when: `.github/workflows/ci.yml` on push/PR: npm ci, typecheck, lint, format check, unit, build, Playwright (with browsers cache), axe, Lighthouse CI, Docker build; uploads `dist/` and the Playwright report as artifacts; concurrency group; README badge; workflow passes on GitHub after push (check with `gh run list`).
  - Spec: NOTES.md "Stack preferences"
  - Out of scope: deploy job.

- [ ] **PR-57 README for the repo**
  - Done when: README.md explains the concept (a drawing set), the stack, how to run/test/build, the motion system in two sentences, the pipeline, and links michaelgoldman.dev; includes one screenshot of Sheet 01 (generated by a Playwright script into `docs/`); no AI-hype wording.
  - Spec: SPEC §1
  - Out of scope: —

---

## TODO-MANUAL

- Choose hosting for michaelgoldman.dev and point the Porkbun DNS at it (currently an A record to a Render IP). Done by hand after the loop, not by a task.
