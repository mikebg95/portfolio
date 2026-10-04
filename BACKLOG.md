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
