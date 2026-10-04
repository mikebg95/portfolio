import { describe, expect, it } from 'vitest';

import { effectiveTheme, isTheme, otherTheme, THEMES } from '../../src/theme';

// SPEC §3.3: a visitor's choice wins; without one the theme follows the system.
describe('theme', () => {
  it('knows exactly the two themes', () => {
    expect(THEMES).toEqual(['paper', 'blueprint']);
    expect(isTheme('blueprint')).toBe(true);
    expect(isTheme('dark')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('follows the system until a theme is chosen', () => {
    expect(effectiveTheme(undefined, false)).toBe('paper');
    expect(effectiveTheme(null, true)).toBe('blueprint');
    expect(effectiveTheme('nonsense', true)).toBe('blueprint');
  });

  it('keeps a chosen theme whatever the system says', () => {
    expect(effectiveTheme('paper', true)).toBe('paper');
    expect(effectiveTheme('blueprint', false)).toBe('blueprint');
  });

  it('switches to the other theme', () => {
    expect(otherTheme('paper')).toBe('blueprint');
    expect(otherTheme('blueprint')).toBe('paper');
  });
});
