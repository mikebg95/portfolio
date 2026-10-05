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

- [x] **DESIGN-FIX-1 / — default (Specification panel has no top rule)**
  - Drawing: design/screens/overview-default-light-1440.png and design/screens/overview-default-light-390.png (both draw a full-width ink rule above SPECIFICATION; design/README.md Layout: "Sections are separated by full-width 1 px ink rules … never by empty space alone").
  - Screen: src/pages/[...lang]/index.astro, src/components/overview/HowIWork.astro, src/components/overview/SpecNotes.astro, src/styles/base.css (`.sheet-panel + .sheet-panel`).
  - Differs: the drawing shows a full-width rule above the SPECIFICATION / GENERAL NOTES panel. The app has none at 1280 and 390, in both schemes: `section.spec-notes` has `border-top: 0` (measured), so the "ON AI" line runs straight into SPECIFICATION with only empty space between them, and on desktop the vertical rule between Specification and General notes starts in mid-air. Cause: HowIWork's `<script type="module">` is rendered between `section.how-i-work` and `section.spec-notes`, so the adjacent-sibling selector never matches (the IN PROGRESS panel still gets its rule). Screenshots: .e2e/design-check/overview-1280-light.png, overview-1280-dark.png, overview-390-light-b.png.
  - Done when the view matches the drawing at 1280 and 390, both schemes (a 1 px ink rule spans the sheet above SPECIFICATION, and the Spec/Notes vertical rule meets it), and the task check is green. Prefer a fix that no stray `<script>` can break again on any sheet (e.g. `~` / `:not(script)` siblings, or the script moved out of the panel flow).

- [ ] **DESIGN-FIX-2 /experience — default (no dashed rule between 02.1a OptieCon and 02.1b Sabbatical)**
  - Drawing: design/screens/experience-default-light-1440.png (detail blocks divided by rules); design/components.md ExperienceDetail: the employer's assignments have "dashed rules between them".
  - Screen: src/components/experience/ExperienceDetail.astro (`.experience-detail__assignments > :global(article + article)`), src/components/experience/ExperienceBreak.astro.
  - Differs: at 1280, in both schemes, a dashed rule separates 02.1b Sabbatical from 02.1c DJI but there is none between 02.1a OptieCon and 02.1b Sabbatical (`#sabbatical` measured `border-top: 0`), so the sabbatical reads as part of the OptieCon block. Cause: a `<script>` is rendered between `#optiecon` and `#sabbatical` inside `.experience-detail__assignments`, so `article + article` does not match. Screenshot: .e2e/design-check/experience-1280-light.png, experience-1280-dark.png.
  - Done when the view matches the drawing at 1280, both schemes (one dashed rule between each pair of assignments: 02.1a | 02.1b | 02.1c), the phone cards are unchanged, and the task check is green.

- [ ] **DESIGN-FIX-3 /certifications — default (stamp middle line and card title setting)**
  - Drawing: design/screens/certifications-default-light-1440.png (its HTML: `.stamp b{font-size:13px}`; card `h2` 28 px, weight 800, `font-stretch: 112%`, default line-height).
  - Screen: src/components/drawing/Stamp.astro, src/components/certifications/CertCard.astro.
  - Differs: (1) the stamp's middle line (the year `2025`/`2024`, and `CKAD` on the pending stamp) is drawn larger than its two neighbours — 13 px vs 10 px; the app sets it at the same 10 px as `VERIFIED`/issuer (only heavier), so the stamp loses its centre. Seen at 1280 and 390, both schemes. (2) Card titles: the drawing sets them at weight 800, stretch 112 % with open leading (≈ 31 px line step at 28 px); the app uses the generic DisplayHeading setting — weight 850, stretch 118 %, line-height 0.92 (23.5 px step at 25.6 px) — so two- and three-line names (ORACLE CERTIFIED / ASSOCIATE, JAVA SE 8 / PROGRAMMER; CERTIFIED KUBERNETES …) sit cramped where the drawing has air between lines. Point (2) conflicts with components.md DisplayHeading (line-height .88–.92); the drawing outranks components.md, but I was unsure — the agent may record why it keeps the generic setting instead. Screenshots: .e2e/design-check/certifications-1280-light.png, certifications-1280-dark.png, certifications-390-light.png.
  - Done when the view matches the drawing at 1280, both schemes (stamp middle line 13 px; card titles as the drawing sets them, still fitting at 320 px per PR-61), and the task check is green.

- [ ] **DESIGN-FIX-4 every sheet — default, blueprint at 1280 (header utilities wrap under the monogram)**
  - Drawing: design/screens/overview-default-light-1440.png (and every 1440 drawing: one header row, monogram cell + five tab cells); docs/RECORD.md 2026-10-04 PR-7: at ≥ 1280 px monogram, tabs and utilities share one row; below that monogram + utilities form row 1 and the tabs row 2.
  - Screen: src/components/SheetHeader.astro.
  - Differs: at 1280×800 in the blueprint scheme (system dark, no override) the header breaks into neither agreed shape: row 1 is monogram + five tabs stretched to 970 px, and the utilities (EN · NL · BLUEPRINT · CV) drop to a 60 px row 2 starting under the monogram (measured `.sheet-header__utils` x=37 y=135 w=283). In paper at 1280 everything fits one row (utils 252 px); the longer `BLUEPRINT` label (283 px) tips it over. Also at 1440 dark the tabs shrink to 155 px each but stay in one row. Screenshots: .e2e/design-check/overview-1280-dark.png, projects-1280-dark.png, education-1280-dark.png (same on every sheet) vs overview-1280-light.png.
  - Done when every sheet at 1280, both schemes, shows the header as one row (monogram, five tabs ≥ 140 px, utilities) — or, if it cannot fit, the PR-7 two-row shape — with no layout difference between paper and blueprint, and the task check is green.

- [ ] **DESIGN-FIX-5 every sheet, phone — default (sheet frame and content padding)**
  - Drawing: design/screens/overview-default-light-390.png, experience-default-light-390.png, education-part3-sheet-light-390.png (HTML: the `.paper` is the full 390 px screen with a single 2 px ink border; header cells run edge to edge; sections padded 20 px).
  - Screen: src/components/SheetFrame.astro, src/styles/base.css (`--sheet-content-padding-phone`), tokens (`sheet.outer-padding`, `sheet.frame`, `sheet.content-padding`).
  - Differs: at 390, both schemes, the app keeps the desktop sheet: 8/12 px of desk around it, a 2 px outer border, a 10 px gap and a 1 px inner border, then 24 px content padding — the header starts at x=21 and the text column is ~300 px wide (text at x=45). The drawings have no desk and no double frame: header from x=2, text at x=22, a ~350 px column. Visible effects: the hero name and headings set smaller than drawn, Sheet 01's `DOWNLOAD CV (PDF)` button wraps to two lines (drawn one line, 48 px tall), the How-I-work rail does not run off the screen edge as drawn (`margin-right: -20px`). Screenshots: .e2e/design-check/overview-390-light-viewport.png, overview-390-light-a.png, experience-390-light-a.png, education-part3-sheet-390-light.png. Unsure: design/tokens.json gives the phone values the app uses (`outer-padding … 12px 8px on phone`, `content-padding … 24px phone`), which contradicts the phone drawings; the drawing outranks tokens for layout per CLAUDE.md, but if the token is the later decision, record it in docs/RECORD.md and close this as agreed.
  - Done when the drawn phone views (Sheet 01, Sheet 02, Sheet 05 with the part sheet open) match their drawings at 390, both schemes — sheet edge to edge with one 2 px frame, 20 px content padding — the undrawn phone sheets follow, nothing scrolls sideways at 320 px, and the task check is green.

---

## TODO-MANUAL

