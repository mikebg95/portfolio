import { z } from 'astro/zod';

/**
 * Content collection schemas (SPEC §5). A contract: changing one is its own task.
 *
 * Every entry lives at `src/content/<collection>/<lang>/<id>.yaml`, carries the `lang` of its
 * folder, and has a twin with the same id in the other language (checked by `pairing.ts`).
 * Objects are strict, so a misspelt field fails the build instead of silently vanishing.
 */

export const LANGS = ['en', 'nl'] as const;
export type Lang = (typeof LANGS)[number];

/** `YYYY-MM`, the only date format the content uses. */
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');
const text = z.string().trim().min(1);
const lang = z.enum(LANGS);
/** False on an NL entry that still holds the English text (until PR-48–50 translate it). */
const translated = z.boolean().default(true);
const link = z.strictObject({ label: text, href: text });

export const experienceSchema = z
  .strictObject({
    id: text,
    order: z.number().int().nonnegative(),
    /** `break` is a gap between roles (the sabbatical): drawn hatched, no employer. */
    kind: z.enum(['role', 'break']).default('role'),
    role: text,
    employer: text.optional(),
    client: text.optional(),
    place: text,
    start: month,
    /** `null` = still running ("NOW"). */
    end: month.nullable(),
    context: text,
    bullets: z.array(text).default([]),
    stack: z.array(text).default([]),
    note: text.optional(),
    lang,
    translated,
  })
  .refine((e) => e.kind === 'break' || e.employer !== undefined, {
    message: 'a role needs an employer',
    path: ['employer'],
  })
  .refine((e) => e.end === null || e.end >= e.start, {
    message: 'end is before start',
    path: ['end'],
  });

export const projectSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected a kebab-case slug'),
  code: z.string().regex(/^P-\d{2}$/, 'expected P-nn'),
  /** The words after the code on the card, e.g. `FLAGSHIP`, `LAYERED · JDBC`. */
  kind: text,
  order: z.number().int().nonnegative(),
  title: text,
  /** Register card text; `summary` is the detail sheet's. */
  cardSummary: text,
  summary: text,
  period: text,
  status: z.enum(['done', 'in-progress', 'retired-hosting']),
  repo: z.url({ protocol: /^https$/ }),
  tests: z.number().int().positive().optional(),
  facts: z.tuple([
    z.strictObject({ label: text, value: text }),
    z.strictObject({ label: text, value: text }),
    z.strictObject({ label: text, value: text }),
  ]),
  spec: z.array(z.strictObject({ label: text, text })).default([]),
  /** FIG. 1 and FIG. 2 of the detail sheet. */
  figures: z.tuple([
    z.strictObject({ title: text, caption: text.optional() }),
    z.strictObject({ title: text, caption: text.optional() }),
  ]),
  note: text,
  lang,
  translated,
});

export const certificationSchema = z
  .strictObject({
    code: z.string().regex(/^C-\d{2}$/, 'expected C-nn'),
    name: text,
    issuer: text,
    /** `null` while in progress. */
    date: month.nullable(),
    status: z.enum(['verified', 'pending']),
    /** The three lines inside the stamp, e.g. VERIFIED / 2025 / BROADCOM. */
    stamp: z.tuple([text, text, text]),
    verifyUrl: z.url({ protocol: /^https$/ }).optional(),
    verifyLabel: text.optional(),
    learned: text,
    skills: z.array(text).min(1),
    lang,
    translated,
  })
  .refine((c) => c.status === 'pending' || (c.verifyUrl !== undefined && c.date !== null), {
    message: 'a verified certification needs a date and a verifyUrl',
    path: ['verifyUrl'],
  })
  .refine((c) => (c.verifyUrl === undefined) === (c.verifyLabel === undefined), {
    message: 'verifyUrl and verifyLabel come together',
    path: ['verifyLabel'],
  });

export const educationSchema = z.strictObject({
  /** Balloon / parts-list number, 1 = base plate. */
  item: z.number().int().positive(),
  part: text,
  balloon: text,
  supplier: text,
  years: text,
  ec: z.number().int().positive().optional(),
  pending: z.boolean().default(false),
  plate: z.strictObject({
    size: z.enum(['full', 'small']),
    style: z.enum(['solid', 'dashed']),
  }),
  detail: z.strictObject({
    title: text,
    meta: text,
    body: text,
    note: text.optional(),
    rows: z
      .array(z.strictObject({ code: text, text, ec: z.number().int().positive() }))
      .default([]),
    link: link.optional(),
  }),
  lang,
  translated,
});

const specRow = z.strictObject({
  code: z.string().regex(/^S-\d{2}$/, 'expected S-nn'),
  label: text,
  items: z.array(text).min(1),
  /** Drawn in redline after the items, e.g. "Kubernetes — CKAD in progress". */
  pending: text.optional(),
});

export const profileSchema = z.strictObject({
  hero: z.strictObject({
    label: text,
    name: z.tuple([text, text]),
    role: text,
    intro: text,
    revisionNote: text,
    buttons: z.strictObject({ projects: text, cv: text }),
    dimensions: z.strictObject({ horizontal: text, vertical: text }),
    balloons: z.tuple([
      z.strictObject({ text, href: text.optional() }),
      z.strictObject({ text, href: text.optional() }),
      z.strictObject({ text, href: text.optional() }),
    ]),
    portraitAlt: text,
  }),
  /** The labels of the panels below the hero (copy.md `### … (label `…`)`). */
  labels: z.strictObject({
    howIWork: text,
    specification: text,
    generalNotes: text,
    current: text,
  }),
  howIWork: z.tuple([
    z.strictObject({ title: text, body: text }),
    z.strictObject({ title: text, body: text }),
    z.strictObject({ title: text, body: text }),
    z.strictObject({ title: text, body: text }),
  ]),
  aiNote: text,
  /** S-01…S-07 (copy.md; SPEC §5 says six — see docs/RECORD.md 2026-10-04). */
  specs: z.array(specRow).length(7),
  generalNotes: z.array(text).min(1),
  current: z.array(z.strictObject({ text, href: text })).min(1),
  /**
   * Employers that span several experience entries (Conspect: OptieCon and DJI) — the timeline's
   * employer dimension (`CONSPECT · NOV 2023 – NOW`) and its description line.
   */
  employers: z
    .array(z.strictObject({ name: text, start: month, end: month.nullable(), description: text }))
    .min(1),
  contact: z.strictObject({
    email: z.email(),
    linkedin: z.url({ protocol: /^https$/ }),
    github: z.url({ protocol: /^https$/ }),
  }),
  lang,
  translated,
});

/** The five sheets of the set, in sheet-number order (SPEC §4). */
export const SHEET_KEYS = [
  'overview',
  'experience',
  'projects',
  'certifications',
  'education',
] as const;
export type SheetKey = (typeof SHEET_KEYS)[number];

const seoPage = z.strictObject({ title: text, description: text });

/**
 * Strings every page shares (design/copy.md Global, SEO and 404) and a sheet's own fixed strings
 * under its key (`experience`; Sheet 01's live in `profile`): one `ui` entry per language,
 * read with `t(lang)` from `src/i18n/content.ts`.
 */
export const uiSchema = z.strictObject({
  monogram: z.strictObject({ initials: text, set: text }),
  /** The word before a sheet number: `SHEET` 01. */
  sheet: text,
  sheets: z.strictObject({
    overview: text,
    experience: text,
    projects: text,
    certifications: text,
    education: text,
  }),
  languages: z.strictObject({ en: text, nl: text }),
  theme: z.strictObject({ paper: text, blueprint: text, toPaper: text, toBlueprint: text }),
  cv: text,
  /** The phone header's sheet index button. */
  sheetIndex: z.strictObject({ open: text, openLabel: text, close: text }),
  skipLink: text,
  titleBlock: z.strictObject({
    project: text,
    projectValue: text,
    scale: text,
    scaleValue: text,
    sheet: text,
    drawn: text,
    drawnValue: text,
    checked: text,
    checkedValue: text,
    rev: text,
    contact: text,
    email: text,
    linkedin: text,
    github: text,
  }),
  seo: z.strictObject({
    overview: seoPage,
    experience: seoPage,
    projects: seoPage,
    certifications: seoPage,
    education: seoPage,
    /** `{title}` is replaced by the project's title; the description is its summary. */
    project: z.strictObject({ title: text.includes('{title}') }),
    notFound: z.strictObject({ title: text }),
  }),
  notFound: z.strictObject({ label: text, heading: text, note: text }),
  /** Month words as displayed (`JAN` / `jan`) and the open end (`NOW`); see `src/dates.ts`. */
  dates: z.strictObject({ months: z.array(text).length(12), now: text }),
  /**
   * Sheet 02's own strings (copy.md Sheet 02): label, the heading's two drawn lines and the
   * sabbatical legend's two lines. Role names and dates come from the `experience` entries.
   */
  experience: z.strictObject({
    label: text,
    heading: z.tuple([text, text]),
    legend: z.tuple([text, text]),
  }),
  lang,
  translated,
});

export const schemas = {
  experience: experienceSchema,
  projects: projectSchema,
  certifications: certificationSchema,
  education: educationSchema,
  profile: profileSchema,
  ui: uiSchema,
} as const;

export type CollectionName = keyof typeof schemas;
export const COLLECTIONS = Object.keys(schemas) as CollectionName[];
