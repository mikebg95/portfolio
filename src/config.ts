/** The site's canonical origin. The one place it is written down. */
export const SITE_URL = 'https://michaelgoldman.dev';

/** The CV download (SPEC §3.5): a copy of `docs/source/cv.pdf` in `public/`. */
export const CV_PATH = '/michael-goldman-cv.pdf';

/** The drawing primitives specimen page: served by `astro dev`, and by a build only when the
 * environment variable below is set (the e2e build sets it). Never in a production build. */
export const PRIMITIVES_PATH = '/_primitives';
export const PRIMITIVES_ENV = 'BUILD_PRIMITIVES';

/** Scentify's FIG. 2: the repo's `scentify_gif.gif` re-encoded as an animated WebP (360 px wide,
 * 10 fps), and its first frame, shown instead under reduced motion. Both in `public/`. */
export const SCENTIFY_DEMO = {
  animated: '/projects/scentify/demo.webp',
  still: '/projects/scentify/demo-still.webp',
  width: 360,
  height: 800,
} as const;

/** The only address the site gives (SPEC §3.8, JSON-LD on Sheet 01): city and country, from
 * `docs/source/cv.md` ("Amsterdam, The Netherlands"). Never a street or a phone number. */
export const PERSON_ADDRESS = { locality: 'Amsterdam', country: 'NL' } as const;

/** Built by `src/pages/sitemap.xml.ts`; `robots.txt` points at it. */
export const SITEMAP_PATH = '/sitemap.xml';

/** Open Graph images (SPEC §3.8): one PNG per page and language, rendered by `src/pages/og/`. */
export const OG_IMAGE_DIR = '/og';

/** The site icons and the web app manifest, rendered from one source (`src/favicon.ts`) by the
 * endpoints of the same names in `src/pages/`; SheetLayout links them. */
export const ICONS = {
  svg: '/favicon.svg',
  ico: '/favicon.ico',
  appleTouch: '/apple-touch-icon.png',
  any: '/icon-512.png',
  maskable: '/icon-512-maskable.png',
  manifest: '/site.webmanifest',
} as const;

/** The manifest's `short_name` (a home-screen label); its `name` is the EN Sheet 01 title. */
export const SITE_SHORT_NAME = 'M. Goldman';
