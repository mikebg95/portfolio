import { describe, expect, it } from 'vitest';

import tokens from '../../design/tokens.json';
import { faviconSvg } from '../../src/favicon';

// PR-52: the site icon every page links (a missing one 404s and costs Lighthouse best practices).
describe('faviconSvg', () => {
  const svg = faviconSvg();

  it('is a standalone SVG', () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 32 32">/);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('draws in the token colours of both themes, dark under prefers-color-scheme', () => {
    const [light, dark] = svg.split('@media (prefers-color-scheme:dark)');
    for (const name of ['paper', 'ink', 'line', 'redline'] as const) {
      expect(light).toContain(tokens.color[name].light);
      expect(dark).toContain(tokens.color[name].dark);
    }
  });
});
