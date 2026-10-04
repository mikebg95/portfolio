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

/** The site icon, rendered by `src/pages/favicon.svg.ts` from the design tokens. */
export const FAVICON_PATH = '/favicon.svg';
