import { readdirSync, readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

// SPEC §3.6: every Dutch page reads in Dutch. The built `dist/nl/` (Playwright's web server builds
// it first) must not carry the English UI words of copy.md Global, in its text or in the
// attributes a reader meets (aria-label, alt, title, meta content). Not the title block's
// PROJECT: the Dutch caption is the same word.
const ENGLISH = [
  'Skip to sheet content',
  'DRAWING SET',
  'Overview',
  'Experience',
  'Projects',
  'Certifications',
  'Education',
  'PAPER',
  'BLUEPRINT',
  'Switch to blueprint theme',
  'Switch to paper theme',
  'SHEETS',
  'CLOSE',
  'SCALE',
  'DRAWN',
  'CHECKED',
  'Portrait of Michael Goldman',
];

const dir = new URL('../../dist/nl/', import.meta.url).pathname;

/** What a reader can meet on the page: text and the attributes read out or shown. */
function readable(html: string): string {
  const attributes = [...html.matchAll(/\s(?:aria-label|alt|title|content)="([^"]*)"/g)].map(
    (m) => m[1],
  );
  const text = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&');
  return [text, ...attributes].join('\n');
}

// Listed inside the test, not at load: Playwright collects the specs before its server builds.
test('no built Dutch page carries an English UI word', () => {
  const pages = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) =>
    f.endsWith('.html'),
  );
  // Five sheets, five project details and the 404.
  expect(pages).toHaveLength(11);
  for (const page of pages) {
    const text = readable(readFileSync(`${dir}${page}`, 'utf8'));
    const found = ENGLISH.filter((word) => new RegExp(`\\b${word}\\b`).test(text));
    expect.soft(found, `dist/nl/${page}`).toEqual([]);
  }
});
