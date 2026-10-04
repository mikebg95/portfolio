# RECORD

Decisions, measurements, and things tried and refused — dated, with who
decided. No tasks live here. Read the entries that bear on your task before
changing anything they cover.

<!-- ## YYYY-MM-DD — <decision>
Who: … Why: … Instead of: … -->

## 2026-10-04 — TypeScript 6.0.x, not 7
Who: agent (PR-1). Why: `@astrojs/check` 0.9.10 peers `typescript ^5 || ^6` and typescript-eslint
8.71 peers `<6.1`; TS 7.0.2 (latest) breaks both. Instead of: TS 7. Revisit when both accept it.

## 2026-10-04 — Prettier skips Markdown, `design/` and `docs/`
Who: agent (PR-1). Why: they are authored specification and sources; reformatting them churns
every task's diff (the task check runs `prettier --check` on every changed file). Instead of:
formatting all files.
