// marka22.de (Cloudflare Pages): leitet /api/* an die Bestell-API weiter,
// damit die Sipariş-App dort ohne CORS-Freigabe läuft.
// Auf xenosmart.de (GitHub Pages) wird diese Datei nicht ausgeführt.
const ZIEL = "https://marka-siparis-api.pages.dev";
export async function onRequest({ request }) {
  const u = new URL(request.url);
  const h = new Headers(request.headers);
  h.delete("host");
  h.set("Origin", "https://xenosmart.de");
  const init = { method: request.method, headers: h, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const r = await fetch(ZIEL + u.pathname + u.search, init);
  const out = new Response(r.body, r);
  out.headers.delete("access-control-allow-origin");
  return out;
}
