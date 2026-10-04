# Research: Michael's GitHub repos (read 2026-10-04)

Source of truth for project facts. All repos public under github.com/mikebg95. Re-read the repo
itself before writing a project's detail sheet; this is a summary, not a replacement.

## Profile README (mikebg95/mikebg95)
A fake terminal window drawn as SVG (`build.py` → `dark_mode.svg` / `light_mode.svg`): ASCII-art
portrait of Michael on the left (`portrait_light.txt`, copied here as `ascii-portrait.txt`), a scripted
shell session on the right (`cat skills.yml`, `gh stats --me`, `ls ~/vibecoded  # AI-built, not in
stats`, `contact`). Stats refresh daily by a GitHub Actions cron. Honesty signal: AI-built repos are
listed separately and excluded from stats. The ASCII portrait is the site's portrait.

## P-01 Jamigos (github.com/mikebg95/jamigos) — flagship, Aug 2025 – Nov 2025 (CV dates)
- What: deliberately minimal app — sign in, role-based dashboard, manage your own items. The point
  is the engineering around it (security & DevOps practice).
- Monorepo: `backend/` (Spring Boot), `frontend/` (Vue 3), `keycloak-theme/`.
- Backend: Java 25, Spring Boot 3.5, Spring Security, Data JPA, Data MongoDB, AOP, springdoc, Actuator.
  Layered (controller/service/repository); PostgreSQL (users, JPA) + MongoDB (items, audit log).
  Package `dev.michaelgoldman.jamigos`.
- Security: Keycloak OAuth2/OIDC (PKCE in browser), backend is a resource server validating JWTs.
  Three ordered SecurityFilterChains: Swagger public; Actuator basic auth (only /health public); API
  JWT. Roles from `realm_access.roles`. `@PreAuthorize`/`@PostFilter`. Custom `@RequireOwner`
  annotation + AOP aspect for ownership checks; audit-trail aspect; input-validation aspect;
  `UserSyncFilter` upserts the user from the token. Custom Keycloak login theme; Swagger UI wired to
  Keycloak.
- Frontend: Vue 3.5, Pinia, Vite, keycloak-js; Capacitor builds for iOS/Android; Vitest.
- Tests: backend unit (Mockito), slice (@DataJpaTest, @DataMongoTest), security tests of the filter
  chains and method security, integration tests on Testcontainers. Frontend Vitest suite (README says
  AI-generated — do not claim those as hand-written).
- CI/CD (.github/workflows/ci.yml): path-based change detection (dorny/paths-filter), backend
  `mvn verify`, frontend lint/test/build, Docker images pushed to GHCR, deployed to Render via API
  (three services: frontend, backend, Keycloak). Local/dev/test/prod Spring profiles; docker-compose
  for local (Postgres, Mongo, Keycloak, admin UIs).
- Status: hosting retired — the jamigos.app domain is gone. Never link a live demo. Say "hosting
  retired; code, tests and pipeline are public".
- README has an honest AI-authorship section (mobile build, mobile theme, frontend tests, UI restyle).

## Spring Persistence & Architecture Series (Jun 2026 – present)
Each project designed before built: architecture and code design from requirements, an OpenAPI
contract, a C4 model, a DBML schema and Flyway migrations. Java 26, Spring Boot 4.1, PostgreSQL,
Flyway, OpenAPI, ArchUnit, Testcontainers. 251 hand-written tests, all test-first (63 + 109 + 79,
counting @Test, @ParameterizedTest and ArchUnit @ArchTest). Backends only so far — no frontend, CI or
Docker yet in these repos (do not claim any).

### P-02 Subscription Tracker (github.com/mikebg95/subscription-tracker)
CRUD for recurring subscriptions with a count and monthly total; names unique case-insensitively.
Layered (controller → service → DAO), hand-written JDBC with JdbcTemplate, PostgreSQL 16, Flyway
(V2 turns a unique constraint into a case-insensitive unique index), code-first OpenAPI (springdoc),
RFC 9457 problem+json errors (400/404/409). 63 tests: service unit, @WebMvcTest, DAO integration,
end-to-end on Testcontainers; JaCoCo. Docs: C4 (`docs/architecture/*.png` system context, container,
component), `docs/database/schema.dbml` + `db-diagram.png`, UI designs in `docs/design/`.

### P-03 Recipe Book (github.com/mikebg95/recipe-book)
Recipes with ordered steps and ingredients. JPA/Hibernate via a hand-written EntityManager repository
(no Spring Data), PostgreSQL 18, 5 Flyway migrations. Design-first OpenAPI 3.1 (`docs/api/openapi.yaml`)
generating DTOs and API interfaces. Recipe is the aggregate root (cascade ALL, orphanRemoval),
SEQUENCE ids with allocationSize 50, @Version optimistic locking (409 on conflict), id-based equals,
open-in-view off, a summary projection for the list, CHECK constraints and deferrable unique
constraints on step order. ArchUnit enforces layering. 109 tests. Docs: OpenAPI, C4 DSL, DBML +
`db-diagram.png`, UI designs.

### P-04 Journal (github.com/mikebg95/journal) — in progress
Journaling app; one LLM call turns each entry into a one-sentence summary, tags, a mood and to-dos;
entry still saved if the AI call fails (graceful degradation). Hexagonal + DDD: `domain/model` rich
objects that reject invalid state, `application/port/in|out`, `adapter/in/web`,
`adapter/out/{persistence,ai}`. Spring AI 2.0, MapStruct, Spring Data JPA, Postgres 18, Flyway,
design-first OpenAPI 3.1. 79 tests: domain/service unit tests with in-memory fakes, persistence on
Testcontainers, ArchUnit enforcing hexagonal boundaries. Docs: requirements, architecture comparison
across the series, 7 ADRs (hexagonal at P3, synchronous AI processing, Spring AI, no cascade to tags,
tag data contract, graceful degradation, optimistic locking), C4 DSL, DBML, design system and screens.
Persistence adapter in progress; REST and AI adapters planned — say "in progress", never "done".

## P-05 Scentify (github.com/mikebg95/Scentify) — Nov 2020 – Jan 2021
Android app in Java: four questions (season, age, lifestyle, scent type) filter a catalogue of 52
fragrances; results list (custom ArrayAdapter) and detail screens. README has a demo GIF
(`scentify_gif.gif`) and an honest Limitations section. The origin story.

## Supporting
- Spring-Academy-Spring-Framework-Essentials: the official course lab exercises (backs the Spring cert).
- CS50-Psets: CS50 problem sets in C (backs the education sheet).
- Old tutorial repos are archived — never link them.
