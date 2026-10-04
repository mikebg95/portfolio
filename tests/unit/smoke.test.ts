import { describe, expect, it } from 'vitest';

import { SITE_URL } from '../../src/config';

describe('SITE_URL', () => {
  it('is a bare https origin', () => {
    const url = new URL(SITE_URL);
    expect(url.protocol).toBe('https:');
    expect(url.origin).toBe(SITE_URL);
  });
});
