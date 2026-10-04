import { describe, expect, it } from 'vitest';

import { displayFit, FIT_MARGIN, headingWords, htmlText } from '../../src/display-fit';

describe('headingWords', () => {
  it('uppercases and splits at white space, and after a hyphen or slash', () => {
    expect(headingWords('DJI — Full-Stack Java\nEngineer')).toEqual([
      'DJI',
      '—',
      'FULL-',
      'STACK',
      'JAVA',
      'ENGINEER',
    ]);
    expect(headingWords('and/or')).toEqual(['AND/', 'OR']);
    expect(headingWords('  ')).toEqual([]);
  });
});

describe('htmlText', () => {
  it('treats tags as word boundaries and decodes Astro’s entities', () => {
    expect(htmlText('<span class="a">Michael</span> <span>Goldman</span>')).toContain('Goldman');
    expect(headingWords(htmlText('<span>Michael</span><span>Goldman</span>'))).toEqual([
      'MICHAEL',
      'GOLDMAN',
    ]);
    expect(htmlText('Data &amp; transactions &#39;x&#39; &#x2192;')).toBe(
      "Data & transactions 'x' →",
    );
  });
});

describe('displayFit', () => {
  it('is the em-width of the longest word at the display weight and stretch', async () => {
    // GOLDMAN measures 6.30 em in Archivo 850 / 118 % with -0.03 em tracking (PR-13 found 6.3).
    const goldman = await displayFit('GOLDMAN');
    expect(goldman / FIT_MARGIN).toBeCloseTo(6.3, 1);
    expect(await displayFit('Michael Goldman')).toBe(goldman);
    // The NL sheet name is the widest heading word on the site.
    expect(await displayFit('Certificeringen')).toBeGreaterThan(await displayFit('Certifications'));
  });

  it('counts a character the font lacks as a full em, and nothing for no text', async () => {
    expect(await displayFit('→')).toBeCloseTo(FIT_MARGIN, 2);
    expect(await displayFit('')).toBe(0);
  });
});
