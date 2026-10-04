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

- [ ] **PR-66 Content pass: a guard test so the corrected claims stay corrected**
  - Michael, 2026-10-04: later tasks (PR-54 facts audit included) must not reintroduce what PR-60–65 removed.
  - Done when: a Vitest test reads the EN and NL content YAML (and copy.md) and fails if — the profile says "five years of Spring Boot" / "vijf jaar Spring Boot"; any How-I-work title or text contains "to production" / "tot in productie"; the DJI files (EN, NL) contain production/productie, "empty repository"/"lege repository", greenfield or go-live; OptieCon says "end to end"; the Jamigos spec mentions Capacitor without "AI-generated"/"AI-gegenereerd"; the Journal card summary describes the AI step without "next"/"designed" (NL equivalents); Scentify mentions the minor; Jamigos' kind is FLAGSHIP/VLAGGENSCHIP. The test file contains no confidential DJI terms — only the generic phrases above. PR-54's allowlist (when it runs) treats `docs/source/briefing.md` as a source; tests green.
  - Spec: SPEC §3.7; docs/source/briefing.md
  - Out of scope: changing any copy.

- [ ] **PR-54 Facts audit**
  - Done when: a test (or script in `verify`) extracts every number, date, URL and proper noun from the built EN pages and checks each appears in `docs/source/` or is a GitHub repo path that exists (using a committed allowlist file reviewed by this task against the sources); any invented fact is removed; Jamigos has no live link; phone number absent from all HTML.
  - Sources include `docs/source/briefing.md` (it wins over older copy); `tests/unit/claims-guard.test.ts` (PR-66) must stay green.
  - Spec: SPEC §3.7; NOTES "Never / always"
  - Out of scope: —

- [ ] **PR-58 Tab title "Michael Goldman — Portfolio" and the MG favicon set**
  - Michael, 2026-10-04: *"in the tab in the browser it should be called Michael Goldman -- Portfolio"*; icon: *"the MG one is good, forget about the ASCII portrait."* Every icon is the **MG monogram cell** from the header (2 px ink square, "MG" in Archivo 800 wide, paper fill) — no ASCII portrait in any icon.
  - Done when: `<title>` is exactly `Michael Goldman — Portfolio` on `/` and `/nl/`, and `<Page> · Michael Goldman — Portfolio` on every other page in both languages (copy.md SEO table updated; og:title follows); `favicon.svg` (with a `prefers-color-scheme: dark` blueprint variant inside the SVG), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-512.png` + maskable and `site.webmanifest` (name "Michael Goldman — Portfolio", short_name "M. Goldman", theme colour from tokens) are generated by a build script from one source, linked in `<head>`; a test asserts the titles and every icon's existence and size.
  - Spec: SPEC §3.8; design/README.md; design/copy.md SEO
  - Out of scope: anything else in `<head>`.

- [ ] **PR-59 The ASCII portrait uses its dark-background version in the blueprint theme**
  - Michael, 2026-10-04: the portrait *"looks really good in lightmode but less good in darkmode"*. Cause: ASCII art maps dense glyphs (`@#%`) to dark areas; with light text on navy the light-mode file reads as a photo negative. `docs/source/ascii-portrait-dark.txt` (from his GitHub profile card, density inverted for dark backgrounds) is the fix.
  - Done when: `src/portrait.ts` exports both files; the portrait renders the dark file in the blueprint theme (both `[data-theme="blueprint"]` and system-dark-without-override) and the light file in paper — via two `<pre aria-hidden>` blocks toggled by CSS so it works without JS and never flashes the wrong one; the line-by-line scan-in animation (motion.md §M1) works for whichever is visible; colour in blueprint is tuned (try `--color-ink`/near-white vs `--color-line`) so contrast against the navy paper reads as a portrait, judged by screenshots of both themes saved to `.e2e/`; a test asserts the right file is visible per theme.
  - Spec: SPEC §4.1; design/motion.md §M1
  - Out of scope: the portrait's layout.

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

