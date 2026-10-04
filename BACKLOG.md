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

- [x] **PR-53 Responsive pass 320–2560**
  - Done when: Playwright visits every route at 320, 390, 768, 1024, 1440 and 2560 px wide and asserts no horizontal page scroll, no overlapping text (bounding-box check on headings/labels), tables scroll inside their framed box; screenshots saved as artifacts; fixes applied.
  - Spec: design/README.md "Responsive"; SPEC §7
  - Out of scope: —

- [ ] **PR-60 Content pass: wire the new briefing, then the Overview hero**
  - Michael, 2026-10-04: *"the orchestrator who built it didn't know all the info about me … many of the texts don't showcase everything accurately or good enough."* PR-60 to PR-66 are a recruiter-eye content pass (target: medior/senior Java roles around Amsterdam, backend-first with a full-stack profile, growing into DevOps). Layout, styling and motion stay exactly as they are. New facts are in `docs/source/briefing.md`; DJI limits are in `docs/source/private/briefing-private.md` (local only — never quote it, never commit it). For every task in this pass: update `design/copy.md` first (it wins on wording), then the EN and NL YAML; Dutch per SPEC §3.6.
  - Done when: SPEC §3.7 and CLAUDE.md list `docs/source/briefing.md` (and the private file, as "local only") as fact sources; on Sheet 01 — role line `Java software engineer — backend-first, full-stack, building towards DevOps.`; intro `Five years of Java backends — Spring Boot, Spring and Jakarta EE on PostgreSQL — with Angular, Vue and JSF frontends: for an influencer-marketing platform, a government agency and a consultancy's own product. I design the system before I build it, write the test before the code, and take what I build from first design to handover.` (the current intro overclaims Spring Boot for all five years and claims production for work that never reached it; "scale-up" is not in the sources); dimensions `5+ YRS JAVA · FULL-STACK` / `SPRING · JAKARTA EE`; balloon 2 `Dutch & English native` (the seven languages stay in General notes); revision note `REV. NOTE △ Every project in my Spring series started as a drawing: requirements, a C4 model, a database schema and an API contract. Then the tests. Then the code.` (Jamigos and Scentify did not); SEO descriptions — `/`: `Java software engineer in Amsterdam: Spring Boot and Jakarta EE backends with Angular and Vue frontends, secure by design and test-first. Moving into Kubernetes and DevOps.`, `/experience`: `Five years of full-stack Java — at LinkPizza, then for Conspect at DJI and on OptieCon — drawn to scale.`; NL twins faithful; screenshots of Sheet 01 at 390 and 1440 in both themes show nothing overflowing (if a string is too long, shorten the wording, never the layout); all tests green.
  - Spec: SPEC §3.6, §3.7, §4.1; design/copy.md Sheet 01 + SEO; docs/source/briefing.md
  - Out of scope: `<title>` strings (PR-58); How I work, Specification and AI note (PR-61, PR-62); any component or CSS change.

- [ ] **PR-61 Content pass: "How I work" with proof from real jobs, and an honest AI note**
  - Michael, 2026-10-04: the four cards read as claims; a recruiter wants each backed by something he did at work, not only in side projects. "Own it to production" is false for DJI (see the private briefing).
  - Done when: the four cards read (EN, same voice, tighter is fine if the facts stay): 1 **Design before build** — `Requirements, a C4 model, a database schema and an API contract come first, with the trade-offs written down as decision records. Then the code follows the drawing — in every project of my Spring series, and for the authentication and frontend I designed at DJI.` · 2 **Test first** — `The test comes before the code: unit, slice, integration against real databases with Testcontainers, and architecture rules with ArchUnit. TDD with JUnit and Mockito in my day-to-day work at DJI; 251 hand-written tests across my Spring series.` · 3 **Secure by design** — `Sign-in and permissions are where I go deepest: Microsoft Entra ID single sign-on at OptieCon, JWT authentication and authorisation at DJI, Keycloak with OAuth2 / OIDC in Jamigos — and tests that prove it, like the ~30 security tests at OptieCon.` · 4 title **Own it end to end** (NL `Eigenaar van begin tot eind`) — `At DJI I was the only developer on a new application inside a running system: from first design to knowledge sessions and a thorough handover. At LinkPizza I took the Media Kit from concept to the version that is still in use. Docker and CI/CD pipelines I build in my own projects; Kubernetes is next.`; AI note — `ON AI — I build with AI coding agents every day, with tests, architecture rules and review as the guardrails, and I label what was AI-built. This site is an example: an orchestrated loop of AI agents built it from my spec, design and backlog, and every fact on it comes from my CV and repositories. The Spring series and its tests are written by hand.`; NL twins; no card claims production, CI/CD or deployment at DJI; Sheet 01 screenshots at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 01 "How I work"; docs/source/briefing.md; docs/source/private/briefing-private.md
  - Out of scope: card layout and styling.

- [ ] **PR-62 Content pass: Specification rows match the CV and the market's keywords**
  - Michael, 2026-10-04: Spring itself, Spring MVC, JAX-RS, WildFly, SQL and Bitbucket are on his CV but missing here; "Java 21 · Spring Boot 3" undersells (he works with Java 17–26 and Spring Boot 3 and 4); recruiters search for "TDD", not "Test-first". Keep DDD.
  - Done when: S-01 BACKEND `Java 17 / 21 / 25+ · Spring Framework · Spring Boot 3 & 4 · Spring MVC · Jakarta EE · JAX-RS · WildFly · REST · OpenAPI · Maven`; S-02 SECURITY unchanged; S-03 DATA `PostgreSQL · SQL · JPA / Hibernate · Spring Data JPA · JDBC / JdbcTemplate · Flyway · MongoDB`; S-04 TESTING `TDD · JUnit · Mockito · Testcontainers · ArchUnit · Unit & integration tests`; S-05 FRONTEND `Angular · Vue · TypeScript · JSF / PrimeFaces · HTML / CSS`; S-06 DEVOPS `Docker · Docker Compose · GitHub Actions · CI/CD · Git · GitLab · Bitbucket` + the redline `Kubernetes — CKAD in progress`; S-07 DESIGN `Layered & hexagonal architecture · DDD · Clean code · C4 models · ADRs · Design-first APIs`; only if it fits the existing table without a layout change at 390 and 1440, add S-08 WAY OF WORKING `Scrum (PSM I) · Agile DevOps teams · Code review · Knowledge sessions` — otherwise skip S-08 and say so in the commit; every item traceable to `cv.md`, `briefing.md` or a repo; NL twin; tests green.
  - Spec: design/copy.md Sheet 01 Specification; docs/source/cv.md TECHNICAL SKILLS; docs/source/briefing.md
  - Out of scope: General notes and In progress (they are fine).

- [ ] **PR-63 Content pass: Experience texts — accurate claims, more substance**
  - Michael, 2026-10-04: the DJI revision note is false (read the private briefing); "I own its security end to end" overstates OptieCon; the LinkPizza Media Kit bullet hides the backend work, and LinkPizza is where his code went through a real CI/CD pipeline to production — the strongest honest production proof he has.
  - Done when: **OptieCon** context ends `I built its sign-in and security layer.` (not "own its security end to end"); stack says `Microsoft Entra ID`. **DJI** note `REV. NOTE △ The only developer on a new application inside a running system — from first design to knowledge sessions and a thorough handover.`; nothing on the DJI block says production, go-live, empty repository or greenfield, and no detail goes beyond `cv.md`. **LinkPizza** context `Influencer-marketing platform, team of 3–4 developers. A JSF monolith on WildFly being migrated to Quarkus microservices on Kubernetes; every change went from Bitbucket through Jenkins pipelines to WildFly test and production servers.`; Media Kit bullet uses the CV wording `…Developed the Angular frontend and much of the backend: business logic, data access and REST endpoints (JAX-RS). When the company stayed on JSF, rebuilt the frontend in JSF/PrimeFaces; it is still in use. Also shaped its concept and design.`; stack adds `Jenkins`; never imply he built the pipeline or the Quarkus services. NL twins; Sheet 02 screenshots at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 02; docs/source/cv.md; docs/source/briefing.md; docs/source/private/briefing-private.md
  - Out of scope: the timeline drawing, dates and durations.

- [ ] **PR-64 Content pass: project sheets — honest labels and finished-vs-planned in the right tense**
  - Michael, 2026-10-04: Jamigos' "Capacitor builds for iOS and Android" presents AI-generated work as his (his README says so); Journal's card says it has an AI step that is only planned; Scentify was not built at the end of the minor; "FLAGSHIP" oversells a deliberately minimal practice app.
  - Done when: **Jamigos** — kind `FULL-STACK` (NL `FULL-STACK`) instead of FLAGSHIP; card summary `A full-stack app built to practise security and delivery: Keycloak sign-in, roles, ownership checks and audit logging, tested on Testcontainers and shipped by its own GitHub Actions pipeline.`; FRONTEND row `Vue 3, Pinia, Vite and keycloak-js, signing in with OIDC + PKCE. The mobile build, the frontend unit tests and a later UI restyle were AI-generated and are labelled that way in the README.`; DELIVERY row `GitHub Actions builds and tests only what changed, pushes Docker images to GHCR and deployed three services — frontend, backend and Keycloak — to Render. Local, dev, test and prod profiles; Docker Compose for local work.`. **Journal** — card summary `Hexagonal architecture, a rich domain model and 7 written design decisions. The AI step that summarises each entry is designed and comes next.`; detail summary in a tense that matches its status (`…designed so that one AI call turns each entry into…`). **Scentify** — card summary `My first real app: an Android fragrance recommender in Java, built during a year of self-study before my first developer job.`. NL twins; no project text presents AI-generated work as his or planned work as built; screenshots of Sheet 03 and detail sheets 03.1, 03.4, 03.5 at 390 and 1440 show no overflow; tests green.
  - Spec: design/copy.md Sheet 03; docs/source/research-repos.md; docs/source/briefing.md; the repos' READMEs
  - Out of scope: figures and diagrams; Subscription Tracker and Recipe Book (accurate as they are).

- [ ] **PR-65 Content pass: Education closes the gap between the minor and the first job**
  - Michael, 2026-10-04: a recruiter reading 2018 minor → 2019 BSc → 2021 first job sees an unexplained gap; the self-study year that produced Scentify fills it.
  - Done when: the Minor Programming detail body (part 3) ends with `In 2020 I spent a year teaching myself Java and Android — Scentify (P-05) is from then — and in 2021 I started at LinkPizza.` (or the same facts, tighter); NL twin; the Sheet 05 detail panel at 390 and 1440 shows no overflow; tests green.
  - Spec: design/copy.md Sheet 05; docs/source/briefing.md
  - Out of scope: the exploded view, the parts list, adding a new part.

- [ ] **PR-66 Content pass: a guard test so the corrected claims stay corrected**
  - Michael, 2026-10-04: later tasks (PR-54 facts audit included) must not reintroduce what PR-60–65 removed.
  - Done when: a Vitest test reads the EN and NL content YAML (and copy.md) and fails if — the profile says "five years of Spring Boot" / "vijf jaar Spring Boot"; any How-I-work title or text contains "to production" / "tot in productie"; the DJI files (EN, NL) contain production/productie, "empty repository"/"lege repository", greenfield or go-live; OptieCon says "end to end"; the Jamigos spec mentions Capacitor without "AI-generated"/"AI-gegenereerd"; the Journal card summary describes the AI step without "next"/"designed" (NL equivalents); Scentify mentions the minor; Jamigos' kind is FLAGSHIP/VLAGGENSCHIP. The test file contains no confidential DJI terms — only the generic phrases above. PR-54's allowlist (when it runs) treats `docs/source/briefing.md` as a source; tests green.
  - Spec: SPEC §3.7; docs/source/briefing.md
  - Out of scope: changing any copy.

- [ ] **PR-54 Facts audit**
  - Done when: a test (or script in `verify`) extracts every number, date, URL and proper noun from the built EN pages and checks each appears in `docs/source/` or is a GitHub repo path that exists (using a committed allowlist file reviewed by this task against the sources); any invented fact is removed; Jamigos has no live link; phone number absent from all HTML.
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

