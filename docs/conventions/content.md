# Content collections

- One entry per language: `src/content/<collection>/<lang>/<id>.yaml`, `lang:` equal to the folder.
  Astro ids are `<lang>/<id>`; fetch by ``getEntry(collection, `${lang}/${id}`)``.
- Every EN entry has an NL twin with the **same shape**: same optional fields present, same list
  lengths. `tests/unit/content-collections.test.ts` fails otherwise (it also validates every file
  against `src/content/schemas.ts`).
- Every NL twin is written in Dutch (SPEC §3.6; vocabulary in docs/RECORD.md, 2026-10-04). A unit
  test fails on any entry with `translated: false`; `tests/e2e/dutch.spec.ts` fails if a built
  `dist/nl/` page carries copy.md Global's English UI words.
- `id` (experience) and `slug` (projects) equal the file name.
- Quote YAML strings containing `: `, `#`, a comma inside `{ … }` / `[ … ]` (it splits the item), a leading `*`/`&`/`!`, or that look like dates/booleans;
  `YYYY-MM` months are always quoted (`'2026-06'`).
- YAML is Prettier-formatted like code (`npx prettier --write <file>`); the checks fail otherwise.
- Changing a schema is its own task (CLAUDE.md contracts); a content task only fills fields.
