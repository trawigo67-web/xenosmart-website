// Leonn Catering – hält die App-Hülle bereit, damit die Seite auch bei schwachem Netz sofort aufgeht
const V = 'leonn-catering-v2';
const SHELL = ['./', 'catering.css', 'app.js', 'core.js', 'manifest.webmanifest', '../fonts.css', '../config.js', '../img/logo.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k.startsWith('leonn-catering')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return; // Daten nie aus dem Zwischenspeicher
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
