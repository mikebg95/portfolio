import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { certificationSchema } from '../../src/content/schemas';
import { readCollection } from './helpers/content';

// PR-30: the EN certification entries hold design/copy.md's Sheet 04 lines verbatim, and every
// verify link is the exact URL listed in docs/source/cv.md. Expected values are read out of those
// files themselves.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8');
const lines = copy.split('\n');
const sheetStart = lines.indexOf('## Sheet 04 — Certifications');
const sheetEnd = lines.findIndex((l, i) => i > sheetStart && l.startsWith('## '));
const sheet04 = lines.slice(sheetStart + 1, sheetEnd);

/** One `- C-0n Name · Issuer · Date · stamp A / B / C · `learned` · chips … · link` line, split. */
const rows = sheet04
  .filter((l) => /^- C-\d{2} /.test(l))
  .map((l) => {
    const [head = '', issuer, date, stamp = '', learned = '', chips = '', link = ''] = l
      .slice(2)
      .split(' · ');
    const [, code, name] = /^(C-\d{2}) (.+)$/.exec(head) ?? [];
    return {
      code,
      name,
      issuer,
      date,
      stamp: stamp.replace(/^stamp /, '').split(' / '),
      learned: learned.replace(/^`|`$/g, ''),
      skills: chips.replace(/^chips /, '').split(', '),
      link,
    };
  });

/** docs/source/cv.md's link list: `- https://… (Certification name)`. */
const cvLinks = new Map(
  [
    ...readFileSync(new URL('../../docs/source/cv.md', import.meta.url), 'utf8').matchAll(
      /^- (https:\/\/\S+) \((.+)\)$/gm,
    ),
  ].map((m) => [m[2], m[1]]),
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Aug 2025` → `2025-08`; `in progress` → null. */
function month(text: string | undefined): string | null {
  const [, name = '', year] = /^(\w{3}) (\d{4})$/.exec(text ?? '') ?? [];
  const index = MONTHS.indexOf(name);
  return index < 0 ? null : `${year}-${String(index + 1).padStart(2, '0')}`;
}

const entries = readCollection('certifications')
  .filter((f) => f.path.startsWith('en/'))
  .map((f) => ({ id: f.path.slice('en/'.length), ...certificationSchema.parse(f.data) }))
  .sort((a, b) => a.code.localeCompare(b.code));

describe('certifications (EN) against design/copy.md', () => {
  it('has C-01…C-04 under the ids the page anchors use', () => {
    expect(rows.map((r) => r.code)).toEqual(['C-01', 'C-02', 'C-03', 'C-04']);
    expect(entries.map((e) => [e.code, e.id])).toEqual([
      ['C-01', 'spring'],
      ['C-02', 'psm'],
      ['C-03', 'oca'],
      ['C-04', 'ckad'],
    ]);
  });

  it.each(rows)('holds $code verbatim', (row) => {
    const entry = entries.find((e) => e.code === row.code);

    expect(entry?.name).toBe(row.name);
    expect(entry?.issuer).toBe(row.issuer);
    expect(entry?.date).toBe(month(row.date));
    expect(entry?.stamp).toEqual(row.stamp);
    expect(entry?.learned).toBe(row.learned);
    expect(entry?.skills).toEqual(row.skills);
    // The link's arrow is drawn by the external link, not stored.
    expect(entry?.verifyLabel).toBe(
      row.link === 'no link' ? undefined : /^`(.+) ↗`$/.exec(row.link)?.[1],
    );
  });

  it('marks the three earned certifications verified and CKAD pending', () => {
    expect(entries.map((e) => [e.id, e.status])).toEqual([
      ['spring', 'verified'],
      ['psm', 'verified'],
      ['oca', 'verified'],
      ['ckad', 'pending'],
    ]);
    expect(entries.map((e) => e.stamp[0])).toEqual(['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING']);
  });

  it('links each verified certification to its exact URL in docs/source/cv.md, CKAD to none', () => {
    expect(Object.fromEntries(entries.map((e) => [e.id, e.verifyUrl]))).toEqual({
      spring: cvLinks.get('Spring Certified Professional'),
      psm: cvLinks.get('PSM I'),
      oca: cvLinks.get('OCA Java SE 8'),
      ckad: undefined,
    });
  });
});
