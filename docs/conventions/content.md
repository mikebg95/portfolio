# Content collections

- One entry per language: `src/content/<collection>/<lang>/<id>.yaml`, `lang:` equal to the folder.
  Astro ids are `<lang>/<id>`; fetch by ``getEntry(collection, `${lang}/${id}`)``.
- Every EN entry has an NL twin with the **same shape**: same optional fields present, same list
  lengths. `tests/unit/content-collections.test.ts` fails otherwise (it also validates every file
  against `src/content/schemas.ts`).
- Until the Dutch tasks (PR-48–50): an EN content task writes the NL twin with the English text and
  `translated: false`. The Dutch tasks flip it to `true` (or drop it — the default is `true`).
- `id` (experience) and `slug` (projects) equal the file name.
- Quote YAML strings containing `: `, `#`, a leading `*`/`&`/`!`, or that look like dates/booleans;
  `YYYY-MM` months are always quoted (`'2026-06'`).
- YAML is Prettier-formatted like code (`npx prettier --write <file>`); the checks fail otherwise.
- Changing a schema is its own task (CLAUDE.md contracts); a content task only fills fields.
