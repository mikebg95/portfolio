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

---

## TODO-MANUAL


- [ ] **REGRESS-20261005-070238 Fix what the pre-deploy full check failed**
  - The full check ran before the deploy and failed, so nothing shipped. Log: `.orchestrator/logs/run-20261004-190147/release-verify-024010.log` (repair 1 of 2).
  - What failed:
    - `✘   399 [chromium-desktop] › tests/e2e/projects.spec.ts:44:1 › cards lay out in 3 columns on desktop, 2 on tablet and 1 on phone (1.7s)`
    - `✘  1046 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /nl/projects/recipe-book/: one h1 and no axe violations in paper and in blueprint (10.4s)`
    - `✘  1047 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /projects/journal/: one h1 and no axe violations in paper and in blueprint (8.0s)`
    - `✘  1049 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /projects/scentify/: one h1 and no axe violations in paper and in blueprint (9.1s)`
    - `✘  1050 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /nl/projects/scentify/: one h1 and no axe violations in paper and in blueprint (30.1s)`
    - `✘  1051 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /certifications/: one h1 and no axe violations in paper and in blueprint (2ms)`
    - `✘  1052 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /nl/certifications/: one h1 and no axe violations in paper and in blueprint (2ms)`
    - `✘  1053 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /education/: one h1 and no axe violations in paper and in blueprint (2ms)`
    - `✘  1054 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /nl/education/: one h1 and no axe violations in paper and in blueprint (2ms)`
    - `✘  1055 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /no-such-sheet: one h1 and no axe violations in paper and in blueprint (6ms)`
    - `✘  1056 [webkit-iphone] › tests/e2e/accessibility.spec.ts:16:3 › /nl/404: one h1 and no axe violations in paper and in blueprint (2ms)`
    - `✘  1080 [webkit-iphone] › tests/e2e/certifications.spec.ts:25:1 › the sheet shows its label, heading and intro (1ms)`
    - `✘  1081 [webkit-iphone] › tests/e2e/certifications.spec.ts:40:3 › /certifications: four cards with ids, stamps and three verify links (4ms)`
    - `✘  1082 [webkit-iphone] › tests/e2e/certifications.spec.ts:68:1 › each card shows code, name, issuer · date, text and chips (4ms)`
    - `✘  1083 [webkit-iphone] › tests/e2e/certifications.spec.ts:40:3 › /nl/certifications: four cards with ids, stamps and three verify links (2ms)`
    - `✘  1084 [webkit-iphone] › tests/e2e/certifications.spec.ts:111:5 › /certifications: no heading breaks a word at 320 px (1ms)`
    - `✘  1085 [webkit-iphone] › tests/e2e/certifications.spec.ts:111:5 › /certifications: no heading breaks a word at 390 px (2ms)`
    - `✘  1086 [webkit-iphone] › tests/e2e/certifications.spec.ts:118:3 › /certifications: every stamp line fits inside its ring (3ms)`
    - `✘  1087 [webkit-iphone] › tests/e2e/certifications.spec.ts:111:5 › /nl/certifications: no heading breaks a word at 320 px (2ms)`
    - `✘  1088 [webkit-iphone] › tests/e2e/certifications.spec.ts:111:5 › /nl/certifications: no heading breaks a word at 390 px (1ms)`
    - `✘  1089 [webkit-iphone] › tests/e2e/certifications.spec.ts:118:3 › /nl/certifications: every stamp line fits inside its ring (2ms)`
    - `✘  1094 [webkit-iphone] › tests/e2e/crosshair.spec.ts:97:3 › phone › is absent (1ms)`
    - `✘  1095 [webkit-iphone] › tests/e2e/certifications.spec.ts:128:1 › cards lay out 2 × 2 from tablet up and in 1 column on phone (1ms)`
    - `✘  1097 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /: every dashed border draws all its sides, both themes (0ms)`
    - `✘  1098 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /experience/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1099 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/jamigos/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1100 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1101 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/subscription-tracker/: every dashed border draws all its sides, both themes (1ms)`
    - `✘  1102 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/recipe-book/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1103 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/scentify/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1104 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /projects/journal/: every dashed border draws all its sides, both themes (2ms)`
    - `✘  1105 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /certifications/: every dashed border draws all its sides, both themes (1ms)`
    - `✘  1106 [webkit-iphone] › tests/e2e/dashed-borders.spec.ts:147:3 › /education/: every dashed border draws all its sides, both themes (1ms)`
    - `✘  1107 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /nl/ (nl): no display heading breaks a word, 280–1440 px (3ms)`
    - `✘  1108 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › / (en): no display heading breaks a word, 280–1440 px (4ms)`
    - `✘  1109 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /experience/ (en): no display heading breaks a word, 280–1440 px (2ms)`
    - `✘  1110 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /nl/experience/ (nl): no display heading breaks a word, 280–1440 px (3ms)`
    - `✘  1111 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /projects/ (en): no display heading breaks a word, 280–1440 px (2ms)`
    - `✘  1112 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /nl/projects/ (nl): no display heading breaks a word, 280–1440 px (2ms)`
    - `✘  1113 [webkit-iphone] › tests/e2e/display-headings.spec.ts:45:3 › /projects/jamigos/ (en): no display heading breaks a word, 280–1440 px (1ms)`
  - Done when: the cause is fixed (never weaken, skip or delete a test) and the named tests and the task check are green.
