// PR-54, SPEC §3.7: pull the checkable facts — numbers, month-year dates, proper nouns, outbound
// URLs — out of a built page, and decide whether docs/source/ states each one. Pure functions, so
// tests/e2e/facts.spec.ts stays a list of rules.

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);

/** Every string value of a JSON-LD block, minus the schema.org vocabulary (`@type`, `@context`). */
function jsonLdText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(jsonLdText);
  if (value && typeof value === 'object')
    return Object.entries(value)
      .filter(([key]) => !key.startsWith('@'))
      .flatMap(([, v]) => jsonLdText(v));
  return [];
}

/**
 * The text a visitor (or a search engine, or a screen reader) gets from a page: body and title
 * text, drawing labels, alt / aria-label / title attributes, the description-like meta tags and
 * the JSON-LD values. The ASCII portrait is pictures made of glyphs, not text, so it is left out.
 */
export function pageText(html: string): string {
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((m) => jsonLdText(JSON.parse(m[1]!)))
    .join('\n');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /(?:name|property)="[^"]*(?:title|description|alt)"/.test(tag))
    .map((tag) => /content="([^"]*)"/.exec(tag)?.[1] ?? '');
  const body = html
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
    .replace(/<pre class="portrait__ascii[\s\S]*?<\/pre>/g, ' ');
  const attributes = [...body.matchAll(/\s(?:alt|aria-label|title)="([^"]*)"/g)].map((m) => m[1]!);
  return decode(
    [body.replace(/<[^>]+>/g, '\n'), ...attributes, ...meta, jsonLd].join('\n'),
  ).normalize('NFKC');
}

/** Every absolute URL a page links to or names (href, src, meta content, JSON-LD). */
export function pageUrls(html: string): string[] {
  const urls = [...html.matchAll(/(?:href|src|content)="([^"]+)"/g)].map((m) => decode(m[1]!));
  const ld = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].flatMap((m) => jsonLdText(JSON.parse(m[1]!)));
  return [...new Set([...urls, ...ld])].filter((u) => /^(?:https?:|mailto:|tel:)/i.test(u));
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_WORD = new RegExp(`^(?:${MONTHS.join('|')})[a-z]*$`, 'i');
const DATE = new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\.? (\\d{4})\\b`, 'gi');

/** Month-year dates, normalised to `jul 2026`. */
export function dates(text: string): string[] {
  return [...text.matchAll(DATE)].map((m) => `${m[1]!.toLowerCase()} ${m[2]}`);
}

/**
 * Numbers as written (`251`, `3.5`, `2:1`); a short year range end (`2007–13`) is expanded. Digits
 * inside a word (`mikebg95`, `CS50`, `OAuth2`) belong to that name and are checked with it.
 */
export function numbers(text: string): string[] {
  const expanded = text.replace(
    /\b(\d{2})(\d{2})([–-])(\d{2})\b/g,
    (_, century: string, year: string, dash: string, end: string) =>
      `${century}${year}${dash}${century}${end}`,
  );
  return [...expanded.matchAll(/(?<![\p{L}\p{N}])\d+(?:[.,:]\d+)*/gu)].map((m) => m[0]);
}

/**
 * Proper-noun candidates: words that start with a capital or have one inside (camelCase), with
 * trailing punctuation and a possessive cut off. Month names are checked as dates instead.
 */
export function names(text: string): string[] {
  return [...text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}.+#'’-]*/gu)]
    .map((m) => m[0].replace(/['’]s$/, '').replace(/[.'’-]+$/, ''))
    .filter((w) => /^\p{Lu}/u.test(w) || /\p{Ll}\p{Lu}/u.test(w))
    .filter((w) => !MONTH_WORD.test(w));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The sources as one searchable text: lower case, ligatures (`ﬁ`) and widths folded. */
export const sourceText = (texts: string[]) => texts.join('\n').normalize('NFKC').toLowerCase();

/** Whether `token` occurs in the sources as a whole word or number (not inside a longer one). */
export function inSources(token: string, source: string): boolean {
  const variants = [token, token.replace(/-/g, ' ')];
  return variants.some((v) =>
    new RegExp(
      `(?<![\\p{L}\\p{N}]|\\p{N}[.,:])${escape(v.toLowerCase())}(?![\\p{L}\\p{N}]|[.,:]\\p{N})`,
      'u',
    ).test(source),
  );
}

/** Dates the sources state, normalised as `dates()` does. */
export const sourceDates = (source: string) => new Set(dates(source));
