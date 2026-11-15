// Leonn Reservierung und Catering – Schnittstelle (Cloudflare Pages Functions + D1)
// Öffentlich:  /api/config, /api/month, /api/day, /api/reserve, /api/r/<token>[/cancel]
//              /api/catering/config, /api/catering/request, /api/catering/r/<token>[/accept|/cancel]
// Geschützt:   /api/admin/…  (PIN-Anmeldung, Sitzung per Bearer-Token), Catering unter /api/admin/catering[/<id>]
import { RULES as CR, DISHES as CDISHES, OCCASIONS as COCC, calc as catCalc, timeOk as catTimeOk } from '../../catering/core.js';

const DEFAULTS = {
  mode: 'test',              // 'test' = Testbetrieb, 'live' = echter Betrieb
  firstSlot: '09:00', lastSlot: '21:30', slotMin: 30,
  durMin: 120,               // übliche Aufenthaltsdauer im Restaurant
  seats: 60,                 // online gleichzeitig buchbare Plätze (im Admin-Bereich einstellen)
  perSlot: 20,               // höchstens so viele neue Gäste pro Zeitfenster
  maxParty: 9,               // im Restaurant online buchbar bis … Personen
  vip: true, vipMin: 6, vipMax: 15, vipDurMin: 180,
  leadMin: 60,               // frühestens … Minuten vorher
  maxDays: 60,               // höchstens … Tage im Voraus
  closedDates: [], closedWeekdays: [],
  autoConfirm: false,
  keepDays: 60,              // Gästedaten … Tage nach dem Termin entfernen
  phone: '02443 9124069',
};
const ACTIVE = ['pending', 'confirmed', 'seated', 'done'];
const STATUSES = ['pending', 'confirmed', 'declined', 'cancelled', 'seated', 'done', 'noshow'];
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS reservations (
     id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE,
     date TEXT NOT NULL, time TEXT NOT NULL, persons INTEGER NOT NULL, area TEXT NOT NULL DEFAULT 'r',
     name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '',
     lang TEXT NOT NULL DEFAULT 'de', status TEXT NOT NULL DEFAULT 'pending', source TEXT NOT NULL DEFAULT 'web',
     tbl TEXT NOT NULL DEFAULT '', admin_note TEXT NOT NULL DEFAULT '', test INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS idx_res_date ON reservations(date, time)',
  'CREATE INDEX IF NOT EXISTS idx_res_status ON reservations(status, date)',
  'CREATE INDEX IF NOT EXISTS idx_res_updated ON reservations(updated_at)',
  "CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY AUTOINCREMENT, res_id INTEGER NOT NULL, ts INTEGER NOT NULL, action TEXT NOT NULL, who TEXT NOT NULL DEFAULT '')",
  'CREATE INDEX IF NOT EXISTS idx_log_res ON log(res_id)',
  "CREATE TABLE IF NOT EXISTS sessions (th TEXT PRIMARY KEY, device TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
  'CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, ih TEXT NOT NULL, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_hits ON hits(kind, ts)',
  "CREATE TABLE IF NOT EXISTS push (endpoint TEXT PRIMARY KEY, th TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, p256dh TEXT NOT NULL DEFAULT '', auth TEXT NOT NULL DEFAULT '', lang TEXT NOT NULL DEFAULT 'de')",
  // Catering-Anfragen: total und deposit in Cent; data = gespeicherte Auswahl mit den Preisen zum Zeitpunkt der Anfrage
  `CREATE TABLE IF NOT EXISTS catering (
     id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE,
     date TEXT NOT NULL, time TEXT NOT NULL, guests INTEGER NOT NULL, occasion TEXT NOT NULL DEFAULT '',
     name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '',
     lang TEXT NOT NULL DEFAULT 'de', status TEXT NOT NULL DEFAULT 'pending', total INTEGER NOT NULL DEFAULT 0, deposit INTEGER NOT NULL DEFAULT 0,
     data TEXT NOT NULL DEFAULT '{}', admin_note TEXT NOT NULL DEFAULT '', test INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS idx_cat_status ON catering(status, date)',
  'CREATE INDEX IF NOT EXISTS idx_cat_updated ON catering(updated_at)',
  "CREATE TABLE IF NOT EXISTS clog (id INTEGER PRIMARY KEY AUTOINCREMENT, cat_id INTEGER NOT NULL, ts INTEGER NOT NULL, action TEXT NOT NULL, who TEXT NOT NULL DEFAULT '')",
  'CREATE INDEX IF NOT EXISTS idx_clog ON clog(cat_id)',
];
const CSTATUSES = ['pending', 'offered', 'confirmed', 'paid', 'done', 'declined', 'cancelled'];
const ORIGINS = [/^https:\/\/(www\.)?xenosmart\.de$/, /^https:\/\/([a-z0-9-]+\.)?leonn[a-z0-9-]*\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|notify\.windows\.com)$/;
const SESSION_DAYS = 45;

/* ---------------------------------------------------------------- Hilfen */
const J = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex' } });
const bad = (error, status = 400, extra) => J(Object.assign({ error }, extra || {}), status);
const enc = new TextEncoder();
const b64u = (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
const sha = async (s) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const rnd = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
const toMin = (s) => { const m = /^(\d{2}):(\d{2})$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN; };
const fromMin = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const weekday = (d) => new Date(d + 'T00:00:00Z').getUTCDay();
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanMulti = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const intIn = (v, a, b) => { const n = Number(v); return Number.isInteger(n) && n >= a && n <= b ? n : null; };
function berlin() {
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  return { date: s.slice(0, 10), time: s.slice(11, 16).replace(/^24/, '00') };
}
const db = {
  all: async (env, sql, ...p) => ((await env.DB.prepare(sql).bind(...p).all()).results || []),
  first: (env, sql, ...p) => env.DB.prepare(sql).bind(...p).first(),
  run: (env, sql, ...p) => env.DB.prepare(sql).bind(...p).run(),
};
let schemaOk = false;
async function ensure(env) { if (schemaOk) return; await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s))); schemaOk = true; }
async function loadKV(env) {
  const rows = await db.all(env, 'SELECT k, v FROM settings'), o = {};
  for (const r of rows) { try { o[r.k] = JSON.parse(r.v); } catch (e) { o[r.k] = null; } }
  return o;
}
const setKV = (env, k, v) => db.run(env, 'INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, JSON.stringify(v));
const delKV = (env, k) => db.run(env, 'DELETE FROM settings WHERE k = ?', k);
const cfgOf = (kv) => Object.assign({}, DEFAULTS, kv.cfg || {});
function slotsOf(S) { const out = []; for (let m = toMin(S.firstSlot); m <= toMin(S.lastSlot); m += S.slotMin) out.push(fromMin(m)); return out; }
function dayClosed(S, date, now) {
  if (date < now.date) return 'past';
  if (date > addDays(now.date, S.maxDays)) return 'far';
  if (S.closedDates.includes(date) || S.closedWeekdays.includes(weekday(date))) return 'closed';
  return null;
}
// Freie Zeiten eines Tages. rows = Reservierungen dieses Tages.
function computeDay(S, date, rows, persons, area, now, opt) {
  opt = opt || {};
  const step = S.slotMin, out = [];
  const act = rows.filter((r) => ACTIVE.includes(r.status) && r.id !== opt.ignoreId);
  const rr = act.filter((r) => r.area !== 'v').map((r) => ({ a: toMin(r.time), b: toMin(r.time) + S.durMin, n: r.persons }));
  const vv = act.filter((r) => r.area === 'v').map((r) => ({ a: toMin(r.time), b: toMin(r.time) + S.vipDurMin }));
  const edge = date === now.date ? toMin(now.time) + (opt.admin ? -60 : S.leadMin) : -1e9;
  const few = Math.max(4, Math.round(S.seats * 0.15));
  for (const t of slotsOf(S)) {
    const a = toMin(t);
    if (a < edge) { out.push({ t, s: 'past', left: 0 }); continue; }
    if (area === 'v') {
      const b = a + S.vipDurMin, busy = vv.some((x) => x.a < b && x.b > a);
      out.push({ t, s: busy ? 'full' : 'free', left: busy ? 0 : S.vipMax });
    } else {
      let peak = 0;
      for (let x = a; x < a + S.durMin; x += step) { let c = 0; for (const r of rr) if (r.a <= x && r.b > x) c += r.n; if (c > peak) peak = c; }
      let arr = 0; for (const r of rr) if (r.a === a) arr += r.n;
      const left = Math.max(0, Math.min(S.seats - peak, S.perSlot - arr));
      out.push({ t, s: left < persons ? 'full' : (left - persons < few ? 'few' : 'free'), left });
    }
  }
  return out;
}
function partyOk(S, persons, area) {
  if (area === 'v') return S.vip && persons >= S.vipMin && persons <= S.vipMax;
  return persons >= 1 && persons <= S.maxParty;
}
async function ipHash(request, kv, env) {
  let salt = kv.salt;
  if (!salt) { salt = b64u(rnd(16)); await setKV(env, 'salt', salt); kv.salt = salt; }
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '0';
  return (await sha(salt + '|' + ip)).slice(0, 22);
}
const hitCount = async (env, kind, since, ih) => {
  const r = ih ? await db.first(env, 'SELECT COUNT(*) AS n FROM hits WHERE kind = ? AND ts > ? AND ih = ?', kind, since, ih)
               : await db.first(env, 'SELECT COUNT(*) AS n FROM hits WHERE kind = ? AND ts > ?', kind, since);
  return r ? r.n : 0;
};
const hit = (env, kind, ih) => db.run(env, 'INSERT INTO hits (kind, ih, ts) VALUES (?, ?, ?)', kind, ih, Date.now());
const pubRes = (r) => ({ code: r.code, date: r.date, time: r.time, persons: r.persons, area: r.area, name: r.name, status: r.status, test: !!r.test, lang: r.lang });
const admRes = (r) => ({ id: r.id, code: r.code, token: r.token, date: r.date, time: r.time, persons: r.persons, area: r.area, name: r.name, phone: r.phone, email: r.email, note: r.note, lang: r.lang, status: r.status, source: r.source, tbl: r.tbl, admin_note: r.admin_note, test: !!r.test, created_at: r.created_at, updated_at: r.updated_at });
async function newCode(env) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    const b = rnd(5); let c = 'L'; for (const x of b) c += A[x % A.length];
    if (!(await db.first(env, 'SELECT id FROM reservations WHERE code = ?', c))) return c;
  }
  return 'L' + b64u(rnd(6)).replace(/[^A-Za-z0-9]/g, 'X').toUpperCase();
}

/* ---------------------------------------------------------------- Benachrichtigung aufs Handy (Web Push, Inhalt verschlüsselt nach RFC 8291) */
async function vapid(env, kv) {
  if (kv.vapid && kv.vapid.pub) return kv.vapid;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const v = { jwk: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) };
  await setKV(env, 'vapid', v); kv.vapid = v;
  return v;
}
const cat = (...a) => { const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let o = 0; for (const x of a) { out.set(x, o); o += x.length; } return out; };
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
// Verschlüsselt den Text für genau ein Gerät (aes128gcm). opt ist nur für die Prüfung mit festen Werten gedacht.
async function pushEncrypt(p256dh, auth, text, opt) {
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
// Kurzer Text fürs Handy – ohne Namen, damit auf dem Sperrbildschirm keine Gästedaten stehen
function pushText(msg, lang) {
  const tr = lang === 'tr';
  if (!msg || msg.k === 'test') return { title: 'Leonn', body: tr ? 'Bildirimler çalışıyor.' : 'Mitteilungen funktionieren.', tag: 'leonn-test' };
  let when = msg.date;
  try { when = new Intl.DateTimeFormat(tr ? 'tr-TR' : 'de-DE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(msg.date + 'T12:00:00Z')); } catch (e) {}
  if (msg.k === 'cnew' || msg.k === 'caccept' || msg.k === 'ccancel') {
    const ct = msg.k === 'cnew' ? (tr ? 'Yeni catering talebi' : 'Neue Catering-Anfrage') : msg.k === 'caccept' ? (tr ? 'Catering teklifi kabul edildi' : 'Catering-Angebot angenommen') : (tr ? 'Catering iptal edildi' : 'Catering storniert');
    return { title: ct, body: when + ' · ' + msg.guests + (tr ? ' misafir' : ' Gäste'), tag: 'leonn-' + msg.k + '-' + (msg.id || 0) };
  }
  const title = msg.k === 'cancel' ? (tr ? 'Misafir iptal etti' : 'Gast hat storniert') : msg.k === 'auto' ? (tr ? 'Yeni rezervasyon' : 'Neue Reservierung') : (tr ? 'Yeni rezervasyon talebi' : 'Neue Reservierungsanfrage');
  const body = when + ' · ' + msg.time + (tr ? '' : ' Uhr') + ' · ' + msg.persons + (tr ? ' kişi' : (msg.persons === 1 ? ' Person' : ' Personen')) + (msg.area === 'v' ? ' · V.I.P Room' : '');
  return { title, body, tag: 'leonn-' + msg.k + '-' + (msg.id || 0) };
}
async function pushAll(env, kv, msg) {
  try {
    const subs = await db.all(env, 'SELECT endpoint, p256dh, auth, lang FROM push LIMIT 40');
    if (!subs.length) return;
    const v = await vapid(env, kv);
    const key = await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const jwt = {};
    await Promise.all(subs.map(async (s) => {
      try {
        const aud = new URL(s.endpoint).origin;
        if (!jwt[aud]) {
          const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
          const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://xenosmart.de/leon/' })));
          const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
          jwt[aud] = head + '.' + body + '.' + b64u(sig);
        }
        const headers = { TTL: '3600', Urgency: 'high', Authorization: 'vapid t=' + jwt[aud] + ', k=' + v.pub };
        let body = null;   // ohne Schlüssel des Geräts: Mitteilung ohne Inhalt, die App zeigt dann einen allgemeinen Text
        if (s.p256dh && s.auth) { try { body = await pushEncrypt(s.p256dh, s.auth, JSON.stringify(pushText(msg, s.lang))); headers['Content-Encoding'] = 'aes128gcm'; headers['Content-Type'] = 'application/octet-stream'; } catch (e) { body = null; } }
        const r = await fetch(s.endpoint, body ? { method: 'POST', headers, body } : { method: 'POST', headers });
        if (r.status === 404 || r.status === 410) await db.run(env, 'DELETE FROM push WHERE endpoint = ?', s.endpoint);
      } catch (e) { /* einzelnes Gerät nicht erreichbar */ }
    }));
  } catch (e) { console.error('push', e && e.message); }
}

/* ---------------------------------------------------------------- PIN und Sitzungen */
async function pinHash(pin, saltB64) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64u(saltB64), iterations: 5000 }, key, 256));
}
const pinValid = (p) => typeof p === 'string' && /^\d{6,12}$/.test(p);
async function newSession(env, device) {
  const token = b64u(rnd(32)), now = Date.now();
  await db.run(env, 'INSERT INTO sessions (th, device, created_at, seen_at, expires_at) VALUES (?, ?, ?, ?, ?)', await sha(token), clean(device, 40), now, now, now + SESSION_DAYS * 864e5);
  return token;
}
async function auth(request, env) {
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  const th = await sha(h.slice(7).trim()), now = Date.now();
  const s = await db.first(env, 'SELECT th, device, seen_at, expires_at FROM sessions WHERE th = ?', th);
  if (!s || s.expires_at < now) return null;
  if (now - s.seen_at > 3600e3) await db.run(env, 'UPDATE sessions SET seen_at = ?, expires_at = ? WHERE th = ?', now, now + SESSION_DAYS * 864e5, th);
  return s;
}
// Sperre gegen Durchprobieren: je Gerät/Netz 5 Fehlversuche in 15 Min., insgesamt 20 in 15 Min. und 60 am Tag
async function locked(env, ih) {
  const now = Date.now();
  if (await hitCount(env, 'pinfail', now - 15 * 60e3, ih) >= 5) return 15;
  if (await hitCount(env, 'pinfail', now - 15 * 60e3) >= 20) return 15;
  if (await hitCount(env, 'pinfail', now - 864e5) >= 60) return 60;
  return 0;
}

/* ---------------------------------------------------------------- Aufräumen (höchstens einmal täglich) */
async function cleanup(env, kv, S, now) {
  if (kv.lastClean === now.date) return;
  await setKV(env, 'lastClean', now.date);
  const t = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM hits WHERE ts < ?').bind(t - 2 * 864e5),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    env.DB.prepare("UPDATE reservations SET name = '–', phone = '', email = '', note = '', admin_note = '', token = 'x' || id || '-' || code WHERE date < ? AND name <> '–'").bind(addDays(now.date, -Math.max(7, S.keepDays))),
    env.DB.prepare('DELETE FROM log WHERE ts < ?').bind(t - 400 * 864e5),
    env.DB.prepare("UPDATE catering SET name = '–', phone = '', email = '', address = '', note = '', admin_note = '', token = 'x' || id || '-' || code WHERE date < ? AND name <> '–'").bind(addDays(now.date, -Math.max(7, S.keepDays))),
    env.DB.prepare('DELETE FROM clog WHERE ts < ?').bind(t - 400 * 864e5),
  ]);
}

/* ---------------------------------------------------------------- Öffentlicher Teil */
async function apiConfig(env, kv) {
  const S = cfgOf(kv), now = berlin();
  return J({ mode: S.mode, firstSlot: S.firstSlot, lastSlot: S.lastSlot, slotMin: S.slotMin, maxParty: S.maxParty, vip: S.vip, vipMin: S.vipMin, vipMax: S.vipMax, maxDays: S.maxDays, phone: S.phone, autoConfirm: S.autoConfirm, today: now.date, now: now.time });
}
function readParty(url, S) {
  const area = url.searchParams.get('area') === 'v' ? 'v' : 'r';
  const persons = intIn(url.searchParams.get('persons'), 1, 99) || 2;
  return { area, persons };
}
async function apiMonth(env, kv, url) {
  const S = cfgOf(kv), now = berlin(), ym = url.searchParams.get('ym') || '';
  if (!/^\d{4}-\d{2}$/.test(ym)) return bad('ym');
  const { area, persons } = readParty(url, S);
  const from = ym + '-01', last = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate(), to = ym + '-' + String(last).padStart(2, '0');
  const rows = await db.all(env, "SELECT id, date, time, persons, area, status FROM reservations WHERE date >= ? AND date <= ? AND status IN ('pending','confirmed','seated','done')", from, to);
  const by = {}; for (const r of rows) (by[r.date] = by[r.date] || []).push(r);
  const days = {}, ok = partyOk(S, persons, area);
  for (let d = 1; d <= last; d++) {
    const date = ym + '-' + String(d).padStart(2, '0'), c = dayClosed(S, date, now);
    if (c) { days[date] = c; continue; }
    if (!ok) { days[date] = 'full'; continue; }
    const sl = computeDay(S, date, by[date] || [], persons, area, now);
    days[date] = sl.some((x) => x.s === 'free') ? 'free' : (sl.some((x) => x.s === 'few') ? 'few' : 'full');
  }
  return J({ ym, days, today: now.date });
}
async function apiDay(env, kv, url) {
  const S = cfgOf(kv), now = berlin(), date = url.searchParams.get('date') || '';
  if (!isDate(date)) return bad('date');
  const { area, persons } = readParty(url, S);
  const c = dayClosed(S, date, now);
  if (c) return J({ date, state: c, slots: [] });
  if (!partyOk(S, persons, area)) return J({ date, state: 'party', slots: [] });
  const rows = await db.all(env, "SELECT id, date, time, persons, area, status FROM reservations WHERE date = ? AND status IN ('pending','confirmed','seated','done')", date);
  return J({ date, state: 'open', slots: computeDay(S, date, rows, persons, area, now).map((x) => ({ t: x.t, s: x.s })) });
}
function readGuest(b, needContact) {
  const o = { name: clean(b.name, 80), phone: clean(b.phone, 30), email: clean(b.email, 120).toLowerCase(), note: cleanMulti(b.note, 400), lang: ['de', 'tr', 'en'].includes(b.lang) ? b.lang : 'de' };
  const err = [];
  if (o.name.length < 2) err.push('name');
  const digits = o.phone.replace(/\D/g, '').length;
  if (needContact ? digits < 6 : (o.phone && digits < 6)) err.push('phone');
  if (o.phone && !/^[0-9+()\/\-\s.]+$/.test(o.phone)) err.push('phone');
  const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email);
  if (needContact ? !mailOk : (o.email && !mailOk)) err.push('email');
  return { o, err: [...new Set(err)] };
}
async function apiReserve(ctx, env, kv, request) {
  let b; try { b = await request.json(); } catch (e) { return bad('json'); }
  if (!b || typeof b !== 'object') return bad('json');
  const S = cfgOf(kv), now = berlin();
  // einfache Schutzmaßnahmen gegen Automaten
  if (clean(b.web, 50) || !(Number(b.el) > 2500)) return bad('blocked', 400);
  const ih = await ipHash(request, kv, env), t = Date.now();
  if (await hitCount(env, 'res', t - 3600e3, ih) >= 6 || await hitCount(env, 'res', t - 864e5, ih) >= 12 || await hitCount(env, 'res', t - 864e5) >= 400) return bad('rate', 429);
  const date = String(b.date || ''), time = String(b.time || ''), area = b.area === 'v' ? 'v' : 'r', persons = intIn(b.persons, 1, 99);
  if (!isDate(date) || !slotsOf(S).includes(time) || !persons) return bad('fields', 400, { fields: ['date'] });
  if (b.consent !== true) return bad('fields', 400, { fields: ['consent'] });
  const { o, err } = readGuest(b, true);
  if (err.length) return bad('fields', 400, { fields: err });
  const c = dayClosed(S, date, now);
  if (c) return bad('closed', 409);
  if (!partyOk(S, persons, area)) return bad('party', 409);
  const rows = await db.all(env, "SELECT id, date, time, persons, area, status FROM reservations WHERE date = ? AND status IN ('pending','confirmed','seated','done')", date);
  const slot = computeDay(S, date, rows, persons, area, now).find((x) => x.t === time);
  if (!slot || slot.s === 'full' || slot.s === 'past') return bad('full', 409);
  // dieselbe Anfrage nicht doppelt anlegen (z. B. doppelter Tipp)
  const dup = await db.first(env, "SELECT code, token, status, test FROM reservations WHERE date = ? AND time = ? AND persons = ? AND area = ? AND phone = ? AND status IN ('pending','confirmed') AND created_at > ?", date, time, persons, area, o.phone, t - 10 * 60e3);
  if (dup) return J({ ok: true, code: dup.code, token: dup.token, status: dup.status, test: !!dup.test });
  const code = await newCode(env), token = b64u(rnd(24)), status = S.autoConfirm ? 'confirmed' : 'pending', test = S.mode === 'live' ? 0 : 1;
  const ins = await db.run(env, 'INSERT INTO reservations (code, token, date, time, persons, area, name, phone, email, note, lang, status, source, test, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    code, token, date, time, persons, area, o.name, o.phone, o.email, o.note, o.lang, status, 'web', test, t, t);
  const id = ins.meta && ins.meta.last_row_id;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO log (res_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(id || 0, t, status === 'confirmed' ? 'created_auto' : 'created', 'web'),
    env.DB.prepare('INSERT INTO hits (kind, ih, ts) VALUES (?, ?, ?)').bind('res', ih, t),
  ]);
  ctx.waitUntil(pushAll(env, kv, { k: status === 'confirmed' ? 'auto' : 'new', id, date, time, persons, area }));
  return J({ ok: true, code, token, status, test: !!test });
}
async function apiGuest(ctx, env, kv, request, token, action) {
  if (!/^[A-Za-z0-9_-]{20,60}$/.test(token)) return bad('not_found', 404);
  const r = await db.first(env, 'SELECT * FROM reservations WHERE token = ?', token);
  if (!r) return bad('not_found', 404);
  const now = berlin(), future = r.date > now.date || (r.date === now.date && r.time > now.time);
  const canCancel = future && (r.status === 'pending' || r.status === 'confirmed');
  if (!action) return J(Object.assign(pubRes(r), { canCancel }));
  if (action === 'cancel' && request.method === 'POST') {
    if (!canCancel) return bad('state', 409);
    const t = Date.now();
    await env.DB.batch([
      env.DB.prepare("UPDATE reservations SET status = 'cancelled', updated_at = ? WHERE id = ?").bind(t, r.id),
      env.DB.prepare('INSERT INTO log (res_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(r.id, t, 'cancelled_guest', 'web'),
    ]);
    ctx.waitUntil(pushAll(env, kv, { k: 'cancel', id: r.id, date: r.date, time: r.time, persons: r.persons, area: r.area }));
    r.status = 'cancelled';
    return J(Object.assign(pubRes(r), { canCancel: false }));
  }
  return bad('not_found', 404);
}

/* ---------------------------------------------------------------- Catering (öffentlicher Teil) */
const catData = (r) => { try { const d = JSON.parse(r.data); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } };
const pubCat = (r) => { const d = catData(r); return { code: r.code, date: r.date, time: r.time, guests: r.guests, occasion: r.occasion, name: r.name, status: r.status, test: !!r.test, lang: r.lang, total: r.total, deposit: r.deposit, data: { lines: d.lines || [], extra: d.extra || [], pp: d.pp || 0, food: d.food || 0, disc: d.disc || 0, rate: d.rate || 0, grams: d.grams || 0 } }; };
const admCat = (r) => ({ id: r.id, code: r.code, token: r.token, date: r.date, time: r.time, guests: r.guests, occasion: r.occasion, name: r.name, phone: r.phone, email: r.email, address: r.address, note: r.note, lang: r.lang, status: r.status, total: r.total, deposit: r.deposit, data: catData(r), admin_note: r.admin_note, test: !!r.test, created_at: r.created_at, updated_at: r.updated_at });
async function newCatCode(env) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    const b = rnd(5); let c = 'C'; for (const x of b) c += A[x % A.length];
    if (!(await db.first(env, 'SELECT id FROM catering WHERE code = ?', c))) return c;
  }
  return 'C' + b64u(rnd(6)).replace(/[^A-Za-z0-9]/g, 'X').toUpperCase();
}
async function catInfo(env) {
  const o = await db.first(env, "SELECT COUNT(*) AS n FROM catering WHERE status = 'pending'"), u = await db.first(env, 'SELECT MAX(updated_at) AS u FROM catering');
  return { open: o ? o.n : 0, ts: (u && u.u) || 0 };
}
async function apiCatConfig(env, kv) {
  const S = cfgOf(kv), now = berlin();
  return J({ mode: S.mode, today: now.date, phone: S.phone, minGuests: CR.minGuests, maxGuests: CR.maxGuests, leadDays: CR.leadDays, maxDays: CR.maxDays });
}
async function apiCatRequest(ctx, env, kv, request) {
  let b; try { b = await request.json(); } catch (e) { return bad('json'); }
  if (!b || typeof b !== 'object') return bad('json');
  const S = cfgOf(kv), now = berlin();
  if (clean(b.web, 50) || !(Number(b.el) > 2500)) return bad('blocked', 400);
  const ih = await ipHash(request, kv, env), t = Date.now();
  if (await hitCount(env, 'cat', t - 3600e3, ih) >= 4 || await hitCount(env, 'cat', t - 864e5, ih) >= 8 || await hitCount(env, 'cat', t - 864e5) >= 200) return bad('rate', 429);
  const date = String(b.date || ''), time = String(b.time || ''), guests = intIn(b.guests, CR.minGuests, CR.maxGuests), f = [];
  if (!isDate(date) || date < addDays(now.date, CR.leadDays) || date > addDays(now.date, CR.maxDays)) f.push('date');
  if (!catTimeOk(time)) f.push('time');
  if (!guests) f.push('guests');
  const known = new Set(CDISHES.map((d) => d.id));
  const sel = Array.isArray(b.sel) ? [...new Set(b.sel.filter((x) => typeof x === 'string' && known.has(x)))] : [];
  if (sel.length < CR.minDishes) f.push('sel');
  if (b.consent !== true) f.push('consent');
  const { o, err } = readGuest(b, false);
  if (o.phone.replace(/\D/g, '').length < 6) err.push('phone');
  const address = clean(b.address, 160);
  if (address.length < 5) err.push('address');
  const fields = [...new Set(f.concat(err))];
  if (fields.length) return bad('fields', 400, { fields });
  // Preis immer hier berechnen, nie eine Summe aus dem Browser übernehmen
  const c = catCalc({ guests, sel, drinks: b.drinks, ware: b.ware, staff: b.staff, hours: b.hours, deko: b.deko === true, deliv: b.deliv });
  const occasion = COCC.includes(b.occasion) ? b.occasion : 'Sonstiges';
  const dup = await db.first(env, "SELECT code, token, status, test, total, deposit FROM catering WHERE date = ? AND guests = ? AND phone = ? AND total = ? AND status IN ('pending','offered') AND created_at > ?", date, guests, o.phone, c.total, t - 10 * 60e3);
  if (dup) return J({ ok: true, code: dup.code, token: dup.token, status: dup.status, test: !!dup.test, total: dup.total, deposit: dup.deposit });
  const code = await newCatCode(env), token = b64u(rnd(24)), test = S.mode === 'live' ? 0 : 1;
  const data = JSON.stringify({ sel: c.order.sel, drinks: c.order.drinks, ware: c.order.ware, staff: c.order.staff, hours: c.order.hours, deko: c.order.deko, deliv: c.order.deliv, pp: c.pp, grams: c.grams, rate: c.rate, food: c.food, disc: c.disc, lines: c.lines, extra: c.extra });
  const ins = await db.run(env, 'INSERT INTO catering (code, token, date, time, guests, occasion, name, phone, email, address, note, lang, status, total, deposit, data, test, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    code, token, date, time, guests, occasion, o.name, o.phone, o.email, address, o.note, o.lang, 'pending', c.total, c.dep, data, test, t, t);
  const id = ins.meta && ins.meta.last_row_id;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO clog (cat_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(id || 0, t, 'created', 'web'),
    env.DB.prepare('INSERT INTO hits (kind, ih, ts) VALUES (?, ?, ?)').bind('cat', ih, t),
  ]);
  ctx.waitUntil(pushAll(env, kv, { k: 'cnew', id, date, guests }));
  return J({ ok: true, code, token, status: 'pending', test: !!test, total: c.total, deposit: c.dep });
}
async function apiCatGuest(ctx, env, kv, request, token, action) {
  if (!/^[A-Za-z0-9_-]{20,60}$/.test(token)) return bad('not_found', 404);
  const r = await db.first(env, 'SELECT * FROM catering WHERE token = ?', token);
  if (!r) return bad('not_found', 404);
  const now = berlin(), future = r.date > now.date;
  const canCancel = future && (r.status === 'pending' || r.status === 'offered'), canAccept = future && r.status === 'offered';
  if (!action) return J(Object.assign(pubCat(r), { canCancel, canAccept }));
  if (request.method !== 'POST' || (action !== 'cancel' && action !== 'accept')) return bad('not_found', 404);
  if (action === 'cancel' ? !canCancel : !canAccept) return bad('state', 409);
  const t = Date.now(), status = action === 'cancel' ? 'cancelled' : 'confirmed';
  await env.DB.batch([
    env.DB.prepare('UPDATE catering SET status = ?, updated_at = ? WHERE id = ?').bind(status, t, r.id),
    env.DB.prepare('INSERT INTO clog (cat_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(r.id, t, action === 'cancel' ? 'cancelled_guest' : 'accepted_guest', 'web'),
  ]);
  ctx.waitUntil(pushAll(env, kv, { k: action === 'cancel' ? 'ccancel' : 'caccept', id: r.id, date: r.date, guests: r.guests }));
  r.status = status;
  return J(Object.assign(pubCat(r), { canCancel: false, canAccept: false }));
}

/* ---------------------------------------------------------------- Admin-Teil */
function cfgPatch(S, b) {
  const out = Object.assign({}, S), err = [];
  const num = (k, a, z) => { if (b[k] !== undefined) { const n = intIn(b[k], a, z); if (n === null) err.push(k); else out[k] = n; } };
  const tm = (k) => { if (b[k] !== undefined) { if (isNaN(toMin(b[k]))) err.push(k); else out[k] = b[k]; } };
  const bool = (k) => { if (b[k] !== undefined) out[k] = !!b[k]; };
  if (b.mode !== undefined) { if (b.mode === 'test' || b.mode === 'live') out.mode = b.mode; else err.push('mode'); }
  tm('firstSlot'); tm('lastSlot');
  if (b.slotMin !== undefined) { if ([15, 30, 60].includes(Number(b.slotMin))) out.slotMin = Number(b.slotMin); else err.push('slotMin'); }
  num('durMin', 30, 300); num('seats', 1, 500); num('perSlot', 1, 500); num('maxParty', 1, 40);
  bool('vip'); num('vipMin', 1, 40); num('vipMax', 1, 60); num('vipDurMin', 30, 480);
  num('leadMin', 0, 2880); num('maxDays', 1, 365); num('keepDays', 7, 730); bool('autoConfirm');
  if (b.phone !== undefined) out.phone = clean(b.phone, 30);
  if (b.closedDates !== undefined) { if (Array.isArray(b.closedDates) && b.closedDates.length <= 200 && b.closedDates.every(isDate)) out.closedDates = [...new Set(b.closedDates)].sort(); else err.push('closedDates'); }
  if (b.closedWeekdays !== undefined) { if (Array.isArray(b.closedWeekdays) && b.closedWeekdays.every((x) => Number.isInteger(x) && x >= 0 && x <= 6)) out.closedWeekdays = [...new Set(b.closedWeekdays)].sort(); else err.push('closedWeekdays'); }
  if (!(toMin(out.firstSlot) <= toMin(out.lastSlot))) err.push('lastSlot');
  if (out.vipMin > out.vipMax) err.push('vipMax');
  return { out, err: [...new Set(err)] };
}
async function adminOpen(ctx, env, kv, request, seg) {
  // ohne Anmeldung erreichbar: Zustand, Ersteinrichtung, Anmeldung
  if (seg === 'state' && request.method === 'GET') return J({ setup: !!kv.pin, canSetup: !kv.pin && !!kv.setup, mode: cfgOf(kv).mode });
  if (request.method !== 'POST') return null;
  if (seg !== 'setup' && seg !== 'login') return null;
  let b; try { b = await request.json(); } catch (e) { return bad('json'); }
  const ih = await ipHash(request, kv, env), wait = await locked(env, ih);
  if (wait) return bad('locked', 429, { minutes: wait });
  if (seg === 'setup') {
    if (kv.pin || !kv.setup) return bad('done', 409);
    if (!pinValid(b.pin)) return bad('pin', 400);
    if ((await sha('setup|' + clean(b.code, 60).toUpperCase().replace(/[^A-Z0-9]/g, ''))) !== kv.setup) { await hit(env, 'pinfail', ih); return bad('code', 403); }
    const salt = b64u(rnd(16));
    await setKV(env, 'pin', { salt, hash: await pinHash(b.pin, salt) });
    await delKV(env, 'setup');
    return J({ ok: true, token: await newSession(env, b.device) });
  }
  if (!kv.pin) return bad('setup', 409);
  if (!pinValid(b.pin) || (await pinHash(b.pin, kv.pin.salt)) !== kv.pin.hash) { await hit(env, 'pinfail', ih); return bad('pin', 403, { left: Math.max(0, 4 - await hitCount(env, 'pinfail', Date.now() - 15 * 60e3, ih)) }); }
  return J({ ok: true, token: await newSession(env, b.device) });
}
async function admin(ctx, env, kv, request, url, seg, rest) {
  const open = await adminOpen(ctx, env, kv, request, seg);
  if (open) return open;
  const ses = await auth(request, env);
  if (!ses) return bad('auth', 401);
  const S = cfgOf(kv), now = berlin(), m = request.method, who = ses.device || 'Admin';
  let b = null;
  if (m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE') { try { b = await request.json(); } catch (e) { b = {}; } if (!b || typeof b !== 'object') b = {}; }
  await cleanup(env, kv, S, now);

  if (seg === 'logout' && m === 'POST') { await db.run(env, 'DELETE FROM sessions WHERE th = ?', ses.th); return J({ ok: true }); }
  if (seg === 'pin' && m === 'POST') {
    if (!pinValid(b.pin) || !pinValid(b.old)) return bad('pin', 400);
    if ((await pinHash(b.old, kv.pin.salt)) !== kv.pin.hash) return bad('old', 403);
    const salt = b64u(rnd(16));
    await setKV(env, 'pin', { salt, hash: await pinHash(b.pin, salt) });
    await db.run(env, 'DELETE FROM sessions WHERE th <> ?', ses.th);
    return J({ ok: true });
  }
  if (seg === 'settings') {
    if (m === 'GET') return J({ cfg: S, defaults: DEFAULTS, devices: (await db.all(env, 'SELECT device, seen_at, created_at FROM sessions WHERE expires_at > ? ORDER BY seen_at DESC LIMIT 20', Date.now())) });
    if (m === 'PUT') {
      const { out, err } = cfgPatch(S, b);
      if (err.length) return bad('fields', 400, { fields: err });
      await setKV(env, 'cfg', out);
      return J({ ok: true, cfg: out });
    }
  }
  if (seg === 'list' && m === 'GET') {
    const from = url.searchParams.get('from') || now.date, to = url.searchParams.get('to') || from;
    if (!isDate(from) || !isDate(to)) return bad('date');
    const rows = await db.all(env, 'SELECT * FROM reservations WHERE date >= ? AND date <= ? ORDER BY date, time, id LIMIT 1500', from, to);
    const pend = await db.all(env, "SELECT * FROM reservations WHERE status = 'pending' AND date >= ? ORDER BY date, time, id LIMIT 300", now.date);
    return J({ rows: rows.map(admRes), pending: pend.map(admRes), today: now.date, time: now.time, ts: Date.now(), mode: S.mode, cat: await catInfo(env) });
  }
  if (seg === 'poll' && m === 'GET') {
    const since = Number(url.searchParams.get('since')) || 0;
    const rows = await db.all(env, 'SELECT * FROM reservations WHERE updated_at > ? ORDER BY updated_at LIMIT 300', since);
    const p = await db.first(env, "SELECT COUNT(*) AS n FROM reservations WHERE status = 'pending' AND date >= ?", now.date);
    return J({ rows: rows.map(admRes), pending: p ? p.n : 0, today: now.date, time: now.time, ts: Date.now(), mode: S.mode, cat: await catInfo(env) });
  }
  if (seg === 'counts' && m === 'GET') {
    const from = url.searchParams.get('from') || now.date, to = url.searchParams.get('to') || addDays(from, 41);
    if (!isDate(from) || !isDate(to)) return bad('date');
    const rows = await db.all(env, "SELECT date, status, COUNT(*) AS c, SUM(persons) AS p FROM reservations WHERE date >= ? AND date <= ? GROUP BY date, status", from, to);
    return J({ rows });
  }
  if (seg === 'slots' && m === 'GET') {
    const date = url.searchParams.get('date') || '', { area, persons } = readParty(url, S), ignoreId = Number(url.searchParams.get('ignore')) || 0;
    if (!isDate(date)) return bad('date');
    const rows = await db.all(env, "SELECT id, date, time, persons, area, status FROM reservations WHERE date = ? AND status IN ('pending','confirmed','seated','done')", date);
    return J({ date, closed: dayClosed(S, date, now), slots: computeDay(S, date, rows, persons, area, now, { admin: true, ignoreId }) });
  }
  if (seg === 'search' && m === 'GET') {
    const qq = clean(url.searchParams.get('q'), 40);
    if (qq.length < 2) return J({ rows: [] });
    const like = '%' + qq.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    const rows = await db.all(env, "SELECT * FROM reservations WHERE name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' ORDER BY date DESC, time DESC LIMIT 40", like, like, like, like);
    return J({ rows: rows.map(admRes) });
  }
  if (seg === 'stats' && m === 'GET') {
    const from = addDays(now.date, -27);
    const rows = await db.all(env, 'SELECT date, status, source, COUNT(*) AS c, SUM(persons) AS p FROM reservations WHERE date >= ? AND date <= ? GROUP BY date, status, source', from, addDays(now.date, 14));
    return J({ from, today: now.date, rows });
  }
  if (seg === 'purge' && m === 'POST') {
    if (b.what !== 'test') return bad('fields');
    const ids = await db.all(env, 'SELECT id FROM reservations WHERE test = 1'), cids = await db.all(env, 'SELECT id FROM catering WHERE test = 1');
    await env.DB.batch([env.DB.prepare('DELETE FROM log WHERE res_id IN (SELECT id FROM reservations WHERE test = 1)'), env.DB.prepare('DELETE FROM reservations WHERE test = 1'),
      env.DB.prepare('DELETE FROM clog WHERE cat_id IN (SELECT id FROM catering WHERE test = 1)'), env.DB.prepare('DELETE FROM catering WHERE test = 1')]);
    return J({ ok: true, removed: ids.length + cids.length });
  }
  if (seg === 'vapid' && m === 'GET') return J({ key: (await vapid(env, kv)).pub });
  if (seg === 'push') {
    const ep = clean(b && b.endpoint, 600);
    let host = ''; try { const u = new URL(ep); if (u.protocol === 'https:') host = u.hostname; } catch (e) {}
    if (m === 'POST') {
      if (!host || !PUSH_HOSTS.test(host)) return bad('endpoint');
      const pk = clean(b.p256dh, 120), au = clean(b.auth, 40), lg = b.lang === 'tr' ? 'tr' : 'de';
      let keysOk = false; try { const u = unb64u(pk); keysOk = u.length === 65 && u[0] === 4 && unb64u(au).length === 16; } catch (e) {}
      await db.run(env, 'INSERT INTO push (endpoint, th, created_at, p256dh, auth, lang) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET th = excluded.th, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang',
        ep, ses.th, Date.now(), keysOk ? pk : '', keysOk ? au : '', lg);
      return J({ ok: true });
    }
    if (m === 'DELETE') { await db.run(env, 'DELETE FROM push WHERE endpoint = ?', ep); return J({ ok: true }); }
  }
  if (seg === 'catering') {
    const id = rest[0] ? Number(rest[0]) : 0;
    if (!rest[0] && m === 'GET') {
      // alles Offene, dazu alles ab 30 Tagen zurück
      const rows = await db.all(env, "SELECT * FROM catering WHERE status IN ('pending','offered','confirmed','paid') OR date >= ? ORDER BY date, time, id LIMIT 400", addDays(now.date, -30));
      return J({ rows: rows.map(admCat), today: now.date, ts: Date.now(), mode: S.mode, cat: await catInfo(env) });
    }
    if (!Number.isInteger(id) || id < 1) return bad('not_found', 404);
    const r = await db.first(env, 'SELECT * FROM catering WHERE id = ?', id);
    if (!r) return bad('not_found', 404);
    if (m === 'GET') return J({ row: admCat(r), log: await db.all(env, 'SELECT ts, action, who FROM clog WHERE cat_id = ? ORDER BY ts, id', id) });
    if (m === 'DELETE') {
      await env.DB.batch([env.DB.prepare('DELETE FROM clog WHERE cat_id = ?').bind(id), env.DB.prepare('DELETE FROM catering WHERE id = ?').bind(id)]);
      return J({ ok: true });
    }
    if (m === 'PATCH') {
      const set = {}, acts = [];
      if (b.status !== undefined) { if (!CSTATUSES.includes(b.status)) return bad('fields', 400, { fields: ['status'] }); if (b.status !== r.status) { set.status = b.status; acts.push(b.status); } }
      if (b.admin_note !== undefined) { const v = cleanMulti(b.admin_note, 600); if (v !== r.admin_note) { set.admin_note = v; acts.push('note'); } }
      const keys = Object.keys(set), t = Date.now();
      if (keys.length) {
        const stmts = [env.DB.prepare('UPDATE catering SET ' + keys.map((k) => k + ' = ?').join(', ') + ', updated_at = ? WHERE id = ?').bind(...keys.map((k) => set[k]), t, id)];
        for (const a of acts) stmts.push(env.DB.prepare('INSERT INTO clog (cat_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(id, t, a, who));
        await env.DB.batch(stmts);
      }
      return J({ ok: true, row: admCat(await db.first(env, 'SELECT * FROM catering WHERE id = ?', id)), log: await db.all(env, 'SELECT ts, action, who FROM clog WHERE cat_id = ? ORDER BY ts, id', id) });
    }
    return bad('not_found', 404);
  }
  if (seg === 'pushtest' && m === 'POST') { await pushAll(env, kv, { k: 'test' }); const n = await db.first(env, 'SELECT COUNT(*) AS n FROM push'); return J({ ok: true, devices: n ? n.n : 0 }); }

  if (seg === 'res') {
    const id = rest[0] ? Number(rest[0]) : 0;
    if (!rest[0] && m === 'POST') {
      // Reservierung von Hand (Telefon, Laufkundschaft)
      const date = String(b.date || ''), time = String(b.time || ''), area = b.area === 'v' ? 'v' : 'r', persons = intIn(b.persons, 1, 99);
      if (!isDate(date) || isNaN(toMin(time)) || !persons) return bad('fields', 400, { fields: ['date'] });
      const { o, err } = readGuest(b, false);
      if (err.length) return bad('fields', 400, { fields: err });
      if (!b.force) {
        const rows = await db.all(env, "SELECT id, date, time, persons, area, status FROM reservations WHERE date = ? AND status IN ('pending','confirmed','seated','done')", date);
        const slot = computeDay(S, date, rows, persons, area, now, { admin: true }).find((x) => x.t === time);
        if (slot && slot.s === 'full') return bad('full', 409, { left: slot.left });
      }
      const status = ['confirmed', 'seated', 'pending'].includes(b.status) ? b.status : 'confirmed';
      const src = b.source === 'walkin' ? 'walkin' : 'phone', t = Date.now(), code = await newCode(env), token = b64u(rnd(24));
      const ins = await db.run(env, 'INSERT INTO reservations (code, token, date, time, persons, area, name, phone, email, note, lang, status, source, tbl, admin_note, test, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        code, token, date, time, persons, area, o.name, o.phone, o.email, o.note, o.lang, status, src, clean(b.tbl, 20), cleanMulti(b.admin_note, 400), S.mode === 'live' ? 0 : 1, t, t);
      const nid = ins.meta && ins.meta.last_row_id;
      await db.run(env, 'INSERT INTO log (res_id, ts, action, who) VALUES (?, ?, ?, ?)', nid || 0, t, 'created_admin', who);
      return J({ ok: true, row: admRes(await db.first(env, 'SELECT * FROM reservations WHERE id = ?', nid)) });
    }
    if (!id) return bad('not_found', 404);
    const r = await db.first(env, 'SELECT * FROM reservations WHERE id = ?', id);
    if (!r) return bad('not_found', 404);
    if (m === 'GET') return J({ row: admRes(r), log: await db.all(env, 'SELECT ts, action, who FROM log WHERE res_id = ? ORDER BY ts, id', id) });
    if (m === 'DELETE') {
      await env.DB.batch([env.DB.prepare('DELETE FROM log WHERE res_id = ?').bind(id), env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(id)]);
      return J({ ok: true });
    }
    if (m === 'PATCH') {
      const set = {}, acts = [];
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return bad('fields', 400, { fields: ['status'] }); if (b.status !== r.status) { set.status = b.status; acts.push(b.status); } }
      if (b.date !== undefined || b.time !== undefined || b.persons !== undefined || b.area !== undefined) {
        const date = b.date !== undefined ? String(b.date) : r.date, time = b.time !== undefined ? String(b.time) : r.time;
        const persons = b.persons !== undefined ? intIn(b.persons, 1, 99) : r.persons, area = b.area !== undefined ? (b.area === 'v' ? 'v' : 'r') : r.area;
        if (!isDate(date) || isNaN(toMin(time)) || !persons) return bad('fields', 400, { fields: ['date'] });
        if (date !== r.date || time !== r.time || persons !== r.persons || area !== r.area) { Object.assign(set, { date, time, persons, area }); acts.push('moved'); }
      }
      if (b.name !== undefined || b.phone !== undefined || b.email !== undefined || b.note !== undefined) {
        const { o, err } = readGuest({ name: b.name !== undefined ? b.name : r.name, phone: b.phone !== undefined ? b.phone : r.phone, email: b.email !== undefined ? b.email : r.email, note: b.note !== undefined ? b.note : r.note, lang: r.lang }, false);
        if (err.length) return bad('fields', 400, { fields: err });
        for (const k of ['name', 'phone', 'email', 'note']) if (o[k] !== r[k]) set[k] = o[k];
        if (['name', 'phone', 'email', 'note'].some((k) => set[k] !== undefined)) acts.push('edited');
      }
      if (b.tbl !== undefined) { const v = clean(b.tbl, 20); if (v !== r.tbl) { set.tbl = v; acts.push('table'); } }
      if (b.admin_note !== undefined) { const v = cleanMulti(b.admin_note, 400); if (v !== r.admin_note) { set.admin_note = v; acts.push('note'); } }
      const keys = Object.keys(set), t = Date.now();
      if (keys.length) {
        const stmts = [env.DB.prepare('UPDATE reservations SET ' + keys.map((k) => k + ' = ?').join(', ') + ', updated_at = ? WHERE id = ?').bind(...keys.map((k) => set[k]), t, id)];
        for (const a of [...new Set(acts)]) stmts.push(env.DB.prepare('INSERT INTO log (res_id, ts, action, who) VALUES (?, ?, ?, ?)').bind(id, t, a, who));
        await env.DB.batch(stmts);
      }
      return J({ ok: true, row: admRes(await db.first(env, 'SELECT * FROM reservations WHERE id = ?', id)) });
    }
  }
  return bad('not_found', 404);
}

/* ---------------------------------------------------------------- Einstieg */
function cors(origin) {
  const h = { Vary: 'Origin' };
  if (origin && ORIGINS.some((re) => re.test(origin))) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
export async function onRequest(ctx) {
  const { request, env } = ctx, url = new URL(request.url), ch = cors(request.headers.get('Origin') || '');
  let res;
  if (request.method === 'OPTIONS') res = new Response(null, { status: 204 });
  else {
    try {
      if (!env.DB) res = bad('no_db', 503);
      else {
        await ensure(env);
        const p = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean), m = request.method, kv = await loadKV(env);
        if (p[0] === 'config' && m === 'GET') res = await apiConfig(env, kv);
        else if (p[0] === 'month' && m === 'GET') res = await apiMonth(env, kv, url);
        else if (p[0] === 'day' && m === 'GET') res = await apiDay(env, kv, url);
        else if (p[0] === 'reserve' && m === 'POST') res = await apiReserve(ctx, env, kv, request);
        else if (p[0] === 'r' && p[1]) res = await apiGuest(ctx, env, kv, request, p[1], p[2] || '');
        else if (p[0] === 'catering' && p[1] === 'config' && m === 'GET') res = await apiCatConfig(env, kv);
        else if (p[0] === 'catering' && p[1] === 'request' && m === 'POST') res = await apiCatRequest(ctx, env, kv, request);
        else if (p[0] === 'catering' && p[1] === 'r' && p[2]) res = await apiCatGuest(ctx, env, kv, request, p[2], p[3] || '');
        else if (p[0] === 'admin' && p[1]) res = await admin(ctx, env, kv, request, url, p[1], p.slice(2));
        else res = bad('not_found', 404);
      }
    } catch (e) { console.error(e && (e.stack || e.message || e)); res = bad('server', 500); }
  }
  for (const k of Object.keys(ch)) res.headers.set(k, ch[k]);
  return res;
}
