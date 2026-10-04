import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

// design/motion.md principle 2: only cheap properties move — never layout. Reads every stylesheet
// and every component's <style> under src/ and lists each keyframe or transition that names a
// layout-affecting property (or `all`, which includes them).
const SRC = new URL('../../src', import.meta.url).pathname;
const LAYOUT =
  /^(?:(?:min|max)-)?(?:width|height|(?:inline|block)-size)$|^(?:top|right|bottom|left)$|^inset(?:-|$)|^margin|^padding|^border(?:-[a-z]+)*-width$|^border(?:-(?:top|right|bottom|left))?$|^font-size$|^line-height$|^letter-spacing$|^(?:row-|column-)?gap$|^flex|^grid|^all$/;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(?:css|astro)$/.test(entry.name) ? [path] : [];
  });
}

/** The CSS of a file: the whole of a .css, the <style> blocks of an .astro; comments removed. */
function cssOf(path: string): string {
  const text = readFileSync(path, 'utf8');
  const css = path.endsWith('.css')
    ? text
    : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The text between the brace that opens at `start` and its match. */
function block(css: string, start: number): string {
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(start + 1, i);
  }
  return css.slice(start + 1);
}

/** Splits on commas outside parentheses. */
function topLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += char;
  }
  return [...parts, current];
}

/** Every animated property in `css`, as "keyframes name: prop" or "transition: prop". */
function animatedProperties(css: string): string[] {
  const found: string[] = [];
  for (const match of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    const body = block(css, (match.index ?? 0) + match[0].length - 1);
    for (const [, prop] of body.matchAll(/([a-z-]+)\s*:/g)) {
      found.push(`@keyframes ${match[1]}: ${prop}`);
    }
  }
  for (const [, prop, value] of css.matchAll(
    /(?:^|[;{\s])(transition(?:-property)?)\s*:([^;}]*)/g,
  )) {
    const names =
      prop === 'transition-property'
        ? topLevel(value!)
        : topLevel(value!).map((part) => part.trim().split(/\s+/)[0] ?? '');
    for (const name of names) found.push(`transition: ${name.trim()}`);
  }
  return found;
}

describe('animated properties (motion.md principle 2)', () => {
  it('finds keyframe and transition properties', () => {
    const css = `@keyframes a { from { opacity: 0; width: 0 } 50% { transform: none } }
      .x { transition: transform 1s, top 2s ease; } .y { transition-property: left, opacity }`;
    expect(animatedProperties(css)).toEqual([
      '@keyframes a: opacity',
      '@keyframes a: width',
      '@keyframes a: transform',
      'transition: transform',
      'transition: top',
      'transition: left',
      'transition: opacity',
    ]);
  });

  it.each(files(SRC).map((path) => [relative(SRC, path), path]))(
    '%s animates no layout property',
    (_, path) => {
      const layout = animatedProperties(cssOf(path!)).filter((entry) =>
        LAYOUT.test(entry.slice(entry.lastIndexOf(':') + 1).trim()),
      );
      expect(layout).toEqual([]);
    },
  );
});
