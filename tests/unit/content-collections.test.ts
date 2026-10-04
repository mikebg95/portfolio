import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { findPairingErrors, type ContentFile } from '../../src/content/pairing';
import { COLLECTIONS, LANGS, schemas } from '../../src/content/schemas';

// The build-time content check: every file in every collection, both languages, read from disk
// the way the glob loader in src/content.config.ts reads it (js-yaml, `<lang>/<id>.yaml`).
const CONTENT = fileURLToPath(new URL('../../src/content', import.meta.url));

function readCollection(name: string): ContentFile[] {
  return readdirSync(join(CONTENT, name), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => ({
      path: file
        .split(sep)
        .join('/')
        .replace(/\.yaml$/, ''),
      data: load(readFileSync(join(CONTENT, name, file), 'utf8')),
    }));
}

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
