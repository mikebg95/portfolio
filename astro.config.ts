import { defineConfig } from 'astro/config';

import { SITE_URL } from './src/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  server: { port: 4321 },
});
