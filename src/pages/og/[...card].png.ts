import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';

import { SITE_URL } from '../../config';
import type { SheetKey } from '../../content/schemas';
import { getAllLocalized, getLocalized, sharedId, t } from '../../i18n/content';
import { LANGS } from '../../i18n/paths';
import { projectPath, SHEETS } from '../../i18n/routes';
import { ogImageParam, renderOgPng, type OgCard } from '../../og';
import { detailLabel } from '../../project-detail';
import { formatSheet } from '../../title-block';

// SPEC §3.8: the Open Graph image of every sheet, project detail sheet and 404 sheet, in both
// languages, at `ogImagePath(lang, path)` — the URL SheetLayout puts in og:image. The label and
// heading are the ones the page draws, from the same content.
export const getStaticPaths = (async () => {
  const perLang = await Promise.all(
    LANGS.map(async (lang) => {
      const ui = await t(lang);
      const { hero } = (await getLocalized('profile', 'profile', lang)).data;
      const projects = await getAllLocalized('projects', lang);
      const card = (label: string, heading: readonly string[], sheet?: number): OgCard => ({
        label,
        heading,
        cells: [
          { caption: ui.titleBlock.project, value: ui.titleBlock.projectValue },
          { caption: ui.titleBlock.sheet, value: formatSheet(sheet, SHEETS.length) },
        ],
        site: new URL(SITE_URL).host,
      });
      const heads: Record<SheetKey, { label: string; heading: readonly string[] }> = {
        overview: { label: hero.label, heading: hero.name },
        experience: ui.experience,
        projects: ui.projects,
        certifications: ui.certifications,
        education: ui.education,
      };
      const projectsSheet = SHEETS.find((s) => s.key === 'projects')!.number;
      const pages: [string, OgCard][] = [
        ...SHEETS.map(({ key, path, number }): [string, OgCard] => [
          path,
          card(heads[key].label, heads[key].heading, number),
        ]),
        ...projects.map(({ data, ...entry }): [string, OgCard] => [
          projectPath(sharedId(entry)),
          card(detailLabel(data, projectsSheet, ui.projects.detail), [data.title], projectsSheet),
        ]),
        ['/404', card(ui.notFound.label, [ui.notFound.heading])],
      ];
      return pages.map(([path, og]) => ({
        params: { card: ogImageParam(lang, path) },
        props: { og },
      }));
    }),
  );
  return perLang.flat();
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(await renderOgPng(props.og), { headers: { 'Content-Type': 'image/png' } });
