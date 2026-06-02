// Old World Tech Tree — service worker.
// Network-first for the app shell so deploys reach users without a manual cache
// bump; cache is fallback for offline. tech-data.js is also network-first.
// CACHE_VERSION is still bumped per deploy to evict stale precaches cleanly.
const CACHE_VERSION = 'owtt-v8';
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
  './fonts/inter.woff2',
  './fonts/cormorant-garamond.woff2',
  './fonts/jetbrains-mono.woff2',
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

// Network-first for HTML / JS / CSS / the manifest, so a deploy reaches users
// without manual hard-refresh. Cache is the offline fallback only. Static
// assets like icons stay cache-first because they rarely change.
function isShellRequest(url){
  const p = url.pathname;
  return p.endsWith('.html') || p.endsWith('/') ||
         p.endsWith('.js') || p.endsWith('.css') ||
         p.endsWith('.webmanifest');
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (isShellRequest(url)){
    const cacheName = url.pathname.endsWith('/tech-data.js') ? DATA_CACHE : SHELL_CACHE;
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        if (fresh.ok){
          const cache = await caches.open(cacheName);
          cache.put(e.request, fresh.clone());
        }
        return fresh;
      } catch (_) {
        const cached = await caches.match(e.request);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Static assets (icons, images): cache-first.
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
