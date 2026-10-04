import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { projectSchema, uiSchema } from '../../src/content/schemas';
import { detailMeta } from '../../src/project-detail';
import { readCollection } from './helpers/content';

// PR-21: the EN project entries hold design/copy.md's Sheet 03 register table verbatim. Expected
// values are read out of copy.md itself.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8');
const lines = copy.split('\n');
const sheetStart = lines.indexOf('## Sheet 03 — Projects');
const sheetEnd = lines.findIndex((l, i) => i > sheetStart && l.startsWith('## '));
const sheet03 = lines.slice(sheetStart + 1, sheetEnd);

/** The register table's body rows: code, slug, title, card summary, card facts, status. */
const rows = sheet03
  .filter((l) => /^\| P-\d{2}/.test(l))
  .map((l) =>
    l
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim()),
  );

/** A detail sheet's paragraph in copy.md (`**03.1 Jamigos** — …`). */
const detailLine = (title: string) =>
  sheet03.find((l) => l.startsWith(`**03.`) && l.includes(` ${title}** — `)) ?? '';

/** The backticked value after `key ` in a detail paragraph (`summary `…``). */
const quoted = (line: string, key: string) => new RegExp(`${key} \`([^\`]+)\``).exec(line)?.[1];

/** The period in front of the detail sheet's meta line (`meta `AUG 2025 – NOV 2025 · …``). */
function period(title: string): string | undefined {
  return /meta `([^`·]+?)( ·|`)/.exec(detailLine(title))?.[1];
}

const STATUS: Record<string, string> = {
  done: 'done',
  'in progress': 'in-progress',
  'Hosting retired': 'retired-hosting',
};

const entries = readCollection('projects')
  .filter((f) => f.path.startsWith('en/'))
  .map((f) => projectSchema.parse(f.data))
  .sort((a, b) => a.order - b.order);

describe('projects (EN) against design/copy.md', () => {
  it('has the five projects of the register, in its order', () => {
    expect(rows).toHaveLength(5);
    expect(entries.map((e) => e.slug)).toEqual(rows.map((r) => r[1]));
    expect(entries.map((e) => e.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it.each(rows)('holds %s verbatim', (codeKind, slug, title, card, facts, status) => {
    const entry = entries.find((e) => e.slug === slug);
    const [code, ...kind] = codeKind.split(' · ');

    expect(entry?.code).toBe(code);
    expect(entry?.kind).toBe(kind.join(' · '));
    expect(entry?.title).toBe(title);
    expect(entry?.cardSummary).toBe(card);
    expect(entry?.status).toBe(STATUS[status]);
    expect(entry?.period).toBe(period(title));
    expect(entry?.repo).toMatch(new RegExp(`^https://github\\.com/mikebg95/${slug}$`, 'i'));
    expect(entry?.facts).toEqual(
      facts.split(' / ').map((f) => {
        const [, label, value] = /^([A-Z]+) (.+)$/.exec(f) ?? [];
        return { label, value };
      }),
    );
    // A TESTS card fact and the `tests` field never disagree.
    const testsFact = entry?.facts.find((f) => f.label === 'TESTS')?.value;
    expect(entry?.tests).toBe(testsFact === undefined ? undefined : Number(testsFact));
  });

  it('counts 251 tests across the series, P-02..P-04, as the register line says', () => {
    const series = entries.filter((e) => e.series);
    expect(series.map((e) => e.code)).toEqual(['P-02', 'P-03', 'P-04']);
    expect(series.reduce((sum, e) => sum + (e.tests ?? 0), 0)).toBe(251);
    expect(sheet03.join('\n')).toContain('`251 TESTS · ALL TEST-FIRST`');
  });

  it('holds the sheet label, heading, intro and series line in ui', () => {
    const ui = uiSchema.parse(readCollection('ui').find((f) => f.path === 'en/ui')?.data);
    const strings = (prefix: string) =>
      [...(sheet03.find((l) => l.startsWith(prefix))?.matchAll(/`([^`]+)`/g) ?? [])].map(
        (m) => m[1],
      );
    const [label, heading, intro] = strings('- Label ');

    expect(ui.projects.label).toBe(label);
    expect(ui.projects.heading.join(' ')).toBe(heading);
    expect(ui.projects.intro).toBe(intro);
    expect([ui.projects.series.label, ui.projects.series.tests.replace('{count}', '251')]).toEqual(
      strings('- Series line:'),
    );
  });
});

describe('Jamigos has no live URL anywhere', () => {
  // The jamigos.app domain is retired (docs/source/research-repos.md P-01): it may be named, never
  // linked.
  const LIVE = /(https?:\/\/|href=["']?|www\.)([\w-]+\.)*jamigos\.(app|com|dev|io|nl)/i;

  it('links only the GitHub repository from either Jamigos entry', () => {
    for (const { data } of readCollection('projects').filter((f) => f.path.endsWith('/jamigos'))) {
      const urls = JSON.stringify(data).match(/https?:\/\/[^\s"']+/g) ?? [];
      expect(urls).toEqual(['https://github.com/mikebg95/jamigos']);
    }
  });

  it.each(['src', 'public'])('links no jamigos domain from %s/', (dir) => {
    const root = fileURLToPath(new URL(`../../${dir}`, import.meta.url));
    const hits = readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(astro|ts|js|yaml|md|html|css|json|svg|txt)$/.test(f))
      .filter((f) => LIVE.test(readFileSync(join(root, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});

describe('detail sheets (EN) against design/copy.md', () => {
  const ui = uiSchema.parse(readCollection('ui').find((f) => f.path === 'en/ui')?.data);

  it('holds the common detail strings in ui', () => {
    const common = sheet03.find((l) => l.startsWith('Common: ')) ?? '';
    const strings = [...common.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const text = ui.projects.detail;
    expect(strings).toEqual([
      `← ${text.back}`,
      text.label.replace('{sheet}', '03').replace('{n}', 'n').replace('{code}', 'P-0n'),
      `${text.repo} ↗`,
      `← ${text.previous}`,
      `${text.next} →`,
    ]);
  });

  // PR-26…29 add their titles here as they write their sheets.
  it.each(['Jamigos'])('holds %s verbatim', (title) => {
    const line = detailLine(title);
    const entry = entries.find((e) => e.title === title);

    expect(entry?.summary).toBe(quoted(line, 'summary'));
    expect(entry && detailMeta(entry, entries, ui.projects.detail)).toBe(quoted(line, 'meta'));
    expect(entry?.figures.map((f) => f.title)).toEqual([
      quoted(line, 'FIG. 1'),
      quoted(line, 'FIG. 2'),
    ]);
    expect(entry?.note).toBe(quoted(line, 'Note'));
    const specRows = /Spec rows: (.+?) · FIG\. 2/.exec(line)?.[1];
    if (specRows) {
      const rows = [...specRows.matchAll(/([A-Z]+) `([^`]+)`/g)].map(([, label, text]) => ({
        label,
        text,
      }));
      expect(entry?.spec).toEqual(rows);
    }
  });
});
