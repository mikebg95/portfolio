import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { experienceSchema, profileSchema } from '../../src/content/schemas';
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

/** The lines under `### … (id `<id>`…)`, up to the next heading. */
function block(id: string): string[] {
  const start = sheet02.findIndex((l) => l.startsWith('### ') && l.includes(`(id \`${id}\``));
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
  it.each(['optiecon', 'dji', 'linkpizza'])('holds role %s verbatim', (id) => {
    const [heading = '', meta = '', ...rest] = block(id);
    const [, title, role] = /^### 02\.\d (.+) — (.+) \(id `/.exec(heading) ?? [];
    const [dates = '', employer, place] = meta.split(' · ');
    const [start = '', end = ''] = dates.split(' — ');
    const entry = byId(id);

    expect(entry?.kind).toBe('role');
    expect(entry?.client ?? entry?.employer).toBe(title);
    expect(entry?.role).toBe(role);
    expect(entry?.employer?.toUpperCase()).toBe(employer);
    expect(entry?.place.toUpperCase()).toBe(place);
    expect(entry?.start).toBe(month(start));
    expect(entry?.end).toBe(month(end));
    expect(entry?.context).toBe(tick(field(rest, 'Context')));
    expect(entry?.bullets).toEqual(rest.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)));
    expect(entry?.stack).toEqual(field(rest, 'Stack')?.split(' · '));
    expect(entry?.note).toBe(tick(field(rest, 'Note')));
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

  it('lists exactly the four entries, newest first, without overlaps', () => {
    expect(entries.map((e) => e.id)).toEqual(['optiecon', 'sabbatical', 'dji', 'linkpizza']);
    expect(entries.map((e) => e.order)).toEqual([1, 2, 3, 4]);
    expect(entries.filter((e) => e.end === null).map((e) => e.id)).toEqual(['optiecon']);
    // Each entry starts no earlier than the next-older one ends (DJI ends in the month the
    // sabbatical starts: JAN 2026 on both sides in copy.md).
    entries.slice(0, -1).forEach((newer, i) => {
      const older = entries[i + 1];
      expect(older?.end, `${older?.id} has ended`).not.toBeNull();
      expect(newer.start >= (older?.end ?? ''), `${newer.id} starts after ${older?.id}`).toBe(true);
    });
  });

  it('holds the Conspect employer line and dimension span', () => {
    const profile = profileSchema.parse(
      readCollection('profile').find((f) => f.path === 'en/profile')?.data,
    );
    const conspect = profile.employers.find((e) => e.name === 'Conspect');
    const line = sheet02.find((l) => l.startsWith('Employer description line'));
    expect(`${conspect?.name} — ${conspect?.description}`).toBe(tick(line));

    const [, from = '', to = ''] = /`CONSPECT · (\w+ \d{4}) – (NOW)`/.exec(copy) ?? [];
    expect(conspect?.start).toBe(month(from));
    expect(conspect?.end).toBe(month(to));
    // Its dimension spans every role it employed.
    for (const e of entries.filter((x) => x.employer === 'Conspect')) {
      expect(e.start >= (conspect?.start ?? '')).toBe(true);
    }
  });
});
