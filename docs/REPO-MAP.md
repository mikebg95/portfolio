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
