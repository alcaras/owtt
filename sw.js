// Old World Tech Tree — service worker.
// Cache-first for shell assets, network-first for tech-data.js so data updates flow.
// Bump CACHE_VERSION on every deploy if you want to force-refresh; otherwise the
// new SW replaces the old one when its bytes change (the version line below is
// auto-tagged with the build's tech-data hash to make that easy).
const CACHE_VERSION = 'owtt-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './phone.html',
  './tree-app.js',
  './tree-styles.css',
  './phone-app.js',
  './manifest.webmanifest',
  './img/app-icon.svg',
  './img/app-icon-192.png',
  './img/app-icon-512.png',
  './img/icons/yields/science.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Don't fail install if individual assets 404 (e.g. a renamed icon)
    await Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle same-origin GETs
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // tech-data.js: network-first so a regen reaches users; fallback to cache offline.
  if (url.pathname.endsWith('/tech-data.js')){
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request);
        const cache = await caches.open(DATA_CACHE);
        cache.put(e.request, fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match(e.request);
        return cached || new Response('// offline\n', { headers: { 'Content-Type': 'application/javascript' } });
      }
    })());
    return;
  }

  // Everything else: cache-first; populate the cache on miss.
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const fresh = await fetch(e.request);
      if (fresh.ok){
        const cache = await caches.open(SHELL_CACHE);
        cache.put(e.request, fresh.clone());
      }
      return fresh;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
