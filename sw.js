// THE FLUSH FACTOR — service worker (offline spelen als PWA).
// Alle paden zijn relatief, zodat het ook werkt in een submap (GitHub Pages: /the-flush-factor/).
// Strategie: code en pagina's netwerk-eerst (altijd de nieuwste versie als je online bent, cache als
// reserve); modellen, textures en iconen cache-eerst. De pagina wordt nooit vanuit hier herladen.

// PRECACHE:START (gegenereerd door tools/build-sw.mjs)
const VERSION = '63fa71595c';
const PRECACHE = [
  './',
  'assets/hdri/bathroom_512.hdr',
  'assets/icons/app/icon-192.png',
  'assets/icons/app/icon-512.png',
  'assets/icons/app/icon-maskable-512.png',
  'assets/icons/sprite.svg',
  'assets/models/buckets/wooden_bucket.glb',
  'assets/models/toilet.glb',
  'assets/textures/Tiles101_color.webp',
  'assets/textures/Tiles101_normal.webp',
  'assets/textures/Tiles101_roughness.webp',
  'assets/textures/WoodFloor041_color.webp',
  'assets/textures/WoodFloor041_normal.webp',
  'assets/textures/WoodFloor041_roughness.webp',
  'css/animations.css',
  'css/style.css',
  'index.html',
  'js/boot.js',
  'js/clog.js',
  'js/data/buckets.js',
  'js/data/clog-props.js',
  'js/data/config.js',
  'js/data/cosmetics.js',
  'js/data/credits.js',
  'js/data/icon-credits.js',
  'js/data/levels.js',
  'js/data/packages.js',
  'js/data/room.js',
  'js/data/shop.js',
  'js/data/texts.js',
  'js/data/tools.js',
  'js/events.js',
  'js/game.js',
  'js/inventory.js',
  'js/phone-preview.js',
  'js/purchases.js',
  'js/renderer3d.js',
  'js/shop.js',
  'js/state.js',
  'js/three/bucket.js',
  'js/three/camera.js',
  'js/three/context.js',
  'js/three/decor.js',
  'js/three/effects.js',
  'js/three/patterns.js',
  'js/three/props.js',
  'js/three/room.js',
  'js/three/toilet.js',
  'js/three/water.js',
  'js/ui/chaos.js',
  'js/ui/hud.js',
  'js/ui/icons.js',
  'js/utils/BufferGeometryUtils.js',
  'js/vendor/GLTFLoader.js',
  'js/vendor/RGBELoader.js',
  'js/vendor/three.module.min.js',
  'manifest.json',
];
// PRECACHE:END

const CACHE = `flushfactor-${VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('flushfactor-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAsset = url => /\/assets\/|\/js\/vendor\//.test(url.pathname);

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(isAsset(url) ? cacheFirst(request) : networkFirst(request));
});
