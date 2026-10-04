import type { APIRoute } from 'astro';

import { renderIcon } from '../favicon';

// The manifest's `any` icon.
export const GET: APIRoute = async () =>
  new Response(await renderIcon('any'), { headers: { 'Content-Type': 'image/png' } });
