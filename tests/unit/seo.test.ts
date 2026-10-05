import { describe, expect, it } from 'vitest';

import {
  absoluteUrl,
  alternates,
  jsonLdText,
  neutralPath,
  personJsonLd,
  robots,
  sitemap,
} from '../../src/seo';

const ORIGIN = 'https://example.test';

describe('neutralPath', () => {
  it.each([
    ['/', 'en', '/'],
    ['/experience/', 'en', '/experience/'],
    ['/projects/jamigos', 'en', '/projects/jamigos/'],
    ['/nl/', 'nl', '/'],
    ['/nl', 'nl', '/'],
    ['/nl/projects/jamigos/', 'nl', '/projects/jamigos/'],
  ])('%s → %s %s', (pathname, lang, path) => {
    expect(neutralPath(pathname)).toEqual({ lang, path });
  });
});

describe('alternates', () => {
  it('lists every language, then x-default as the English URL', () => {
    expect(alternates(ORIGIN, '/education/')).toEqual([
      { hreflang: 'en', href: `${ORIGIN}/education/` },
      { hreflang: 'nl', href: `${ORIGIN}/nl/education/` },
      { hreflang: 'x-default', href: `${ORIGIN}/education/` },
    ]);
    expect(absoluteUrl(ORIGIN, 'nl', '/')).toBe(`${ORIGIN}/nl/`);
  });
});

describe('sitemap', () => {
  it('has one url per page and language, each with its alternates', () => {
    const xml = sitemap(ORIGIN, ['/', '/projects/']);
    expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/nl/`,
      `${ORIGIN}/projects/`,
      `${ORIGIN}/nl/projects/`,
    ]);
    expect(xml.match(/<xhtml:link /g)).toHaveLength(12);
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});

it('robots.txt points at the sitemap', () => {
  expect(robots(ORIGIN, '/sitemap.xml')).toBe(
    `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  );
});

describe('personJsonLd', () => {
  const person = personJsonLd({
    name: ['MICHAEL', 'GOLDMAN'],
    role: 'Java software engineer — full-stack, building towards DevOps.',
    url: `${ORIGIN}/`,
    sameAs: ['https://linkedin.com/in/x', 'https://github.com/x'],
    address: { locality: 'Amsterdam', country: 'NL' },
  });

  it('names the person and the job title before the dash', () => {
    expect(person).toMatchObject({
      '@type': 'Person',
      name: 'Michael Goldman',
      jobTitle: 'Java software engineer',
    });
  });

  it('gives city and country only', () => {
    expect(person.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Amsterdam',
      addressCountry: 'NL',
    });
    expect(Object.keys(person)).not.toContain('telephone');
  });

  it('escapes < so the JSON cannot close its script', () => {
    expect(jsonLdText({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}');
  });
});
