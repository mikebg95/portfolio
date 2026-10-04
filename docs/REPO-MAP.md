# REPO-MAP

Where things live, what owns what, and traps with their symptoms. Pointers,
not prose: `path:line` + one sentence. Never what a task did — that is the
commit's job. Read by section (`grep -n '^## ' docs/REPO-MAP.md`), never
whole. Cap: 300 lines and 40,000 bytes; at the cap, replace the least useful
line.

## Orchestrator

- `.orchestrator/config.sh` — every loop setting; run.sh holds none.
- `.orchestrator/progress.md` — plain-English log for a human; untracked.
- `.orchestrator/logs/latest/` — this run's transcripts, one per agent.

## Tooling

- `src/config.ts` — `SITE_URL`, the one place the origin is written; `astro.config.ts` imports it.
- `package.json` `verify` — the full chain: typecheck, lint, format, unit, build, e2e.
- `.prettierignore` — `*.md`, `design/`, `docs/` excluded on purpose (docs/RECORD.md 2026-10-04).
- `vitest.config.ts` — includes `src/**/*.test.ts` and `tests/unit/**`; e2e specs live in `tests/e2e/` only, or Vitest would try to run them.
- TRAP: under an AI agent (AI_AGENT/CLAUDECODE set) Astro 7 `astro dev`/`astro preview` detach into the background and the npm script exits at once; pass `-- --ignore-lock` to stay in the foreground, or stop a detached one with `npx astro dev stop` / `npx astro preview stop`. Symptom: Playwright "Process from config.webServer exited early", then "4321 is already used".
- `playwright.config.ts` — projects chromium-desktop / chromium-phone / webkit-iphone; never reuses a server on 4321 (another project's could answer).
- `tests/e2e/helpers/axe.ts` — `expectNoAxeViolations(page)`, WCAG 2.2 AA tags; every page's e2e calls it.

## Styles

- `scripts/tokens.ts` — tokens.json → `src/styles/tokens.css`; one parse rule per token group, throws on a description it cannot read (fix the rule or the token, never the CSS).
- `src/styles/base.css` — imports tokens.css + fonts.css; body, focus ring, `.sr-only`.
- `src/styles/fonts.ts` — `PRELOAD_FONTS`, used by `src/components/FontPreload.astro`; `fonts.css` must declare the same URLs (tests/unit/tokens.test.ts).
- `public/fonts/` — vendored woff2 + OFL licences (docs/RECORD.md 2026-10-04).

## Content

- `src/content/schemas.ts` — zod schema per collection (SPEC §5), `LANGS`, `COLLECTIONS`; imported by `src/content.config.ts` and the tests.
- `src/content.config.ts` — glob loaders, `generateId` from the path; the only content config Astro 7 reads.
- `src/content/pairing.ts` — `findPairingErrors`: missing twin, lang ≠ folder, twin shape mismatch.
- `tests/unit/content-collections.test.ts` — reads every YAML from disk, runs schema + pairing; the "build-time" check.
- TRAP: the glob loader uses a `slug` data field as the entry id by default, so EN and NL twins collide ("multiple entries with the same slug" warning, one language silently dropped); `generateId` in content.config.ts prevents it.
- TRAP: the built data store is `node_modules/.astro/data-store.json`, not `.astro/`.
- `src/content/ui/<lang>/ui.yaml` — header, footer, SEO and 404 strings (copy.md Global/SEO/404); read via `t(lang)`.
- `tests/unit/helpers/content.ts` — `readCollection` (YAML from disk) and `fakeAstroContent` for `vi.mock('astro:content', …)`.
- TRAP: `astro:content` imports fine under Vitest but its store is empty — `getEntry` returns undefined, `getCollection` []; mock it with `fakeAstroContent`.

## Routes and languages

- `src/pages/[...lang]/` — every sheet once; `langPaths()` (src/i18n/paths.ts) yields `/x` and `/nl/x`.
- `src/pages/404.astro`, `src/pages/nl/404.astro` — the only per-language page files; built as `dist/404.html` and `dist/nl/404/index.html`.
- `src/i18n/paths.ts` — `DEFAULT_LANG`, `localize`, `delocalize`, `alternate`, `langPaths`; `astro.config.ts` i18n reads `LANGS`/`DEFAULT_LANG` from it.
- `src/i18n/routes.ts` — `SHEETS` (key, number, path) and `projectPath(slug)`.
- `src/i18n/content.ts` — `t(lang)`, `getLocalized`, `getAllLocalized`, `sharedId`.
- `src/layouts/SheetLayout.astro` — the page shell (`<html lang>`, title, fonts, `<main id="main">`); PR-6 draws the sheet in it.

