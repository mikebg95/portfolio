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

- [x] **PR-63a Preloading and offline** (split from PR-63)
  - Michael, 2026-10-04: *"when my internet is slow that means it will take really long … without internet it will just crash?!"*
  - Done when: (2) prefetch: all sheet links prefetched on viewport (`prefetch: { prefetchAll: true, defaultStrategy: 'viewport' }`), project detail pages on hover/tap; (3) **offline**: a small hand-written service worker (no Workbox) precaches every built HTML page, CSS, JS, font, icon and the CV PDF at install (manifest generated at build from `dist/` with content hashes; total size logged and asserted < 3 MB), cache-first for hashed assets, stale-while-revalidate for HTML, old caches cleaned on activate, a drawn "SHEET OFFLINE" page for anything uncached; registered only in production; tests: offline after the first load, every sheet and project page still opens.
  - Spec: SPEC §7
  - Out of scope: push notifications, install prompts; the ClientRouter (PR-63b).

- [ ] **PR-63b App-like navigation: ClientRouter**
  - Michael, 2026-10-04: *"when i click to other parts of the app it seems to do a refresh"*. Split from PR-63: PR-63a shipped prefetch (astro.config.ts `prefetch`) and the offline service worker (src/precache.ts, src/service-worker.js, tests/e2e/offline.spec.ts) — keep both working.
  - Done when: Astro's `<ClientRouter />` (view transitions router) on every page so sheet changes swap content without a full reload, keeping the header/tab bar/title block persistent (`transition:persist`), the motion system's per-page init re-runs on `astro:page-load` (no double-binding; the first-load plotting still runs once per session), scroll restores correctly, focus moves to the new `<main>` h1 and the route change is announced; Playwright navigates between sheets and asserts no full document reload (a window marker survives); offline navigation (offline.spec.ts) still passes through the router; reduced motion and no-JS still work; Lighthouse budgets still pass (`npm run lhci`).
  - Learned in PR-63a: §M2 today is cross-document View Transitions (the inline `@view-transition` opt-in in SheetLayout, `pageswap`/`pageshow` in `markScrolledSwaps`, src/view-transitions.ts; docs/RECORD.md 2026-10-04 "Sheet transitions") — under ClientRouter those events no longer fire, so the scrolled-swap mark and the opt-in must move to the router's events (`astro:before-preparation`/`astro:before-swap`). Every component `<script>` (crosshair, header, timeline, assembly, education sheet, theme switch, `reveal()`) runs once per document today and must be re-run per page. Playwright blocks service workers outside offline.spec.ts (playwright.config.ts).
  - Spec: design/motion.md §M2 (transitions now via ClientRouter); SPEC §7
  - Out of scope: push notifications, install prompts.

- [ ] **PR-67 Header sheet tabs never break a word**
  - Seen by PR-61's agent, 2026-10-04: at 1280 px the desktop header's SHEET 04 tab reads "Certification / s" (mono tab name broken mid-word); NL "Certificeringen" is longer still. Reproduce: `npm run preview`, 1280 × 900, `/` and `/nl/`, look at the tab row.
  - Done when: no header tab name (EN + NL) breaks inside a word at any width from 768 to 1440 px in 10 px steps (same per-word range check as `tests/e2e/display-headings.spec.ts`), by shrinking/fitting the tab text or the tab layout per the drawing, not by abbreviating copy; no tab text overflows its cell.
  - Spec: design/components.md SheetHeader; design/screens overview-default-light-1440
  - Out of scope: the phone header (PR-62).

- [ ] **QA-63 Dashed borders lose their sides in WebKit on a 3× phone**
  - Seen by PR-62e's agent, 2026-10-04: in Playwright `webkit-iphone` (iPhone 14, DPR 3) a 1.5 px dashed border computes to 1.33 px and its left/right sides are not drawn at all (top/bottom are). Seen on the RevisionNote (`--border-dashed-note`; `/`, `/projects/jamigos`) and the Experience sabbatical card (`/experience`, `#sabbatical`). 1 px and 2 px draw. PR-62e worked round it for the pending cert and in-progress project cards only (1 px below 768 px). Reproduce: `npm run build && npm run preview`, WebKit iPhone 14, screenshot a 30 px wide clip at the note's left edge.
  - Done when: every dashed border on every page shows all four sides in `webkit-iphone` (a Playwright check that clips each dashed element's left edge and finds its colour), in both themes, without hard-coding a colour or changing the desktop look.
  - Out of scope: solid borders.

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

