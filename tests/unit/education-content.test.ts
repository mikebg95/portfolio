import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { educationSchema } from '../../src/content/schemas';
import { readCollection } from './helpers/content';

// PR-32: the EN education entries hold design/copy.md's Sheet 05 balloons, parts-list rows and
// detail panels verbatim. Expected values are read out of copy.md itself.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8');
const lines = copy.split('\n');
const sheetStart = lines.indexOf('## Sheet 05 — Education');
const sheetEnd = lines.findIndex((l, i) => i > sheetStart && l.startsWith('## '));
const sheet05 = lines.slice(sheetStart + 1, sheetEnd);

/** `- Balloons: 1 `VWO — base` · 2 `…`` → { 1: 'VWO — base', … }. */
const balloons = new Map(
  [...(sheet05.find((l) => l.startsWith('- Balloons:'))?.matchAll(/(\d) `([^`]+)`/g) ?? [])].map(
    (m) => [Number(m[1]), m[2]],
  ),
);

/** `rows: 5 CKAD (in progress) · Linux Foundation · — / 4 …` — a row starts at `/ <digit> `. */
const partsRows = new Map(
  (sheet05.find((l) => l.startsWith('- Parts list'))?.split('rows: ')[1] ?? '')
    .split(/ \/ (?=\d )/)
    .map((row) => {
      const [, item, part, supplier, years] = /^(\d) (.+) · (.+) · (.+)$/.exec(row) ?? [];
      return [Number(item), { part, supplier, years }] as const;
    }),
);

/** `  n. **Title** — meta — `body` · NOTE: `…` · rows … · link `LABEL ↗` → url`. */
const panels = sheet05
  .map((l) => /^ {2}(\d)\. \*\*(.+?)\*\* — (.+?) — `([^`]+)`(.*)$/.exec(l))
  .filter((m) => m !== null)
  .map(([, item, title, meta, body, rest = '']) => {
    const link = /link `(.+?)( ↗)?`(?: → (\S+))?/.exec(rest);
    return {
      item: Number(item),
      title,
      meta,
      body,
      note: /NOTE: `([^`]+)`/.exec(rest)?.[1],
      rows: [...rest.matchAll(/(\d\.\d) `([^`]+)` (\d+) EC/g)].map((m) => ({
        code: m[1],
        text: m[2],
        ec: Number(m[3]),
      })),
      link: link && { label: link[1], external: link[2] !== undefined, href: link[3] },
    };
  });

const entries = readCollection('education')
  .filter((f) => f.path.startsWith('en/'))
  .map((f) => ({ id: f.path.slice('en/'.length), ...educationSchema.parse(f.data) }))
  .sort((a, b) => a.item - b.item);

describe('education (EN) against design/copy.md', () => {
  it('has parts 1–5 in order, one per file part-n', () => {
    expect(panels.map((p) => p.item)).toEqual([1, 2, 3, 4, 5]);
    expect(entries.map((e) => [e.item, e.id])).toEqual(
      [1, 2, 3, 4, 5].map((n) => [n, `part-${n}`]),
    );
  });

  it.each(panels)('holds part $item verbatim', (panel) => {
    const entry = entries.find((e) => e.item === panel.item);
    const row = partsRows.get(panel.item);

    expect(entry?.balloon).toBe(balloons.get(panel.item));
    expect([entry?.part, entry?.supplier, entry?.years]).toEqual([
      row?.part,
      row?.supplier,
      row?.years,
    ]);
    expect(entry?.detail.title).toBe(panel.title);
    expect(entry?.detail.meta).toBe(panel.meta);
    expect(entry?.detail.body).toBe(panel.body);
    expect(entry?.detail.note).toBe(panel.note);
    expect(entry?.detail.rows).toEqual(panel.rows);
    // An external link's ↗ is drawn by the Link component, not stored.
    expect(entry?.detail.link?.label).toBe(panel.link?.label);
    if (panel.link?.external) expect(entry?.detail.link?.href).toBe(panel.link.href);
  });

  it('gives each part the EC in its detail meta', () => {
    for (const e of entries) {
      expect(e.ec).toBe(Number(/ (\d+) EC$/.exec(e.detail.meta)?.[1]) || undefined);
    }
  });

  it('gives part 3 three sub-rows totalling its 30 EC', () => {
    const part3 = entries.find((e) => e.item === 3);

    expect(part3?.detail.rows.map((r) => r.code)).toEqual(['3.1', '3.2', '3.3']);
    expect(part3?.detail.rows.reduce((sum, r) => sum + r.ec, 0)).toBe(30);
    expect(part3?.ec).toBe(30);
  });

  it('draws CS50 small, CKAD dashed and pending, the rest full and solid', () => {
    expect(entries.map((e) => [e.item, e.plate.size, e.plate.style, e.pending])).toEqual([
      [1, 'full', 'solid', false],
      [2, 'full', 'solid', false],
      [3, 'full', 'solid', false],
      [4, 'small', 'solid', false],
      [5, 'full', 'dashed', true],
    ]);
  });

  it('points CKAD at its certification card on Sheet 04', () => {
    expect(entries.find((e) => e.item === 5)?.detail.link?.href).toBe('/certifications#ckad');
  });
});
