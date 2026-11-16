// marka22.de – Shift Plan (haftalık çalışma planı) für Marka Istanbul: Schnittstelle
// Cloudflare Pages Functions + D1 (Bindung SHIFT_DB → Datenbank "marka-shiftplan", siehe ../../wrangler.toml).
// Ein Benutzer (Yunus Emre): Passwort-Anmeldung, Sitzung per Bearer-Token.
// Namen, Telefonnummern usw. stehen nur in der Datenbank, nie im Code (das Repo ist öffentlich).
//
// Offen:     GET  status                     → { setup, canSetup }
//            POST setup  {code, password}    → einmalige Einrichtung mit Kurulum-Code (Hash steht in settings 'setup')
//            POST login  {password, device}  → { token }
// Geschützt: GET  data?from=YYYY-MM-DD&to=YYYY-MM-DD → { cfg, staff, entries, days }
//            PUT  entry {date, staff, status, shop, t_from, t_to, note} · DELETE entry?date=&staff= (zurück zum Wochenmuster)
//            POST bulk  {set:[entry…], del:[{date, staff}], days:[day…]}
//            PUT  day   {date, shop, closed, lead, note}   (closed: null = automatisch, 0 = offen, 1 = geschlossen; lead = Sorumlu)
//            POST staff {…} · PUT staff/<id> {…} · DELETE staff/<id> · PUT order {ids:[…]}
//            PUT  cfg   {shops, presets, holidays}
//            POST password {old, password} · POST logout

const PREFIX = '/shiftplan-api/';
const STATUSES = ['is', 'bos', 'izin', 'hasta', 'diger'];
const SHOP_RE = /^[A-Za-z0-9]{1,8}$/;
const SESSION_DAYS = 120;
const KEEP_DAYS = 730;   // Einträge älter als 2 Jahre werden gelöscht
const PW_ITER = 10000;   // PBKDF2 – CPU-Grenze der Functions beachten
const MAX_SPAN = 100;    // höchstens so viele Tage pro Abruf
const DEFAULT_CFG = {
  shops: [
    { id: '22', name: 'Marka 22', open: [1, 1, 1, 1, 1, 1, 0] },
    { id: '14', name: 'Marka 14', open: [1, 1, 1, 1, 1, 1, 0] },
  ],
  presets: [
    { name: 'Tam gün', a: '10:00', b: '19:00' },
    { name: 'Sabah', a: '10:00', b: '14:30' },
    { name: 'Akşam', a: '14:30', b: '19:00' },
  ],
  holidays: 1, // gesetzliche Feiertage NRW: Läden geschlossen
};
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL DEFAULT '',
     color TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', shop TEXT NOT NULL DEFAULT '',
     since TEXT NOT NULL DEFAULT '', until TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL DEFAULT '[]',
     created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS entries (date TEXT NOT NULL, staff INTEGER NOT NULL, status TEXT NOT NULL, shop TEXT NOT NULL DEFAULT '',
     t_from TEXT NOT NULL DEFAULT '', t_to TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL,
     PRIMARY KEY (date, staff))`,
  'CREATE INDEX IF NOT EXISTS idx_entries_staff ON entries(staff, date)',
  `CREATE TABLE IF NOT EXISTS days (date TEXT NOT NULL, shop TEXT NOT NULL, closed INTEGER, lead INTEGER, note TEXT NOT NULL DEFAULT '',
     updated_at INTEGER NOT NULL, PRIMARY KEY (date, shop))`,
  "CREATE TABLE IF NOT EXISTS sessions (th TEXT PRIMARY KEY, device TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
  'CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, ih TEXT NOT NULL, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_hits ON hits(kind, ts)',
];

/* ---------- Hilfsfunktionen ---------- */
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const rnd = (n) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha = async (s) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const sameStr = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const J = (o, status = 200) => new Response(JSON.stringify(o), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' },
});
const bad = (code, status = 400, extra) => J(Object.assign({ error: code }, extra || {}), status);
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const isDate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};
const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const span = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const parse = (s, dflt) => { try { const v = JSON.parse(s); return v ?? dflt; } catch (e) { return dflt; } };
const isId = (n) => Number.isInteger(n) && n > 0;

/* ---------- Datenbank ---------- */
let schemaOk = false;
async function ensure(env) {
  if (schemaOk) return;
  await env.SHIFT_DB.batch(SCHEMA.map((s) => env.SHIFT_DB.prepare(s)));
  schemaOk = true;
}
const q = (env, sql, ...args) => env.SHIFT_DB.prepare(sql).bind(...args);
async function getKV(env, k) { const r = await q(env, 'SELECT v FROM settings WHERE k = ?', k).first(); return r ? parse(r.v, null) : null; }
const setKV = (env, k, v) => q(env, 'INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, JSON.stringify(v)).run();

/* ---------- Normalisieren / prüfen ---------- */
function normCfg(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.shops)) return null;
  const shops = [], ids = new Set();
  for (const s of c.shops.slice(0, 6)) {
    const id = clean(s && s.id, 8);
    if (!SHOP_RE.test(id) || ids.has(id)) return null;
    ids.add(id);
    const open = Array.isArray(s.open) && s.open.length === 7 ? s.open.map((x) => (x ? 1 : 0)) : [1, 1, 1, 1, 1, 1, 0];
    shops.push({ id, name: clean(s.name, 30) || id, open });
  }
  if (!shops.length) return null;
  const presets = [];
  for (const p of (Array.isArray(c.presets) ? c.presets : []).slice(0, 8)) {
    if (p && isTime(p.a) && isTime(p.b)) presets.push({ name: clean(p.name, 20) || p.a + '–' + p.b, a: p.a, b: p.b });
  }
  return { shops, presets, holidays: c.holidays ? 1 : 0 };
}
// Wochenmuster: Versionen [{from:'YYYY-MM-DD', d:[Mo…So: null | {shop, a, b, lead}]}], jede gilt ab ihrem Datum
function normPattern(p) {
  if (!Array.isArray(p)) return null;
  const out = [];
  for (const v of p.slice(-40)) {
    if (!v || !isDate(v.from) || !Array.isArray(v.d) || v.d.length !== 7) return null;
    const d = [];
    for (const x of v.d) {
      if (!x) { d.push(null); continue; }
      const shop = String(x.shop || '');
      if (!SHOP_RE.test(shop) || (x.a && !isTime(x.a)) || (x.b && !isTime(x.b))) return null;
      d.push({ shop, a: x.a || '', b: x.b || '', lead: x.lead ? 1 : 0 });
    }
    out.push({ from: v.from, d });
  }
  out.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
  const res = []; // gleicher Starttag: die spätere Angabe gilt
  for (const v of out) { if (res.length && res[res.length - 1].from === v.from) res[res.length - 1] = v; else res.push(v); }
  return res;
}
function normStaff(b) {
  const name = clean(b && b.name, 60);
  if (!name) return null;
  const pattern = normPattern(b.pattern ?? []);
  if (!pattern) return null;
  return {
    name,
    code: clean(b.code, 8),
    color: /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color : '',
    role: clean(b.role, 30),
    phone: clean(b.phone, 30).replace(/[^\d+ ()/-]/g, ''),
    shop: SHOP_RE.test(b.shop || '') ? b.shop : '',
    since: isDate(b.since) ? b.since : '',
    until: isDate(b.until) ? b.until : '',
    pattern: JSON.stringify(pattern),
  };
}
function normEntry(e) {
  if (!e || !isDate(e.date) || !isId(e.staff) || !STATUSES.includes(e.status)) return null;
  let shop = '', a = '', b = '';
  if (e.status === 'is') {
    shop = String(e.shop || '');
    a = e.t_from || ''; b = e.t_to || '';
    if (!SHOP_RE.test(shop) || (a && !isTime(a)) || (b && !isTime(b))) return null;
  }
  return { date: e.date, staff: e.staff, status: e.status, shop, t_from: a, t_to: b, note: clean(e.note, 200) };
}
function normDay(d) {
  if (!d || !isDate(d.date) || !SHOP_RE.test(String(d.shop || ''))) return null;
  // lead: Personen-ID = Sorumlu dieses Tages, 0 = bewusst niemand (kein automatischer Sorumlu), null = nach Wochenmuster
  const lead = Number.isInteger(d.lead) && d.lead >= 0 ? d.lead : null;
  return { date: d.date, shop: String(d.shop), closed: d.closed === 0 || d.closed === 1 ? d.closed : null, lead, note: clean(d.note, 200) };
}
const upEntry = (env, e, now) => q(env, `INSERT INTO entries (date, staff, status, shop, t_from, t_to, note, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(date, staff) DO UPDATE SET status = excluded.status, shop = excluded.shop, t_from = excluded.t_from, t_to = excluded.t_to,
  note = excluded.note, updated_at = excluded.updated_at`, e.date, e.staff, e.status, e.shop, e.t_from, e.t_to, e.note, now);
const delEntry = (env, date, staff) => q(env, 'DELETE FROM entries WHERE date = ? AND staff = ?', date, staff);
const upDay = (env, d, now) => (d.closed === null && d.lead === null && !d.note)
  ? q(env, 'DELETE FROM days WHERE date = ? AND shop = ?', d.date, d.shop)
  : q(env, `INSERT INTO days (date, shop, closed, lead, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, shop) DO UPDATE SET closed = excluded.closed, lead = excluded.lead, note = excluded.note, updated_at = excluded.updated_at`,
      d.date, d.shop, d.closed, d.lead, d.note, now);

/* ---------- Anmeldung ---------- */
async function pwHash(pw, salt, it) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64u(salt), iterations: it }, key, 256));
}
async function makePw(pw) { const salt = rnd(16); return { salt, it: PW_ITER, hash: await pwHash(pw, salt, PW_ITER) }; }
async function checkPw(pw, rec) {
  if (!rec || typeof pw !== 'string' || !pw || pw.length > 200) return false;
  return sameStr(await pwHash(pw, rec.salt, rec.it || PW_ITER), rec.hash);
}
const pwValid = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 200;
async function ipHash(request, env) {
  await q(env, "INSERT OR IGNORE INTO settings (k, v) VALUES ('pepper', ?)", JSON.stringify(rnd(18))).run();
  return sha('ip|' + (request.headers.get('CF-Connecting-IP') || '0') + '|' + (await getKV(env, 'pepper')));
}
async function fails(env, since, ih) {
  const r = ih
    ? await q(env, "SELECT COUNT(*) AS n FROM hits WHERE kind = 'fail' AND ts > ? AND ih = ?", since, ih).first()
    : await q(env, "SELECT COUNT(*) AS n FROM hits WHERE kind = 'fail' AND ts > ?", since).first();
  return r ? r.n : 0;
}
async function locked(env, ih) { // Minuten Sperre oder 0
  const now = Date.now();
  if (await fails(env, now - 15 * 60e3, ih) >= 5) return 15;
  if (await fails(env, now - 15 * 60e3) >= 25) return 15;
  if (await fails(env, now - 864e5) >= 80) return 60;
  return 0;
}
const fail = (env, ih) => q(env, "INSERT INTO hits (kind, ih, ts) VALUES ('fail', ?, ?)", ih, Date.now()).run();
async function newSession(env, device) {
  const token = rnd(32), now = Date.now();
  await q(env, 'INSERT INTO sessions (th, device, created_at, seen_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    await sha(token), clean(device, 60), now, now, now + SESSION_DAYS * 864e5).run();
  return token;
}
async function auth(request, env) {
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ') || h.length > 200) return null;
  const th = await sha(h.slice(7).trim());
  const s = await q(env, 'SELECT th, seen_at, expires_at FROM sessions WHERE th = ?', th).first();
  const now = Date.now();
  if (!s || s.expires_at < now) return null;
  if (now - s.seen_at > 3600e3) await q(env, 'UPDATE sessions SET seen_at = ?, expires_at = ? WHERE th = ?', now, now + SESSION_DAYS * 864e5, th).run();
  return s;
}
async function cleanup(env) { // höchstens einmal am Tag
  const now = Date.now(), last = await getKV(env, 'lastclean');
  if (last && now - last < 864e5) return;
  await setKV(env, 'lastclean', now);
  const cut = addDays(new Date().toISOString().slice(0, 10), -KEEP_DAYS);
  await env.SHIFT_DB.batch([
    q(env, 'DELETE FROM hits WHERE ts < ?', now - 2 * 864e5),
    q(env, 'DELETE FROM sessions WHERE expires_at < ?', now),
    q(env, 'DELETE FROM entries WHERE date < ?', cut),
    q(env, 'DELETE FROM days WHERE date < ?', cut),
  ]);
}

/* ---------- Anfragen ---------- */
async function open(env, request, seg, body) {
  if (seg === 'status') {
    const [pw, su] = await Promise.all([getKV(env, 'pw'), getKV(env, 'setup')]);
    return J({ setup: !!pw, canSetup: !pw && !!su });
  }
  const ih = await ipHash(request, env);
  const lk = await locked(env, ih);
  if (lk) return bad('locked', 429, { min: lk });
  if (seg === 'setup') {
    if (await getKV(env, 'pw')) return bad('already', 409);
    const su = await getKV(env, 'setup');
    if (!su) return bad('nosetup', 409);
    const code = clean(body.code, 60).replace(/ı/g, 'i').replace(/İ/g, 'I').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!sameStr(await sha('setup|' + code), su)) { await fail(env, ih); return bad('code', 403); }
    if (!pwValid(body.password)) return bad('short');
    await setKV(env, 'pw', await makePw(body.password));
    await q(env, "DELETE FROM settings WHERE k = 'setup'").run();
    return J({ ok: true, token: await newSession(env, body.device) });
  }
  // login
  const pw = await getKV(env, 'pw');
  if (!pw) return bad('nosetup', 409);
  if (!(await checkPw(body.password, pw))) {
    await fail(env, ih);
    return bad('wrong', 403, { left: Math.max(0, 5 - (await fails(env, Date.now() - 15 * 60e3, ih))) });
  }
  return J({ ok: true, token: await newSession(env, body.device) });
}

async function guarded(env, request, url, seg, rest, body, ses) {
  const m = request.method;
  if (seg === 'data' && m === 'GET') {
    const from = url.searchParams.get('from'), to = url.searchParams.get('to');
    if (!isDate(from) || !isDate(to) || to < from || span(from, to) > MAX_SPAN) return bad('range');
    const [st, en, dy, cf] = await env.SHIFT_DB.batch([
      q(env, 'SELECT id, name, code, color, role, phone, shop, since, until, sort, pattern FROM staff ORDER BY sort, id'),
      q(env, 'SELECT date, staff, status, shop, t_from, t_to, note FROM entries WHERE date BETWEEN ? AND ?', from, to),
      q(env, 'SELECT date, shop, closed, lead, note FROM days WHERE date BETWEEN ? AND ?', from, to),
      q(env, "SELECT v FROM settings WHERE k = 'cfg'"),
    ]);
    const cfg = (cf.results[0] && normCfg(parse(cf.results[0].v, null))) || DEFAULT_CFG;
    return J({ cfg, staff: st.results.map((s) => Object.assign(s, { pattern: parse(s.pattern, []) })), entries: en.results, days: dy.results });
  }
  if (seg === 'entry' && m === 'PUT') {
    const e = normEntry(body);
    if (!e) return bad('invalid');
    if (!(await q(env, 'SELECT id FROM staff WHERE id = ?', e.staff).first())) return bad('nostaff', 404);
    await upEntry(env, e, Date.now()).run();
    return J({ ok: true });
  }
  if (seg === 'entry' && m === 'DELETE') {
    const date = url.searchParams.get('date'), staff = Number(url.searchParams.get('staff'));
    if (!isDate(date) || !isId(staff)) return bad('invalid');
    await delEntry(env, date, staff).run();
    return J({ ok: true });
  }
  if (seg === 'bulk' && m === 'POST') {
    const set = Array.isArray(body.set) ? body.set : [], del = Array.isArray(body.del) ? body.del : [], days = Array.isArray(body.days) ? body.days : [];
    if (set.length + del.length + days.length > 600) return bad('big', 413);
    const ids = new Set((await q(env, 'SELECT id FROM staff').all()).results.map((r) => r.id));
    const now = Date.now(), st = [];
    for (const x of set) { const e = normEntry(x); if (!e || !ids.has(e.staff)) return bad('invalid'); st.push(upEntry(env, e, now)); }
    for (const x of del) { if (!x || !isDate(x.date) || !isId(x.staff)) return bad('invalid'); st.push(delEntry(env, x.date, x.staff)); }
    for (const x of days) { const d = normDay(x); if (!d) return bad('invalid'); st.push(upDay(env, d, now)); }
    if (st.length) await env.SHIFT_DB.batch(st);
    return J({ ok: true, n: st.length });
  }
  if (seg === 'day' && m === 'PUT') {
    const d = normDay(body);
    if (!d) return bad('invalid');
    await upDay(env, d, Date.now()).run();
    return J({ ok: true });
  }
  if (seg === 'staff' && m === 'POST' && !rest.length) {
    const s = normStaff(body);
    if (!s) return bad('invalid');
    const c = await q(env, 'SELECT COUNT(*) AS n, COALESCE(MAX(sort), 0) AS mx FROM staff').first();
    if (c.n >= 80) return bad('full', 409);
    const now = Date.now();
    const r = await q(env, `INSERT INTO staff (name, code, color, role, phone, shop, since, until, sort, pattern, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, s.name, s.code, s.color, s.role, s.phone, s.shop, s.since, s.until, c.mx + 1, s.pattern, now, now).run();
    return J({ ok: true, id: r.meta.last_row_id });
  }
  if (seg === 'staff' && rest.length === 1 && (m === 'PUT' || m === 'DELETE')) {
    const id = Number(rest[0]);
    if (!isId(id)) return bad('invalid');
    if (m === 'PUT') {
      const s = normStaff(body);
      if (!s) return bad('invalid');
      const r = await q(env, 'UPDATE staff SET name = ?, code = ?, color = ?, role = ?, phone = ?, shop = ?, since = ?, until = ?, pattern = ?, updated_at = ? WHERE id = ?',
        s.name, s.code, s.color, s.role, s.phone, s.shop, s.since, s.until, s.pattern, Date.now(), id).run();
      return r.meta.changes ? J({ ok: true }) : bad('nostaff', 404);
    }
    await env.SHIFT_DB.batch([
      q(env, 'DELETE FROM entries WHERE staff = ?', id),
      q(env, 'UPDATE days SET lead = NULL WHERE lead = ?', id),
      q(env, 'DELETE FROM staff WHERE id = ?', id),
    ]);
    return J({ ok: true });
  }
  if (seg === 'order' && m === 'PUT') {
    const ids = (Array.isArray(body.ids) ? body.ids : []).filter(isId).slice(0, 100);
    if (ids.length) await env.SHIFT_DB.batch(ids.map((id, i) => q(env, 'UPDATE staff SET sort = ? WHERE id = ?', i + 1, id)));
    return J({ ok: true });
  }
  if (seg === 'cfg' && m === 'PUT') {
    const c = normCfg(body);
    if (!c) return bad('invalid');
    await setKV(env, 'cfg', c);
    return J({ ok: true, cfg: c });
  }
  if (seg === 'password' && m === 'POST') {
    const ih = await ipHash(request, env);
    const lk = await locked(env, ih);
    if (lk) return bad('locked', 429, { min: lk });
    if (!(await checkPw(body.old, await getKV(env, 'pw')))) { await fail(env, ih); return bad('wrong', 403); }
    if (!pwValid(body.password)) return bad('short');
    await setKV(env, 'pw', await makePw(body.password));
    await q(env, 'DELETE FROM sessions WHERE th <> ?', ses.th).run(); // andere Geräte abmelden
    return J({ ok: true });
  }
  if (seg === 'logout' && m === 'POST') {
    await q(env, 'DELETE FROM sessions WHERE th = ?', ses.th).run();
    return J({ ok: true });
  }
  return bad('notfound', 404);
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  if (!env.SHIFT_DB) return bad('nodb', 503);
  const parts = url.pathname.slice(PREFIX.length).split('/').filter(Boolean);
  const seg = parts[0] || '', rest = parts.slice(1), m = request.method;
  try {
    await ensure(env);
    let body = {};
    if (m === 'POST' || m === 'PUT') {
      const t = await request.text();
      if (t.length > 300000) return bad('big', 413);
      if (t) { body = parse(t, null); if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('json'); }
    }
    if ((seg === 'status' && m === 'GET') || ((seg === 'setup' || seg === 'login') && m === 'POST')) return await open(env, request, seg, body);
    const ses = await auth(request, env);
    if (!ses) return bad('auth', 401);
    ctx.waitUntil(cleanup(env).catch(() => {}));
    return await guarded(env, request, url, seg, rest, body, ses);
  } catch (e) {
    return bad('server', 500);
  }
}
