/* Buko Games – offline cache (network-first, cache fallback) */
const C='buko-v3d';
const CORE=['./','index.html','disfirlat.html','blok.html','batak.html','tavla.html','mechablock.html','mb-bg-portrait.jpg','fonts/orbitron-900.woff2','fonts/russo-one-latin.woff2','fonts/russo-one-latin-ext.woff2','buko-core.js','logo.svg','icon-192.png','icon-512.png','manifest.webmanifest','music-gears.mp3','music-block.mp3','music-kahve1.mp3','music-kahve2.mp3','lb.js','1453/','zipzip/'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if (r.method!=='GET' || new URL(r.url).origin!==location.origin || r.headers.has('range')) return;
  e.respondWith(fetch(r).then(res=>{ if(res.ok && res.status===200){ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));
});
