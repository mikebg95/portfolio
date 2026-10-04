import { defineConfig } from 'astro/config';

import { PRIMITIVES_ENV, PRIMITIVES_PATH, SITE_URL } from './src/config';
import { DEFAULT_LANG, LANGS } from './src/i18n/paths';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  server: { port: 4321 },
  // English at `/`, Dutch at `/nl/` (SPEC §1.4). Pages live once under `src/pages/[...lang]/`;
  // `src/i18n/paths.ts` builds every localized URL.
  i18n: {
    locales: [...LANGS],
    defaultLocale: DEFAULT_LANG,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
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
