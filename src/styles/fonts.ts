/**
 * Self-hosted font files (woff2, latin subset) in `public/fonts/`, declared in `fonts.css`.
 * Source: Fontsource 5.3.0 (`@fontsource-variable/archivo`, `@fontsource/ibm-plex-sans`,
 * `@fontsource/ibm-plex-mono`), SIL OFL 1.1 — licences beside the files.
 */
export const FONT_DIR = '/fonts';

/** The two above-the-fold faces: the display heading and body text. Preloaded on every page. */
export const PRELOAD_FONTS = [
  `${FONT_DIR}/archivo-latin-wdth-normal.woff2`,
  `${FONT_DIR}/ibm-plex-sans-latin-400-normal.woff2`,
] as const;
