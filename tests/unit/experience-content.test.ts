import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { experienceSchema, uiSchema } from '../../src/content/schemas';
import { readCollection } from './helpers/content';

// PR-17: the EN experience entries hold design/copy.md's Sheet 02 strings verbatim, newest first,
// with dates that tile the timeline. Expected values are read out of copy.md itself.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8');
const lines = copy.split('\n');
const sheetStart = lines.indexOf('## Sheet 02 — Experience');
const sheetEnd = lines.findIndex((l, i) => i > sheetStart && l.startsWith('## '));
const sheet02 = lines.slice(sheetStart + 1, sheetEnd);

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** `FEB 2021` → `2021-02`; `NOW` → null. */
function month(text: string): string | null {
  if (text === 'NOW') return null;
  const [mon = '', year] = text.split(' ');
  return `${year}-${String(MONTHS.indexOf(mon) + 1).padStart(2, '0')}`;
}

/** The lines under `### …` or `#### … (id `<id>`…)`, up to the next heading. */
function block(id: string): string[] {
  const start = sheet02.findIndex((l) => /^#{3,4} /.test(l) && l.includes(`(id \`${id}\``));
  expect(start, `copy.md Sheet 02 has a block for ${id}`).toBeGreaterThan(-1);
  const end = sheet02.findIndex((l, i) => i > start && l.startsWith('#'));
  return sheet02.slice(start, end === -1 ? undefined : end).filter((l) => l.trim() !== '');
}

const tick = (line: string | undefined) => /`([^`]+)`/.exec(line ?? '')?.[1];
const field = (b: string[], name: string) =>
  b.find((l) => l.startsWith(`${name}: `))?.slice(name.length + 2);

const entries = readCollection('experience')
  .filter((f) => f.path.startsWith('en/'))
  .map((f) => experienceSchema.parse(f.data))
  .sort((a, b) => a.order - b.order);
const byId = (id: string) => entries.find((e) => e.id === id);

describe('experience (EN) against design/copy.md', () => {
  it.each([
    ['optiecon', '02.1a'],
    ['dji', '02.1c'],
    ['linkpizza', '02.2'],
  ])('holds role %s (%s) verbatim', (id, number) => {
    const [heading = '', meta = '', ...rest] = block(id);
    const [, n, title, role] = /^#{3,4} (02\.\d[a-z]?) (.+) — (.+) \(id `/.exec(heading) ?? [];
    const [dates = '', employerOrEngagement, place] = meta.split(' · ');
    const [start = '', end = ''] = dates.split(' — ');
    const entry = byId(id);

    expect(n).toBe(number);
    expect(entry?.kind).toBe('role');
    expect(entry?.client ?? entry?.employer).toBe(title);
    expect(entry?.role).toBe(role);
    expect((entry?.engagement ?? entry?.employer)?.toUpperCase()).toBe(employerOrEngagement);
    expect(entry?.place.toUpperCase()).toBe(place);
    expect(entry?.start).toBe(month(start));
    expect(entry?.end).toBe(month(end));
    expect(entry?.context).toBe(tick(field(rest, 'Context')));
    expect(entry?.bullets).toEqual(rest.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)));
    expect(entry?.stack).toEqual(field(rest, 'Stack')?.split(' · '));
    expect(entry?.note).toBe(tick(field(rest, 'Note')));
  });

  it('holds Conspect as the employer whose assignments are OptieCon, the sabbatical and DJI', () => {
    const [heading = '', meta = '', context] = block('conspect');
    const [, role, employer] = /^### 02\.1 (.+) — (.+) \(id `conspect`/.exec(heading) ?? [];
    const [dates = '', , place] = meta.split(' · ');
    const [start = '', end = ''] = dates.split(' — ');
    const conspect = byId('conspect');

    expect(conspect).toMatchObject({ kind: 'employer', role, employer });
    expect(conspect?.parent).toBeUndefined();
    expect(conspect?.place.toUpperCase()).toBe(place);
    expect(conspect?.start).toBe(month(start));
    expect(conspect?.end).toBe(month(end));
    expect(conspect?.context).toBe(tick(context));
    // Its assignments, newest first; DJI a client assignment, OptieCon between client assignments.
    expect(entries.filter((e) => e.parent === 'conspect').map((e) => e.id)).toEqual([
      'optiecon',
      'sabbatical',
      'dji',
    ]);
    expect(byId('dji')?.engagement).toMatch(/^Client assignment/);
    expect(byId('optiecon')?.engagement).toContain('between client assignments');
    expect(byId('linkpizza')?.employer).toBe('LinkPizza');
    expect(byId('linkpizza')?.parent).toBeUndefined();
    for (const e of entries.filter((x) => x.parent === 'conspect')) {
      expect(e.employer, `${e.id} takes its employer from Conspect`).toBeUndefined();
      expect(e.start >= (conspect?.start ?? '')).toBe(true);
    }
  });

  it('holds the sabbatical as a hatched break with no employer', () => {
    const [, meta = ''] = block('sabbatical');
    const [, start = '', end = '', place = '', context] =
      /^(\w+ \d{4}) — (\w+ \d{4}) · (.+) — `(.+)`$/.exec(meta) ?? [];
    const entry = byId('sabbatical');

    expect(entry).toMatchObject({ kind: 'break', role: 'Sabbatical', context });
    expect(entry?.employer).toBeUndefined();
    expect(entry?.place.toUpperCase()).toBe(place);
    expect(entry?.start).toBe(month(start));
    expect(entry?.end).toBe(month(end));
  });

  it('lists exactly the five entries, newest first, assignments without overlaps', () => {
    expect(entries.map((e) => e.id)).toEqual([
      'conspect',
      'optiecon',
      'sabbatical',
      'dji',
      'linkpizza',
    ]);
    expect(entries.map((e) => e.order)).toEqual([1, 2, 3, 4, 5]);
    const bars = entries.filter((e) => e.kind !== 'employer');
    expect(bars.filter((e) => e.end === null).map((e) => e.id)).toEqual(['optiecon']);
    // Each entry starts no earlier than the next-older one ends (DJI ends in the month the
    // sabbatical starts: JAN 2026 on both sides in copy.md).
    bars.slice(0, -1).forEach((newer, i) => {
      const older = bars[i + 1];
      expect(older?.end, `${older?.id} has ended`).not.toBeNull();
      expect(newer.start >= (older?.end ?? ''), `${newer.id} starts after ${older?.id}`).toBe(true);
    });
  });

  it('holds the Conspect employer line and dimension span', () => {
    const conspect = byId('conspect');
    const line = sheet02.find((l) => l.startsWith('Employer description line'));
    expect(`${conspect?.employer} — ${conspect?.context}`).toBe(tick(line));

    const [, from = '', to = ''] = /`CONSPECT · (\w+ \d{4}) – (NOW)`/.exec(copy) ?? [];
    expect(conspect?.start).toBe(month(from));
    expect(conspect?.end).toBe(month(to));
  });

  it('holds the sheet label, heading, legend and month words in ui', () => {
    const ui = uiSchema.parse(readCollection('ui').find((f) => f.path === 'en/ui')?.data);
    const [label, heading] = [
      ...(sheet02.find((l) => l.startsWith('- Label '))?.matchAll(/`([^`]+)`/g) ?? []),
    ].map((m) => m[1]);
    const timeline = sheet02.find((l) => l.startsWith('- Timeline labels:')) ?? '';

    expect(ui.experience.label).toBe(label);
    expect(ui.experience.heading.join(' ')).toBe(heading);
    expect(timeline).toContain(`\`${ui.experience.legend[0]}\` / \`${ui.experience.legend[1]}\``);
    expect(ui.dates).toEqual({ months: MONTHS, now: 'NOW' });
  });
});

describe('experience schema: employers and their assignments', () => {
  const base = {
    id: 'x',
    order: 1,
    role: 'Engineer',
    place: 'Almere',
    start: '2024-01',
    end: null,
    context: 'Context.',
    lang: 'en',
  };

  it('takes an employer entry and an assignment that names it as parent', () => {
    expect(
      experienceSchema.safeParse({ ...base, kind: 'employer', employer: 'Conspect' }).success,
    ).toBe(true);
    expect(
      experienceSchema.safeParse({ ...base, parent: 'conspect', engagement: 'Client assignment' })
        .success,
    ).toBe(true);
  });

  it('refuses a role with neither employer nor parent, a nested employer, a loose engagement', () => {
    expect(experienceSchema.safeParse(base).success).toBe(false);
    expect(
      experienceSchema.safeParse({ ...base, kind: 'employer', employer: 'A', parent: 'b' }).success,
    ).toBe(false);
    expect(
      experienceSchema.safeParse({ ...base, employer: 'A', engagement: 'Client assignment' })
        .success,
    ).toBe(false);
  });
});
