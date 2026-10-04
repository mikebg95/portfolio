import { DEFAULT_LANG, delocalize, LANGS, localize, type Lang } from './i18n/paths';

// SPEC §3.8: canonical URLs, hreflang alternates, the sitemap and the JSON-LD Person. Pure: the
// origin and the strings are passed in, so every function is unit-testable.

/**
 * The language-neutral path of a page URL, without the trailing slash Astro's directory build
 * adds (`/nl/experience/` → nl, `/experience`), so canonicals match the site's own links.
 */
export function neutralPath(pathname: string): { lang: Lang; path: string } {
  const { lang, path } = delocalize(pathname);
  return { lang, path: path.length > 1 ? path.replace(/\/+$/, '') : path };
}

/** The absolute URL of a language-neutral path in `lang`: `('nl', '/experience')` → `…/nl/experience`. */
export const absoluteUrl = (origin: string, lang: Lang, path: string) =>
  new URL(localize(lang, path), origin).href;

export interface Alternate {
  /** `en`, `nl` or `x-default` (the default language's URL). */
  hreflang: string;
  href: string;
}

/** Every language's URL of a page, then `x-default` → the default language's. */
export function alternates(origin: string, path: string): Alternate[] {
  return [
    ...LANGS.map((lang) => ({ hreflang: lang, href: absoluteUrl(origin, lang, path) })),
    { hreflang: 'x-default', href: absoluteUrl(origin, DEFAULT_LANG, path) },
  ];
}

/** `sitemap.xml`: one `<url>` per page and language, each listing its alternates. */
export function sitemap(origin: string, paths: readonly string[]): string {
  const links = (path: string) =>
    alternates(origin, path)
      .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
      .join('');
  const urls = paths.flatMap((path) =>
    LANGS.map((lang) => `<url><loc>${absoluteUrl(origin, lang, path)}</loc>${links(path)}</url>`),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** `robots.txt`: everything may be crawled; the sitemap's absolute URL. */
export const robots = (origin: string, sitemapPath: string) =>
  `User-agent: *\nAllow: /\n\nSitemap: ${new URL(sitemapPath, origin).href}\n`;

/** `MICHAEL` → `Michael`: the drawn capitals as a name. */
const titleCase = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();

export interface PersonInput {
  /** `profile.hero.name`, drawn in capitals. */
  name: readonly string[];
  /** `profile.hero.role`: the job title is the part before the dash. */
  role: string;
  url: string;
  /** LinkedIn and GitHub. */
  sameAs: readonly string[];
  address: { locality: string; country: string };
}

/** The JSON-LD `Person` on Sheet 01 — no phone, no address beyond city and country. */
export function personJsonLd({ name, role, url, sameAs, address }: PersonInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name.map(titleCase).join(' '),
    jobTitle: role.split(' — ')[0]?.trim() ?? role,
    url,
    sameAs: [...sameAs],
    address: {
      '@type': 'PostalAddress',
      addressLocality: address.locality,
      addressCountry: address.country,
    },
  };
}

/** A JSON-LD object as the text of a `<script type="application/ld+json">`; `<` escaped. */
export const jsonLdText = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
