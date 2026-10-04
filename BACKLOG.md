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

### Delivery

- [!] **PR-56b GitHub Actions CI — passes on GitHub** - BLOCKED: agents may not `git push` in this loop (denied, even to a side branch), so the workflow has never run; the loop's deploy pushes main. Re-check after that deploy.
  - Done when: `gh run list --workflow ci.yml --branch main` shows the latest run `success`; if a job fails, open its log (`gh run view <id> --log-failed`) and fix the cause (docs/RECORD.md 2026-10-05 PR-56 lists the jobs). Likeliest risks on a Linux runner: Lighthouse performance ≥ 0.95 on a slower machine, the Chrome sandbox for LHCI on ubuntu-24.04, font-metric differences in `tests/e2e/responsive.spec.ts`. Never loosen a budget to pass.
  - Out of scope: `.github/workflows/pages.yml`.

### QA walk, 2026-10-05

- [ ] **QA-67 every sheet (WebKit/iPhone) — the two preloaded fonts download twice and the console warns "preloaded … but not used"**
  - Route: every sheet using SheetLayout's default `PRELOAD_FONTS`, e.g. `/` and `/experience`; seen in WebKit only (Playwright `webkit`, iPhone 14 and 1440 px desktop), with and without JS.
  - Did: `npm run build && npm run preview -- --ignore-lock`, open `http://localhost:4321/experience` in Playwright WebKit (`serviceWorkers: 'block'`), log every request under `/fonts/` with its `sec-fetch-mode` header and the console, wait 4 s.
  - Happened: `archivo-latin-wdth-normal.woff2` and `ibm-plex-sans-latin-400-normal.woff2` are each requested twice — once by the `<link rel="preload" … crossorigin>` in mode `cors`, then again by the `@font-face` in mode `no-cors` (WebKit fetches same-origin fonts without CORS, so the preload is not matched). The console then shows two warnings: "The resource http://localhost:4321/fonts/archivo-latin-wdth-normal.woff2 was preloaded using link preload but not used within a few seconds from the window's load event" and the same for `ibm-plex-sans-latin-400-normal.woff2`. Chromium (Pixel 7, desktop) requests each face once with no warning.
  - Should: every visitor's browser, Safari included, uses the preloaded file — each preloaded face is fetched once, and the console is clean.
  - Done when: in Playwright WebKit (webkit-iphone project) and in Chromium, `/` and `/experience` request each preloaded face exactly once and log no "preloaded … but not used" warning, asserted by an e2e test (e.g. in `tests/e2e/performance.spec.ts`) that runs on both engines; if no markup serves both engines, the measurement and the chosen trade-off are in `docs/RECORD.md` and the test asserts the chosen behaviour.

---

## TODO-MANUAL

