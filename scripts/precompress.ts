/**
 * Writes a `.gz` and a `.br` twin next to every text file in a built site, for nginx's
 * `gzip_static` / `brotli_static` (the Docker image, `Dockerfile`). Run after `astro build`:
 * `node scripts/precompress.ts dist`. A twin that would not be smaller is not written, so nginx
 * serves the original. GitHub Pages compresses on its own; this runs in the image only.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

/** Extensions worth compressing; images, fonts (woff2) and the PDF are compressed already. */
const TEXT = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.svg',
  '.xml',
  '.txt',
  '.json',
  '.webmanifest',
  '.ico',
]);

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}

function precompress(root: string): number {
  let written = 0;
  for (const path of files(root)) {
    if (!TEXT.has(extname(path))) continue;
    const data = readFileSync(path);
    const twins: [string, Buffer][] = [
      ['.gz', gzipSync(data, { level: 9 })],
      [
        '.br',
        brotliCompressSync(data, {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
            [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
          },
        }),
      ],
    ];
    for (const [suffix, packed] of twins) {
      if (packed.length >= data.length) continue;
      writeFileSync(path + suffix, packed);
      written++;
    }
  }
  return written;
}

const root = process.argv[2];
if (!root) throw new Error('usage: node scripts/precompress.ts <dir>');
console.log(`precompress: ${precompress(root)} files written under ${root}`);
