import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PORTRAIT } from './portrait';

describe('PORTRAIT', () => {
  it('is docs/source/ascii-portrait.txt, unchanged', () => {
    const source = readFileSync(
      new URL('../docs/source/ascii-portrait.txt', import.meta.url),
      'utf8',
    );
    expect(PORTRAIT).toBe(source);
    expect(PORTRAIT.trim()).not.toBe('');
  });
});
