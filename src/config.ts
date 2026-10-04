/** The site's canonical origin. The one place it is written down. */
export const SITE_URL = 'https://michaelgoldman.dev';

/** The CV download (SPEC §3.5): a copy of `docs/source/cv.pdf` in `public/`. */
export const CV_PATH = '/michael-goldman-cv.pdf';

/** The drawing primitives specimen page: served by `astro dev`, and by a build only when the
 * environment variable below is set (the e2e build sets it). Never in a production build. */
export const PRIMITIVES_PATH = '/_primitives';
export const PRIMITIVES_ENV = 'BUILD_PRIMITIVES';
