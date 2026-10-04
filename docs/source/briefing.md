# Briefing from Michael (2026-10-04)

Facts Michael supplied directly after reviewing the site as a recruiter would. Same standing as
`cv.md` under SPEC §3.7. Where this file and older copy disagree, this file wins. Before writing
anything about DJI, also read `docs/source/private/briefing-private.md` (local only, gitignored).

## Positioning
- Target: medior/senior Java roles around Amsterdam. Backend-first, with a full-stack profile;
  growing into DevOps, Kubernetes, cloud and AI engineering.
- No "open to work" or availability wording anywhere on the site.
- Dutch and English are both native; for the Dutch market that matters more than the count of
  languages.

## Which framework, where
- LinkPizza (Feb 2021 – Oct 2023): Jakarta EE on WildFly — JAX-RS, JSF/PrimeFaces, JPA/Hibernate,
  JDBC; Angular 14 for the Media Kit pilot. Not Spring.
- DJI (Jan 2024 – Jan 2026, via Conspect): Spring (the framework) on an existing backend, not Spring Boot.
- OptieCon (Jun 2026 – now, Conspect): Spring Boot 3.5, Java 21.
- Own projects: Spring Boot 3.5 / Java 25 (Jamigos), Spring Boot 4.1 / Java 26 (the series).
- So: "five years of Spring Boot" is wrong. "Five years of Java — Spring Boot, Spring and Jakarta EE"
  is right.

## LinkPizza: how code reached production (former LinkPizza colleague, confirmed by Michael)
- Developers worked in IntelliJ and pushed to Bitbucket; a Bitbucket callback triggered Jenkins,
  which ran the project's Jenkinsfile.
- Java projects deployed to WildFly test and production servers; there were dev and production
  Kubernetes deployments too.
- WildFly (JBoss) ran the UI and tracking; the newer microservices ran on Quarkus. The UI started as
  a layered monolith being migrated to microservices; overall a mix of layered and hexagonal.
- Michael's work went through this pipeline to production. He used it; he did not build it. He did
  not build the Quarkus services.
- The Media Kit (its JSF/PrimeFaces version) is still in use.

## DJI
- Michael designed and built the new application's JWT authentication and authorisation and its
  Vue.js frontend; he built much of its REST API on an existing Spring backend.
- Everything else about DJI: stay at the level of `cv.md`, and follow the private briefing.

## Jamigos
- The mobile build (Capacitor iOS/Android), the mobile Keycloak theme, the frontend Vitest tests and
  the later UI restyle were AI-generated (repo README, "Authorship"). Never present them as his work.
- It was deployed to Render as three services by its pipeline; hosting is now retired.

## Scentify
- Built Nov 2020 – Jan 2021 during a year of self-study in Java and Android, before his first
  developer job (repo README) — not during or at the end of the 2018 programming minor.

## This site
- Built by AI coding agents running in an orchestrated loop (`.orchestrator/`), from the spec, design
  and backlog Michael set up, with tests (Playwright, axe, a facts audit) as guardrails. Michael
  supplies the facts. Say so in the AI note: he labels what was AI-built.
