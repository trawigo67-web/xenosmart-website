// Günlük (xenosmart.de/mustafa) – Schnittstelle (Cloudflare Worker "xenosmart-gunluk" + D1)
// Aufgaben: 1. Sicherung/Abgleich der Einträge je Gerät-Schlüssel, 2. Erinnerungen aufs Handy (Web Push).
//   POST   /api/sync        Einträge abgleichen (nur Geändertes hin und zurück)
//   GET    /api/vapid       öffentlicher Schlüssel für die Mitteilungen
//   POST   /api/push        Gerät für Mitteilungen anmelden      DELETE /api/push   abmelden
//   POST   /api/push/test   Probe-Mitteilung an die eigenen Geräte
//   DELETE /api/account     alles zu diesem Schlüssel löschen
//   GET    /api/tick        fällige Erinnerungen verschicken (läuft sonst von selbst alle 5 Minuten, siehe wrangler.toml)
// Anmeldung: "Authorization: Bearer <Schlüssel>" – der Schlüssel entsteht in der App und bleibt auf dem Handy.

const ORIGINS = [/^https:\/\/(www\.)?xenosmart\.de$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|notify\.windows\.com)$/;
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  "CREATE TABLE IF NOT EXISTS acct (id TEXT PRIMARY KEY, rev INTEGER NOT NULL DEFAULT 0, doc TEXT NOT NULL DEFAULT '{}', meta TEXT NOT NULL DEFAULT '{}', up TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS push (endpoint TEXT PRIMARY KEY, acct TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'tr', created_at INTEGER NOT NULL, ok_at INTEGER NOT NULL DEFAULT 0, fails INTEGER NOT NULL DEFAULT 0)",
  'CREATE INDEX IF NOT EXISTS idx_push_acct ON push(acct)',
  'CREATE TABLE IF NOT EXISTS sent (acct TEXT NOT NULL, k TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (acct, k))',
  'CREATE INDEX IF NOT EXISTS idx_sent_ts ON sent(ts)',
];
const TYPES = ['termin', 'is', 'not'];
const KINDS = ['d2', 'd1', 'day', 'h1'];
const MAX_BODY = 900000, MAX_ITEMS = 20000, MAX_DOC = 1800000, MAX_ACCTS = 3000;
const DAY = 864e5, HOUR = 36e5, MIN = 6e4;
const DEF_TZ = 'Europe/Berlin';

/* ---------------------------------------------------------------- Hilfen */
const enc = new TextEncoder();
const b64u = (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
const rnd = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
const cat = (...a) => { const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let o = 0; for (const x of a) { out.set(x, o); o += x.length; } return out; };
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / DAY);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanMulti = (s, n) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };
const intIn = (v, a, b) => { const n = Number(v); return Number.isInteger(n) && n >= a && n <= b ? n : null; };
const parse = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };

const db = {
  all: async (env, sql, ...p) => ((await env.DB.prepare(sql).bind(...p).all()).results || []),
  first: (env, sql, ...p) => env.DB.prepare(sql).bind(...p).first(),
  run: (env, sql, ...p) => env.DB.prepare(sql).bind(...p).run(),
};
let schemaOk = false;
async function ensure(env) { if (schemaOk) return; await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s))); schemaOk = true; }
const getKV = async (env, k) => { const r = await db.first(env, 'SELECT v FROM kv WHERE k = ?', k); return r ? parse(r.v, null) : null; };
const setKV = (env, k, v) => db.run(env, 'INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, JSON.stringify(v));

/* ---------------------------------------------------------------- Zeitzonen (Erinnerungen richten sich nach der Uhr des Nutzers) */
function okTz(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
function parts(tz, ms) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms));
  const o = {}; for (const x of p) o[x.type] = x.value;
  if (o.hour === '24') o.hour = '00';
  return o;
}
const localOf = (tz, ms) => { const o = parts(tz, ms); return { date: o.year + '-' + o.month + '-' + o.day, time: o.hour + ':' + o.minute }; };
function offsetMin(tz, ms) { const o = parts(tz, ms); return Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second) - Math.floor(ms / 1000) * 1000) / MIN); }
// Ortszeit (Datum + Uhrzeit) in einen Zeitpunkt umrechnen – auch über die Sommerzeit-Umstellung hinweg
function zoned(tz, d, h) {
  const a = d.split('-').map(Number), b = (h || '00:00').split(':').map(Number);
  const guess = Date.UTC(a[0], a[1] - 1, a[2], b[0], b[1]);
  let ms = guess - offsetMin(tz, guess) * MIN;
  const off2 = offsetMin(tz, ms);
  if (guess - off2 * MIN !== ms) ms = guess - off2 * MIN;
  return ms;
}

/* ---------------------------------------------------------------- Einträge prüfen und abgleichen */
function cleanItem(x, now) {
  if (!x || typeof x !== 'object') return null;
  const id = String(x.id || '');
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;
  let u = num(x.u); if (!u) return null;
  if (u > now + 5 * MIN) u = now;                       // Uhr des Handys geht vor
  const o = { id, u };
  if (x.x) { o.x = 1; return o; }                       // gelöscht (bleibt als Merker, damit andere Geräte es auch löschen)
  if (!TYPES.includes(x.t) || !isDate(x.d)) return null;
  o.t = x.t; o.d = x.d; o.h = isTime(x.h) ? x.h : '';
  o.c = Math.min(num(x.c) || u, u); o.tc = Math.min(num(x.tc) || o.c, u);
  for (const [k, n] of [['title', 200], ['place', 200], ['site', 200], ['who', 300]]) { const v = clean(x[k], n); if (v) o[k] = v; }
  for (const [k, n] of [['note', 4000], ['work', 4000]]) { const v = cleanMulti(x[k], n); if (v) o[k] = v; }
  if (x.t === 'is') { const n = intIn(x.n, 0, 999); if (n !== null) o.n = n; }
  if (x.r && typeof x.r === 'object') { const r = {}; for (const k of KINDS) if (x.r[k]) r[k] = 1; if (Object.keys(r).length) o.r = r; }
  if (x.done) o.done = 1;
  return o;
}
function cleanMeta(m) {
  if (!m || typeof m !== 'object') return null;
  const mu = num(m.mu); if (!mu) return null;
  return { mu, lang: m.lang === 'de' ? 'de' : 'tr', name: clean(m.name, 40), evening: m.evening ? 1 : 0, eveningAt: isTime(m.eveningAt) ? m.eveningAt : '18:00' };
}
const label = (it) => it.t === 'is' ? (it.site || '') : it.t === 'not' ? clean(it.note, 70) : (it.title || '');
// Kurzfassung der kommenden Einträge mit Erinnerung – nur die liest der Erinnerungs-Lauf
function buildUp(items, today) {
  const from = addDays(today, -2), r = [], wd = {};
  for (const id in items) {
    const it = items[id];
    if (it.x || !it.d || it.d < from) continue;
    if (it.t === 'is') wd[it.d] = 1;
    if (!it.r || it.done) continue;
    r.push({ id, t: it.t, d: it.d, h: it.h || '', a: label(it), p: it.t === 'termin' ? (it.place || '') : '', n: it.t === 'is' ? (it.n || 0) : 0, r: it.r, tc: it.tc || it.c || 0 });
  }
  return { r, wd: Object.keys(wd) };
}

async function sync(env, acct, b, now) {
  const since = num(b.since);
  const incoming = Array.isArray(b.items) ? b.items.slice(0, 5000).map((x) => cleanItem(x, now)).filter(Boolean) : [];
  const metaIn = cleanMeta(b.meta);
  const tz = typeof b.tz === 'string' && b.tz.length < 60 && okTz(b.tz) ? b.tz : '';
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await db.first(env, 'SELECT rev, doc, meta FROM acct WHERE id = ?', acct);
    const rev = row ? row.rev : 0, doc = row ? parse(row.doc, {}) : {}, items = doc.items && typeof doc.items === 'object' ? doc.items : {};
    const meta = row ? parse(row.meta, {}) : {};
    const next = rev + 1; let changed = false;
    for (const it of incoming) {
      const cur = items[it.id];
      if (cur && cur.u >= it.u) continue;                 // die neuere Fassung gewinnt
      if (!cur && Object.keys(items).length >= MAX_ITEMS) continue;
      it.s = next; items[it.id] = it; changed = true;
    }
    let metaChanged = false;
    if (metaIn && (!meta.mu || metaIn.mu > meta.mu)) { Object.assign(meta, metaIn); metaChanged = true; }
    if (tz && meta.tz !== tz) { meta.tz = tz; metaChanged = true; }
    if (changed) for (const id in items) { const it = items[id]; if (it.x && now - it.u > 200 * DAY) delete items[id]; }   // alte Lösch-Merker aufräumen
    const outRev = changed ? next : rev;
    if (!row && !changed && !metaIn && !b.create) return { rev: 0, items: [], meta: { mu: 0, lang: 'tr', name: '', evening: 0, eveningAt: '18:00' }, now, reset: since > 0 };   // wer nichts eingetragen hat, bekommt keinen Platz in der Datenbank
    if (changed || metaChanged || !row) {
      const docS = JSON.stringify({ items });
      if (docS.length > MAX_DOC) return { error: 'full', status: 413 };
      const up = JSON.stringify(buildUp(items, new Date(now).toISOString().slice(0, 10)));
      let res;
      if (!row && ((await db.first(env, 'SELECT COUNT(*) AS n FROM acct')) || { n: 0 }).n >= MAX_ACCTS) return { error: 'full', status: 507 };
      if (!row) res = await db.run(env, 'INSERT OR IGNORE INTO acct (id, rev, doc, meta, up, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', acct, outRev, docS, JSON.stringify(meta), up, now, now);
      else res = await db.run(env, 'UPDATE acct SET rev = ?, doc = ?, meta = ?, up = ?, updated_at = ? WHERE id = ? AND rev = ?', outRev, docS, JSON.stringify(meta), up, now, acct, rev);
      if (!res.meta || !res.meta.changes) continue;      // ein anderes Gerät war gleichzeitig dran: noch einmal
    }
    const out = []; for (const id in items) if (items[id].s > since || since > outRev) out.push(items[id]);
    return { rev: outRev, items: out, meta: { mu: meta.mu || 0, lang: meta.lang || 'tr', name: meta.name || '', evening: meta.evening ? 1 : 0, eveningAt: meta.eveningAt || '18:00' }, now, reset: since > outRev };
  }
  return { error: 'busy', status: 409 };
}

/* ---------------------------------------------------------------- Mitteilungen aufs Handy (Web Push, Inhalt verschlüsselt nach RFC 8291) */
async function vapid(env) {
  const cur = await getKV(env, 'vapid');
  if (cur && cur.pub) return cur;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const v = { jwk: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) };
  await db.run(env, 'INSERT OR IGNORE INTO kv (k, v) VALUES (?, ?)', 'vapid', JSON.stringify(v));
  return (await getKV(env, 'vapid')) || v;
}
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
// Verschlüsselt den Text für genau ein Gerät (aes128gcm). opt ist nur für die Prüfung mit festen Werten gedacht.
export async function pushEncrypt(p256dh, auth, text, opt) {
  const ua = unb64u(p256dh), secret = unb64u(auth);
  if (ua.length !== 65 || ua[0] !== 4 || secret.length !== 16) throw new Error('keys');
  const as = (opt && opt.keys) || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const salt = (opt && opt.salt) || rnd(16);
  const ikm = await hkdf(secret, shared, cat(enc.encode('WebPush: info\0'), ua, asPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, cat(enc.encode(text), new Uint8Array([2]))));
  const head = new Uint8Array(21); head.set(salt, 0); new DataView(head.buffer).setUint32(16, 4096); head[20] = asPub.length;
  return cat(head, asPub, body);
}
function pushHostOk(env, endpoint) {
  let u; try { u = new URL(endpoint); } catch (e) { return false; }
  if (env.TEST === '1' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname)) return true;   // nur für die Prüfung auf dem eigenen Rechner
  return u.protocol === 'https:' && PUSH_HOSTS.test(u.hostname);
}
// Schickt eine Mitteilung an alle Geräte eines Nutzers. msg(lang) liefert { title, body, tag, url }. Ergebnis: Anzahl der Geräte, die sie angenommen haben.
async function pushTo(env, acct, msg, ttl, budget) {
  const subs = await db.all(env, 'SELECT endpoint, p256dh, auth, lang FROM push WHERE acct = ? LIMIT 8', acct);
  if (!subs.length) return 0;
  const v = await vapid(env);
  const key = await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const jwt = {}; let ok = 0;
  for (const s of subs) {
    if (budget && budget.left <= 0) break;
    try {
      if (!pushHostOk(env, s.endpoint)) continue;
      const aud = new URL(s.endpoint).origin;
      if (!jwt[aud]) {
        const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
        const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://xenosmart.de/mustafa/' })));
        const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
        jwt[aud] = head + '.' + body + '.' + b64u(sig);
      }
      const body = await pushEncrypt(s.p256dh, s.auth, JSON.stringify(msg(s.lang)));
      const headers = { TTL: String(ttl || 3600), Urgency: 'high', Authorization: 'vapid t=' + jwt[aud] + ', k=' + v.pub, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream' };
      if (budget) budget.left--;
      const r = await fetch(s.endpoint, { method: 'POST', headers, body });
      if (r.status >= 200 && r.status < 300) { ok++; await db.run(env, 'UPDATE push SET ok_at = ?, fails = 0 WHERE endpoint = ?', Date.now(), s.endpoint); }
      else if (r.status === 404 || r.status === 410) await db.run(env, 'DELETE FROM push WHERE endpoint = ?', s.endpoint);   // Gerät hat die Mitteilungen abbestellt
      else { console.error('push', r.status, (await r.text()).slice(0, 200)); await db.run(env, 'UPDATE push SET fails = fails + 1 WHERE endpoint = ?', s.endpoint); }
    } catch (e) { console.error('push', e && e.message); }
  }
  return ok;
}

/* ---------------------------------------------------------------- Texte der Erinnerungen (Türkisch / Deutsch) */
const WD = { tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'], de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] };
const dateTxt = (d, lang) => WD[lang][new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '.' + d.slice(5, 7) + '.';
function lineOf(e, lang, withTime) {
  const de = lang === 'de';
  let s = '';
  if (withTime && e.h) s += e.h + ' ';
  if (e.t === 'is') s += (de ? 'Arbeit: ' : 'İş: ') + (e.a || (de ? 'Baustelle' : 'şantiye')) + (e.n ? ', ' + e.n + (de ? ' Mann' : ' eleman') : '');
  else if (e.t === 'not') s += (de ? 'Notiz: ' : 'Not: ') + (e.a || '');
  else s += (e.a || 'Termin') + (e.p ? ', ' + e.p : '');
  return s.trim();
}
function textOne(e, kind, lang, today) {
  const de = lang === 'de', diff = dayDiff(e.d, today);
  const what = e.t === 'is' ? (de ? 'steht Arbeit an' : 'iş var') : e.t === 'not' ? (de ? 'steht eine Notiz an' : 'notun var') : (de ? 'hast du einen Termin' : 'terminin var');
  let title;
  if (kind === 'h1') title = de ? 'In 1 Stunde ' + what : '1 saat sonra ' + what;
  else if (diff <= 0) title = (de ? 'Heute ' : 'Bugün ') + what;
  else if (diff === 1) title = (de ? 'Morgen ' : 'Yarın ') + what;
  else if (diff === 2) title = (de ? 'Übermorgen ' : 'Öbür gün ') + what;
  else title = (de ? 'In ' + diff + ' Tagen ' : diff + ' gün sonra ') + what;
  const when = dateTxt(e.d, lang) + (e.h ? (de ? ' um ' + e.h + ' Uhr' : ' saat ' + e.h) : '');
  return { title, body: when + '\n' + lineOf(e, lang, false), tag: 'g-' + e.id + '-' + kind, url: './?d=' + e.d };
}
function textDay(list, lang, d) {
  const de = lang === 'de';
  if (list.length === 1) { const o = textOne(list[0], 'day', lang, d); o.tag = 'g-day-' + d; return o; }
  const lines = list.slice(0, 5).map((e) => lineOf(e, lang, true));
  if (list.length > 5) lines.push(de ? '… und ' + (list.length - 5) + ' weitere' : '… ve ' + (list.length - 5) + ' kayıt daha');
  return { title: de ? 'Heute steht an (' + list.length + ')' : 'Bugünkü program (' + list.length + ')', body: lines.join('\n'), tag: 'g-day-' + d, url: './?d=' + d };
}
const textEve = (lang, d) => lang === 'de'
  ? { title: 'Was wurde heute gemacht?', body: 'Trag den heutigen Tag kurz ins Günlük ein: wer, wo, was.', tag: 'g-eve-' + d, url: './?d=' + d + '&yeni=is' }
  : { title: 'Bugün ne yapıldı?', body: "Bugünün işini Günlük'e yaz: kim, nerede, ne yaptı.", tag: 'g-eve-' + d, url: './?d=' + d + '&yeni=is' };
const textTest = (lang) => lang === 'de'
  ? { title: 'Günlük', body: 'Mitteilungen funktionieren. So erinnere ich dich vor deinen Terminen.', tag: 'g-test', url: './' }
  : { title: 'Günlük', body: 'Bildirimler çalışıyor. Terminlerinden önce böyle haber vereceğim.', tag: 'g-test', url: './' };

/* ---------------------------------------------------------------- Erinnerungs-Lauf */
// Welche Erinnerungen sind für diesen Nutzer jetzt fällig? Rein rechnerisch, ohne Datenbank – so lässt es sich prüfen.
export function dueFor(up, meta, now) {
  const tz = meta && meta.tz && okTz(meta.tz) ? meta.tz : DEF_TZ;
  const loc = localOf(tz, now), today = loc.date, out = [];
  const list = (up && Array.isArray(up.r)) ? up.r : [];
  const dayList = [];
  for (const e of list) {
    if (!e || !isDate(e.d) || !e.r) continue;
    const diff = dayDiff(e.d, today);
    if (diff < 0 || diff > 3) continue;
    const timed = isTime(e.h), start = zoned(tz, e.d, timed ? e.h : '00:00'), end = timed ? start : start + DAY;
    if (now >= end) continue;                                                       // schon vorbei
    const sig = e.d + 'T' + (e.h || '');
    const cand = [];
    if (e.r.d2) cand.push(['d2', timed ? start - 48 * HOUR : zoned(tz, addDays(e.d, -2), '18:00'), 8 * HOUR, 6 * HOUR]);
    if (e.r.d1) cand.push(['d1', timed ? start - 24 * HOUR : zoned(tz, addDays(e.d, -1), '18:00'), 8 * HOUR, 6 * HOUR]);
    if (e.r.h1 && timed) cand.push(['h1', start - HOUR, 55 * MIN, 30 * MIN]);
    for (const [kind, fire, late, ttl] of cand) {
      if (now < fire || now - fire > late) continue;                                // noch nicht dran / zu spät
      if (e.tc && e.tc > fire + MIN) continue;                                      // erst danach eingetragen: der Nutzer weiß es schon
      out.push({ k: e.id + ':' + kind + ':' + sig, ttl: Math.round(ttl / 1000), msg: (lang) => textOne(e, kind, lang, today) });
    }
    if (e.r.day && diff === 0) dayList.push(e);
  }
  // Morgens eine Übersicht über den Tag (07:00 Uhr Ortszeit, bis mittags nachholbar)
  if (dayList.length) {
    const fire = zoned(tz, today, '07:00');
    if (now >= fire && now - fire <= 5 * HOUR) {
      const rest = dayList.filter((e) => !isTime(e.h) || zoned(tz, e.d, e.h) > now).filter((e) => !(e.tc && e.tc > fire + MIN))
        .sort((a, b) => (a.h || '99') < (b.h || '99') ? -1 : 1);
      if (rest.length) out.push({ k: 'day:' + today, ttl: 4 * 3600, msg: (lang) => textDay(rest, lang, today) });
    }
  }
  // Abends: an den Eintrag für heute erinnern (nur wenn eingeschaltet und für heute noch keine Arbeit eingetragen ist)
  if (meta && meta.evening) {
    const at = isTime(meta.eveningAt) ? meta.eveningAt : '18:00', fire = zoned(tz, today, at);
    const wd = (up && Array.isArray(up.wd)) ? up.wd : [];
    if (now >= fire && now - fire <= 3 * HOUR && !wd.includes(today)) out.push({ k: 'eve:' + today, ttl: 3 * 3600, msg: (lang) => textEve(lang, today) });
  }
  return out;
}
export async function tick(env, now) {
  await ensure(env);
  const last = await getKV(env, 'tick');
  if (last && last.t && Date.now() - last.t < 45000 && env.TEST !== '1') return { ok: true, skipped: true };
  await setKV(env, 'tick', { t: Date.now(), clean: (last && last.clean) || 0 });
  const rows = await db.all(env, 'SELECT id, meta, up FROM acct WHERE id IN (SELECT DISTINCT acct FROM push) LIMIT 500');
  const budget = { left: 40 }; let sent = 0, due = 0;
  for (const a of rows) {
    const list = dueFor(parse(a.up, {}), parse(a.meta, {}), now);
    if (!list.length) continue;
    const done = new Set((await db.all(env, 'SELECT k FROM sent WHERE acct = ?', a.id)).map((r) => r.k));
    for (const x of list) {
      if (done.has(x.k)) continue;
      due++;
      if (budget.left <= 0) break;
      const ok = await pushTo(env, a.id, x.msg, x.ttl, budget);
      if (ok) { sent++; await db.run(env, 'INSERT OR IGNORE INTO sent (acct, k, ts) VALUES (?, ?, ?)', a.id, x.k, Date.now()); }
    }
  }
  if (!last || !last.clean || Date.now() - last.clean > DAY) {
    await db.run(env, 'DELETE FROM sent WHERE ts < ?', Date.now() - 12 * DAY);
    await db.run(env, 'DELETE FROM push WHERE fails > 30');
    await setKV(env, 'tick', { t: Date.now(), clean: Date.now() });
  }
  return { ok: true, users: rows.length, due, sent };
}

/* ---------------------------------------------------------------- Anfragen */
function cors(origin) {
  const h = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex', vary: 'Origin' };
  if (origin) { h['access-control-allow-origin'] = origin; h['access-control-allow-methods'] = 'GET, POST, DELETE, OPTIONS'; h['access-control-allow-headers'] = 'authorization, content-type'; h['access-control-max-age'] = '86400'; }
  return h;
}
async function route(request, env) {
  const url = new URL(request.url), m = request.method;
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const J = (data, status = 200) => ({ data, status });
  if (path === 'health') return J({ ok: true, t: Date.now() });
  await ensure(env);
  if (path === 'vapid' && m === 'GET') return J({ key: (await vapid(env)).pub });
  if (path === 'tick' && (m === 'GET' || m === 'POST')) {
    let now = Date.now();
    if (env.TEST === '1' && url.searchParams.get('now')) now = Number(url.searchParams.get('now')) || now;     // nur für die Prüfung
    return J(await tick(env, now));
  }

  const auth = /^Bearer ([A-Za-z0-9_-]{40,64})$/.exec(request.headers.get('authorization') || '');
  if (!auth) return J({ error: 'auth' }, 401);
  const acct = b64u(await crypto.subtle.digest('SHA-256', enc.encode('gunluk:' + auth[1])));
  let b = {};
  if (m === 'POST' || m === 'DELETE') {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ error: 'big' }, 413);
    b = raw ? parse(raw, null) : {};
    if (!b) return J({ error: 'json' }, 400);
  }
  if (path === 'sync' && m === 'POST') {
    const r = await sync(env, acct, b, Date.now());
    return r.error ? J({ error: r.error }, r.status) : J(r);
  }
  if (path === 'push' && m === 'POST') {
    const ep = typeof b.endpoint === 'string' ? b.endpoint.slice(0, 700) : '', p = clean(b.p256dh, 120), a = clean(b.auth, 40);
    if (!pushHostOk(env, ep)) return J({ error: 'endpoint' }, 400);
    try { if (unb64u(p).length !== 65 || unb64u(a).length !== 16) throw 0; } catch (e) { return J({ error: 'keys' }, 400); }
    if (!(await db.first(env, 'SELECT id FROM acct WHERE id = ?', acct))) await sync(env, acct, { create: true, tz: b.tz }, Date.now());
    await db.run(env, 'INSERT INTO push (endpoint, acct, p256dh, auth, lang, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET acct = excluded.acct, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, fails = 0',
      ep, acct, p, a, b.lang === 'de' ? 'de' : 'tr', Date.now());
    return J({ ok: true });
  }
  if (path === 'push' && m === 'DELETE') {
    await db.run(env, 'DELETE FROM push WHERE endpoint = ? AND acct = ?', String(b.endpoint || '').slice(0, 700), acct);
    return J({ ok: true });
  }
  if (path === 'push/test' && m === 'POST') {
    const n = await db.first(env, 'SELECT COUNT(*) AS n FROM push WHERE acct = ?', acct);
    const ok = await pushTo(env, acct, textTest, 600, { left: 8 });
    return J({ ok: ok > 0, devices: n ? n.n : 0, delivered: ok });
  }
  if (path === 'account' && m === 'DELETE') {
    await env.DB.batch([env.DB.prepare('DELETE FROM push WHERE acct = ?').bind(acct), env.DB.prepare('DELETE FROM sent WHERE acct = ?').bind(acct), env.DB.prepare('DELETE FROM acct WHERE id = ?').bind(acct)]);
    return J({ ok: true });
  }
  return J({ error: 'notfound' }, 404);
}

export async function handle(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = origin && ORIGINS.some((re) => re.test(origin)) ? origin : '';
  if (origin && !allowed) return new Response(JSON.stringify({ error: 'origin' }), { status: 403, headers: { 'content-type': 'application/json; charset=utf-8' } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allowed) });
  let out;
  try { out = await route(request, env); }
  catch (e) { console.error('api', e && (e.stack || e.message)); out = { data: { error: 'server' }, status: 500 }; }
  return new Response(JSON.stringify(out.data), { status: out.status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors(allowed)) });
}
