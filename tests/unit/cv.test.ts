import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CV_PATH } from '../../src/config';

// SPEC §3.5: the header's CV link serves a copy of docs/source/cv.pdf, the one source of the CV.
const sha256 = (path: string) =>
  createHash('sha256')
    .update(readFileSync(new URL(path, import.meta.url), 'base64'))
    .digest('hex');

describe('CV download', () => {
  it('public/ holds an exact copy of docs/source/cv.pdf at CV_PATH', () => {
    expect(sha256(`../../public${CV_PATH}`)).toBe(sha256('../../docs/source/cv.pdf'));
  });
});
