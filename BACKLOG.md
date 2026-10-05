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

### Design check of 81b3f38, 2026-10-05

- [x] **DESIGN-FIX-5 every sheet, phone — default (sheet frame and content padding)**
  - Drawing: design/screens/overview-default-light-390.png, experience-default-light-390.png, education-part3-sheet-light-390.png (HTML: the `.paper` is the full 390 px screen with a single 2 px ink border; header cells run edge to edge; sections padded 20 px).
  - Screen: src/components/SheetFrame.astro, src/styles/base.css (`--sheet-content-padding-phone`), tokens (`sheet.outer-padding`, `sheet.frame`, `sheet.content-padding`).
  - Differs: at 390, both schemes, the app keeps the desktop sheet: 8/12 px of desk around it, a 2 px outer border, a 10 px gap and a 1 px inner border, then 24 px content padding — the header starts at x=21 and the text column is ~300 px wide (text at x=45). The drawings have no desk and no double frame: header from x=2, text at x=22, a ~350 px column. Visible effects: the hero name and headings set smaller than drawn, Sheet 01's `DOWNLOAD CV (PDF)` button wraps to two lines (drawn one line, 48 px tall), the How-I-work rail does not run off the screen edge as drawn (`margin-right: -20px`). Screenshots: .e2e/design-check/overview-390-light-viewport.png, overview-390-light-a.png, experience-390-light-a.png, education-part3-sheet-390-light.png. Unsure: design/tokens.json gives the phone values the app uses (`outer-padding … 12px 8px on phone`, `content-padding … 24px phone`), which contradicts the phone drawings; the drawing outranks tokens for layout per CLAUDE.md, but if the token is the later decision, record it in docs/RECORD.md and close this as agreed.
  - Done when the drawn phone views (Sheet 01, Sheet 02, Sheet 05 with the part sheet open) match their drawings at 390, both schemes — sheet edge to edge with one 2 px frame, 20 px content padding — the undrawn phone sheets follow, nothing scrolls sideways at 320 px, and the task check is green.

---

## TODO-MANUAL

