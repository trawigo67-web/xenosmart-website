// Leonn Reservierungen – hält die App-Hülle bereit und zeigt Mitteilungen bei neuen Anfragen
const V = 'leonn-admin-v2';
const SHELL = ['./', 'admin.css', 'admin.js', 'manifest.webmanifest', 'icon-192.png', '../fonts.css', '../config.js', '../img/logo.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k.startsWith('leonn-admin')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return; // Daten nie aus dem Zwischenspeicher
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./'))));
});
self.addEventListener('push', (e) => {
  let d = null; try { d = e.data ? e.data.json() : null; } catch (x) { d = null; }
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cl.forEach((c) => c.postMessage('leonn-new'));
    try { if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(); } catch (x) {}
    await self.registration.showNotification((d && d.title) || 'Leonn Reservierungen', { body: (d && d.body) || 'Neue Anfrage oder Änderung · Yeni talep veya değişiklik', icon: 'icon-192.png', badge: 'icon-192.png', tag: (d && d.tag) || 'leonn-new', renotify: true });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cl) { if ('focus' in c) { c.postMessage('leonn-new'); return c.focus(); } }
    return self.clients.openWindow('./');
  })());
});
