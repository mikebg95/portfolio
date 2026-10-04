import { readFileSync } from 'node:fs';

import { load } from 'js-yaml';

// A language's shared strings and profile straight from the content files, so a test that walks
// both languages expects each page's own wording (EN from copy.md is checked by the unit tests).
const yaml = (path: string) =>
  load(readFileSync(new URL(`../../../src/content/${path}`, import.meta.url), 'utf8'));

interface Ui {
  monogram: { set: string };
  sheet: string;
  sheets: Record<'overview' | 'experience' | 'projects' | 'certifications' | 'education', string>;
  theme: { toBlueprint: string };
  sheetIndex: { close: string };
  titleBlock: Record<'project' | 'scale' | 'sheet' | 'drawn' | 'checked' | 'rev', string>;
  seo: { notFound: { title: string } };
  notFound: { label: string; heading: string; note: string };
  dates: { months: string[]; now: string };
}

interface Profile {
  hero: { buttons: { projects: string }; balloons: { text: string }[] };
  current: { text: string; href: string }[];
}

export const ui = (lang: string) => yaml(`ui/${lang}/ui.yaml`) as Ui;
export const profile = (lang: string) => yaml(`profile/${lang}/profile.yaml`) as Profile;
