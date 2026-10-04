import { LANGS, type Lang } from '../content/schemas';

/** English at `/`, Dutch at `/nl/` (SPEC §1.4). Astro's i18n config in astro.config.ts uses both. */
export const DEFAULT_LANG: Lang = 'en';
export { LANGS, type Lang };

/** The other language: the target of the header's language switch. */
export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'nl' : 'en');

/**
 * The URL of a language-neutral path (`/`, `/experience`, `/projects/jamigos`) in `lang`.
 * The default language has no prefix; the Dutch home page is `/nl/`.
 */
export function localize(lang: Lang, path: string): string {
  if (!path.startsWith('/')) throw new Error(`expected an absolute path, got ${path}`);
  if (lang === DEFAULT_LANG) return path;
  return path === '/' ? `/${lang}/` : `/${lang}${path}`;
}

/** Splits a URL path into its language and the language-neutral path: `/nl/experience` → nl, `/experience`. */
export function delocalize(path: string): { lang: Lang; path: string } {
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue;
    if (path === `/${lang}` || path === `/${lang}/`) return { lang, path: '/' };
    if (path.startsWith(`/${lang}/`)) return { lang, path: path.slice(lang.length + 1) };
  }
  return { lang: DEFAULT_LANG, path };
}

/**
 * The same page in the other language: `alternate('en', '/experience')` → `/nl/experience`,
 * `alternate('nl', '/nl/')` → `/`. `path` is the current page's pathname (no query or hash);
 * a trailing slash is kept as given.
 */
export function alternate(lang: Lang, path: string): string {
  const neutral = delocalize(path);
  if (neutral.lang !== lang) throw new Error(`${path} is not a ${lang} page`);
  return localize(otherLang(lang), neutral.path);
}

/**
 * `getStaticPaths` entries for a page that exists once per language under `src/pages/[...lang]/`:
 * the default language gets no prefix (`lang` param undefined), the others their code.
 */
export function langPaths(): { params: { lang: string | undefined }; props: { lang: Lang } }[] {
  return LANGS.map((lang) => ({
    params: { lang: lang === DEFAULT_LANG ? undefined : lang },
    props: { lang },
  }));
}
