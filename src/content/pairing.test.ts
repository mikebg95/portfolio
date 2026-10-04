import { describe, expect, it } from 'vitest';

import { findPairingErrors, shapeOf } from './pairing';

const en = (path: string, data: object = {}) => ({
  path: `en/${path}`,
  data: { ...data, lang: 'en' },
});
const nl = (path: string, data: object = {}) => ({
  path: `nl/${path}`,
  data: { ...data, lang: 'nl' },
});

describe('shapeOf', () => {
  it('lists every key path, arrays by index', () => {
    expect(shapeOf({ a: [{ b: 1 }, 'x'], c: null })).toEqual(['a', 'a.0', 'a.0.b', 'a.1', 'c']);
  });

  it('is empty for a scalar', () => {
    expect(shapeOf('text')).toEqual([]);
  });
});

describe('findPairingErrors', () => {
  it('accepts twins with the same fields', () => {
    const files = [
      en('dji', { role: 'Engineer', bullets: ['a'] }),
      nl('dji', { role: 'Engineer', bullets: ['b'] }),
    ];
    expect(findPairingErrors('experience', files)).toEqual([]);
  });

  it('accepts an empty collection', () => {
    expect(findPairingErrors('experience', [])).toEqual([]);
  });

  it('fails an entry that exists only in English', () => {
    expect(findPairingErrors('experience', [en('dji')])).toEqual(['experience/dji: missing in nl']);
  });

  it('fails an entry that exists only in Dutch', () => {
    expect(findPairingErrors('projects', [nl('journal')])).toEqual([
      'projects/journal: missing in en',
    ]);
  });

  it('fails twins where one language lacks a field', () => {
    const files = [en('dji', { role: 'Engineer', note: 'n' }), nl('dji', { role: 'Engineer' })];
    expect(findPairingErrors('experience', files)).toEqual([
      'experience/dji: note is in en but not in nl',
    ]);
  });

  it('fails twins with a different number of list items', () => {
    const files = [en('dji', { bullets: ['a'] }), nl('dji', { bullets: ['a', 'b'] })];
    expect(findPairingErrors('experience', files)).toEqual([
      'experience/dji: bullets.1 is in nl but not in en',
    ]);
  });

  it('ignores translated, which only the Dutch draft sets', () => {
    const files = [en('dji'), nl('dji', { translated: false })];
    expect(findPairingErrors('experience', files)).toEqual([]);
  });

  it('fails a lang field that disagrees with its folder', () => {
    const files = [en('dji'), { path: 'nl/dji', data: { lang: 'en' } }];
    expect(findPairingErrors('experience', files)).toEqual([
      'experience/nl/dji: lang is en, folder is nl',
    ]);
  });

  it('fails a file outside a language folder', () => {
    expect(findPairingErrors('profile', [{ path: 'profile', data: { lang: 'en' } }])).toEqual([
      'profile/profile: not inside a language folder (en, nl)',
    ]);
  });
});
