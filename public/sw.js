/* Capstone Quarry service worker — hand-written, no build step.
 *
 * What it does, and deliberately does not do:
 *   - Pre-caches the offline page and the manifest on install.
 *   - Never touches anything that is not a same-origin GET: Supabase auth,
 *     REST and realtime pass straight through, as do POSTs.
 *   - RSC payload requests (the `RSC` header Next sends on client navigation)
 *     are network-only; caching them would serve a stale flight payload into a
 *     live React tree.
 *   - `/_next/static` is content-hashed, so cache-first is safe forever.
 *   - Page navigations are network-first with a short timeout, then the cached
 *     copy of that page, then `/offline`.
 *   - Everything else same-origin (icons, fonts, manifest) is
 *     stale-while-revalidate.
 *   - A `{type:'clear'}` message deletes every cache. Sign-out posts it so a
 *     shared classroom machine does not keep the previous student's pages.
 */
const VERSION = 'quarry-v1';
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URL = '/offline';
const NAV_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([OFFLINE_URL, '/manifest.webmanifest']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'clear') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const shell = await caches.open(SHELL);
    return (await shell.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  if (url.pathname === '/sw.js') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
