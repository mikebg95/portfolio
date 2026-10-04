import { defineConfig } from 'astro/config';

import { PRIMITIVES_ENV, PRIMITIVES_PATH, SITE_URL } from './src/config';
import { DEFAULT_LANG, LANGS } from './src/i18n/paths';
import { serviceWorker } from './src/precache';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  server: { port: 4321 },
  // PR-63: every link is fetched ahead while it is on screen, so the next sheet opens at once on
  // a slow connection; project cards and the CV opt out (data-astro-prefetch).
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  // English at `/`, Dutch at `/nl/` (SPEC §1.4). Pages live once under `src/pages/[...lang]/`;
  // `src/i18n/paths.ts` builds every localized URL.
  i18n: {
    locales: [...LANGS],
    defaultLocale: DEFAULT_LANG,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    // PR-63: dist/sw.js, the offline service worker (src/precache.ts).
    serviceWorker(),
    {
      // The drawing primitives specimen page (src/dev/): in dev, and in the e2e build only.
      name: 'primitives-page',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'dev' || process.env[PRIMITIVES_ENV] === '1') {
            injectRoute({ pattern: PRIMITIVES_PATH, entrypoint: './src/dev/primitives.astro' });
          }
        },
      },
    },
  ],
});
