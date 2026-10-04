import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'js-yaml';

import type { ContentFile } from '../../../src/content/pairing';
import { schemas, type CollectionName } from '../../../src/content/schemas';

// Content read from disk the way the glob loader in src/content.config.ts reads it
// (js-yaml, `<lang>/<id>.yaml`): Vitest can import `astro:content`, but its store is empty there.
const CONTENT = fileURLToPath(new URL('../../../src/content', import.meta.url));

export function readCollection(name: string): ContentFile[] {
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

const entries = (collection: CollectionName) =>
  readCollection(collection).map(({ path, data }) => ({
    id: path,
    collection,
    data: schemas[collection].parse(data),
  }));

/**
 * A stand-in for `astro:content` over the real files, schema-parsed:
 * `vi.mock('astro:content', () => fakeAstroContent)`.
 */
export const fakeAstroContent = {
  getEntry: (collection: CollectionName, id: string) =>
    Promise.resolve(entries(collection).find((e) => e.id === id)),
  getCollection: (collection: CollectionName, filter?: (e: { id: string }) => boolean) =>
    Promise.resolve(entries(collection).filter((e) => filter?.(e) ?? true)),
};
