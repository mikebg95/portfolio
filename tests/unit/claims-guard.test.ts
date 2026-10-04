import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { readCollection } from './helpers/content';

// PR-66: the content passes PR-60–65 corrected claims against docs/source/briefing.md. This test
// keeps them corrected — a later copy change that brings one back fails here, in EN, NL or
// design/copy.md. Only generic phrases live in this file.
const copy = readFileSync(new URL('../../design/copy.md', import.meta.url), 'utf8').split('\n');

/** The lines of copy.md from the heading that starts with `heading` to the next heading of its level or higher. */
function section(heading: string): string {
  const start = copy.findIndex((l) => l.startsWith(heading));
  expect(start, `copy.md heading "${heading}"`).toBeGreaterThanOrEqual(0);
  const level = /^#+/.exec(heading)?.[0].length ?? 0;
  const end = copy.findIndex(
    (l, i) => i > start && /^#+ /.test(l) && (/^#+/.exec(l)?.[0].length ?? 0) <= level,
  );
  return copy.slice(start, end < 0 ? undefined : end).join('\n');
}

/** A copy.md line that starts with `prefix` (a register row or a detail-sheet paragraph). */
function copyLine(prefix: string): string {
  const line = copy.find((l) => l.startsWith(prefix));
  expect(line, `copy.md line "${prefix}"`).toBeDefined();
  return line ?? '';
}

/** Every string in a parsed YAML value, joined — the text a visitor can read. */
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(text).join('\n');
  if (value && typeof value === 'object') return Object.values(value).map(text).join('\n');
  return '';
}

type Entry = Record<string, unknown>;

function entry(collection: string, lang: 'en' | 'nl', id: string): Entry {
  const file = readCollection(collection).find((f) => f.path === `${lang}/${id}`);
  expect(file, `${collection}/${lang}/${id}.yaml`).toBeDefined();
  return (file?.data ?? {}) as Entry;
}

const both = (collection: string, id: string) => ({
  en: entry(collection, 'en', id),
  nl: entry(collection, 'nl', id),
});

describe('corrected claims stay corrected', () => {
  it('the profile never claims five years of Spring Boot', () => {
    const banned =
      /\b(five|5\+?) (years?|yrs?) (of )?Spring Boot|\b(vijf|5\+?) (jaar|jr) Spring Boot/i;
    const { en, nl } = both('profile', 'profile');
    for (const [where, body] of [
      ['profile EN', text(en)],
      ['profile NL', text(nl)],
      ['copy.md Sheet 01', section('## Sheet 01')],
    ] as const) {
      expect(body, where).not.toMatch(banned);
    }
  });

  it('How I work never says "to production"', () => {
    const banned = /\bto production\b|tot in productie/i;
    const { en, nl } = both('profile', 'profile');
    for (const [where, body] of [
      ['profile EN howIWork', text(en.howIWork)],
      ['profile NL howIWork', text(nl.howIWork)],
      ['copy.md How I work', section('### How I work')],
    ] as const) {
      expect(body, where).not.toMatch(banned);
    }
  });

  it('DJI never claims production, an empty repository, greenfield or go-live', () => {
    const banned =
      /production|productie|empty repo(sitory)?|lege repo(sitory)?|green[- ]?field|go[- ]?live/i;
    const { en, nl } = both('experience', 'dji');
    for (const [where, body] of [
      ['experience/en/dji', text(en)],
      ['experience/nl/dji', text(nl)],
      ['copy.md 02.1c DJI', section('#### 02.1c DJI')],
    ] as const) {
      expect(body, where).not.toMatch(banned);
    }
  });

  it('OptieCon never says "end to end"', () => {
    const banned = /end[- ]to[- ]end|van begin tot eind/i;
    const { en, nl } = both('experience', 'optiecon');
    for (const [where, body] of [
      ['experience/en/optiecon', text(en)],
      ['experience/nl/optiecon', text(nl)],
      ['copy.md 02.1a OptieCon', section('#### 02.1a OptieCon')],
    ] as const) {
      expect(body, where).not.toMatch(banned);
    }
  });

  it('Jamigos mentions Capacitor only as AI-generated and is not the flagship', () => {
    const { en, nl } = both('projects', 'jamigos');
    for (const [where, body, label] of [
      ['projects/en/jamigos spec', text(en.spec), /AI-generated/i],
      ['projects/nl/jamigos spec', text(nl.spec), /AI-gegenereerd/i],
      ['copy.md 03.1 Jamigos', copyLine('**03.1 Jamigos**'), /AI-generated/i],
    ] as const) {
      if (/capacitor/i.test(body)) expect(body, where).toMatch(label);
    }
    expect(en.kind).not.toMatch(/flagship/i);
    expect(nl.kind).not.toMatch(/vlaggenschip|flagship/i);
    expect(copyLine('| P-01')).not.toMatch(/flagship/i);
  });

  it("Journal's card summary says the AI step is designed and comes next", () => {
    const { en, nl } = both('projects', 'journal');
    for (const [where, summary, status] of [
      ['projects/en/journal', text(en.cardSummary), /designed|next/i],
      ['projects/nl/journal', text(nl.cardSummary), /ontworpen|hierna|volgende/i],
      ['copy.md P-04 row', copyLine('| P-04'), /designed|next/i],
    ] as const) {
      if (/\bAI\b/.test(summary)) expect(summary, where).toMatch(status);
    }
  });

  it('Scentify never mentions the minor', () => {
    const { en, nl } = both('projects', 'scentify');
    for (const [where, body] of [
      ['projects/en/scentify', text(en)],
      ['projects/nl/scentify', text(nl)],
      ['copy.md P-05 row', copyLine('| P-05')],
      ['copy.md 03.5 Scentify', copyLine('**03.5 Scentify**')],
    ] as const) {
      expect(body, where).not.toMatch(/\bminor\b/i);
    }
  });
});
