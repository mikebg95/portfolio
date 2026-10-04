import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CV_PATH, ICONS, OG_IMAGE_DIR, SCENTIFY_DEMO, SERVICE_WORKER_PATH } from './config';
import {
  isPrecached,
  offlinePages,
  precacheManifest,
  serviceWorkerSource,
  urlFor,
  type Precache,
} from './precache';

describe('urlFor', () => {
  it('stores a page as its directory URL and any other file as itself', () => {
    expect(urlFor('index.html')).toBe('/');
    expect(urlFor(join('nl', 'experience', 'index.html'))).toBe('/nl/experience/');
    expect(urlFor('404.html')).toBe('/404.html');
    expect(urlFor(join('_astro', 'base.abc123.css'))).toBe('/_astro/base.abc123.css');
  });
});

describe('isPrecached', () => {
  it('takes every page, stylesheet, script, font, icon and the CV', () => {
    for (const url of [
      '/',
      '/nl/projects/scentify/',
      '/404.html',
      '/_astro/base.abc123.css',
      '/_astro/gsap.def456.js',
      '/fonts/archivo-latin-wdth-normal.woff2',
      CV_PATH,
      ...Object.values(ICONS),
    ]) {
      expect(isPrecached(url), url).toBe(true);
    }
  });

  it('leaves out the social cards, crawler files, project media, the specimens and itself', () => {
    for (const url of [
      `${OG_IMAGE_DIR}/en/index.png`,
      '/sitemap.xml',
      '/robots.txt',
      '/CNAME',
      SCENTIFY_DEMO.animated,
      '/_primitives/',
      SERVICE_WORKER_PATH,
    ]) {
      expect(isPrecached(url), url).toBe(false);
    }
  });
});

describe('precacheManifest', () => {
  let dist: string;
  const put = (file: string, body: string) => {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), body);
  };

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'precache-'));
    put('index.html', '<h1>sheet 01</h1>');
    put('experience/index.html', '<h1>sheet 02</h1>');
    put('_astro/base.abc.css', 'body{}');
    put('og/en/index.png', 'png');
    put('robots.txt', 'User-agent: *');
  });

  afterEach(() => rmSync(dist, { recursive: true, force: true }));

  it('lists the stored files by URL with their size, and their total', () => {
    const { entries, bytes } = precacheManifest(dist);
    expect(entries.map((e) => e.url)).toEqual(['/', '/_astro/base.abc.css', '/experience/']);
    expect(entries.map((e) => e.bytes)).toEqual([17, 6, 17]);
    expect(bytes).toBe(40);
  });

  it('gets a new version when a stored file changes, and only then', () => {
    const before = precacheManifest(dist).version;
    put('robots.txt', 'Disallow:');
    expect(precacheManifest(dist).version).toBe(before);
    put('experience/index.html', '<h1>sheet 02, rev 2</h1>');
    expect(precacheManifest(dist).version).not.toBe(before);
  });
});

describe('offlinePages', () => {
  it('names each language’s offline sheet, the longest prefix first', () => {
    expect(offlinePages()).toEqual([
      ['/nl/', '/nl/offline/'],
      ['/', '/offline/'],
    ]);
  });
});

describe('serviceWorkerSource', () => {
  const precache: Precache = {
    entries: [{ url: '/$&/', bytes: 1, hash: 'h' }],
    bytes: 1,
    version: 'v1',
  };

  it('fills the template’s manifest line, verbatim', () => {
    const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
    const source = serviceWorkerSource(template, precache);
    const line = source.split('\n').find((l) => l.startsWith('const MANIFEST = '));
    const manifest = JSON.parse(line!.slice('const MANIFEST = '.length, -1)) as {
      version: string;
      urls: string[];
    };
    expect(manifest.version).toBe('v1');
    expect(manifest.urls).toEqual(['/$&/']);
  });

  it('fails the build when the template lost its slot', () => {
    expect(() =>
      serviceWorkerSource('self.addEventListener("fetch", () => {});', precache),
    ).toThrow(/manifest slot/);
  });
});
