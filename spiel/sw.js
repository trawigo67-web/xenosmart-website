/* Buko Games – offline cache (network-first, cache fallback) */
const C='buko-v42';
const BASE=['./','index.html','offline-files.json','manifest.webmanifest','icon-192.png','buko-core.js','buko-ui.js','buko.svg','buko.webp','buko-mini.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(BASE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('buko-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin||r.headers.has('range'))return;
  e.respondWith(fetch(r).then(res=>{if(res.ok&&res.status===200){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
   .catch(()=>caches.open(C).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?c.match(new URL(r.url).pathname.endsWith('/')?r.url+'index.html':r.url,{ignoreSearch:true}).then(m2=>m2||c.match('index.html')):undefined)))));
});
