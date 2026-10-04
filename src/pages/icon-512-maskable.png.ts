import type { APIRoute } from 'astro';

import { renderIcon } from '../favicon';

// The manifest's `maskable` icon: the cell inside the safe zone, paper to the edges.
export const GET: APIRoute = async () =>
  new Response(await renderIcon('maskable'), { headers: { 'Content-Type': 'image/png' } });
