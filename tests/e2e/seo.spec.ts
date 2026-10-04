import { readdirSync, readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

import { PERSON_ADDRESS, PRIMITIVES_PATH, SITE_URL, SITEMAP_PATH } from '../../src/config';
import { OG_HEIGHT, OG_WIDTH, ogImagePath } from '../../src/og';

// PR-37, SPEC §3.8: every built page's head — title and description (EN from design/copy.md's SEO
// table, NL from the content), canonical, hreflang en/nl/x-default, Open Graph text — plus the
// sitemap, robots.txt and the JSON-LD Person on Sheet 01. PR-38: every built page's Open Graph
// image exists and is 1200×630. The head is the same at every viewport,
// so this runs in one project.
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'head only');

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const yaml = <T>(path: string) => load(read(path)) as T;

type Seo = Record<string, { title: string; description?: string }>;
type Project = { slug: string; title: string; summary: string };

/** copy.md's SEO table: page → [title, description]. */
const copyTable = new Map(
  read('design/copy.md')
    .split('## SEO')[1]!
    .split('\n## ')[0]!
    .split('\n')
    .filter((l) => l.startsWith('| /'))
    .map((l) => {
      const [page, title, description] = l
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      return [page!, { title: title!, description: description! }];
    }),
);

const projects = (lang: string): Project[] =>
  readdirSync(new URL(`../../src/content/projects/${lang}/`, import.meta.url))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => yaml<Project>(`src/content/projects/${lang}/${f}`));

const SHEETS = {
  overview: '/',
  experience: '/experience',
  projects: '/projects',
  certifications: '/certifications',
  education: '/education',
} as const;

interface Page {
  lang: 'en' | 'nl';
  /** Language-neutral path. */
  path: string;
  title: string;
  description: string;
}

const enProject = copyTable.get('/projects/<slug>')!;
const EN: Page[] = [
  ...Object.values(SHEETS).map((path) => ({ lang: 'en' as const, path, ...copyTable.get(path)! })),
  ...projects('en').map((p) => ({
    lang: 'en' as const,
    path: `/projects/${p.slug}`,
    title: enProject.title.replace('<Title>', p.title),
    description: enProject.description.replace('<project summary>', p.summary),
  })),
];
const nlSeo = yaml<{ seo: Seo }>('src/content/ui/nl/ui.yaml').seo;
const NL: Page[] = [
  ...Object.entries(SHEETS).map(([key, path]) => ({
    lang: 'nl' as const,
    path,
    title: nlSeo[key]!.title,
    description: nlSeo[key]!.description!,
  })),
  ...projects('nl').map((p) => ({
    lang: 'nl' as const,
    path: `/projects/${p.slug}`,
    title: nlSeo.project!.title.replace('{title}', p.title),
    description: p.summary,
  })),
];

const url = (lang: string, path: string) =>
  new URL(lang === 'en' ? path : path === '/' ? '/nl/' : `/nl${path}`, SITE_URL).href;

test('copy.md SEO table covers every sheet', () => {
  for (const path of Object.values(SHEETS)) expect(copyTable.get(path)?.description).toBeTruthy();
  expect(EN.length).toBe(10);
  expect(NL.length).toBe(10);
});

for (const { lang, path, title, description } of [...EN, ...NL]) {
  const own = url(lang, path);
  test(`${own} has its SEO head`, async ({ page }) => {
    await page.goto(new URL(own).pathname);
    const head = page.locator('head');
    await expect(page).toHaveTitle(title);
    await expect(head.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', own);
    const alternates = await head
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]),
      );
    expect(alternates).toEqual([
      ['en', url('en', path)],
      ['nl', url('nl', path)],
      ['x-default', url('en', path)],
    ]);
    await expect(head.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(head.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      description,
    );
    await expect(head.locator('meta[property="og:url"]')).toHaveAttribute('content', own);
    const image = new URL(ogImagePath(lang, path), SITE_URL).href;
    await expect(head.locator('meta[property="og:image"]')).toHaveAttribute('content', image);
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image);
    await expect(head.locator('meta[name="robots"]')).toHaveCount(0);
    const jsonLd = head.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(path === '/' ? 1 : 0);
  });
}

test('the JSON-LD Person on / gives name, job title and profiles, and no phone or street', async ({
  page,
}) => {
  await page.goto('/');
  const text = await page.locator('head script[type="application/ld+json"]').textContent();
  const profile = yaml<{ contact: { linkedin: string; github: string } }>(
    'src/content/profile/en/profile.yaml',
  );
  expect(JSON.parse(text!)).toEqual({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Michael Goldman',
    jobTitle: 'Java software engineer',
    url: `${SITE_URL}/`,
    sameAs: [profile.contact.linkedin, profile.contact.github],
    address: {
      '@type': 'PostalAddress',
      addressLocality: PERSON_ADDRESS.locality,
      addressCountry: PERSON_ADDRESS.country,
    },
  });
  expect(text).not.toMatch(/telephone|streetAddress|postalCode|\+31|06[- ]?\d/);
});

for (const path of ['/no-such-sheet', '/nl/404']) {
  test(`${path} is not indexed and claims no canonical`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(copyTable.get('/404')!.title);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('head link[rel="alternate"]')).toHaveCount(0);
  });
}

test('sitemap.xml lists every page in both languages, and nothing else', async ({ request }) => {
  const response = await request.get(SITEMAP_PATH);
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = [...EN, ...NL].map((p) => url(p.lang, p.path));
  expect(locs.toSorted()).toEqual(expected.toSorted());
  expect(xml).not.toContain(PRIMITIVES_PATH);
  expect(xml).not.toContain('404');
  // Each <url> lists its en, nl and x-default alternates.
  expect(xml.match(/hreflang="x-default"/g)).toHaveLength(expected.length);
});

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('User-agent: *');
  expect(text).not.toMatch(/Disallow: \/\s*$/m);
  expect(text).toContain(`Sitemap: ${SITE_URL}${SITEMAP_PATH}`);
});

/** Every HTML file of the build, as the path it is served at. */
const builtPages = (dir = new URL('../../dist/', import.meta.url).pathname): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.html'))
    .map((f) => `/${f.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')}`)
    .filter((p) => !p.startsWith(PRIMITIVES_PATH));

test('every built page has an Open Graph image: an existing 1200×630 PNG', async ({ request }) => {
  const pages = builtPages();
  // 20 sheets and project details, plus the two 404 sheets.
  expect(pages.length).toBe(EN.length + NL.length + 2);
  for (const page of pages) {
    const html = await (await request.get(page)).text();
    const image = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
    expect(image, page).toBeTruthy();
    expect(new URL(image!).origin, page).toBe(SITE_URL);
    const response = await request.get(new URL(image!).pathname);
    expect(response.status(), image).toBe(200);
    expect(response.headers()['content-type'], image).toBe('image/png');
    const png = await response.body();
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }, image).toEqual({
      width: OG_WIDTH,
      height: OG_HEIGHT,
    });
  }
});
