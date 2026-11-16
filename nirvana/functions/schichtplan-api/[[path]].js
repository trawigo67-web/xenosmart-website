// NIRVANA Schichtplan – Team-Datenbank (Cloudflare Pages Function, D1-Bindung SHIFT_DB)
//
// Öffentlich:   GET  /schichtplan-api/status
//               POST /schichtplan-api/setup      einmalig: Einrichtungscode + erster Chef-Zugang
//               POST /schichtplan-api/login      Name + Passwort → Sitzung (Bearer-Token)
// Angemeldet:   GET  /schichtplan-api/me         POST /schichtplan-api/logout   POST /schichtplan-api/password
//               GET  /schichtplan-api/sync?since=<seq>   alle Dokumente, die sich seit <seq> geändert haben
//               POST /schichtplan-api/doc        { path, base, data } oder { path, base, del: true }
// Nur Chef:     GET  /schichtplan-api/accounts   POST /schichtplan-api/accounts   POST /schichtplan-api/accounts/<id>
// Planen:       POST /schichtplan-api/links      { wk, emps } → persönliche Rückmelde-Links pro Mitarbeiter und Woche
// Mitarbeiter:  POST /schichtplan-api/reply/get  { token }  → eigene Schichten der Woche und bisherige Antworten
//               POST /schichtplan-api/reply/set  { token, items: [{ k: 'Datum|Beginn|Ende', s: 'ok'|'no', note }] }
//               Die Antworten landen gesammelt im Dokument resp/<Woche>, das die Planer-App mit abgleicht.
//
// Die App speichert ganze Dokumente (Einstellungen, Personal, Wochenpläne …). Jedes Dokument hat eine
// Version (ver); geschrieben wird nur, wenn der Client die aktuelle Version kennt, sonst Konflikt (409).
// Passwörter liegen nur als PBKDF2-Hash vor, Sitzungen nur als SHA-256 des Tokens.

const ORIGINS = [
  /^https:\/\/(www\.)?xenosmart\.de$/,
  /^https:\/\/(www\.)?nirvanamechernich\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?nirvana-reservierung\.pages\.dev$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
const PATH_RE = /^(app\/(config|staff)|(abs|evt)\/\d{4}|(weeks|stats|sent)\/\d{4}-W\d{2})$/;
const ROLES = ['admin', 'edit', 'view'];
const MAX_BODY = 1600000;          // Byte pro Anfrage
const MAX_DOC = 900000;            // Zeichen pro Dokument (D1 erlaubt 2 MB pro Zeile, Umlaute zählen doppelt)
const SESSION_MS = 60 * 864e5;     // 60 Tage, verlängert sich bei Nutzung
const ITER = 5000;                 // PBKDF2-Runden (CPU-Grenze der Functions beachten)
const LOCK_IP = 8, LOCK_NAME = 20, LOCK_MS = 15 * 60e3;

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, data TEXT NOT NULL, ver INTEGER NOT NULL, seq INTEGER NOT NULL, updated_at INTEGER NOT NULL, updated_by INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS docs_seq ON docs(seq)",
  "CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE, role TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, last_login INTEGER)",
  "CREATE TABLE IF NOT EXISTS sessions (th TEXT PRIMARY KEY, account_id INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, seen_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS sessions_acc ON sessions(account_id)",
  "CREATE TABLE IF NOT EXISTS hits (ih TEXT NOT NULL, kind TEXT NOT NULL, ts INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS hits_ih ON hits(ih, kind, ts)",
  "CREATE TABLE IF NOT EXISTS log (ts INTEGER NOT NULL, account_id INTEGER NOT NULL, action TEXT NOT NULL, path TEXT NOT NULL DEFAULT '')",
  "CREATE INDEX IF NOT EXISTS log_ts ON log(ts)",
  "CREATE TABLE IF NOT EXISTS answers (wk TEXT NOT NULL, emp TEXT NOT NULL, k TEXT NOT NULL, s TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', at INTEGER NOT NULL, PRIMARY KEY (wk, emp, k))",
  "INSERT OR IGNORE INTO meta (k, v) VALUES ('seq', '0')",
];

/* ---------- Hilfen ---------- */
const enc = new TextEncoder();
const b64u = (buf) => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const rnd = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
const sha = async (s) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const hex = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

async function pwHash(pw, saltB64) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64u(saltB64), iterations: ITER }, key, 256);
  return 'p' + ITER + '$' + b64u(bits);
}
async function pwCheck(pw, saltB64, stored) {
  const m = /^p(\d+)\$/.exec(stored || ''); if (!m) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64u(saltB64), iterations: +m[1] }, key, 256);
  return same('p' + m[1] + '$' + b64u(bits), stored);
}

class HttpError extends Error { constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra; } }
const fail = (status, code, extra) => { throw new HttpError(status, code, extra); };

function cors(request) {
  const o = request.headers.get('Origin');
  const h = { 'Vary': 'Origin' };
  if (o && ORIGINS.some((r) => r.test(o))) {
    h['Access-Control-Allow-Origin'] = o;
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
function respond(request, status, body, raw) {
  return new Response(raw ? body : JSON.stringify(body), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' }, cors(request)),
  });
}

const db = (env) => {
  if (!env.SHIFT_DB) fail(503, 'no_database');
  return env.SHIFT_DB;
};
let schemaOk = false;
async function ensure(env) {
  if (schemaOk) return;
  await db(env).batch(SCHEMA.map((s) => db(env).prepare(s)));
  schemaOk = true;
}
async function body(request) {
  const len = +(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) fail(413, 'too_large');
  const txt = await request.text();
  if (txt.length > MAX_BODY) fail(413, 'too_large');
  try { const j = JSON.parse(txt || '{}'); if (!j || typeof j !== 'object' || Array.isArray(j)) throw 0; return j; } catch (e) { fail(400, 'bad_json'); }
}
const cleanName = (n) => String(n || '').replace(/\s+/g, ' ').trim();
function checkName(n) { if (n.length < 2 || n.length > 40 || /[<>"`]/.test(n)) fail(400, 'name_bad'); return n; }
function checkPw(p) { if (typeof p !== 'string' || p.length < 8 || p.length > 200) fail(400, 'pass_short'); return p; }

/* ---------- Schutz vor Durchprobieren ---------- */
async function ipHash(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'x';
  return sha('nsp|' + ip + '|' + new Date().toISOString().slice(0, 10));
}
async function lockCheck(env, ih, nameKey) {
  const since = Date.now() - LOCK_MS;
  const r = await db(env).batch([
    db(env).prepare("SELECT COUNT(*) AS n FROM hits WHERE ih = ? AND kind = 'fail' AND ts > ?").bind(ih, since),
    db(env).prepare("SELECT COUNT(*) AS n FROM hits WHERE ih = ? AND kind = 'fail' AND ts > ?").bind(nameKey, since),
  ]);
  if (r[0].results[0].n >= LOCK_IP || r[1].results[0].n >= LOCK_NAME) fail(429, 'locked');
}
async function failHit(env, ih, nameKey) {
  const t = Date.now();
  await db(env).batch([
    db(env).prepare("INSERT INTO hits (ih, kind, ts) VALUES (?, 'fail', ?)").bind(ih, t),
    db(env).prepare("INSERT INTO hits (ih, kind, ts) VALUES (?, 'fail', ?)").bind(nameKey, t),
  ]);
}

/* ---------- Sitzungen ---------- */
async function newSession(env, acc) {
  const token = b64u(rnd(32)), t = Date.now();
  await db(env).batch([
    db(env).prepare('INSERT INTO sessions (th, account_id, created_at, expires_at, seen_at) VALUES (?, ?, ?, ?, ?)').bind(await sha(token), acc.id, t, t + SESSION_MS, t),
    db(env).prepare('UPDATE accounts SET last_login = ? WHERE id = ?').bind(t, acc.id),
    db(env).prepare("INSERT INTO log (ts, account_id, action) VALUES (?, ?, 'login')").bind(t, acc.id),
    // Aufräumen: alte Sitzungen, Fehlversuche, Protokoll
    db(env).prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    db(env).prepare('DELETE FROM hits WHERE ts < ?').bind(t - 864e5),
    db(env).prepare('DELETE FROM log WHERE ts < ?').bind(t - 400 * 864e5),
  ]);
  return { token, account: pub(acc) };
}
const pub = (a) => ({ id: a.id, name: a.name, role: a.role });
async function auth(request, env, roles) {
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ')) fail(401, 'unauthenticated');
  const th = await sha(h.slice(7).trim());
  const s = await db(env).prepare('SELECT s.th, s.account_id, s.expires_at, s.seen_at, a.id, a.name, a.role, a.active FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.th = ?').bind(th).first();
  const t = Date.now();
  if (!s || s.expires_at < t || !s.active) fail(401, 'unauthenticated');
  if (t - s.seen_at > 3600e3) await db(env).prepare('UPDATE sessions SET seen_at = ?, expires_at = ? WHERE th = ?').bind(t, t + SESSION_MS, th).run();
  if (roles && !roles.includes(s.role)) fail(403, 'permission_denied');
  return { id: s.id, name: s.name, role: s.role, th };
}

/* ---------- Dokumente ---------- */
async function names(env) {
  const r = await db(env).prepare('SELECT id, name FROM accounts').all();
  const m = {}; for (const a of r.results || []) m[a.id] = a.name; return m;
}
async function sync(request, env, url) {
  await auth(request, env);
  const since = Math.max(0, parseInt(url.searchParams.get('since') || '0', 10) || 0);
  const seq = +((await db(env).prepare("SELECT v FROM meta WHERE k = 'seq'").first()) || {}).v || 0;
  if (since > seq) return respond(request, 200, '{"seq":' + seq + ',"docs":[],"reset":true}', true);   // Datenbank wurde neu angelegt
  if (since === seq) return respond(request, 200, '{"seq":' + seq + ',"docs":[]}', true);
  const rows = (await db(env).prepare('SELECT path, data, ver, seq, updated_at, updated_by, deleted FROM docs WHERE seq > ? ORDER BY seq').bind(since).all()).results || [];
  const nm = await names(env);
  // Die Daten liegen schon als geprüftes JSON vor – direkt einsetzen statt neu zu parsen.
  const parts = rows.map((r) => '{"path":' + JSON.stringify(r.path) + ',"ver":' + r.ver + ',"seq":' + r.seq + ',"at":' + r.updated_at +
    ',"by":' + JSON.stringify(nm[r.updated_by] || '') + ',"del":' + (r.deleted ? 1 : 0) + ',"data":' + (r.deleted ? 'null' : r.data) + '}');
  const top = rows.reduce((m, r) => Math.max(m, r.seq), since);
  return respond(request, 200, '{"seq":' + Math.max(seq, top) + ',"docs":[' + parts.join(',') + ']}', true);
}
async function putDoc(request, env) {
  const acc = await auth(request, env, ['admin', 'edit']);
  const b = await body(request);
  const path = String(b.path || '');
  if (!PATH_RE.test(path)) fail(400, 'bad_path');
  const del = b.del === true;
  let json = 'null';
  if (!del) {
    if (!b.data || typeof b.data !== 'object' || Array.isArray(b.data)) fail(400, 'bad_data');
    json = JSON.stringify(b.data);
    if (json.length > MAX_DOC) fail(413, 'too_large');
  }
  const base = b.base === null || b.base === undefined ? null : Math.max(0, parseInt(b.base, 10) || 0);
  const t = Date.now(), D = db(env);
  const SEQ = "(SELECT CAST(v AS INTEGER) FROM meta WHERE k = 'seq')";
  let write;
  if (base === null) {
    write = D.prepare('INSERT INTO docs (path, data, ver, seq, updated_at, updated_by, deleted) VALUES (?1, ?2, 1, ' + SEQ + ', ?3, ?4, ?5) ' +
      'ON CONFLICT(path) DO UPDATE SET data = excluded.data, ver = docs.ver + 1, seq = excluded.seq, updated_at = excluded.updated_at, updated_by = excluded.updated_by, deleted = excluded.deleted').bind(path, json, t, acc.id, del ? 1 : 0);
  } else if (base === 0) {
    // Client kennt das Dokument nicht: neu anlegen oder ein gelöschtes wiederbeleben, sonst Konflikt
    write = D.prepare('INSERT INTO docs (path, data, ver, seq, updated_at, updated_by, deleted) VALUES (?1, ?2, 1, ' + SEQ + ', ?3, ?4, ?5) ' +
      'ON CONFLICT(path) DO UPDATE SET data = excluded.data, ver = docs.ver + 1, seq = excluded.seq, updated_at = excluded.updated_at, updated_by = excluded.updated_by, deleted = excluded.deleted WHERE docs.deleted = 1').bind(path, json, t, acc.id, del ? 1 : 0);
  } else {
    write = D.prepare('UPDATE docs SET data = ?1, ver = ver + 1, seq = ' + SEQ + ', updated_at = ?2, updated_by = ?3, deleted = ?4 WHERE path = ?5 AND ver = ?6').bind(json, t, acc.id, del ? 1 : 0, path, base);
  }
  const r = await D.batch([
    D.prepare("UPDATE meta SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT) WHERE k = 'seq'"),
    write,
    D.prepare('SELECT path, data, ver, seq, updated_at, updated_by, deleted FROM docs WHERE path = ?').bind(path),
  ]);
  const cur = (r[2].results || [])[0];
  if (!r[1].meta || !r[1].meta.changes) {
    if (!cur && base === 0 && del) return respond(request, 200, { ok: true, ver: 0, seq: 0, at: t });   // nichts zu löschen
    const nm = cur ? await names(env) : {};
    fail(409, 'conflict', cur ? { doc: { path, ver: cur.ver, seq: cur.seq, at: cur.updated_at, by: nm[cur.updated_by] || '', del: cur.deleted ? 1 : 0, data: cur.deleted ? null : JSON.parse(cur.data) } } : { doc: null });
  }
  await D.prepare('INSERT INTO log (ts, account_id, action, path) VALUES (?, ?, ?, ?)').bind(t, acc.id, del ? 'del' : 'set', path).run();
  return respond(request, 200, { ok: true, ver: cur.ver, seq: cur.seq, at: t });
}

/* ---------- Anmeldung und Zugänge ---------- */
async function status(request, env) {
  const n = await db(env).prepare('SELECT COUNT(*) AS n FROM accounts').first();
  return respond(request, 200, { ok: true, setup: (n && n.n) > 0 });
}
async function setup(request, env) {
  const b = await body(request);
  const ih = await ipHash(request);
  await lockCheck(env, ih, 'setup');
  const n = await db(env).prepare('SELECT COUNT(*) AS n FROM accounts').first();
  if (n && n.n > 0) fail(409, 'already');
  const m = await db(env).prepare("SELECT k, v FROM meta WHERE k IN ('setup_hash', 'setup_exp')").all();
  const M = {}; for (const r of m.results || []) M[r.k] = r.v;
  const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!M.setup_hash || !code || +M.setup_exp < Date.now() || !same(await hex(code), M.setup_hash)) { await failHit(env, ih, 'setup'); fail(403, 'setup_bad'); }
  const name = checkName(cleanName(b.name)); checkPw(b.password);
  const salt = b64u(rnd(16)), t = Date.now();
  const r = await db(env).batch([
    db(env).prepare("INSERT INTO accounts (name, role, salt, hash, active, created_at) VALUES (?, 'admin', ?, ?, 1, ?)").bind(name, salt, await pwHash(b.password, salt), t),
    db(env).prepare("DELETE FROM meta WHERE k IN ('setup_hash', 'setup_exp')"),
    db(env).prepare('SELECT id, name, role FROM accounts WHERE name = ?').bind(name),
  ]);
  const acc = r[2].results[0];
  await db(env).prepare("INSERT INTO log (ts, account_id, action) VALUES (?, ?, 'setup')").bind(t, acc.id).run();
  return respond(request, 200, await newSession(env, acc));
}
async function login(request, env) {
  const b = await body(request);
  const name = cleanName(b.name), ih = await ipHash(request), nk = 'n:' + (await sha(name.toLowerCase()));
  await lockCheck(env, ih, nk);
  const acc = name ? await db(env).prepare('SELECT id, name, role, salt, hash, active FROM accounts WHERE name = ?').bind(name).first() : null;
  const ok = acc && acc.active && typeof b.password === 'string' && await pwCheck(b.password, acc.salt, acc.hash);
  if (!ok) { await failHit(env, ih, nk); fail(401, 'login_bad'); }
  return respond(request, 200, await newSession(env, acc));
}
async function logout(request, env) {
  const acc = await auth(request, env);
  await db(env).prepare('DELETE FROM sessions WHERE th = ?').bind(acc.th).run();
  return respond(request, 200, { ok: true });
}
async function password(request, env) {
  const acc = await auth(request, env);
  const b = await body(request);
  const ih = await ipHash(request), nk = 'n:' + (await sha(acc.name.toLowerCase()));
  await lockCheck(env, ih, nk);
  const row = await db(env).prepare('SELECT salt, hash FROM accounts WHERE id = ?').bind(acc.id).first();
  if (!row || typeof b.old !== 'string' || !(await pwCheck(b.old, row.salt, row.hash))) { await failHit(env, ih, nk); fail(403, 'login_bad'); }
  checkPw(b.password);
  const salt = b64u(rnd(16));
  await db(env).batch([
    db(env).prepare('UPDATE accounts SET salt = ?, hash = ? WHERE id = ?').bind(salt, await pwHash(b.password, salt), acc.id),
    db(env).prepare('DELETE FROM sessions WHERE account_id = ? AND th <> ?').bind(acc.id, acc.th),
    db(env).prepare("INSERT INTO log (ts, account_id, action) VALUES (?, ?, 'password')").bind(Date.now(), acc.id),
  ]);
  return respond(request, 200, { ok: true });
}
async function accounts(request, env, id) {
  const me = await auth(request, env, ['admin']);
  const D = db(env);
  const list = async () => ((await D.prepare('SELECT id, name, role, active, created_at, last_login FROM accounts ORDER BY name COLLATE NOCASE').all()).results || [])
    .map((a) => ({ id: a.id, name: a.name, role: a.role, active: !!a.active, created: a.created_at, last: a.last_login || null }));
  if (request.method === 'GET') return respond(request, 200, { accounts: await list() });
  const b = await body(request);
  const t = Date.now();
  if (!id) {   // neuer Zugang
    const name = checkName(cleanName(b.name)); checkPw(b.password);
    const role = ROLES.includes(b.role) ? b.role : 'edit';
    if (await D.prepare('SELECT id FROM accounts WHERE name = ?').bind(name).first()) fail(409, 'name_taken');
    const salt = b64u(rnd(16));
    await D.batch([
      D.prepare('INSERT INTO accounts (name, role, salt, hash, active, created_at) VALUES (?, ?, ?, ?, 1, ?)').bind(name, role, salt, await pwHash(b.password, salt), t),
      D.prepare("INSERT INTO log (ts, account_id, action, path) VALUES (?, ?, 'account_new', ?)").bind(t, me.id, name),
    ]);
    return respond(request, 200, { ok: true, accounts: await list() });
  }
  const acc = await D.prepare('SELECT id, name, role, active FROM accounts WHERE id = ?').bind(id).first();
  if (!acc) fail(404, 'not_found');
  const role = b.role !== undefined ? (ROLES.includes(b.role) ? b.role : fail(400, 'bad_role')) : acc.role;
  const active = b.active !== undefined ? (b.active ? 1 : 0) : acc.active;
  if (acc.role === 'admin' && acc.active && (role !== 'admin' || !active)) {
    const n = await D.prepare("SELECT COUNT(*) AS n FROM accounts WHERE role = 'admin' AND active = 1").first();
    if (n.n <= 1) fail(409, 'last_admin');
  }
  const st = [D.prepare('UPDATE accounts SET role = ?, active = ? WHERE id = ?').bind(role, active, id)];
  if (b.password !== undefined) {
    checkPw(b.password);
    const salt = b64u(rnd(16));
    st.push(D.prepare('UPDATE accounts SET salt = ?, hash = ? WHERE id = ?').bind(salt, await pwHash(b.password, salt), id));
  }
  // Gesperrt oder neues Passwort: alle Sitzungen dieses Zugangs beenden
  if (!active || b.password !== undefined || role !== acc.role) st.push(D.prepare('DELETE FROM sessions WHERE account_id = ?' + (+id === me.id ? ' AND th <> ?' : '')).bind(...(+id === me.id ? [id, me.th] : [id])));
  st.push(D.prepare("INSERT INTO log (ts, account_id, action, path) VALUES (?, ?, 'account_edit', ?)").bind(t, me.id, acc.name));
  await D.batch(st);
  return respond(request, 200, { ok: true, accounts: await list() });
}

/* ---------- Rückmelde-Links für Mitarbeiter ----------
   Token = base64url("<Woche>|<Mitarbeiter-ID>") + "." + HMAC (Schlüssel in meta.link_key). Nichts davon ist geheim
   außer dem Schlüssel; ohne ihn lässt sich kein gültiger Link bauen. Gültig bis vier Wochen nach Wochenbeginn. */
function wkMonday(wk) {
  const [y, w] = wk.split('-W').map(Number);
  const jan4 = Date.UTC(y, 0, 4), day = new Date(jan4).getUTCDay() || 7;
  return jan4 - (day - 1) * 864e5 + (w - 1) * 7 * 864e5;
}
let linkKeyCache = null;
async function linkKey(env) {
  if (linkKeyCache) return linkKeyCache;
  const D = db(env);
  let r = await D.prepare("SELECT v FROM meta WHERE k = 'link_key'").first();
  if (!r) { await D.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES ('link_key', ?)").bind(b64u(rnd(32))).run(); r = await D.prepare("SELECT v FROM meta WHERE k = 'link_key'").first(); }
  linkKeyCache = await crypto.subtle.importKey('raw', unb64u(r.v), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return linkKeyCache;
}
async function linkToken(key, wk, emp) {
  const p = wk + '|' + emp;
  return b64u(enc.encode(p)) + '.' + b64u(await crypto.subtle.sign('HMAC', key, enc.encode('r|' + p))).slice(0, 22);
}
async function linkOpen(env, token) {
  const m = /^([A-Za-z0-9_-]{8,120})\.([A-Za-z0-9_-]{22})$/.exec(String(token || ''));
  if (!m) return null;
  let p = '';
  try { p = new TextDecoder('utf-8', { fatal: true }).decode(unb64u(m[1])); } catch (e) { return null; }
  const mm = /^(\d{4}-W\d{2})\|([^|]{1,40})$/.exec(p);
  if (!mm) return null;
  if (!same(await linkToken(await linkKey(env), mm[1], mm[2]), String(token))) return null;
  if (wkMonday(mm[1]) + 28 * 864e5 < Date.now()) return { expired: true };
  return { wk: mm[1], emp: mm[2] };
}
async function links(request, env) {
  await auth(request, env, ['admin', 'edit']);
  const b = await body(request);
  const wk = String(b.wk || '');
  if (!/^\d{4}-W\d{2}$/.test(wk)) fail(400, 'bad_week');
  const emps = (Array.isArray(b.emps) ? b.emps : []).map(String).filter((x) => x && x.length <= 40 && !x.includes('|')).slice(0, 400);
  const key = await linkKey(env), out = {};
  for (const e of emps) out[e] = await linkToken(key, wk, e);
  return respond(request, 200, { links: out });
}
async function replyOpen(request, env, b) {
  const ih = await ipHash(request);
  await lockCheck(env, ih, 'r:' + ih);
  const L = await linkOpen(env, b.token);
  if (!L) { await failHit(env, ih, 'r:' + ih); fail(404, 'link_bad'); }
  if (L.expired) fail(410, 'link_old');
  return L;
}
const skey = (s) => s.d + '|' + s.s + '|' + s.e;
async function replyGet(request, env) {
  const b = await body(request);
  const L = await replyOpen(request, env, b);
  const rows = (await db(env).prepare('SELECT path, data FROM docs WHERE path IN (?, ?, ?, ?) AND deleted = 0').bind('app/config', 'app/staff', 'weeks/' + L.wk, 'resp/' + L.wk).all()).results || [];
  const D = {}; for (const r of rows) D[r.path] = JSON.parse(r.data);
  const e = ((D['app/staff'] || {}).emp || {})[L.emp];
  if (!e || e.active === false) fail(404, 'link_bad');
  const cfg = D['app/config'] || {}, wkDoc = D['weeks/' + L.wk] || {};
  const shifts = (wkDoc.shifts || []).filter((s) => s.emp === L.emp).map((s) => ({ k: skey(s), d: s.d, s: s.s, e: s.e, r: s.r, a: s.a || '', b: s.b || 0, n: s.n || '' }));
  const roles = (cfg.roles || []).filter((r) => shifts.some((s) => s.r === r.id)).map((r) => ({ id: r.id, name: r.name, a: r.a }));
  const answers = (((D['resp/' + L.wk] || {}).emps || {})[L.emp]) || {};
  return respond(request, 200, { ok: true, wk: L.wk, biz: cfg.biz || '', emp: { name: e.name || '', lang: e.lang || 'de' }, pub: !!wkDoc.pub, shifts, roles, answers, now: Date.now() });
}
async function replySet(request, env) {
  const b = await body(request);
  const L = await replyOpen(request, env, b);
  const D = db(env);
  const wkRow = await D.prepare('SELECT data FROM docs WHERE path = ? AND deleted = 0').bind('weeks/' + L.wk).first();
  const mine = new Set(((wkRow ? JSON.parse(wkRow.data) : {}).shifts || []).filter((s) => s.emp === L.emp).map(skey));
  const oldest = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);   // vergangene Schichten nicht mehr ändern (großzügig wegen Zeitzone)
  const t = Date.now(), st = [];
  for (const it of (Array.isArray(b.items) ? b.items : []).slice(0, 40)) {
    const k = String((it && it.k) || ''), s = it && it.s === 'ok' ? 'ok' : it && it.s === 'no' ? 'no' : '';
    if (!s || !mine.has(k) || k.slice(0, 10) < oldest) continue;
    const note = s === 'no' ? String(it.note || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200) : '';
    st.push(D.prepare('INSERT INTO answers (wk, emp, k, s, note, at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(wk, emp, k) DO UPDATE SET s = excluded.s, note = excluded.note, at = excluded.at').bind(L.wk, L.emp, k, s, note, t));
  }
  if (!st.length) fail(400, 'nothing');
  const SEQ = "(SELECT CAST(v AS INTEGER) FROM meta WHERE k = 'seq')";
  // Gesammeltes Dokument resp/<Woche> in derselben Transaktion neu bauen, damit gleichzeitige Antworten nichts überschreiben
  const DOC = "(SELECT json_object('wk', ?2, 'emps', json(COALESCE((SELECT json_group_object(emp, json(items)) FROM (SELECT emp, json_group_object(k, json_object('s', s, 'note', note, 'at', at)) AS items FROM answers WHERE wk = ?2 GROUP BY emp)), '{}'))))";
  st.push(D.prepare("UPDATE meta SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT) WHERE k = 'seq'"));
  st.push(D.prepare('INSERT INTO docs (path, data, ver, seq, updated_at, updated_by, deleted) VALUES (?1, ' + DOC + ', 1, ' + SEQ + ', ?3, 0, 0) ' +
    'ON CONFLICT(path) DO UPDATE SET data = excluded.data, ver = docs.ver + 1, seq = excluded.seq, updated_at = excluded.updated_at, updated_by = 0, deleted = 0').bind('resp/' + L.wk, L.wk, t));
  st.push(D.prepare("INSERT INTO log (ts, account_id, action, path) VALUES (?, 0, 'reply', ?)").bind(t, 'resp/' + L.wk + ':' + L.emp));
  st.push(D.prepare('SELECT data FROM docs WHERE path = ?').bind('resp/' + L.wk));
  const r = await D.batch(st);
  const doc = JSON.parse(r[r.length - 1].results[0].data);
  return respond(request, 200, { ok: true, answers: (doc.emps || {})[L.emp] || {} });
}

/* ---------- Verteiler ---------- */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/schichtplan-api\/?/, '').split('/').filter(Boolean);
  const [a, b] = parts, M = request.method;
  try {
    await ensure(env);
    if (M === 'GET' && a === 'status') return await status(request, env);
    if (M === 'POST' && a === 'setup') return await setup(request, env);
    if (M === 'POST' && a === 'login') return await login(request, env);
    if (M === 'POST' && a === 'logout') return await logout(request, env);
    if (M === 'GET' && a === 'me') { const acc = await auth(request, env); return respond(request, 200, { account: pub(acc) }); }
    if (M === 'POST' && a === 'password') return await password(request, env);
    if (M === 'GET' && a === 'sync') return await sync(request, env, url);
    if (M === 'POST' && a === 'doc') return await putDoc(request, env);
    if (M === 'POST' && a === 'links') return await links(request, env);
    if (M === 'POST' && a === 'reply' && b === 'get') return await replyGet(request, env);
    if (M === 'POST' && a === 'reply' && b === 'set') return await replySet(request, env);
    if (a === 'accounts' && (M === 'GET' || M === 'POST') && (!b || /^\d+$/.test(b))) return await accounts(request, env, b ? +b : 0);
    return respond(request, 404, { error: 'not_found' });
  } catch (e) {
    if (e instanceof HttpError) return respond(request, e.status, Object.assign({ error: e.code }, e.extra || {}));
    console.log('schichtplan-api', e && (e.stack || e.message || e));
    return respond(request, 500, { error: 'server' });
  }
}
