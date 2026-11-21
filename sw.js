// Cache only as an offline fallback while always prioritizing network responses.
const cacheVersion = 'luna-v4';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(cacheNames => Promise.all(cacheNames.filter(cacheName => cacheName !== cacheVersion).map(cacheName => caches.delete(cacheName)))).then(() => clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(fetch(event.request, { cache: 'no-cache' })
    .then(response => { if (response.ok) { const cacheResponse = response.clone(); caches.open(cacheVersion).then(cache => cache.put(event.request, cacheResponse)); } return response; })
    .catch(() => caches.match(event.request).then(response => response || caches.match('./index.html'))));
});
