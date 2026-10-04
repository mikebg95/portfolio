import { describe, expect, it, vi } from 'vitest';

import { fakeAstroContent } from '../../tests/unit/helpers/content';

import { SHEET_KEYS } from '../content/schemas';
import { getAllLocalized, getLocalized, sharedId, t } from './content';
import { LANGS } from './paths';

vi.mock('astro:content', () => fakeAstroContent);

describe('t', () => {
  it.each(LANGS)('returns the %s strings', async (lang) => {
    const ui = await t(lang);
    expect(ui.lang).toBe(lang);
    for (const key of SHEET_KEYS) expect(ui.sheets[key]).toBeTruthy();
  });

  it('returns the English copy from design/copy.md', async () => {
    const ui = await t('en');
    expect(ui.skipLink).toBe('Skip to sheet content');
    expect(ui.sheets.overview).toBe('Overview');
  });
});

describe('getLocalized', () => {
  it.each(LANGS)('returns the %s twin of an entry', async (lang) => {
    const entry = await getLocalized('projects', 'jamigos', lang);
    expect(entry.id).toBe(`${lang}/jamigos`);
    expect(entry.data.lang).toBe(lang);
  });

  it('throws for an id that does not exist', async () => {
    await expect(getLocalized('projects', 'no-such-project', 'en')).rejects.toThrow();
  });
});

describe('getAllLocalized', () => {
  it.each(LANGS)('returns only %s entries, in order', async (lang) => {
    const projects = await getAllLocalized('projects', lang);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((p) => p.data.lang === lang)).toBe(true);
    const orders = projects.map((p) => p.data.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('pairs the languages entry for entry', async () => {
    const ids = async (lang: (typeof LANGS)[number]) =>
      (await getAllLocalized('projects', lang)).map(sharedId);
    expect(await ids('nl')).toEqual(await ids('en'));
  });
});
