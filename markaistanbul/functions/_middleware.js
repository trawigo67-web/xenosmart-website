// Bakım modu (Timur'un isteği, 21.11.2026: "hepsini kapat, hepsi çalışmada olsun"):
// Tüm sayfalar (müşteri fiyat listesi, admin, siparis, shiftplan ...) "Şu anda çalışıyoruz" gösterir.
// Açık kalanlar: bakım sayfası, Künye/Impressum (yasal), görseller/yazı tipleri gibi dosyalar.
// API'ler (/api/, /shiftplan-api/) dokunulmadı; sayfalar kapalı olduğu için kullanılmıyorlar, veriler korunuyor.
// Siteyi yeniden açmak için: BAKIM = false yapıp main'e gönder.
const BAKIM = true;
const ACIK = new Set(["/bakim", "/bakim.html", "/impressum", "/impressum.html"]);

function sayfaMi(path) {
  if (path.startsWith("/api/") || path.startsWith("/shiftplan-api/")) return false;
  if (ACIK.has(path)) return false;
  const son = path.split("/").pop();
  return son === "" || son.endsWith(".html") || !son.includes(".");
}

export async function onRequest(ctx) {
  const { request, next, env } = ctx;
  if (!BAKIM) return next();
  const url = new URL(request.url);
  if (!sayfaMi(url.pathname) || (request.method !== "GET" && request.method !== "HEAD")) return next();
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
