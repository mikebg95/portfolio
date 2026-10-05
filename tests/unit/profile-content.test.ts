import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { profileSchema } from '../../src/content/schemas';
import { readCollection } from './helpers/content';

// PR-12: the EN profile holds design/copy.md's Sheet 01 strings verbatim. The expected values are
// read out of copy.md itself, so a wording change there fails here until the content follows.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8');

/** The lines of one `## ` section of copy.md, up to the next `## ` heading. */
function section(heading: string): string[] {
  const lines = copy.split('\n');
  const start = lines.indexOf(`## ${heading}`);
  expect(start, `copy.md has "## ${heading}"`).toBeGreaterThan(-1);
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

/** The backticked strings of the bullet `- <name>: …`. */
function ticks(lines: string[], name: string): string[] {
  const line = lines.find((l) => l.startsWith(`- ${name}:`));
  expect(line, `copy.md has "- ${name}:"`).toBeDefined();
  return [...(line ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '');
}

const sheet01 = section('Sheet 01 — Overview');
const profile = profileSchema.parse(
  readCollection('profile').find((file) => file.path === 'en/profile')?.data,
);

describe('profile (EN) against design/copy.md', () => {
  it('holds the hero verbatim', () => {
    const { hero } = profile;
    expect([hero.label]).toEqual(ticks(sheet01, 'Label'));
    expect(hero.name).toEqual(ticks(sheet01, 'Name'));
    expect([hero.role]).toEqual(ticks(sheet01, 'Role line'));
    expect([hero.intro]).toEqual(ticks(sheet01, 'Intro'));
    expect(hero.revisionNote).toBe(ticks(sheet01, 'Revision note').join(' '));
    expect([hero.buttons.projects, hero.buttons.cv]).toEqual(ticks(sheet01, 'Buttons'));
    expect([hero.dimensions.horizontal, hero.dimensions.vertical]).toEqual(
      ticks(sheet01, 'Dimensions'),
    );
    expect([hero.portraitAlt]).toEqual(ticks(section('Global'), 'Portrait sr-only text'));
  });

  it('holds balloons 1–3, with balloon 1 linking to /certifications/', () => {
    expect(profile.hero.balloons.map((b) => b.text)).toEqual(ticks(sheet01, 'Balloons'));
    expect(profile.hero.balloons.map((b) => b.href)).toEqual([
      '/certifications/',
      undefined,
      undefined,
    ]);
  });

  it('holds S-01…S-07 verbatim, Kubernetes as S-06 pending in redline', () => {
    const rows = sheet01
      .map((line) => /^- (S-\d{2}) (\S+) — (.+)$/.exec(line))
      .filter((m) => m !== null)
      .map(([, code, label, rest]) => {
        const parts = (rest ?? '').split(' · ');
        const last = parts.at(-1) ?? '';
        const pending = /^\*(.+)\* \(redline\)$/.exec(last)?.[1];
        return pending === undefined
          ? { code, label, items: parts }
          : { code, label, items: parts.slice(0, -1), pending };
      });
    expect(rows).toHaveLength(7);
    expect(profile.specs).toEqual(rows);
    expect(profile.specs[5]?.pending).toBe('Kubernetes — CKAD in progress');
  });

  it('holds how I work, the AI note, general notes and the in-progress items', () => {
    const numbered = (heading: string) => {
      const start = sheet01.findIndex((l) => l.startsWith(`### ${heading}`));
      const end = sheet01.findIndex((l, i) => i > start && l.startsWith('### '));
      return sheet01
        .slice(start + 1, end === -1 ? undefined : end)
        .map((l) => /^\d+\. (.+)$/.exec(l)?.[1])
        .filter((l) => l !== undefined);
    };
    expect(profile.howIWork.map((p) => `**${p.title}** — ${p.body}`)).toEqual(
      numbered('How I work'),
    );
    expect([profile.aiNote]).toEqual(ticks(sheet01, 'AI note (mono, under the four)'));
    expect(profile.generalNotes).toEqual(numbered('General notes'));

    const current = sheet01
      .map((l) => /^- `(.+)` → (\S+)$/.exec(l))
      .filter((m) => m !== null)
      .map(([, text, href]) => ({ text, href }));
    expect(profile.current).toEqual(current);
  });

  it('holds the panel labels', () => {
    const label = (heading: string) =>
      sheet01
        .map((l) => new RegExp(`^### ${heading} \\(label \`(.+)\`\\)$`).exec(l)?.[1])
        .find(Boolean);
    expect(profile.labels).toEqual({
      howIWork: label('How I work'),
      specification: label('Specification'),
      generalNotes: label('General notes'),
      current: label('Current work'),
    });
  });
});
