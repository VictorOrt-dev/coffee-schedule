/* Coffee & Schedule — Service Worker
 * - Pré-cache de l'app (fonctionne 100 % hors-ligne)
 * - Navigation : réseau d'abord (mises à jour rapides), cache en secours
 * - Ressources : stale-while-revalidate
 * __BUILD__ est remplacé par le SHA du commit lors du déploiement GitHub Actions.
 */
const VERSION = 'cs-1.5.0-__BUILD__';
const CACHE = `coffee-schedule-${VERSION}`;

const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/time.js',
  'js/store.js',
  'js/share.js',
  'js/seasons.js',
  'js/mascot.js',
  'js/holidays.js',
  'js/calendar.js',
  'vendor/html2canvas.min.js',
  'fonts/nunito.woff2',
  'fonts/fredoka.woff2',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('coffee-schedule-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request, event));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put('index.html', response.clone());
    return response;
  } catch {
    return (await cache.match('index.html')) || (await cache.match('./')) || Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}
