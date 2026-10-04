// PR-63: what the service worker stores at install, read from the built `dist/`, and the Astro
// integration that writes the worker (src/service-worker.js + this manifest) into the build.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';

import {
  CV_PATH,
  ICONS,
  OFFLINE_PATH,
  PRECACHE_LIMIT_BYTES,
  PRIMITIVES_PATH,
  SERVICE_WORKER_PATH,
} from './config';
import { DEFAULT_LANG, LANGS, localize } from './i18n/paths';

/** Astro's content-hashed build output: never changes under the same name, so cache-first. */
export const HASHED_PREFIX = '/_astro/';
const CACHE_PREFIX = 'sheets-';
/** The template's one line the build fills in (its `global` comment names the slot too). */
const MANIFEST_SLOT = 'const MANIFEST = __MANIFEST__;';

export interface PrecacheEntry {
  /** The URL the worker fetches and stores it under (a page as its directory, `/experience/`). */
  url: string;
  bytes: number;
  /** sha256 of the file, shortened. */
  hash: string;
}

export interface Precache {
  entries: PrecacheEntry[];
  bytes: number;
  /** Changes whenever any stored file does: the cache's name, so a deploy replaces the cache. */
  version: string;
}

/** Every built page, stylesheet, script and font, the icons and the CV — not the Open Graph cards,
 * the sitemap or the project media (the worker stores those when they are first fetched). */
export function isPrecached(url: string): boolean {
  if (url === SERVICE_WORKER_PATH || url.startsWith(`${PRIMITIVES_PATH}/`)) return false;
  if (url.endsWith('/') || url.endsWith('.html')) return true;
  if (url === CV_PATH || (Object.values(ICONS) as string[]).includes(url)) return true;
  return /\.(css|js|woff2)$/.test(url);
}

/** A file under `dist/` as the URL the worker stores it under: `x/index.html` → `/x/`. */
export function urlFor(file: string): string {
  return `/${file.split(sep).join('/')}`.replace(/(^|\/)index\.html$/, '$1');
}

const shortHash = (data: string | Buffer) =>
  createHash('sha256').update(data).digest('hex').slice(0, 16);

/** The precache manifest of a built `dist/` directory, sorted by URL. */
export function precacheManifest(distDir: string): Precache {
  const entries = readdirSync(distDir, { recursive: true, withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => {
      const path = join(dirent.parentPath, dirent.name);
      return { path, url: urlFor(path.slice(distDir.length).replace(/^[\\/]/, '')) };
    })
    .filter(({ url }) => isPrecached(url))
    .map(({ path, url }) => {
      const data = readFileSync(path);
      return { url, bytes: data.length, hash: shortHash(data) };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
  return {
    entries,
    bytes: entries.reduce((sum, e) => sum + e.bytes, 0),
    version: shortHash(entries.map((e) => `${e.url} ${e.hash}`).join('\n')),
  };
}

/** The offline sheet per language, longest path prefix first, as the worker picks them. */
export function offlinePages(): [string, string][] {
  return LANGS.map((lang): [string, string] => [
    lang === DEFAULT_LANG ? '/' : `${localize(lang, '/')}/`.replace(/\/+$/, '/'),
    `${localize(lang, OFFLINE_PATH)}/`,
  ]).sort(([a], [b]) => b.length - a.length);
}

/** The worker's source with the manifest filled in. */
export function serviceWorkerSource(template: string, precache: Precache): string {
  const manifest = {
    version: precache.version,
    cachePrefix: CACHE_PREFIX,
    hashedPrefix: HASHED_PREFIX,
    urls: precache.entries.map((e) => e.url),
    offline: offlinePages(),
  };
  if (!template.includes(MANIFEST_SLOT)) throw new Error('service worker: no manifest slot');
  return template.replace(MANIFEST_SLOT, () => `const MANIFEST = ${JSON.stringify(manifest)};`);
}

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** Writes `dist/sw.js` after the build; fails the build when the precache passes the limit. */
export function serviceWorker(): AstroIntegration {
  let root: URL;
  return {
    name: 'service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:build:done': ({ dir, logger }) => {
        const distDir = fileURLToPath(dir).replace(/[\\/]$/, '');
        const precache = precacheManifest(distDir);
        logger.info(
          `precache: ${precache.entries.length} files, ${megabytes(precache.bytes)} (limit ${megabytes(PRECACHE_LIMIT_BYTES)})`,
        );
        if (precache.bytes > PRECACHE_LIMIT_BYTES) {
          throw new Error(
            `service worker: the precache is ${megabytes(precache.bytes)}, over the ${megabytes(PRECACHE_LIMIT_BYTES)} limit`,
          );
        }
        const template = readFileSync(new URL('src/service-worker.js', root), 'utf8');
        writeFileSync(join(distDir, SERVICE_WORKER_PATH), serviceWorkerSource(template, precache));
      },
    },
  };
}
