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

### Sheet 03 — Projects

### Sheet 04 — Certifications

### Sheet 05 — Education

### 404 and SEO

### Motion

### Dutch

### Hardening

- [x] **PR-60 Conspect is the employer; DJI and OptieCon are assignments inside it**
  - Michael, 2026-10-04: *"from 1 november 2023 until now i work at conspect. dji is a consultancy project that i was gedetacheerd to, but now i'm back again at conspect … is it intentional that conspect was not mentioned here?"* It was not. Today the Experience sheet reads as if DJI and OptieCon were employers.
  - Done when: (1) content: a `conspect` employer entry — **Java Consultant · Conspect · Almere · Nov 2023 – now**, "IT consultancy in agile software development and data analytics." — owns three assignments in order: **DJI (client assignment / secondment, Jan 2024 – Jan 2026)**, **Sabbatical (Jan – May 2026)**, **OptieCon (internal Conspect product, Jun 2026 – now, between client assignments)**; LinkPizza stays a separate employer; schema change in its own commit (CLAUDE.md contract); EN + NL (NL may say "gedetacheerd bij DJI"; never "op de bank" — EN wording "between client assignments"); (2) timeline: a Conspect employer bar spanning Nov 2023 – now drawn as the outer assembly, with DJI, the hatched sabbatical and OptieCon as sub-bars inside/under it (drawing language: a bracket or dimension line labelled CONSPECT), LinkPizza as its own bar; (3) detail blocks: one 02.1 block "Java Consultant — Conspect" with nested assignment blocks 02.1a OptieCon, 02.1b Sabbatical, 02.1c DJI (newest first), each keeping its existing content; 02.2 LinkPizza; (4) Overview "In progress" and any other mention name Conspect as employer; (5) e2e asserts Conspect is the visible employer heading and DJI is labelled a client assignment; screenshots both themes, desktop + phone.
  - Spec: SPEC §4.2; design/copy.md Sheet 02; docs/source/cv.md
  - Out of scope: other sheets' layout.

- [ ] **PR-61 The name never breaks inside a word, at any width**
  - Michael, 2026-10-04: on small screens the hero showed "MICHAE / L / GOLDMA / N" — *"this should NEVER HAPPEN. as soon as it doesnt fit on the same lines then the font should be smaller."*
  - Done when: every display heading (DisplayHeading xl/l/m/s and any uppercase Archivo title) never breaks inside a word: `overflow-wrap: normal; word-break: keep-all; hyphens: none`, and the hero name is sized from its container so the longest word ("GOLDMAN", also NL) always fits on one line — `font-size: min(<token clamp>, <container-width>/<measured em-width of the longest word>)` via container query units (`cqi`) with the ratio measured once from the font, plus a JS-free fallback; long section/project titles may wrap only between words; a Playwright test at every width from 280 to 1440 px in 10 px steps (both languages) asserts each heading word sits on one line (bounding-box check per word span) and no heading overflows its box.
  - Spec: design/tokens.json size; design/README.md Responsive
  - Out of scope: other typography.

- [ ] **PR-62 Phone layout per the new drawings**
  - Michael, 2026-10-04: *"on mobile the app doesnt look so great. i want to have a more beautiful modern professional creative app layout"*. Drawings: `design/screens/overview-default-light-390.png`, `experience-default-light-390.png`, `education-part3-sheet-light-390.png` (+ their HTML in `design/screens/html/`).
  - Done when, below 768 px: (1) header is one 56 px row — MG cell · "SHEET 0n / 05" + sheet name · EN/NL · theme swatch — and the old SHEETS panel is replaced by (2) a **title-block tab bar fixed to the bottom** (5 cells 01–05 with short names Overview/Work/Projects/Certs/Education, active cell ink-filled, safe-area inset, 62 px tall, content padded so nothing hides under it; CV moves to the Overview buttons + footer); (3) Overview: name fit-to-width (PR-61), portrait in a "FIG. 0" framed card with balloons on its edge and a 3-cell caption strip, two-button row, "How I work" as a horizontal snap-scroll card rail with a position indicator, spec rows stacked label-over-value; (4) Experience: a **vertical timeline** — years down a left ruler, the Conspect bracket spanning its assignments, assignment cards beside it (tap expands the full detail in place), hatched sabbatical; (5) Education: the exploded assembly scaled to the screen, tapping a part opens a **bottom sheet** (drag handle, swipe down to close, ‹ › to step parts, focus-trapped, Escape closes) with the detail; parts list below; (6) Projects and Certifications get the same card language (full-width cards, title-block strips) without new drawings; (7) everything 44 px+ touch targets, no horizontal page scroll at 320 px, works with reduced motion and without JS (tab bar is plain links; bottom sheet degrades to inline details); Playwright phone screenshots of every page in both themes saved to `.e2e/` and compared by eye against the drawings; e2e for tab bar navigation, timeline expand, bottom sheet open/step/close.
  - Spec: design/screens (390 drawings), design/components.md, design/motion.md
  - Out of scope: desktop layout.

- [ ] **PR-63 App-like navigation, preloading and offline**
  - Michael, 2026-10-04: *"when i click to other parts of the app it seems to do a refresh … when my internet is slow that means it will take really long … without internet it will just crash?!"* Keep static per-page HTML (fast first load, SEO, works without JS) and add:
  - Done when: (1) Astro's `<ClientRouter />` (view transitions router) on every page so sheet changes swap content without a full reload, keeping the header/tab bar/title block persistent (`transition:persist`), the motion system's per-page init re-runs on `astro:page-load` (no double-binding; the first-load plotting still runs once per session), scroll restores correctly, focus moves to the new `<main>` h1 and the route change is announced; (2) prefetch: all sheet links prefetched on viewport (`prefetch: { prefetchAll: true, defaultStrategy: 'viewport' }`), project detail pages on hover/tap; (3) **offline**: a small hand-written service worker (no Workbox dependency needed) precaches every built HTML page, CSS, JS, font, icon and the CV PDF at install (manifest generated at build from `dist/` with content hashes; total size logged and asserted < 3 MB), serves cache-first for hashed assets and stale-while-revalidate for HTML, cleans old caches on activate, and serves a drawn "SHEET OFFLINE" page for anything uncached; registered only in production; (4) tests: Playwright navigates between sheets and asserts no full document reload (a window marker survives), then goes offline (`context.setOffline(true)`) after the first load and asserts every sheet and project page still opens; reduced motion and no-JS still work; Lighthouse PWA/perf budgets still pass.
  - Spec: design/motion.md §M2 (transitions now via ClientRouter); SPEC §7
  - Out of scope: push notifications, install prompts.

### Delivery

- [ ] **PR-55 Dockerfile**
  - Done when: multi-stage Dockerfile (node:22 build → nginxinc/nginx-unprivileged serving `dist/` on 8080) with gzip/brotli-static, long cache headers for hashed assets, no-cache for HTML, 404 page wired, `.dockerignore`; `docker build` + `docker run` smoke test script `scripts/docker-smoke.sh` curls `/`, `/nl/`, an unknown URL (404) — run it if Docker is available, otherwise document; docs/REPO-MAP.md notes it.
  - Spec: NOTES.md "Stack preferences", SPEC §7
  - Out of scope: deploying anywhere.

- [ ] **PR-56 GitHub Actions CI**
  - Done when: `.github/workflows/ci.yml` on push/PR: npm ci, typecheck, lint, format check, unit, build, Playwright (with browsers cache), axe, Lighthouse CI, Docker build; uploads `dist/` and the Playwright report as artifacts; concurrency group; README badge; workflow passes on GitHub after push (check with `gh run list`).
  - Spec: NOTES.md "Stack preferences"
  - Out of scope: deploying — `.github/workflows/pages.yml` already does that; leave it alone.

- [ ] **PR-57 README for the repo**
  - Done when: README.md explains the concept (a drawing set), the stack, how to run/test/build, the motion system in two sentences, the pipeline, and links michaelgoldman.dev; includes one screenshot of Sheet 01 (generated by a Playwright script into `docs/`); no AI-hype wording.
  - Spec: SPEC §1
  - Out of scope: —

---

## TODO-MANUAL

