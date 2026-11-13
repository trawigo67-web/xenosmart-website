const V = "ceyrekmatik-v24";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png", "logo.png", "lockup.png", "tema.js", "config.json", "price.json", "impressum.html", "fonts/fonts.css", "urun/ziynet.webp", "urun/resat.webp", "urun/burma.webp", "urun/ajda.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Netz zuerst (immer aktuell), Cache nur wenn offline
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: true})));
});
