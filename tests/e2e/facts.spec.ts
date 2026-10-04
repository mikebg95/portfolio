import { readdirSync, readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

import { SITE_URL } from '../../src/config';
import {
  dates,
  inSources,
  names,
  numbers,
  pageText,
  pageUrls,
  sourceDates,
  sourceText,
} from './helpers/facts';

// PR-54, SPEC §3.7: every number, month-year date, proper noun and outbound URL on the built EN
// pages is in docs/source/ or in tests/e2e/facts-allowlist.yaml, which says why (sheet chrome, a
// plain word, or a fact checked in one of the public repos). Also: no page in either language
// shows the phone number, and Jamigos — whose hosting is retired — has no live link. Reads the
// `dist/` the Playwright web server has just built, so it runs in one project.
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'build only');

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

const SOURCES = ['cv.md', 'briefing.md', 'research-repos.md'].map((f) => `docs/source/${f}`);
const source = sourceText(SOURCES.map(read));
const sourceDateSet = sourceDates(source);

type Kind = 'numbers' | 'dates' | 'urls' | 'names';
const allowlist = load(read('tests/e2e/facts-allowlist.yaml')) as Record<
  Kind,
  Record<string, string[]>
>;
const allowed = (kind: Kind) =>
  new Set(Object.values(allowlist[kind]).flatMap((tokens) => tokens.map((t) => t.toLowerCase())));

/** Every built page, `dist`-relative, without the dev-only primitives sheet. */
function htmlFiles(dir = 'dist/'): string[] {
  return readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === '_primitives' ? [] : htmlFiles(`${dir}${e.name}/`);
    return e.name.endsWith('.html') ? [`${dir}${e.name}`] : [];
  });
}

const ALL = htmlFiles();
const EN = ALL.filter((f) => !f.startsWith('dist/nl/'));

/** Strip what makes the same URL look different: scheme, `www.`, `mailto:`, case. */
const bareUrl = (u: string) => u.replace(/^(?:https?:\/\/(?:www\.)?|mailto:)/i, '').toLowerCase();

/** The facts of one kind on the EN pages that the sources do not state: token → pages. */
function unsourced(kind: Kind): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const file of EN) {
    const html = read(file);
    const text = pageText(html);
    const tokens = {
      numbers: () => numbers(text).filter((n) => !inSources(n, source)),
      names: () => names(text).filter((w) => !inSources(w, source)),
      dates: () => dates(text).filter((d) => !sourceDateSet.has(d)),
      urls: () =>
        pageUrls(html)
          .filter((u) => !u.startsWith(SITE_URL))
          .filter((u) => !source.includes(bareUrl(u))),
    }[kind]();
    for (const token of tokens) found.set(token, (found.get(token) ?? new Set()).add(file));
  }
  return found;
}

test('the sources are where the audit looks', () => {
  expect(EN.length, 'EN pages in dist/').toBeGreaterThan(5);
  expect(EN).toContain('dist/index.html');
  for (const kind of ['numbers', 'dates', 'urls', 'names'] as const)
    expect(Object.keys(allowlist[kind]).length, `allowlist ${kind}`).toBeGreaterThan(0);
});

for (const kind of ['numbers', 'dates', 'urls', 'names'] as const) {
  test(`every ${kind.replace(/s$/, '')} on the EN pages is in docs/source/ or the allowlist`, () => {
    const missing = unsourced(kind);
    const ok = allowed(kind);
    const invented = [...missing]
      .filter(([token]) => !ok.has(token.toLowerCase()))
      .map(([token, files]) => `${token}  (${[...files].join(', ')})`);
    expect(invented, 'not in docs/source/ — find the source, or remove it').toEqual([]);

    const needed = new Set([...missing.keys()].map((t) => t.toLowerCase()));
    const stale = [...ok].filter((token) => !needed.has(token));
    expect(stale, 'allowlist entries no page needs (gone, or now in the sources)').toEqual([]);
  });
}

test('no page in either language shows the phone number', () => {
  // The number is read from the CV, so it is never written a second time in the repo.
  const line = read('docs/source/cv.md')
    .split('\n')
    .find((l) => l.includes('faPhone'));
  const digits = /\+31([\d\s]+)/.exec(line ?? '')?.[1]?.replace(/\D/g, '') ?? '';
  expect(digits.length, 'phone digits in cv.md').toBeGreaterThanOrEqual(9);
  // Its national part, with or without spaces, dashes, dots or a leading 0.
  const phone = new RegExp(digits.split('').join('[\\s\\-.()]*'));
  for (const file of ALL) {
    const html = read(file);
    expect(html, file).not.toMatch(phone);
    expect(html, file).not.toMatch(/href="tel:/i);
  }
});

test('Jamigos has no live-demo link, in either language', () => {
  for (const file of ALL) {
    const links = [...read(file).matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);
    const jamigos = links.filter((href) => /jamigos/i.test(href));
    // Only its own sheet (a site path) and its repository may be linked.
    const live = jamigos.filter(
      (href) =>
        !href.startsWith('/') &&
        !href.startsWith(SITE_URL) &&
        new URL(href).hostname !== 'github.com',
    );
    expect(live, file).toEqual([]);
    expect(
      links.filter((href) => /onrender\.com/i.test(href)),
      file,
    ).toEqual([]);
  }
});
