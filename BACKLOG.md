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

- [x] **QA-69 /education (< 768 px, mouse) — clicking the part sheet's handle does not close the sheet**
  - Route: `/education` (and `/nl/education`) at a width under 768 px with a mouse pointer — e.g. a desktop browser window 390 or 700 px wide; Chromium and WebKit both.
  - Did: Playwright context `{ viewport: { width: 390, height: 844 } }` (no touch), waited 3 s, clicked the parts-list row button `.parts-list__select[data-part="3"]` (the bottom sheet opens), then clicked the handle `[data-sheet-close]` ("Close") with the mouse and waited 1.2 s.
  - Happened: `dialog[data-part-sheet]` stays open. The same handle closes the sheet when tapped (Pixel 7 / iPhone 14 `tap()`) or activated with Enter, and Escape and the backdrop close it with the mouse too. Likely cause, from `src/part-sheet.ts`: the head's `pointerdown` calls `head.setPointerCapture(...)`, so a mouse click is dispatched to the captured head rather than to the grip, and the grip's `click` listener never runs.
  - Should: a mouse click on the handle closes the sheet exactly as a tap does, focus returning to the part that opened it (SPEC/components.md: the drag handle is also the close button).
  - Done when: `tests/e2e/education-sheet.spec.ts` has a case at 390 px without touch that opens the sheet from a row with `click()`, clicks the handle with `click()`, and expects the sheet hidden and the row's button focused — passing on chromium and webkit; the existing tap, Escape, backdrop and swipe-down tests still pass.

- [ ] **QA-70 /nl/<unknown> — a mistyped Dutch URL shows the English 404 sheet on GitHub Pages**
  - Route: any unknown URL under `/nl/`, e.g. `/nl/no-such-sheet`, `/nl/projects/nope`.
  - Did: `curl https://michaelgoldman.dev/nl/does-not-exist` (live GitHub Pages, 2026-10-05) and, locally, `npm run build && npm run preview -- --ignore-lock` then opened `http://localhost:4321/nl/no-such-sheet` in Playwright (desktop 1440 and iPhone 14). `astro preview` answers unknown URLs with `dist/404.html` exactly as GitHub Pages does.
  - Happened: status 404 with `<html lang="en">`, heading "SHEET NOT FOUND", title "Sheet not found · …", and the five sheet links go to English pages (`/`, `/experience` …) — a Dutch reader is dropped out of Dutch. The Dutch sheet exists (`/nl/404/` → 200, "BLAD NIET GEVONDEN") but GitHub Pages only ever serves the root `404.html`; the nginx rule in docs/REPO-MAP.md (`location /nl/ { error_page 404 /nl/404/index.html; }`) covers the Docker image only, and `.github/workflows/pages.yml` is the real deploy (CLAUDE.md).
  - Should: an unknown URL under `/nl/` shows the Dutch not-found sheet (SPEC §3.9, `/nl/404`; SPEC §1.4 Dutch under `/nl/`) — heading "BLAD NIET GEVONDEN", `lang="nl"`, sheet links to `/nl/…` — on the GitHub Pages deploy, with the English 404 unchanged for every other unknown URL.
  - Done when: under `npm run preview` (which serves `404.html` like GitHub Pages), `/nl/no-such-sheet` shows the Dutch sheet (h1 "BLAD NIET GEVONDEN", `html[lang=nl]`, first sheet link `/nl/`), still with status 404 and `noindex`, asserted in `tests/e2e/not-found.spec.ts`; `/no-such-sheet` still shows the English sheet; how the root 404 serves Dutch (and what happens without JS, if it needs JS) is recorded in `docs/RECORD.md`.

- [ ] **QA-71 every sheet but the homes — canonical, hreflang, sitemap and nav links all 301 on GitHub Pages**
  - Route: `/experience`, `/projects`, `/projects/<slug>`, `/certifications`, `/education` and their `/nl/` twins (18 of the 20 sitemap URLs).
  - Did: `curl -s https://michaelgoldman.dev/sitemap.xml`, then `curl -s -o /dev/null -w '%{http_code} %{redirect_url}'` on every `<loc>` (2026-10-05, live GitHub Pages; the same URLs are in the local build's `dist/sitemap.xml` and `<link rel="canonical">`, e.g. `dist/experience/index.html` → `https://michaelgoldman.dev/experience`).
  - Happened: every `<loc>` except `/` and `/nl/` answers `301` → the same path with a trailing slash (`/experience` → `/experience/`). So each page's canonical and hreflang alternates point at a redirect, the sitemap lists only redirecting URLs (Search Console reports these as "Page with redirect", not indexed as given), and every header tab, tab-bar cell, project card and prev/next link (`href="/experience"` etc.) costs a 301 round trip before the page. `astro preview` serves `/experience` with 200, so local tests never see it; docs/RECORD.md 2026-10-04 (PR-37) chose slash-less URLs, which the GitHub Pages deploy (`.github/workflows/pages.yml`) does not serve directly.
  - Should: the URLs the site publishes and links to are the ones the deploy answers with 200 — canonical, hreflang, sitemap and internal links agree with the host (either trailing-slash URLs, or a build format GitHub Pages serves slash-less, e.g. `build.format: 'file'`).
  - Done when: a test (e.g. `tests/e2e/seo.spec.ts` or a unit test over `dist/`) asserts, for every sitemap `<loc>`, every page's canonical and hreflang href and every internal `<a href>` on all 20 pages, that GitHub Pages would serve it without a redirect (path ending `/` with `dist/<path>/index.html` present, or `dist/<path>.html` present for a slash-less path); the decision is recorded in docs/RECORD.md superseding the 2026-10-04 PR-37 entry; the offline service worker still serves cached sheets for the chosen URL form (`tests/e2e/offline.spec.ts`).

---

## TODO-MANUAL

