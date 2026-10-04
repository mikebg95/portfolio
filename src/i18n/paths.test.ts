import { describe, expect, it } from 'vitest';

import { alternate, delocalize, langPaths, localize } from './paths';

describe('localize', () => {
  it('leaves English paths unprefixed', () => {
    expect(localize('en', '/')).toBe('/');
    expect(localize('en', '/projects/jamigos')).toBe('/projects/jamigos');
  });

  it('prefixes Dutch paths with /nl, the home page as /nl/', () => {
    expect(localize('nl', '/')).toBe('/nl/');
    expect(localize('nl', '/experience')).toBe('/nl/experience');
    expect(localize('nl', '/projects/jamigos/')).toBe('/nl/projects/jamigos/');
  });

  it('rejects a relative path', () => {
    expect(() => localize('nl', 'experience')).toThrow();
  });
});

describe('delocalize', () => {
  it.each([
    ['/', 'en', '/'],
    ['/experience', 'en', '/experience'],
    ['/nl', 'nl', '/'],
    ['/nl/', 'nl', '/'],
    ['/nl/projects/recipe-book', 'nl', '/projects/recipe-book'],
    ['/nlx', 'en', '/nlx'],
  ] as const)('%s is %s %s', (path, lang, neutral) => {
    expect(delocalize(path)).toEqual({ lang, path: neutral });
  });
});

describe('alternate', () => {
  it.each([
    ['en', '/', '/nl/'],
    ['nl', '/nl/', '/'],
    ['nl', '/nl', '/'],
    ['en', '/experience', '/nl/experience'],
    ['nl', '/nl/experience', '/experience'],
    ['en', '/projects/journal/', '/nl/projects/journal/'],
    ['nl', '/nl/projects/journal/', '/projects/journal/'],
  ] as const)('%s %s → %s', (lang, path, expected) => {
    expect(alternate(lang, path)).toBe(expected);
  });

  it('round-trips', () => {
    expect(alternate('nl', alternate('en', '/certifications'))).toBe('/certifications');
  });

  it('refuses a path in the other language', () => {
    expect(() => alternate('en', '/nl/experience')).toThrow();
  });
});

describe('langPaths', () => {
  it('gives English no prefix and Dutch nl', () => {
    expect(langPaths()).toEqual([
      { params: { lang: undefined }, props: { lang: 'en' } },
      { params: { lang: 'nl' }, props: { lang: 'nl' } },
    ]);
  });
});
