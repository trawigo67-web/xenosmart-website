/* Marka Istanbul – Produktfoto automatisch bearbeiten (läuft komplett im Browser)
   Ablauf: Hintergrund (weißes Papier) erkennen → Produkt finden → freistellen →
   Weißabgleich + Helligkeit + etwas Glanz → zentrieren → transparentes PNG mit weichem Schatten.
   typ: "para" (rund) oder "bilezik" (Ring mit Loch). */
(function () {
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

  async function loadBitmap(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { try { return await createImageBitmap(file); } catch (e2) {} } }
    return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  function canvasOf(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  async function isle(file, typ, opt) {
    opt = opt || {};
    const bmp = await loadBitmap(file);
    const sc = Math.min(1, 1100 / Math.max(bmp.width, bmp.height));
    const W = Math.round(bmp.width * sc), H = Math.round(bmp.height * sc);
    const src = canvasOf(W, H), sx = src.getContext("2d", { willReadFrequently: true });
    sx.drawImage(bmp, 0, 0, W, H);
    const img = sx.getImageData(0, 0, W, H), d = img.data;

    // 1) Hintergrundfarbe aus dem Rand schätzen
    const R = [], G = [], B = [], bw = Math.max(4, Math.round(Math.min(W, H) * 0.04));
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
      if (x > bw && x < W - bw && y > bw && y < H - bw) continue;
      const i = (y * W + x) * 4; R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]);
    }
    const bg = [median(R), median(G), median(B)], bgL = lum(...bg), bgC = Math.max(...bg) - Math.min(...bg);

    // 2) Maske in kleiner Auflösung
    const m = (typ === "bilezik" ? 600 : 320) / Math.max(W, H), mw = Math.max(8, Math.round(W * m)), mh = Math.max(8, Math.round(H * m));
    const small = canvasOf(mw, mh), smx = small.getContext("2d", { willReadFrequently: true });
    smx.drawImage(src, 0, 0, mw, mh);
    const sd = smx.getImageData(0, 0, mw, mh).data;
    let fg = new Uint8Array(mw * mh);
    for (let i = 0; i < mw * mh; i++) {
      const r = sd[i * 4], g = sd[i * 4 + 1], b = sd[i * 4 + 2];
      const c = Math.max(r, g, b) - Math.min(r, g, b), L = lum(r, g, b);
      const warm = (r - b) - (bg[0] - bg[2]);
      fg[i] = (c - bgC > 26 && warm > 12) || L < bgL * 0.42 ? 1 : 0;
    }
    // Schließen (Dilatation + Erosion) gegen Lücken in Gravuren
    const morph = (a, dil, rad) => { const o = new Uint8Array(a.length);
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { let v = dil ? 0 : 1;
        for (let dy = -rad; dy <= rad && (dil ? !v : v); dy++) for (let dx = -rad; dx <= rad; dx++) {
          const xx = x + dx, yy = y + dy; const p = (xx < 0 || yy < 0 || xx >= mw || yy >= mh) ? 0 : a[yy * mw + xx];
          if (dil && p) { v = 1; break; } if (!dil && !p) { v = 0; break; } }
        o[y * mw + x] = v; } return o; };
    { const rr = typ === "bilezik" ? 3 : 2; fg = morph(morph(fg, true, rr), false, rr); }
    // größte zusammenhängende Fläche
    const lab = new Int32Array(mw * mh); let best = 0, bestN = 0, id = 0; const q = new Int32Array(mw * mh);
    for (let s = 0; s < mw * mh; s++) { if (!fg[s] || lab[s]) continue; id++; let h = 0, t = 0; q[t++] = s; lab[s] = id; let n = 0;
      while (h < t) { const p = q[h++]; n++; const x = p % mw, y = (p / mw) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= mw || yy >= mh) continue; const k = yy * mw + xx; if (fg[k] && !lab[k]) { lab[k] = id; q[t++] = k; } } }
      if (n > bestN) { bestN = n; best = id; } }
    if (!best || bestN < mw * mh * 0.01) throw new Error("Ürün bulunamadı – beyaz kâğıt üzerinde, yakından çekin");
    const xs = [], ys = [];
    for (let i = 0; i < mw * mh; i++) if (lab[i] === best) { xs.push(i % mw); ys.push((i / mw) | 0); }
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    const pc = (a, p) => a[Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))))];
    const x0 = pc(xs, 0.004), x1 = pc(xs, 0.996), y0 = pc(ys, 0.004), y1 = pc(ys, 0.996);
    const cx = ((x0 + x1 + 1) / 2) / m, cy = ((y0 + y1 + 1) / 2) / m, rad = ((x1 - x0 + 1) + (y1 - y0 + 1)) / 4 / m * (typ === "bilezik" ? 1.06 : 1);

    // 3) Farbe: Weißabgleich am Papier, Kontrast im Produkt, etwas mehr Sättigung
    const gain = bg.map((v) => Math.min(1.6, Math.max(0.8, 246 / Math.max(1, v))));
    const Ls = [];
    for (let y = Math.max(0, Math.round(cy - rad)); y < Math.min(H, cy + rad); y += 3) for (let x = Math.max(0, Math.round(cx - rad)); x < Math.min(W, cx + rad); x += 3) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad * 0.8) continue; const i = (y * W + x) * 4; Ls.push(lum(d[i] * gain[0], d[i + 1] * gain[1], d[i + 2] * gain[2])); }
    Ls.sort((a, b) => a - b);
    const lo = Ls.length ? pc(Ls, 0.02) : 0, hi = Ls.length ? pc(Ls, 0.985) : 255;
    const k = 0.6, sat = 1.14;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] * gain[0], g = d[i + 1] * gain[1], b = d[i + 2] * gain[2];
      const L = lum(r, g, b), L2 = Math.min(255, Math.max(0, (L - lo) / Math.max(20, hi - lo) * 235 + 12)), f = L > 0 ? (L * (1 - k) + L2 * k) / L : 1;
      r *= f; g *= f; b *= f; const LL = lum(r, g, b);
      d[i] = Math.min(255, Math.max(0, LL + (r - LL) * sat)); d[i + 1] = Math.min(255, Math.max(0, LL + (g - LL) * sat)); d[i + 2] = Math.min(255, Math.max(0, LL + (b - LL) * sat));
    }
    sx.putImageData(img, 0, 0);

    // 4) Freistellen
    const S = opt.size || 560, pad = S * 0.07, scale = (S - 2 * pad) / (2 * rad);
    const out = canvasOf(S, S), ox = out.getContext("2d");
    const cut = canvasOf(S, S), cx2 = cut.getContext("2d");
    cx2.drawImage(src, cx - rad, cy - rad, rad * 2, rad * 2, pad, pad, S - 2 * pad, S - 2 * pad);
    cx2.globalCompositeOperation = "destination-in";
    if (typ === "bilezik") {
      // Maske: Produktfläche, Loch in der Mitte bleibt frei, kleine Löcher werden gefüllt
      const mk = canvasOf(mw, mh), mx = mk.getContext("2d"), md = mx.createImageData(mw, mh);
      // Hintergrund von außen fluten
      const out0 = new Uint8Array(mw * mh); const qq = []; for (let x = 0; x < mw; x++) { qq.push(x, (mh - 1) * mw + x); } for (let y = 0; y < mh; y++) { qq.push(y * mw, y * mw + mw - 1); }
      for (const p of qq) if (lab[p] !== best && !out0[p]) out0[p] = 1;
      let h = 0; while (h < qq.length) { const p = qq[h++]; const x = p % mw, y = (p / mw) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= mw || yy >= mh) continue; const kk = yy * mw + xx; if (!out0[kk] && lab[kk] !== best) { out0[kk] = 1; qq.push(kk); } } }
      // innere Löcher: große bleiben Loch, kleine werden gefüllt
      const seen = new Uint8Array(mw * mh), holeArea = (x1 - x0) * (y1 - y0) * 0.03;
      const keep = new Uint8Array(mw * mh); for (let i = 0; i < mw * mh; i++) keep[i] = lab[i] === best ? 1 : 0;
      for (let s = 0; s < mw * mh; s++) { if (keep[s] || out0[s] || seen[s]) continue; const reg = [s]; seen[s] = 1; let hh = 0;
        while (hh < reg.length) { const p = reg[hh++]; const x = p % mw, y = (p / mw) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= mw || yy >= mh) continue; const kk = yy * mw + xx; if (!seen[kk] && !keep[kk] && !out0[kk]) { seen[kk] = 1; reg.push(kk); } } }
        if (reg.length < holeArea) for (const p of reg) keep[p] = 1; }
      // 1 Pixel einziehen gegen hellen Rand
      const er = new Uint8Array(mw * mh);
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const i = y * mw + x; er[i] = keep[i] && (x > 0 ? keep[i - 1] : 0) && (x < mw - 1 ? keep[i + 1] : 0) && (y > 0 ? keep[i - mw] : 0) && (y < mh - 1 ? keep[i + mw] : 0) ? 1 : 0; }
      for (let i = 0; i < mw * mh; i++) { md.data[i * 4 + 3] = er[i] ? 255 : 0; }
      mx.putImageData(md, 0, 0);
      cx2.imageSmoothingEnabled = true; cx2.filter = "blur(" + (S / 500).toFixed(1) + "px)";
      cx2.drawImage(mk, (cx - rad) * m, (cy - rad) * m, rad * 2 * m, rad * 2 * m, pad, pad, S - 2 * pad, S - 2 * pad);
      cx2.filter = "none";
    } else {
      cx2.beginPath(); cx2.arc(S / 2, S / 2, (S - 2 * pad) / 2 * 0.995, 0, Math.PI * 2); cx2.fill();
    }
    // 5) weicher Schatten + Ergebnis
    ox.shadowColor = "rgba(90,66,20,.35)"; ox.shadowBlur = S * 0.035; ox.shadowOffsetY = S * 0.012;
    ox.drawImage(cut, 0, 0);
    let png = out.toDataURL("image/webp", 0.88), ext = "webp";
    if (!png.startsWith("data:image/webp")) { png = out.toDataURL("image/png"); ext = "png"; }
    return { canvas: out, png, ext, bg, rad, scale };
  }
  window.FotoIsle = { isle };
})();
