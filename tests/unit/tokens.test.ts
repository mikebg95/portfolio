import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildTokensCss,
  DOC_LEAVES,
  generateTokensCss,
  TOKENS_CSS,
  TOKENS_JSON,
} from '../../scripts/tokens';
import { PRELOAD_FONTS } from '../../src/styles/fonts';

const tokens = JSON.parse(readFileSync(TOKENS_JSON, 'utf8')) as Record<
  string,
  Record<string, unknown>
>;
const css = readFileSync(TOKENS_CSS, 'utf8');
const fontsCss = readFileSync(new URL('../../src/styles/fonts.css', import.meta.url), 'utf8');
const publicDir = new URL('../../public', import.meta.url).pathname;

/** Prettier rewrites `#E9E5DA` → `#e9e5da`, `0.10` → `0.1`, `.7,0` → `0.7, 0`; compare past that. */
function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\b0+(\.\d)/g, '$1')
    .replace(/(\.\d*?)0+(?!\d)/g, '$1')
    .replace(/\.(?!\d)/g, '');
}

function declarations(selectorPattern: RegExp): Map<string, string> {
  const body = selectorPattern.exec(css)?.[1];
  if (body === undefined) throw new Error(`no block ${selectorPattern}`);
  const decls = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) decls.set(m[1]!, norm(m[2]!));
  return decls;
}

const root = declarations(/^:root \{([^}]*)\}/m);
const blueprint = declarations(/^\[data-theme='blueprint'\] \{([^}]*)\}/m);
const paper = declarations(/^\[data-theme='paper'\] \{([^}]*)\}/m);
const anyTheme = declarations(/^\[data-theme\] \{([^}]*)\}/m);
const systemDark = declarations(
  /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme='paper'\]\) \{([^}]*)\}/,
);

describe('design tokens → src/styles/tokens.css', () => {
  it('is up to date with design/tokens.json (run `npm run tokens`)', async () => {
    expect(css).toBe(await buildTokensCss());
  });

  it('carries every colour: paper in :root, blueprint in both dark blocks', () => {
    const colours = tokens.color as Record<string, { light: string; dark: string }>;
    for (const [key, { light, dark }] of Object.entries(colours)) {
      expect(root.get(`--color-${key}`), key).toBe(norm(light));
      expect(blueprint.get(`--color-${key}`), key).toBe(norm(dark));
      expect(systemDark.get(`--color-${key}`), key).toBe(norm(dark));
    }
    expect(blueprint.size).toBe(Object.keys(colours).length);
  });

  it('lets a nested [data-theme] section draw in its own colours', () => {
    const colours = tokens.color as Record<string, { light: string }>;
    for (const [key, { light }] of Object.entries(colours)) {
      expect(paper.get(`--color-${key}`), key).toBe(norm(light));
    }
    const fromColour = [...root].filter(([, value]) => value.includes('var(--color-'));
    expect(fromColour.map(([name]) => name)).toContain('--border-normal');
    expect([...anyTheme]).toEqual(fromColour);
  });

  it('has a custom property for every other token', () => {
    for (const [group, entries] of Object.entries(tokens)) {
      if (group === 'color') continue;
      const prefix = group === 'breakpoints' ? 'breakpoint' : group;
      for (const key of Object.keys(entries)) {
        if (DOC_LEAVES.includes(`${group}.${key}`)) continue;
        const names = [...root.keys()].filter(
          (n) => n === `--${prefix}-${key}` || n.startsWith(`--${prefix}-${key}-`),
        );
        expect(names, `${group}.${key}`).not.toHaveLength(0);
      }
    }
  });

  it('copies plain values verbatim', () => {
    for (const group of ['space', 'motion']) {
      for (const [key, value] of Object.entries(tokens[group]!)) {
        if (DOC_LEAVES.includes(`${group}.${key}`)) continue;
        expect(root.get(`--${group}-${key}`), `${group}.${key}`).toBe(norm(String(value)));
      }
    }
    for (const [key, value] of Object.entries(tokens.size!)) {
      if (String(value).startsWith('clamp(')) {
        expect(root.get(`--size-${key}`)).toBe(norm(String(value)));
      }
    }
  });

  it('reads the described tokens as drawn', () => {
    expect(root.get('--sheet-content-padding')).toBe('56px');
    expect(root.get('--sheet-content-padding-phone')).toBe('20px');
    expect(root.get('--sheet-outer-padding-phone')).toBe('0');
    expect(root.get('--sheet-frame-gap')).toBe('10px');
    expect(root.get('--sheet-grid-major')).toBe('80px');
    expect(root.get('--border-dashed-note')).toBe('1.5pxdashedvar(--color-redline)');
    expect(root.get('--shadow-lift')).toBe('6px6px0var(--color-ink)');
    expect(root.get('--font-body')).toBe(norm("'IBM Plex Sans', system-ui, sans-serif"));
    expect(root.get('--size-body-line-height')).toBe('1.65');
    expect(root.get('--breakpoint-phone-max')).toBe('767px');
    expect(root.get('--breakpoint-desktop-min')).toBe('1024px');
  });

  it('fails loudly on a token it cannot read', () => {
    const broken = { ...tokens, sheet: { grid: 'sixteen minor' } };
    expect(() => generateTokensCss(broken)).toThrow(/sheet\.grid/);
  });
});

describe('self-hosted fonts', () => {
  const faces = [...fontsCss.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1]!);
  const urls = [...fontsCss.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]!);

  it('declares Archivo variable and IBM Plex Sans/Mono 400/500/600, all with swap', () => {
    const declared = faces.map((f) => {
      const family = /font-family: '([^']+)'/.exec(f)?.[1];
      const weight = /font-weight: ([\d ]+);/.exec(f)?.[1];
      expect(f).toContain('font-display: swap;');
      return `${family} ${weight}`;
    });
    expect(declared.sort()).toEqual(
      [
        'Archivo 100 900',
        ...['400', '500', '600'].flatMap((w) => [`IBM Plex Mono ${w}`, `IBM Plex Sans ${w}`]),
      ].sort(),
    );
    expect(faces.find((f) => f.includes("'Archivo'"))).toContain('font-stretch: 62% 125%;');
  });

  it('points every face and preload at a woff2 file in public/fonts', () => {
    for (const url of [...urls, ...PRELOAD_FONTS]) {
      expect(url, url).toMatch(/^\/fonts\/[\w-]+\.woff2$/);
      const file = join(publicDir, url);
      expect(existsSync(file), url).toBe(true);
      expect(readFileSync(file).subarray(0, 4).toString('latin1'), url).toBe('wOF2');
    }
    for (const href of PRELOAD_FONTS) expect(urls).toContain(href);
    expect(PRELOAD_FONTS).toHaveLength(2);
  });

  it('never requests a font from another origin', () => {
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(astro|css|ts|html|mjs|js)$/.test(name)) {
          const text = readFileSync(path, 'utf8');
          if (/fonts\.(googleapis|gstatic)\.com|use\.typekit|url\(\s*['"]?https?:/.test(text)) {
            offenders.push(path);
          }
        }
      }
    };
    walk(new URL('../../src', import.meta.url).pathname);
    expect(offenders).toEqual([]);
  });
});
