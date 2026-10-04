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

- [ ] **QA-71 every sheet but the homes — canonical, hreflang, sitemap and nav links all 301 on GitHub Pages**
  - Route: `/experience`, `/projects`, `/projects/<slug>`, `/certifications`, `/education` and their `/nl/` twins (18 of the 20 sitemap URLs).
  - Did: `curl -s https://michaelgoldman.dev/sitemap.xml`, then `curl -s -o /dev/null -w '%{http_code} %{redirect_url}'` on every `<loc>` (2026-10-05, live GitHub Pages; the same URLs are in the local build's `dist/sitemap.xml` and `<link rel="canonical">`, e.g. `dist/experience/index.html` → `https://michaelgoldman.dev/experience`).
  - Happened: every `<loc>` except `/` and `/nl/` answers `301` → the same path with a trailing slash (`/experience` → `/experience/`). So each page's canonical and hreflang alternates point at a redirect, the sitemap lists only redirecting URLs (Search Console reports these as "Page with redirect", not indexed as given), and every header tab, tab-bar cell, project card and prev/next link (`href="/experience"` etc.) costs a 301 round trip before the page. `astro preview` serves `/experience` with 200, so local tests never see it; docs/RECORD.md 2026-10-04 (PR-37) chose slash-less URLs, which the GitHub Pages deploy (`.github/workflows/pages.yml`) does not serve directly.
  - Should: the URLs the site publishes and links to are the ones the deploy answers with 200 — canonical, hreflang, sitemap and internal links agree with the host (either trailing-slash URLs, or a build format GitHub Pages serves slash-less, e.g. `build.format: 'file'`).
  - Done when: a test (e.g. `tests/e2e/seo.spec.ts` or a unit test over `dist/`) asserts, for every sitemap `<loc>`, every page's canonical and hreflang href and every internal `<a href>` on all 20 pages, that GitHub Pages would serve it without a redirect (path ending `/` with `dist/<path>/index.html` present, or `dist/<path>.html` present for a slash-less path); the decision is recorded in docs/RECORD.md superseding the 2026-10-04 PR-37 entry; the offline service worker still serves cached sheets for the chosen URL form (`tests/e2e/offline.spec.ts`).

---

## TODO-MANUAL

