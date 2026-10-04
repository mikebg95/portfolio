import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The generated tokens.css read at build time, for code that draws or measures outside CSS (the
// Open Graph cards, the display heading fit). Read from disk: Vitest hands `?raw` CSS imports over
// empty.

/** The paper theme's custom properties, read from the generated tokens.css `:root` block. */
export function paperTokens(css: string): (name: string) => string {
  const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const values = new Map([...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!]));
  return (name) => {
    const value = values.get(name);
    if (value === undefined) throw new Error(`tokens.css has no --${name}`);
    return value.trim();
  };
}

/** A token's value, `--size-display-xl` → `token('size-display-xl')`. */
export const token = paperTokens(
  readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8'),
);
/** `24px` → 24, `850` → 850, `118%` → 118, `-0.03em` → -0.03. */
export const tokenNumber = (name: string) => parseFloat(token(name));
