import type { APIRoute } from 'astro';

import { faviconSvg } from '../favicon';

// Linked from every page's head (SheetLayout); without it browsers ask for /favicon.ico and log a 404.
export const GET: APIRoute = () =>
  new Response(faviconSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
