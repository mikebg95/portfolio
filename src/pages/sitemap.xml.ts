import type { APIRoute } from 'astro';

import { SITE_URL } from '../config';
import { getAllLocalized, sharedId } from '../i18n/content';
import { DEFAULT_LANG } from '../i18n/paths';
import { projectPath, SHEETS } from '../i18n/routes';
import { sitemap } from '../seo';

// SPEC §3.8: every sheet and project detail sheet, in both languages. Not the 404 sheets, not the
// dev-only primitives page — the list is built from the sheet set, not from the routes.
export const GET: APIRoute = async () => {
  const projects = await getAllLocalized('projects', DEFAULT_LANG);
  const paths = [...SHEETS.map((s) => s.path), ...projects.map((p) => projectPath(sharedId(p)))];
  return new Response(sitemap(SITE_URL, paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
