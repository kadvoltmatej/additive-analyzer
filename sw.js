const CACHE = 'additive-analyzer-v1';
const URLS  = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js',
  'https://unpkg.com/tesseract.js-core@5/tesseract-core-simd.wasm',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache what we can; ignore failures (e.g. opaque WASM)
      return Promise.allSettled(URLS.map(url =>
        c.add(url).catch(() => null)
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for Tesseract language data (large, versioned)
  // Cache-first for everything else
  const isTesseractLang = e.request.url.includes('tessdata') ||
                          e.request.url.includes('traineddata');
  if (isTesseractLang) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(r => {
          if (r && r.status === 200 && r.type !== 'opaque') {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        }).catch(() => cached);
      })
    );
  }
});
