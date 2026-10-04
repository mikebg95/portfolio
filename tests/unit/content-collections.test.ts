import { describe, expect, it } from 'vitest';

import { findPairingErrors } from '../../src/content/pairing';
import { COLLECTIONS, LANGS, schemas } from '../../src/content/schemas';
import { readCollection } from './helpers/content';

// The build-time content check: every file in every collection, both languages.
describe.each(COLLECTIONS)('content collection %s', (name) => {
  const files = readCollection(name);

  it('has entries in both languages', () => {
    for (const lang of LANGS) {
      expect(files.some((f) => f.path.startsWith(`${lang}/`))).toBe(true);
    }
  });

  it('pairs every EN entry with an NL twin of the same shape', () => {
    expect(findPairingErrors(name, files)).toEqual([]);
  });

  it.each(files.map((f) => [f.path, f.data] as const))('%s matches the schema', (_path, data) => {
    const result = schemas[name].safeParse(data);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('rejects an entry with a required field missing', () => {
    const data = { ...(files[0]?.data as Record<string, unknown>) };
    const [firstField] = Object.keys(data);
    delete data[firstField ?? ''];
    expect(schemas[name].safeParse(data).success).toBe(false);
  });

  // The Dutch tasks (PR-48–50) translated every entry; none may fall back to English again.
  it('has no entry marked untranslated', () => {
    const untranslated = files.filter(
      (f) => (f.data as { translated?: boolean }).translated === false,
    );
    expect(untranslated.map((f) => f.path)).toEqual([]);
  });
});

describe('ids written inside entries', () => {
  it('match the file name', () => {
    const ids = (name: string, field: string) =>
      readCollection(name).map((f) => [
        f.path.split('/')[1],
        (f.data as Record<string, unknown>)[field],
      ]);
    for (const [file, id] of [...ids('experience', 'id'), ...ids('projects', 'slug')]) {
      expect(id).toBe(file);
    }
  });
});
