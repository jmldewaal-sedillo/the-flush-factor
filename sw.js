// ============================================================
// THE FLUSH FACTOR — sw.js
// Service Worker: offline caching voor PWA/TWA.
// ============================================================

const CACHE = 'flushfactor-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/animations.css',
  '/js/game.js',
  '/js/clog.js',
  '/js/inventory.js',
  '/js/shop.js',
  '/js/items.js',
  '/js/phone-preview.js',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
