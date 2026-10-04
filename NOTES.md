# NOTES

## Never / always
- Never invent a fact: every claim, number, date and name comes from `docs/source/` or the repos.
  Test counts are 63 / 109 / 79 = 251.
- Never link a live Jamigos demo or the jamigos.app domain; never link archived tutorial repos.
- Never show the phone number or a street address in the HTML.
- Never make it look like a template: square corners, ink lines, the drawing vocabulary
  (design/README.md). No rounded cards, gradients, glassmorphism, emoji, coloured tech logos, Inter.
- Always: content in content collections, EN and NL both present (a missing NL field fails the build).
- Always: decoration `aria-hidden`; information in real text; WCAG 2.2 AA in both themes.
- Always: animation per `design/motion.md`; reduced motion → final state; no JS → full content.
- Always: no cookies, no trackers, no third-party requests at runtime (fonts self-hosted).

## Stack preferences
- Astro (latest stable) with TypeScript strict, `output: 'static'`. Plain CSS with custom properties
  generated from `design/tokens.json` (no Tailwind — the design is too specific). Astro i18n routing
  (`/` en, `/nl/` nl).
- GSAP + ScrollTrigger only for the Experience timeline and the Education exploded view, lazy-loaded.
- Tests: Vitest (content schemas, helpers such as timeline month maths), Playwright (every route,
  navigation, phone layout, keyboard, reduced motion, no-JS), @axe-core/playwright, Lighthouse CI
  budgets. ESLint + Prettier + `astro check`.
- Node 22. npm.
- Dockerfile: multi-stage (node build → nginx-unprivileged serving `dist/`), with sensible cache
  headers and a 404 fallback.
- GitHub Actions: on push/PR run lint, typecheck, unit, build, e2e, axe, Lighthouse; upload `dist/`
  as an artifact. No deploy job (hosting decided later).

## Priorities
1. First impression (the Overview sheet and its plotting animation) and instant readability.
2. Accuracy of every fact.
3. Originality of the drawing language, applied consistently on every sheet.
4. Performance and accessibility (Lighthouse targets in SPEC §7).
5. Dutch version.

## Build order
Scaffold & checks → tokens & fonts → sheet frame, header, footer, themes → Overview → Experience →
Projects + details → Certifications → Education → motion layers → Dutch → SEO/OG → 404 →
accessibility/performance hardening → Docker + CI.
