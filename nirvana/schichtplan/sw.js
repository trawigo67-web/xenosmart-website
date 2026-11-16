// NIRVANA Schichtplan – hält die App bereit, damit sie auch bei schwachem Netz sofort aufgeht.
// Die Plandaten liegen nur im Gerät (IndexedDB) und kommen nie in diesen Zwischenspeicher.
const V = 'nirvana-schichtplan-a09d48f9ba';
const SHELL = ['./', 'app.js?v=a09d48f9ba', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k.startsWith('nirvana-schichtplan')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // Nur die App-Hülle zwischenspeichern – nie Antworten der Team-Datenbank (persönliche Daten)
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/schichtplan-api/') || e.request.headers.has('Authorization')) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match(e.request, { ignoreSearch: true })).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
