// QA-70, SPEC §3.9: a static host answers every unknown URL with the root `404.html` — the English
// sheet — even under `/nl/` (GitHub Pages has no per-directory 404). On a Dutch URL that page
// fetches the Dutch sheet and swaps it in through the router, so the address and the 404 status the
// browser already has stay. Without JS the English sheet shows. docs/RECORD.md 2026-10-05 (QA-70).
import { navigate } from 'astro:transitions/client';
import { DEFAULT_LANG, delocalize, LANGS, localize, type Lang } from './i18n/paths';
import { FIRST_VIEW_CLASS } from './motion';

/** The language-neutral path of the not-found sheet: `/404`, `/nl/404`. */
const NOT_FOUND_PATH = '/404';

/** Marks the not-found sheet's markup (NotFoundSheet), so a page the router loads can be told. */
export const NOT_FOUND_ATTR = 'data-not-found';

/** The URL prefixes whose unknown URLs want another sheet than the root 404: `/nl/`. */
export const LOCALIZED_PREFIXES = LANGS.filter((lang) => lang !== DEFAULT_LANG).map((lang) =>
  localize(lang, '/'),
);

/** The not-found sheet in `pathname`'s language, or nothing when it is the one showing. */
export function notFoundSheetFor(pathname: string, showing: string): string | undefined {
  const { lang } = delocalize(pathname);
  return lang === showing ? undefined : localize(lang, NOT_FOUND_PATH);
}

/** The not-found sheet `doc` should be replaced by at `pathname`, if `doc` is one in another language. */
function replacementFor(doc: Document, pathname: string): string | undefined {
  if (!doc.querySelector(`[${NOT_FOUND_ATTR}]`)) return undefined;
  return notFoundSheetFor(pathname, doc.documentElement.lang);
}

async function fetchSheet(href: string): Promise<Document> {
  const response = await fetch(href);
  if (!response.ok) throw new Error(`${href} answered ${response.status}`);
  return new DOMParser().parseFromString(await response.text(), 'text/html');
}

/**
 * Run once per visit by the root 404 page. Shows the not-found sheet in the URL's language: now, by
 * swapping the sheet showing (its head script hid the page on a `LOCALIZED_PREFIXES` URL; the swap
 * brings in the new root's attributes, which shows it again), and whenever the router loads the
 * root 404 at such a URL later in the visit (Back to it). Any failure keeps the sheet there.
 */
export async function serveLocalizedNotFound(showing: Lang): Promise<void> {
  document.addEventListener('astro:before-preparation', (event) => {
    const load = event.loader;
    event.loader = async () => {
      await load();
      const href = replacementFor(event.newDocument, event.to.pathname);
      if (href) event.newDocument = await fetchSheet(href).catch(() => event.newDocument);
    };
  });

  const href = notFoundSheetFor(location.pathname, showing);
  if (!href) return;
  const root = document.documentElement;
  try {
    const doc = await fetchSheet(href);
    // The router "navigates" to the address showing, but loads the other sheet's markup.
    document.addEventListener(
      'astro:before-preparation',
      (event) => {
        event.loader = async () => {
          event.newDocument = doc;
        };
      },
      { once: true },
    );
    document.addEventListener(
      'astro:before-swap',
      (event) => {
        // Nothing was visible to cross-fade from; the first view still plots the sheet.
        event.viewTransition.ready.catch(() => undefined);
        event.viewTransition.skipTransition();
        if (root.classList.contains(FIRST_VIEW_CLASS)) {
          event.newDocument.documentElement.classList.add(FIRST_VIEW_CLASS);
        }
      },
      { once: true },
    );
    await navigate(location.href, { history: 'replace' });
  } catch {
    root.style.removeProperty('visibility');
  }
}
