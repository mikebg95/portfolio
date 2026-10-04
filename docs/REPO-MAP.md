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
- `src/components/drawing/` — the shared drawing primitives (components.md); `src/revision-note.ts` splits a note's "REV. NOTE △" lead off.
- `src/dev/primitives.astro` — the `/_primitives` specimen page; `astro.config.ts` injects it only in dev or when `BUILD_PRIMITIVES=1` (Playwright's webServer sets it), so production builds never have it.
- TRAP: a token like `--border-normal: 1.5px solid var(--color-ink)` resolves where it is declared; in a nested `[data-theme]` it would keep the outer ink unless re-declared there (tokens.css does it for every `[data-theme]`). Symptom: borders in the page theme's colour inside the other theme's section.
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
- `src/portrait.ts` — `PORTRAIT`, `docs/source/ascii-portrait.txt` inlined via `?raw` at build time; the only copy of the portrait.
- `tests/unit/profile-content.test.ts` — parses design/copy.md Sheet 01 and compares it with the EN profile; a copy.md wording change fails it.

## Routes and languages

- `src/pages/[...lang]/` — every sheet once; `langPaths()` (src/i18n/paths.ts) yields `/x` and `/nl/x`.
- `src/pages/404.astro`, `src/pages/nl/404.astro` — the only per-language page files; built as `dist/404.html` and `dist/nl/404/index.html`.
- `src/i18n/paths.ts` — `DEFAULT_LANG`, `localize`, `delocalize`, `alternate`, `langPaths`; `astro.config.ts` i18n reads `LANGS`/`DEFAULT_LANG` from it.
- `src/i18n/routes.ts` — `SHEETS` (key, number, path) and `projectPath(slug)`.
- `src/i18n/content.ts` — `t(lang)`, `getLocalized`, `getAllLocalized`, `sharedId`.

## Sheet chrome

- `src/layouts/SheetLayout.astro` — the page shell: `<html lang>`, theme-init inline script, skip link, `SheetFrame` with `SheetHeader`, `<main id="main" tabindex="-1">` and `TitleBlock`; props `lang`, `title`, `sheet`.
- `src/components/SheetFrame.astro` — desk, paper + grid, double frame, zone strip 1–8 (desktop only, `aria-hidden`).
- `src/theme.ts` — `THEMES`, `THEME_STORAGE_KEY`, `effectiveTheme`, `otherTheme`; the head script and the theme switch both read them.
- `src/components/SheetHeader.astro` — monogram, tabs (`aria-current="page"` from SheetLayout's `sheet` prop; project details pass `projects`, 404 none), utilities, and the phone sheet index (`[data-sheet-index]`: `<details>` without JS, its `<script>` swaps in the button + `#sheet-index-panel`); TWO theme buttons render (header + panel), both `[data-theme-switch]`, wired by one script; their label/name is switched by CSS, not JS (docs/RECORD.md 2026-10-04).
- `src/config.ts` `CV_PATH` — `public/michael-goldman-cv.pdf`, a committed copy of `docs/source/cv.pdf`; `tests/unit/cv.test.ts` fails when they differ (re-copy, never edit).
- `tests/e2e/header.spec.ts` — tabs per language, language switch, CV, tablet one-row; skipped below 768 px.
- `tests/e2e/sheet-index.spec.ts` — phone panel: open, navigate, Escape, focus trap (Chromium only), outside tap, no-JS `<details>`; skipped at ≥ 768 px.
- `src/components/TitleBlock.astro` — the footer (rendered by SheetLayout, sheet number from its `sheet` prop); captions from `ui.titleBlock`, contact from `profile.contact`, REV/SHEET formatters in `src/title-block.ts`; cells draw only left+top rules so 2 and 4 columns both stay ruled.
- `tests/e2e/sheet.spec.ts` — skip link, frame widths/grid, zone strip per viewport, stored theme applied.
- `tests/e2e/theme.spec.ts` — toggle + reload, dark system, storage blocked, every sheet × both themes with axe.
- TRAP: Playwright `toHaveText(…, { useInnerText: true })` still includes `.sr-only` text (clip is not "not rendered"); assert the visible label `.sheet-header__theme-label:visible` instead.
