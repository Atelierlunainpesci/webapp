// Service worker minimo: rete prima (sempre rivalidata), cache solo come ripiego offline. Serve per l'installazione come app.
const V = 'luna-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' })
    .then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
