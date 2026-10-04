import { SHEET_KEYS, type SheetKey } from '../content/schemas';

/** The sheet set, in order: number and language-neutral path. Names come from `t(lang).sheets`. */
export interface Sheet {
  key: SheetKey;
  /** 1-based; drawn as `SHEET 01` and `01 / 05`. */
  number: number;
  path: string;
}

const PATHS: Record<SheetKey, string> = {
  overview: '/',
  experience: '/experience',
  projects: '/projects',
  certifications: '/certifications',
  education: '/education',
};

export const SHEETS: readonly Sheet[] = SHEET_KEYS.map((key, i) => ({
  key,
  number: i + 1,
  path: PATHS[key],
}));

/** A project detail sheet is part of sheet 03. */
export const projectPath = (slug: string) => `${PATHS.projects}/${slug}`;
