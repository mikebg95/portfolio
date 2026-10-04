import type { APIRoute } from 'astro';

import { renderIcon } from '../favicon';

// The iOS home-screen icon; iOS also asks for this path without a link.
export const GET: APIRoute = async () =>
  new Response(await renderIcon('appleTouch'), { headers: { 'Content-Type': 'image/png' } });
