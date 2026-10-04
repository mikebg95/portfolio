import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';

import type { Lang } from './paths';

// Every collection holds one entry per language, with ids `<lang>/<id>` (docs/conventions/content.md).

/** The shared strings (header, footer, SEO, 404) in `lang`. */
export async function t(lang: Lang): Promise<CollectionEntry<'ui'>['data']> {
  const entry = await getEntry('ui', `${lang}/ui`);
  if (!entry) throw new Error(`no ui strings for ${lang}`);
  return entry.data;
}

/** One entry in `lang`, by the id it has in both languages (`getLocalized('projects', 'jamigos', 'nl')`). */
export async function getLocalized<C extends CollectionKey>(
  collection: C,
  id: string,
  lang: Lang,
): Promise<CollectionEntry<C>> {
  const entry = (await getEntry(collection, `${lang}/${id}`)) as CollectionEntry<C> | undefined;
  if (!entry) throw new Error(`no ${collection} entry ${lang}/${id}`);
  return entry;
}

/** Every entry of a collection in `lang`, sorted by `order` where the collection has one. */
export async function getAllLocalized<C extends CollectionKey>(
  collection: C,
  lang: Lang,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, (e) => e.id.startsWith(`${lang}/`));
  const rank = (e: CollectionEntry<C>) => {
    const data = e.data as { order?: number; item?: number };
    return data.order ?? data.item ?? 0;
  };
  return entries.sort((a, b) => rank(a) - rank(b));
}

/** The id an entry has in both languages: `nl/jamigos` → `jamigos`. */
export const sharedId = (entry: { id: string }) => entry.id.slice(entry.id.indexOf('/') + 1);
