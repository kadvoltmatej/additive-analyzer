const CACHE_NAME = 'additive-analyzer-v1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
    ))
  );
  self.createNamespaces?.[self.clients.claim()] : self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
