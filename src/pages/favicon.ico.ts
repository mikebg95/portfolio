import type { APIRoute } from 'astro';

import { faviconIco } from '../favicon';

// For browsers and crawlers that ask for /favicon.ico rather than read the head's SVG icon.
export const GET: APIRoute = async () =>
  new Response(await faviconIco(), { headers: { 'Content-Type': 'image/x-icon' } });
