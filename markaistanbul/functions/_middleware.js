// Bakım modu (Timur'un isteği, 21.11.2026): müşteri sayfası "Şu anda çalışıyoruz" gösterir.
// Çalışan sayfaları (admin, siparis, shiftplan), API'ler, Künye ve dosyalar normal çalışmaya devam eder.
// Siteyi yeniden açmak için: BAKIM = false yapıp main'e gönder.
const BAKIM = true;
const KAPALI = new Set(["/", "/index", "/index.html"]);

export async function onRequest(ctx) {
  const { request, next, env } = ctx;
  if (!BAKIM) return next();
  const url = new URL(request.url);
  if (!KAPALI.has(url.pathname) || (request.method !== "GET" && request.method !== "HEAD")) return next();
  try {
    const page = await env.ASSETS.fetch(new URL("/bakim", url));
    if (!page.ok) return next();
    return new Response(request.method === "HEAD" ? null : page.body, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": "86400",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  } catch (e) {
    return next();
  }
}
