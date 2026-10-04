import { defineConfig } from 'astro/config';

import { SITE_URL } from './src/config';
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
});
