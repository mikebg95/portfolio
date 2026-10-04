/**
 * Self-hosted font files (woff2, latin subset) in `public/fonts/`, declared in `fonts.css`.
 * Source: Fontsource 5.3.0 (`@fontsource-variable/archivo`, `@fontsource/ibm-plex-sans`,
 * `@fontsource/ibm-plex-mono`), SIL OFL 1.1 — licences beside the files.
 */
export const FONT_DIR = '/fonts';

/** The display heading face: every page has one above the fold. */
export const DISPLAY_FONT = `${FONT_DIR}/archivo-latin-wdth-normal.woff2`;
/** Body text: above the fold on every sheet but the 404, which has no paragraph. */
export const BODY_FONT = `${FONT_DIR}/ibm-plex-sans-latin-400-normal.woff2`;

/** The two above-the-fold faces, preloaded by default (SheetLayout's `preloadFonts`). A font is
 * preloaded only where the page renders it (tests/e2e/performance.spec.ts). */
export const PRELOAD_FONTS = [DISPLAY_FONT, BODY_FONT] as const;

/** True only in WebKit (Safari, every iOS browser): a legacy media feature Blink and Gecko dropped.
 * WebKit fetches same-origin `@font-face` files in `no-cors` mode, Blink and Gecko in `cors`, and a
 * preload is used only by a request of the same mode — so WebKit gets a preload without
 * `crossorigin` and every other engine one with it (FontPreload.astro, docs/RECORD.md QA-67). */
export const WEBKIT_MEDIA = '(-webkit-transform-2d)';
