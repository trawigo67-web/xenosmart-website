/* Marka Istanbul – Saisonale Themen (zen, noel, yilbasi, paskalya, sevgililer, ramazan)
   Logos bleiben unverändert; nur Bänder, Akzente, Hintergrund, Gruß und Dekoration ändern sich. */
(function () {
  const TEMALAR = {
    zen:        { ad: "Zen × Marka (standart)", ikon: "💎", band: "#1c1c1a", line: "#c9a647", acc: "#b8913a", bg: ["#fffdf6", "#fbf4df", "#f5e9c4"], selam: null, fx: null },
    noel:       { ad: "Noel",            ikon: "🎄", band: "#123d2a", line: "#c9a647", acc: "#b3262e", bg: ["#fffdf8", "#f6f1e4", "#e9e2cf"],
                  selam: { tr: "Mutlu Noeller", de: "Frohe Weihnachten", en: "Merry Christmas" }, fx: "kar", dek: "🎄" },
    yilbasi:    { ad: "Yılbaşı",         ikon: "🎆", band: "#0e1430", line: "#d8b65a", acc: "#9a7a24", bg: ["#fffdf7", "#f7f2e3", "#ece3c7"],
                  selam: { tr: "Mutlu Yıllar", de: "Frohes neues Jahr", en: "Happy New Year" }, fx: "isilti", dek: "✨" },
    paskalya:   { ad: "Paskalya",        ikon: "🐣", band: "#5d7c4f", line: "#e6c86e", acc: "#7a9a5e", bg: ["#fffef8", "#f8f6e8", "#eef0dc"],
                  selam: { tr: "Mutlu Paskalyalar", de: "Frohe Ostern", en: "Happy Easter" }, fx: "cicek", dek: "🌷" },
    sevgililer: { ad: "Sevgililer Günü", ikon: "💝", band: "#5a0f1f", line: "#d8b65a", acc: "#c2185b", bg: ["#fffafa", "#fbeff0", "#f5dde0"],
                  selam: { tr: "Sevgililer Günü Kutlu Olsun", de: "Alles Liebe zum Valentinstag", en: "Happy Valentine's Day" }, fx: "kalp", dek: "💝" },
    ramazan:    { ad: "Ramazan",         ikon: "🌙", band: "#0d2a2c", line: "#d8b65a", acc: "#1f6f68", bg: ["#fffdf6", "#f6f2e2", "#e6e6d4"],
                  selam: { tr: "Hayırlı Ramazanlar", de: "Gesegneter Ramadan", en: "Ramadan Kareem" }, fx: "yildiz", dek: "🌙" },
  };
  // Konsept temaları: kendi kapak görseli (kapak) ile gelir; koyu:true olanlar müşteri sayfasını ve günlük görseli koyu zemine çevirir
  Object.assign(TEMALAR, {
    siyah: { ad: "Siyah & Altın konsept", ikon: "🖤", band: "#0c0c0d", line: "#c9a647", acc: "#d8b65a", bg: ["#1d1e21", "#141416", "#0c0c0d"], selam: null, fx: null, kapak: "kapak-siyah.jpg", koyu: true },
    beyaz: { ad: "Beyaz konsept",         ikon: "🤍", band: "#f4f5f4", line: "#c9a647", acc: "#b8913a", bg: ["#fcfdfc", "#f6f7f6", "#eff0ef"], selam: null, fx: null, kapak: "kapak-beyaz.jpg" },
  });
  // Sezon temaları da konsept görselleriyle (Timur'un gönderdiği kapaklar) ve koyu zeminle gelir
  Object.assign(TEMALAR.noel,       { kapak: "kapak-noel.jpg",       koyu: true, acc: "#e6c86e", bg: ["#4a1a14", "#2a120e", "#150b08"] });
  Object.assign(TEMALAR.yilbasi,    { kapak: "kapak-yilbasi.jpg",    koyu: true, acc: "#e6c86e", bg: ["#1c2140", "#0e1126", "#06070f"] });
  Object.assign(TEMALAR.sevgililer, { kapak: "kapak-sevgililer.jpg", koyu: true, acc: "#f0cf8a", bg: ["#6a1420", "#430f12", "#22080b"] });
  Object.assign(TEMALAR.ramazan,    { kapak: "kapak-ramazan.jpg",    koyu: true, acc: "#e6c86e", bg: ["#103238", "#071f28", "#04121a"] });
  const KAPAK_CSS = `
img.zlock.zkapak{width:100%!important;max-width:none!important;border-radius:14px;margin:8px auto 4px!important}
body:has(.plist) .topbar{position:relative;z-index:3}
body:has(.plist) img.zlock.zkapak{width:calc(100% + 40px)!important;margin:-46px -20px 2px!important;border-radius:0;position:relative;z-index:0;-webkit-mask-image:linear-gradient(to bottom,#000 70%,transparent);mask-image:linear-gradient(to bottom,#000 70%,transparent)}
#pano .logo.zkapak{left:0!important;top:75px!important;transform:none!important;width:1080px!important;-webkit-mask-image:linear-gradient(to bottom,#000 80%,transparent);mask-image:linear-gradient(to bottom,#000 80%,transparent)}`;
  const koyuCss = (n) => { const p = `html[data-tema="${n}"]`; return `
${p}{--bg:#121213;--card:rgba(0,0,0,.28);--card2:rgba(0,0,0,.38);--line:rgba(209,173,85,.38);--cop:#d1ad55;--cop2:#e6c86e;--cop3:rgba(209,173,85,.45);--copbg:rgba(0,0,0,.3);--text:#f3ead2;--muted:#a79c82;--navy:#f3ead2;color-scheme:dark}
${p} body:has(.plist){color:#f3ead2}
${p} body:has(.plist) .lang,${p} body:has(.plist) .tabs button,${p} body:has(.plist) .install,${p} body:has(.plist) .cta .tel,${p} body:has(.plist) .cta .dm{background:rgba(0,0,0,.3)}
${p} body:has(.plist) .install{color:#f3ead2}
${p} body:has(.plist) .tabs button.on,${p} body:has(.plist) .lang button.on{background:var(--grad);color:#141416}
${p} body:has(.plist) .btn:not(.ghost),${p} body:has(.plist) .install button:not(.x){color:#141416}
${p} body:has(.plist) .prow.gend{border-bottom-color:#d1ad55}
${p} body:has(.plist) .prow img.pic.ph{background:rgba(0,0,0,.3)}
${p} #pano{color:#f3ead2}
${p} #pano .r{border-bottom-color:rgba(209,173,85,.45)}
${p} #pano .r.end{border-bottom-color:#d1ad55}
${p} #pano .r .b,${p} #pano .orn i,${p} #pano .orn b,${p} #pano .foot .o2 i,${p} #pano .foot .o2 b{background:#d1ad55}
${p} #pano .addr{color:#a79c82}`; };
  const FX = { kar: ["❄", "❅", "❆"], isilti: ["✦", "✧", "·"], cicek: ["🌸", "🌼", "🌷"], kalp: ["♥", "❤", "♡"], yildiz: ["✦", "☆", "✧"] };
  let cur = "zen", lang = "tr", statik = false;

  function css(t) {
    return `
:root{--zband:${t.band};--zline:${t.line};--zacc:${t.acc}}
html{background:${t.band}!important}
${t.koyu ? "body:has(.plist)" : "body"}{background:radial-gradient(120% 70% at 50% 35%,${t.bg[0]} 0%,${t.bg[1]} 70%,${t.bg[2]} 100%) fixed!important}
${t.kapak ? `#pano{background:radial-gradient(120% 70% at 50% 40%,${t.bg[0]} 0%,${t.bg[1]} 70%,${t.bg[2]} 100%)!important}` + KAPAK_CSS : ""}${t.koyu ? koyuCss(cur) : ""}

.zselam{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px auto 4px;font-family:"Playfair Display",Georgia,serif;font-style:italic;font-size:17px;letter-spacing:.5px;color:${t.acc};text-align:center}
.zselam i{display:block;height:1px;width:34px;background:${t.line}}
.zselam .e{font-style:normal}
.zfx{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}
.zfx span{position:absolute;top:-30px;color:${t.line};opacity:.75;animation:zfall linear infinite}
@keyframes zfall{to{transform:translate3d(var(--dx),110vh,0) rotate(220deg)}}
@media (prefers-reduced-motion:reduce){.zfx{display:none}}`;
  }
  function ensure(id, tag, parent) { let e = document.getElementById(id); if (!e) { e = document.createElement(tag); e.id = id; (parent || document.head).appendChild(e); } return e; }

  let lastKey = "";
  function apply(name, opts) {
    opts = opts || {};
    const key = name + "|" + (opts.lang || lang);
    if (key === lastKey && document.documentElement.dataset.tema && !opts.force) return;
    lastKey = key;
    if (opts.lang) lang = opts.lang;
    if (opts.statik) statik = true;
    cur = TEMALAR[name] ? name : "zen";
    const t = TEMALAR[cur];
    document.documentElement.dataset.tema = cur;
    ensure("zTemaCss", "style").textContent = cur === "zen" ? "" : css(t);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.band;
    // Kapak görseli: konsept temalarında logo yerine konsept görseli; diğerlerinde asıl logo geri gelir
    document.querySelectorAll("img.zlock, img.logo").forEach((img) => {
      if (!img.dataset.asil) img.dataset.asil = img.getAttribute("src");
      const src = t.kapak || img.dataset.asil;
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      img.classList.toggle("zkapak", !!t.kapak);
    });
    // Gruß unter dem Logo
    document.querySelectorAll(".zselam").forEach((e) => e.remove());
    if (t.selam) {
      document.querySelectorAll("img.zlock, .logo").forEach((img) => {
        const d = document.createElement("div"); d.className = "zselam";
        d.innerHTML = `<i></i><span class="e">${t.dek}</span><span>${t.selam[lang] || t.selam.tr}</span><span class="e">${t.dek}</span><i></i>`;
        if (opts.panoStyle) d.style.cssText = opts.panoStyle;
        img.insertAdjacentElement("afterend", d);
      });
    }
    // Dekoration (fallende Symbole), nicht im statischen Pano-Bild
    const old = document.getElementById("zFx"); if (old) old.remove();
    if (t.fx && !statik) {
      const fx = ensure("zFx", "div", document.body); fx.className = "zfx";
      const ch = FX[t.fx]; let h = "";
      for (let i = 0; i < 16; i++) {
        const l = Math.random() * 100, dur = 9 + Math.random() * 10, del = -Math.random() * 18, sz = 10 + Math.random() * 12;
        h += `<span style="left:${l}%;font-size:${sz}px;animation-duration:${dur}s;animation-delay:${del}s;--dx:${(Math.random() * 60 - 30).toFixed(0)}px">${ch[i % ch.length]}</span>`;
      }
      fx.innerHTML = h;
    }
  }
  async function auto(opts) {
    try { const c = await (await fetch("config.json?t=" + Date.now(), { cache: "no-store" })).json(); apply(c.tema || "zen", opts); return c.tema || "zen"; }
    catch (e) { return "zen"; }
  }
  window.ZTema = { TEMALAR, apply, auto, get: () => cur, setLang: (l) => { lang = l; apply(cur, { force: true }); } };
})();
