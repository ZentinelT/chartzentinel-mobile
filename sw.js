// Service worker de ChartZentinel móvil — generado por tools/build_mobile.py
// Shell cacheado (app, librería de charts, iconos); todo lo demás (Binance/
// Bybit/Hyperliquid, fuentes de Google) va a red con fallback a caché.
const CACHE = 'chartzentinel-20261116175052';
const SHELL = [
  './',
  'index.html',
  'vendor/lightweight-charts.standalone.production.js',
  'logo-unicorn.png',
  'logo-unicorn-icon.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // App shell (mismo origen): network-first para agarrar builds nuevos,
  // caché si no hay red.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('index.html')))
    );
    return;
  }

  // Terceros (APIs de mercado, fuentes): red directa; si falla y hay algo en
  // caché (p. ej. CSS de fuentes), se usa eso.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
