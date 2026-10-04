import type { APIRoute } from 'astro';

import { ICONS, SITE_SHORT_NAME } from '../config';
import { webManifest } from '../favicon';
import { t } from '../i18n/content';

// The web app manifest: names and the two 512 px icons, colours from the paper theme.
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(webManifest((await t('en')).seo.overview.title, SITE_SHORT_NAME, ICONS)),
    {
      headers: { 'Content-Type': 'application/manifest+json' },
    },
  );
