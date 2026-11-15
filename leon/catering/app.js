// Leonn Catering – Seite für Gäste (als App aufs Handy legbar)
// Karte, Preise und Rechnung kommen aus core.js; dieselbe Datei nutzt die Schnittstelle.
import { RULES, CATS, DISHES, BY, PRESETS, OCCASIONS, DRINKS, WARE, DELIV, calc, eur, times, presetPrice, level } from './core.js';

const CFG = window.LEONN_CFG || {};
const API = CFG.api || '';                 // leer = Vorführ-Modus: nichts wird gesendet, alles bleibt auf diesem Gerät
const T0 = Date.now();
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const ss = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
const MINE = 'leonn-catering-mine', DEMO = 'leonn-catering-demo', DRAFT = 'leonn-catering-draft';
let MODE = API ? 'load' : 'demo';          // demo | load | test | live | off
let PHONE = '02443 9124069';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const isIso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const nice = (s, long) => { if (!isIso(s)) return 'ohne Datum'; const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('de-DE', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };

const fresh = () => ({ date: iso(plus(14)), time: '18:00', guests: 40, occ: 'Geburtstag', sel: PRESETS[1].ids.slice(), preset: 'p2', filter: 0,
  drinks: {}, ware: 'none', staff: 0, hours: 4, deko: false, deliv: 'a', name: '', phone: '', mail: '', addr: '', note: '', ok: false });
let S = fresh();
(function restore() {
  const d = ss.get(DRAFT); if (!d || typeof d !== 'object') return;
  const f = fresh();
  for (const k of ['date', 'time', 'guests', 'occ', 'ware', 'staff', 'hours', 'deko', 'deliv']) if (typeof d[k] === typeof f[k]) f[k] = d[k];
  if (Array.isArray(d.sel)) f.sel = d.sel.filter((id) => BY[id]);
  if (d.drinks && typeof d.drinks === 'object') f.drinks = d.drinks;
  f.preset = typeof d.preset === 'string' ? d.preset : null;
  if (!isIso(f.date) || f.date < iso(plus(RULES.leadDays))) f.date = iso(plus(14));
  S = f;
})();

/* ---------------------------------------------------------------- Bon (für Konfigurator und Stand der Anfrage) */
function bonHtml(o) {
  let h = '<h2>Leonn Catering</h2><p class="meta">Bergisch Gladbacher Str. 261–263 · 51063 Köln</p><hr><p class="when">' + esc(nice(o.date)) + ' · ' + esc(o.time) + ' Uhr<br>' + o.guests + ' Gäste · ' + esc(o.occasion) + (o.code ? '<br>Nr. ' + esc(o.code) : '') + '</p><hr><div class="bon-list" id="' + o.listId + '" tabindex="0" role="group" aria-label="Gewählte Speisen">';
  if (!o.lines.length) h += '<p class="empty">Noch keine Speisen gewählt</p>';
  o.lines.forEach((l) => { h += '<p class="sec">' + esc(l.name) + '</p>'; l.rows.forEach((r) => { h += '<div class="ln"><span>' + esc(r.name) + '</span><span class="num">' + eur(r.price) + '</span></div>'; }); });
  h += '</div><div class="bon-foot"><hr><div class="ln"><span>Speisen pro Person</span><span class="num">' + eur(o.pp) + '</span></div><div class="ln"><span>× ' + o.guests + ' Gäste</span><span class="num">' + eur(o.food) + '</span></div>';
  if (o.disc) h += '<div class="ln"><span>Mengenrabatt ' + o.rate + ' %</span><span class="num">−' + eur(o.disc) + '</span></div>';
  h += '<p class="sec">Dazu</p>';
  o.extra.forEach((e) => { h += '<div class="ln"><span>' + esc(e.label) + '</span><span class="num">' + (e.amount ? eur(e.amount) : 'inkl.') + '</span></div>'; });
  h += '<div class="ln sub"><span>Aufbau und Abholung</span><span>inkl.</span></div>';
  h += '<hr><div class="ln tot"><span>Gesamt</span><span class="num">' + eur(o.total) + '</span></div><div class="ln sub"><span>pro Gast, alles inklusive</span><span class="num">' + eur(Math.round(o.total / o.guests)) + '</span></div><div class="ln sub"><span>inkl. MwSt.</span><span></span></div>';
  h += '<div class="ln dep"><span>Anzahlung ' + RULES.depositPct + ' %</span><span class="num">' + eur(o.deposit) + '</span></div></div>';
  return h;
}

/* ---------------------------------------------------------------- Aufbau einmalig */
function build() {
  $('f-time').innerHTML = times().map((t) => '<option>' + t + '</option>').join('');
  $('f-date').min = iso(plus(RULES.leadDays)); $('f-date').max = iso(plus(RULES.maxDays));
  $('occasions').innerHTML = OCCASIONS.map((o) => '<button type="button" class="chip" data-occ="' + o + '">' + o + '</button>').join('');
  $('filters').innerHTML = ['Alle Gerichte', 'Nur vegetarisch'].map((n, i) => '<button type="button" class="chip" data-filter="' + i + '">' + n + '</button>').join('');
  $('presets').innerHTML = PRESETS.map((p) => '<button type="button" class="preset" data-preset="' + p.id + '"><b>' + p.name + '</b><span>' + p.desc + '</span><i class="num">' + eur(presetPrice(p)) + '<small>p. P. · ' + p.ids.length + ' Gerichte</small></i></button>').join('');
  $('menu').innerHTML = CATS.map((c) => '<div class="cat"><h3>' + c.name + ' <small id="cnt-' + c.id + '"></small></h3>' + (c.note ? '<p class="hint">' + c.note + '</p>' : '') + '<div class="dishes">' +
    DISHES.filter((d) => d.cat === c.id).map((d) => {
      const tags = (d.veg ? '<span class="tag veg">vegetarisch</span>' : '') + (d.tag ? '<span class="tag ' + (d.tag === 'Leonn-Spezialität' ? 'pre' : 'hot') + '">' + d.tag + '</span>' : '');
      const pic = d.img ? '<img src="../img/xs/' + d.img + '" alt="" width="56" height="56" loading="lazy" decoding="async">' : '<i>' + esc(d.name.charAt(0)) + '</i>';
      return '<button type="button" class="dish" data-dish="' + d.id + '" aria-pressed="false"><span class="box" aria-hidden="true">✓</span><span class="pic" aria-hidden="true">' + pic + '</span><span><span class="name">' + d.name + '</span><span class="desc">' + d.desc + '</span>' + (tags ? '<span class="tags">' + tags + '</span>' : '') + '</span><span class="p num">+' + eur(d.price) + '</span></button>';
    }).join('') + '</div></div>').join('');
  $('extras').innerHTML =
    DRINKS.map((d) => '<div class="row"><div class="t"><b>' + d.name + '</b><span>' + d.desc + '</span></div><span class="p num">' + eur(d.pp) + ' p. P.</span><input type="checkbox" class="tog" id="x-' + d.id + '" data-drink="' + d.id + '" aria-label="' + d.name + '"></div>').join('') +
    '<div class="row"><div class="t"><b><label for="x-ware">Geschirr und Besteck</label></b><span>Porzellan nehmen wir ungespült wieder mit</span></div><select id="x-ware">' + WARE.map((w) => '<option value="' + w.id + '">' + w.name + (w.pp ? ' · ' + eur(w.pp) + ' p. P.' : '') + '</option>').join('') + '</select></div>' +
    '<div class="row"><div class="t"><b>Servicekräfte</b><span>Buffet betreuen, nachlegen, abräumen · ' + eur(RULES.staffRate) + ' pro Stunde und Kraft</span></div><div class="mini"><button type="button" data-staff="-1" aria-label="Eine Servicekraft weniger">−</button><output id="x-staff"></output><button type="button" data-staff="1" aria-label="Eine Servicekraft mehr">+</button></div><div class="mini"><button type="button" data-hours="-1" aria-label="Eine Stunde weniger">−</button><output id="x-hours"></output><button type="button" data-hours="1" aria-label="Eine Stunde mehr">+</button></div></div>' +
    '<div class="row"><div class="t"><b>Tisch- und Buffetdeko</b><span>Tücher, Etageren, Kerzen, Schilder zu jedem Gericht</span></div><span class="p num">' + eur(RULES.deko) + ' pauschal</span><input type="checkbox" class="tog" id="x-deko" aria-label="Tisch- und Buffetdeko"></div>' +
    '<div class="row"><div class="t"><b><label for="x-deliv">Lieferung</label></b><span>Entfernung vom Restaurant. Weiter als 60 km gern auf Anfrage.</span></div><select id="x-deliv">' + DELIV.map((d) => '<option value="' + d.id + '">' + d.name + ' · ' + (d.fee ? eur(d.fee) : 'kostenlos') + '</option>').join('') + '</select></div>';
}

/* ---------------------------------------------------------------- Anzeigen */
function fill() {
  $('f-date').value = S.date; $('f-time').value = S.time; $('f-guests').value = S.guests; $('g-range').value = Math.min(300, Math.max(RULES.minGuests, S.guests));
  $('f-name').value = S.name; $('f-phone').value = S.phone; $('f-mail').value = S.mail; $('f-addr').value = S.addr; $('f-note').value = S.note; $('f-ok').checked = S.ok;
  DRINKS.forEach((d) => { $('x-' + d.id).checked = !!S.drinks[d.id]; });
  $('x-ware').value = S.ware; $('x-deko').checked = S.deko; $('x-deliv').value = S.deliv;
}
function paint() {
  const c = calc(S);
  document.querySelectorAll('[data-occ]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.occ === S.occ));
  document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.filter === S.filter));
  document.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.preset === S.preset));
  document.querySelectorAll('[data-dish]').forEach((b) => { const d = BY[b.dataset.dish], on = S.sel.includes(d.id); b.setAttribute('aria-pressed', on); b.hidden = S.filter === 1 && !d.veg && !on; });
  CATS.forEach((k) => { const n = S.sel.filter((id) => BY[id].cat === k.id).length; $('cnt-' + k.id).textContent = n ? n + ' gewählt' : ''; });
  $('x-staff').textContent = S.staff ? S.staff + (S.staff === 1 ? ' Kraft' : ' Kräfte') : 'keine';
  $('x-hours').textContent = S.hours + ' Std.';
  $('g-disc').textContent = c.g <= 15 ? 'Bis 15 Personen feiern Sie auch bei uns im V.I.P Room.' : c.g < 50 ? 'Ab 50 Gästen 5 % Rabatt auf Speisen' : c.g < 100 ? '5 % Mengenrabatt auf Speisen · ab 100 Gästen 8 %' : '8 % Mengenrabatt auf Speisen';

  // Mengen-Anzeige: eine Skala von 0 bis 900 g pro Person
  $('m-bar').style.width = Math.min(100, c.grams / 900 * 100) + '%';
  $('m-bar').className = c.grams < 225 ? 'low' : '';
  const lv = level(c.grams, c.count), cls = lv.k === 'low' ? 'crit' : (lv.k === 'none' || lv.k === 'snack') ? 'mute' : 'good';
  const warm = S.sel.filter((id) => BY[id].cat === 'h' || BY[id].cat === 'f');
  const hasMain = S.sel.some((id) => BY[id].cat === 'h'), hasSide = S.sel.some((id) => BY[id].cat === 'b');
  const tip = warm.length && !warm.some((id) => BY[id].veg) ? 'Tipp: ein vegetarisches Gericht dazunehmen' : (hasMain && !hasSide ? 'Tipp: eine Beilage zu den Hauptgerichten' : '');
  $('m-text').innerHTML = '<span class="pill ' + cls + '">' + lv.label + '</span> <span class="hint num">etwa ' + c.grams + ' g pro Person' + (tip ? ' · ' + tip : '') + '</span>';

  const old = $('bon-list'), top = old ? old.scrollTop : 0;
  $('bon').innerHTML = bonHtml({ listId: 'bon-list', date: S.date, time: S.time, guests: c.g, occasion: S.occ, lines: c.lines, extra: c.extra, pp: c.pp, food: c.food, disc: c.disc, rate: c.rate, total: c.total, deposit: c.dep });
  if (top) $('bon-list').scrollTop = top;
  $('mb-total').textContent = eur(c.total);
  $('mb-pp').textContent = eur(Math.round(c.total / c.g)) + ' pro Gast · ' + c.count + (c.count === 1 ? ' Gericht' : ' Gerichte');
  $('sr-total').textContent = 'Gesamt ' + eur(c.total) + ', ' + eur(Math.round(c.total / c.g)) + ' pro Gast';
  ss.set(DRAFT, { date: S.date, time: S.time, guests: S.guests, occ: S.occ, sel: S.sel, preset: S.preset, drinks: S.drinks, ware: S.ware, staff: S.staff, hours: S.hours, deko: S.deko, deliv: S.deliv });
}
function noteBar() {
  const base = 'Interne Vorschau · nicht die offizielle Leonn-Website';
  const m = MODE === 'demo' ? ' · <b>Vorführ-Modus:</b> Anfragen werden nicht gesendet' : MODE === 'test' ? ' · <b>Testbetrieb:</b> Anfragen gelten noch nicht als Bestellung' : MODE === 'off' ? ' · Die Bestellung ist gerade nicht erreichbar, bitte anrufen: ' + esc(PHONE) : '';
  $('note').innerHTML = base + m;
  $('foot-tel').textContent = PHONE;
}

/* ---------------------------------------------------------------- Bedienung */
function setGuests(n) { S.guests = Math.min(RULES.maxGuests, Math.max(0, Math.round(+n) || 0)); $('g-range').value = Math.min(300, Math.max(RULES.minGuests, S.guests)); paint(); }
function wire() {
  $('f-date').addEventListener('change', (e) => { S.date = e.target.value; paint(); });
  $('f-time').addEventListener('change', (e) => { S.time = e.target.value; paint(); });
  $('f-guests').addEventListener('input', (e) => setGuests(e.target.value));
  $('f-guests').addEventListener('blur', () => { if (S.guests < RULES.minGuests) S.guests = RULES.minGuests; $('f-guests').value = S.guests; paint(); });
  $('g-range').addEventListener('input', (e) => { S.guests = +e.target.value; $('f-guests').value = S.guests; paint(); });
  $('g-minus').addEventListener('click', () => { $('f-guests').value = Math.max(RULES.minGuests, S.guests - 5); setGuests($('f-guests').value); });
  $('g-plus').addEventListener('click', () => { $('f-guests').value = Math.min(RULES.maxGuests, Math.max(RULES.minGuests, S.guests + 5)); setGuests($('f-guests').value); });
  [['f-name', 'name'], ['f-phone', 'phone'], ['f-mail', 'mail'], ['f-addr', 'addr'], ['f-note', 'note']].forEach((p) => $(p[0]).addEventListener('input', (e) => { S[p[1]] = e.target.value; e.target.classList.remove('bad'); }));
  $('f-ok').addEventListener('change', (e) => { S.ok = e.target.checked; });
  $('x-ware').addEventListener('change', (e) => { S.ware = e.target.value; paint(); });
  $('x-deliv').addEventListener('change', (e) => { S.deliv = e.target.value; paint(); });
  $('x-deko').addEventListener('change', (e) => { S.deko = e.target.checked; paint(); });
  $('form').addEventListener('change', (e) => { const d = e.target.dataset && e.target.dataset.drink; if (d) { S.drinks[d] = e.target.checked; paint(); } });
  $('form').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.occ) S.occ = d.occ;
    else if (d.filter) S.filter = +d.filter;
    else if (d.preset) {
      const p = PRESETS.find((x) => x.id === d.preset); if (!p) return;
      S.sel = p.ids.slice(); S.preset = p.id;
      if (p.id === 'p4' && S.time === '18:00') { S.time = '10:00'; $('f-time').value = S.time; }
    }
    else if (d.dish) { const i = S.sel.indexOf(d.dish); if (i > -1) S.sel.splice(i, 1); else S.sel.push(d.dish); S.preset = null; }
    else if (d.staff) S.staff = Math.max(0, Math.min(RULES.staffMax, S.staff + +d.staff));
    else if (d.hours) S.hours = Math.max(RULES.hoursMin, Math.min(RULES.hoursMax, S.hours + +d.hours));
    else return;
    paint();
  });
  $('form').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  $('mb-btn').addEventListener('click', () => $('bon-anchor').scrollIntoView({ block: 'start' }));
  $('done-main').addEventListener('click', onDoneClick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cur) refresh(); });
  window.addEventListener('storage', (e) => { if (e.key === DEMO && cur && cur.demo) refresh(); });
  window.addEventListener('popstate', route);
}

/* ---------------------------------------------------------------- Schnittstelle */
async function api(method, path, body) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(API + path, { method, signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  } catch (e) { return { ok: false, status: 0, j: { error: 'net' } }; } finally { clearTimeout(to); }
}
const mine = () => { const l = ls.get(MINE, []); return Array.isArray(l) ? l.filter((x) => x && typeof x.token === 'string' && typeof x.code === 'string') : []; };
function remember(e) { const l = mine().filter((x) => x.token !== e.token); l.unshift(e); ls.set(MINE, l.slice(0, 12)); }
const demoRows = () => { const l = ls.get(DEMO, []); return Array.isArray(l) ? l.filter((r) => r && typeof r.token === 'string' && r.data && Array.isArray(r.data.lines)) : []; };

/* ---------------------------------------------------------------- Absenden */
const FIELD = { date: ['f-date', 'Bitte ein Datum wählen, frühestens in ' + RULES.leadDays + ' Tagen.'], time: ['f-time', 'Bitte eine Uhrzeit wählen.'], guests: ['f-guests', 'Catering liefern wir ab ' + RULES.minGuests + ' Gästen.'], sel: [null, 'Bitte mindestens ' + RULES.minDishes + ' Gerichte wählen.'],
  name: ['f-name', 'Bitte Ihren Namen eintragen.'], phone: ['f-phone', 'Bitte eine gültige Telefonnummer eintragen.'], email: ['f-mail', 'Bitte die E-Mail-Adresse prüfen.'], address: ['f-addr', 'Bitte die Lieferadresse eintragen.'], consent: [null, 'Bitte das Einverständnis ankreuzen.'] };
function showErrors(keys, extra) {
  const box = $('errors');
  document.querySelectorAll('.field .bad').forEach((el) => el.classList.remove('bad'));
  if (!keys.length && !extra) { box.hidden = true; return; }
  keys.forEach((k) => { const f = FIELD[k]; if (f && f[0]) $(f[0]).classList.add('bad'); });
  box.hidden = false;
  box.innerHTML = extra ? esc(extra) : 'Es fehlt noch etwas:<ul>' + keys.map((k) => '<li>' + (FIELD[k] ? FIELD[k][1] : esc(k)) + '</li>').join('') + '</ul>';
  box.scrollIntoView({ block: 'center' });
}
let sending = false;
async function submit() {
  if (sending) return;
  const c = calc(S), err = [];
  if (!isIso(S.date) || S.date < iso(plus(RULES.leadDays)) || S.date > iso(plus(RULES.maxDays))) err.push('date');
  if (!(S.guests >= RULES.minGuests)) err.push('guests');
  if (c.count < RULES.minDishes) err.push('sel');
  if (S.name.trim().length < 2) err.push('name');
  if (S.phone.replace(/\D/g, '').length < 6 || !/^[0-9+()\/\-\s.]+$/.test(S.phone.trim())) err.push('phone');
  if (S.mail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.mail.trim())) err.push('email');
  if (S.addr.trim().length < 5) err.push('address');
  if (!S.ok) err.push('consent');
  if (err.length) { showErrors(err); return; }
  showErrors([]);
  const o = c.order;
  if (!API) {   // Vorführ-Modus: nur auf diesem Gerät ablegen, damit der Ablauf klickbar bleibt
    const now = Date.now(), A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'C'; for (let i = 0; i < 5; i++) code += A[Math.floor(Math.random() * A.length)];
    const row = { id: now, code, token: 'demo-' + code, date: S.date, time: S.time, guests: c.g, occasion: S.occ, name: S.name.trim(), phone: S.phone.trim(), email: S.mail.trim(), address: S.addr.trim(), note: S.note.trim(), lang: 'de', status: 'pending',
      total: c.total, deposit: c.dep, data: { sel: o.sel, drinks: o.drinks, ware: o.ware, staff: o.staff, hours: o.hours, deko: o.deko, deliv: o.deliv, pp: c.pp, grams: c.grams, rate: c.rate, food: c.food, disc: c.disc, lines: c.lines, extra: c.extra },
      admin_note: '', test: true, demo: true, created_at: now, updated_at: now, log: [{ ts: now, action: 'created', who: 'web' }] };
    ls.set(DEMO, [row].concat(demoRows()).slice(0, 20));
    remember({ code, token: row.token, demo: true });
    afterSend(row.token);
    return;
  }
  sending = true; const btn = $('send'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
  const r = await api('POST', '/catering/request', { date: S.date, time: S.time, guests: c.g, occasion: S.occ, sel: o.sel, drinks: o.drinks, ware: o.ware, staff: o.staff, hours: o.hours, deko: o.deko, deliv: o.deliv,
    name: S.name.trim(), phone: S.phone.trim(), email: S.mail.trim(), address: S.addr.trim(), note: S.note.trim(), lang: 'de', consent: true, web: $('f-web').value, el: Date.now() - T0 });
  sending = false; btn.disabled = false; btn.textContent = 'Anfrage absenden';
  if (r.ok && r.j.ok && r.j.token) { remember({ code: r.j.code, token: r.j.token }); afterSend(r.j.token); return; }
  if (r.j.error === 'fields' && Array.isArray(r.j.fields)) showErrors(r.j.fields);
  else if (r.status === 429) showErrors([], 'Von diesem Anschluss kamen gerade sehr viele Anfragen. Bitte später noch einmal versuchen oder anrufen: ' + PHONE);
  else if (r.j.error === 'blocked') showErrors([], 'Das ging sehr schnell. Bitte in ein paar Sekunden noch einmal absenden.');
  else showErrors([], 'Die Anfrage konnte nicht gesendet werden. Bitte noch einmal versuchen oder anrufen: ' + PHONE);
}
function afterSend(token) {
  S = fresh(); ss.del(DRAFT); fill(); paint();
  try { history.pushState(null, '', '?a=' + encodeURIComponent(token)); } catch (e) {}
  route();
}

/* ---------------------------------------------------------------- Stand der Anfrage */
const ST = { pending: ['Angefragt', 'warn'], offered: ['Angebot liegt vor', 'gold'], confirmed: ['Bestätigt', 'good'], paid: ['Anzahlung erhalten', 'good'], done: ['Geliefert', 'good'], declined: ['Abgesagt', 'crit'], cancelled: ['Storniert', 'mute'] };
let cur = null, timer = null;   // cur = { token, demo, p (Daten), state }
const pubOf = (r) => ({ code: r.code, date: r.date, time: r.time, guests: r.guests, occasion: r.occasion, name: r.name, status: r.status, test: !!r.test, total: r.total, deposit: r.deposit, data: r.data,
  canCancel: r.status === 'pending' || r.status === 'offered', canAccept: r.status === 'offered' });
async function load(token) {
  if (token.startsWith('demo-')) { const r = demoRows().find((x) => x.token === token); return r ? { state: 'ok', p: pubOf(r) } : { state: 'gone' }; }
  if (!API) return { state: 'gone' };
  const r = await api('GET', '/catering/r/' + encodeURIComponent(token));
  if (r.ok && r.j.code) return { state: 'ok', p: r.j };
  return { state: r.status === 404 ? 'gone' : 'net' };
}
async function refresh() {
  if (!cur) return;
  const token = cur.token, x = await load(token);
  if (!cur || cur.token !== token) return;
  if (x.state === 'net' && cur.p) return;          // Verbindung kurz weg: letzten Stand stehen lassen
  const changed = !cur.p || x.state !== cur.state || (x.p && (x.p.status !== cur.p.status || x.p.canAccept !== cur.p.canAccept || x.p.canCancel !== cur.p.canCancel));
  cur.state = x.state; cur.p = x.p || null;
  if (changed) renderDone();
}
function renderDone() {
  const box = $('done-main'), p = cur.p;
  const others = mine().filter((x) => x.token !== cur.token).slice(0, 5);
  const mineHtml = others.length ? '<div class="mine"><span class="lbl">Ihre weiteren Anfragen</span>' + others.map((x) => '<a href="?a=' + encodeURIComponent(x.token) + '" data-go="' + esc(x.token) + '"><span>Anfrage ' + esc(x.code) + '</span><span>ansehen</span></a>').join('') + '</div>' : '';
  if (!p) {
    $('done-bon').parentNode.hidden = true;
    box.innerHTML = cur.state === 'load' ? '<p class="note">Einen Moment …</p>'
      : '<span class="pill mute">' + (cur.state === 'net' ? 'Keine Verbindung' : 'Nicht gefunden') + '</span><h1>' + (cur.state === 'net' ? 'Der Stand lässt sich gerade nicht laden.' : 'Diese Anfrage gibt es nicht mehr.') + '</h1><p class="note">' + (cur.state === 'net' ? 'Bitte gleich noch einmal versuchen oder anrufen: ' + esc(PHONE) : 'Vielleicht wurde sie entfernt. Fragen Sie gern telefonisch nach: ' + esc(PHONE)) + '</p><div class="actions">' + (cur.state === 'net' ? '<button type="button" class="btn sm" data-act="reload">Noch einmal versuchen</button>' : '') + '<button type="button" class="btn sm ghost" data-act="new">Neue Anfrage</button></div>' + mineHtml;
    return;
  }
  const st = ST[p.status] || ST.pending, nm = esc(p.name);
  const head = p.status === 'pending' ? 'Vielen Dank, ' + nm + '. Ihre Anfrage <em class="num">' + esc(p.code) + '</em> ist bei uns.'
    : p.status === 'offered' ? 'Ihr Angebot ist da, ' + nm + '.'
    : p.status === 'confirmed' ? 'Abgemacht, ' + nm + '. Wir freuen uns auf Ihr Fest.'
    : p.status === 'paid' ? 'Alles bereit, ' + nm + '. Die Anzahlung ist da.'
    : p.status === 'done' ? 'Danke, ' + nm + '. <em>Afiyet olsun.</em>'
    : p.status === 'declined' ? 'Diesen Termin können wir leider nicht übernehmen.' : 'Diese Anfrage ist storniert.';
  const idx = { pending: 0, offered: 1, confirmed: 2, paid: 3, done: 4 }[p.status];
  const steps = [['Zusage innerhalb eines Werktags', 'Wir prüfen Termin und Küche und melden uns bei Ihnen.'], ['Angebot annehmen', 'Der Preis vom Bon gilt. Sie bestätigen hier mit einem Tipp.'], ['Anzahlung ' + eur(p.deposit), RULES.depositPct + ' % nach Ihrer Annahme. Damit ist der Termin fest.'], ['Lieferung, Aufbau und Abholung', 'Wir bauen das Buffet rechtzeitig vor dem Essen auf und holen alles wieder ab.']];
  const stepsHtml = idx === undefined ? '' : '<ol class="steps">' + steps.map((s, i) => '<li class="' + (i === idx ? 'on' : i < idx ? 'past' : '') + '"><span class="n num">' + pad(i + 1) + '</span><div><b>' + s[0] + '</b><span>' + s[1] + '</span></div></li>').join('') + '</ol>';
  const note = cur.demo ? '<p class="note warn">Vorführ-Modus: Diese Anfrage wurde nicht gesendet. Sie liegt nur auf diesem Gerät, damit Sie den Ablauf ausprobieren können.</p>'
    : p.test ? '<p class="note warn">Testbetrieb: Diese Anfrage gilt noch nicht als echte Bestellung.</p>' : '';
  const acts = (p.canAccept ? '<button type="button" class="btn" data-act="accept">Angebot annehmen</button>' : '') +
    (p.canCancel ? '<button type="button" class="btn sm danger" data-act="cancel">Anfrage stornieren</button>' : '') +
    (cur.demo ? '<a class="btn sm ghost" href="../admin/">So sieht es das Team</a>' : '<button type="button" class="btn sm ghost" data-act="link">Link zu dieser Anfrage kopieren</button>') +
    '<button type="button" class="btn sm ghost" data-act="new">Neue Anfrage</button>';
  box.innerHTML = '<span class="pill ' + st[1] + '">' + st[0] + '</span><h1 tabindex="-1" id="done-h">' + head + '</h1>' + note + stepsHtml +
    (p.status === 'confirmed' ? '<p class="note good">Zur Anzahlung melden wir uns bei Ihnen. Fragen: ' + esc(PHONE) + '</p>' : '') +
    '<div class="actions">' + acts + '</div><p class="hint" id="done-msg" role="status"></p>' + mineHtml;
  $('done-bon').parentNode.hidden = false;
  $('done-bon').innerHTML = bonHtml({ listId: 'done-list', code: p.code, date: p.date, time: p.time, guests: p.guests, occasion: p.occasion, lines: p.data.lines || [], extra: p.data.extra || [], pp: p.data.pp || 0, food: p.data.food || 0, disc: p.data.disc || 0, rate: p.data.rate || 0, total: p.total, deposit: p.deposit });
}
async function onDoneClick(e) {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); try { history.pushState(null, '', '?a=' + encodeURIComponent(go.dataset.go)); } catch (x) {} route(); return; }
  const b = e.target.closest('[data-act]'); if (!b || !cur) return;
  const a = b.dataset.act, msg = $('done-msg');
  if (a === 'new') { try { history.pushState(null, '', location.pathname); } catch (x) {} route(); window.scrollTo(0, 0); return; }
  if (a === 'reload') { cur.state = 'load'; cur.p = null; renderDone(); refresh(); return; }
  if (a === 'link') {
    const url = location.origin + location.pathname + '?a=' + encodeURIComponent(cur.token);
    try { await navigator.clipboard.writeText(url); b.textContent = 'Link kopiert'; } catch (x) { if (msg) msg.textContent = url; }
    return;
  }
  if (a === 'cancel' && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich stornieren? Ja'; setTimeout(() => { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = 'Anfrage stornieren'; } }, 6000); return; }
  if (a !== 'accept' && a !== 'cancel') return;
  b.disabled = true;
  if (cur.demo) {
    const rows = demoRows(), r = rows.find((x) => x.token === cur.token), ok = r && (a === 'accept' ? r.status === 'offered' : (r.status === 'pending' || r.status === 'offered'));
    if (ok) { r.status = a === 'accept' ? 'confirmed' : 'cancelled'; r.updated_at = Date.now(); (r.log = r.log || []).push({ ts: r.updated_at, action: a === 'accept' ? 'accepted_guest' : 'cancelled_guest', who: 'web' }); ls.set(DEMO, rows); }
    await refresh(); return;
  }
  const r = await api('POST', '/catering/r/' + encodeURIComponent(cur.token) + '/' + a, {});
  if (r.ok && r.j.code) { cur.p = r.j; cur.state = 'ok'; renderDone(); const h = $('done-h'); if (h) h.focus(); return; }
  b.disabled = false;
  if (r.status === 409) { await refresh(); return; }
  if (msg) msg.textContent = 'Das hat gerade nicht geklappt. Bitte noch einmal versuchen oder anrufen: ' + PHONE;
}

/* ---------------------------------------------------------------- Ansichten */
function route() {
  const token = new URLSearchParams(location.search).get('a') || '';
  clearInterval(timer); timer = null;
  if (token && /^[A-Za-z0-9_-]{6,80}$/.test(token)) {
    cur = { token, demo: token.startsWith('demo-'), p: null, state: 'load' };
    $('view-guest').hidden = true; $('view-done').hidden = false;
    renderDone(); window.scrollTo(0, 0);
    refresh().then(() => { if (cur && cur.p && !mine().some((x) => x.token === cur.token)) remember({ code: cur.p.code, token: cur.token, demo: cur.demo }); });
    timer = setInterval(() => { if (!document.hidden) refresh(); }, cur.demo ? 4000 : 30000);
  } else {
    cur = null;
    $('view-guest').hidden = false; $('view-done').hidden = true;
  }
}

async function start() {
  build(); fill(); wire(); paint(); noteBar(); route();
  if (API) {
    const r = await api('GET', '/catering/config');
    if (r.ok && r.j.mode) { MODE = r.j.mode === 'live' ? 'live' : 'test'; if (r.j.phone) PHONE = r.j.phone; }
    else MODE = 'off';
    noteBar();
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
start();
