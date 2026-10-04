import { LANGS, type Lang } from './schemas';

/** One content file as the pairing check sees it: its path-derived id and its parsed data. */
export interface ContentFile {
  /** `<lang>/<id>`, relative to the collection folder, without extension. */
  path: string;
  data: unknown;
}

/**
 * Every key path in a value, arrays by index: `{a: [{b: 1}]}` → `a`, `a.0`, `a.0.b`.
 * Two faithful translations of one entry have the same shape.
 */
export function shapeOf(value: unknown, prefix = ''): string[] {
  const children: [string, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : value !== null && typeof value === 'object'
      ? Object.entries(value)
      : [];
  return children.flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return [path, ...shapeOf(child, path)];
  });
}

/** `translated` legitimately differs: EN leaves it at its default, an NL draft sets it false. */
const comparableShape = (data: unknown) =>
  new Set(shapeOf(data).filter((key) => key !== 'translated'));

/**
 * Problems that make a collection unpublishable in both languages: a file outside a language
 * folder, a `lang` field disagreeing with its folder, an entry with no twin in the other
 * language, or twins whose fields differ (one has a `note`, the other not). Empty = fine.
 */
export function findPairingErrors(collection: string, files: ContentFile[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, Map<Lang, unknown>>();

  for (const { path, data } of files) {
    const [folder, ...rest] = path.split('/');
    const id = rest.join('/');
    if (!LANGS.includes(folder as Lang) || id === '') {
      errors.push(`${collection}/${path}: not inside a language folder (${LANGS.join(', ')})`);
      continue;
    }
    const lang = folder as Lang;
    const declared = (data as { lang?: unknown } | null)?.lang;
    if (declared !== lang) {
      errors.push(`${collection}/${path}: lang is ${String(declared)}, folder is ${lang}`);
    }
    const twins = byId.get(id) ?? new Map<Lang, unknown>();
    twins.set(lang, data);
    byId.set(id, twins);
  }

  for (const [id, twins] of byId) {
    const missing = LANGS.filter((l) => !twins.has(l));
    if (missing.length > 0) {
      errors.push(`${collection}/${id}: missing in ${missing.join(', ')}`);
      continue;
    }
    const [first, ...others] = LANGS;
    const reference = comparableShape(twins.get(first));
    for (const other of others) {
      const shape = comparableShape(twins.get(other));
      const onlyIn = (a: Set<string>, b: Set<string>) => [...a].filter((k) => !b.has(k));
      for (const key of onlyIn(reference, shape)) {
        errors.push(`${collection}/${id}: ${key} is in ${first} but not in ${other}`);
      }
      for (const key of onlyIn(shape, reference)) {
        errors.push(`${collection}/${id}: ${key} is in ${other} but not in ${first}`);
      }
    }
  }

  return errors;
}
