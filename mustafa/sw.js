// Günlük – hält die App auch ohne Netz bereit und zeigt die Erinnerungen an
const V = 'gunluk-v2';
const SHELL = ['./', 'app.css?v=2', 'config.js?v=2', 'app.js?v=2', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  'fonts/anton-latin.woff2', 'fonts/anton-latin-ext.woff2', 'fonts/instrument-sans-latin.woff2', 'fonts/instrument-sans-latin-ext.woff2'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k.indexOf('gunluk-') === 0).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Erst aus dem Zwischenspeicher antworten (schnell, auch ohne Netz), im Hintergrund die neue Fassung holen
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/server/') >= 0) return;
  const nav = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const hit = nav ? await cache.match('./') : await cache.match(req);
    const net = fetch(nav ? u.origin + u.pathname : req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((r) => { if (r && r.ok && r.type === 'basic') cache.put(nav ? './' : req, r.clone()); return r; })
      .catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Günlük: internet yok.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  })());
});

self.addEventListener('push', (e) => {
  let d = null; try { d = e.data ? e.data.json() : null; } catch (x) { d = null; }
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cl.forEach((c) => c.postMessage({ type: 'push' }));
    await self.registration.showNotification((d && d.title) || 'Günlük', {
      body: (d && d.body) || 'Yaklaşan bir kaydın var.', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
      tag: (d && d.tag) || 'gunluk', renotify: true, data: { url: (d && d.url) || './' },
    });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cl) { if ('focus' in c) { c.postMessage({ type: 'open', url }); return c.focus(); } }
    return self.clients.openWindow(url);
  })());
});
