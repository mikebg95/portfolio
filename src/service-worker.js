// PR-63: the offline service worker. A template: `src/precache.ts` replaces `__MANIFEST__` with the
// build's manifest and writes the result to `dist/` (SERVICE_WORKER_PATH). Hand-written, no
// dependency. Every built page, stylesheet, script, font, icon and the CV are stored at install;
// hashed assets are served cache-first, everything else stale-while-revalidate; a page that is not
// stored and cannot be fetched gets the offline sheet in its language.
/* global __MANIFEST__ */

/** @type {{ version: string, cachePrefix: string, hashedPrefix: string, urls: string[], offline: [string, string][] }} */
const MANIFEST = __MANIFEST__;
const CACHE = `${MANIFEST.cachePrefix}${MANIFEST.version}`;
/** Static files: one response per URL, whatever the request's headers (a module script sends
 * `Origin`, the install did not, and a host's `Vary: Origin` would otherwise never match). */
const MATCH = { ignoreSearch: true, ignoreVary: true };

/** The key a URL is stored under: the built file's path, so `/experience`, `/experience/` and
 * `/experience/index.html` are one page. A path whose last segment has a dot is a file. */
function keyFor(url) {
  const path = url.pathname.replace(/\/index\.html$/, '/');
  const last = path.slice(path.lastIndexOf('/') + 1);
  return last === '' || last.includes('.') ? path : `${path}/`;
}

/** The offline sheet for a path: the longest language prefix it starts with. */
function offlinePageFor(path) {
  const match = MANIFEST.offline.find(
    ([prefix]) => path === prefix.slice(0, -1) || path.startsWith(prefix),
  );
  return match?.[1];
}

/** A response worth keeping: complete, ours and not a redirect (a redirected response must never
 * answer a navigation). */
function storable(response) {
  return (
    response.ok && response.status === 200 && response.type === 'basic' && !response.redirected
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(MANIFEST.urls.map((url) => new Request(url, { cache: 'reload' }))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(MANIFEST.cachePrefix) && name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, MATCH);
  if (cached) return cached;
  const response = await fetch(request);
  if (storable(response)) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, url) {
  const { request } = event;
  const key = keyFor(url);
  const cache = await caches.open(CACHE);
  const cached = await cache.match(key, MATCH);
  if (cached) {
    // Refresh from the stored file's own URL: the slash-less form may redirect on the host.
    event.waitUntil(
      fetch(key, { cache: 'no-cache' })
        .then((response) => (storable(response) ? cache.put(key, response) : undefined))
        .catch(() => undefined),
    );
    return cached;
  }
  try {
    const response = await fetch(request);
    if (storable(response)) event.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch (error) {
    const offline = request.mode === 'navigate' ? offlinePageFor(url.pathname) : undefined;
    const page = offline && (await cache.match(offline, MATCH));
    if (page) return page;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    url.pathname.startsWith(MANIFEST.hashedPrefix)
      ? cacheFirst(request)
      : staleWhileRevalidate(event, url),
  );
});
