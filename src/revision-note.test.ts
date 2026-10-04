import { describe, expect, it } from 'vitest';

import { splitNote } from './revision-note';

describe('splitNote', () => {
  it('splits a revision note after its triangle', () => {
    expect(
      splitNote('REV. NOTE △ The jamigos.app domain is retired. The code stays public.'),
    ).toEqual({
      lead: 'REV. NOTE △',
      body: 'The jamigos.app domain is retired. The code stays public.',
    });
  });

  it('splits a capitalised NOTE: lead', () => {
    expect(splitNote('NOTE: The exam is booked.')).toEqual({
      lead: 'NOTE:',
      body: 'The exam is booked.',
    });
  });

  it('leaves a note without a lead whole', () => {
    expect(splitNote('Names are unique regardless of case: an index, not code.')).toEqual({
      lead: '',
      body: 'Names are unique regardless of case: an index, not code.',
    });
  });

  it('does not take a triangle far into the text as a lead', () => {
    const text = 'A long sentence that only later mentions a △ triangle.';
    expect(splitNote(text)).toEqual({ lead: '', body: text });
  });
});
