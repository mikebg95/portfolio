# CLAUDE.md — conventions for every task

<!-- Loaded into EVERY agent call and re-read on every turn, hundreds of times
a night. One sibling project let this reach ~245k tokens, past the context
window: its router failed on every call and every task fell back to the
most expensive model. So this file holds only what binds EVERY task.
Everything else lives one file per area in docs/conventions/. -->

## What this is
michaelgoldman.dev — Michael Goldman's portfolio (Java software engineer, Amsterdam), built as a
static Astro site designed as a set of engineering drawings ("Drawing set"). Audience: hiring
managers and recruiters at Java/DevOps employers. It must read instantly, look original (never like a
template) and make people say "wow" with drafting-themed motion — while every fact is exact.

## The specification
- `SPEC.md` — behaviour and pages, numbered. Read the sections your task names.
- `NOTES.md` — invariants ("Never / always" outranks everything), stack, priorities.
- `OPEN-QUESTIONS.md` — undecided points and the default to build.
- `design/README.md` (rules), `design/tokens.json` (values), `design/components.md` (parts + states),
  `design/motion.md` (all animation, binding), `design/copy.md` (every EN string),
  `design/screens/` (PNG drawings + their HTML in `html/`; index `design/screens/README.md`).
- `docs/source/` — CV (`cv.md`, `cv.pdf`), repo research, market research, ASCII portrait. The ONLY
  sources of facts, together with the public repos under github.com/mikebg95.
- Conflicts: NOTES "Never / always" > SPEC (behaviour) > design (looks: drawing > components.md >
  README) ; copy.md wins on wording.

## Checks

- **Per task:** `.orchestrator/task-check.sh` — typecheck, lint on changed
  files, the tests that import the changed code. Must be green before a commit.
- **Full check:** `.orchestrator/verify.sh` — runs the project's verify script
  (never type the underlying command; see `.orchestrator/verify.sh`). Runs
  once, before each deploy.
- **Start the app for walking it:** `npm run dev` → http://localhost:4321 (`npm run preview` serves the
  built `dist/` on the same port).

## Stack
Installed versions as of PR-1; "(chosen)" = picked by NOTES.md, installed by a later task.
- Node 22 (`.nvmrc`; Astro needs ≥ 22.12), npm.
- Astro 7.3.5, `output: 'static'`, `site` from `SITE_URL` in `src/config.ts`; Astro i18n routing
  `/` en, `/nl/` nl (chosen, PR-5).
- TypeScript 6.0.3 strict + `noUncheckedIndexedAccess` (`astro/tsconfigs/strict`); `@astrojs/check`
  0.9.10. Not TS 7: `@astrojs/check` and typescript-eslint do not accept it yet.
- Plain CSS with custom properties generated from `design/tokens.json` (chosen, PR-4). No Tailwind.
- GSAP + ScrollTrigger, lazy-loaded on Experience and Education only (chosen, PR-43/PR-44).
- Vitest 5.0.3 (unit, `getViteConfig`); Playwright 1.63.0 (e2e, `tests/e2e`, output `.e2e/`);
  @axe-core/playwright 4.13.0; Lighthouse CI budgets (chosen).
- ESLint 10.12.0 flat config (typescript-eslint 8.71.0, eslint-plugin-astro 3.2.1); Prettier 3.9.9
  with prettier-plugin-astro 1.1.0. Markdown, `design/` and `docs/` are not formatted.
- Dockerfile multi-stage node → nginx-unprivileged (chosen); GitHub Actions CI, no deploy (chosen).

<!-- Filled in by the first task that chooses it. Do not contradict it; a task
that genuinely needs something new adds it here in the same commit. -->

## Every task

- Personal data never reaches logs or error reports.
- No hard-coded product name, URL or credential — one config constant each.
- Facts only from `docs/source/` and the repos — never invent numbers, dates or results.
- Text lives in content collections (EN + NL), never in components.
- Decoration is `aria-hidden`; every page works without JS and with reduced motion.
- If it looks like a generic portfolio template, it is wrong (design/README.md).

## Contracts later tasks build on
- Content collection schemas (`src/content/schemas.ts`, wired in `src/content.config.ts`, SPEC §5) —
  changing one is its own task.
- Design tokens → CSS custom properties (generated from `design/tokens.json`); never hard-code a colour.
- `SheetLayout` (frame + header + footer + theme + view-transition names) — every page uses it.
- The motion helpers (`data-reveal`, plotting sequence, reduced-motion/no-JS guards) defined by the
  motion foundation task — later animation tasks use them, never a second system.

## What you may record, and where

- A convention for one area → `docs/conventions/<area>.md` (index below).
- A decision, measurement or refused idea → `docs/RECORD.md`, dated.
- Where things live, traps and their symptoms → `docs/REPO-MAP.md`.
- Here → only a rule that binds every task in the project. Almost nothing does.
  Keep this file under ~10,000 tokens; the loop warns past it.

## Conventions index

- Content (collections, EN/NL twins, YAML) → docs/conventions/content.md
- Styles (tokens → CSS, fonts, base, breakpoints) → docs/conventions/styles.md
