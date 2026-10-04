import type { APIRoute } from 'astro';

import { SITE_URL, SITEMAP_PATH } from '../config';
import { robots } from '../seo';

// SPEC §3.8: crawl everything, find the sitemap.
export const GET: APIRoute = () =>
  new Response(robots(SITE_URL, SITEMAP_PATH), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
