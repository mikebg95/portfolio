# Copy — every English string

Exact wording; tasks put these into content files (`src/content/**`), never into components. Dutch:
translate faithfully per SPEC §3.6 (task PR-NL). Facts come only from `docs/source/`. Where a project
sheet needs more text than given here, write it from `docs/source/research-repos.md` and the repo
itself, in the same voice: first person, short sentences, concrete nouns, no hype words ("passionate",
"rockstar", "cutting-edge", "leverage", "seamless" are banned).

## Global
- Monogram: `MG` · `DRAWING SET` · `michaelgoldman.dev`
- Tabs: `SHEET 01` Overview · `SHEET 02` Experience · `SHEET 03` Projects · `SHEET 04` Certifications · `SHEET 05` Education
- Utilities: `EN` / `NL` · theme button `PAPER` / `BLUEPRINT` (aria-label "Switch to blueprint theme" / "Switch to paper theme") · `CV`
- Phone: button `SHEETS` (aria-label "Open sheet index") / `CLOSE`
- Skip link: `Skip to sheet content`
- Title block captions/values: `PROJECT` MICHAEL GOLDMAN · `SCALE` 1 : 1 · `SHEET` 01 / 05 · `DRAWN` M. GOLDMAN · `CHECKED` 251 TESTS · `REV` <build YYYY.MM> · `CONTACT` Email ↗ · LinkedIn ↗ · GitHub ↗
- Contact targets: mailto:mikebgoldman95@gmail.com · https://linkedin.com/in/mikebg95 · https://github.com/mikebg95
- Portrait sr-only text: `Portrait of Michael Goldman, drawn in ASCII characters.`

## SEO
| Page | title | description |
|---|---|---|
| / | Michael Goldman — Portfolio | Java software engineer in Amsterdam: Spring Boot and Jakarta EE backends with Angular and Vue frontends, secure by design and test-first. Moving into Kubernetes and DevOps. |
| /experience | Experience · Michael Goldman — Portfolio | Five years of full-stack Java — at LinkPizza, then for Conspect at DJI and on OptieCon — drawn to scale. |
| /projects | Projects · Michael Goldman — Portfolio | Jamigos and the Spring Persistence & Architecture series: designed first, then built and tested. |
| /projects/<slug> | <Title> · Michael Goldman — Portfolio | <project summary> |
| /certifications | Certifications · Michael Goldman — Portfolio | Spring Certified Professional, PSM I, Oracle Certified Associate Java SE 8 — CKAD in progress. Every one verifiable. |
| /education | Education · Michael Goldman — Portfolio | Political science, a programming minor with Harvard CS50, and how they assembled into a software engineer. |
| /404 | Sheet not found · Michael Goldman — Portfolio | — |

## Sheet 01 — Overview
- Label: `SHEET 01 — GENERAL ARRANGEMENT`
- Name: `MICHAEL` / `GOLDMAN`
- Role line: `Java software engineer — backend-first, full-stack, building towards DevOps.`
- Intro: `Five years of Java backends — Spring Boot, Spring and Jakarta EE on PostgreSQL — with Angular, Vue and JSF frontends: for an influencer-marketing platform, a government agency and a consultancy's own product. I design the system before I build it, write the test before the code, and take what I build from first design to handover.`
- Revision note: `REV. NOTE △` `Every project in my Spring series started as a drawing: requirements, a C4 model, a database schema and an API contract. Then the tests. Then the code.`
- Buttons: `VIEW PROJECTS →` · `DOWNLOAD CV (PDF)`
- Dimensions: `5+ YRS JAVA · FULL-STACK` · `SPRING · JAKARTA EE`
- Balloons: 1 `Spring certified` (→ /certifications) · 2 `Dutch & English native` · 3 `Trains Muay Thai`

### How I work (label `HOW I WORK`)
1. **Design before build** — Requirements, a C4 model, a database schema and an API contract come first, with the trade-offs written down as decision records. Then the code follows the drawing — in every project of my Spring series, and for the authentication and frontend I designed at DJI.
2. **Test first** — The test comes before the code: unit, slice, integration against real databases with Testcontainers, and architecture rules with ArchUnit. TDD with JUnit and Mockito in my day-to-day work at DJI; 251 hand-written tests across my Spring series.
3. **Secure by design** — Sign-in and permissions are where I go deepest: Microsoft Entra ID single sign-on at OptieCon, JWT authentication and authorisation at DJI, Keycloak with OAuth2 / OIDC in Jamigos — and tests that prove it, like the ~30 security tests at OptieCon.
4. **Own it end to end** — At DJI I was the only developer on a new application inside a running system: from first design to knowledge sessions and a thorough handover. At LinkPizza I took the Media Kit from concept to the version that is still in use. Docker and CI/CD pipelines I build in my own projects; Kubernetes is next.
- AI note (mono, under the four): `ON AI — I build with AI coding agents every day, with tests, architecture rules and review as the guardrails, and I label what was AI-built. The portfolio series and its tests are written by hand.`

### Specification (label `SPECIFICATION`)
- S-01 BACKEND — Java 17 / 21 / 25+ · Spring Framework · Spring Boot 3 & 4 · Spring MVC · Jakarta EE · JAX-RS · WildFly · REST · OpenAPI · Maven
- S-02 SECURITY — Spring Security · OAuth2 / OIDC · Keycloak · Microsoft Entra ID · JWT
- S-03 DATA — PostgreSQL · SQL · JPA / Hibernate · Spring Data JPA · JDBC / JdbcTemplate · Flyway · MongoDB
- S-04 TESTING — TDD · JUnit · Mockito · Testcontainers · ArchUnit · Unit & integration tests
- S-05 FRONTEND — Angular · Vue · TypeScript · JSF / PrimeFaces · HTML / CSS
- S-06 DEVOPS — Docker · Docker Compose · GitHub Actions · CI/CD · Git · GitLab · Bitbucket · *Kubernetes — CKAD in progress* (redline)
- S-07 DESIGN — Layered & hexagonal architecture · DDD · Clean code · C4 models · ADRs · Design-first APIs

### General notes (label `GENERAL NOTES`)
1. Dutch and American, based in Amsterdam.
2. Native Dutch and English. Italian C1, Portuguese B2, Spanish, French and German B1.
3. Off-sheet: kickboxing, surfing, guitar, chess, reading.
4. Studied political science first — I read stakeholders as carefully as stack traces.
5. Spent the first months of 2026 at a Muay Thai camp, backpacking and surfing in South-East Asia.
6. All dimensions in years unless stated otherwise.

### Current work (label `IN PROGRESS`)
- `OptieCon — security and sign-in, at Conspect` → /experience#optiecon
- `CKAD — Certified Kubernetes Application Developer` → /certifications#ckad
- `Journal — hexagonal architecture, part 3 of the series` → /projects/journal

## Sheet 02 — Experience
- Label `SHEET 02 — EXPERIENCE · ELEVATION` · Heading `FIVE YEARS, DRAWN TO SCALE`
- Timeline labels: `LINKPIZZA · FULL-STACK JAVA DEVELOPER` · `DJI · FULL-STACK JAVA ENGINEER` · `OPTIECON →` · `CONSPECT · NOV 2023 – NOW` · durations `2 Y 8 M`, `2 Y 0 M` · `HATCHED: SABBATICAL` / `MUAY THAI · SURFING`

### 02.1 OptieCon — Full-Stack Java Engineer (id `optiecon`)
JUN 2026 — NOW · CONSPECT · ALMERE
Context: `Conspect's internal product for employee share schemes: an Angular single-page app on a Spring Boot API. I built its sign-in and security layer.`
- Built single sign-on with Microsoft Entra ID (OAuth2 / OIDC with PKCE): MSAL in Angular, Spring Security as resource server.
- Wrote ~30 security tests covering tokens, authorisation and CORS.
Stack: Java 21 · Spring Boot 3.5 · Spring Security · Microsoft Entra ID · Angular 20 · PostgreSQL · Docker

### Sabbatical (id `sabbatical`, small hatched block)
JAN 2026 — MAY 2026 · SOUTH-EAST ASIA — `A Muay Thai camp, backpacking and surfing.`

### 02.2 DJI — Full-Stack Java Engineer (id `dji`)
JAN 2024 — JAN 2026 · CONSPECT · VEENHUIZEN
Context: `The Dutch Custodial Institutions Agency (Dienst Justitiële Inrichtingen). An Agile DevOps team moving a modular Spring monolith to Spring Boot microservices on OpenShift.`
- Sole developer of a new application replacing part of the legacy JSF system — designed and built its JWT authentication and authorisation and its Vue.js frontend from scratch, plus much of its REST API on the existing Spring backend.
- Day-to-day full-stack work, mostly backend: features, bug fixes, TDD with JUnit and Mockito, code reviews; worked with operations on the application's deployment.
- Gave knowledge sessions on the app's authentication and on client-side rendering; thorough handover.
Note: `REV. NOTE △ The only developer on a new application inside a running system — from first design to knowledge sessions and a thorough handover.`
Stack: Java · Spring · PostgreSQL · JPA/Hibernate · JUnit · Mockito · Vue.js 3 · JSF · Maven · Git/GitLab

### 02.3 LinkPizza — Full-Stack Java Developer (id `linkpizza`)
FEB 2021 — OCT 2023 · LINKPIZZA · AMSTERDAM
Context: `Influencer-marketing platform, team of 3–4 developers. A JSF monolith on WildFly being migrated to Quarkus microservices on Kubernetes; every change went from Bitbucket through Jenkins pipelines to WildFly test and production servers.`
- Built the Media Kit — a public influencer profile page designed to turn visitors into sign-ups, and the pilot for moving from JSF to Angular. Developed the Angular frontend and much of the backend: business logic, data access and REST endpoints (JAX-RS). When the company stayed on JSF, rebuilt the frontend in JSF/PrimeFaces; it is still in use. Also shaped its concept and design.
- Backend development in Jakarta EE: business logic in services; data access with JPA/Hibernate and hand-written JDBC, DTOs per use case.
- Full-stack features and bug fixes end to end, from JSF/PrimeFaces UI and backing beans to services and persistence.
Stack: Java 11 & 17 · Jakarta EE · WildFly · JAX-RS · JSF/PrimeFaces · Ajax · Angular 14 · PostgreSQL · JPA/Hibernate · JDBC · Maven · Git/Bitbucket · Jenkins

Employer description line (under the Conspect dimension, small): `Conspect — IT consultancy in agile software development and data analytics.`

## Sheet 03 — Projects
- Label `SHEET 03 — PROJECTS · DRAWING REGISTER` · Heading `DESIGNED FIRST. THEN BUILT.` · Intro `Each project has its own detail sheet: the architecture, the decisions, the tests and the repository.`
- Series line: `ASSEMBLY · SPRING PERSISTENCE & ARCHITECTURE SERIES` · `251 TESTS · ALL TEST-FIRST`
- Series intro (detail sheets of P-02..P-04 repeat it): `Three applications, each designed before it was built — requirements, an OpenAPI contract, a C4 model, a database schema and Flyway migrations — and each one a level deeper in persistence and architecture.`

| Code | Slug | Title | Card summary | Card facts | Status |
|---|---|---|---|---|---|
| P-01 · FULL-STACK | jamigos | Jamigos | A full-stack app built to practise security and delivery: Keycloak sign-in, roles, ownership checks and audit logging, tested on Testcontainers and shipped by its own GitHub Actions pipeline. | STACK Spring Boot · Vue / CHECKED Unit · slice · security · IT / PIPELINE GitHub Actions → GHCR | Hosting retired |
| P-02 · LAYERED · JDBC | subscription-tracker | Subscription Tracker | Hand-written SQL, clean error responses, C4 model and schema designed up front. | TESTS 63 / API Code-first / STATUS Backend done | done |
| P-03 · JPA · DESIGN-FIRST | recipe-book | Recipe Book | API contract first, code generated from it; architecture rules enforced by tests. | TESTS 109 / API Design-first / STATUS Backend done | done |
| P-04 · HEXAGONAL · IN PROGRESS | journal | Journal | Hexagonal architecture, a rich domain model and 7 written design decisions. The AI step that summarises each entry is designed and comes next. | TESTS 79 / ADRS 7 / STATUS Building | in progress |
| P-05 · ORIGIN | scentify | Scentify | My first real app: an Android fragrance recommender in Java, built during a year of self-study before my first developer job. | YEAR 2020 / STACK Android / LANG Java | done |

### Detail sheets (03.1–03.5)
Common: back link `← SHEET 03 · DRAWING REGISTER` · label `DETAIL SHEET 03.n — P-0n` · button `REPOSITORY ON GITHUB ↗` · bottom `← PREVIOUS SHEET` / `NEXT SHEET →`.

**03.1 Jamigos** — summary `A deliberately simple app — sign in, see a dashboard for your role, manage your own items — used to practise everything around it: security, testing and delivery.` · meta `AUG 2025 – NOV 2025 · HOSTING RETIRED` · FIG. 1 `CONTAINER VIEW` (Browser · Vue 3 —JWT→ Spring Boot API —→ PostgreSQL / MongoDB; Keycloak dashed) · Spec rows: SECURITY `Three ordered security chains: public API docs, Actuator behind basic auth, the API behind JWT. Roles read from the token; method security and a custom ownership annotation enforced by an aspect.` · DATA `PostgreSQL for users (JPA), MongoDB for items and the audit log.` · TESTING `Unit, slice, security and integration tests on Testcontainers.` · FRONTEND `Vue 3, Pinia, Vite and keycloak-js, signing in with OIDC + PKCE. The mobile build, the frontend unit tests and a later UI restyle were AI-generated and are labelled that way in the README.` · DELIVERY `GitHub Actions builds and tests only what changed, pushes Docker images to GHCR and deployed three services — frontend, backend and Keycloak — to Render. Local, dev, test and prod profiles; Docker Compose for local work.` · FIG. 2 `PIPELINE ROUTE` (detect changes → build & test → image → GHCR → deploy) · Note `REV. NOTE △ The jamigos.app domain is retired. The code, tests and pipeline stay public on GitHub.`

**03.2 Subscription Tracker** — summary `Track recurring subscriptions and see your monthly total. Part 1 of the series: a classic layered backend with hand-written SQL.` · meta `JUN 2026 · SERIES PART 1` · FIG. 1 `LAYERS` (Controller → Service → DAO · JdbcTemplate → PostgreSQL) · FIG. 2 `TEST PYRAMID — 63 TESTS` (end-to-end on Testcontainers / DAO integration / web slice / unit) · Note `REV. NOTE △ Names are unique regardless of case — enforced by a case-insensitive unique index, not just in code.`

**03.3 Recipe Book** — summary `Recipes with ordered steps and ingredients. Part 2 of the series: JPA done deliberately, with the API contract written before any code.` · meta `JUL 2026 · SERIES PART 2` · FIG. 1 `DESIGN-FIRST FLOW` (openapi.yaml → generated API interfaces & DTOs → controllers → Recipe aggregate → PostgreSQL) · FIG. 2 `AGGREGATE` (Recipe root owning Steps and Ingredients; @Version) · Note `REV. NOTE △ Re-ordering steps saves in one transaction thanks to deferrable unique constraints.`

**03.4 Journal** — summary `A journal designed so that one AI call turns each entry into a summary, tags, a mood and to-dos — and the entry is still saved if the AI is down. Part 3 of the series: hexagonal architecture and a rich domain model.` · meta `JUL 2026 – NOW · SERIES PART 3 · IN PROGRESS` · FIG. 1 `PORTS & ADAPTERS` (hexagon: domain centre; in: web; out: persistence, AI) · FIG. 2 `DECISION RECORDS` (the 7 ADR titles from the repo) · Note `REV. NOTE △ In progress: the domain model is built and persistence is under way; the web and AI adapters come next.`

**03.5 Scentify** — summary `Answer four questions — season, age, lifestyle, scent type — and get matching fragrances from a catalogue of 52. My first real app.` · meta `NOV 2020 – JAN 2021 · ANDROID` · FIG. 1 `QUESTION FLOW` (4 questions → filter → results list → detail) · FIG. 2 `DEMO` (the repo's GIF, captioned `Scentify running on an Android emulator.`) · Note `REV. NOTE △ Where it started: the app that made me want to do this every day.`

## Sheet 04 — Certifications
- Label `SHEET 04 — CERTIFICATIONS · INSPECTION RECORD` · Heading `INSPECTED AND SIGNED OFF` · Intro `Every stamp links to the issuer's own record, so you can check it yourself.`
- C-01 Spring Certified Professional · VMware by Broadcom · Aug 2025 · stamp VERIFIED / 2025 / BROADCOM · `How Spring works underneath: configuration and auto-configuration, transactions and data access, Spring MVC and REST, security, Actuator and testing Spring Boot applications properly.` · chips Spring Boot, Spring Security, Data & transactions, MVC & REST, AOP, Actuator, Boot testing · `VERIFY ON CREDLY ↗`
- C-02 Professional Scrum Master I (PSM I) · Scrum.org · Jan 2025 · VERIFIED / 2025 / SCRUM.ORG · `How Scrum teams really work: accountabilities, events and artefacts, and the empiricism behind them — useful every sprint in an agile DevOps team.` · chips Scrum, Agile, Empiricism, Facilitation · `VERIFY ON CREDLY ↗`
- C-03 Oracle Certified Associate, Java SE 8 Programmer · Oracle · Jun 2024 · VERIFIED / 2024 / ORACLE · `The Java language itself, exactly: types, object orientation, exceptions and the core APIs.` · chips Java SE, OOP, Core APIs · `VERIFY ON ORACLE ↗`
- C-04 Certified Kubernetes Application Developer (CKAD) · The Linux Foundation · in progress · stamp PENDING / CKAD / IN PROGRESS · `Designing, deploying and running applications on Kubernetes — the next step after Docker and CI/CD.` · chips Pods & deployments, Config & secrets, Probes, Services · no link

## Sheet 05 — Education
- Label `SHEET 05 — ASSEMBLY, EXPLODED VIEW` · Heading `HOW THIS ENGINEER WAS ASSEMBLED` · Intro `Not a straight line from a computer-science degree. Each layer below carries load in the final build — select a part to open its detail.`
- Balloons: 1 `VWO — base` · 2 `BSc Political Science` · 3 `Minor Programming` · 4 `Harvard CS50` · 5 `CKAD — to be fitted`
- Parts list headers `ITEM · PART · SUPPLIER · YEAR`; rows: 5 CKAD (in progress) · Linux Foundation · — / 4 CS50 Intro to CS · Harvard / UvA · 2018 / 3 Minor Programming · UvA · 2018 / 2 BSc Political Science · UvA · 2016–19 / 1 VWO · Amsterdams Lyceum · 2007–13
- Detail panels (label `DETAIL n · SCALE 2:1`):
  1. **VWO** — Het Amsterdams Lyceum · 2007–2013 — `Pre-university secondary education in Amsterdam: the base plate everything else is mounted on.`
  2. **BSc Political Science** — University of Amsterdam · 2016–2019 · 180 EC — `Three years of studying how institutions and people actually make decisions: analysing complex systems, doing research and writing it down clearly. It's why I'm at ease with stakeholders and requirements, and why I write decisions down.` · NOTE: `part 2 is load-bearing.`
  3. **Minor Programming** — University of Amsterdam · 2018 · 30 EC — `Halfway through political science I took a full semester of programming, and found what I wanted to do every day. It's where I learned to think in algorithms and trade-offs, and to learn a language by shipping something with it. In 2020 I spent a year teaching myself Java and Android — Scentify is from then — and in 2021 I started at LinkPizza.` · rows 3.1 `CS50 — C, memory, algorithms, Python, SQL` 6 EC · 3.2 `Android app development in Java` 12 EC · 3.3 `Programming theory — heuristics` 12 EC
  4. **Harvard CS50** — Introduction to Computer Science · within the minor · 6 EC — `Harvard's introduction to computer science: C and memory, algorithms and data structures, then Python, SQL and the web. My problem sets are on GitHub.` · link `CS50 PROBLEM SETS ON GITHUB ↗` → https://github.com/mikebg95/CS50-Psets
  5. **CKAD (to be fitted)** — The Linux Foundation · in progress — `The next part going on: Kubernetes, for building and running applications the way the teams I want to join do.` · link `SEE SHEET 04 →`

## 404
- Label `SHEET ?? — NOT IN SET` · Heading `SHEET NOT FOUND` · note `REV. NOTE △ This sheet isn't in the set. Try one of these:` · list of the five sheets.
