import type { z } from 'astro/zod';

import type { projectSchema, uiSchema } from './content/schemas';

type Project = z.infer<typeof projectSchema>;
type DetailText = z.infer<typeof uiSchema>['projects']['detail'];

/**
 * A detail sheet's previous and next projects in register order (`projects` sorted by `order`),
 * wrapping at both ends.
 */
export function neighbours<P extends Pick<Project, 'slug'>>(
  projects: readonly P[],
  slug: string,
): { previous: P; next: P } {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) throw new Error(`no project "${slug}"`);
  return {
    previous: projects[(i - 1 + projects.length) % projects.length]!,
    next: projects[(i + 1) % projects.length]!,
  };
}

/**
 * The line under the repository button: the period, `SERIES PART n` for a series entry (n = its
 * place among the series entries in `projects`, sorted by `order`), the platform if any, then the
 * status unless done — `AUG 2025 – NOV 2025 · HOSTING RETIRED`,
 * `JUL 2026 – NOW · SERIES PART 3 · IN PROGRESS`, `NOV 2020 – JAN 2021 · ANDROID`.
 */
export function detailMeta(
  project: Pick<Project, 'slug' | 'period' | 'series' | 'platform' | 'status'>,
  projects: readonly Pick<Project, 'slug' | 'series'>[],
  text: Pick<DetailText, 'seriesPart' | 'status'>,
): string {
  const parts = [project.period];
  if (project.series) {
    const part = projects.filter((p) => p.series).findIndex((p) => p.slug === project.slug) + 1;
    parts.push(text.seriesPart.replace('{n}', String(part)));
  }
  if (project.platform) parts.push(project.platform);
  if (project.status !== 'done') parts.push(text.status[project.status]);
  return parts.join(' · ');
}

/** The detail sheet's label: `DETAIL SHEET 03.1 — P-01` from `{sheet}`, `{n}` and `{code}`. */
export const detailLabel = (
  project: Pick<Project, 'order' | 'code'>,
  sheetNumber: number,
  text: Pick<DetailText, 'label'>,
) =>
  text.label
    .replace('{sheet}', String(sheetNumber).padStart(2, '0'))
    .replace('{n}', String(project.order))
    .replace('{code}', project.code);
