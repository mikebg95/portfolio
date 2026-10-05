// Every route in SPEC §4, in both languages: English at `/`, Dutch under `/nl/` (SPEC §1.4).
export const PAGES = [
  '/',
  '/experience/',
  '/projects/',
  '/projects/jamigos/',
  '/projects/subscription-tracker/',
  '/projects/recipe-book/',
  '/projects/journal/',
  '/projects/scentify/',
  '/certifications/',
  '/education/',
];

export const ROUTES = PAGES.flatMap((path) => [
  { path, lang: 'en' },
  { path: path === '/' ? '/nl/' : `/nl${path}`, lang: 'nl' },
]);
