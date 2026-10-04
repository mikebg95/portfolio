/**
 * Generates src/styles/tokens.css from design/tokens.json (`npm run tokens`, run by `dev` and
 * `build`). tokens.json mixes plain CSS values with short descriptions ("56px desktop, 24px
 * phone"); every description is parsed by a rule below, and anything a rule cannot read throws,
 * so a reworded token fails the build instead of producing a wrong value.
 *
 * Naming: `--<group>-<key>[-<qualifier>]`, e.g. `--color-ink`, `--size-body-line-height`,
 * `--sheet-content-padding-phone`. Colours carry the paper (light) value in `:root` and the
 * blueprint (dark) value under `[data-theme='blueprint']` and the system dark preference.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { format, resolveConfig } from 'prettier';

export const TOKENS_JSON = fileURLToPath(new URL('../design/tokens.json', import.meta.url));
export const TOKENS_CSS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/** Leaves that document rather than define a value; they get no custom property. */
export const DOC_LEAVES = ['font.files', 'motion.spec'];

type Json = Record<string, unknown>;
export interface Decl {
  name: string;
  value: string;
}
interface ColourToken {
  light: string;
  dark: string;
}

const LENGTH = /^-?(?:\d*\.)?\d+(?:–(?:\d*\.)?\d+)?(?:px|%|em|rem|vw|vh)?,?$/;

/** "15–16px" → "16px": a range in tokens.json means "up to", and the upper bound reads best. */
function upper(value: string): string {
  const range = /^(-?[\d.]+)–([\d.]+)(\D*)$/.exec(value);
  return range ? `${range[2]}${range[3]}` : value;
}

function stripNotes(text: string): string {
  return text.replace(/\s*\([^)]*\)/g, '').trim();
}

function fail(path: string, value: string): never {
  throw new Error(`tokens: cannot read ${path} = ${JSON.stringify(value)}`);
}

/** The leading CSS value of a description: a whole `fn(...)` call, or the first word. */
function primary(path: string, text: string): string {
  if (/^[a-z-]+\(/.test(text)) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '(') depth++;
      if (text[i] === ')' && --depth === 0) return text.slice(0, i + 1);
    }
    fail(path, text);
  }
  const first = stripNotes(text).split(/\s+/)[0] ?? '';
  if (!LENGTH.test(first)) fail(path, text);
  return upper(first.replace(/,$/, ''));
}

/** Typographic hints in a description ("letter-spacing .12em, uppercase") as extra properties. */
function extras(name: string, text: string): Decl[] {
  const rest = stripNotes(text);
  const out: Decl[] = [];
  const rules: [RegExp, string, (m: string) => string][] = [
    [/\bweight ([\d.–]+)/, 'weight', upper],
    [/\bfont-stretch ([\d.–]+%)/, 'stretch', upper],
    [/\bline-height ([\d.–]+)/, 'line-height', upper],
    [/\bletter-spacing (-?[\d.]+em)/, 'letter-spacing', (m) => m],
    [/\b(uppercase)\b/, 'transform', (m) => m],
  ];
  for (const [re, suffix, read] of rules) {
    const m = re.exec(rest);
    if (m?.[1]) out.push({ name: `${name}-${suffix}`, value: read(m[1]) });
  }
  return out;
}

/** "1.5px dashed redline" → "1.5px dashed var(--color-redline)"; trailing colour word → var(). */
function withColour(path: string, text: string, colours: Set<string>, style?: string): string {
  const words = stripNotes(text).split(/\s+/);
  const colour = words.pop() ?? '';
  if (!colours.has(colour)) fail(path, text);
  if (style !== undefined && words.length === 1) words.push(style);
  return [...words, `var(--color-${colour})`].join(' ');
}

/** "56px desktop, 24px phone" → base + `-phone`; "16px minor / 80px major" → `-minor`, `-major`. */
function segments(path: string, name: string, text: string, colours: Set<string>): Decl[] {
  return stripNotes(text)
    .split(/;\s+|,\s+|\s+\/\s+/)
    .map((segment) => {
      const words = segment.split(/\s+/);
      const lengths: string[] = [];
      while (words[0] !== undefined && LENGTH.test(words[0])) lengths.push(words.shift() ?? '');
      if (lengths.length === 0) fail(path, text);
      const qualifier = words.filter((w) => !colours.has(w) && w !== 'on').pop();
      const suffix = qualifier === undefined || qualifier === 'desktop' ? '' : `-${qualifier}`;
      return { name: `${name}${suffix}`, value: lengths.map(upper).join(' ') };
    });
}

/** "< 768px" → max 767px; "768–1023px" → min + max; ">= 1024px" → min. */
function breakpoint(path: string, name: string, text: string): Decl[] {
  const lt = /^<\s*(\d+)px$/.exec(text);
  if (lt) return [{ name: `${name}-max`, value: `${Number(lt[1]) - 1}px` }];
  const ge = /^>=\s*(\d+)px$/.exec(text);
  if (ge) return [{ name: `${name}-min`, value: `${ge[1]}px` }];
  const range = /^(\d+)–(\d+)px$/.exec(text);
  if (range) {
    return [
      { name: `${name}-min`, value: `${range[1]}px` },
      { name: `${name}-max`, value: `${range[2]}px` },
    ];
  }
  fail(path, text);
}

export interface TokenSets {
  light: Decl[];
  dark: Decl[];
  shared: Decl[];
}

export function readTokens(tokens: Json): TokenSets {
  const colours = tokens.color as Record<string, ColourToken>;
  const colourNames = new Set(Object.keys(colours));
  const light: Decl[] = [];
  const dark: Decl[] = [];
  const shared: Decl[] = [];

  for (const [key, { light: l, dark: d }] of Object.entries(colours)) {
    if (typeof l !== 'string' || typeof d !== 'string') fail(`color.${key}`, String(l));
    light.push({ name: `--color-${key}`, value: l });
    dark.push({ name: `--color-${key}`, value: d });
  }

  for (const [group, entries] of Object.entries(tokens)) {
    if (group === 'color') continue;
    for (const [key, raw] of Object.entries(entries as Record<string, string>)) {
      const path = `${group}.${key}`;
      if (DOC_LEAVES.includes(path)) continue;
      if (typeof raw !== 'string') fail(path, String(raw));
      const name = `--${group === 'breakpoints' ? 'breakpoint' : group}-${key}`;
      switch (group) {
        case 'font':
          shared.push({ name, value: raw.split(' — ')[0] ?? fail(path, raw) });
          shared.push(...extras(name, raw.split(' — ')[1] ?? ''));
          break;
        case 'size':
          shared.push({ name, value: primary(path, raw) }, ...extras(name, raw));
          break;
        case 'sheet':
          shared.push(...segments(path, name, raw, colourNames));
          break;
        case 'border':
          shared.push({ name, value: withColour(path, raw, colourNames, 'solid') });
          break;
        case 'shadow':
          shared.push({ name, value: withColour(path, raw, colourNames) });
          break;
        case 'radius':
          shared.push({ name, value: primary(path, raw.split(' — ')[0] ?? '') });
          break;
        case 'breakpoints':
          shared.push(...breakpoint(path, name, raw));
          break;
        default:
          shared.push({ name, value: raw });
      }
    }
  }
  return { light, dark, shared };
}

const block = (selector: string, decls: Decl[], indent = ''): string =>
  [
    `${indent}${selector} {`,
    ...decls.map(({ name, value }) => `${indent}  ${name}: ${value};`),
    `${indent}}`,
  ].join('\n');

/** The whole stylesheet, before formatting. */
export function generateTokensCss(tokens: Json): string {
  const { light, dark, shared } = readTokens(tokens);
  const scheme = (s: string): Decl => ({ name: 'color-scheme', value: s });
  return [
    '/* Generated by scripts/tokens.ts from design/tokens.json — do not edit; run `npm run tokens`.',
    '   Breakpoints cannot be used inside @media; write 767px / 768px / 1023px / 1024px there. */',
    '',
    block(':root', [scheme('light'), ...light, ...shared]),
    '',
    block("[data-theme='blueprint']", [scheme('dark'), ...dark]),
    '',
    '@media (prefers-color-scheme: dark) {',
    block(":root:not([data-theme='paper'])", [scheme('dark'), ...dark], '  '),
    '}',
    '',
  ].join('\n');
}

/** The file as written: generated from tokens.json, then Prettier-formatted so `format:check` passes. */
export async function buildTokensCss(): Promise<string> {
  const tokens = JSON.parse(readFileSync(TOKENS_JSON, 'utf8')) as Json;
  const config = await resolveConfig(TOKENS_CSS);
  return format(generateTokensCss(tokens), { ...config, filepath: TOKENS_CSS });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(TOKENS_CSS, await buildTokensCss());
  console.log(`tokens: wrote ${TOKENS_CSS}`);
}
