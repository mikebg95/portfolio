import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PORTRAIT, PORTRAIT_DARK } from './portrait';

const source = (file: string) =>
  readFileSync(new URL(`../docs/source/${file}`, import.meta.url), 'utf8');

describe('PORTRAIT', () => {
  it('is docs/source/ascii-portrait.txt, unchanged', () => {
    expect(PORTRAIT).toBe(source('ascii-portrait.txt'));
    expect(PORTRAIT.trim()).not.toBe('');
  });
});

describe('PORTRAIT_DARK', () => {
  it('is docs/source/ascii-portrait-dark.txt, unchanged', () => {
    expect(PORTRAIT_DARK).toBe(source('ascii-portrait-dark.txt'));
    expect(PORTRAIT_DARK.trim()).not.toBe('');
    expect(PORTRAIT_DARK).not.toBe(PORTRAIT);
  });
});
