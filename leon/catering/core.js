// Leonn Catering – Karte, Preise und Rechnung an EINER Stelle.
// Diese Datei nutzen die Seite für Gäste (catering/app.js) und die Schnittstelle (functions/api/[[path]].js).
// So rechnet der Server mit denselben Preisen wie die Seite und vertraut nie einer Summe aus dem Browser.
//
// Gerichte und Beschreibungen stammen von der Leonn-Karte (data.js).
// VORSCHLÄGE, bitte vom Restaurant prüfen: alle Catering-Preise, Portionsgrößen, Rabatte, Lieferkosten
// und die Kennzeichnung „vegetarisch“ (aus den Beschreibungen abgeleitet, nicht von der Küche bestätigt).
// Alle Geldbeträge in Cent.

export const RULES = {
  minGuests: 10, maxGuests: 500,
  leadDays: 3,            // frühestens in … Tagen
  maxDays: 365,           // höchstens … Tage im Voraus
  firstTime: '08:00', lastTime: '21:30', stepMin: 30,
  minDishes: 3,
  depositPct: 30,         // Anzahlung nach Zusage
  discounts: [[100, 8], [50, 5]],   // ab … Gästen … % auf Speisen
  staffRate: 3200, staffMax: 8, hoursMin: 3, hoursMax: 10,
  deko: 8900,
};

export const CATS = [
  { id: 'm', name: 'Meze und Salate' },
  { id: 'f', name: 'Warme Kleinigkeiten' },
  { id: 'h', name: 'Grill und Güveç' },
  { id: 'b', name: 'Beilagen' },
  { id: 'd', name: 'Desserts' },
  { id: 'k', name: 'Frühstück', flat: true, note: 'Für Brunch und Feiern am Vormittag' },
];

// id, Gang, Name, Beschreibung, Preis pro Person (Cent), Gramm pro Person (wenn einziges Gericht im Gang),
// vegetarisch (1/0), Hinweis, Foto (Dateiname in ../img/xs/ und ../img/s/)
export const DISHES = [
  ['m1', 'm', 'Haydari', 'Cremiger Joghurt mit Portulak, Gurke und Minze', 190, 60, 1, '', '9f97.webp'],
  ['m2', 'm', 'Köpoğlu', 'Aubergine und Paprika in Joghurt und Tomatensauce', 220, 60, 1, '', '9f98.webp'],
  ['m3', 'm', 'Cevizli Paşa', 'Joghurt mit Walnüssen und Knoblauch', 170, 60, 1, '', '9f99.webp'],
  ['m4', 'm', 'Pembe Sultan', 'Joghurt mit Roter Bete', 170, 60, 1, '', '9f9a.webp'],
  ['m5', 'm', 'Girit Ezme', 'Schafskäsecreme mit Basilikum und Walnüssen', 190, 60, 1, '', '9f9b.webp'],
  ['m6', 'm', 'Acılı Antep Ezme', 'Pikante Tomaten-Paprika-Mischung mit Petersilie', 190, 60, 1, 'scharf', ''],
  ['m7', 'm', 'Közleme', 'Geröstete Aubergine und Kapya-Paprika in Olivenöl', 260, 60, 1, '', ''],
  ['m8', 'm', 'Vişneli Yaprak Sarma', 'Weinblätter mit Reis und Sauerkirschen', 260, 60, 1, '', ''],
  ['m9', 'm', 'Çiğköfte', 'Bulgur mit frischen Kräutern und Granatapfelsirup', 260, 60, 1, 'leicht scharf', '9f94.webp'],
  ['m10', 'm', 'Gavurdağı', 'Fein gehackte Tomaten, Gurken, Petersilie und Walnüsse', 240, 80, 1, '', ''],
  ['m11', 'm', 'Köy Salatası mit Tulum', 'Tomaten, Gurken, Paprika und Tulum-Käse', 260, 80, 1, '', '9f91.webp'],
  ['f1', 'f', 'Kalem Böreği', 'Knusprige Teigröllchen mit Weißkäse und Petersilie', 260, 65, 1, '', ''],
  ['f2', 'f', 'Antep Fıstıklı İçli Köfte', 'Bulgurklöße mit würzigem Hackfleisch und Walnüssen', 320, 70, 0, '', ''],
  ['f3', 'f', 'Adana Su Böreği', 'Butter-Börek mit Käsefüllung', 260, 65, 1, '', '9f8f.webp'],
  ['f4', 'f', 'Ispanaklı Peynirli Pide', 'Dünne Pide mit Spinat und Käse', 240, 65, 1, '', '6e68.webp'],
  ['f5', 'f', 'Kaşarlı Güveçte Mantar', 'Champignons, im Güveç mit Käse überbacken', 280, 65, 1, '', '9f95.webp'],
  ['f6', 'f', 'Mini Köfte', 'Kleine Köfte', 320, 65, 0, '', '9fac.webp'],
  ['h1', 'h', 'Leonn Kuzu Çevirme', 'Lamm, über Stunden am Spieß gegart', 1290, 200, 0, 'Leonn-Spezialität', '9fab.webp'],
  ['h2', 'h', 'Kuzu Güveç', 'Zartes Lamm mit Tomaten, Paprika und Zwiebeln', 890, 190, 0, '', ''],
  ['h3', 'h', 'Tavuk Güveç', 'Hähnchenfilet mit Tomaten, Paprika und Zwiebeln', 690, 190, 0, '', '9f9e.webp'],
  ['h4', 'h', 'Sebze Güveç', 'Champignons, Zucchini, Karotten und Paprika aus dem Ofen', 590, 190, 1, '', ''],
  ['h5', 'h', 'Kiremitte Kaşarlı Köfte', 'Saftige Köfte, mit Kaşar überbacken', 790, 180, 0, '', '9f9f.webp'],
  ['h6', 'h', 'Beyti Sarma', 'Hackspieß mit Kaşar in Lavash, dazu Joghurt', 790, 180, 0, '', '9f9c.webp'],
  ['h7', 'h', 'Vejeteryan Beyti', 'Falafel in Lavash gerollt, dazu Joghurt', 690, 180, 1, '', ''],
  ['h8', 'h', 'Tavuk Bonfile', 'Gegrilltes Hähnchenfilet', 740, 180, 0, '', '9fa3.webp'],
  ['h9', 'h', 'Somon Güveç', 'Lachsfilet aus dem Ofen', 890, 170, 0, '', '9fa1.webp'],
  ['h10', 'h', 'Leonn V.I.P. Grillplatte', 'Ausgewählte Lammspezialitäten vom Grill', 1190, 200, 0, 'Leonn-Spezialität', '9fa5.webp'],
  ['b1', 'b', 'Pirinç', 'Reis', 160, 100, 1, '', ''],
  ['b2', 'b', 'Grillgemüse', 'Gegrilltes Gemüse', 240, 90, 1, '', ''],
  ['b3', 'b', 'Drillingskartoffeln', 'Kleine Kartoffeln', 220, 100, 1, '', ''],
  ['b4', 'b', 'Ballonbrot', 'Luftiges Fladenbrot', 120, 50, 1, '', ''],
  ['b5', 'b', 'Söğüş Tabağı', 'Zwiebeln, Rucola, Tomaten, Karotten und Zitrone', 190, 80, 1, '', '9f93.webp'],
  ['d1', 'd', 'Künefe', 'Mit Pistazien, dazu Kaymak', 390, 80, 1, '', '9fa7.webp'],
  ['d2', 'd', 'Baklava', 'Knuspriger Teig mit Pistazienfüllung', 290, 60, 1, '', ''],
  ['d3', 'd', 'Sütlaç', 'Milchreis aus dem Ofen mit Walnüssen', 260, 90, 1, '', '9fa8.webp'],
  ['d4', 'd', 'Kazandibi', 'Karamellisierter Milchpudding', 260, 90, 1, '', '9fa9.webp'],
  ['d5', 'd', 'Fıstıklı Katmer', 'Hauchdünner Teig mit Pistazienkaymak', 390, 70, 1, '', ''],
  ['k1', 'k', 'Breakfast Essentials', 'Käse, Oliven, Honig und Kaymak, Marmeladen, Şakşuka, Backwarenkorb', 1390, 380, 0, '', ''],
  ['k2', 'k', 'Menemen', 'Rührei mit geschmorten Tomaten und Paprika', 260, 80, 1, '', '9f8c.webp'],
  ['k3', 'k', 'Sucuklu Yumurta', 'Rührei mit türkischer Knoblauchwurst', 290, 80, 0, '', '9f8d.webp'],
  ['k4', 'k', 'Pişi', 'Hefeteiggebäck, frisch frittiert', 190, 50, 1, '', ''],
].map((a) => ({ id: a[0], cat: a[1], name: a[2], desc: a[3], price: a[4], g: a[5], veg: !!a[6], tag: a[7], img: a[8] }));

export const BY = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const PRESETS = [
  { id: 'p1', name: 'Meze und Fingerfood', desc: 'Für Empfang und Stehparty', ids: ['m1', 'm2', 'm5', 'm8', 'm9', 'f1', 'f2', 'f3', 'f6', 'b4', 'd2'] },
  { id: 'p2', name: 'Güveç-Buffet', desc: 'Meze, zwei Güveç, Beilagen und Dessert', ids: ['m1', 'm10', 'h3', 'h4', 'b1', 'b2', 'b4', 'd3'] },
  { id: 'p3', name: 'Leonn Festtafel', desc: 'Mit Kuzu Çevirme, für Hochzeit und Firmenfeier', ids: ['m1', 'm2', 'm5', 'm8', 'm10', 'f1', 'f2', 'h1', 'h3', 'h7', 'b1', 'b2', 'b4', 'd1', 'd2'] },
  { id: 'p4', name: 'Anatolisches Frühstück', desc: 'Breakfast Essentials mit warmen Extras', ids: ['k1', 'k2', 'k3', 'k4', 'f3'] },
];

export const OCCASIONS = ['Geburtstag', 'Hochzeit', 'Verlobung', 'Familienfeier', 'Firmenfeier', 'Geschäftsessen', 'Sonstiges'];

export const DRINKS = [
  { id: 'soft', name: 'Wasser und Softdrinks', desc: 'Gekühlt, mit Gläsern', pp: 450 },
  { id: 'cay', name: 'Semaver-Çay und Türk Kahvesi', desc: 'Mit Samowar, Gläsern und Tassen', pp: 290 },
  { id: 'ayran', name: 'Ayran und Limonata', desc: 'In Karaffen', pp: 320 },
];
export const WARE = [
  { id: 'none', name: 'Kein Geschirr', pp: 0 },
  { id: 'eco', name: 'Kompostierbares Geschirr', pp: 120 },
  { id: 'porz', name: 'Porzellan, Besteck, Stoffservietten', pp: 350 },
];
export const DELIV = [
  { id: 'a', name: 'Bis 10 km', fee: 0 },
  { id: 'b', name: '10 bis 30 km', fee: 3900 },
  { id: 'c', name: '30 bis 60 km', fee: 7900 },
];

// Portionen je Gang bei 1 bis 6 Gerichten (danach gleichbleibend): mehr Auswahl, kleinere Portion je Gericht
export const SHARE = [0, 1, 1.5, 1.8, 2, 2.2, 2.4];

const _eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
export const eur = (cents) => _eur.format((Number(cents) || 0) / 100);

export function times() {
  const out = [], a = toMin(RULES.firstTime), b = toMin(RULES.lastTime);
  for (let m = a; m <= b; m += RULES.stepMin) out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
  return out;
}
function toMin(s) { return (+s.slice(0, 2)) * 60 + (+s.slice(3, 5)); }
export const timeOk = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s) && times().includes(s);
export const discountPct = (guests) => { for (const [n, p] of RULES.discounts) if (guests >= n) return p; return 0; };

// Macht aus beliebigen Eingaben eine gültige Auswahl (unbekannte Gerichte fallen weg, Zahlen bleiben im Rahmen).
export function normalize(o) {
  o = o || {};
  const int = (v, a, b, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
  const sel = Array.isArray(o.sel) ? [...new Set(o.sel.filter((x) => typeof x === 'string' && BY[x]))] : [];
  const dr = Array.isArray(o.drinks) ? o.drinks : (o.drinks && typeof o.drinks === 'object' ? Object.keys(o.drinks).filter((k) => o.drinks[k]) : []);
  return {
    guests: int(o.guests, RULES.minGuests, RULES.maxGuests, RULES.minGuests),
    sel,
    drinks: DRINKS.map((d) => d.id).filter((id) => dr.includes(id)),
    ware: WARE.some((w) => w.id === o.ware) ? o.ware : 'none',
    staff: int(o.staff, 0, RULES.staffMax, 0),
    hours: int(o.hours, RULES.hoursMin, RULES.hoursMax, 4),
    deko: o.deko === true,
    deliv: DELIV.some((d) => d.id === o.deliv) ? o.deliv : 'a',
  };
}

// Rechnet eine Auswahl durch. Ergebnis in Cent; lines und extra sind so aufgebaut, dass man sie speichern kann.
export function calc(input) {
  const o = normalize(input), g = o.guests;
  let pp = 0, grams = 0, count = 0;
  const lines = [];
  for (const c of CATS) {
    const items = o.sel.map((id) => BY[id]).filter((d) => d.cat === c.id);
    if (!items.length) continue;
    const n = items.length, f = c.flat ? 1 : SHARE[Math.min(n, 6)] / n;
    lines.push({ cat: c.id, name: c.name, rows: items.map((d) => { const pg = Math.round(d.g * f / 5) * 5; pp += d.price; grams += pg; count++; return { id: d.id, name: d.name, price: d.price, pg }; }) });
  }
  const rate = discountPct(g), food = pp * g, disc = Math.round(food * rate / 100);
  const extra = [];
  for (const d of DRINKS) if (o.drinks.includes(d.id)) extra.push({ k: d.id, label: d.name, amount: d.pp * g });
  const w = WARE.find((x) => x.id === o.ware);
  if (w && w.pp) extra.push({ k: w.id, label: w.name, amount: w.pp * g });
  if (o.staff > 0) extra.push({ k: 'staff', label: o.staff + ' × Service, ' + o.hours + ' Std.', amount: o.staff * o.hours * RULES.staffRate, n: o.staff, h: o.hours });
  if (o.deko) extra.push({ k: 'deko', label: 'Tisch- und Buffetdeko', amount: RULES.deko });
  const dl = DELIV.find((x) => x.id === o.deliv) || DELIV[0];
  extra.push({ k: 'deliv', label: 'Lieferung ' + dl.name.toLowerCase(), amount: dl.fee, z: dl.id });
  const total = food - disc + extra.reduce((a, e) => a + e.amount, 0);
  return { order: o, g, pp, grams, count, lines, rate, food, disc, extra, total, dep: Math.round(total * RULES.depositPct / 100) };
}

export const presetPrice = (p) => p.ids.reduce((a, id) => a + BY[id].price, 0);

// Einordnung der Menge: eine Skala von 0 bis 900 g pro Person in vier gleich breiten Bereichen
export function level(grams, count) {
  if (!count) return { k: 'none', label: 'Noch nichts gewählt' };
  if (grams < 120) return { k: 'low', label: 'Noch zu wenig' };
  if (grams < 225) return { k: 'snack', label: 'Für einen Empfang' };
  if (grams < 450) return { k: 'light', label: 'Leichte Mahlzeit' };
  if (grams <= 675) return { k: 'full', label: 'Alle werden satt' };
  return { k: 'rich', label: 'Sehr großzügig' };
}
