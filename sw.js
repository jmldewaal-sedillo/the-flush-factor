// ============================================================
// THE FLUSH FACTOR — sw.js
// Service Worker: offline caching voor PWA/TWA.
// VERSIE: flushfactor-v7
// ============================================================

const CACHE = 'flushfactor-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/animations.css',
  '/js/game.js',
  '/js/renderer3d.js',
  '/js/clog.js',
  '/js/inventory.js',
  '/js/shop.js',
  '/js/items.js',
  '/js/phone-preview.js',
  '/js/vendor/three.module.min.js',
  '/js/vendor/RGBELoader.js',
  '/js/vendor/OrbitControls.js',
  '/js/vendor/GLTFLoader.js',
  '/js/vendor/DRACOLoader.js',
  '/js/utils/BufferGeometryUtils.js',
  '/assets/models/toilet.glb',
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
    ).then(() => {
      // Stuur bericht aan alle clients om te herladen na cache-update
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
