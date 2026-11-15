/* 🦎 Buko Games – iPhone/iPad zoom kilidi (16.11.2026)
   Sorun: iOS Safari, iOS 10'dan beri viewport'taki "user-scalable=no, maximum-scale=1" ayarını
   iki parmak zoom'u için yok sayıyor. Oyunda iki parmak ekrana değince (iki başparmakla hızlı
   oynarken de) ya da menülerde hızlı dokununca sayfa büyüyordu.
   Bu dosya:
   1) touch-action ile iki parmak + çift dokunma zoom'unu kapatır (kaydırma serbest kalır),
   2) Safari'nin gesture olaylarını ve iki parmaklı touchmove'u durdurur (yedek),
   3) telefon yan çevrilince yazıların kendiliğinden büyümesini kapatır,
   4) oyunlarda uzun basınca açılan büyük önizlemeyi / yazı seçme büyütecini kapatır.
   Ana sayfa (spiel/): sadece çift dokunma kapalı, iki parmakla büyütmek serbest (okumak isteyen için).
   Her sayfa <head> içinde, viewport'tan hemen sonra yükler (1453 ve Zıpzıp: ../buko-nozoom.js).
   Yeni oyunlarda da ekle. */
(function () {
  if (window.__bukoNZ) return; window.__bukoNZ = 1;
  var d = document, hub = /\/spiel\/(index\.html)?$/.test(location.pathname);
  var css = 'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}' + (hub
    ? '*{touch-action:manipulation}'
    /* '*' özgüllüğü 0: oyunların kendi "touch-action:none" kuralları geçerli kalır */
    : '*{touch-action:pan-x pan-y}' +
      'body{-webkit-user-select:none;user-select:none}' +
      'a,img{-webkit-touch-callout:none}' +
      'input,textarea,select,[contenteditable]{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}');
  var st = d.createElement('style'); st.id = 'bukoNZ'; st.textContent = css;
  (d.head || d.documentElement).appendChild(st);
  if (hub) return;

  function stop(e) { if (e.cancelable) e.preventDefault(); }
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { d.addEventListener(t, stop, { passive: false }); });
  d.addEventListener('touchmove', function (e) {
    if ((e.touches && e.touches.length > 1) || (typeof e.scale === 'number' && e.scale !== 1)) stop(e);
  }, { passive: false });

  /* Sayfa html/body'ye "manipulation" ya da "auto" verdiyse iki parmak zoom'u hâlâ açık → kapat */
  function fix() {
    [d.documentElement, d.body].forEach(function (el) {
      if (!el) return;
      var t = getComputedStyle(el).touchAction;
      if (t === 'auto' || t === 'manipulation') el.style.touchAction = 'pan-x pan-y';
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', fix); else fix();
})();
