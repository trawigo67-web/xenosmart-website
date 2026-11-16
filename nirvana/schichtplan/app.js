/* ==========================================================================
   Schichtplan – Kernlogik (Datum, Regeln, Bedarf, Auto-Planung, Regel-Check,
   Kosten, Statistik, Nachrichten). Reine Funktionen, im Browser und in Node.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------------- Datum ---------------- */
  const DAY = 86400000;
  const pad = n => (n < 10 ? '0' : '') + n;
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const fmtD = ms => { const t = new Date(ms); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); };
  const addDays = (s, n) => fmtD(parseD(s) + n * DAY);
  const dow = s => new Date(parseD(s)).getUTCDay();            // 0 = Sonntag
  const dayNum = s => Math.round(parseD(s) / DAY);
  const fromDayNum = n => fmtD(n * DAY);
  const toMin = t => { if (!t) return 0; const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  const fromMin = m => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  const monthKey = s => s.slice(0, 7);
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  function isoWeek(s) {
    const d = new Date(parseD(s));
    const wd = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wd + 3);
    const year = d.getUTCFullYear();
    const firstThu = new Date(Date.UTC(year, 0, 4));
    const fwd = (firstThu.getUTCDay() + 6) % 7;
    firstThu.setUTCDate(firstThu.getUTCDate() - fwd + 3);
    const week = 1 + Math.round((d - firstThu) / (7 * DAY));
    return { year, week };
  }
  const wkId = s => { const w = isoWeek(s); return w.year + '-W' + pad(w.week); };
  const wkMonday = s => addDays(s, -((dow(s) + 6) % 7));
  function wkStart(id) {
    const [y, w] = id.split('-W').map(Number);
    const jan4 = Date.UTC(y, 0, 4);
    const wd = (new Date(jan4).getUTCDay() + 6) % 7;
    return fmtD(jan4 - wd * DAY + (w - 1) * 7 * DAY);
  }
  const wkShift = (id, n) => wkId(addDays(wkStart(id), 7 * n));
  const weekDates = mon => [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mon, i));

  /* ---------------- Feiertage ---------------- */
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return y + '-' + pad(mo) + '-' + pad(da);
  }
  const STATES = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
  const _holCache = {};
  function holidays(y, st) {
    const key = y + st;
    if (_holCache[key]) return _holCache[key];
    const E = easter(y), H = {};
    const add = (d, k) => { H[d] = k; };
    add(y + '-01-01', 'h_neujahr');
    if (['BW', 'BY', 'ST'].includes(st)) add(y + '-01-06', 'h_dreikoenig');
    if (['BE', 'MV'].includes(st)) add(y + '-03-08', 'h_frauentag');
    add(addDays(E, -2), 'h_karfreitag');
    if (st === 'BB') add(E, 'h_ostersonntag');
    add(addDays(E, 1), 'h_ostermontag');
    add(y + '-05-01', 'h_mai');
    add(addDays(E, 39), 'h_himmelfahrt');
    if (st === 'BB') add(addDays(E, 49), 'h_pfingstsonntag');
    add(addDays(E, 50), 'h_pfingstmontag');
    if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(st)) add(addDays(E, 60), 'h_fronleichnam');
    if (st === 'SL') add(y + '-08-15', 'h_mariae');
    if (st === 'TH') add(y + '-09-20', 'h_kindertag');
    add(y + '-10-03', 'h_einheit');
    if (['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'].includes(st)) add(y + '-10-31', 'h_reformation');
    if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(st)) add(y + '-11-01', 'h_allerheiligen');
    if (st === 'SN') { // Mittwoch vor dem 23.11.
      let d = y + '-11-22'; while (dow(d) !== 3) d = addDays(d, -1); add(d, 'h_busstag');
    }
    add(y + '-12-25', 'h_weihnacht1');
    add(y + '-12-26', 'h_weihnacht2');
    _holCache[key] = H;
    return H;
  }
  const holidayOf = (d, st) => holidays(+d.slice(0, 4), st || 'NW')[d] || null;

  /* Besondere Tage: eingebaute (jährlich) + Diyanet-Daten + eigene */
  const FIXED_SPECIALS = [
    { id: 'ramazan-2027', k: 'sp_ramazan', from: '2027-02-08', to: '2027-03-08', fDay: 0.85, fEve: 1.3 },
    { id: 'rbayram-2027', k: 'sp_rbayram', from: '2027-03-09', to: '2027-03-11', fDay: 1.35, fEve: 1.35 },
    { id: 'kbayram-2027', k: 'sp_kbayram', from: '2027-05-16', to: '2027-05-19', fDay: 1.3, fEve: 1.3 }
  ];
  function builtinSpecials(y) {
    let ms = y + '-05-01'; while (dow(ms) !== 0) ms = addDays(ms, 1); ms = addDays(ms, 7); // 2. Sonntag im Mai
    const list = [
      { id: 'valentin-' + y, k: 'sp_valentin', from: y + '-02-14', to: y + '-02-14', fDay: 1, fEve: 1.2 },
      { id: 'muttertag-' + y, k: 'sp_muttertag', from: ms, to: ms, fDay: 1.35, fEve: 1.15 },
      { id: 'heiligabend-' + y, k: 'sp_heiligabend', from: y + '-12-24', to: y + '-12-24', fDay: 0.9, fEve: 0.75 },
      { id: 'silvester-' + y, k: 'sp_silvester', from: y + '-12-31', to: y + '-12-31', fDay: 0.9, fEve: 1.25 }
    ];
    return list.concat(FIXED_SPECIALS.filter(s => s.from.slice(0, 4) == y || s.to.slice(0, 4) == y));
  }
  function specialsFor(d, cfg) {
    const y = +d.slice(0, 4);
    const off = new Set(cfg.specOff || []);
    const all = builtinSpecials(y).filter(s => !off.has(s.id)).concat(cfg.specials || []);
    return all.filter(s => d >= s.from && d <= s.to);
  }

  /* ---------------- Gesetzliche Werte ---------------- */
  const MINWAGE = { 2025: 12.82, 2026: 13.90, 2027: 14.60 };
  const MINIJOB = { 2025: 556, 2026: 603, 2027: 633 };
  const lookupYear = (tab, y) => { const ks = Object.keys(tab).map(Number).sort((a, b) => a - b); let v = tab[ks[0]]; for (const k of ks) if (k <= y) v = tab[k]; return v; };
  const minWage = (y, cfg) => (cfg && cfg.law && cfg.law.minWage) || lookupYear(MINWAGE, y);
  const minijobCap = (y, cfg) => (cfg && cfg.law && cfg.law.minijob) || lookupYear(MINIJOB, y);

  function ageOn(birth, d) {
    if (!birth) return 99;
    const [by, bm, bd] = birth.split('-').map(Number), [y, m, dd] = d.split('-').map(Number);
    let a = y - by; if (m < bm || (m === bm && dd < bd)) a--; return a;
  }
  /* gesetzliche Mindestpause (§4 ArbZG, §11 JArbSchG) für Arbeitszeit in Minuten */
  function legalBreak(workMin, youth) {
    if (youth) return workMin > 360 ? 60 : workMin > 270 ? 30 : 0;
    return workMin > 540 ? 45 : workMin > 360 ? 30 : 0;
  }
  /* kleinste ausreichende Pause für eine Schicht mit Gesamtdauer gross */
  function suggestBreak(gross, youth) {
    const opts = youth ? [0, 30, 60] : [0, 30, 45];
    for (const b of opts) if (legalBreak(gross - b, youth) <= b) return b;
    return opts[opts.length - 1];
  }

  /* ---------------- Schicht-Zeiten ---------------- */
  /* passende Pause für eine Person (Jugendliche brauchen mehr) */
  function fitBreak(sh, emp) {
    const base = sh.b0 != null ? sh.b0 : (sh.b || 0);
    const youth = !!emp && ageOn(emp.birth, sh.d) < 18;
    return Math.max(base, suggestBreak(grossMin(sh), youth));
  }
  const grossMin = sh => { let d = toMin(sh.e) - toMin(sh.s); if (d <= 0) d += 1440; return d; };
  const netMin = sh => Math.max(0, grossMin(sh) - (sh.b || 0));
  const netH = sh => netMin(sh) / 60;
  const absS = sh => dayNum(sh.d) * 1440 + toMin(sh.s);
  const absE = sh => absS(sh) + grossMin(sh);
  const isLate = sh => { const e = toMin(sh.e), s = toMin(sh.s); return e <= s || e >= 22 * 60 || s >= 15 * 60; };
  const isEarly = sh => toMin(sh.s) < 11 * 60;
  const isEve = sh => toMin(sh.s) >= 15 * 60;

  /* ---------------- Personal-Helfer ---------------- */
  const salaried = ct => ct === 'VZ' || ct === 'TZ' || ct === 'AZ';
  function defaultMaxDays(ct) { return { VZ: 5, TZ: 5, MJ: 4, AZ: 5, WS: 4, AH: 5 }[ct] || 5; }
  function hardWeekMax(emp, cfg, d) {
    const youth = ageOn(emp.birth, d) < 18;
    let mx = (cfg.rules && cfg.rules.maxWeek) || 48;
    const school = 8 * ((emp.school || []).length);
    if (youth) mx = Math.min(mx, 40 - school);
    if (emp.ct === 'AZ') mx = Math.min(mx, Math.max(0, (+emp.wh || 40) - school));
    if (emp.ct === 'WS') mx = Math.min(mx, emp.maxW || 20);
    if (emp.maxW) mx = Math.min(mx, emp.maxW);
    return mx;
  }
  /* Soll-Stunden der Woche (Urlaub/Krank mindern das Soll anteilig) */
  function weekTarget(emp, cfg, monDate, absBy) {
    let h = baseTarget(emp, cfg, monDate);
    const list = absBy && absBy[emp.id];
    if (list && h > 0 && salaried(emp.ct)) {
      let red = 0, absDays = 0;
      for (let i = 0; i < 7; i++) {
        const d = addDays(monDate, i), a = list.find(x => d >= x.f && d <= x.t);
        if (!a) continue;
        if (a.k === 'urlaub' || a.k === 'krank') absDays++;
        else if (a.k === 'schule') red += 8;
      }
      red += (+emp.wh || 0) / 5 * Math.min(5, absDays * 5 / 7);
      h = Math.max(0, h - Math.min(red, h));
    }
    return Math.round(h * 10) / 10;
  }
  function baseTarget(emp, cfg, monDate) {
    if (emp.ct === 'MJ') {
      const thu = addDays(monDate, 3), y = +thu.slice(0, 4), m = +thu.slice(5, 7);
      const cap = minijobCap(y, cfg), wage = Math.max(emp.wage || 1, 1);
      return Math.round((cap / wage) * 7 / daysInMonth(y, m) * 10) / 10;
    }
    let h = +emp.wh || 0;
    if (emp.ct === 'AZ' && emp.school && emp.school.length) h = Math.max(0, h - 8 * emp.school.length);
    return h;
  }
  function availOn(emp, d) {
    const a = emp.av && emp.av[dow(d)];
    if (a === undefined) return { f: 0, t: 1440 * 2 };
    if (a === null) return null;
    let f = toMin(a.f || '00:00'), t = a.t === '24:00' ? 1440 : toMin(a.t || '24:00');
    if (t <= f) t += 1440;
    return { f, t };
  }
  function absenceOn(absByEmp, empId, d) {
    const list = absByEmp[empId]; if (!list) return null;
    for (const a of list) if (d >= a.f && d <= a.t) return a;
    return null;
  }

  /* ---------------- Kosten ---------------- */
  function shiftCost(sh, emp, cfg) {
    if (!emp) return { base: 0, sur: 0, total: 0, nightH: 0, sunH: 0, holH: 0 };
    const wage = +emp.wage || 0, sur = cfg.sur || {}, st = cfg.state || 'NW';
    const fac = (cfg.fac && cfg.fac[emp.ct]) || 1.21;
    const g = grossMin(sh), n = netMin(sh), ratio = g ? n / g : 0;
    let nightM = 0, sunM = 0, holM = 0, pctSum = 0;
    const nf = toMin(sur.nightFrom || '22:00');
    const start = absS(sh);
    for (let t = start; t < start + g; t += 15) {
      const dn = Math.floor(t / 1440), mod = t - dn * 1440, d = fromDayNum(dn);
      const night = mod >= nf || mod < 360;
      const hol = holidayOf(d, st), md = d.slice(5);
      let dayPct = 0;
      if (dow(d) === 0) { dayPct = Math.max(dayPct, sur.sun || 0); sunM += 15; }
      if (hol) { dayPct = Math.max(dayPct, hol === 'h_mai' || hol === 'h_weihnacht1' || hol === 'h_weihnacht2' ? (sur.x150 || 0) : (sur.hol || 0)); holM += 15; }
      if ((md === '12-24' || md === '12-31') && mod >= 840) dayPct = Math.max(dayPct, md === '12-24' ? (sur.x150 || 0) : (sur.hol || 0));
      if (night) nightM += 15;
      pctSum += (night ? (sur.night || 0) : 0) + dayPct;
    }
    const baseH = n / 60;
    const surE = sur.on ? wage * (pctSum / 100) * 15 / 60 * ratio : 0;
    const base = baseH * wage * fac;
    return { base, sur: surE, total: base + surE, nightH: nightM * ratio / 60, sunH: sunM * ratio / 60, holH: holM * ratio / 60 };
  }

  /* ---------------- Bedarf ---------------- */
  const roleArea = (cfg, r) => { const ro = (cfg.roles || []).find(x => x.id === r); return ro ? ro.a : ''; };

  function dayFactors(d, cfg, dayInfo) {
    let fDay = 1, fEve = 1;
    for (const s of specialsFor(d, cfg)) { fDay *= s.fDay || 1; fEve *= s.fEve || 1; }
    const typical = (cfg.guests && cfg.guests[dow(d)]) || 0;
    const forecast = Math.round(typical * (fDay + fEve) / 2);
    const g = dayInfo && dayInfo.g != null && dayInfo.g !== '' ? +dayInfo.g : null;
    if (g != null && forecast > 0) { const m = g / forecast; fDay *= m; fEve *= m; }
    return { fDay, fEve, forecast, guests: g != null ? g : forecast };
  }

  function dayRevenue(d, cfg, dayInfo, events) {
    const f = dayFactors(d, cfg, dayInfo);
    let ev = 0, evG = 0;
    for (const x of events || []) if (x.d === d) { evG += +x.g || 0; ev += (+x.g || 0) * (+cfg.evSpend || 40); }
    return { guests: f.guests, evGuests: evG, rev: f.guests * (+cfg.spend || 0) + ev, forecast: f.forecast };
  }

  /* Bedarfs-Slots einer Woche: [{key, d, t, a, r, s, e, b, n, loc, ev}] */
  function demandForWeek(cfg, dates, days, events) {
    const out = [], st = cfg.state || 'NW', holAsSun = !cfg.rules || cfg.rules.holAsSun !== false;
    for (const d of dates) {
      const month = +d.slice(5, 7);
      const di = (days && days[d]) || {};
      if (di.closed) continue;
      const f = dayFactors(d, cfg, di);
      const wd = holAsSun && holidayOf(d, st) ? 0 : dow(d);
      for (const t of cfg.tpl || []) {
        if (t.on === false) continue;
        if (t.months && t.months.length && !t.months.includes(month)) continue;
        let n = (t.dem && t.dem[wd]) || 0;
        const adj = (di.adj && di.adj[t.id]) || 0;
        if (!n && !adj) continue;
        if (n && t.scale !== false) {
          const fac = toMin(t.s) >= 15 * 60 ? f.fEve : f.fDay;
          n = Math.max(1, Math.round(n * fac));
        }
        n = Math.max(0, n + adj);
        if (!n) continue;
        out.push({ key: d + '|' + t.id, d, t: t.id, a: t.a || roleArea(cfg, t.r), r: t.r, s: t.s, e: t.e, b: t.b != null ? t.b : suggestBreak(grossMin(t)), n, loc: t.loc || '' });
      }
      for (const ev of (events || []).filter(x => x.d === d)) for (const slot of eventSlots(ev, cfg)) out.push(slot);
    }
    return out;
  }

  function eventSlots(ev, cfg) {
    const R = Object.assign({ svc: 12, kit: 35, dish: 80, bar: 70, leadFrom: 40, catKit: 50, catDrv: 80, catSvc: 25 }, cfg.evr || {});
    const g = +ev.g || 0, out = [];
    if (!g) return out;
    const s0 = toMin(ev.s || '18:00'); let e0 = toMin(ev.e || '23:00'); if (e0 <= s0) e0 += 1440;
    const mk = (role, n, pre, post) => {
      if (n <= 0) return;
      const s = s0 - pre, e = e0 + post, gross = e - s;
      out.push({ key: ev.d + '|ev:' + ev.id + ':' + role, d: ev.d, t: 'ev:' + ev.id + ':' + role, ev: ev.id, a: roleArea(cfg, role), r: role, s: fromMin(s), e: fromMin(e), b: suggestBreak(gross), n, loc: ev.loc || '' });
    };
    if (ev.k === 'catering') {
      mk('koch', Math.ceil(g / R.catKit), 240, -60);
      mk('fahrer', Math.max(1, Math.ceil(g / R.catDrv)), 90, 60);
      if (ev.svc) mk('service', Math.ceil(g / R.catSvc), 60, 30);
    } else {
      mk('service', Math.ceil(g / R.svc), 60, 45);
      mk('koch', Math.ceil(g / R.kit), 120, -30);
      mk('spueler', Math.ceil(g / R.dish), 30, 60);
      mk('bar', Math.ceil(g / R.bar), 60, 30);
      if (g >= R.leadFrom) mk('leitung', 1, 90, 30);
    }
    return out;
  }

  let _idc = 0;
  const uid = p => (p || 's') + Date.now().toString(36).slice(-5) + (++_idc).toString(36) + Math.floor(Math.random() * 1296).toString(36);

  /* Schichten der Woche an den Bedarf anpassen. Zugewiesene Schichten werden nie gelöscht. */
  function syncDemand(shifts, demand) {
    const res = shifts.map(x => Object.assign({}, x));
    const byKey = {};
    for (const sh of res) if (sh.t) (byKey[sh.d + '|' + sh.t] = byKey[sh.d + '|' + sh.t] || []).push(sh);
    const want = {};
    for (const dm of demand) want[dm.key] = dm;
    let added = 0, removed = 0;
    for (const key in want) {
      const dm = want[key], ex = byKey[key] || [];
      for (const sh of ex) if (!sh.emp && !sh.cust) { sh.s = dm.s; sh.e = dm.e; sh.b = dm.b; sh.b0 = dm.b; sh.r = dm.r; sh.a = dm.a; }
      if (ex.length < dm.n) {
        for (let i = ex.length; i < dm.n; i++) { res.push({ id: uid('s'), d: dm.d, t: dm.t, a: dm.a, r: dm.r, s: dm.s, e: dm.e, b: dm.b, b0: dm.b, emp: null, loc: dm.loc || '', ev: dm.ev || undefined }); added++; }
      } else if (ex.length > dm.n) {
        let surplus = ex.length - dm.n;
        for (const sh of ex.slice().reverse()) {
          if (surplus <= 0) break;
          if (!sh.emp && !sh.lk) { sh._del = true; surplus--; removed++; }
        }
      }
    }
    for (const key in byKey) if (!want[key]) for (const sh of byKey[key]) if (!sh.emp && !sh.lk) { sh._del = true; removed++; }
    return { shifts: res.filter(x => !x._del), added, removed };
  }

  function demandDiff(shifts, demand) {
    const cnt = {};
    for (const sh of shifts) if (sh.t) cnt[sh.d + '|' + sh.t] = (cnt[sh.d + '|' + sh.t] || 0) + 1;
    let plus = 0, minus = 0;
    const want = {};
    for (const dm of demand) { want[dm.key] = dm.n; const c = cnt[dm.key] || 0; if (c < dm.n) plus += dm.n - c; }
    for (const sh of shifts) if (sh.t && !sh.emp && !sh.lk) {
      const k = sh.d + '|' + sh.t;
      const w = want[k] || 0, c = cnt[k] || 0;
      if (c > w) { minus++; cnt[k]--; }
    }
    return { plus, minus };
  }

  /* ---------------- Planungs-Kontext ---------------- */
  /* ctx: { cfg, staff[], absences[], dates[7], shifts[], prev[], next[], hist{} }
     hist[empId] = { monE:{'YYYY-MM':€}, sunY:n, we4:n, late4:n } – aus anderen Wochen */
  function buildCtx(input) {
    const { cfg, staff, absences, dates } = input;
    const empMap = {}, absBy = {};
    for (const e of staff) empMap[e.id] = e;
    for (const a of absences || []) (absBy[a.emp] = absBy[a.emp] || []).push(a);
    const y = +dates[3].slice(0, 4);
    const sunInYear = (() => { let c = 0, d = y + '-01-01'; while (dow(d) !== 0) d = addDays(d, 1); while (d.slice(0, 4) == y) { c++; d = addDays(d, 7); } return c; })();
    const minFree = (cfg.rules && cfg.rules.minFreeSun != null) ? cfg.rules.minFreeSun : 15;
    return Object.assign({}, input, { empMap, absBy, year: y, sunAllowed: sunInYear - minFree, hist: input.hist || {} });
  }

  /* Zustand pro Mitarbeiter aus allen bekannten Schichten */
  function buildState(ctx, shifts) {
    const S = {};
    const mon = ctx.dates[0];
    for (const e of ctx.staff) S[e.id] = { list: [], wh: 0, days: new Set(), we: 0, late: 0, mon: {}, sun: 0, target: weekTarget(e, ctx.cfg, mon, ctx.absBy) };
    const inWeek = new Set(ctx.dates);
    const addSh = (sh, ownWeek) => {
      const st = S[sh.emp]; if (!st) return;
      st.list.push(sh);
      if (ownWeek) {
        const h = netH(sh); st.wh += h; st.days.add(sh.d);
        const w = dow(sh.d); if (w === 0 || w === 6) st.we++; if (w === 0) st.sun++;
        if (isLate(sh)) st.late++;
        const mk = monthKey(sh.d); st.mon[mk] = (st.mon[mk] || 0) + h * (+(ctx.empMap[sh.emp] || {}).wage || 0);
      }
    };
    for (const sh of ctx.prev || []) if (sh.emp) addSh(sh, false);
    for (const sh of ctx.next || []) if (sh.emp) addSh(sh, false);
    for (const sh of shifts) if (sh.emp && inWeek.has(sh.d)) addSh(sh, true);
    for (const id in S) S[id].list.sort((a, b) => absS(a) - absS(b));
    return S;
  }
  function stAdd(st, sh, ctx) {
    let i = 0; const a = absS(sh); while (i < st.list.length && absS(st.list[i]) < a) i++;
    st.list.splice(i, 0, sh);
    const h = netH(sh); st.wh += h; st.days.add(sh.d);
    const w = dow(sh.d); if (w === 0 || w === 6) st.we++; if (w === 0) st.sun++;
    if (isLate(sh)) st.late++;
    const mk = monthKey(sh.d); st.mon[mk] = (st.mon[mk] || 0) + h * (+(ctx.empMap[sh.emp] || {}).wage || 0);
  }
  function stRemove(st, sh, ctx, empId) {
    const i = st.list.indexOf(sh); if (i < 0) return;
    st.list.splice(i, 1);
    const h = netH(sh); st.wh -= h;
    if (!st.list.some(x => x.d === sh.d && ctx.dates.includes(x.d))) st.days.delete(sh.d);
    const w = dow(sh.d); if (w === 0 || w === 6) st.we--; if (w === 0) st.sun--;
    if (isLate(sh)) st.late--;
    const mk = monthKey(sh.d); st.mon[mk] = (st.mon[mk] || 0) - h * (+(ctx.empMap[empId] || {}).wage || 0);
  }

  /* ---------------- harte Regeln: darf emp diese Schicht? ---------------- */
  function canWork(emp, sh, st, ctx, opt) {
    const cfg = ctx.cfg, R = cfg.rules || {};
    if (!emp || emp.active === false) return 'r_inactive';
    if (emp.start && sh.d < emp.start) return 'r_notyet';
    if (emp.end && sh.d > emp.end) return 'r_left';
    if (!(emp.roles || []).includes(sh.r)) return 'r_role';
    if (sh.loc && emp.locs && emp.locs.length && !emp.locs.includes(sh.loc)) return 'r_loc';
    const ab = absenceOn(ctx.absBy, emp.id, sh.d);
    if (ab && ab.k !== 'wunsch') return 'r_abs_' + ab.k;
    const youth = ageOn(emp.birth, sh.d) < 18;
    const s = absS(sh), e = absE(sh), base = dayNum(sh.d) * 1440;
    if (!(opt && opt.ignoreAvail)) {
      const av = availOn(emp, sh.d);
      if (!av) return 'r_avail';
      if (s - base < av.f || e - base > av.t) return 'r_avail_time';
    }
    if (youth) {
      const age = ageOn(emp.birth, sh.d);
      const until = age >= 16 ? toMin(R.youthUntil || '22:00') : 20 * 60;
      if (s - base < 360 || e - base > until) return 'r_youth_time';
      const nextD = addDays(sh.d, 1);
      if ((emp.school || []).includes(dow(nextD)) && e - base > 20 * 60) return 'r_youth_school';
      if ((grossMin(sh) - fitBreak(sh, emp)) / 60 > 8) return 'r_youth_day';
    }
    if ((emp.school || []).includes(dow(sh.d))) return 'r_school';
    const restMin = (youth ? 12 : (R.rest10 ? 10 : (R.rest || 11))) * 60;
    const myNet = grossMin(sh) - fitBreak(sh, emp), myH = myNet / 60;
    let dayNet = myNet, sameDay = 0;
    for (const o of st.list) {
      if (o === sh) continue;
      const os = absS(o), oe = absE(o);
      if (os < e && oe > s) return 'r_overlap';
      if (o.d === sh.d) {
        sameDay++; dayNet += netMin(o);
        const gap = os >= e ? os - e : s - oe;
        if (gap < 60) return 'r_overlap';
      } else {
        if (oe <= s && s - oe < restMin) return 'r_rest';
        if (os >= e && os - e < restMin) return 'r_rest';
      }
    }
    if (sameDay > 0 && !(emp.split || (opt && opt.allowSplit))) return 'r_split';
    const maxDay = (youth ? 8 : (R.maxDay || 10)) * 60;
    if (dayNet > maxDay) return 'r_day';
    if (ctx.dates.includes(sh.d)) {
      if (st.wh + myH > hardWeekMax(emp, cfg, sh.d) + 1e-6) return 'r_week';
      const newDay = !st.days.has(sh.d);
      const maxD = youth ? Math.min(5, emp.maxD || 5) : (emp.maxD || defaultMaxDays(emp.ct));
      if (newDay && st.days.size + 1 > maxD) return 'r_days';
      if (newDay) {
        const run = runLength(st, sh.d, ctx);
        if (run > (R.maxRun || 6)) return 'r_run';
      }
      if (emp.ct === 'MJ') {
        const mk = monthKey(sh.d), y = +sh.d.slice(0, 4);
        const other = ((ctx.hist[emp.id] || {}).monE || {})[mk] || 0;
        if (other + (st.mon[mk] || 0) + myH * (+emp.wage || 0) > minijobCap(y, cfg) + 0.01) return 'r_minijob';
      }
      if (dow(sh.d) === 0 && R.sun15 !== false && !st.days.has(sh.d)) {
        const h = ctx.hist[emp.id] || {};
        if ((h.sunY || 0) + st.sun + 1 > ctx.sunAllowed) return 'r_sun15';
      }
    }
    return null;
  }
  function runLength(st, d, ctx) {
    const dn = dayNum(d);
    const worked = new Set(st.list.map(x => dayNum(x.d)));
    let run = 1, k = dn - 1; while (worked.has(k)) { run++; k--; }
    k = dn + 1; while (worked.has(k)) { run++; k++; }
    return run;
  }

  /* ---------------- Bewertung ---------------- */
  const WEIGHTS = {
    balanced: { hours: 30, over: 22, wish: 8, fair: 6, cost: 6, cluster: 3 },
    cost: { hours: 22, over: 35, wish: 5, fair: 4, cost: 18, cluster: 3 },
    fair: { hours: 26, over: 22, wish: 8, fair: 14, cost: 3, cluster: 2 },
    wish: { hours: 26, over: 22, wish: 18, fair: 6, cost: 4, cluster: 3 }
  };
  function scoreFor(emp, sh, st, ctx, W, rnd) {
    const why = [];
    let sc = 0;
    const h = netH(sh), tgt = st.target;
    if (tgt > 0) {
      const need = Math.max(-2, Math.min(2, (tgt - st.wh) / 8)) * (salaried(emp.ct) ? 1.3 : 1);
      sc += W.hours * need;
      if (tgt - st.wh >= 4) why.push(['w_under', Math.round(tgt - st.wh)]);
      const over = st.wh + h - tgt;
      if (over > 0.5) { sc -= W.over * over / 8; why.push(['w_over', Math.round(over)]); }
    } else sc -= W.over * 0.3;
    if (emp.primary === sh.r) sc += 6; else why.push(['w_second']);
    const late = isLate(sh), early = isEarly(sh);
    if (emp.pref === 'early') { if (early) { sc += W.wish * 0.7; why.push(['w_pref']); } else if (late) sc -= W.wish * 0.7; }
    if (emp.pref === 'late') { if (late) { sc += W.wish * 0.7; why.push(['w_pref']); } else if (early) sc -= W.wish * 0.7; }
    const ab = absenceOn(ctx.absBy, emp.id, sh.d);
    if (ab && ab.k === 'wunsch') { sc -= W.wish * 3; why.push(['w_wish_off']); }
    const H = ctx.hist[emp.id] || {}, w = dow(sh.d);
    if (w === 0 || w === 6) {
      const load = st.we * 0.8 + (H.we4 || 0) / 4 * 0.7;
      sc -= W.fair * load;
      if (load < 0.5) why.push(['w_few_we']);
    }
    if (late) sc -= W.fair * 0.25 * (st.late + (H.late4 || 0) / 4);
    if (w === 0) sc -= W.fair * 0.6 * ((H.sunY || 0) + st.sun) / Math.max(1, ctx.sunAllowed) * 4;
    const cost = shiftCost(sh, emp, ctx.cfg).total / Math.max(h, 0.5);
    const avg = ctx.avgCostH || 20;
    sc -= W.cost * (cost - avg) / avg;
    if (cost < avg * 0.9) why.push(['w_cheap']);
    const dn = dayNum(sh.d);
    if (st.list.some(x => { const k = dayNum(x.d); return k === dn - 1 || k === dn + 1; })) sc += W.cluster;
    let minGap = 1e9;
    for (const x of st.list) { if (x.d === sh.d) continue; const g = absS(x) >= absE(sh) ? absS(x) - absE(sh) : absS(sh) - absE(x); if (g >= 0 && g < minGap) minGap = g; }
    if (minGap < 11 * 60) { sc -= 12; why.push(['w_rest10']); } else if (minGap < 12 * 60) sc -= 3;
    const prevSame = st.list.find(x => dayNum(x.d) === dn - 1);
    if (prevSame && Math.abs(toMin(prevSame.s) - toMin(sh.s)) <= 60) sc += 2;
    sc += (rnd ? rnd() : Math.random()) * 0.8;
    return { sc, why };
  }

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  function doAssign(S, sh, emp, ctx) { if (sh.b0 == null) sh.b0 = sh.b || 0; sh.emp = emp.id; sh.b = fitBreak(sh, emp); stAdd(S[emp.id], sh, ctx); }
  function doUnassign(S, sh, ctx) { const id = sh.emp; if (!id) return; stRemove(S[id], sh, ctx, id); sh.emp = null; if (sh.b0 != null) sh.b = sh.b0; }

  /* ---------------- Auto-Planung ---------------- */
  function autoPlan(input, opts) {
    opts = opts || {};
    const ctx = buildCtx(input);
    const W = WEIGHTS[opts.strategy] || WEIGHTS.balanced;
    const rnd = rng(opts.seed || hashStr(ctx.dates[0]));
    const shifts = ctx.shifts.map(x => Object.assign({}, x));
    const inWeek = new Set(ctx.dates);
    if (opts.mode === 'replan') for (const sh of shifts) if (inWeek.has(sh.d) && !sh.lk) { sh.emp = null; if (sh.b0 != null) sh.b = sh.b0; delete sh.src; }
    // ungültige feste Zuweisungen bleiben (werden vom Regel-Check gemeldet)
    const active = ctx.staff.filter(e => e.active !== false);
    let costs = [];
    for (const e of active) costs.push((+e.wage || 14) * ((ctx.cfg.fac && ctx.cfg.fac[e.ct]) || 1.21));
    ctx.avgCostH = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 20;
    const S = buildState(ctx, shifts);
    const open = shifts.filter(sh => inWeek.has(sh.d) && !sh.emp);
    const byRole = {};
    for (const e of active) for (const r of e.roles || []) (byRole[r] = byRole[r] || []).push(e);
    const critical = new Set(['leitung', 'kuechenchef']);
    const elig = sh => (byRole[sh.r] || []).filter(e => !absenceOn(ctx.absBy, e.id, sh.d) && availOn(e, sh.d)).length;
    for (const sh of open) sh._el = elig(sh);
    open.sort((a, b) => (critical.has(a.r) ? 0 : 1) - (critical.has(b.r) ? 0 : 1) || a._el - b._el || netMin(b) - netMin(a) || a.d.localeCompare(b.d) || toMin(a.s) - toMin(b.s));
    const reasons = {};
    for (const sh of open) {
      let best = null, bestSc = -Infinity, bestWhy = null;
      for (const e of byRole[sh.r] || []) {
        const st = S[e.id];
        if (canWork(e, sh, st, ctx)) continue;
        const { sc, why } = scoreFor(e, sh, st, ctx, W, rnd);
        if (sc > bestSc) { bestSc = sc; best = e; bestWhy = why; }
      }
      if (best) { doAssign(S, sh, best, ctx); sh.src = 'auto'; reasons[sh.id] = bestWhy; }
    }
    // Verbesserung 1: offene Schichten über Tausch-Ketten füllen
    let moves = 0;
    for (const sh of open.filter(x => !x.emp)) {
      let done = false;
      for (const x of byRole[sh.r] || []) {
        if (done) break;
        const stx = S[x.id];
        const r0 = canWork(x, sh, stx, ctx);
        if (!r0) { doAssign(S, sh, x, ctx); sh.src = 'auto'; done = true; break; }
        if (!['r_rest', 'r_overlap', 'r_split', 'r_day', 'r_days', 'r_week', 'r_run'].includes(r0)) continue;
        const dn = dayNum(sh.d);
        const pool = stx.list.filter(o => inWeek.has(o.d) && !o.lk && o.emp === x.id && (r0 === 'r_days' || r0 === 'r_week' || r0 === 'r_run' || Math.abs(dayNum(o.d) - dn) <= 1));
        for (const o of pool) {
          doUnassign(S, o, ctx);
          if (!canWork(x, sh, stx, ctx)) {
            let repl = null, rs = -Infinity;
            for (const z of byRole[o.r] || []) {
              if (z.id === x.id || canWork(z, o, S[z.id], ctx)) continue;
              const { sc } = scoreFor(z, o, S[z.id], ctx, W, rnd);
              if (sc > rs) { rs = sc; repl = z; }
            }
            if (repl) { doAssign(S, o, repl, ctx); o.src = 'auto'; doAssign(S, sh, x, ctx); sh.src = 'auto'; moves++; done = true; break; }
          }
          doAssign(S, o, x, ctx);
        }
      }
    }
    // Verbesserung 2: Vertragsstunden zuerst ausschöpfen (fest Angestellte vor Minijob/Aushilfe)
    for (let pass = 0; pass < 4; pass++) {
      const under = active.filter(e => salaried(e.ct) && S[e.id].target - S[e.id].wh >= 3)
        .sort((a, b) => (S[b.id].target - S[b.id].wh) - (S[a.id].target - S[a.id].wh));
      let changed = false;
      for (const u of under) {
        const su = S[u.id];
        for (const sh of shifts) {
          if (su.target - su.wh < 3) break;
          if (!sh.emp || sh.emp === u.id || sh.lk || !inWeek.has(sh.d) || !(u.roles || []).includes(sh.r)) continue;
          const o = ctx.empMap[sh.emp], so = S[sh.emp];
          if (!o) continue;
          const h = netH(sh);
          if (su.wh + h > su.target + 1.5) continue;
          const give = !salaried(o.ct) || so.wh - so.target > 1;
          if (!give) continue;
          if (!salaried(o.ct) && o.ct !== 'AH' && so.wh - h < so.target * 0.5 && so.wh - so.target < 0) continue;
          if (canWork(u, sh, su, ctx)) continue;
          doUnassign(S, sh, ctx);
          if (canWork(u, sh, su, ctx)) { doAssign(S, sh, o, ctx); continue; }
          doAssign(S, sh, u, ctx); sh.src = 'auto'; moves++; changed = true;
        }
      }
      if (!changed) break;
    }
    for (const sh of open) delete sh._el;
    const unfilled = shifts.filter(sh => inWeek.has(sh.d) && !sh.emp).length;
    return { shifts, unfilled, moves, reasons };
  }

  /* Kandidaten für eine Schicht (für „Wer kann einspringen?“) */
  function candidates(input, shiftId, opts) {
    const ctx = buildCtx(input);
    const W = WEIGHTS[(opts && opts.strategy) || 'balanced'];
    const shifts = ctx.shifts.map(x => Object.assign({}, x));
    const target = shifts.find(x => x.id === shiftId);
    if (!target) return { ok: [], no: [] };
    const cur = target.emp; target.emp = null;
    const active = ctx.staff.filter(e => e.active !== false);
    let costs = active.map(e => (+e.wage || 14) * ((ctx.cfg.fac && ctx.cfg.fac[e.ct]) || 1.21));
    ctx.avgCostH = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 20;
    const S = buildState(ctx, shifts);
    const rnd = rng(7);
    const ok = [], no = [];
    for (const e of active) {
      if (e.id === cur) continue;
      const hasRole = (e.roles || []).includes(target.r);
      const r = canWork(e, target, S[e.id], ctx);
      if (!r) { const { sc, why } = scoreFor(e, target, S[e.id], ctx, W, () => 0.5 + rnd() * 0.01); ok.push({ id: e.id, sc, why, wh: S[e.id].wh, target: S[e.id].target }); }
      else if (hasRole) no.push({ id: e.id, r, wh: S[e.id].wh });
    }
    ok.sort((a, b) => b.sc - a.sc);
    return { ok, no, current: cur };
  }

  /* ---------------- Regel-Check ---------------- */
  function checkWeek(input) {
    const ctx = buildCtx(input), cfg = ctx.cfg, R = cfg.rules || {};
    const issues = [], inWeek = new Set(ctx.dates);
    const S = buildState(ctx, ctx.shifts);
    const push = (sev, code, o) => issues.push(Object.assign({ sev, code }, o || {}));
    // offene / überzählige Schichten
    const openBy = {};
    for (const sh of ctx.shifts) if (inWeek.has(sh.d) && !sh.emp) { const k = sh.d + '|' + (sh.t || sh.r) + '|' + sh.s; (openBy[k] = openBy[k] || { d: sh.d, t: sh.t, r: sh.r, s: sh.s, e: sh.e, n: 0, id: sh.id }).n++; }
    for (const k in openBy) { const o = openBy[k]; push('warn', 'c_open', { d: o.d, t: o.t, r: o.r, n: o.n, shiftId: o.id, s: o.s, e: o.e }); }
    const legalNow = minWage(ctx.year, cfg), nextYear = ctx.year + 1, legalNext = lookupYear(MINWAGE, nextYear);
    const belowNext = [];
    for (const e of ctx.staff) {
      if (e.active === false) continue;
      const st = S[e.id];
      const mine = st.list.filter(x => inWeek.has(x.d) && x.emp === e.id);
      const adult = ageOn(e.birth, ctx.dates[3]) >= 18;
      if (adult && e.ct !== 'AZ' && (+e.wage || 0) > 0 && +e.wage < legalNow - 1e-6) push('err', 'c_minwage', { emp: e.id, v: legalNow });
      else if (adult && e.ct !== 'AZ' && (+e.wage || 0) > 0 && legalNext > legalNow && +e.wage < legalNext && ctx.dates[6] >= ctx.year + '-11-01') belowNext.push(e.id);
      if (!mine.length) continue;
      const youth = ageOn(e.birth, ctx.dates[3]) < 18;
      for (const sh of mine) {
        const tmp = Object.assign({}, st, { list: st.list.filter(x => x !== sh) });
        // Einzelregeln gezielt prüfen
        if (!(e.roles || []).includes(sh.r)) push('err', 'c_role', { emp: e.id, shiftId: sh.id, d: sh.d });
        const ab = absenceOn(ctx.absBy, e.id, sh.d);
        if (ab && ab.k !== 'wunsch') push('err', 'c_abs', { emp: e.id, shiftId: sh.id, d: sh.d, k: ab.k });
        if (ab && ab.k === 'wunsch') push('warn', 'c_wish', { emp: e.id, shiftId: sh.id, d: sh.d });
        const av = availOn(e, sh.d), base = dayNum(sh.d) * 1440;
        if (!av) push('warn', 'c_avail', { emp: e.id, shiftId: sh.id, d: sh.d });
        else if (absS(sh) - base < av.f || absE(sh) - base > av.t) push('warn', 'c_avail_time', { emp: e.id, shiftId: sh.id, d: sh.d });
        const need = legalBreak(netMin(sh), youth);
        if ((sh.b || 0) < need) push('err', 'c_break', { emp: e.id, shiftId: sh.id, d: sh.d, v: need });
        if (youth) {
          const age = ageOn(e.birth, sh.d), until = age >= 16 ? toMin(R.youthUntil || '22:00') : 1200;
          if (absS(sh) - base < 360 || absE(sh) - base > until) push('err', 'c_youth_time', { emp: e.id, shiftId: sh.id, d: sh.d });
          if ((e.school || []).includes(dow(addDays(sh.d, 1))) && absE(sh) - base > 1200) push('err', 'c_youth_school', { emp: e.id, shiftId: sh.id, d: sh.d });
          if (netH(sh) > 8) push('err', 'c_youth_day', { emp: e.id, shiftId: sh.id, d: sh.d });
        }
        if ((e.school || []).includes(dow(sh.d))) push('warn', 'c_school', { emp: e.id, shiftId: sh.id, d: sh.d });
        void tmp;
      }
      // Ruhezeit, Überschneidung, Tageshöchstzeit
      const L = st.list;
      for (let i = 0; i < L.length; i++) {
        const a = L[i];
        for (let j = i + 1; j < L.length; j++) {
          const b = L[j];
          if (!inWeek.has(a.d) && !inWeek.has(b.d)) continue;
          if (absS(b) < absE(a)) { push('err', 'c_overlap', { emp: e.id, shiftId: b.id, d: b.d }); continue; }
          if (a.d !== b.d) {
            const rest = (absS(b) - absE(a)) / 60;
            const min = youth ? 12 : (R.rest || 11);
            if (rest < min) {
              if (!youth && R.rest10 && rest >= 10) push('info', 'c_rest10', { emp: e.id, shiftId: b.id, d: b.d, v: Math.round(rest * 10) / 10 });
              else push('err', 'c_rest', { emp: e.id, shiftId: b.id, d: b.d, v: Math.round(rest * 10) / 10 });
            }
            break;
          }
        }
      }
      const perDay = {};
      for (const sh of mine) perDay[sh.d] = (perDay[sh.d] || 0) + netMin(sh);
      for (const d in perDay) {
        const h = perDay[d] / 60;
        if (h > (youth ? 8 : (R.maxDay || 10)) + 1e-6) push('err', 'c_day', { emp: e.id, d, v: Math.round(h * 10) / 10 });
        else if (!youth && h > 8 + 1e-6) push('info', 'c_day8', { emp: e.id, d, v: Math.round(h * 10) / 10 });
        if (mine.filter(x => x.d === d).length > 1 && !e.split) push('warn', 'c_split', { emp: e.id, d });
      }
      const wmax = hardWeekMax(e, cfg, ctx.dates[3]);
      if (st.wh > wmax + 1e-6) push('err', 'c_week', { emp: e.id, v: Math.round(st.wh * 10) / 10, m: wmax });
      const maxD = youth ? 5 : (e.maxD || defaultMaxDays(e.ct));
      if (st.days.size > maxD) push(youth ? 'err' : 'warn', 'c_days', { emp: e.id, v: st.days.size, m: maxD });
      // Tage am Stück (inkl. Vor-/Folgewoche)
      const dns = [...new Set(st.list.map(x => dayNum(x.d)))].sort((a, b) => a - b);
      let run = 1, maxRun = dns.length ? 1 : 0, runEnd = null;
      for (let i = 1; i < dns.length; i++) { if (dns[i] === dns[i - 1] + 1) { run++; if (run > maxRun) { maxRun = run; runEnd = dns[i]; } } else run = 1; }
      if (maxRun > (R.maxRun || 6) && runEnd != null && (inWeek.has(fromDayNum(runEnd)) || inWeek.has(fromDayNum(runEnd - maxRun + 1)))) push('err', 'c_run', { emp: e.id, v: maxRun, m: R.maxRun || 6 });
      // Soll / Überstunden
      if (st.target > 0 && e.ct !== 'MJ') {
        if (st.wh > st.target * 1.1 + 1) push('warn', 'c_overtime', { emp: e.id, v: Math.round((st.wh - st.target) * 10) / 10 });
        else if (salaried(e.ct) && st.wh < st.target * 0.85 - 1) push('info', 'c_undertime', { emp: e.id, v: Math.round((st.target - st.wh) * 10) / 10 });
      }
      // Minijob
      if (e.ct === 'MJ') {
        const months = new Set(ctx.dates.map(monthKey));
        for (const mk of months) {
          const y = +mk.slice(0, 4), cap = minijobCap(y, cfg);
          const tot = (((ctx.hist[e.id] || {}).monE || {})[mk] || 0) + (st.mon[mk] || 0);
          if (tot > cap + 0.01) push('err', 'c_minijob', { emp: e.id, v: Math.round(tot), m: cap, mk });
          else if (tot > cap * 0.9) push('info', 'c_minijob90', { emp: e.id, v: Math.round(tot), m: cap, mk });
        }
      }
      // 15 freie Sonntage
      if (R.sun15 !== false && st.sun > 0) {
        const used = ((ctx.hist[e.id] || {}).sunY || 0) + st.sun;
        if (used > ctx.sunAllowed) push('err', 'c_sun15', { emp: e.id, v: used, m: ctx.sunAllowed });
        else if (used > ctx.sunAllowed - 3) push('warn', 'c_sun15_near', { emp: e.id, v: used, m: ctx.sunAllowed });
      }
      if (youth) {
        const we = mine.filter(x => dow(x.d) === 0 || dow(x.d) === 6).length;
        if (we >= 2) push('info', 'c_youth_we', { emp: e.id });
      }
    }
    if (belowNext.length) push('info', 'c_minwage_next', { emps: belowNext, n: belowNext.length, v: legalNext, y: nextYear });
    const order = { err: 0, warn: 1, info: 2 };
    issues.sort((a, b) => order[a.sev] - order[b.sev]);
    return issues;
  }

  /* ---------------- Statistik ---------------- */
  function weekStats(wk, shifts, cfg, staffMap) {
    const dates = weekDates(wkStart(wk)), inWeek = new Set(dates);
    const out = { wk, y: +dates[3].slice(0, 4), sunY: +dates[6].slice(0, 4), start: dates[0], emp: {}, tot: { h: 0, c: 0 } };
    for (const sh of shifts) {
      if (!sh.emp || !inWeek.has(sh.d)) continue;
      const e = staffMap[sh.emp]; if (!e) continue;
      const o = out.emp[sh.emp] = out.emp[sh.emp] || { h: 0, c: 0, sun: 0, hol: 0, we: 0, late: 0, days: 0, n: 0, mon: {} };
      const h = netH(sh), c = shiftCost(sh, e, cfg);
      o.h += h; o.c += c.total; o.n++;
      if (dow(sh.d) === 0) o.sun = 1;
      if (holidayOf(sh.d, cfg.state)) o.hol++;
      if (dow(sh.d) === 0 || dow(sh.d) === 6) o.we++;
      if (isLate(sh)) o.late++;
      const mk = monthKey(sh.d); o.mon[mk] = o.mon[mk] || [0, 0]; o.mon[mk][0] += h; o.mon[mk][1] += h * (+e.wage || 0);
      out.tot.h += h; out.tot.c += c.total;
    }
    for (const id in out.emp) {
      const o = out.emp[id];
      o.days = new Set(shifts.filter(x => x.emp === id && inWeek.has(x.d)).map(x => x.d)).size;
      o.h = Math.round(o.h * 100) / 100; o.c = Math.round(o.c * 100) / 100;
      for (const mk in o.mon) o.mon[mk] = [Math.round(o.mon[mk][0] * 100) / 100, Math.round(o.mon[mk][1] * 100) / 100];
    }
    out.tot.h = Math.round(out.tot.h * 10) / 10; out.tot.c = Math.round(out.tot.c);
    return out;
  }
  /* Historie aus Statistik-Dokumenten anderer Wochen */
  function histFrom(statsDocs, wk) {
    const hist = {}, dates = weekDates(wkStart(wk)), y = +dates[3].slice(0, 4);
    const months = new Set(dates.map(monthKey));
    const recent = new Set([1, 2, 3, 4].map(n => wkShift(wk, -n)));
    for (const sd of statsDocs) {
      if (!sd || sd.wk === wk) continue;
      for (const id in sd.emp || {}) {
        const o = sd.emp[id], h = hist[id] = hist[id] || { monE: {}, sunY: 0, we4: 0, late4: 0 };
        for (const mk in o.mon || {}) if (months.has(mk)) h.monE[mk] = (h.monE[mk] || 0) + (o.mon[mk][1] || 0);
        if (sd.sunY === y && sd.start < dates[0]) h.sunY += o.sun || 0;
        if (recent.has(sd.wk)) { h.we4 += o.we || 0; h.late4 += o.late || 0; }
      }
    }
    return hist;
  }

  /* ---------------- Nachrichten an Mitarbeiter ---------------- */
  /* Sprachen der Mitarbeiter-Nachrichten (die Oberfläche selbst: DE/TR/EN) */
  const MSG = {
    de: { label: 'Deutsch', hi: 'Hallo {n},', week: 'dein Schichtplan für KW {w} ({r}) – {b}:', upd: 'AKTUALISIERT – dein Schichtplan für KW {w} ({r}) – {b}:', off: 'frei', tot: 'Gesamt: {h} Std.', tom: 'kurze Erinnerung: morgen ({d}) arbeitest du {t}.', tom2: 'Bis morgen!', none: 'du hast in KW {w} ({r}) keine Schichten.', days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], loc: 'de-DE' },
    tr: { label: 'Türkçe', hi: 'Merhaba {n},', week: '{b} – {w}. hafta ({r}) vardiya planın:', upd: 'GÜNCELLENDİ – {b} – {w}. hafta ({r}) vardiya planın:', off: 'izin', tot: 'Toplam: {h} saat', tom: 'kısa hatırlatma: yarın ({d}) {t} çalışıyorsun.', tom2: 'Yarın görüşürüz!', none: '{w}. hafta ({r}) vardiyan yok.', days: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], loc: 'tr-TR' },
    en: { label: 'English', hi: 'Hi {n},', week: 'your schedule for week {w} ({r}) – {b}:', upd: 'UPDATED – your schedule for week {w} ({r}) – {b}:', off: 'off', tot: 'Total: {h} h', tom: 'quick reminder: tomorrow ({d}) you work {t}.', tom2: 'See you tomorrow!', none: 'you have no shifts in week {w} ({r}).', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], loc: 'en-GB' },
    ar: { label: 'العربية', rtl: true, hi: 'مرحباً {n}،', week: 'جدول مناوباتك للأسبوع {w} ({r}) – {b}:', upd: 'تحديث – جدول مناوباتك للأسبوع {w} ({r}) – {b}:', off: 'عطلة', tot: 'المجموع: {h} ساعة', tom: 'تذكير: غداً ({d}) تعمل {t}.', tom2: 'نراك غداً!', none: 'ليس لديك مناوبات في الأسبوع {w} ({r}).', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], loc: 'en-GB' },
    ku: { label: 'Kurdî (Kurmancî)', hi: 'Silav {n},', week: 'plana te ya xebatê ji bo hefteya {w} ({r}) – {b}:', upd: 'NÛKIRÎ – plana te ya xebatê ji bo hefteya {w} ({r}) – {b}:', off: 'vala', tot: 'Bi giştî: {h} saet', tom: 'bîranîn: sibê ({d}) tu {t} dixebitî.', tom2: 'Heta sibê!', none: 'di hefteya {w} ({r}) de xebata te tune ye.', days: ['Yekşem', 'Duşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'], loc: 'de-DE' },
    ckb: { label: 'کوردی (سۆرانی)', rtl: true, hi: 'سڵاو {n}،', week: 'خشتەی کارەکەت بۆ هەفتەی {w} ({r}) – {b}:', upd: 'نوێکراوە – خشتەی کارەکەت بۆ هەفتەی {w} ({r}) – {b}:', off: 'پشوو', tot: 'کۆی گشتی: {h} کاتژمێر', tom: 'بیرخستنەوە: سبەی ({d}) کار دەکەیت، {t}.', tom2: 'تا سبەی!', none: 'لە هەفتەی {w} ({r}) هیچ کارێکت نییە.', days: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'], loc: 'de-DE' },
    sq: { label: 'Shqip', hi: 'Përshëndetje {n},', week: 'orari yt i punës për javën {w} ({r}) – {b}:', upd: 'PËRDITËSUAR – orari yt i punës për javën {w} ({r}) – {b}:', off: 'pushim', tot: 'Gjithsej: {h} orë', tom: 'kujtesë: nesër ({d}) punon {t}.', tom2: 'Shihemi nesër!', none: 'nuk ke turne në javën {w} ({r}).', days: ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'], loc: 'de-DE' },
    sr: { label: 'Srpski', hi: 'Zdravo {n},', week: 'tvoj raspored smena za {w}. nedelju ({r}) – {b}:', upd: 'AŽURIRANO – tvoj raspored smena za {w}. nedelju ({r}) – {b}:', off: 'slobodno', tot: 'Ukupno: {h} sati', tom: 'podsetnik: sutra ({d}) radiš {t}.', tom2: 'Vidimo se sutra!', none: 'nemaš smena u {w}. nedelji ({r}).', days: ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'], loc: 'de-DE' },
    fa: { label: 'دری (Dari)', rtl: true, hi: 'سلام {n}،', week: 'تقسیم اوقات کاری شما برای هفتهٔ {w} ({r}) – {b}:', upd: 'به‌روز شد – تقسیم اوقات کاری شما برای هفتهٔ {w} ({r}) – {b}:', off: 'رخصتی', tot: 'مجموع: {h} ساعت', tom: 'یادآوری: فردا ({d}) شما {t} کار دارید.', tom2: 'تا فردا!', none: 'شما در هفتهٔ {w} ({r}) نوبت کاری ندارید.', days: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'], loc: 'de-DE' },
    ps: { label: 'پښتو (Pashto)', rtl: true, hi: 'سلام {n}،', week: 'د {w} اونۍ ({r}) لپاره ستاسو د کار مهالویش – {b}:', upd: 'تازه شوی – د {w} اونۍ ({r}) لپاره ستاسو د کار مهالویش – {b}:', off: 'رخصتي', tot: 'ټول: {h} ساعته', tom: 'یادونه: سبا ({d}) تاسو {t} کار کوئ.', tom2: 'تر سبا پورې!', none: 'تاسو د {w} اونۍ ({r}) کې هېڅ کاري نوبت نه لرئ.', days: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'], loc: 'de-DE' }
  };
  /* Bereichsnamen für Nachrichtensprachen ohne eigene Rollennamen */
  const AREA_MSG = {
    lead: { ar: 'الإدارة', ku: 'Rêveberî', ckb: 'بەڕێوەبەرایەتی', sq: 'Drejtimi', sr: 'Rukovodstvo', fa: 'مدیریت', ps: 'مدیریت' },
    kitchen: { ar: 'المطبخ', ku: 'Mitbex', ckb: 'چێشتخانە', sq: 'Kuzhina', sr: 'Kuhinja', fa: 'آشپزخانه', ps: 'پخلنځی' },
    service: { ar: 'الخدمة (الصالة)', ku: 'Servîs', ckb: 'خزمەتگوزاری', sq: 'Shërbimi', sr: 'Sala', fa: 'خدمات (سالن)', ps: 'خدمت (سالون)' },
    bar: { ar: 'المشروبات', ku: 'Vexwarin', ckb: 'خواردنەوە', sq: 'Bari', sr: 'Šank', fa: 'نوشیدنی‌ها', ps: 'څښاک' },
    dish: { ar: 'غسيل الصحون', ku: 'Firaqşûştin', ckb: 'قاپشۆری', sq: 'Larja e enëve', sr: 'Perionica', fa: 'ظرف‌شویی', ps: 'لوښي مینځل' },
    delivery: { ar: 'التوصيل', ku: 'Gihandin', ckb: 'گەیاندن', sq: 'Dorëzimi', sr: 'Dostava', fa: 'تحویل', ps: 'رسونه' },
    clean: { ar: 'التنظيف', ku: 'Paqijî', ckb: 'پاککردنەوە', sq: 'Pastrimi', sr: 'Čišćenje', fa: 'نظافت', ps: 'پاکاري' }
  };
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : ''));
  const ddmm = d => d.slice(8, 10) + '.' + d.slice(5, 7) + '.';
  const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
  function nameOf(obj, lang) { if (!obj) return ''; if (typeof obj === 'string') return obj; return obj[lang] || obj.de || obj.tr || obj.en || ''; }
  function shiftLabel(sh, cfg, lang) {
    const ro = (cfg.roles || []).find(r => r.id === sh.r);
    if (['de', 'tr', 'en'].includes(lang)) return nameOf(ro && ro.name, lang) || sh.r;
    const a = sh.a || (ro && ro.a);
    if (AREA_MSG[a] && AREA_MSG[a][lang]) return AREA_MSG[a][lang];
    return nameOf(ro && ro.name, 'de') || sh.r;
  }
  function empWeekShifts(emp, shifts, dates) { const inW = new Set(dates); return shifts.filter(s => s.emp === emp.id && inW.has(s.d)).sort((a, b) => absS(a) - absS(b)); }
  function msgHash(emp, shifts, dates) { return hashStr(empWeekShifts(emp, shifts, dates).map(s => s.d + s.s + s.e + s.r).join('|')).toString(36); }
  function weekMessage(emp, shifts, wk, cfg, opt) {
    const lang = MSG[emp.lang] ? emp.lang : 'de', M = MSG[lang];
    const dates = weekDates(wkStart(wk)), mine = empWeekShifts(emp, shifts, dates);
    const w = +wk.split('-W')[1], r = ddmm(dates[0]) + '–' + ddmm(dates[6]);
    const lines = [fill(M.hi, { n: firstName(emp.name) })];
    if (!mine.length) { lines.push(fill(M.none, { w, r })); }
    else {
      lines.push(fill(opt && opt.update ? M.upd : M.week, { w, r, b: cfg.biz || '' }));
      let tot = 0;
      for (const d of dates) {
        const day = mine.filter(s => s.d === d);
        const head = M.days[dow(d)] + ' ' + ddmm(d);
        if (!day.length) { lines.push(head + '  ' + M.off); continue; }
        for (const s of day) { tot += netH(s); lines.push(head + '  ' + s.s + '–' + s.e + '  ' + shiftLabel(s, cfg, lang) + (s.n ? ' (' + s.n + ')' : '')); }
      }
      lines.push(fill(M.tot, { h: (Math.round(tot * 10) / 10).toLocaleString(M.loc) }));
    }
    const foot = cfg.notify && cfg.notify.footer && cfg.notify.footer[lang];
    if (foot) lines.push('', foot);
    return lines.join('\n');
  }
  function dayMessage(emp, shifts, d, cfg) {
    const lang = MSG[emp.lang] ? emp.lang : 'de', M = MSG[lang];
    const mine = shifts.filter(s => s.emp === emp.id && s.d === d).sort((a, b) => absS(a) - absS(b));
    if (!mine.length) return '';
    const t = mine.map(s => s.s + '–' + s.e + ' (' + shiftLabel(s, cfg, lang) + ')').join(', ');
    const lines = [fill(M.hi, { n: firstName(emp.name) }) + ' ' + fill(M.tom, { d: M.days[dow(d)] + ' ' + ddmm(d), t }), M.tom2];
    const foot = cfg.notify && cfg.notify.footer && cfg.notify.footer[lang];
    if (foot) lines.push('', foot);
    return lines.join('\n');
  }
  function normPhone(p, cc) {
    let s = String(p || '').replace(/[^\d+]/g, '');
    if (!s) return '';
    if (s.startsWith('+')) s = s.slice(1);
    else if (s.startsWith('00')) s = s.slice(2);
    else if (s.startsWith('0')) s = (cc || '49') + s.slice(1);
    return s.length >= 9 ? s : '';
  }

  const api = {
    pad, parseD, fmtD, addDays, dow, dayNum, fromDayNum, toMin, fromMin, monthKey, isoWeek, wkId, wkMonday, wkStart, wkShift, weekDates,
    easter, holidays, holidayOf, STATES, builtinSpecials, specialsFor, MINWAGE, MINIJOB, minWage, minijobCap, ageOn, legalBreak, suggestBreak,
    grossMin, netMin, netH, absS, absE, isLate, isEarly, isEve, salaried, defaultMaxDays, hardWeekMax, weekTarget, availOn, absenceOn,
    shiftCost, dayFactors, dayRevenue, baseTarget, fitBreak, doAssign, doUnassign, demandForWeek, eventSlots, syncDemand, demandDiff, uid, buildCtx, buildState, canWork, scoreFor, WEIGHTS,
    autoPlan, candidates, checkWeek, weekStats, histFrom, MSG, AREA_MSG, weekMessage, dayMessage, msgHash, empWeekShifts, normPhone, nameOf, hashStr, rng, firstName, ddmm
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* ==========================================================================
   Standard-Einstellungen + Beispiel-Team (NIRVANA Mechernich)
   ========================================================================== */
(function (root) {
  'use strict';
  const C = root.Core || (typeof require !== 'undefined' ? require('./core.js') : null);

  const N = (de, tr, en) => ({ de, tr, en });

  function defaultConfig(biz) {
    return {
      v: 1,
      biz: biz || 'NIRVANA Mechernich',
      state: 'NW',
      lang: 'tr',
      locs: [{ id: 'nir', name: 'NIRVANA Mechernich' }],
      open: [['09:00', '22:00'], ['10:00', '22:00'], ['10:00', '22:00'], ['10:00', '22:00'], ['10:00', '22:00'], ['10:00', '23:00'], ['10:00', '23:00']],
      areas: [
        { id: 'lead', name: N('Leitung', 'Yönetim', 'Management'), c: '#0A8DB5' },
        { id: 'kitchen', name: N('Küche', 'Mutfak', 'Kitchen'), c: '#C9891A' },
        { id: 'bar', name: N('Bar & Getränke', 'Bar & İçecek', 'Bar & drinks'), c: '#C2508A' },
        { id: 'service', name: N('Service', 'Servis', 'Service'), c: '#3E9E4F' },
        { id: 'dish', name: N('Spülküche', 'Bulaşıkhane', 'Dishwashing'), c: '#4A63D8' },
        { id: 'delivery', name: N('Lieferung', 'Kurye', 'Delivery'), c: '#E0603F' },
        { id: 'clean', name: N('Reinigung', 'Temizlik', 'Cleaning'), c: '#8A6FD3' }
      ],
      roles: [
        { id: 'leitung', a: 'lead', name: N('Schichtleitung', 'Vardiya sorumlusu', 'Shift lead'), sh: N('SL', 'VS', 'SL') },
        { id: 'kuechenchef', a: 'kitchen', name: N('Küchenchef', 'Şef', 'Head chef'), sh: N('KC', 'Şef', 'HC') },
        { id: 'koch', a: 'kitchen', name: N('Koch/Köchin', 'Aşçı', 'Cook'), sh: N('K', 'A', 'C') },
        { id: 'grill', a: 'kitchen', name: N('Grill / Mangal', 'Izgara / Mangal', 'Grill'), sh: N('G', 'M', 'G') },
        { id: 'vorb', a: 'kitchen', name: N('Vorbereitung', 'Hazırlık', 'Prep'), sh: N('V', 'H', 'P') },
        { id: 'fruehst', a: 'kitchen', name: N('Frühstück', 'Kahvaltı', 'Breakfast'), sh: N('F', 'Kh', 'B') },
        { id: 'service', a: 'service', name: N('Service', 'Garson', 'Server'), sh: N('S', 'G', 'S') },
        { id: 'empfang', a: 'service', name: N('Empfang', 'Karşılama', 'Host'), sh: N('E', 'Kr', 'H') },
        { id: 'bar', a: 'bar', name: N('Bar / Çay', 'Bar / Çay ocağı', 'Bar / tea'), sh: N('B', 'B', 'B') },
        { id: 'spueler', a: 'dish', name: N('Spüle', 'Bulaşık', 'Dishwasher'), sh: N('Sp', 'Bl', 'D') },
        { id: 'fahrer', a: 'delivery', name: N('Fahrer', 'Kurye', 'Driver'), sh: N('Fa', 'Ku', 'Dr') },
        { id: 'reinigung', a: 'clean', name: N('Reinigung', 'Temizlik', 'Cleaning'), sh: N('R', 'T', 'Cl') }
      ],
      // dem: Bedarf je Wochentag [So, Mo, Di, Mi, Do, Fr, Sa]
      tpl: [
        { id: 't_sl1', name: N('Schichtleitung Früh', 'Sorumlu sabah', 'Lead early'), r: 'leitung', s: '08:30', e: '17:00', b: 30, dem: [1, 1, 1, 1, 1, 1, 1], scale: false },
        { id: 't_sl2', name: N('Schichtleitung Spät', 'Sorumlu akşam', 'Lead late'), r: 'leitung', s: '15:30', e: '00:00', b: 30, dem: [1, 1, 1, 1, 1, 1, 1], scale: false },
        { id: 't_kc', name: N('Küchenchef', 'Şef', 'Head chef'), r: 'kuechenchef', s: '10:00', e: '18:30', b: 30, dem: [1, 1, 1, 1, 1, 1, 1], scale: false },
        { id: 't_kf', name: N('Küche Früh', 'Mutfak sabah', 'Kitchen early'), r: 'koch', s: '08:00', e: '16:30', b: 30, dem: [3, 2, 2, 2, 2, 2, 2] },
        { id: 't_ks', name: N('Küche Spät', 'Mutfak akşam', 'Kitchen late'), r: 'koch', s: '15:00', e: '23:30', b: 30, dem: [3, 2, 2, 2, 2, 3, 3] },
        { id: 't_gm', name: N('Grill Mittag', 'Mangal öğle', 'Grill lunch'), r: 'grill', s: '11:00', e: '16:30', b: 0, dem: [1, 1, 1, 1, 1, 1, 1] },
        { id: 't_ga', name: N('Grill Abend', 'Mangal akşam', 'Grill evening'), r: 'grill', s: '15:00', e: '23:30', b: 30, dem: [2, 1, 1, 1, 1, 2, 2] },
        { id: 't_vb', name: N('Vorbereitung', 'Hazırlık', 'Prep'), r: 'vorb', s: '08:00', e: '14:00', b: 0, dem: [3, 2, 2, 2, 2, 2, 2] },
        { id: 't_fr', name: N('Frühstück / Buffet', 'Kahvaltı / Büfe', 'Breakfast buffet'), r: 'fruehst', s: '07:30', e: '13:30', b: 0, dem: [2, 1, 1, 1, 1, 1, 1] },
        { id: 't_sf', name: N('Service Früh', 'Servis sabah', 'Service early'), r: 'service', s: '09:00', e: '17:30', b: 30, dem: [7, 3, 3, 3, 3, 4, 5] },
        { id: 't_sm', name: N('Service Mittel', 'Servis ara', 'Service mid'), r: 'service', s: '12:00', e: '20:00', b: 30, dem: [2, 1, 1, 1, 1, 2, 2] },
        { id: 't_ss', name: N('Service Spät', 'Servis akşam', 'Service late'), r: 'service', s: '15:30', e: '23:30', b: 30, dem: [6, 4, 4, 4, 5, 8, 9] },
        { id: 't_em', name: N('Empfang Abend', 'Karşılama akşam', 'Host evening'), r: 'empfang', s: '17:00', e: '23:00', b: 0, dem: [1, 0, 0, 0, 0, 1, 1] },
        { id: 't_te', name: N('Terrasse am See', 'Göl terası', 'Lake terrace'), r: 'service', s: '11:00', e: '20:00', b: 45, dem: [3, 1, 1, 1, 1, 2, 3], months: [4, 5, 6, 7, 8, 9] },
        { id: 't_bf', name: N('Bar Früh', 'Bar sabah', 'Bar early'), r: 'bar', s: '09:00', e: '17:30', b: 30, dem: [1, 1, 1, 1, 1, 1, 1] },
        { id: 't_bs', name: N('Bar Spät', 'Bar akşam', 'Bar late'), r: 'bar', s: '15:30', e: '23:30', b: 30, dem: [1, 1, 1, 1, 1, 2, 2] },
        { id: 't_df', name: N('Spüle Früh', 'Bulaşık sabah', 'Dish early'), r: 'spueler', s: '09:00', e: '17:30', b: 30, dem: [2, 1, 1, 1, 1, 1, 1] },
        { id: 't_ds', name: N('Spüle Spät', 'Bulaşık akşam', 'Dish late'), r: 'spueler', s: '16:00', e: '00:00', b: 30, dem: [2, 1, 1, 1, 1, 2, 2] },
        { id: 't_lm', name: N('Fahrer Mittag', 'Kurye öğle', 'Driver lunch'), r: 'fahrer', s: '11:00', e: '15:00', b: 0, dem: [1, 1, 1, 1, 1, 1, 1] },
        { id: 't_la', name: N('Fahrer Abend', 'Kurye akşam', 'Driver evening'), r: 'fahrer', s: '17:00', e: '22:30', b: 0, dem: [2, 1, 1, 1, 1, 2, 2] },
        { id: 't_rg', name: N('Reinigung', 'Temizlik', 'Cleaning'), r: 'reinigung', s: '06:30', e: '09:30', b: 0, dem: [1, 1, 1, 1, 1, 1, 1], scale: false }
      ],
      guests: [850, 350, 360, 370, 450, 700, 800],
      spend: 28,
      evSpend: 40,
      target: 32,
      rules: { rest: 11, rest10: true, maxDay: 10, maxWeek: 48, maxRun: 6, sun15: true, minFreeSun: 15, holAsSun: true, youthUntil: '22:00' },
      sur: { on: true, nightFrom: '22:00', night: 25, sun: 50, hol: 125, x150: 150 },
      fac: { VZ: 1.21, TZ: 1.21, MJ: 1.31, AZ: 1.21, WS: 1.10, AH: 1.21 },
      law: { minWage: null, minijob: null },
      evr: { svc: 12, kit: 35, dish: 80, bar: 70, leadFrom: 40, catKit: 50, catDrv: 80, catSvc: 25 },
      specials: [],
      specOff: [],
      notify: {
        weekDay: 0, weekTime: '18:00', daily: false, dailyTime: '10:00', channel: 'wa',
        footer: { de: 'Fragen oder Tauschwunsch? Bitte bei der Schichtleitung melden.', tr: 'Soru veya değişiklik isteğin varsa vardiya sorumlusuna yaz.', en: 'Questions or swap requests? Please contact your shift lead.' }
      },
      demo: false
    };
  }

  /* Beispiel-Team: Name, Rollen (erste = Hauptrolle), Vertrag, Std., Lohn, Sprache, Extras */
  const TEAM = [
    ['Emre Kaya', 'leitung service bar', 'VZ', 40, 21.5, 'tr'],
    ['Selin Arslan', 'leitung service empfang', 'VZ', 40, 20, 'tr', { pref: 'early' }],
    ['Jonas Becker', 'leitung service', 'TZ', 30, 19, 'de', { av: { 0: null } }],
    ['Derya Şahin', 'leitung service bar empfang', 'VZ', 40, 20.5, 'tr', { pref: 'late' }],
    ['Hasan Çelik', 'kuechenchef koch grill', 'VZ', 40, 25, 'tr'],
    ['Mustafa Öztürk', 'kuechenchef koch grill', 'VZ', 40, 23, 'tr'],
    ['Ali Yılmaz', 'koch grill', 'VZ', 40, 18, 'tr', { pref: 'late' }],
    ['Fatma Doğan', 'koch fruehst vorb', 'VZ', 40, 17, 'tr', { pref: 'early' }],
    ['Kemal Aydın', 'koch grill', 'VZ', 40, 17.5, 'tr'],
    ['Marco Rossi', 'koch', 'TZ', 30, 17, 'de', { maxD: 4 }],
    ['Ahmad Haidari', 'koch vorb', 'VZ', 40, 16, 'fa'],
    ['Zeynep Kılıç', 'koch fruehst', 'TZ', 25, 16, 'tr', { pref: 'early', maxD: 4 }],
    ['Burak Koç', 'koch grill', 'VZ', 40, 17, 'tr', { pref: 'late' }],
    ['Sara Hoffmann', 'koch vorb', 'TZ', 20, 16, 'de', { av: { 0: null, 6: null } }],
    ['Yusuf Kurt', 'koch grill vorb', 'VZ', 40, 16.5, 'tr'],
    ['Murat Polat', 'grill koch', 'VZ', 40, 17.5, 'tr', { pref: 'late' }],
    ['Rojhat Bulut', 'grill vorb', 'VZ', 40, 16, 'ku'],
    ['Ömer Aktaş', 'grill', 'TZ', 30, 16, 'tr'],
    ['Serkan Yavuz', 'grill vorb', 'MJ', 0, 14.5, 'tr', { av: { 1: null, 2: null, 3: null } }],
    ['Leyla Ahmadi', 'vorb fruehst', 'TZ', 30, 14.5, 'fa', { pref: 'early' }],
    ['Gül Erdem', 'vorb fruehst', 'TZ', 25, 14.5, 'tr', { pref: 'early' }],
    ['Anna Nowak', 'vorb', 'MJ', 0, 14, 'de', { av: { 0: null, 6: null } }],
    ['Hüseyin Tekin', 'vorb spueler', 'MJ', 0, 14, 'tr'],
    ['Nermin Hadžić', 'vorb fruehst', 'TZ', 20, 14.5, 'sr'],
    ['Elif Güneş', 'vorb fruehst', 'AZ', 40, 6.5, 'tr', { birth: '2009-03-14', school: [2] }],
    ['Hatice Uçar', 'fruehst vorb', 'TZ', 25, 14.5, 'tr', { pref: 'early' }],
    ['Maria Schmitz', 'fruehst service', 'MJ', 0, 14, 'de', { av: { 0: null, 6: null, 1: { f: '06:00', t: '14:30' }, 2: { f: '06:00', t: '14:30' }, 3: { f: '06:00', t: '14:30' }, 4: { f: '06:00', t: '14:30' }, 5: { f: '06:00', t: '14:30' } } }],
    ['Mohammed Al-Hassan', 'spueler vorb', 'VZ', 40, 14, 'ar'],
    ['Bekir Avcı', 'spueler', 'TZ', 30, 14, 'tr'],
    ['Dawit Tesfaye', 'spueler', 'MJ', 0, 14, 'en'],
    ['Arben Krasniqi', 'spueler vorb', 'TZ', 25, 14, 'sq'],
    ['Karim Nasser', 'spueler', 'MJ', 0, 14, 'ar'],
    ['Jan Kowalski', 'spueler reinigung', 'MJ', 0, 14, 'de'],
    ['Ayşe Yıldız', 'service bar', 'VZ', 40, 15.5, 'tr'],
    ['Merve Öz', 'service empfang', 'VZ', 40, 15, 'tr', { pref: 'late' }],
    ['Lukas Schneider', 'service', 'TZ', 30, 15, 'de'],
    ['Esra Aksoy', 'service', 'TZ', 25, 15, 'tr', { maxD: 4 }],
    ['Can Ateş', 'service bar', 'VZ', 40, 15.5, 'tr'],
    ['Sophie Wagner', 'service', 'MJ', 0, 14.5, 'de', { av: { 1: null, 2: null, 3: null, 4: null } }],
    ['Tuğba Kara', 'service empfang', 'TZ', 30, 15, 'tr'],
    ['Ibrahim Saleh', 'service', 'VZ', 40, 14.5, 'ar'],
    ['Dilan Kaplan', 'service', 'TZ', 25, 15, 'ku'],
    ['Laura Klein', 'service', 'WS', 20, 15, 'de', { av: { 1: { f: '16:00', t: '24:00' }, 3: { f: '16:00', t: '24:00' } } }],
    ['Berk Yücel', 'service bar', 'TZ', 30, 15, 'tr', { pref: 'late' }],
    ['Hira Malik', 'service', 'MJ', 0, 14.5, 'en'],
    ['Arta Berisha', 'service', 'VZ', 40, 15, 'sq'],
    ['Milan Petrović', 'service bar', 'TZ', 30, 15, 'sr'],
    ['Nisa Demirci', 'service', 'WS', 20, 15, 'tr', { av: { 2: { f: '16:00', t: '24:00' }, 4: { f: '16:00', t: '24:00' } } }],
    ['Tim Fischer', 'service', 'WS', 18, 15, 'de', { av: { 1: null, 2: { f: '17:00', t: '24:00' } } }],
    ['Seda Korkmaz', 'service empfang', 'TZ', 25, 15, 'tr'],
    ['Ramin Rahimi', 'service', 'TZ', 25, 14.5, 'ps'],
    ['Elena Popescu', 'service', 'MJ', 0, 14.5, 'en', { av: { 1: null, 2: null } }],
    ['Kaan Erdoğan', 'service', 'AZ', 40, 7, 'tr', { birth: '2007-08-02', school: [3] }],
    ['Melis Turan', 'service', 'AZ', 40, 6.5, 'tr', { birth: '2009-06-20', school: [1] }],
    ['Volkan Işık', 'service bar', 'VZ', 40, 15.5, 'tr'],
    ['Yasemin Er', 'empfang service', 'TZ', 25, 15, 'tr', { pref: 'late' }],
    ['Nadine Krüger', 'empfang service', 'MJ', 0, 14.5, 'de', { av: { 1: null, 2: null, 3: null } }],
    ['Tolga Bayram', 'bar service', 'VZ', 40, 15.5, 'tr'],
    ['Cem Uysal', 'bar', 'TZ', 30, 15, 'tr', { pref: 'late' }],
    ['Rania Haddad', 'bar service', 'TZ', 25, 15, 'ar'],
    ['Niklas Weber', 'bar', 'MJ', 0, 14.5, 'de'],
    ['Gizem Duman', 'bar service', 'WS', 20, 15, 'tr', { av: { 1: { f: '15:00', t: '24:00' }, 2: { f: '15:00', t: '24:00' }, 3: { f: '15:00', t: '24:00' } } }],
    ['Ercan Sarı', 'bar', 'TZ', 25, 15, 'tr', { pref: 'early' }],
    ['Hakan Güler', 'fahrer', 'TZ', 30, 14.5, 'tr'],
    ['Sinan Bozkurt', 'fahrer', 'MJ', 0, 14, 'tr'],
    ['Bilal Noori', 'fahrer', 'MJ', 0, 14, 'ps'],
    ['Patrick Lange', 'fahrer', 'MJ', 0, 14, 'de', { av: { 0: null } }],
    ['Okan Şen', 'fahrer spueler', 'TZ', 20, 14.5, 'tr'],
    ['Svetlana Ivanova', 'reinigung', 'MJ', 0, 14, 'de'],
    ['Meryem Acar', 'reinigung spueler', 'MJ', 0, 14, 'tr'],
    ['Erika Braun', 'reinigung', 'MJ', 0, 14, 'de'],
    ['Baran Kılınç', 'service bar', 'AH', 0, 14.5, 'ku', { aw: true }],
    ['Ece Bilgin', 'service', 'AH', 0, 14.5, 'tr', { aw: true }],
    ['Daniel Meyer', 'service', 'AH', 0, 14.5, 'de', { aw: true }],
    ['Sevgi Çınar', 'service', 'AH', 0, 14.5, 'tr', { aw: true }],
    ['Furkan Ekinci', 'service spueler', 'AH', 0, 14.5, 'tr', { aw: true }],
    ['Lina Haddad', 'service', 'AH', 0, 14.5, 'ar', { aw: true }],
    ['Deniz Kocaman', 'service bar', 'AH', 0, 14.5, 'tr', { aw: true }],
    ['Jasmin Hodžić', 'service', 'AH', 0, 14.5, 'sr', { aw: true }]
  ];

  function demoStaff() {
    return TEAM.map((row, i) => {
      const [name, roles, ct, wh, wage, lang, x] = row;
      const ex = x || {};
      const r = roles.split(' ');
      const av = [undefined, undefined, undefined, undefined, undefined, undefined, undefined];
      if (ex.aw) { // Event-Aushilfen: Fr–So ab 15 Uhr
        for (let d = 0; d < 7; d++) av[d] = (d === 0 || d === 5 || d === 6) ? { f: '15:00', t: '26:00' } : null;
      }
      if (ex.av) for (const k in ex.av) av[+k] = ex.av[k];
      const e = {
        id: 'e' + String(i + 1).padStart(2, '0'), name, active: true, roles: r, primary: r[0], ct, wh, wage,
        lang, ch: 'wa', phone: '', email: '', pref: ex.pref || '', maxD: ex.maxD || null, split: false,
        birth: ex.birth || '', school: ex.school || [], locs: ['nir'], note: '', demo: true
      };
      if (av.some(v => v !== undefined)) e.av = av.map(v => v === undefined ? { f: '00:00', t: '24:00' } : v);
      return e;
    });
  }

  function demoData(today) {
    const mon = C.wkMonday(today);
    const d = n => C.addDays(mon, n);
    const cfg = defaultConfig('NIRVANA Mechernich');
    cfg.demo = true;
    const staff = demoStaff();
    const id = name => (staff.find(e => e.name === name) || {}).id;
    const absences = [
      { id: 'a1', emp: id('Can Ateş'), k: 'urlaub', f: d(0), t: d(6), n: '' },
      { id: 'a2', emp: id('Fatma Doğan'), k: 'krank', f: d(0), t: d(2), n: '' },
      { id: 'a3', emp: id('Zeynep Kılıç'), k: 'wunsch', f: d(5), t: d(5), n: '' },
      { id: 'a4', emp: id('Lukas Schneider'), k: 'urlaub', f: d(7), t: d(13), n: '' },
      { id: 'a5', emp: id('Hakan Güler'), k: 'urlaub', f: d(9), t: d(16), n: '' },
      { id: 'a6', emp: id('Esra Aksoy'), k: 'wunsch', f: d(12), t: d(12), n: '' }
    ];
    const events = [
      { id: 'ev1', d: d(5), name: 'Hochzeit Familie Demir', k: 'feier', s: '18:00', e: '01:00', g: 160, loc: 'nir', n: 'Saal am See' },
      { id: 'ev2', d: d(11), name: 'Weihnachtsfeier Firma', k: 'feier', s: '19:00', e: '23:30', g: 80, loc: 'nir', n: '' },
      { id: 'ev3', d: d(13), name: 'Catering Verlobung', k: 'catering', s: '14:00', e: '17:00', g: 120, svc: false, loc: 'nir', n: '' }
    ];
    return { cfg, staff, absences, events };
  }

  const api = { defaultConfig, demoStaff, demoData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Demo = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function(){
'use strict';
/* Oberflächentexte: [Deutsch, Türkçe, English] */
const I18N = {
  app_name: ['Schichtplan', 'Vardiya Planı', 'Shift planner'],
  nav: ['Hauptmenü', 'Ana menü', 'Main menu'],
  language: ['Sprache', 'Dil', 'Language'],
  tab_plan: ['Wochenplan', 'Haftalık plan', 'Schedule'],
  tab_team: ['Personal', 'Personel', 'Staff'],
  tab_abs: ['Abwesenheiten', 'İzinler', 'Absences'],
  tab_demand: ['Bedarf', 'İhtiyaç', 'Demand'],
  tab_send: ['Versand', 'Gönderim', 'Send'],
  tab_report: ['Auswertung', 'Rapor', 'Report'],
  tab_settings: ['Einstellungen', 'Ayarlar', 'Settings'],
  st_saved: ['Gespeichert', 'Kaydedildi', 'Saved'],
  st_loading: ['Lädt …', 'Yükleniyor …', 'Loading …'],
  st_saving: ['Speichert …', 'Kaydediliyor …', 'Saving …'],
  st_readonly: ['Nur Ansicht', 'Sadece görüntüleme', 'View only'],
  st_local: ['Nur auf diesem Gerät', 'Sadece bu cihazda', 'This device only'],
  slow: ['Die Daten sind gerade nicht erreichbar. Die Seite versucht es weiter – bitte Internetverbindung prüfen.', 'Veriler şu anda alınamıyor. Sayfa denemeye devam ediyor – lütfen internet bağlantını kontrol et.', 'The data can’t be reached right now. The page keeps trying – please check your connection.'],
  ro_view: ['Du kannst diesen Plan nur ansehen. Für Änderungen braucht dein Zugang mindestens Mitwirkenden-Rechte.', 'Bu planı sadece görüntüleyebilirsin. Değişiklik için en az katkıda bulunan yetkisi gerekir.', 'You can only view this plan. Editing needs at least contributor access.'],
  ro_revoked: ['Der Zugriff wurde geändert. Änderungen sind gerade nicht möglich.', 'Erişim değişti. Şu anda değişiklik yapılamıyor.', 'Access has changed. Editing isn’t possible right now.'],
  local_banner: ['Lokaler Modus: Die Daten liegen nur in diesem Browser. Lege regelmäßig eine Sicherung an (Einstellungen → Daten).', 'Yerel mod: Veriler sadece bu tarayıcıda. Düzenli olarak yedek al (Ayarlar → Veriler).', 'Local mode: the data stays in this browser only. Make regular backups (Settings → Data).'],
  demo_banner: ['Beispieldaten: ein Beispiel-Team mit 79 Personen zum Ausprobieren. Es wird nichts verschickt.', 'Örnek veriler: denemek için 79 kişilik örnek ekip. Hiçbir şey gönderilmez.', 'Sample data: an example team of 79 people to try things out. Nothing is sent.'],
  demo_end: ['Eigene Daten starten', 'Kendi verilerimle başla', 'Start with my own data'],
  demo_end_p: ['Alle Beispiel-Mitarbeiter, Abwesenheiten, Feiern und Pläne werden gelöscht. Schichtvorlagen, Öffnungszeiten und Regeln bleiben erhalten und können angepasst werden.', 'Tüm örnek personel, izinler, etkinlikler ve planlar silinir. Vardiya şablonları, açılış saatleri ve kurallar kalır ve değiştirilebilir.', 'All sample staff, absences, events and schedules are deleted. Shift templates, opening hours and rules stay and can be adjusted.'],
  demo_end_go: ['Beispieldaten löschen', 'Örnek verileri sil', 'Delete sample data'],
  no_access_h: ['Kein Zugriff', 'Erişim yok', 'No access'],
  no_access_p: ['Dieser Schichtplan ist für dich nicht freigegeben. Bitte den Inhaber, dich als Mitwirkende/n einzuladen.', 'Bu vardiya planı seninle paylaşılmamış. İşletme sahibinden seni katkıda bulunan olarak davet etmesini iste.', 'This schedule isn’t shared with you. Ask the owner to invite you as a contributor.'],
  onb_h: ['Willkommen beim Schichtplan', 'Vardiya Planına hoş geldin', 'Welcome to the shift planner'],
  onb_p: ['Plane Schichten für 50 bis 100 Mitarbeiter in wenigen Minuten – mit Regel-Check nach deutschem Arbeitsrecht und Versand per WhatsApp.', '50–100 personelin vardiyalarını birkaç dakikada planla – Alman iş hukukuna göre kural kontrolü ve WhatsApp ile gönderim dahil.', 'Plan shifts for 50 to 100 staff in minutes – with German labour-law checks and sending via WhatsApp.'],
  biz_name: ['Name des Betriebs', 'İşletme adı', 'Business name'],
  onb_demo: ['Mit Beispiel-Team ausprobieren', 'Örnek ekiple dene', 'Try with a sample team'],
  onb_empty: ['Leer starten', 'Boş başla', 'Start empty'],
  onb_f1: ['Automatische Planung nach Bedarf, Verträgen und Wünschen', 'İhtiyaca, sözleşmelere ve isteklere göre otomatik planlama', 'Automatic planning by demand, contracts and wishes'],
  onb_f2: ['Regel-Check: Ruhezeiten, Pausen, Minijob-Grenze, Jugendschutz, 15 freie Sonntage', 'Kural kontrolü: dinlenme süreleri, molalar, minijob sınırı, genç işçi koruması, 15 boş Pazar', 'Rule check: rest periods, breaks, minijob limit, youth protection, 15 free Sundays'],
  onb_f3: ['Krankmeldung? Ersatz mit einem Klick finden', 'Biri hasta mı? Tek tıkla yerine birini bul', 'Someone is sick? Find cover in one click'],
  onb_f4: ['Plan an jeden Mitarbeiter in seiner Sprache senden', 'Planı her personele kendi dilinde gönder', 'Send each employee the plan in their language'],

  kw: ['KW {w}', '{w}. hafta', 'Week {w}'],
  prev_week: ['Vorige Woche', 'Önceki hafta', 'Previous week'],
  next_week: ['Nächste Woche', 'Sonraki hafta', 'Next week'],
  this_week: ['Diese Woche', 'Bu hafta', 'This week'],
  published_at: ['Veröffentlicht am {d}', '{d} tarihinde yayınlandı', 'Published {d}'],
  not_planned: ['Noch nicht geplant', 'Henüz planlanmadı', 'Not planned yet'],
  draft: ['Entwurf', 'Taslak', 'Draft'],
  undo: ['Rückgängig', 'Geri al', 'Undo'],
  copy_prev: ['Vorwoche übernehmen', 'Geçen haftayı kopyala', 'Copy last week'],
  publish: ['Veröffentlichen', 'Yayınla', 'Publish'],
  unpublish: ['Veröffentlichung zurücknehmen', 'Yayından kaldır', 'Unpublish'],
  unpub_q: ['Der Plan gilt dann wieder als Entwurf. Bereits verschickte Nachrichten bleiben beim Team.', 'Plan tekrar taslak olur. Gönderilmiş mesajlar ekipte kalır.', 'The plan becomes a draft again. Messages already sent stay with the team.'],
  pub_toast: ['Plan veröffentlicht. Unter „Versand“ schickst du ihn ans Team.', 'Plan yayınlandı. „Gönderim“ bölümünden ekibe gönderebilirsin.', 'Plan published. Send it to the team under “Send”.'],
  autoplan: ['Automatisch planen', 'Otomatik planla', 'Plan automatically'],
  wait_load: ['Diese Woche wird noch geladen …', 'Bu hafta hâlâ yükleniyor …', 'This week is still loading …'],
  demand_changed: ['Der Bedarf hat sich geändert: {p} Schichten kommen dazu, {m} fallen weg.', 'İhtiyaç değişti: {p} vardiya eklenecek, {m} vardiya kalkacak.', 'Demand has changed: {p} shifts to add, {m} to remove.'],
  apply: ['Übernehmen', 'Uygula', 'Apply'],
  demand_applied: ['Bedarf übernommen: +{p} / −{m} Schichten', 'İhtiyaç uygulandı: +{p} / −{m} vardiya', 'Demand applied: +{p} / −{m} shifts'],
  k_cov: ['Besetzung', 'Doluluk', 'Coverage'],
  k_cov_sub: ['{f} von {n} Schichten', '{n} vardiyadan {f} tanesi dolu', '{f} of {n} shifts'],
  k_open: ['Offen', 'Boş', 'Open'],
  k_open_sub: ['offene Schichten', 'boş vardiya', 'open shifts'],
  k_hours: ['Stunden', 'Saat', 'Hours'],
  k_hours_sub: ['{n} Mitarbeiter im Einsatz', '{n} personel çalışıyor', '{n} staff working'],
  k_cost: ['Personalkosten', 'Personel maliyeti', 'Labour cost'],
  k_cost_sub: ['{q} % vom Umsatz (Ziel {t} %)', 'Ciroya oranı %{q} (hedef %{t})', '{q} % of revenue (target {t} %)'],
  k_cost_nosub: ['ohne Umsatzprognose', 'ciro tahmini yok', 'no revenue forecast'],
  k_rules: ['Regel-Check', 'Kural kontrolü', 'Rule check'],
  k_err: ['{n} Fehler', '{n} hata', '{n} errors'],
  k_ok: ['Alles in Ordnung', 'Her şey yolunda', 'All good'],
  k_noerr: ['Keine Verstöße', 'İhlal yok', 'No violations'],
  k_nowarn: ['keine Warnungen', 'uyarı yok', 'no warnings'],
  k_warn: ['{n} Warnungen', '{n} uyarı', '{n} warnings'],
  v_staff: ['Personal', 'Personel', 'Staff'],
  v_shifts: ['Schichten', 'Vardiyalar', 'Shifts'],
  v_day: ['Tag', 'Gün', 'Day'],
  all: ['Alle', 'Hepsi', 'All'],
  search_name: ['Name suchen', 'İsim ara', 'Search name'],
  export: ['Export', 'Dışa aktar', 'Export'],
  closed: ['geschlossen', 'kapalı', 'closed'],
  day_edit: ['Tag bearbeiten: Gäste, Feiern, Notiz', 'Günü düzenle: misafir, etkinlik, not', 'Edit day: guests, events, note'],
  guests_n: ['{n} Gäste', '{n} misafir', '{n} guests'],
  staff_n: ['{n} Mitarbeiter', '{n} personel', '{n} staff'],
  open_shifts: ['Offene Schichten', 'Boş vardiyalar', 'Open shifts'],
  other: ['Sonstige', 'Diğer', 'Other'],
  no_match: ['Keine Treffer.', 'Sonuç yok.', 'No matches.'],
  no_staff: ['Noch keine Mitarbeiter angelegt.', 'Henüz personel eklenmedi.', 'No staff added yet.'],
  add_staff: ['Mitarbeiter anlegen', 'Personel ekle', 'Add staff'],
  extra: ['extra', 'ekstra', 'extra'],
  shift_rows: ['{n} Schichtarten', '{n} vardiya türü', '{n} shift types'],
  open: ['offen', 'boş', 'open'],
  no_shifts: ['Keine Schichten.', 'Vardiya yok.', 'No shifts.'],
  rev_fc: ['Umsatzprognose', 'Ciro tahmini', 'Revenue forecast'],
  quote: ['Personalkostenquote', 'Personel maliyet oranı', 'Labour cost ratio'],
  chart_staff: ['Personal im Einsatz je Stunde', 'Saat başına çalışan personel', 'Staff on duty per hour'],
  event: ['Feier', 'Etkinlik', 'Event'],

  import_xl: ['Aus Excel einfügen', 'Excel’den yapıştır', 'Paste from Excel'],
  contract: ['Vertrag', 'Sözleşme', 'Contract'],
  all_contracts: ['Alle Verträge', 'Tüm sözleşmeler', 'All contracts'],
  name: ['Name', 'İsim', 'Name'],
  roles: ['Aufgaben', 'Görevler', 'Roles'],
  target_wk: ['Soll/Woche (h)', 'Haftalık saat', 'Hours/week'],
  wage: ['Lohn €/h', 'Saat ücreti €', 'Wage €/h'],
  minijob_month: ['Minijob Monat', 'Minijob ay', 'Minijob month'],
  sundays: ['Sonntage (Jahr)', 'Pazar (yıl)', 'Sundays (year)'],
  msg_lang: ['Nachrichtensprache', 'Mesaj dili', 'Message language'],
  contact: ['Kontakt', 'İletişim', 'Contact'],
  inactive: ['inaktiv', 'pasif', 'inactive'],
  youth: ['unter 18', '18 yaş altı', 'under 18'],
  no_contact: ['kein Kontakt', 'iletişim yok', 'no contact'],
  ct_VZ: ['Vollzeit', 'Tam zamanlı', 'Full-time'], ct_VZ_s: ['VZ', 'Tam', 'FT'],
  ct_TZ: ['Teilzeit', 'Yarı zamanlı', 'Part-time'], ct_TZ_s: ['TZ', 'Yarı', 'PT'],
  ct_MJ: ['Minijob', 'Minijob', 'Minijob'], ct_MJ_s: ['MJ', 'MJ', 'MJ'],
  ct_AZ: ['Azubi', 'Çırak (Azubi)', 'Apprentice'], ct_AZ_s: ['Azubi', 'Çırak', 'Appr.'],
  ct_WS: ['Werkstudent', 'Öğrenci (Werkstudent)', 'Working student'], ct_WS_s: ['WS', 'Öğr.', 'Stud.'],
  ct_AH: ['Aushilfe / Event', 'Yardımcı / etkinlik', 'Temp / events'], ct_AH_s: ['Aush.', 'Yrd.', 'Temp'],

  employee: ['Mitarbeiter', 'Personel', 'Employee'],
  choose: ['Bitte wählen', 'Seçiniz', 'Please choose'],
  kind: ['Art', 'Tür', 'Type'],
  from: ['von', 'başlangıç', 'from'],
  to: ['bis', 'bitiş', 'to'],
  note: ['Notiz', 'Not', 'Note'],
  enter: ['Eintragen', 'Kaydet', 'Add'],
  abs_hint: ['Bei „Krank“ oder „Urlaub“ schlägt die App sofort Ersatz für die betroffenen Schichten vor. „Wunschfrei“ wird möglichst berücksichtigt.', '„Hasta“ veya „İzin“ girildiğinde uygulama etkilenen vardiyalar için hemen yedek önerir. „İstek izni“ mümkün olduğunca dikkate alınır.', 'For “Sick” or “Holiday” the app immediately suggests cover for the affected shifts. A “day-off wish” is respected where possible.'],
  abs_current: ['Aktuell und demnächst', 'Şimdiki ve yaklaşan', 'Current and upcoming'],
  abs_past: ['Vergangene (letzte 60 Tage): {n}', 'Geçmiş (son 60 gün): {n}', 'Past (last 60 days): {n}'],
  aff_h: ['{name}: {n} Schichten brauchen Ersatz', '{name}: {n} vardiyaya yedek gerekiyor', '{name}: {n} shifts need cover'],
  find_repl: ['Ersatz suchen', 'Yedek bul', 'Find cover'],
  repl_auto: ['Automatisch ersetzen', 'Otomatik değiştir', 'Replace automatically'],
  later: ['Später', 'Sonra', 'Later'],
  none: ['Keine.', 'Yok.', 'None.'],
  days: ['Tage', 'Gün', 'Days'],
  delete: ['Löschen', 'Sil', 'Delete'],
  abs_urlaub: ['Urlaub', 'İzin', 'Holiday'],
  abs_krank: ['Krank', 'Hasta', 'Sick'],
  abs_wunsch: ['Wunschfrei', 'İstek izni', 'Day-off wish'],
  abs_frei: ['Frei (Ausgleich)', 'Serbest (denkleştirme)', 'Day off (comp.)'],
  abs_schule: ['Berufsschule', 'Meslek okulu', 'Vocational school'],
  abs_sonst: ['Sonstiges', 'Diğer', 'Other'],
  abs_saved: ['Abwesenheit eingetragen.', 'Devamsızlık kaydedildi.', 'Absence saved.'],
  abs_saved_repl: ['Eingetragen – für die betroffenen Schichten wird Ersatz gebraucht.', 'Kaydedildi – etkilenen vardiyalar için yedek gerekiyor.', 'Saved – the affected shifts need cover.'],
  repl_done: ['Ersatz gefunden: {ok}, ohne Ersatz: {fail}', 'Yedek bulundu: {ok}, yedeksiz: {fail}', 'Covered: {ok}, uncovered: {fail}'],
  fill_req: ['Bitte alle Pflichtfelder ausfüllen.', 'Lütfen zorunlu alanları doldur.', 'Please fill in all required fields.'],

  demand_intro: ['Hier legst du fest, wie viele Leute pro Schicht und Wochentag gebraucht werden. Die App passt das an Gäste, Feiertage, Feiern und besondere Tage (z. B. Ramazan, Muttertag) an.', 'Burada her vardiya ve gün için kaç kişi gerektiğini belirlersin. Uygulama bunu misafir sayısına, resmi tatillere, etkinliklere ve özel günlere (örn. Ramazan, Anneler Günü) göre ayarlar.', 'Set how many people each shift needs per weekday. The app adjusts this to guests, public holidays, events and special days (e.g. Ramadan, Mother’s Day).'],
  save: ['Speichern', 'Kaydet', 'Save'],
  guests_rev: ['Typische Gäste und Umsatz', 'Tipik misafir sayısı ve ciro', 'Typical guests and revenue'],
  spend: ['Ø Umsatz pro Gast (€ netto)', 'Misafir başı ort. ciro (€ net)', 'Avg. revenue per guest (€ net)'],
  ev_spend: ['Umsatz pro Feier-Gast (€)', 'Etkinlik misafiri başı ciro (€)', 'Revenue per event guest (€)'],
  target_q: ['Ziel-Personalkostenquote (%)', 'Hedef personel maliyet oranı (%)', 'Target labour cost ratio (%)'],
  guests_hint: ['Die typischen Gäste pro Tag sind die Basis. Trägst du für einen Tag mehr Gäste ein, plant die App automatisch mehr Personal (bei Schichten mit „Skalieren“).', 'Günlük tipik misafir sayısı temel alınır. Bir gün için daha fazla misafir girersen uygulama otomatik olarak daha fazla personel planlar („Ölçekle“ işaretli vardiyalarda).', 'Typical daily guests are the baseline. Enter more guests for a day and the app plans more staff automatically (for shifts with “Scale”).'],
  templates: ['Schichtvorlagen und Bedarf je Wochentag', 'Vardiya şablonları ve günlük ihtiyaç', 'Shift templates and daily demand'],
  tpl_add: ['Vorlage hinzufügen', 'Şablon ekle', 'Add template'],
  tpl_hint: ['Zahlen = benötigte Personen. Saison z. B. „4–9“ für April bis September (Terrasse). Pause in Minuten.', 'Rakamlar = gereken kişi sayısı. Sezon örn. „4–9“ = Nisan–Eylül (teras). Mola dakika olarak.', 'Numbers = people needed. Season e.g. “4–9” for April to September (terrace). Break in minutes.'],
  role: ['Aufgabe', 'Görev', 'Role'],
  start: ['Beginn', 'Başlangıç', 'Start'],
  end: ['Ende', 'Bitiş', 'End'],
  break_m: ['Pause (Min.)', 'Mola (dk)', 'Break (min)'],
  scale: ['Skalieren', 'Ölçekle', 'Scale'],
  season: ['Saison', 'Sezon', 'Season'],
  active: ['Aktiv', 'Aktif', 'Active'],
  all_year: ['ganzjährig', 'tüm yıl', 'all year'],
  tpl_total: ['Grundbedarf: etwa {h} Stunden pro Woche (ohne Feiern und Gäste-Anpassung).', 'Temel ihtiyaç: haftada yaklaşık {h} saat (etkinlikler ve misafir ayarı hariç).', 'Base demand: about {h} hours per week (without events and guest adjustment).'],
  events: ['Feiern und Catering', 'Etkinlikler ve catering', 'Events and catering'],
  event_add: ['Feier hinzufügen', 'Etkinlik ekle', 'Add event'],
  events_hint: ['Für Hochzeiten, Verlobungen, Firmenfeiern und Catering berechnet die App das Zusatzpersonal aus der Gästezahl.', 'Düğün, nişan, şirket kutlaması ve catering için uygulama ek personeli misafir sayısından hesaplar.', 'For weddings, engagements, company parties and catering the app calculates the extra staff from the guest count.'],
  date: ['Datum', 'Tarih', 'Date'],
  time: ['Uhrzeit', 'Saat', 'Time'],
  guests: ['Gäste', 'Misafir', 'Guests'],
  staff_need: ['Zusatzpersonal', 'Ek personel', 'Extra staff'],
  ev_feier: ['Feier im Haus', 'İçeride etkinlik', 'Party on site'],
  ev_catering: ['Catering', 'Catering', 'Catering'],
  ev_sonst: ['Sonstiges', 'Diğer', 'Other'],
  specials: ['Besondere Tage', 'Özel günler', 'Special days'],
  special_add: ['Eigenen Tag hinzufügen', 'Özel gün ekle', 'Add own day'],
  specials_hint: ['Faktor Tag/Abend: 1,3 = 30 % mehr Personal. Ramazan: abends mehr (İftar), tagsüber weniger.', 'Gündüz/akşam katsayısı: 1,3 = %30 daha fazla personel. Ramazan: akşam daha fazla (iftar), gündüz daha az.', 'Day/evening factor: 1.3 = 30 % more staff. Ramadan: more in the evening (iftar), less during the day.'],
  f_day: ['Faktor Tag', 'Gündüz kat.', 'Day factor'],
  f_eve: ['Faktor Abend', 'Akşam kat.', 'Evening factor'],
  special_hint: ['Gilt für alle Schichten mit „Skalieren“. Tag = Beginn vor 15 Uhr, Abend = ab 15 Uhr.', '„Ölçekle“ işaretli tüm vardiyalar için geçerli. Gündüz = 15:00’ten önce başlayan, akşam = 15:00’ten sonra başlayan.', 'Applies to all shifts with “Scale”. Day = start before 3 pm, evening = from 3 pm.'],
  sp_ramazan: ['Ramazan (İftar-Abende)', 'Ramazan (iftar akşamları)', 'Ramadan (iftar evenings)'],
  sp_rbayram: ['Ramadanfest (Ramazan Bayramı)', 'Ramazan Bayramı', 'Eid al-Fitr'],
  sp_kbayram: ['Opferfest (Kurban Bayramı)', 'Kurban Bayramı', 'Eid al-Adha'],
  sp_valentin: ['Valentinstag', 'Sevgililer Günü', 'Valentine’s Day'],
  sp_muttertag: ['Muttertag', 'Anneler Günü', 'Mother’s Day'],
  sp_heiligabend: ['Heiligabend', 'Noel arifesi', 'Christmas Eve'],
  sp_silvester: ['Silvester', 'Yılbaşı gecesi', 'New Year’s Eve'],
  saved_demand: ['Bedarf gespeichert. Bereits geplante Wochen zeigen einen Hinweis zum Übernehmen.', 'İhtiyaç kaydedildi. Planlanmış haftalarda uygulama uyarısı görünür.', 'Demand saved. Weeks already planned show a note to apply it.'],
  deleted: ['Gelöscht.', 'Silindi.', 'Deleted.'],

  h_neujahr: ['Neujahr', 'Yılbaşı', 'New Year’s Day'],
  h_dreikoenig: ['Heilige Drei Könige', 'Üç Kral Yortusu', 'Epiphany'],
  h_frauentag: ['Frauentag', 'Kadınlar Günü', 'Women’s Day'],
  h_karfreitag: ['Karfreitag', 'Kutsal Cuma', 'Good Friday'],
  h_ostersonntag: ['Ostersonntag', 'Paskalya Pazarı', 'Easter Sunday'],
  h_ostermontag: ['Ostermontag', 'Paskalya Pazartesi', 'Easter Monday'],
  h_mai: ['Tag der Arbeit', '1 Mayıs', 'Labour Day'],
  h_himmelfahrt: ['Christi Himmelfahrt', 'İsa’nın Göğe Yükselişi', 'Ascension Day'],
  h_pfingstsonntag: ['Pfingstsonntag', 'Pentekost Pazarı', 'Whit Sunday'],
  h_pfingstmontag: ['Pfingstmontag', 'Pentekost Pazartesi', 'Whit Monday'],
  h_fronleichnam: ['Fronleichnam', 'Fronleichnam Bayramı', 'Corpus Christi'],
  h_mariae: ['Mariä Himmelfahrt', 'Meryem’in Göğe Kabulü', 'Assumption Day'],
  h_kindertag: ['Weltkindertag', 'Dünya Çocuk Günü', 'World Children’s Day'],
  h_einheit: ['Tag der Deutschen Einheit', 'Alman Birliği Günü', 'German Unity Day'],
  h_reformation: ['Reformationstag', 'Reform Günü', 'Reformation Day'],
  h_allerheiligen: ['Allerheiligen', 'Azizler Günü', 'All Saints’ Day'],
  h_busstag: ['Buß- und Bettag', 'Tövbe ve Dua Günü', 'Day of Repentance'],
  h_weihnacht1: ['1. Weihnachtstag', 'Noel (1. gün)', 'Christmas Day'],
  h_weihnacht2: ['2. Weihnachtstag', 'Noel (2. gün)', 'Boxing Day'],
  holiday: ['Feiertag', 'Resmi tatil', 'Public holiday'],
  st_BW: ['Baden-Württemberg', 'Baden-Württemberg', 'Baden-Württemberg'], st_BY: ['Bayern', 'Bavyera', 'Bavaria'], st_BE: ['Berlin', 'Berlin', 'Berlin'], st_BB: ['Brandenburg', 'Brandenburg', 'Brandenburg'],
  st_HB: ['Bremen', 'Bremen', 'Bremen'], st_HH: ['Hamburg', 'Hamburg', 'Hamburg'], st_HE: ['Hessen', 'Hessen', 'Hesse'], st_MV: ['Mecklenburg-Vorpommern', 'Mecklenburg-Vorpommern', 'Mecklenburg-Western Pomerania'],
  st_NI: ['Niedersachsen', 'Aşağı Saksonya', 'Lower Saxony'], st_NW: ['Nordrhein-Westfalen', 'Kuzey Ren-Vestfalya', 'North Rhine-Westphalia'], st_RP: ['Rheinland-Pfalz', 'Rheinland-Pfalz', 'Rhineland-Palatinate'], st_SL: ['Saarland', 'Saarland', 'Saarland'],
  st_SN: ['Sachsen', 'Saksonya', 'Saxony'], st_ST: ['Sachsen-Anhalt', 'Saksonya-Anhalt', 'Saxony-Anhalt'], st_SH: ['Schleswig-Holstein', 'Schleswig-Holstein', 'Schleswig-Holstein'], st_TH: ['Thüringen', 'Türingiya', 'Thuringia'],

  sm_week: ['Wochenplan', 'Haftalık plan', 'Weekly plan'],
  sm_day: ['Erinnerung für einen Tag', 'Günlük hatırlatma', 'Daily reminder'],
  sm_changes: ['Nur Änderungen', 'Sadece değişiklikler', 'Changes only'],
  send_unpub: ['Dieser Plan ist noch nicht veröffentlicht. Du kannst trotzdem senden, besser ist es aber, zuerst zu veröffentlichen.', 'Bu plan henüz yayınlanmadı. Yine de gönderebilirsin ama önce yayınlaman daha iyi.', 'This plan isn’t published yet. You can still send it, but it’s better to publish first.'],
  recipients: ['Empfänger', 'Alıcı', 'Recipients'],
  recipients_sub: ['mit Schichten', 'vardiyası olan', 'with shifts'],
  sent_k: ['Verschickt', 'Gönderildi', 'Sent'],
  of_n: ['von {n}', '{n} kişiden', 'of {n}'],
  changed_k: ['Geändert', 'Değişti', 'Changed'],
  changed_sub: ['seit dem Versand', 'gönderimden sonra', 'since sending'],
  no_contact_k: ['Ohne Kontakt', 'İletişimsiz', 'No contact'],
  no_contact_sub: ['Nummer oder E-Mail fehlt', 'numara veya e-posta eksik', 'number or email missing'],
  queue_btn: ['Nacheinander per WhatsApp senden ({n})', 'WhatsApp ile sırayla gönder ({n})', 'Send one by one via WhatsApp ({n})'],
  mail_all: ['Alle E-Mails senden ({n})', 'Tüm e-postaları gönder ({n})', 'Send all emails ({n})'],
  team_text: ['Text für Team-Gruppe kopieren', 'Ekip grubu için metni kopyala', 'Copy text for team group'],
  channel: ['Kanal', 'Kanal', 'Channel'],
  status: ['Status', 'Durum', 'Status'],
  actions: ['Aktionen', 'İşlemler', 'Actions'],
  changed_after: ['Geändert – neu senden', 'Değişti – tekrar gönder', 'Changed – resend'],
  sent_at: ['Gesendet {d}', '{d} gönderildi', 'Sent {d}'],
  not_sent: ['Nicht gesendet', 'Gönderilmedi', 'Not sent'],
  email: ['E-Mail', 'E-posta', 'Email'],
  phone: ['Handynummer', 'Cep telefonu', 'Mobile number'],
  send: ['Senden', 'Gönder', 'Send'],
  preview: ['Vorschau', 'Önizleme', 'Preview'],
  copy: ['Kopieren', 'Kopyala', 'Copy'],
  mark_sent: ['Als gesendet markieren', 'Gönderildi olarak işaretle', 'Mark as sent'],
  mark_unsent: ['Markierung entfernen', 'İşareti kaldır', 'Remove mark'],
  no_changes: ['Keine Änderungen seit dem Versand.', 'Gönderimden sonra değişiklik yok.', 'No changes since sending.'],
  no_recipients: ['Keine Empfänger in dieser Woche.', 'Bu hafta alıcı yok.', 'No recipients this week.'],
  ch_wa: ['WhatsApp', 'WhatsApp', 'WhatsApp'],
  ch_sms: ['SMS', 'SMS', 'SMS'],
  ch_mail: ['E-Mail', 'E-posta', 'Email'],
  ch_none: ['nicht senden', 'gönderme', 'don’t send'],
  auto_h: ['Automatischer Versand', 'Otomatik gönderim', 'Automatic sending'],
  auto_p: ['Wann soll das Team den Plan bekommen? Diese Einstellungen nutzt der automatische Versand.', 'Ekip planı ne zaman almalı? Otomatik gönderim bu ayarları kullanır.', 'When should the team get the plan? Automatic sending uses these settings.'],
  auto_week: ['Wochenplan senden am', 'Haftalık planı gönderme günü', 'Send weekly plan on'],
  auto_daily: ['Täglich Erinnerung für den nächsten Tag', 'Her gün ertesi gün için hatırlatma', 'Daily reminder for the next day'],
  footer_h: ['Zusatztext unter jeder Nachricht (je Sprache)', 'Her mesajın altına ek metin (dile göre)', 'Extra text under each message (per language)'],
  auto_o1: ['Sofort und kostenlos: WhatsApp per Klick. Die App öffnet für jeden Mitarbeiter den fertigen Text, du tippst nur auf „Senden“.', 'Hemen ve ücretsiz: tek tıkla WhatsApp. Uygulama her personel için hazır metni açar, sen sadece „Gönder“e basarsın.', 'Right away and free: WhatsApp per click. The app opens the ready text for each employee, you just tap “Send”.'],
  auto_o2: ['Vollautomatisch per E-Mail über dein verbundenes Gmail. Claude kann den Versand als geplanten Auftrag einrichten, z. B. jeden Sonntag um 18 Uhr.', 'Gmail üzerinden tam otomatik e-posta. Claude bunu zamanlanmış görev olarak kurabilir, örneğin her Pazar 18:00’de.', 'Fully automatic by email via your connected Gmail. Claude can set it up as a scheduled task, e.g. every Sunday at 6 pm.'],
  auto_o3: ['Vollautomatisch per WhatsApp oder SMS über die offizielle WhatsApp-Business-Schnittstelle oder einen SMS-Anbieter (wenige Cent pro Nachricht). Sag Claude Bescheid, dann wird es angebunden.', 'Resmi WhatsApp Business arayüzü veya bir SMS sağlayıcısı üzerinden WhatsApp ya da SMS ile tam otomatik (mesaj başı birkaç sent). Claude’a söyle, bağlansın.', 'Fully automatic via WhatsApp or SMS through the official WhatsApp Business interface or an SMS provider (a few cents per message). Tell Claude and it gets connected.'],
  queue_h: ['Nacheinander senden', 'Sırayla gönder', 'Send one by one'],
  queue_done: ['Alle sind auf dem neuesten Stand.', 'Herkes güncel.', 'Everyone is up to date.'],
  queue_prog: ['{i} von {n}', '{n} kişiden {i}.', '{i} of {n}'],
  queue_hint: ['WhatsApp öffnet sich mit dem fertigen Text. Dort auf „Senden“ tippen und hierher zurückkehren – es geht automatisch weiter.', 'WhatsApp hazır metinle açılır. Orada „Gönder“e bas ve buraya dön – otomatik devam eder.', 'WhatsApp opens with the ready text. Tap “Send” there and come back – it continues automatically.'],
  skip: ['Überspringen', 'Atla', 'Skip'],
  open_wa: ['In WhatsApp öffnen', 'WhatsApp’ta aç', 'Open in WhatsApp'],
  open_sms: ['SMS öffnen', 'SMS aç', 'Open SMS'],
  mail_q: ['{n} Mitarbeiter bekommen ihren Plan jetzt per E-Mail von deinem Gmail-Konto.', '{n} personel planını şimdi Gmail hesabından e-postayla alacak.', '{n} employees will now get their plan by email from your Gmail account.'],
  mail_subj_week: ['Dein Schichtplan KW {w}', 'Vardiya planın – {w}. hafta', 'Your schedule, week {w}'],
  mail_subj_day: ['Erinnerung: deine Schicht morgen', 'Hatırlatma: yarınki vardiyan', 'Reminder: your shift tomorrow'],
  mail_ok: ['{n} E-Mails verschickt.', '{n} e-posta gönderildi.', '{n} emails sent.'],
  mail_fail: ['Die E-Mail an {n} hat nicht geklappt. Der Versand wurde angehalten.', '{n} kişisine e-posta gönderilemedi. Gönderim durduruldu.', 'The email to {n} failed. Sending was stopped.'],
  gmail_missing: ['Gmail ist nicht verbunden. Bitte in claude.ai unter Einstellungen → Konnektoren Gmail verbinden.', 'Gmail bağlı değil. Lütfen claude.ai’de Ayarlar → Bağlayıcılar bölümünden Gmail’i bağla.', 'Gmail isn’t connected. Please connect Gmail in claude.ai under Settings → Connectors.'],
  gmail_approval: ['Der E-Mail-Versand braucht deine Freigabe. Bitte erneut auf „Senden“ klicken und zustimmen.', 'E-posta gönderimi için onayın gerekiyor. Lütfen tekrar „Gönder“e tıkla ve onayla.', 'Sending email needs your approval. Please click “Send” again and allow it.'],

  csv_btn: ['CSV für Lohnbüro', 'Bordro için CSV', 'CSV for payroll'],
  incl_sur: ['davon Zuschläge {s}', 'zamlar dahil {s}', 'incl. premiums {s}'],
  rev_sub: ['Gäste × Ø Umsatz + Feiern', 'Misafir × ort. ciro + etkinlikler', 'Guests × avg. revenue + events'],
  target_is: ['Ziel: {t} %', 'Hedef: %{t}', 'Target: {t} %'],
  overtime: ['Überstunden', 'Fazla mesai', 'Overtime'],
  overtime_sub: ['über Vertragsstunden', 'sözleşme saatinin üstünde', 'above contract hours'],
  target: ['Soll', 'Hedef', 'Target'],
  planned: ['Geplant', 'Planlanan', 'Planned'],
  diff: ['Differenz', 'Fark', 'Difference'],
  night_h: ['Nacht h', 'Gece sa.', 'Night h'],
  sun_h: ['Sonntag h', 'Pazar sa.', 'Sunday h'],
  hol_h: ['Feiertag h', 'Tatil sa.', 'Holiday h'],
  cost: ['Kosten', 'Maliyet', 'Cost'],
  we4: ['WE-Dienste (4 Wo.)', 'Hafta sonu (4 hf.)', 'Weekend shifts (4 wk)'],
  report_hint: ['Kosten = Stundenlohn × Arbeitgeber-Faktor + Zuschläge (Schätzung). Für die Lohnabrechnung zählt die tatsächliche Arbeitszeit.', 'Maliyet = saat ücreti × işveren katsayısı + zamlar (tahmini). Bordro için gerçek çalışma süresi esas alınır.', 'Cost = hourly wage × employer factor + premiums (estimate). Payroll uses the actual hours worked.'],
  chart_cost: ['Personalkosten je Tag und Bereich', 'Gün ve bölüme göre personel maliyeti', 'Labour cost per day and area'],
  quote_per_day: ['Personalkostenquote je Tag:', 'Günlük personel maliyet oranı:', 'Labour cost ratio per day:'],

  business: ['Betrieb', 'İşletme', 'Business'],
  state: ['Bundesland (Feiertage)', 'Eyalet (resmi tatiller)', 'State (public holidays)'],
  default_lang: ['Standardsprache der App', 'Uygulamanın varsayılan dili', 'Default app language'],
  rules_h: ['Arbeitszeit-Regeln', 'Çalışma süresi kuralları', 'Working-time rules'],
  rules_hint: ['Voreingestellt nach Arbeitszeitgesetz (ArbZG) und Jugendarbeitsschutzgesetz. Strengere Regeln aus Tarif- oder Arbeitsvertrag hier eintragen.', 'Çalışma Süresi Kanunu (ArbZG) ve Genç İşçileri Koruma Kanunu’na göre ayarlıdır. Toplu veya bireysel iş sözleşmesindeki daha sıkı kuralları buraya gir.', 'Preset according to the German Working Hours Act (ArbZG) and the Youth Employment Protection Act. Enter stricter rules from your collective or employment contract here.'],
  r_rest_l: ['Mindest-Ruhezeit zwischen zwei Arbeitstagen', 'İki iş günü arası asgari dinlenme', 'Minimum rest between two working days'],
  r_rest_d: ['Gesetzlich 11 Stunden ohne Unterbrechung (§ 5 ArbZG).', 'Kanunen kesintisiz 11 saat (§ 5 ArbZG).', 'By law 11 hours without interruption (§ 5 ArbZG).'],
  r_rest10_l: ['Gastro-Ausnahme: 10 Stunden erlauben', 'Gastronomi istisnası: 10 saate izin ver', 'Hospitality exception: allow 10 hours'],
  r_rest10_d: ['In Gaststätten darf die Ruhezeit auf 10 Stunden sinken, wenn sie innerhalb von 4 Wochen durch eine Ruhezeit von mindestens 12 Stunden ausgeglichen wird.', 'Lokantalarda dinlenme süresi 10 saate inebilir; ancak 4 hafta içinde en az 12 saatlik bir dinlenmeyle telafi edilmelidir.', 'In restaurants rest may drop to 10 hours if it is compensated within 4 weeks by a rest of at least 12 hours.'],
  r_maxday_l: ['Maximale Arbeitszeit pro Tag', 'Günlük azami çalışma süresi', 'Maximum working time per day'],
  r_maxday_d: ['Höchstens 10 Stunden; im Durchschnitt von 6 Monaten 8 Stunden pro Werktag.', 'En fazla 10 saat; 6 aylık ortalamada iş günü başına 8 saat.', 'At most 10 hours; on average 8 hours per working day over 6 months.'],
  r_maxweek_l: ['Maximale Wochenstunden', 'Haftalık azami saat', 'Maximum weekly hours'],
  r_maxweek_d: ['48 Stunden im Durchschnitt (6 Werktage × 8 Stunden).', 'Ortalama 48 saat (6 iş günü × 8 saat).', '48 hours on average (6 working days × 8 hours).'],
  r_run_l: ['Maximal Arbeitstage am Stück', 'Art arda azami iş günü', 'Maximum consecutive working days'],
  r_run_d: ['Schützt vor Überlastung; ein Ruhetag pro Woche ist üblich.', 'Aşırı yüklenmeyi önler; haftada bir dinlenme günü olağandır.', 'Prevents overload; one rest day per week is usual.'],
  r_sun_l: ['Freie Sonntage pro Jahr', 'Yılda boş Pazar sayısı', 'Free Sundays per year'],
  r_sun_d: ['In der Gastronomie müssen mindestens 15 Sonntage im Jahr beschäftigungsfrei bleiben (§ 11 ArbZG).', 'Gastronomide yılda en az 15 Pazar çalışılmamalıdır (§ 11 ArbZG).', 'In hospitality at least 15 Sundays a year must stay work-free (§ 11 ArbZG).'],
  r_holsun_l: ['Feiertage wie Sonntag besetzen', 'Resmi tatillerde Pazar gibi planla', 'Staff public holidays like Sundays'],
  r_holsun_d: ['An gesetzlichen Feiertagen gilt der Sonntags-Bedarf.', 'Resmi tatillerde Pazar günü ihtiyacı geçerlidir.', 'On public holidays the Sunday demand applies.'],
  r_youth_l: ['Jugendliche (16–17) arbeiten höchstens bis', 'Gençler (16–17) en geç şu saate kadar çalışır', 'Young workers (16–17) work until at most'],
  r_youth_d: ['Gaststätten: bis 22 Uhr, unter 16 Jahren bis 20 Uhr. Vor einem Berufsschultag nur bis 20 Uhr. Höchstens 8 Std. am Tag, 40 Std. in der Woche, 5 Tage.', 'Lokantalarda 22:00’ye kadar, 16 yaş altı 20:00’ye kadar. Okul gününden önce sadece 20:00’ye kadar. Günde en fazla 8, haftada 40 saat, 5 gün.', 'Restaurants: until 10 pm, under 16 until 8 pm. Before a school day only until 8 pm. At most 8 h a day, 40 h a week, 5 days.'],
  law_h: ['Mindestlohn und Minijob ({y})', 'Asgari ücret ve minijob ({y})', 'Minimum wage and minijob ({y})'],
  minwage: ['Mindestlohn (€/h)', 'Asgari ücret (€/sa)', 'Minimum wage (€/h)'],
  minijob_cap: ['Minijob-Grenze (€/Monat)', 'Minijob sınırı (€/ay)', 'Minijob limit (€/month)'],
  law_hint: ['Leer lassen = automatisch: 2026 {w1} € und {m1} €, ab 1.1.2027 {w2} € und {m2} €.', 'Boş bırak = otomatik: 2026’da {w1} € ve {m1} €, 1.1.2027’den itibaren {w2} € ve {m2} €.', 'Leave empty = automatic: 2026 {w1} € and {m1} €, from 1 Jan 2027 {w2} € and {m2} €.'],
  sur_h: ['Zuschläge', 'Zamlar', 'Premiums'],
  sur_on: ['Zuschläge in den Kosten berücksichtigen', 'Zamları maliyete dahil et', 'Include premiums in costs'],
  night_from: ['Nacht ab', 'Gece başlangıcı', 'Night from'],
  sur_night: ['Nacht', 'Gece', 'Night'],
  sur_sun: ['Sonntag', 'Pazar', 'Sunday'],
  sur_hol: ['Feiertag', 'Resmi tatil', 'Public holiday'],
  sur_x150: ['25./26.12., 1.5., 24.12. ab 14 Uhr', '25./26.12., 1.5., 24.12. saat 14’ten sonra', '25/26 Dec, 1 May, 24 Dec from 2 pm'],
  sur_3b: ['Steuerfreie Höchstsätze übernehmen (§ 3b EStG)', 'Vergiden muaf azami oranları al (§ 3b EStG)', 'Use tax-free maximum rates (§ 3b EStG)'],
  sur_3b_set: ['Werte eingetragen – bitte speichern.', 'Değerler girildi – lütfen kaydet.', 'Values filled in – please save.'],
  sur_hint: ['Bis zu diesen Sätzen sind Zuschläge steuerfrei: Nacht (20–6 Uhr) 25 %, Sonntag 50 %, Feiertag 125 %, 25./26.12. und 1.5. 150 %. Was du zahlst, regelt dein Arbeits- oder Tarifvertrag.', 'Bu oranlara kadar zamlar vergiden muaftır: gece (20–6) %25, Pazar %50, resmi tatil %125, 25./26.12. ve 1.5. %150. Ne ödeyeceğini iş veya toplu sözleşmen belirler.', 'Up to these rates premiums are tax-free: night (8 pm–6 am) 25 %, Sunday 50 %, public holiday 125 %, 25/26 Dec and 1 May 150 %. What you pay is set by your employment or collective agreement.'],
  fac_h: ['Arbeitgeber-Kosten (Faktor auf den Lohn)', 'İşveren maliyeti (ücrete katsayı)', 'Employer cost (factor on wage)'],
  fac_hint: ['Schätzung inkl. Sozialabgaben: Vollzeit/Teilzeit ca. 1,21; Minijob ca. 1,31 (Pauschalabgaben); Werkstudent ca. 1,10.', 'Sosyal sigorta dahil tahmin: tam/yarı zamanlı yakl. 1,21; minijob yakl. 1,31 (götürü primler); öğrenci yakl. 1,10.', 'Estimate incl. social contributions: full/part-time approx. 1.21; minijob approx. 1.31 (flat-rate charges); working student approx. 1.10.'],
  evr_h: ['Personalschlüssel für Feiern', 'Etkinlik personel oranları', 'Staffing ratios for events'],
  evr_svc: ['Gäste je Servicekraft', 'Garson başına misafir', 'Guests per server'],
  evr_kit: ['Gäste je Koch', 'Aşçı başına misafir', 'Guests per cook'],
  evr_dish: ['Gäste je Spüler', 'Bulaşıkçı başına misafir', 'Guests per dishwasher'],
  evr_bar: ['Gäste je Bar-Kraft', 'Bar personeli başına misafir', 'Guests per bar staff'],
  evr_lead: ['Schichtleitung ab … Gästen', 'Şu misafir sayısından itibaren sorumlu', 'Shift lead from … guests'],
  evr_catkit: ['Catering: Gäste je Koch', 'Catering: aşçı başına misafir', 'Catering: guests per cook'],
  evr_catdrv: ['Catering: Gäste je Fahrer', 'Catering: kurye başına misafir', 'Catering: guests per driver'],
  evr_catsvc: ['Catering: Gäste je Service', 'Catering: garson başına misafir', 'Catering: guests per server'],
  evr_hint: ['Faustregel bei Feiern mit Service am Tisch: etwa eine Servicekraft für 10 bis 12 Gäste.', 'Masaya servisli etkinliklerde pratik kural: 10–12 misafir başına yaklaşık bir garson.', 'Rule of thumb for events with table service: about one server per 10 to 12 guests.'],
  data_h: ['Daten und Sicherung', 'Veriler ve yedekleme', 'Data and backup'],
  data_db: ['Die Daten werden in diesem Claude-Artifact gespeichert und sind für alle sichtbar, mit denen du es als Mitwirkende/r teilst. Löhne und Krankmeldungen sind sensibel – teile nur mit Leitungspersonen.', 'Veriler bu Claude Artifact’ında saklanır ve katkıda bulunan olarak paylaştığın herkes görebilir. Ücretler ve hastalık bilgileri hassastır – sadece yöneticilerle paylaş.', 'The data is stored in this Claude artifact and is visible to everyone you share it with as a contributor. Wages and sick notes are sensitive – share only with managers.'],
  data_local: ['Alle Daten bleiben auf diesem Gerät, nichts geht an einen Server. Lade einmal pro Woche eine Sicherung herunter. Für ein zweites Gerät: die Sicherung dort mit „Sicherung einspielen“ laden.', 'Tüm veriler bu cihazda kalır, sunucuya hiçbir şey gitmez. Haftada bir yedek indir. İkinci bir cihaz için: yedeği orada „Yedeği geri yükle“ ile aç.', 'All data stays on this device; nothing goes to a server. Download a backup once a week. For a second device: open the backup there with “Restore backup”.'],
  onb_local: ['Alle Daten bleiben auf diesem Gerät – nichts wird an einen Server gesendet.', 'Tüm veriler bu cihazda kalır – hiçbir şey sunucuya gönderilmez.', 'All data stays on this device – nothing is sent to a server.'],
  backup_never: ['Noch keine Sicherung: Die Daten liegen nur auf diesem Gerät. Lade einmal pro Woche eine Sicherung herunter.', 'Henüz yedek yok: Veriler sadece bu cihazda. Haftada bir yedek indir.', 'No backup yet: the data only lives on this device. Download a backup once a week.'],
  backup_old: ['Letzte Sicherung vor {n} Tagen – die Daten liegen nur auf diesem Gerät.', 'Son yedek {n} gün önce – veriler sadece bu cihazda.', 'Last backup {n} days ago – the data only lives on this device.'],
  backup_now: ['Jetzt sichern', 'Şimdi yedekle', 'Back up now'],
  st_team: ['Team-Datenbank', 'Ekip veritabanı', 'Team database'],
  st_offline: ['Offline', 'Çevrimdışı', 'Offline'],
  st_off_pending: ['Offline – wartet', 'Çevrimdışı – bekliyor', 'Offline – waiting'],
  offline_banner: ['Keine Verbindung: Du siehst den letzten Stand. Änderungen werden gespeichert, sobald wieder Internet da ist.', 'Bağlantı yok: Son durumu görüyorsun. Değişiklikler internet gelince kaydedilir.', 'No connection: you are seeing the last saved state. Changes will be saved once you are back online.'],
  login_h: ['Anmelden', 'Giriş yap', 'Sign in'],
  login_p: ['Melde dich an, um den gemeinsamen Schichtplan zu öffnen.', 'Ortak vardiya planını açmak için giriş yap.', 'Sign in to open the shared shift plan.'],
  login_go: ['Anmelden', 'Giriş yap', 'Sign in'],
  login_bad: ['Name oder Passwort stimmt nicht.', 'İsim veya şifre yanlış.', 'Name or password is wrong.'],
  login_locked: ['Zu viele Versuche. Bitte in 15 Minuten noch einmal.', 'Çok fazla deneme. Lütfen 15 dakika sonra tekrar dene.', 'Too many attempts. Please try again in 15 minutes.'],
  login_off: ['Keine Verbindung zur Team-Datenbank. Prüfe das Internet und versuche es noch einmal.', 'Ekip veritabanına bağlanılamıyor. İnterneti kontrol edip tekrar dene.', 'Can’t reach the team database. Check the internet connection and try again.'],
  retry: ['Erneut versuchen', 'Tekrar dene', 'Try again'],
  try_local: ['Ohne Anmeldung ausprobieren (Beispiel, nur auf diesem Gerät)', 'Giriş yapmadan dene (örnek, sadece bu cihazda)', 'Try without signing in (example, this device only)'],
  try_banner: ['Testmodus: Alles bleibt auf diesem Gerät und kommt nicht in die Team-Datenbank.', 'Deneme modu: Her şey bu cihazda kalır, ekip veritabanına gitmez.', 'Test mode: everything stays on this device and does not go into the team database.'],
  to_login: ['Zur Anmeldung', 'Girişe git', 'Go to sign-in'],
  setup_h: ['Team-Datenbank einrichten', 'Ekip veritabanını kur', 'Set up the team database'],
  setup_p: ['Einmalig: Gib den Einrichtungscode ein und lege deinen Zugang als Chef an. Danach legst du in den Einstellungen Zugänge für dein Team an.', 'Bir kerelik: Kurulum kodunu gir ve yönetici erişimini oluştur. Sonra Ayarlar’da ekibin için erişimler oluşturursun.', 'One time: enter the setup code and create your admin access. Afterwards you create access for your team in Settings.'],
  setup_code: ['Einrichtungscode', 'Kurulum kodu', 'Setup code'],
  setup_go: ['Einrichten', 'Kur', 'Set up'],
  setup_bad: ['Der Einrichtungscode stimmt nicht oder ist abgelaufen.', 'Kurulum kodu yanlış veya süresi dolmuş.', 'The setup code is wrong or has expired.'],
  setup_already: ['Die Team-Datenbank ist schon eingerichtet. Bitte anmelden.', 'Ekip veritabanı zaten kurulu. Lütfen giriş yap.', 'The team database is already set up. Please sign in.'],
  your_name: ['Dein Name', 'Adın', 'Your name'],
  f_pass: ['Passwort', 'Şifre', 'Password'],
  f_pass2: ['Passwort wiederholen', 'Şifreyi tekrarla', 'Repeat password'],
  pass_rule: ['Mindestens 8 Zeichen. Am besten den Vorschlag nehmen oder einen kurzen Satz.', 'En az 8 karakter. En iyisi öneriyi al ya da kısa bir cümle kullan.', 'At least 8 characters. Best take the suggestion or a short sentence.'],
  pass_short: ['Das Passwort braucht mindestens 8 Zeichen.', 'Şifre en az 8 karakter olmalı.', 'The password needs at least 8 characters.'],
  pass_mismatch: ['Die beiden Passwörter sind nicht gleich.', 'İki şifre aynı değil.', 'The two passwords don’t match.'],
  name_bad: ['Bitte einen Namen mit 2 bis 40 Zeichen eingeben.', 'Lütfen 2–40 karakterlik bir isim gir.', 'Please enter a name with 2 to 40 characters.'],
  name_taken: ['Diesen Namen gibt es schon.', 'Bu isim zaten var.', 'This name already exists.'],
  session_end: ['Bitte neu anmelden.', 'Lütfen yeniden giriş yap.', 'Please sign in again.'],
  acc_h: ['Zugang und Team', 'Erişim ve ekip', 'Access and team'],
  acc_me: ['Angemeldet als {n} ({r})', '{n} olarak giriş yapıldı ({r})', 'Signed in as {n} ({r})'],
  logout: ['Abmelden', 'Çıkış yap', 'Sign out'],
  pw_change: ['Passwort ändern', 'Şifreyi değiştir', 'Change password'],
  pw_old: ['Bisheriges Passwort', 'Mevcut şifre', 'Current password'],
  pw_old_bad: ['Das bisherige Passwort stimmt nicht.', 'Mevcut şifre yanlış.', 'The current password is wrong.'],
  pw_new: ['Neues Passwort', 'Yeni şifre', 'New password'],
  pw_changed: ['Passwort geändert. Andere Geräte mit diesem Zugang sind abgemeldet.', 'Şifre değiştirildi. Bu erişimle açık olan diğer cihazlar çıkış yaptı.', 'Password changed. Other devices using this access have been signed out.'],
  pw_suggest: ['Vorschlag', 'Öneri', 'Suggest'],
  role_admin: ['Chef', 'Yönetici', 'Admin'],
  role_edit: ['Planen', 'Planlama', 'Planner'],
  role_view: ['Nur ansehen', 'Sadece görüntüleme', 'View only'],
  role_admin_d: ['alles, auch Zugänge verwalten', 'her şey, erişimleri de yönetir', 'everything, including access'],
  role_edit_d: ['Pläne, Personal und Einstellungen bearbeiten', 'plan, personel ve ayarları düzenler', 'edit plans, staff and settings'],
  role_view_d: ['Pläne nur ansehen', 'planları sadece görür', 'only view plans'],
  acc_role: ['Rolle', 'Rol', 'Role'],
  acc_last: ['Zuletzt angemeldet', 'Son giriş', 'Last sign-in'],
  acc_never: ['noch nie', 'henüz yok', 'never'],
  acc_blocked: ['gesperrt', 'engelli', 'blocked'],
  acc_block: ['Sperren', 'Engelle', 'Block'],
  acc_unblock: ['Freigeben', 'Engeli kaldır', 'Unblock'],
  acc_reset: ['Neues Passwort', 'Yeni şifre', 'New password'],
  acc_new: ['Neuer Zugang', 'Yeni erişim', 'New access'],
  acc_create: ['Zugang anlegen', 'Erişim oluştur', 'Create access'],
  acc_created: ['Der Zugang für {n} ist angelegt.', '{n} için erişim oluşturuldu.', 'Access for {n} has been created.'],
  acc_pw_set: ['Das neue Passwort für {n} gilt ab sofort. Alte Anmeldungen sind beendet.', '{n} için yeni şifre hemen geçerli. Eski girişler kapatıldı.', 'The new password for {n} applies right away. Old sign-ins have ended.'],
  acc_share: ['Gib Name und Passwort persönlich oder per Privatnachricht weiter, nicht in eine Gruppe. Das Passwort wird hier nicht noch einmal angezeigt.', 'İsim ve şifreyi bizzat ya da özel mesajla ilet, gruba yazma. Şifre burada bir daha gösterilmez.', 'Pass on the name and password in person or by private message, not in a group. The password won’t be shown again.'],
  acc_hint: ['Jede Person bekommt einen eigenen Zugang. Wer gesperrt wird oder ein neues Passwort bekommt, ist sofort auf allen Geräten abgemeldet.', 'Her kişi kendi erişimini alır. Engellenen ya da yeni şifre verilen kişi tüm cihazlarda hemen çıkış yapar.', 'Everyone gets their own access. Anyone who is blocked or gets a new password is signed out on all devices right away.'],
  last_admin: ['Mindestens ein aktiver Chef-Zugang muss bleiben.', 'En az bir aktif yönetici erişimi kalmalı.', 'At least one active admin access must remain.'],
  ro_role: ['Dein Zugang darf den Plan nur ansehen.', 'Erişimin planı sadece görüntüleyebilir.', 'Your access can only view the plan.'],
  conflict: ['{n} hat das gerade auch geändert. Du siehst jetzt den neuesten Stand – bitte deine letzte Änderung prüfen.', '{n} bunu az önce değiştirdi. Şimdi en güncel hali görüyorsun – lütfen son değişikliğini kontrol et.', '{n} just changed this too. You now see the latest version – please check your last change.'],
  remote_change: ['Aktualisiert von {n}', '{n} güncelledi', 'Updated by {n}'],
  err_too_large: ['Zu viele Daten auf einmal – bitte die Woche aufteilen.', 'Bir seferde çok fazla veri – lütfen haftayı böl.', 'Too much data at once – please split the week.'],
  onb_team: ['Alles wird in der Team-Datenbank gespeichert – alle mit Zugang sehen denselben Plan.', 'Her şey ekip veritabanına kaydedilir – erişimi olan herkes aynı planı görür.', 'Everything is saved in the team database – everyone with access sees the same plan.'],
  import_local: ['Daten von diesem Gerät übernehmen ({n} Mitarbeiter)', 'Bu cihazdaki verileri aktar ({n} personel)', 'Take over data from this device ({n} staff)'],
  backup_dl: ['Sicherung herunterladen', 'Yedeği indir', 'Download backup'],
  backup_copy: ['Sicherung kopieren', 'Yedeği kopyala', 'Copy backup'],
  backup_load: ['Sicherung einspielen', 'Yedeği geri yükle', 'Restore backup'],
  wipe_all: ['Alles löschen', 'Her şeyi sil', 'Delete everything'],
  wipe_q: ['Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.', 'Tüm veriler gerçekten silinsin mi? Bu işlem geri alınamaz.', 'Really delete all data? This cannot be undone.'],
  wiping: ['Daten werden gelöscht …', 'Veriler siliniyor …', 'Deleting data …'],
  wiped: ['Daten gelöscht.', 'Veriler silindi.', 'Data deleted.'],
  legal: ['Hinweis: Die App hilft, die Regeln einzuhalten, ersetzt aber keine Rechts- oder Steuerberatung. Werte aus Tarif- und Arbeitsverträgen gehen vor.', 'Not: Uygulama kurallara uymana yardım eder ama hukuki veya vergi danışmanlığının yerini tutmaz. Toplu ve iş sözleşmelerindeki değerler önceliklidir.', 'Note: the app helps you follow the rules but is no substitute for legal or tax advice. Values from collective and employment contracts take precedence.'],
  restore_p: ['Die Sicherung enthält {n} Mitarbeiter und {w} Wochen. Die aktuellen Daten werden überschrieben.', 'Yedekte {n} personel ve {w} hafta var. Mevcut verilerin üzerine yazılacak.', 'The backup contains {n} staff and {w} weeks. The current data will be overwritten.'],
  restore_go: ['Einspielen', 'Geri yükle', 'Restore'],
  restored: ['Sicherung eingespielt.', 'Yedek geri yüklendi.', 'Backup restored.'],
  bad_backup: ['Diese Datei ist keine gültige Sicherung.', 'Bu dosya geçerli bir yedek değil.', 'This file is not a valid backup.'],

  close: ['Schließen', 'Kapat', 'Close'],
  error: ['Fehler', 'Hata', 'Error'],
  shift: ['Schicht', 'Vardiya', 'Shift'],
  gone: ['Diese Schicht gibt es nicht mehr.', 'Bu vardiya artık yok.', 'This shift no longer exists.'],
  lock: ['Fixieren', 'Sabitle', 'Lock'],
  unlock: ['Lösen', 'Sabitlemeyi kaldır', 'Unlock'],
  remove: ['Entfernen', 'Kaldır', 'Remove'],
  open_shift: ['Offene Schicht', 'Boş vardiya', 'Open shift'],
  pick_below: ['Wähle unten jemanden aus.', 'Aşağıdan birini seç.', 'Pick someone below.'],
  swap_with: ['Tauschen mit', 'Şununla değiştir', 'Swap with'],
  suggestions: ['Vorschläge', 'Öneriler', 'Suggestions'],
  best: ['Beste Wahl', 'En iyi seçim', 'Best choice'],
  swap: ['Tauschen', 'Değiştir', 'Swap'],
  assign: ['Einteilen', 'Ata', 'Assign'],
  no_cands: ['Niemand ist frei, ohne eine Regel zu verletzen. Tipp: Aushilfe anfragen oder die Schichtzeit ändern.', 'Hiçbir kuralı çiğnemeden müsait kimse yok. İpucu: yardımcı personel iste veya vardiya saatini değiştir.', 'Nobody is free without breaking a rule. Tip: ask a temp or change the shift time.'],
  not_possible: ['Nicht möglich ({n})', 'Mümkün değil ({n})', 'Not possible ({n})'],
  assign_anyway: ['Trotzdem', 'Yine de', 'Anyway'],
  times: ['Zeiten', 'Saatler', 'Times'],
  break_legal: ['Gesetzliche Mindestpause: {m} Min. Arbeitszeit: {h} Std.', 'Yasal asgari mola: {m} dk. Çalışma süresi: {h} saat.', 'Legal minimum break: {m} min. Working time: {h} h.'],
  shift_delete: ['Schicht löschen', 'Vardiyayı sil', 'Delete shift'],
  shift_del_q: ['Diese Schicht aus der Woche entfernen? Der Bedarf für diesen Tag sinkt um eine Person.', 'Bu vardiya haftadan kaldırılsın mı? O günün ihtiyacı bir kişi azalır.', 'Remove this shift from the week? The demand for that day drops by one person.'],
  assigned: ['{n} eingeteilt.', '{n} atandı.', '{n} assigned.'],
  saved: ['Gespeichert.', 'Kaydedildi.', 'Saved.'],
  bad_time: ['Bitte gültige Uhrzeiten eingeben.', 'Lütfen geçerli saatler gir.', 'Please enter valid times.'],
  shifts_today: ['Schichten an diesem Tag', 'Bu günkü vardiyalar', 'Shifts on this day'],
  open_fit: ['Offene Schichten, die passen', 'Uygun boş vardiyalar', 'Open shifts that fit'],
  take: ['Übernehmen', 'Al', 'Take'],
  new_shift_for: ['Neue Schicht für {name}', '{name} için yeni vardiya', 'New shift for {name}'],
  template: ['Vorlage', 'Şablon', 'Template'],
  custom_time: ['Eigene Zeit …', 'Özel saat …', 'Custom time …'],
  add_shift: ['Schicht hinzufügen', 'Vardiya ekle', 'Add shift'],
  absence_today: ['Abwesend an diesem Tag', 'Bu gün yok', 'Absent on this day'],
  primary_role: ['Hauptaufgabe', 'Ana görev', 'Main role'],
  max_days: ['Max. Tage/Woche', 'Haftada azami gün', 'Max days/week'],
  ct_hint: ['Minijob: Die App achtet automatisch auf die Monatsgrenze. Aushilfe/Event: wird nur eingeplant, wenn sonst niemand da ist.', 'Minijob: uygulama aylık sınırı otomatik takip eder. Yardımcı/etkinlik: sadece başka kimse yoksa planlanır.', 'Minijob: the app watches the monthly limit automatically. Temp/events: only planned when nobody else is available.'],
  birth: ['Geburtsdatum (nur für Jugendschutz)', 'Doğum tarihi (sadece genç koruması için)', 'Date of birth (youth protection only)'],
  school_days: ['Berufsschultage', 'Meslek okulu günleri', 'School days'],
  availability: ['Verfügbarkeit', 'Müsaitlik', 'Availability'],
  avail_hint: ['Haken weg = an diesem Tag nicht verfügbar. Zeiten leer = ganztags.', 'İşaret yok = o gün müsait değil. Saatler boş = tüm gün.', 'Unticked = not available that day. Empty times = all day.'],
  pref: ['Wunsch', 'Tercih', 'Preference'],
  pref_none: ['egal', 'fark etmez', 'no preference'],
  pref_early: ['lieber Frühschicht', 'sabah vardiyası tercih eder', 'prefers early shifts'],
  pref_late: ['lieber Spätschicht', 'akşam vardiyası tercih eder', 'prefers late shifts'],
  split_ok: ['Geteilte Dienste erlaubt', 'Bölünmüş vardiyaya izin', 'Split shifts allowed'],
  consent_hint: ['Telefonnummer nur mit Einverständnis des Mitarbeiters eintragen.', 'Telefon numarasını sadece personelin onayıyla gir.', 'Only enter phone numbers with the employee’s consent.'],
  start_date: ['Eintritt', 'İşe giriş', 'Start date'],
  end_date: ['Austritt', 'İşten çıkış', 'End date'],
  name_req: ['Bitte einen Namen eingeben.', 'Lütfen bir isim gir.', 'Please enter a name.'],
  role_req: ['Bitte mindestens eine Aufgabe wählen.', 'Lütfen en az bir görev seç.', 'Please choose at least one role.'],
  emp_del_q: ['{n} löschen? Zukünftige Schichten werden wieder offen.', '{n} silinsin mi? Gelecekteki vardiyaları tekrar boş kalır.', 'Delete {n}? Future shifts become open again.'],
  exp_guests: ['Erwartete Gäste', 'Beklenen misafir', 'Expected guests'],
  closed_day: ['Geschlossen (Ruhetag)', 'Kapalı (tatil günü)', 'Closed (rest day)'],
  guests_fc: ['Prognose: {n} Gäste (typisch für {w}).', 'Tahmin: {n} misafir ({w} için tipik).', 'Forecast: {n} guests (typical for {w}).'],
  special_applied: ['Berücksichtigt: {s}.', 'Dikkate alındı: {s}.', 'Included: {s}.'],
  hol_applied: ['Feiertag ({h}): Sonntags-Bedarf.', 'Resmi tatil ({h}): Pazar ihtiyacı.', 'Public holiday ({h}): Sunday demand.'],
  edit: ['Bearbeiten', 'Düzenle', 'Edit'],
  all_ok: ['Keine Regelverstöße in dieser Woche.', 'Bu hafta kural ihlali yok.', 'No rule violations this week.'],
  sev_err: ['Fehler', 'Hatalar', 'Errors'],
  sev_warn: ['Warnungen', 'Uyarılar', 'Warnings'],
  sev_info: ['Hinweise', 'Bilgiler', 'Notes'],
  open_it: ['Öffnen', 'Aç', 'Open'],
  ev_ph: ['z. B. Hochzeit Familie …', 'örn. … ailesinin düğünü', 'e.g. wedding of …'],
  ev_with_svc: ['Catering mit Service-Personal vor Ort', 'Yerinde servis personeliyle catering', 'Catering with service staff on site'],
  ev_need: ['Zusatzpersonal: {x}', 'Ek personel: {x}', 'Extra staff: {x}'],
  ev_saved: ['Gespeichert. Zusatzpersonal: {x}', 'Kaydedildi. Ek personel: {x}', 'Saved. Extra staff: {x}'],
  ev_del_q: ['Diese Feier löschen? Die Zusatzschichten werden entfernt, sofern noch nicht besetzt.', 'Bu etkinlik silinsin mi? Ek vardiyalar henüz atanmadıysa kaldırılır.', 'Delete this event? The extra shifts are removed if not yet assigned.'],

  ap_intro: ['Die App verteilt alle Schichten auf passende Mitarbeiter – mit Blick auf Verfügbarkeit, Abwesenheiten, Vertragsstunden, Ruhezeiten und alle Regeln.', 'Uygulama tüm vardiyaları uygun personele dağıtır – müsaitlik, izinler, sözleşme saatleri, dinlenme süreleri ve tüm kurallar dikkate alınır.', 'The app assigns every shift to a suitable employee – respecting availability, absences, contract hours, rest periods and all rules.'],
  ap_strategy: ['Worauf soll geachtet werden?', 'Neye öncelik verilsin?', 'What matters most?'],
  s_balanced: ['Ausgewogen', 'Dengeli', 'Balanced'],
  s_balanced_d: ['Vertragsstunden erfüllen, fair verteilen, Kosten im Blick.', 'Sözleşme saatlerini doldur, adil dağıt, maliyeti gözet.', 'Fill contract hours, share fairly, watch costs.'],
  s_cost: ['Kosten sparen', 'Maliyet tasarrufu', 'Save costs'],
  s_cost_d: ['Günstigste passende Person zuerst, wenig Überstunden und Zuschläge.', 'Önce en uygun maliyetli kişi, az fazla mesai ve zam.', 'Cheapest suitable person first, little overtime and few premiums.'],
  s_fair: ['Fairness zuerst', 'Önce adalet', 'Fairness first'],
  s_fair_d: ['Wochenenden, Sonntage und Spätdienste gleichmäßig verteilen.', 'Hafta sonu, Pazar ve akşam vardiyalarını eşit dağıt.', 'Share weekends, Sundays and late shifts evenly.'],
  s_wish: ['Wünsche zuerst', 'Önce istekler', 'Wishes first'],
  s_wish_d: ['Früh/Spät-Wünsche und Wunschfrei stark berücksichtigen.', 'Sabah/akşam tercihleri ve istek izinlerini öne al.', 'Strongly respect early/late preferences and day-off wishes.'],
  ap_scope: ['Umfang', 'Kapsam', 'Scope'],
  ap_fill: ['Nur offene Schichten besetzen', 'Sadece boş vardiyaları doldur', 'Only fill open shifts'],
  ap_fill_d: ['Bestehende Einteilungen bleiben.', 'Mevcut atamalar kalır.', 'Existing assignments stay.'],
  ap_replan: ['Woche neu planen', 'Haftayı yeniden planla', 'Re-plan the week'],
  ap_replan_d: ['Alles wird neu verteilt – fixierte Schichten bleiben.', 'Her şey yeniden dağıtılır – sabitlenen vardiyalar kalır.', 'Everything is reassigned – locked shifts stay.'],
  ap_rules: ['Harte Regeln werden nie verletzt. Was nicht besetzt werden kann, bleibt offen und wird angezeigt.', 'Kesin kurallar asla çiğnenmez. Doldurulamayan vardiyalar boş kalır ve gösterilir.', 'Hard rules are never broken. Whatever can’t be filled stays open and is shown.'],
  ap_go: ['Jetzt planen', 'Şimdi planla', 'Plan now'],
  cancel: ['Abbrechen', 'Vazgeç', 'Cancel'],
  ok: ['OK', 'Tamam', 'OK'],
  plan_done: ['{f} von {n} Schichten besetzt, {o} offen ({ms} ms).', '{n} vardiyadan {f} tanesi dolu, {o} boş ({ms} ms).', '{f} of {n} shifts filled, {o} open ({ms} ms).'],
  copy_intro: ['Die Einteilung der Vorwoche wird übernommen, wo es passt. Abwesenheiten und Regeln werden geprüft.', 'Geçen haftanın atamaları uygun olduğu yerde kopyalanır. İzinler ve kurallar kontrol edilir.', 'Last week’s assignments are copied where they fit. Absences and rules are checked.'],
  copy_fill: ['Lücken danach automatisch füllen', 'Ardından boşlukları otomatik doldur', 'Fill gaps automatically afterwards'],
  copy_go: ['Übernehmen', 'Kopyala', 'Copy'],
  copy_none: ['Die Vorwoche hat keine Einteilung.', 'Geçen haftada atama yok.', 'Last week has no assignments.'],
  copy_done: ['Vorwoche übernommen.', 'Geçen hafta kopyalandı.', 'Last week copied.'],
  undone: ['Rückgängig gemacht.', 'Geri alındı.', 'Undone.'],
  exp_intro: ['Plan als PDF zum Aushängen, als Bild für die WhatsApp-Gruppe oder als Tabelle fürs Lohnbüro.', 'Planı asmak için PDF, WhatsApp grubu için resim veya bordro için tablo olarak al.', 'Get the plan as a PDF to put up, an image for the WhatsApp group or a table for payroll.'],
  area: ['Bereich', 'Bölüm', 'Area'],
  ex_pdf: ['PDF (A4 quer)', 'PDF (A4 yatay)', 'PDF (A4 landscape)'],
  ex_png: ['Bild (PNG)', 'Resim (PNG)', 'Image (PNG)'],
  no_dl: ['Herunterladen ist in dieser Ansicht nicht möglich. Öffne die App direkt in Claude.', 'Bu görünümde indirme yapılamıyor. Uygulamayı doğrudan Claude’da aç.', 'Downloading isn’t possible in this view. Open the app directly in Claude.'],
  making_file: ['Datei wird erstellt …', 'Dosya hazırlanıyor …', 'Creating file …'],
  saved_file: ['{f} gespeichert.', '{f} kaydedildi.', '{f} saved.'],
  dl_err: ['Speichern hat nicht geklappt', 'Kaydetme başarısız', 'Saving failed'],
  copied: ['In die Zwischenablage kopiert.', 'Panoya kopyalandı.', 'Copied to clipboard.'],
  file_plan: ['Schichtplan', 'Vardiya-plani', 'Schedule'],
  file_payroll: ['Lohnbuero', 'Bordro', 'Payroll'],
  file_backup: ['Sicherung-Schichtplan', 'Yedek-vardiya-plani', 'Backup-schedule'],
  pdf_sub: ['Stand: {d}', 'Tarih: {d}', 'As of: {d}'],
  page_n: ['Seite {i}/{n}', 'Sayfa {i}/{n}', 'Page {i}/{n}'],
  id: ['Nr.', 'No', 'ID'],
  imp_intro: ['Kopiere die Mitarbeiterliste aus Excel oder Google Sheets (mit Überschriften wie Name, Aufgabe, Vertrag, Stunden, Lohn, Telefon, Sprache) und füge sie hier ein.', 'Personel listesini Excel veya Google Sheets’ten kopyala (İsim, Görev, Sözleşme, Saat, Ücret, Telefon, Dil gibi başlıklarla) ve buraya yapıştır.', 'Copy the staff list from Excel or Google Sheets (with headers like Name, Role, Contract, Hours, Wage, Phone, Language) and paste it here.'],
  imp_ph: ['Name; Aufgabe; Vertrag; Stunden; Lohn; Telefon; Sprache', 'İsim; Görev; Sözleşme; Saat; Ücret; Telefon; Dil', 'Name; Role; Contract; Hours; Wage; Phone; Language'],
  imp_check: ['Prüfen', 'Kontrol et', 'Check'],
  imp_after: ['Verfügbarkeit und Wünsche kannst du danach pro Person ergänzen.', 'Müsaitlik ve tercihleri sonra kişi bazında ekleyebilirsin.', 'You can add availability and preferences per person afterwards.'],
  imp_go: ['{n} übernehmen', '{n} kişiyi ekle', 'Import {n}'],
  imp_done: ['{n} Mitarbeiter angelegt.', '{n} personel eklendi.', '{n} staff added.'],

  ai_name: ['Assistent', 'Asistan', 'Assistant'],
  ai_plan: ['Vorschlag:', 'Öneri:', 'Proposal:'],
  ai_run: ['Ausführen', 'Uygula', 'Apply'],
  ai_drop: ['Verwerfen', 'Vazgeç', 'Discard'],
  ai_ex1: ['Ayşe ist von morgen bis Freitag krank – bitte Ersatz finden', 'Ayşe yarından cumaya kadar hasta – yerine birini bul', 'Ayşe is sick from tomorrow until Friday – find cover'],
  ai_ex2: ['Samstag Hochzeit mit 200 Gästen von 18 bis 1 Uhr', 'Cumartesi 18:00–01:00 arası 200 kişilik düğün', 'Wedding on Saturday with 200 guests from 6 pm to 1 am'],
  ai_ex3: ['Wer arbeitet Freitagabend an der Bar?', 'Cuma akşamı barda kim çalışıyor?', 'Who works the bar on Friday evening?'],
  ai_ex4: ['Murat kann ab jetzt montags nicht mehr', 'Murat bundan sonra pazartesileri çalışamaz', 'From now on Murat can’t work Mondays'],
  ai_hello: ['Schreib oder sprich, was passieren soll – auf Türkisch, Deutsch oder in jeder anderen Sprache. Du kannst auch die WhatsApp-Antwort eines Mitarbeiters hier einfügen.', 'Ne yapılmasını istediğini yaz veya söyle – Türkçe, Almanca veya başka bir dilde. Bir personelin WhatsApp cevabını da buraya yapıştırabilirsin.', 'Write or say what should happen – in Turkish, German or any other language. You can also paste an employee’s WhatsApp reply here.'],
  ai_thinking: ['Denke nach …', 'Düşünüyorum …', 'Thinking …'],
  ai_ph: ['z. B. „Ali ist morgen krank“', 'örn. „Ali yarın hasta“', 'e.g. “Ali is sick tomorrow”'],
  ai_mic: ['Sprechen', 'Konuş', 'Speak'],
  stop: ['Stopp', 'Durdur', 'Stop'],
  ai_none: ['Dazu habe ich keine Aktion gefunden.', 'Bunun için bir işlem bulamadım.', 'I didn’t find an action for that.'],
  ai_off: ['Der Assistent ist für dieses Konto nicht freigegeben.', 'Asistan bu hesap için etkin değil.', 'The assistant isn’t enabled for this account.'],
  ai_rate: ['Gerade zu viele Anfragen – bitte gleich noch einmal versuchen.', 'Şu anda çok fazla istek var – birazdan tekrar dene.', 'Too many requests right now – please try again shortly.'],
  ai_err: ['Das hat nicht geklappt. Falls claude.ai gefragt hat, ob dieses Programm Claude verwenden darf: bitte erlauben und noch einmal senden.', 'Olmadı. claude.ai bu programın Claude kullanmasına izin isteyen bir pencere açtıysa izin ver ve tekrar gönder.', 'That didn’t work. If claude.ai asked whether this app may use Claude, please allow it and send again.'],
  ai_done: ['Erledigt.', 'Tamamlandı.', 'Done.'],
  ai_d_abs: ['{n}: {k} vom {f} bis {t} eintragen', '{n}: {f} – {t} arası {k} gir', '{n}: add {k} from {f} to {t}'],
  ai_d_repl: ['Ersatz für {n} suchen ({f} – {t})', '{n} için yedek bul ({f} – {t})', 'Find cover for {n} ({f} – {t})'],
  ai_d_assign: ['{n} einteilen: {s}', '{n} ata: {s}', 'Assign {n}: {s}'],
  ai_d_unassign: ['Einteilung entfernen: {s}', 'Atamayı kaldır: {s}', 'Remove assignment: {s}'],
  ai_d_event: ['Feier „{name}“ am {d}, {s}–{e}, {g} Gäste', '{d}: „{name}“ etkinliği, {s}–{e}, {g} misafir', 'Event “{name}” on {d}, {s}–{e}, {g} guests'],
  ai_d_guests: ['Gäste am {d}: {g}', '{d} misafir sayısı: {g}', 'Guests on {d}: {g}'],
  ai_d_avail: ['{n}: {days} → {x}', '{n}: {days} → {x}', '{n}: {days} → {x}'],
  ai_d_autoplan: ['Automatisch planen: {w}', 'Otomatik planla: {w}', 'Plan automatically: {w}'],
  not_avail: ['nicht verfügbar', 'müsait değil', 'not available'],

  err_sync: ['Synchronisierung unterbrochen', 'Senkronizasyon kesildi', 'Sync interrupted'],
  err_readonly: ['Keine Schreibrechte – Änderungen werden nicht gespeichert.', 'Yazma yetkisi yok – değişiklikler kaydedilmez.', 'No write access – changes are not saved.'],
  err_quota: ['Der Speicher ist voll. Bitte alte Wochen löschen oder eine Sicherung anlegen.', 'Depolama dolu. Lütfen eski haftaları sil veya yedek al.', 'Storage is full. Please delete old weeks or make a backup.'],
  err_save: ['Speichern fehlgeschlagen', 'Kaydetme başarısız', 'Saving failed'],
  err_local: ['Lokaler Speicher voll – bitte Sicherung herunterladen.', 'Yerel depolama dolu – lütfen yedek indir.', 'Local storage full – please download a backup.'],

  w_under: ['braucht noch {h} h', '{h} saat daha lazım', 'needs {h} h more'],
  w_over: ['+{h} h über Soll', 'hedefin {h} saat üstünde', '+{h} h above target'],
  w_second: ['Zweitaufgabe', 'ikinci görev', 'secondary role'],
  w_pref: ['Wunschzeit', 'tercih ettiği saat', 'preferred time'],
  w_wish_off: ['wollte frei', 'izin istemişti', 'wanted the day off'],
  w_few_we: ['wenig Wochenenden', 'az hafta sonu', 'few weekends'],
  w_cheap: ['günstig', 'uygun maliyetli', 'low cost'],
  w_rest10: ['kurze Ruhezeit', 'kısa dinlenme', 'short rest'],

  r_inactive: ['inaktiv', 'pasif', 'inactive'],
  r_notyet: ['noch nicht eingestellt', 'henüz işe başlamadı', 'not started yet'],
  r_left: ['ausgeschieden', 'işten ayrıldı', 'has left'],
  r_role: ['hat diese Aufgabe nicht', 'bu görevi yok', 'doesn’t have this role'],
  r_loc: ['anderer Standort', 'başka şube', 'other location'],
  r_abs: ['abwesend: {k}', 'yok: {k}', 'absent: {k}'],
  r_avail: ['an diesem Tag nicht verfügbar', 'o gün müsait değil', 'not available that day'],
  r_avail_time: ['zu dieser Uhrzeit nicht verfügbar', 'bu saatte müsait değil', 'not available at this time'],
  r_youth_time: ['Jugendschutz: Uhrzeit nicht erlaubt', 'Genç koruması: saat uygun değil', 'Youth protection: time not allowed'],
  r_youth_school: ['Jugendschutz: am Tag vor der Berufsschule nur bis 20 Uhr', 'Genç koruması: okul gününden önce sadece 20:00’ye kadar', 'Youth protection: before a school day only until 8 pm'],
  r_school: ['Berufsschule', 'Meslek okulu', 'Vocational school'],
  r_youth_day: ['Jugendschutz: mehr als 8 Std.', 'Genç koruması: 8 saatten fazla', 'Youth protection: more than 8 h'],
  r_overlap: ['arbeitet zu dieser Zeit schon', 'bu saatte zaten çalışıyor', 'already working at this time'],
  r_rest: ['Ruhezeit zu kurz', 'dinlenme süresi çok kısa', 'rest period too short'],
  r_split: ['hat an diesem Tag schon eine Schicht', 'o gün zaten vardiyası var', 'already has a shift that day'],
  r_day: ['über der Tageshöchstarbeitszeit', 'günlük azami süre aşılır', 'over the daily maximum'],
  r_week: ['über der Wochenhöchstarbeitszeit', 'haftalık azami süre aşılır', 'over the weekly maximum'],
  r_days: ['zu viele Arbeitstage in der Woche', 'haftada çok fazla iş günü', 'too many working days this week'],
  r_run: ['zu viele Tage am Stück', 'art arda çok fazla gün', 'too many days in a row'],
  r_minijob: ['Minijob-Grenze würde überschritten', 'minijob sınırı aşılır', 'minijob limit would be exceeded'],
  r_sun15: ['15 freie Sonntage wären nicht mehr möglich', '15 boş Pazar kuralı karşılanamaz', '15 free Sundays would no longer be possible'],

  c_open: ['{d}: {n}× {shift} ({s}–{e}) offen', '{d}: {n}× {shift} ({s}–{e}) boş', '{d}: {n}× {shift} ({s}–{e}) open'],
  c_minwage: ['{name}: Stundenlohn liegt unter dem Mindestlohn ({v})', '{name}: saat ücreti asgari ücretin altında ({v})', '{name}: hourly wage is below the minimum wage ({v})'],
  c_minwage_next: ['Ab 1.1.{y} gilt ein Mindestlohn von {v}: {n} Mitarbeiter liegen darunter. Löhne rechtzeitig anpassen.', '1.1.{y} itibarıyla asgari ücret {v}: {n} personel bunun altında. Ücretleri zamanında güncelle.', 'From 1 Jan {y} the minimum wage is {v}: {n} employees are below it. Adjust wages in time.'],
  c_role: ['{name} ({d}): hat diese Aufgabe nicht', '{name} ({d}): bu görevi yok', '{name} ({d}): doesn’t have this role'],
  c_abs: ['{name} ({d}): eingeteilt, aber {k}', '{name} ({d}): atanmış ama {k}', '{name} ({d}): assigned but {k}'],
  c_wish: ['{name} ({d}): wollte frei haben', '{name} ({d}): izin istemişti', '{name} ({d}): wanted the day off'],
  c_avail: ['{name} ({d}): an diesem Tag eigentlich nicht verfügbar', '{name} ({d}): o gün normalde müsait değil', '{name} ({d}): normally not available that day'],
  c_avail_time: ['{name} ({d}): außerhalb der Verfügbarkeit', '{name} ({d}): müsaitlik saatleri dışında', '{name} ({d}): outside availability'],
  c_break: ['{name} ({d}): Pause zu kurz, mindestens {v} Min.', '{name} ({d}): mola çok kısa, en az {v} dk', '{name} ({d}): break too short, at least {v} min'],
  c_youth_time: ['{name} ({d}): Jugendschutz – diese Uhrzeit ist nicht erlaubt', '{name} ({d}): genç koruması – bu saat uygun değil', '{name} ({d}): youth protection – this time isn’t allowed'],
  c_youth_school: ['{name} ({d}): vor dem Berufsschultag nur bis 20 Uhr', '{name} ({d}): okul gününden önce sadece 20:00’ye kadar', '{name} ({d}): before a school day only until 8 pm'],
  c_youth_day: ['{name} ({d}): Jugendliche höchstens 8 Std. pro Tag', '{name} ({d}): gençler günde en fazla 8 saat', '{name} ({d}): young workers at most 8 h a day'],
  c_school: ['{name} ({d}): hat Berufsschule', '{name} ({d}): meslek okulu var', '{name} ({d}): has vocational school'],
  c_overlap: ['{name} ({d}): zwei Schichten überschneiden sich', '{name} ({d}): iki vardiya çakışıyor', '{name} ({d}): two shifts overlap'],
  c_rest: ['{name} ({d}): nur {v} Std. Ruhezeit', '{name} ({d}): sadece {v} saat dinlenme', '{name} ({d}): only {v} h rest'],
  c_rest10: ['{name} ({d}): Ruhezeit {v} Std. – innerhalb von 4 Wochen ausgleichen', '{name} ({d}): dinlenme {v} saat – 4 hafta içinde telafi et', '{name} ({d}): rest {v} h – compensate within 4 weeks'],
  c_day: ['{name} ({d}): {v} Std. an einem Tag', '{name} ({d}): bir günde {v} saat', '{name} ({d}): {v} h in one day'],
  c_day8: ['{name} ({d}): {v} Std. – über 8 Std. muss im Durchschnitt ausgeglichen werden', '{name} ({d}): {v} saat – 8 saatin üstü ortalamada dengelenmeli', '{name} ({d}): {v} h – over 8 h must be balanced on average'],
  c_split: ['{name} ({d}): zwei Schichten an einem Tag', '{name} ({d}): bir günde iki vardiya', '{name} ({d}): two shifts in one day'],
  c_week: ['{name}: {v} Std. in der Woche (max. {m})', '{name}: haftada {v} saat (en fazla {m})', '{name}: {v} h this week (max {m})'],
  c_days: ['{name}: {v} Arbeitstage (max. {m})', '{name}: {v} iş günü (en fazla {m})', '{name}: {v} working days (max {m})'],
  c_run: ['{name}: {v} Tage am Stück (max. {m})', '{name}: art arda {v} gün (en fazla {m})', '{name}: {v} days in a row (max {m})'],
  c_overtime: ['{name}: {v} Std. über Vertragsstunden', '{name}: sözleşme saatinin {v} saat üstünde', '{name}: {v} h above contract hours'],
  c_undertime: ['{name}: {v} Std. unter Vertragsstunden', '{name}: sözleşme saatinin {v} saat altında', '{name}: {v} h below contract hours'],
  c_minijob: ['{name}: Minijob-Grenze überschritten ({v} € von {m} €)', '{name}: minijob sınırı aşıldı ({m} €’dan {v} €)', '{name}: minijob limit exceeded ({v} € of {m} €)'],
  c_minijob90: ['{name}: Minijob fast ausgeschöpft ({v} € von {m} €)', '{name}: minijob neredeyse doldu ({m} €’dan {v} €)', '{name}: minijob almost used up ({v} € of {m} €)'],
  c_sun15: ['{name}: {v} Sonntage gearbeitet – mehr als erlaubt ({m})', '{name}: {v} Pazar çalıştı – izin verilenden fazla ({m})', '{name}: worked {v} Sundays – more than allowed ({m})'],
  c_sun15_near: ['{name}: schon {v} von {m} möglichen Sonntagen', '{name}: mümkün olan {m} Pazar’ın {v} tanesi kullanıldı', '{name}: already {v} of {m} possible Sundays'],
  c_youth_we: ['{name}: Jugendliche – mindestens 2 Samstage oder Sonntage im Monat frei lassen', '{name}: genç personel – ayda en az 2 Cumartesi veya Pazar boş bırak', '{name}: young worker – keep at least 2 Saturdays or Sundays a month free']
};

/* ==========================================================================
   App: Zustand, Speicher (Artifact-Datenbank oder lokal), Wochenmodell,
   Änderungen. Wird mit app-views.js und app-actions.js in ein IIFE gebaut.
   ========================================================================== */
const C = window.Core, DM = window.Demo;
const UI_LANGS = ['tr', 'de', 'en'];
const LOCALE = { de: 'de-DE', tr: 'tr-TR', en: 'en-GB' };
const AREA_DARK = { lead: '#1E9CC2', kitchen: '#B67C14', bar: '#CC5895', service: '#38A04E', dish: '#6276E6', delivery: '#D85F40', clean: '#8F7ADB' };
const CTS = ['VZ', 'TZ', 'MJ', 'AZ', 'WS', 'AH'];
const ABS_KINDS = ['urlaub', 'krank', 'wunsch', 'frei', 'schule', 'sonst'];
const MSG_LANGS = Object.keys(C.MSG);
const LS_KEY = 'nirvana-schichtplan-v1';

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
const todayISO = () => { const n = new Date(); return n.getFullYear() + '-' + C.pad(n.getMonth() + 1) + '-' + C.pad(n.getDate()); };
const lsGet = k => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const useCap = n => (window.claude && typeof window.claude.use === 'function') ? Promise.resolve(window.claude.use(n)).catch(() => null) : Promise.resolve(null);
// Eigenständige Web-Version (z. B. xenosmart.de/nirvana/schichtplan): kein Claude-Umfeld, Daten bleiben auf dem Gerät.
const IS_WEB = !(window.claude && typeof window.claude.use === 'function');
const IDB = (() => {
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('nirvana-schichtplan', 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('idb'));
      r.onblocked = () => rej(new Error('idb blocked'));
    } catch (e) { rej(e); }
  }));
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const tx = db.transaction('kv', mode); const req = fn(tx.objectStore('kv'));
    tx.oncomplete = () => res(req ? req.result : undefined);
    tx.onerror = () => rej(tx.error || new Error('idb'));
    tx.onabort = () => rej(tx.error || new Error('idb abort'));
  }));
  return { get: k => run('readonly', st => st.get(k)), set: (k, v) => run('readwrite', st => st.put(v, k)) };
})();
const webDownloads = {
  save: async ({ filename, data }) => {
    const type = /\.pdf$/i.test(filename) ? 'application/pdf' : /\.png$/i.test(filename) ? 'image/png' : /\.csv$/i.test(filename) ? 'text/csv;charset=utf-8' : /\.json$/i.test(filename) ? 'application/json' : 'application/octet-stream';
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { status: 'saved' };
  }
};
const BACKUP_KEY = 'sp-lastbackup';
function backupAge() { const lb = lsGet(BACKUP_KEY); return lb ? Math.round((C.parseD(todayISO()) - C.parseD(lb)) / 86400000) : null; }

const A = {
  lang: null, view: 'plan', wk: C.wkId(todayISO()), mode: 'loading', canWrite: true, roReason: '',
  planView: (window.innerWidth < 760 ? 'day' : 'staff'), dayIdx: (C.dow(todayISO()) + 6) % 7, area: '', q: '', tq: '', tct: '',
  cfg: null, staff: null, abs: {}, evt: {}, weeks: {}, wkReady: {}, stats: {}, sent: {},
  drawer: null, modal: null, undo: [], ver: 0, caps: {}, pending: 0, slow: false,
  ai: { open: false, busy: false, log: [], ctl: null, plan: null, listening: false },
  sendMode: 'week', sendDay: null, sendCh: '', repArea: '', affected: null, gmail: null
};

/* ---------------- Sprache ---------------- */
function t(k, v) {
  const row = I18N[k];
  let s = row ? (row[{ de: 0, tr: 1, en: 2 }[A.lang]] || row[0]) : k;
  if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => (v[x] != null ? v[x] : ''));
  return s;
}
const L = o => C.nameOf(o, A.lang);
const nf = (n, d) => new Intl.NumberFormat(LOCALE[A.lang], { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }).format(n || 0);
const pct = (v, d) => new Intl.NumberFormat(LOCALE[A.lang], { style: 'percent', maximumFractionDigits: d || 0, minimumFractionDigits: 0 }).format(v || 0);
const eur = (n, d) => new Intl.NumberFormat(LOCALE[A.lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }).format(n || 0);
function fmtDay(d, opt) {
  const dt = new Date(C.parseD(d));
  return new Intl.DateTimeFormat(LOCALE[A.lang], Object.assign({ timeZone: 'UTC' }, opt || { weekday: 'short', day: '2-digit', month: '2-digit' })).format(dt);
}
const wdShort = d => fmtDay(d, { weekday: 'short' }).replace('.', '');
const ddmm = d => d.slice(8, 10) + '.' + d.slice(5, 7) + '.';
function pickLang() {
  const saved = lsGet('sp-lang');
  if (saved && UI_LANGS.includes(saved)) return saved;
  if (A.cfg && UI_LANGS.includes(A.cfg.lang)) return A.cfg.lang;
  const nav = (navigator.language || 'tr').slice(0, 2);
  return UI_LANGS.includes(nav) ? nav : 'tr';
}

/* ---------------- Daten-Zugriff ---------------- */
const staffArr = () => Object.values(A.staff || {});
const emp = id => (A.staff || {})[id];
const areaById = id => (A.cfg.areas || []).find(a => a.id === id);
const roleById = id => (A.cfg.roles || []).find(r => r.id === id);
const tplById = id => (A.cfg.tpl || []).find(x => x.id === id);
const roleArea = r => { const ro = roleById(r); return ro ? ro.a : ''; };
const empArea = e => roleArea(e.primary || (e.roles || [])[0]) || 'other';
function areaIndex(a) { const i = (A.cfg.areas || []).findIndex(x => x.id === a); return i < 0 ? 99 : i; }
function sortedStaff(list) {
  return list.slice().sort((a, b) => areaIndex(empArea(a)) - areaIndex(empArea(b)) || (a.active === false) - (b.active === false) || String(a.name).localeCompare(String(b.name), LOCALE[A.lang]));
}
function yearsOf(dates) { return [...new Set(dates.map(d => +d.slice(0, 4)))]; }
function absList(years) { let out = []; for (const y of years) out = out.concat((A.abs[y] || [])); return out; }
function evtList(years) { let out = []; for (const y of years) out = out.concat((A.evt[y] || [])); return out; }
function shiftName(sh) {
  if (sh.t && sh.t.startsWith('ev:')) {
    const ev = evtList(yearsOf([sh.d])).find(e => e.id === sh.ev || sh.t.split(':')[1] === e.id);
    return (ev ? ev.name : t('event')) + ' · ' + L((roleById(sh.r) || {}).name);
  }
  const tp = sh.t && tplById(sh.t);
  return tp ? L(tp.name) : L((roleById(sh.r) || {}).name) || sh.r;
}
const roleShort = r => { const ro = roleById(r); return ro ? (L(ro.sh) || L(ro.name)) : r; };

/* ---------------- Wochenmodell ---------------- */
let MC = {};
function bump() { A.ver++; MC = {}; }
function weekModel(wk) {
  const key = wk + '|' + A.ver;
  if (MC[key]) return MC[key];
  const cfg = A.cfg;
  const dates = C.weekDates(C.wkStart(wk));
  const doc = A.weeks[wk] || null;
  const days = (doc && doc.days) || {};
  const years = yearsOf([C.addDays(dates[0], -7), C.addDays(dates[6], 7)]);
  const events = evtList(years).filter(e => dates.includes(e.d));
  const demand = C.demandForWeek(cfg, dates, days, events);
  let shifts, virtual = false;
  if (doc) shifts = doc.shifts || [];
  else {
    shifts = C.syncDemand([], demand).shifts;
    const cnt = {};
    for (const sh of shifts) { const k = sh.d + sh.t; cnt[k] = (cnt[k] || 0) + 1; sh.id = 'v' + sh.d.replace(/-/g, '') + '_' + sh.t + '_' + cnt[k]; }
    virtual = true;
  }
  const diff = doc ? C.demandDiff(shifts, demand) : { plus: 0, minus: 0 };
  const staff = staffArr();
  const absences = absList(years);
  const prev = (A.weeks[C.wkShift(wk, -1)] || {}).shifts || [];
  const next = (A.weeks[C.wkShift(wk, 1)] || {}).shifts || [];
  const hist = C.histFrom(Object.values(A.stats || {}), wk);
  const input = { cfg, staff, absences, dates, shifts, prev, next, hist };
  const issues = C.checkWeek(input);
  const ctx = C.buildCtx(input);
  const S = C.buildState(ctx, shifts);
  const rev = dates.map(d => C.dayRevenue(d, cfg, days[d], events));
  const costDay = dates.map(() => ({ tot: 0, by: {} }));
  let costTot = 0, hours = 0, surTot = 0;
  const empCost = {};
  for (const sh of shifts) {
    const i = dates.indexOf(sh.d); if (i < 0 || !sh.emp) continue;
    const e = emp(sh.emp); if (!e) continue;
    const c = C.shiftCost(sh, e, cfg), a = sh.a || roleArea(sh.r);
    costDay[i].tot += c.total; costDay[i].by[a] = (costDay[i].by[a] || 0) + c.total;
    costTot += c.total; surTot += c.sur; hours += C.netH(sh);
    const ec = empCost[sh.emp] = empCost[sh.emp] || { c: 0, sur: 0, night: 0, sun: 0, hol: 0 };
    ec.c += c.total; ec.sur += c.sur; ec.night += c.nightH; ec.sun += c.sunH; ec.hol += c.holH;
  }
  const filled = shifts.filter(s => dates.includes(s.d) && s.emp).length;
  const total = shifts.filter(s => dates.includes(s.d)).length;
  const issueBy = {};
  for (const is of issues) { if (is.shiftId) (issueBy[is.shiftId] = issueBy[is.shiftId] || []).push(is); }
  const absBy = ctx.absBy;
  const m = { wk, dates, doc, virtual, days, events, demand, shifts, diff, input, issues, issueBy, S, ctx, absBy, rev, costDay, costTot, surTot, hours, filled, total, empCost, hist };
  MC[key] = m;
  return m;
}

/* ---------------- Speicher ---------------- */
const Store = {
  db: null, unsub: {}, q: {}, localTimer: null,
  async start() {
    if (IS_WEB) return this.startWeb();
    const db = await useCap('db');
    if (db) { this.db = db; A.mode = 'loading'; this.subscribeBase(); }
    else this.startLocal();
    this.capabilities();
  },
  capabilities() {
    useCap('user').then(async u => {
      A.caps.user = u;
      if (!u) return;
      try {
        const w = await Promise.resolve(u.can ? u.can('data.write') : null);
        if (w === false && A.mode !== 'local') { A.canWrite = false; A.roReason = 'ro_view'; render(); }
      } catch (e) { /* keine Angabe */ }
    });
    useCap('downloads').then(d => { A.caps.downloads = d; render(); });
    useCap('sample').then(s => { A.caps.sample = s; render(); });
    useCap('dictation').then(d => { A.caps.dictation = d; });
    useCap('mcp').then(m => { A.caps.mcp = m; if (m) this.checkGmail(); });
  },
  async checkGmail() {
    try {
      const r = await A.caps.mcp.listTools('Gmail');
      const s = (r.servers || []).find(x => x.server === 'Gmail');
      A.gmail = s && (s.tools || []).some(x => x.name === 'send_message') ? (s.authStatus || 'unknown') : null;
    } catch (e) { A.gmail = null; }
    render();
  },
  subscribeBase() {
    const db = this.db;
    const timer = setTimeout(() => { if (!A.cfgDefinitive) { A.slow = true; render(); } }, 10000);
    this.sub('cfg', db.doc('app/config'), snap => {
      if (!snap.metadata.fromCache) { A.cfgDefinitive = true; A.slow = false; clearTimeout(timer); }
      A.cfg = snap.exists ? snap.data() : null;
      if (A.cfg) { if (!A.lang) A.lang = pickLang(); A.mode = 'db'; }
      else if (A.cfgDefinitive) A.mode = 'empty';
      bump(); render();
    }, err => { clearTimeout(timer); A.slow = false; this.subError(err); });
    this.sub('staff', db.doc('app/staff'), snap => { A.staff = snap.exists ? (snap.data().emp || {}) : {}; bump(); render(); });
    const y = +todayISO().slice(0, 4);
    for (const yy of [y - 1, y, y + 1]) this.subYear(yy);
    this.sub('stats', db.collection('stats').where('y', '>=', y - 1), qs => {
      const st = {}; for (const d of qs.docs) st[d.id] = d.data(); A.stats = st; bump(); render();
    });
    this.subWeeks(A.wk);
  },
  subYear(y) {
    if (A.mode === 'local' || !this.db || this.unsub['abs' + y]) return;
    this.sub('abs' + y, this.db.doc('abs/' + y), s => { A.abs[y] = s.exists ? (s.data().list || []) : []; bump(); render(); });
    this.sub('evt' + y, this.db.doc('evt/' + y), s => { A.evt[y] = s.exists ? (s.data().list || []) : []; bump(); render(); });
  },
  subWeeks(wk) {
    const want = new Set([C.wkShift(wk, -1), wk, C.wkShift(wk, 1)]);
    for (const y of yearsOf([C.addDays(C.wkStart(wk), -7), C.addDays(C.wkStart(wk), 13)])) this.subYear(y);
    if (A.mode === 'local' || !this.db) return;
    for (const k of Object.keys(this.unsub)) {
      if (k.startsWith('wk:') && !want.has(k.slice(3))) { this.unsub[k](); delete this.unsub[k]; }
      if (k.startsWith('sent:') && k.slice(5) !== wk) { this.unsub[k](); delete this.unsub[k]; }
    }
    for (const w of want) {
      if (this.unsub['wk:' + w]) continue;
      this.sub('wk:' + w, this.db.doc('weeks/' + w), s => {
        A.weeks[w] = s.exists ? s.data() : null;
        if (!s.metadata.fromCache || s.exists) A.wkReady[w] = true;
        bump(); render();
      });
    }
    if (!this.unsub['sent:' + wk]) this.sub('sent:' + wk, this.db.doc('sent/' + wk), s => { A.sent[wk] = s.exists ? s.data() : null; bump(); render(); });
  },
  sub(key, ref, next, err) {
    if (this.unsub[key]) this.unsub[key]();
    this.unsub[key] = ref.onSnapshot(next, err || (e => this.subError(e)));
  },
  subError(e) {
    if (!e) return;
    if (e.code === 'revoked' || e.code === 'not_granted') { A.canWrite = false; A.roReason = 'ro_revoked'; }
    toast(t('err_sync') + ' (' + (e.code || '?') + ')', 'err');
    render();
  },
  write(path, data) {
    if (A.mode === 'local' || !this.db) { this.saveLocalSoon(); return; }
    const q = this.q[path] || (this.q[path] = { busy: false, next: null, del: false });
    q.next = data; q.del = false;
    if (!q.busy) this.flush(path);
  },
  remove(path) {
    if (A.mode === 'local' || !this.db) { this.saveLocalSoon(); return; }
    const q = this.q[path] || (this.q[path] = { busy: false, next: null, del: false });
    q.next = null; q.del = true;
    if (!q.busy) this.flush(path);
  },
  async flush(path) {
    const q = this.q[path]; q.busy = true; A.pending++; renderStatus();
    let retried = false;
    while (q.next || q.del) {
      const data = q.next, del = q.del; q.next = null; q.del = false;
      try {
        if (del) await this.db.doc(path).delete(); else await this.db.doc(path).set(data);
      } catch (e) {
        if (e && e.code === 'unavailable' && !retried) { retried = true; await sleep(800 + Math.random() * 800); if (del) q.del = true; else if (!q.next) q.next = data; continue; }
        // Gleichzeitig von jemand anderem geändert: dessen Stand gilt, unsere Warteschlange verfällt
        if (e && e.code === 'conflict') { q.next = null; q.del = false; toast(t('conflict', { n: e.by || '?' }), 'warn'); bump(); render(); break; }
        if (e && e.code === 'unauthenticated') { q.next = null; q.del = false; break; }
        this.writeError(e); break;
      }
    }
    q.busy = false; A.pending--; renderStatus();
  },
  writeError(e) {
    const code = (e && e.code) || '';
    if (code === 'invalid_argument' && A.caps.user) { A.canWrite = false; A.roReason = 'ro_view'; toast(t('err_readonly'), 'err'); }
    else if (code === 'quota_exceeded') toast(t('err_quota'), 'err');
    else if (code === 'revoked') { A.canWrite = false; A.roReason = 'ro_revoked'; toast(t('err_readonly'), 'err'); }
    else if (code === 'permission_denied') { A.canWrite = false; A.roReason = 'ro_role'; toast(t('err_readonly'), 'err'); }
    else if (code === 'too_large') toast(t('err_too_large'), 'err');
    else toast(t('err_save') + (code ? ' (' + code + ')' : ''), 'err');
    render();
  },
  /* ---- lokaler Modus ---- */
  async readLocal() {
    let d = null, fromLs = false;
    try { d = await IDB.get('state'); this.idbOk = true; } catch (e) { this.idbOk = false; }
    if (!d) {
      const raw = lsGet(LS_KEY);
      if (raw) { try { d = JSON.parse(raw); fromLs = true; } catch (e) { d = null; } }
    }
    return { d, fromLs };
  },
  applyLocal(d) {
    Object.assign(A, { cfg: (d && d.cfg) || null, staff: (d && d.staff) || {}, abs: (d && d.abs) || {}, evt: (d && d.evt) || {}, weeks: (d && d.weeks) || {}, stats: (d && d.stats) || {}, sent: (d && d.sent) || {} });
    A.mode = A.cfg ? 'local' : 'empty'; A.localEmpty = !A.cfg;
  },
  async startLocal() {
    const { d, fromLs } = await this.readLocal();
    this.applyLocal(d);
    A.lang = A.lang || pickLang();
    // Altbestand aus localStorage in die größere Gerätedatenbank übernehmen
    if (fromLs && this.idbOk) { try { await IDB.set('state', d); lsSet(LS_KEY, ''); } catch (e) { /* bleibt im localStorage */ } }
    try {
      this.tabId = Math.random().toString(36).slice(2);
      this.bc = new BroadcastChannel('nirvana-schichtplan');
      this.bc.onmessage = ev => { if (ev.data && ev.data.t === 'saved' && ev.data.id !== this.tabId && !this.localTimer) this.reloadLocal(); };
    } catch (e) { this.bc = null; }
    bump(); render();
  },
  async reloadLocal() {
    const { d } = await this.readLocal();
    this.applyLocal(d); bump(); render();
  },
  saveLocalSoon() {
    clearTimeout(this.localTimer);
    this.localTimer = setTimeout(() => { this.localTimer = null; this.saveLocalNow(); }, 250);
  },
  async saveLocalNow() {
    const state = A.cfg ? { v: 1, at: Date.now(), cfg: A.cfg, staff: A.staff, abs: A.abs, evt: A.evt, weeks: A.weeks, stats: A.stats, sent: A.sent } : null;
    let ok = false;
    if (this.idbOk !== false) {
      try { await IDB.set('state', state ? clone(state) : null); ok = true; this.idbOk = true; } catch (e) { this.idbOk = false; }
    }
    if (!ok) ok = lsSet(LS_KEY, state ? JSON.stringify(state) : '');
    if (!ok) { toast(t('err_local'), 'err'); return; }
    if (this.bc) { try { this.bc.postMessage({ t: 'saved', id: this.tabId }); } catch (e) { /* egal */ } }
    if (state && !state.cfg.demo && !this.persistAsked) {
      this.persistAsked = true;
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) { /* egal */ }
    }
  },
  async listIds(coll) {
    if (!this.db) return [];
    const qs = await this.db.collection(coll).get();
    return qs.docs.map(d => d.id);
  }
};

/* ---------------- Änderungen ---------------- */
function guard() {
  if (!A.canWrite) { toast(t('err_readonly'), 'err'); return false; }
  return true;
}
function weekReady(wk) { return A.mode === 'local' || A.wkReady[wk]; }
function mutWeek(wk, fn, opt) {
  if (!guard()) return null;
  if (!weekReady(wk)) { toast(t('wait_load'), 'warn'); return null; }
  const m = weekModel(wk);
  const base = m.doc ? clone(m.doc) : { wk, shifts: clone(m.shifts), days: {}, pub: null };
  if (!(opt && opt.noUndo)) { A.undo.push({ wk, doc: m.doc ? clone(m.doc) : null }); if (A.undo.length > 40) A.undo.shift(); }
  const out = fn(base, m);
  base.wk = wk; base.up = new Date().toISOString();
  base.shifts = (base.shifts || []).map(s => { const o = Object.assign({}, s); for (const k in o) if (o[k] === undefined) delete o[k]; return o; });
  A.weeks[wk] = base; A.wkReady[wk] = true;
  bump();
  Store.write('weeks/' + wk, base);
  const st = C.weekStats(wk, base.shifts, A.cfg, A.staff || {});
  A.stats[wk] = st; Store.write('stats/' + wk, st);
  render();
  return out;
}
function undo() {
  const last = A.undo.pop();
  if (!last || !guard()) return;
  if (last.doc) { A.weeks[last.wk] = last.doc; Store.write('weeks/' + last.wk, last.doc); const st = C.weekStats(last.wk, last.doc.shifts || [], A.cfg, A.staff || {}); A.stats[last.wk] = st; Store.write('stats/' + last.wk, st); }
  else { A.weeks[last.wk] = null; Store.remove('weeks/' + last.wk); delete A.stats[last.wk]; Store.remove('stats/' + last.wk); }
  bump(); render(); toast(t('undone'));
}
function saveCfg(patch) {
  if (!guard()) return;
  A.cfg = Object.assign(clone(A.cfg), patch);
  bump(); Store.write('app/config', A.cfg); render();
}
function saveStaff(map) {
  if (!guard()) return;
  A.staff = map; bump(); Store.write('app/staff', { emp: map }); render();
}
function saveYearList(kind, y, list) {
  if (!guard()) return;
  (kind === 'abs' ? A.abs : A.evt)[y] = list;
  bump(); Store.write(kind + '/' + y, { y, list }); render();
}
function saveSent(wk, doc) {
  if (!guard()) return;
  A.sent[wk] = doc; bump(); Store.write('sent/' + wk, doc); renderSoft();
}

function assignShift(wk, id, empId) {
  return mutWeek(wk, d => {
    const sh = d.shifts.find(x => x.id === id); if (!sh) return;
    if (sh.b0 == null) sh.b0 = sh.b || 0;
    const e = emp(empId);
    sh.emp = empId; sh.b = C.fitBreak(sh, e); sh.src = 'man';
  });
}
function unassignShift(wk, id) {
  return mutWeek(wk, d => { const sh = d.shifts.find(x => x.id === id); if (!sh) return; sh.emp = null; if (sh.b0 != null) sh.b = sh.b0; delete sh.src; });
}
function toggleLock(wk, id) { return mutWeek(wk, d => { const sh = d.shifts.find(x => x.id === id); if (sh) sh.lk = !sh.lk; }); }
function editShift(wk, id, patch) {
  return mutWeek(wk, d => {
    const sh = d.shifts.find(x => x.id === id); if (!sh) return;
    if ((patch.s && patch.s !== sh.s) || (patch.e && patch.e !== sh.e) || (patch.b != null && +patch.b !== +sh.b)) sh.cust = true;
    Object.assign(sh, patch);
    if (patch.b != null) sh.b0 = +patch.b;
  });
}
function deleteShift(wk, id) {
  return mutWeek(wk, d => {
    const sh = d.shifts.find(x => x.id === id); if (!sh) return;
    if (sh.t && !sh.t.startsWith('ev:')) { d.days = d.days || {}; const di = d.days[sh.d] = d.days[sh.d] || {}; di.adj = di.adj || {}; di.adj[sh.t] = (di.adj[sh.t] || 0) - 1; }
    d.shifts = d.shifts.filter(x => x !== sh);
  });
}
function addShift(wk, date, spec, empId) {
  return mutWeek(wk, d => {
    let sh;
    if (spec.tpl) {
      const tp = tplById(spec.tpl); if (!tp) return;
      d.days = d.days || {}; const di = d.days[date] = d.days[date] || {}; di.adj = di.adj || {}; di.adj[tp.id] = (di.adj[tp.id] || 0) + 1;
      sh = { id: C.uid('s'), d: date, t: tp.id, a: tp.a || roleArea(tp.r), r: tp.r, s: tp.s, e: tp.e, b: tp.b, b0: tp.b, emp: null, loc: tp.loc || '' };
    } else {
      const gross = (C.toMin(spec.e) - C.toMin(spec.s) + 1440) % 1440 || 1440;
      const b = spec.b != null ? +spec.b : C.suggestBreak(gross);
      sh = { id: C.uid('s'), d: date, t: null, a: roleArea(spec.r), r: spec.r, s: spec.s, e: spec.e, b, b0: b, emp: null, cust: true, n: spec.n || '' };
    }
    if (empId) { sh.emp = empId; sh.b = C.fitBreak(sh, emp(empId)); sh.src = 'man'; }
    d.shifts.push(sh);
    return sh.id;
  });
}
function applyDemand(wk) {
  return mutWeek(wk, (d, m) => {
    const dem = C.demandForWeek(A.cfg, m.dates, d.days || {}, m.events);
    const r = C.syncDemand(d.shifts, dem); d.shifts = r.shifts; return r;
  });
}
function setDayInfo(wk, date, patch) {
  return mutWeek(wk, (d, m) => {
    d.days = d.days || {};
    const di = d.days[date] = Object.assign({}, d.days[date] || {}, patch);
    for (const k in di) if (di[k] === null || di[k] === '') delete di[k];
    const dem = C.demandForWeek(A.cfg, m.dates, d.days, m.events);
    d.shifts = C.syncDemand(d.shifts, dem).shifts;
  });
}
function runAutoPlan(wk, mode, strategy, seed) {
  const t0 = performance.now();
  const res = mutWeek(wk, (d, m) => {
    const dem = C.demandForWeek(A.cfg, m.dates, d.days || {}, m.events);
    d.shifts = C.syncDemand(d.shifts, dem).shifts;
    const input = Object.assign({}, m.input, { shifts: d.shifts });
    const r = C.autoPlan(input, { mode, strategy, seed });
    d.shifts = r.shifts;
    d.plan = { at: new Date().toISOString(), strategy, mode };
    return r;
  });
  if (res) {
    const m = weekModel(wk);
    toast(t('plan_done', { f: m.filled, n: m.total, o: m.total - m.filled, ms: Math.max(1, Math.round(performance.now() - t0)) }), m.total - m.filled ? 'warn' : 'ok');
  }
  return res;
}
function copyPrevWeek(wk, fill) {
  const prevWk = C.wkShift(wk, -1), prev = A.weeks[prevWk];
  if (!prev || !(prev.shifts || []).some(s => s.emp)) { toast(t('copy_none'), 'warn'); return; }
  mutWeek(wk, (d, m) => {
    const dem = C.demandForWeek(A.cfg, m.dates, d.days || {}, m.events);
    d.shifts = C.syncDemand(d.shifts.map(s => (s.lk ? s : Object.assign({}, s, { emp: null }))), dem).shifts;
    const input = Object.assign({}, m.input, { shifts: d.shifts });
    const ctx = C.buildCtx(input), S = C.buildState(ctx, d.shifts);
    let copied = 0;
    for (const ps of prev.shifts) {
      if (!ps.emp || !ps.t) continue;
      const nd = C.addDays(ps.d, 7);
      const target = d.shifts.find(x => x.d === nd && x.t === ps.t && !x.emp);
      const e = emp(ps.emp);
      if (!target || !e) continue;
      if (C.canWork(e, target, S[e.id], ctx)) continue;
      C.doAssign(S, target, e, ctx); target.src = 'copy'; copied++;
    }
    if (fill) d.shifts = C.autoPlan(Object.assign({}, input, { shifts: d.shifts }), { mode: 'fill', strategy: 'balanced' }).shifts;
    return copied;
  });
  toast(t('copy_done'), 'ok');
}
function publishWeek(wk, on) { return mutWeek(wk, d => { d.pub = on ? { at: new Date().toISOString() } : null; }); }

/* Abwesenheiten */
function addAbsence(a) {
  const y = +a.f.slice(0, 4);
  const list = clone(A.abs[y] || []);
  a.id = C.uid('a'); list.push(a);
  saveYearList('abs', y, list);
  return a;
}
function removeAbsence(id) {
  for (const y in A.abs) { const l = A.abs[y] || []; if (l.some(x => x.id === id)) { saveYearList('abs', +y, l.filter(x => x.id !== id)); return; } }
}
function affectedShifts(a) {
  if (a.k === 'wunsch') return [];
  const out = [];
  for (const wk in A.weeks) {
    const doc = A.weeks[wk]; if (!doc) continue;
    for (const sh of doc.shifts || []) if (sh.emp === a.emp && sh.d >= a.f && sh.d <= a.t && sh.d >= todayISO()) out.push({ wk, id: sh.id, d: sh.d });
  }
  return out.sort((x, y) => x.d.localeCompare(y.d));
}
function autoReplace(list) {
  const byWk = {};
  for (const x of list) (byWk[x.wk] = byWk[x.wk] || []).push(x.id);
  let ok = 0, fail = 0;
  for (const wk in byWk) {
    mutWeek(wk, (d, m) => {
      for (const id of byWk[wk]) { const sh = d.shifts.find(s => s.id === id); if (sh) { sh.emp = null; if (sh.b0 != null) sh.b = sh.b0; } }
      const input = Object.assign({}, m.input, { shifts: d.shifts });
      const ctx = C.buildCtx(input), S = C.buildState(ctx, d.shifts);
      for (const id of byWk[wk]) {
        const sh = d.shifts.find(s => s.id === id); if (!sh) continue;
        const c = C.candidates(Object.assign({}, input, { shifts: d.shifts }), id);
        const best = c.ok[0];
        if (best && !C.canWork(emp(best.id), sh, S[best.id], ctx)) { C.doAssign(S, sh, emp(best.id), ctx); sh.src = 'repl'; ok++; } else fail++;
      }
    });
  }
  toast(t('repl_done', { ok, fail }), fail ? 'warn' : 'ok');
}

/* Veranstaltungen */
function saveEvent(ev) {
  const y = +ev.d.slice(0, 4);
  for (const yy in A.evt) if (+yy !== y && (A.evt[yy] || []).some(x => x.id === ev.id)) saveYearList('evt', +yy, A.evt[yy].filter(x => x.id !== ev.id));
  const list = clone(A.evt[y] || []);
  const i = list.findIndex(x => x.id === ev.id);
  if (i >= 0) list[i] = ev; else list.push(ev);
  saveYearList('evt', y, list);
  const wk = C.wkId(ev.d);
  if (A.weeks[wk]) applyDemand(wk);
}
function deleteEvent(id) {
  for (const y in A.evt) {
    const l = A.evt[y] || [], ev = l.find(x => x.id === id);
    if (ev) { saveYearList('evt', +y, l.filter(x => x.id !== id)); const wk = C.wkId(ev.d); if (A.weeks[wk]) applyDemand(wk); return; }
  }
}

/* Versand-Status */
function markSent(wk, empId, kind, extra) {
  const doc = clone(A.sent[wk]) || { wk, m: {}, dm: {} };
  doc.m = doc.m || {}; doc.dm = doc.dm || {};
  const m = weekModel(wk), e = emp(empId);
  if (kind === 'day') { const d = extra.d; doc.dm[d] = doc.dm[d] || {}; doc.dm[d][empId] = new Date().toISOString(); }
  else doc.m[empId] = { at: new Date().toISOString(), h: C.msgHash(e, m.shifts, m.dates), ch: extra && extra.ch || '' };
  saveSent(wk, doc);
}
function unmarkSent(wk, empId, kind, d) {
  const doc = clone(A.sent[wk]); if (!doc) return;
  if (kind === 'day') { if (doc.dm && doc.dm[d]) delete doc.dm[d][empId]; }
  else if (doc.m) delete doc.m[empId];
  saveSent(wk, doc);
}

/* Beispiel / Start */
async function loadDemo() {
  if (!guard()) return;
  const d = DM.demoData(todayISO());
  A.cfg = d.cfg; A.cfg.lang = A.lang || 'tr';
  const map = {}; for (const e of d.staff) map[e.id] = e;
  A.staff = map;
  const years = {};
  for (const a of d.absences) (years['abs' + a.f.slice(0, 4)] = years['abs' + a.f.slice(0, 4)] || []).push(a);
  for (const ev of d.events) (years['evt' + ev.d.slice(0, 4)] = years['evt' + ev.d.slice(0, 4)] || []).push(ev);
  Store.write('app/config', A.cfg); Store.write('app/staff', { emp: map });
  for (const k in years) { const kind = k.slice(0, 3), y = +k.slice(3); (kind === 'abs' ? A.abs : A.evt)[y] = years[k]; Store.write(kind + '/' + y, { y, list: years[k] }); }
  A.mode = A.mode === 'empty' && A.localEmpty ? 'local' : (Store.db ? 'db' : 'local');
  A.wkReady[A.wk] = A.wkReady[A.wk] || A.mode === 'local';
  bump(); render();
  await sleep(300);
  if (weekReady(A.wk)) runAutoPlan(A.wk, 'replan', 'balanced');
}
function startEmpty(biz) {
  if (!guard()) return;
  A.cfg = DM.defaultConfig(biz || 'Mein Restaurant'); A.cfg.lang = A.lang || 'tr';
  A.staff = {};
  Store.write('app/config', A.cfg); Store.write('app/staff', { emp: {} });
  A.mode = Store.db ? 'db' : 'local';
  bump(); A.view = 'team'; location.hash = 'team'; render();
}
async function wipeData(keepConfig) {
  if (!guard()) return;
  A.busyWipe = true; render();
  const delColl = async coll => {
    const ids = A.mode === 'local' ? [] : await Store.listIds(coll).catch(() => []);
    for (const id of ids) { Store.remove(coll + '/' + id); await sleep(60); }
  };
  if (A.mode !== 'local') { await delColl('weeks'); await delColl('stats'); await delColl('sent'); await delColl('abs'); await delColl('evt'); }
  A.weeks = {}; A.stats = {}; A.sent = {}; A.abs = {}; A.evt = {}; A.undo = [];
  if (keepConfig) {
    A.cfg = Object.assign(clone(A.cfg), { demo: false });
    Store.write('app/config', A.cfg);
    A.staff = {}; Store.write('app/staff', { emp: {} });
  } else {
    A.cfg = null; A.staff = {};
    if (A.mode === 'local') { lsSet(LS_KEY, ''); } else { Store.remove('app/config'); Store.remove('app/staff'); }
    A.mode = 'empty'; A.localEmpty = !Store.db;
  }
  for (const w of Object.keys(A.wkReady)) A.wkReady[w] = true;
  A.busyWipe = false; bump(); Store.saveLocalSoon(); render();
  toast(t('wiped'), 'ok');
}

/* ---------------- Toasts ---------------- */
let toastId = 0;
function toast(msg, kind) {
  const box = $('#toasts'); if (!box) return;
  const id = 'tt' + (++toastId);
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || 'ok'); el.id = id; el.setAttribute('role', 'status');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, kind === 'err' ? 6000 : 3800);
}

/* ---------------- Team-Datenbank (eigene Domain) ----------------
   Auf xenosmart.de / nirvanamechernich.com / *.pages.dev spricht die App mit der Cloudflare-Funktion
   „schichtplan-api“. RemoteDB bildet dabei genau die Datenbank-Schnittstelle nach, die der Store auch im
   Claude-Umfeld benutzt (doc/collection/onSnapshot/set/delete). Der letzte Stand liegt zusätzlich im Gerät
   (IndexedDB), damit die App auch ohne Netz aufgeht; nicht gespeicherte Änderungen werden nachgeschickt. */
const API_HOST = 'https://nirvana-reservierung.pages.dev';
const AUTH_KEY = 'sp-auth', TRY_KEY = 'sp-try';
const Remote = {
  base: '',
  pickBase() {
    if (!IS_WEB || location.protocol === 'file:') return '';
    const h = location.hostname;
    if (/\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1') return location.origin + '/schichtplan-api';
    if (/(^|\.)xenosmart\.de$/.test(h) || /(^|\.)nirvanamechernich\.com$/.test(h)) return API_HOST + '/schichtplan-api';
    return '';
  },
  loadAuth() {
    try { const a = JSON.parse(lsGet(AUTH_KEY) || 'null'); return a && a.token && a.base === this.base ? a : null; } catch (e) { return null; }
  },
  saveAuth(a) { lsSet(AUTH_KEY, JSON.stringify(Object.assign({}, a, { base: this.base }))); },
  clearAuth() { try { localStorage.removeItem(AUTH_KEY); } catch (e) { /* egal */ } },
  async api(method, p, payload, token) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 20000);
    let res;
    try {
      res = await fetch(this.base + p, {
        method, cache: 'no-store', credentials: 'omit', signal: ctl.signal,
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: payload ? JSON.stringify(payload) : undefined
      });
    } catch (e) { throw { code: 'unavailable' }; } finally { clearTimeout(tm); }
    let j = null; try { j = await res.json(); } catch (e) { j = null; }
    if (!res.ok) throw Object.assign({}, j || {}, { code: (j && j.error) || ('http_' + res.status), status: res.status });
    if (!j) throw { code: 'unavailable' };
    return j;
  },
  call(method, p, payload) { return this.api(method, p, payload, A.auth && A.auth.token); }
};

function RemoteDB(auth) {
  const cache = new Map(), docL = new Map(), colL = new Set(), inflight = new Set();
  const cacheKey = 'remote|' + Remote.base + '|' + auth.id, me = auth.name;
  let seq = 0, synced = false, syncing = false, again = false, timer = null, persistT = null, stopped = false;
  let lastToast = 0;
  const live = c => !!(c && !c.del && c.data != null);
  const inColl = (coll, p) => p.startsWith(coll + '/') && p.indexOf('/', coll.length + 1) < 0;
  const snapDoc = p => {
    const c = cache.get(p), ex = live(c);
    return { id: p.slice(p.lastIndexOf('/') + 1), exists: ex, data: () => (ex ? clone(c.data) : undefined), metadata: { fromCache: !synced, hasPendingWrites: !!(c && c.pending) } };
  };
  const cmp = { '>=': (x, v) => x >= v, '<=': (x, v) => x <= v, '>': (x, v) => x > v, '<': (x, v) => x < v, '==': (x, v) => x === v };
  const qsnap = (coll, where) => {
    let docs = [];
    for (const [p, c] of cache) if (inColl(coll, p) && live(c)) docs.push(snapDoc(p));
    for (const [f, op, v] of where) docs = docs.filter(d => (cmp[op] || (() => true))((d.data() || {})[f], v));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: !synced, hasPendingWrites: false }, docChanges: () => [] };
  };
  function notify(paths, all) {
    const set = new Set(paths);
    for (const [p, ls] of docL) if (all || set.has(p)) for (const fn of [...ls]) { try { fn(snapDoc(p)); } catch (e) { console.error(e); } }
    for (const l of [...colL]) if (all || [...set].some(p => inColl(l.coll, p))) { try { l.fn(qsnap(l.coll, l.where)); } catch (e) { console.error(e); } }
  }
  function persistSoon() {
    clearTimeout(persistT);
    persistT = setTimeout(() => { if (!stopped) IDB.set(cacheKey, { seq, at: Date.now(), docs: [...cache.entries()] }).catch(() => { /* Gerätespeicher voll: egal */ }); }, 1200);
  }
  function setOnline(on) {
    if (A.offline === !on) return;
    A.offline = !on; if (on) A.slow = false; render();
  }
  function waitRetry(n) {
    return new Promise(res => {
      const done = () => { clearTimeout(tm); window.removeEventListener('online', done); res(); };
      const tm = setTimeout(done, Math.min(30000, 1500 * Math.pow(2, n)));
      window.addEventListener('online', done);
    });
  }
  async function write(path, data, del) {
    inflight.add(path);
    try { return await writeNow(path, data, del); } finally { inflight.delete(path); }
  }
  async function writeNow(path, data, del) {
    const prev = cache.get(path);
    const base = prev ? prev.ver : 0;
    cache.set(path, { data: del ? null : clone(data), ver: base, seq: prev ? prev.seq : 0, at: Date.now(), by: me, del: !!del, pending: true });
    notify([path]); persistSoon();
    for (let n = 0; !stopped; n++) {
      try {
        const r = await Remote.api('POST', '/doc', del ? { path, base, del: true } : { path, base, data }, auth.token);
        const cur = cache.get(path);
        if (cur && cur.pending) { cur.ver = r.ver; cur.seq = Math.max(cur.seq || 0, r.seq || 0); cur.at = r.at; cur.pending = false; }
        setOnline(true); persistSoon();
        return;
      } catch (e) {
        if (e.code === 'conflict') {
          const d = e.doc;
          // Antwort ging verloren, der Server hat aber schon unseren Stand: kein echter Konflikt
          if (d && d.by === me && !!d.del === !!del && (del || JSON.stringify(d.data) === JSON.stringify(data))) {
            cache.set(path, { data: d.del ? null : d.data, ver: d.ver, seq: d.seq, at: d.at, by: d.by, del: !!d.del });
            persistSoon(); return;
          }
          if (d) cache.set(path, { data: d.del ? null : d.data, ver: d.ver, seq: d.seq, at: d.at, by: d.by, del: !!d.del });
          else cache.delete(path);
          notify([path]); persistSoon();
          throw { code: 'conflict', by: (d && d.by) || '' };
        }
        if (e.code === 'unauthenticated') { Store.authLost(); throw e; }
        if (e.code !== 'unavailable' && !(e.status >= 500)) {
          // Dauerhafter Fehler (z. B. keine Schreibrechte): zurück auf den letzten bestätigten Stand
          if (prev) cache.set(path, prev); else cache.delete(path);
          notify([path]); persistSoon();
          throw e;
        }
        setOnline(false);
        await waitRetry(n);
      }
    }
  }
  async function syncNow() {
    if (stopped) return;
    if (syncing) { again = true; return; }
    syncing = true;
    try {
      const r = await Remote.api('GET', '/sync?since=' + seq, null, auth.token);
      if (r.reset) { cache.clear(); seq = 0; synced = false; again = true; return; }   // Datenbank neu: alles frisch laden
      const changed = [], lost = [], by = new Set();
      for (const d of r.docs || []) {
        const c = cache.get(d.path);
        if (c && c.ver >= d.ver) { if (!c.pending && d.seq > (c.seq || 0)) c.seq = d.seq; continue; }
        if (c && c.pending && d.by === me) continue;          // unser eigener Schreibvorgang ist unterwegs
        if (c && c.pending && !inflight.has(d.path)) lost.push(d.path);   // laufende Schreibvorgänge melden den Konflikt selbst
        cache.set(d.path, { data: d.del ? null : d.data, ver: d.ver, seq: d.seq, at: d.at, by: d.by, del: !!d.del });
        changed.push(d.path);
        if (d.by && d.by !== me) by.add(d.by);
      }
      seq = Math.max(seq, r.seq || 0);
      const first = !synced; synced = true;
      setOnline(true);
      if (first) notify([], true); else if (changed.length) notify(changed);
      if (first || changed.length) persistSoon();
      if (lost.length) toast(t('conflict', { n: [...by].join(', ') || '?' }), 'warn');
      else if (!first && by.size && !changed.some(p => inflight.has(p)) && changed.some(p => p === 'weeks/' + A.wk || p === 'app/staff') && Date.now() - lastToast > 20000) { lastToast = Date.now(); toast(t('remote_change', { n: [...by].join(', ') }), 'info'); }
      if (first) for (const [p, c] of cache) if (c.pending && !inflight.has(p)) { if (c.del) Store.remove(p); else Store.write(p, c.data); }   // Offline-Änderungen nachschicken
    } catch (e) {
      if (e.code === 'unauthenticated') Store.authLost();
      else setOnline(false);
    } finally {
      syncing = false;
      if (again) { again = false; syncNow(); }
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (stopped) return;
    timer = setTimeout(async () => { await syncNow(); schedule(); }, document.hidden ? 30000 : (A.offline ? 10000 : 5000));
  }
  const wake = () => { if (!document.hidden) { syncNow(); schedule(); } };
  const doc = path => ({
    id: path.slice(path.lastIndexOf('/') + 1), path,
    get: async () => snapDoc(path),
    set: data => write(path, data, false),
    delete: () => write(path, null, true),
    onSnapshot: next => {
      let s = docL.get(path); if (!s) docL.set(path, s = new Set());
      s.add(next); setTimeout(() => { if (s.has(next)) next(snapDoc(path)); }, 0);
      return () => s.delete(next);
    },
    collection: c => coll(path + '/' + c)
  });
  const coll = (c, where) => {
    where = where || [];
    return {
      path: c,
      where: (f, op, v) => coll(c, where.concat([[f, op, v]])), orderBy: () => coll(c, where), limit: () => coll(c, where),
      get: async () => qsnap(c, where),
      doc: id => doc(c + '/' + id),
      onSnapshot: next => {
        const l = { coll: c, where, fn: next }; colL.add(l);
        setTimeout(() => { if (colL.has(l)) next(qsnap(c, where)); }, 0);
        return () => colL.delete(l);
      }
    };
  };
  return {
    remote: true, doc, collection: c => coll(c),
    async init() {
      try {
        const c = await IDB.get(cacheKey);
        if (c && c.docs) { for (const [p, d] of c.docs) cache.set(p, d); seq = c.seq || 0; A.lastSync = c.at || null; }
      } catch (e) { /* kein Zwischenstand */ }
    },
    start() {
      document.addEventListener('visibilitychange', wake);
      window.addEventListener('online', wake);
      window.addEventListener('focus', wake);
      syncNow(); schedule();
    },
    stop() {
      stopped = true; clearTimeout(timer); clearTimeout(persistT);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      window.removeEventListener('focus', wake);
    },
    forget() { return IDB.set(cacheKey, null).catch(() => { /* egal */ }); },
    pendingCount() { let n = 0; for (const c of cache.values()) if (c.pending) n++; return n; }
  };
}

/* ---- Store-Erweiterung für die eigene Domain ---- */
Object.assign(Store, {
  async startWeb() {
    A.caps.downloads = webDownloads;
    Remote.base = Remote.pickBase();
    let tryMode = false; try { tryMode = sessionStorage.getItem(TRY_KEY) === '1'; } catch (e) { /* egal */ }
    if (!Remote.base) return this.startLocal();
    if (tryMode) { A.tryMode = true; return this.startLocal(); }
    const au = Remote.loadAuth();
    if (au) return this.startRemote(au);
    return this.showLogin();
  },
  async showLogin(msg) {
    A.mode = 'login'; A.login = { busy: false, err: msg || '', setup: null, offline: false };
    A.lang = A.lang || pickLang(); render();
    try { const s = await Remote.api('GET', '/status'); A.login.setup = !!s.setup; }
    catch (e) {
      if (e.status === 404) { Remote.base = ''; return this.startLocal(); }   // hier gibt es keine Team-Datenbank
      A.login.offline = true;
    }
    render();
  },
  async startRemote(au) {
    A.auth = au;
    const db = RemoteDB(au);
    await db.init();
    this.db = db; A.mode = 'loading';
    A.canWrite = au.role !== 'view'; A.roReason = au.role === 'view' ? 'ro_role' : '';
    this.subscribeBase();
    db.start();
    Remote.call('GET', '/me').then(r => {
      if (!r || !r.account) return;
      Object.assign(au, r.account); Remote.saveAuth(au); A.auth = au;
      A.canWrite = au.role !== 'view'; A.roReason = au.role === 'view' ? 'ro_role' : '';
      render();
    }).catch(e => { if (e.code === 'unauthenticated') this.authLost(); });
    // Gerätebestand aus dem lokalen Modus merken, um ihn bei leerer Team-Datenbank anbieten zu können
    this.readLocal().then(({ d }) => { if (d && d.cfg && !d.cfg.demo && Object.keys(d.staff || {}).length) { A.localOffer = d; render(); } }).catch(() => { /* egal */ });
  },
  authLost() {
    if (A.mode === 'login') return;
    const db = this.db;
    Remote.clearAuth();
    if (db && db.stop) { db.stop(); db.forget(); }
    for (const k of Object.keys(this.unsub)) { try { this.unsub[k](); } catch (e) { /* egal */ } delete this.unsub[k]; }
    this.db = null; this.q = {};
    Object.assign(A, { cfg: null, staff: null, abs: {}, evt: {}, weeks: {}, wkReady: {}, stats: {}, sent: {}, auth: null, modal: null, drawer: null, offline: false, pending: 0 });
    this.showLogin(t('session_end'));
  },
  async logout() {
    const db = this.db;
    if (db && db.stop) db.stop();
    try { await Remote.call('POST', '/logout'); } catch (e) { /* trotzdem abmelden */ }
    if (db && db.forget) await db.forget();
    Remote.clearAuth();
    location.reload();
  }
});

/* ==========================================================================
   App: Darstellung (HTML-Strings, alles über esc() abgesichert)
   ========================================================================== */
const ICONS = {
  chevl: '<path d="M15 5l-7 7 7 7"/>', chevr: '<path d="M9 5l7 7-7 7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>', check: '<path d="M5 12l5 5 9-10"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  err: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>', dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 016 5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', sms: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>'
};
const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || '') + '</svg>';

const TABS = [['plan', 'tab_plan'], ['team', 'tab_team'], ['abwesend', 'tab_abs'], ['bedarf', 'tab_demand'], ['versand', 'tab_send'], ['bericht', 'tab_report'], ['regeln', 'tab_settings']];

function areaStyleBlock() {
  if (!A.cfg) return '';
  let css = '';
  for (const a of A.cfg.areas || []) {
    const id = String(a.id).replace(/[^a-z0-9_-]/gi, ''), c = /^#[0-9a-f]{6}$/i.test(a.c) ? a.c : '#888888', dk = AREA_DARK[a.id] || c;
    css += '.ar-' + id + '{--c:' + c + '}';
    css += ':root[data-theme="dark"] .ar-' + id + '{--c:' + dk + '}';
    css += '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ar-' + id + '{--c:' + dk + '}}';
  }
  return css;
}
const arCls = a => 'ar-' + String(a || 'x').replace(/[^a-z0-9_-]/gi, '');

/* ---------------- Grundgerüst ---------------- */
function render() {
  if (!A.lang) A.lang = pickLang();
  document.documentElement.lang = A.lang;
  const app = $('#app');
  const gw = $('.gridwrap'), keep = gw ? [gw.scrollTop, gw.scrollLeft] : null, wy = window.scrollY;
  const st = $('#areaStyles'); if (st) st.textContent = areaStyleBlock();
  app.innerHTML = viewHeader() + '<main id="main">' + viewBanners() + viewMain() + '</main>';
  const dr = $('#drawer'); dr.innerHTML = A.drawer && A.cfg ? viewDrawer() : ''; dr.classList.toggle('open', !!(A.drawer && A.cfg));
  const mo = $('#modal'); mo.innerHTML = A.modal && A.cfg ? viewModal() : ''; mo.classList.toggle('open', !!(A.modal && A.cfg));
  const ai = $('#ai'); ai.innerHTML = A.cfg && A.caps.sample ? viewAI() : ''; ai.classList.toggle('open', !!A.ai.open);
  const gw2 = $('.gridwrap'); if (gw2 && keep) { gw2.scrollTop = keep[0]; gw2.scrollLeft = keep[1]; }
  if (Math.abs(window.scrollY - wy) > 2) window.scrollTo(0, wy);
  renderStatus();
}
let softTimer = null;
function renderSoft() { clearTimeout(softTimer); softTimer = setTimeout(render, 30); }
function renderStatus() {
  const el = $('#status'); if (!el) return;
  let cls = 'ok', txt = t('st_saved');
  if (A.mode === 'login') { cls = 'local'; txt = t('st_team'); }
  else if (A.offline) { cls = 'off'; txt = t(A.pending > 0 ? 'st_off_pending' : 'st_offline'); }
  else if (A.mode === 'loading') { cls = 'busy'; txt = t('st_loading'); }
  else if (A.pending > 0) { cls = 'busy'; txt = t('st_saving'); }
  else if (!A.canWrite) { cls = 'ro'; txt = t('st_readonly'); }
  else if (A.mode === 'local' || (A.mode === 'empty' && !Store.db)) { cls = 'local'; txt = t('st_local'); }
  el.className = 'status ' + cls; el.textContent = txt;
}

function viewHeader() {
  const biz = (A.cfg && A.cfg.biz) || '';
  const tabs = A.cfg && A.mode !== 'empty' ? TABS.map(([id, k]) => '<a href="#' + id + '" class="tab' + (A.view === id ? ' on' : '') + '" data-a="tab" data-v="' + id + '"' + (A.view === id ? ' aria-current="page"' : '') + '>' + esc(t(k)) + '</a>').join('') : '';
  const langs = UI_LANGS.map(l => '<button class="lg' + (A.lang === l ? ' on' : '') + '" data-a="lang" data-l="' + l + '" aria-pressed="' + (A.lang === l) + '">' + l.toUpperCase() + '</button>').join('');
  return '<header class="top"><div class="brand"><span class="logo">' + esc(biz || t('app_name')) + '</span>' + (biz ? '<span class="sub">' + esc(t('app_name')) + '</span>' : '') + '</div>' +
    '<nav class="tabs" aria-label="' + esc(t('nav')) + '">' + tabs + '</nav>' +
    '<div class="tools"><div class="langs" role="group" aria-label="' + esc(t('language')) + '">' + langs + '</div><span id="status" class="status"></span></div></header>';
}
function viewBanners() {
  let h = '';
  if (A.slow && !A.offline) h += '<div class="banner warn">' + ic('warn') + '<span>' + esc(t('slow')) + '</span></div>';
  if (A.offline && A.mode !== 'login') h += '<div class="banner warn">' + ic('warn') + '<span>' + esc(t('offline_banner')) + '</span></div>';
  if (A.tryMode) h += '<div class="banner demo">' + ic('info') + '<span>' + esc(t('try_banner')) + '</span><button class="btn sm" data-a="to-login">' + esc(t('to_login')) + '</button></div>';
  if (!A.cfg || A.mode === 'empty') return h;
  if (!A.canWrite) h += '<div class="banner ro">' + ic('info') + '<span>' + esc(t(A.roReason || 'ro_view')) + '</span></div>';
  if (A.mode === 'local' && !A.cfg.demo && Object.keys(A.staff || {}).length) {
    const age = backupAge();
    if (age === null || age >= 7) h += '<div class="banner local">' + ic('info') + '<span>' + esc(age === null ? t('backup_never') : t('backup_old', { n: age })) + '</span><button class="btn sm" data-a="backup-dl">' + ic('dl') + '<span>' + esc(t('backup_now')) + '</span></button></div>';
  }
  if (A.cfg.demo) h += '<div class="banner demo">' + ic('people') + '<span>' + esc(t('demo_banner')) + '</span><button class="btn sm" data-a="demo-end">' + esc(t('demo_end')) + '</button></div>';
  return h;
}
function viewMain() {
  if (A.mode === 'login') return viewLogin();
  if (A.mode === 'loading' && !A.cfg) return viewLoading();
  if (A.mode === 'empty' || !A.cfg) return viewOnboarding();
  if (A.staff === null) return viewLoading();
  switch (A.view) {
    case 'team': return viewTeam();
    case 'abwesend': return viewAbs();
    case 'bedarf': return viewDemand();
    case 'versand': return viewSend();
    case 'bericht': return viewReport();
    case 'regeln': return viewSettings();
    default: return viewPlan();
  }
}
function viewLogin() {
  const L0 = A.login || {};
  const fld = (id, label, type, ac, val, enter) => '<label class="fld"><span>' + esc(label) + '</span><input id="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (val ? ' value="' + esc(val) + '"' : '') + (enter ? ' data-enter="' + enter + '"' : '') + ' autocapitalize="off" spellcheck="false"></label>';
  const langs = '<div class="langs big" role="group">' + UI_LANGS.map(l => '<button class="lg' + (A.lang === l ? ' on' : '') + '" data-a="lang" data-l="' + l + '">' + esc({ tr: 'Türkçe', de: 'Deutsch', en: 'English' }[l]) + '</button>').join('') + '</div>';
  let h = '<section class="onb"><div class="card narrow login">';
  if (L0.offline) {
    h += '<h1>' + esc(t('login_h')) + '</h1><p class="lead">' + esc(t('login_off')) + '</p>' + langs + '<div class="row gap"><button class="btn primary" data-a="login-retry">' + esc(t('retry')) + '</button></div>';
  } else if (L0.setup === false) {
    h += '<h1>' + esc(t('setup_h')) + '</h1><p class="lead">' + esc(t('setup_p')) + '</p>' + langs + '<form class="lgform" novalidate>' +
      fld('suCode', t('setup_code'), 'text', 'one-time-code', L0.code) + fld('suName', t('your_name'), 'text', 'username', L0.name) +
      fld('suPass', t('f_pass'), 'password', 'new-password') + fld('suPass2', t('f_pass2'), 'password', 'new-password') +
      '<p class="hint">' + esc(t('pass_rule')) + '</p><div class="row gap"><button class="btn primary" data-a="setup-go"' + (L0.busy ? ' disabled' : '') + '>' + esc(t('setup_go')) + '</button></div></form>';
  } else if (L0.setup === true) {
    h += '<h1>' + esc(t('login_h')) + '</h1><p class="lead">' + esc(t('login_p')) + '</p>' + langs + '<form class="lgform" novalidate>' +
      fld('lgName', t('name'), 'text', 'username', L0.name) + fld('lgPass', t('f_pass'), 'password', 'current-password') +
      '<div class="row gap"><button class="btn primary" data-a="login-go"' + (L0.busy ? ' disabled' : '') + '>' + esc(t('login_go')) + '</button></div></form>';
  } else h += '<div class="loader" aria-hidden="true"></div><p>' + esc(t('st_loading')) + '</p>';
  if (L0.err) h += '<p class="err" role="alert">' + esc(L0.err) + '</p>';
  h += '<p class="hint"><button class="linkbtn" data-a="try-local">' + esc(t('try_local')) + '</button></p>';
  return h + '</div></section>';
}
function fmtDT(ms) { return new Intl.DateTimeFormat(LOCALE[A.lang], { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)); }
function loadAccounts() {
  if (A.accLoading) return;
  A.accLoading = true;
  Remote.call('GET', '/accounts').then(r => { A.accounts = r.accounts || []; })
    .catch(e => { A.accounts = A.accounts || []; toast(t('error') + ' (' + (e.code || '?') + ')', 'err'); })
    .finally(() => { A.accLoading = false; render(); });
}
function viewAccess() {
  const au = A.auth; if (!au) return '';
  let h = '<div class="card" id="access"><h2>' + esc(t('acc_h')) + '</h2><p>' + esc(t('acc_me', { n: au.name, r: t('role_' + au.role) })) + '</p>' +
    '<div class="row gap wrap"><button class="btn" data-a="pw-open">' + esc(t('pw_change')) + '</button><button class="btn" data-a="logout">' + esc(t('logout')) + '</button></div>';
  if (au.role === 'admin') {
    if (!A.accounts) { setTimeout(loadAccounts, 0); h += '<p class="hint">' + esc(t('st_loading')) + '</p>'; }
    else {
      h += '<div class="tablewrap"><table class="acc"><thead><tr><th>' + esc(t('name')) + '</th><th>' + esc(t('acc_role')) + '</th><th>' + esc(t('acc_last')) + '</th><th></th></tr></thead><tbody>' +
        A.accounts.map(a => '<tr' + (a.active ? '' : ' class="off"') + '><td><b>' + esc(a.name) + '</b>' + (a.active ? '' : ' <span class="tag">' + esc(t('acc_blocked')) + '</span>') + '</td>' +
          '<td><select data-f="acc-role" data-id="' + a.id + '" aria-label="' + esc(t('acc_role')) + '">' + ['admin', 'edit', 'view'].map(r => '<option value="' + r + '"' + (a.role === r ? ' selected' : '') + '>' + esc(t('role_' + r)) + '</option>').join('') + '</select></td>' +
          '<td>' + esc(a.last ? fmtDT(a.last) : t('acc_never')) + '</td>' +
          '<td class="acts"><button class="btn sm" data-a="acc-pw" data-id="' + a.id + '">' + esc(t('acc_reset')) + '</button><button class="btn sm" data-a="acc-toggle" data-id="' + a.id + '">' + esc(a.active ? t('acc_block') : t('acc_unblock')) + '</button></td></tr>').join('') +
        '</tbody></table></div><div class="row gap"><button class="btn primary" data-a="acc-new">' + esc(t('acc_new')) + '</button></div>' +
        '<ul class="ticks small">' + ['admin', 'edit', 'view'].map(r => '<li><b>' + esc(t('role_' + r)) + ':</b> ' + esc(t('role_' + r + '_d')) + '</li>').join('') + '</ul><p class="hint">' + esc(t('acc_hint')) + '</p>';
    }
  }
  return h + '</div>';
}
function viewLoading() {
  return '<section class="center"><div class="loader" aria-hidden="true"></div><p>' + esc(t('st_loading')) + '</p></section>';
}
function viewOnboarding() {
  if (!A.canWrite) return '<section class="center card narrow"><h1>' + esc(t('no_access_h')) + '</h1><p>' + esc(t('no_access_p')) + '</p></section>';
  return '<section class="onb"><div class="card narrow">' +
    '<h1>' + esc(t('onb_h')) + '</h1><p class="lead">' + esc(t('onb_p')) + '</p>' +
    '<div class="langs big" role="group">' + UI_LANGS.map(l => '<button class="lg' + (A.lang === l ? ' on' : '') + '" data-a="lang" data-l="' + l + '">' + esc({ tr: 'Türkçe', de: 'Deutsch', en: 'English' }[l]) + '</button>').join('') + '</div>' +
    '<label class="fld"><span>' + esc(t('biz_name')) + '</span><input id="onbBiz" value="NIRVANA Mechernich" autocomplete="organization"></label>' +
    '<div class="row gap"><button class="btn primary" data-a="onb-demo">' + ic('people') + esc(t('onb_demo')) + '</button><button class="btn" data-a="onb-empty">' + esc(t('onb_empty')) + '</button></div>' +
    '<ul class="ticks"><li>' + esc(t('onb_f1')) + '</li><li>' + esc(t('onb_f2')) + '</li><li>' + esc(t('onb_f3')) + '</li><li>' + esc(t('onb_f4')) + '</li></ul>' +
    (A.localOffer && Store.db ? '<div class="row gap"><button class="btn" data-a="import-local">' + ic('dl') + '<span>' + esc(t('import_local', { n: Object.keys(A.localOffer.staff || {}).length })) + '</span></button></div>' : '') +
    (A.localEmpty ? '<p class="hint">' + esc(t('onb_local')) + '</p>' : (A.auth ? '<p class="hint">' + esc(t('onb_team')) + '</p>' : '')) +
    '</div></section>';
}

/* ---------------- Wochenplan ---------------- */
function wkLabel(m) {
  const w = +m.wk.split('-W')[1];
  return '<span class="wkn">' + esc(t('kw', { w })) + '</span><small>' + ddmm(m.dates[0]) + '–' + ddmm(m.dates[6]) + m.dates[6].slice(0, 4) + '</small>';
}
function weekNav(m) {
  return '<div class="wknav"><button class="btn icon" data-a="wk-prev" aria-label="' + esc(t('prev_week')) + '">' + ic('chevl') + '</button>' +
    '<button class="btn wklabel" data-a="wk-today" title="' + esc(t('this_week')) + '">' + wkLabel(m) + '</button>' +
    '<button class="btn icon" data-a="wk-next" aria-label="' + esc(t('next_week')) + '">' + ic('chevr') + '</button></div>';
}
function viewPlan() {
  const m = weekModel(A.wk);
  const pub = m.doc && m.doc.pub;
  const errs = m.issues.filter(i => i.sev === 'err').length, warns = m.issues.filter(i => i.sev === 'warn').length;
  const revTot = m.rev.reduce((a, r) => a + r.rev, 0);
  const quote = revTot ? m.costTot / revTot * 100 : 0;
  const target = +A.cfg.target || 32;
  const qCls = !m.costTot ? '' : quote <= target ? 'good' : quote <= target + 4 ? 'warn' : 'bad';
  const cov = m.total ? Math.floor(m.filled / m.total * 100) : 0;
  let h = '<section class="plan">';
  h += '<div class="bar1">' + weekNav(m) +
    '<span class="pill ' + (pub ? 'pub' : 'draft') + '">' + esc(pub ? t('published_at', { d: fmtDay(pub.at.slice(0, 10)) }) : (m.virtual ? t('not_planned') : t('draft'))) + '</span>' +
    '<div class="spacer"></div>' +
    '<button class="btn" data-a="undo"' + (A.undo.length ? '' : ' disabled') + '>' + ic('undo') + '<span>' + esc(t('undo')) + '</span></button>' +
    '<button class="btn" data-a="copy-prev">' + ic('copy') + '<span>' + esc(t('copy_prev')) + '</span></button>' +
    '<button class="btn" data-a="publish">' + ic('send') + '<span>' + esc(pub ? t('unpublish') : t('publish')) + '</span></button>' +
    '<button class="btn primary" data-a="autoplan">' + ic('spark') + '<span>' + esc(t('autoplan')) + '</span></button></div>';
  if (!weekReady(A.wk)) h += '<div class="banner">' + esc(t('wait_load')) + '</div>';
  if (m.diff.plus || m.diff.minus) h += '<div class="banner info">' + ic('info') + '<span>' + esc(t('demand_changed', { p: m.diff.plus, m: m.diff.minus })) + '</span><button class="btn sm" data-a="apply-demand">' + esc(t('apply')) + '</button></div>';
  h += '<div class="kpis">' +
    kpi(t('k_cov'), pct(cov / 100), t('k_cov_sub', { f: m.filled, n: m.total }), m.total - m.filled ? 'warn' : 'good', '', cov) +
    kpi(t('k_open'), String(m.total - m.filled), t('k_open_sub'), m.total - m.filled ? 'warn' : 'good', m.total - m.filled ? 'data-a="open-first"' : '') +
    kpi(t('k_hours'), nf(m.hours, 0) + ' h', t('k_hours_sub', { n: Object.keys(m.empCost).length }), '') +
    kpi(t('k_cost'), eur(m.costTot), revTot ? t('k_cost_sub', { q: nf(quote, 1), t: target }) : t('k_cost_nosub'), qCls) +
    kpi(t('k_rules'), errs ? t('k_err', { n: errs }) : (warns ? t('k_noerr') : t('k_ok')), warns ? t('k_warn', { n: warns }) : t('k_nowarn'), errs ? 'bad' : warns ? 'warn' : 'good', 'data-a="issues"') + '</div>';
  h += '<div class="bar2"><div class="seg" role="group">' +
    [['staff', 'v_staff'], ['shifts', 'v_shifts'], ['day', 'v_day']].map(([v, k]) => '<button class="' + (A.planView === v ? 'on' : '') + '" data-a="pv" data-v="' + v + '" aria-pressed="' + (A.planView === v) + '">' + esc(t(k)) + '</button>').join('') + '</div>' +
    '<div class="chips">' + '<button class="chip-f' + (!A.area ? ' on' : '') + '" data-a="area" data-v="">' + esc(t('all')) + '</button>' +
    (A.cfg.areas || []).map(a => '<button class="chip-f ' + arCls(a.id) + (A.area === a.id ? ' on' : '') + '" data-a="area" data-v="' + esc(a.id) + '"><i></i>' + esc(L(a.name)) + '</button>').join('') + '</div>' +
    '<input type="search" class="q" data-f="q" id="planQ" value="' + esc(A.q) + '" placeholder="' + esc(t('search_name')) + '" aria-label="' + esc(t('search_name')) + '">' +
    '<button class="btn" data-a="export">' + ic('dl') + '<span>' + esc(t('export')) + '</span></button></div>';
  h += '<div class="gridwrap" id="gridwrap">' + (A.planView === 'shifts' ? gridShifts(m) : A.planView === 'day' ? viewDay(m) : gridStaff(m)) + '</div>';
  h += '</section>';
  return h;
}
function kpi(label, val, sub, cls, attr, bar) {
  const tag = attr ? 'button' : 'div';
  return '<' + tag + ' class="kpi ' + (cls || '') + '" ' + (attr || '') + '><span class="kl">' + esc(label) + '</span><span class="kv">' + esc(val) + '</span><span class="ks">' + esc(sub) + '</span>' + (bar != null ? '<span class="kb"><i style="width:' + Math.max(0, Math.min(100, bar)) + '%"></i></span>' : '') + '</' + tag + '>';
}
function dayHead(m, d, i) {
  const hol = C.holidayOf(d, A.cfg.state), sp = C.specialsFor(d, A.cfg), evs = m.events.filter(e => e.d === d);
  const di = m.days[d] || {};
  const dayShifts = m.shifts.filter(s => s.d === d), f = dayShifts.filter(s => s.emp).length;
  const pct = dayShifts.length ? f / dayShifts.length * 100 : 100;
  let b = '';
  if (hol) b += '<span class="tag hol">' + esc(t(hol)) + '</span>';
  for (const s of sp) b += '<span class="tag sp">' + esc(s.k ? t(s.k) : L(s.name)) + '</span>';
  for (const e of evs) b += '<span class="tag ev">' + esc(e.name) + ' (' + nf(e.g, 0) + ')</span>';
  if (di.closed) b += '<span class="tag cl">' + esc(t('closed')) + '</span>';
  const isToday = d === todayISO();
  return '<button class="g-day' + (isToday ? ' today' : '') + '" data-a="day" data-d="' + d + '" title="' + esc(t('day_edit')) + '">' +
    '<span class="dn">' + esc(wdShort(d)) + ' <b>' + ddmm(d) + '</b></span>' +
    '<span class="dg">' + esc(t('guests_n', { n: nf(m.rev[i].guests + m.rev[i].evGuests, 0) })) + '</span>' +
    (b ? '<span class="tags">' + b + '</span>' : '') +
    '<span class="cov' + (pct < 100 ? ' low' : '') + '"><i style="width:' + pct + '%"></i></span><span class="covn">' + f + '/' + dayShifts.length + '</span></button>';
}
function shownStaff(m) {
  const withShift = new Set(m.shifts.filter(s => s.emp && m.dates.includes(s.d)).map(s => s.emp));
  let list = staffArr().filter(e => e.active !== false || withShift.has(e.id));
  if (A.area) list = list.filter(e => empArea(e) === A.area || m.shifts.some(s => s.emp === e.id && (s.a || roleArea(s.r)) === A.area && m.dates.includes(s.d)));
  if (A.q) { const q = A.q.toLocaleLowerCase(LOCALE[A.lang]); list = list.filter(e => String(e.name).toLocaleLowerCase(LOCALE[A.lang]).includes(q)); }
  return sortedStaff(list);
}
function chipShift(sh, m, mode) {
  const iss = m.issueBy[sh.id] || [];
  const bad = iss.some(i => i.sev === 'err'), wrn = iss.some(i => i.sev === 'warn');
  const a = sh.a || roleArea(sh.r);
  const label = mode === 'name' ? esc(shortName(emp(sh.emp))) : esc(roleShort(sh.r));
  return '<button class="sc ' + arCls(a) + (sh.lk ? ' lk' : '') + (bad ? ' bad' : wrn ? ' wrn' : '') + (sh.t && sh.t.startsWith('ev:') ? ' evs' : '') + '" data-a="shift" data-id="' + esc(sh.id) + '" title="' + esc(shiftName(sh) + ' ' + sh.s + '–' + sh.e) + '">' +
    '<b>' + sh.s + '–' + sh.e + '</b><span>' + label + '</span>' + (sh.lk ? ic('lock', 'mini') : '') + (bad ? ic('err', 'mini') : '') + '</button>';
}
function shortName(e) {
  if (!e) return '?';
  const p = String(e.name).trim().split(/\s+/);
  return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : p[0];
}
function absChip(a) { return '<span class="ab k-' + esc(a.k) + '">' + esc(t('abs_' + a.k)) + '</span>'; }
function gridStaff(m) {
  const list = shownStaff(m);
  let h = '<div class="grid g-staff" role="grid"><div class="g-head"><div class="g-corner">' + esc(t('staff_n', { n: list.length })) + '</div>' + m.dates.map((d, i) => dayHead(m, d, i)).join('') + '</div>';
  // offene Schichten
  const open = m.shifts.filter(s => !s.emp && m.dates.includes(s.d) && (!A.area || (s.a || roleArea(s.r)) === A.area));
  if (open.length) {
    h += '<div class="g-row openrow"><div class="g-name"><span class="nm">' + esc(t('open_shifts')) + '</span><span class="ct warn">' + open.length + '</span></div>';
    for (const d of m.dates) {
      const grp = {};
      for (const s of open.filter(x => x.d === d)) { const k = (s.t || s.r) + s.s; (grp[k] = grp[k] || []).push(s); }
      h += '<div class="g-cell">' + Object.values(grp).map(g => '<button class="sc open ' + arCls(g[0].a || roleArea(g[0].r)) + '" data-a="shift" data-id="' + esc(g[0].id) + '"><b>' + g[0].s + '–' + g[0].e + '</b><span>' + esc(roleShort(g[0].r)) + (g.length > 1 ? ' ×' + g.length : '') + '</span></button>').join('') + '</div>';
    }
    h += '</div>';
  }
  let curArea = null;
  for (const e of list) {
    const a = empArea(e);
    if (a !== curArea) {
      curArea = a; const ar = areaById(a);
      const cnt = list.filter(x => empArea(x) === a).length;
      h += '<div class="g-group ' + arCls(a) + '"><span><i></i>' + esc(ar ? L(ar.name) : t('other')) + '</span><small>' + esc(t('staff_n', { n: cnt })) + '</small></div>';
    }
    const st = m.S[e.id] || { wh: 0, target: 0 };
    const pct = st.target ? Math.min(130, st.wh / st.target * 100) : 0;
    const hc = st.target && st.wh > st.target * 1.1 + 1 ? 'over' : st.target && st.wh < st.target * 0.85 - 1 && C.salaried(e.ct) ? 'under' : '';
    h += '<div class="g-row"><button class="g-name" data-a="emp" data-id="' + esc(e.id) + '"><span class="nm">' + esc(e.name) + '</span><span class="ct">' + esc(t('ct_' + e.ct + '_s')) + '</span>' +
      '<span class="hrs ' + hc + '"><b>' + nf(st.wh, 1) + '</b>' + (st.target ? '/' + nf(st.target, 1) : '') + ' h</span>' +
      (st.target ? '<span class="hb ' + hc + '"><i style="width:' + Math.min(100, pct) + '%"></i></span>' : '') + '</button>';
    for (const d of m.dates) {
      const ab = C.absenceOn(m.absBy, e.id, d);
      const av = C.availOn(e, d);
      const school = (e.school || []).includes(C.dow(d));
      const mine = m.shifts.filter(s => s.emp === e.id && s.d === d).sort((x, y) => C.toMin(x.s) - C.toMin(y.s));
      const cls = (!av ? ' na' : '') + (ab && ab.k !== 'wunsch' ? ' abs' : '') + (d === todayISO() ? ' today' : '');
      h += '<div class="g-cell' + cls + '" data-a="cell" data-emp="' + esc(e.id) + '" data-d="' + d + '">' + (ab ? absChip(ab) : '') + (school ? '<span class="ab k-schule">' + esc(t('abs_schule')) + '</span>' : '') + mine.map(s => chipShift(s, m)).join('') + '</div>';
    }
    h += '</div>';
  }
  if (!list.length) h += '<div class="empty">' + esc(staffArr().length ? t('no_match') : t('no_staff')) + (staffArr().length ? '' : ' <button class="btn sm" data-a="tab" data-v="team">' + esc(t('add_staff')) + '</button>') + '</div>';
  return h + '</div>';
}
function rowKeys(m) {
  const keys = {};
  for (const s of m.shifts) {
    if (!m.dates.includes(s.d)) continue;
    const a = s.a || roleArea(s.r);
    if (A.area && a !== A.area) continue;
    const k = s.t ? (s.t.startsWith('ev:') ? 'ev:' + (s.ev || s.t.split(':')[1]) + ':' + s.r : s.t) : 'x:' + s.r;
    if (!keys[k]) keys[k] = { k, a, r: s.r, s: s.s, e: s.e, name: s.t && !s.t.startsWith('ev:') ? shiftName(s) : s.t ? shiftName(s) : L((roleById(s.r) || {}).name) + ' (' + t('extra') + ')' };
  }
  return Object.values(keys).sort((x, y) => areaIndex(x.a) - areaIndex(y.a) || (x.k.startsWith('ev:') - y.k.startsWith('ev:')) || C.toMin(x.s) - C.toMin(y.s));
}
function gridShifts(m) {
  const rows = rowKeys(m);
  const q = A.q ? A.q.toLocaleLowerCase(LOCALE[A.lang]) : '';
  let h = '<div class="grid g-shifts"><div class="g-head"><div class="g-corner">' + esc(t('shift_rows', { n: rows.length })) + '</div>' + m.dates.map((d, i) => dayHead(m, d, i)).join('') + '</div>';
  let cur = null;
  for (const r of rows) {
    if (r.a !== cur) { cur = r.a; const ar = areaById(r.a); h += '<div class="g-group ' + arCls(r.a) + '"><span><i></i>' + esc(ar ? L(ar.name) : t('other')) + '</span></div>'; }
    const inRow = s => (r.k.startsWith('ev:') ? (s.t && s.t.startsWith('ev:') && (s.ev || s.t.split(':')[1]) === r.k.split(':')[1] && s.r === r.r) : r.k.startsWith('x:') ? (!s.t && s.r === r.r) : s.t === r.k);
    h += '<div class="g-row"><div class="g-name static"><span class="nm">' + esc(r.name) + '</span><span class="ct">' + esc(roleShort(r.r)) + '</span><span class="hrs">' + r.s + '–' + r.e + '</span></div>';
    for (const d of m.dates) {
      const list = m.shifts.filter(s => s.d === d && inRow(s)).sort((x, y) => (!!y.emp) - (!!x.emp));
      const f = list.filter(s => s.emp).length;
      h += '<div class="g-cell">' + (list.length ? '<span class="cnt' + (f < list.length ? ' low' : '') + '">' + f + '/' + list.length + '</span>' : '') +
        list.map(s => s.emp ? (q && !String((emp(s.emp) || {}).name || '').toLocaleLowerCase(LOCALE[A.lang]).includes(q) ? '' : chipName(s, m)) : '<button class="sc open ' + arCls(s.a || roleArea(s.r)) + '" data-a="shift" data-id="' + esc(s.id) + '"><span>' + esc(t('open')) + '</span></button>').join('') + '</div>';
    }
    h += '</div>';
  }
  if (!rows.length) h += '<div class="empty">' + esc(t('no_shifts')) + '</div>';
  return h + '</div>';
}
function chipName(sh, m) {
  const iss = m.issueBy[sh.id] || [];
  const bad = iss.some(i => i.sev === 'err'), wrn = iss.some(i => i.sev === 'warn');
  const custom = sh.cust ? ' <small>' + sh.s + '–' + sh.e + '</small>' : '';
  return '<button class="sn ' + arCls(sh.a || roleArea(sh.r)) + (sh.lk ? ' lk' : '') + (bad ? ' bad' : wrn ? ' wrn' : '') + '" data-a="shift" data-id="' + esc(sh.id) + '">' + esc(shortName(emp(sh.emp))) + custom + '</button>';
}
function viewDay(m) {
  const i = Math.max(0, Math.min(6, A.dayIdx)), d = m.dates[i];
  let h = '<div class="dayview"><div class="daypick" role="group">' + m.dates.map((x, j) => '<button class="' + (j === i ? 'on' : '') + (x === todayISO() ? ' today' : '') + '" data-a="dayidx" data-i="' + j + '"><span>' + esc(wdShort(x)) + '</span><b>' + ddmm(x) + '</b></button>').join('') + '</div>';
  const r = m.rev[i];
  h += '<div class="dayinfo">' + dayHead(m, d, i) + '<div class="dstats"><span>' + esc(t('rev_fc')) + ' <b>' + eur(r.rev) + '</b></span><span>' + esc(t('k_cost')) + ' <b>' + eur(m.costDay[i].tot) + '</b></span>' + (r.rev ? '<span>' + esc(t('quote')) + ' <b>' + pct(m.costDay[i].tot / r.rev, 1) + '</b></span>' : '') + '</div></div>';
  h += staffingChart(m, d);
  const list = m.shifts.filter(s => s.d === d && (!A.area || (s.a || roleArea(s.r)) === A.area)).sort((x, y) => areaIndex(x.a || roleArea(x.r)) - areaIndex(y.a || roleArea(y.r)) || C.toMin(x.s) - C.toMin(y.s));
  let cur = null;
  h += '<div class="daylist">';
  for (const s of list) {
    const a = s.a || roleArea(s.r);
    if (a !== cur) { cur = a; const ar = areaById(a); h += '<h3 class="' + arCls(a) + '"><i></i>' + esc(ar ? L(ar.name) : t('other')) + '</h3>'; }
    const e = emp(s.emp);
    if (A.q && (!e || !String(e.name).toLocaleLowerCase(LOCALE[A.lang]).includes(A.q.toLocaleLowerCase(LOCALE[A.lang])))) continue;
    const iss = m.issueBy[s.id] || [];
    h += '<button class="dl-row ' + arCls(a) + (s.emp ? '' : ' open') + (iss.some(x => x.sev === 'err') ? ' bad' : '') + '" data-a="shift" data-id="' + esc(s.id) + '"><span class="tm">' + s.s + '–' + s.e + '</span><span class="sn2">' + esc(shiftName(s)) + '</span><span class="who">' + (e ? esc(e.name) : '<em>' + esc(t('open')) + '</em>') + '</span>' + (s.lk ? ic('lock', 'mini') : '') + '</button>';
  }
  if (!list.length) h += '<div class="empty">' + esc(t('no_shifts')) + '</div>';
  return h + '</div></div>';
}

/* Besetzung je Stunde (gestapelte Balken je Bereich) */
function staffingChart(m, d) {
  const areas = (A.cfg.areas || []).map(a => a.id);
  const hours = []; for (let hh = 6; hh <= 25; hh++) hours.push(hh);
  const base = C.dayNum(d) * 1440;
  const data = hours.map(hh => {
    const tm = base + hh * 60 + 30, by = {};
    for (const s of m.shifts) { if (!s.emp) continue; if (C.absS(s) <= tm && C.absE(s) > tm) { const a = s.a || roleArea(s.r); by[a] = (by[a] || 0) + 1; } }
    return by;
  });
  const max = Math.max(4, ...data.map(by => Object.values(by).reduce((x, y) => x + y, 0)));
  const W = 640, H = 170, pl = 30, pb = 22, bw = (W - pl) / hours.length;
  const sy = v => (H - pb) * v / max;
  let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('chart_staff')) + '">';
  const step = max > 20 ? 10 : 5;
  for (let v = 0; v <= max; v += step) { const y = H - pb - sy(v); svg += '<line class="gl" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>'; }
  hours.forEach((hh, i) => {
    let y = H - pb; const x = pl + i * bw + 3, w = bw - 6;
    const by = data[i]; let tip = (hh % 24) + ':00–' + ((hh + 1) % 24) + ':00';
    areas.forEach(a => {
      const v = by[a] || 0; if (!v) return;
      const hgt = sy(v); y -= hgt;
      svg += '<rect class="' + arCls(a) + ' bar" x="' + x + '" y="' + (y + 1) + '" width="' + w + '" height="' + Math.max(0, hgt - 2) + '" rx="2"/>';
      tip += '\n' + L((areaById(a) || {}).name) + ': ' + v;
    });
    svg += '<rect class="hit" x="' + (pl + i * bw) + '" y="0" width="' + bw + '" height="' + (H - pb) + '" data-tip="' + esc(tip) + '"></rect>';
    if (hh % 2 === 0) svg += '<text class="ax" x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (hh % 24) + '</text>';
  });
  svg += '</svg>';
  const legend = '<div class="legend">' + areas.filter(a => data.some(by => by[a])).map(a => '<span class="' + arCls(a) + '"><i></i>' + esc(L((areaById(a) || {}).name)) + '</span>').join('') + '</div>';
  return '<figure class="chartbox"><figcaption>' + esc(t('chart_staff')) + '</figcaption>' + legend + svg + '</figure>';
}

/* ---------------- Personal ---------------- */
function viewTeam() {
  const m = weekModel(A.wk);
  let list = staffArr();
  if (A.tq) { const q = A.tq.toLocaleLowerCase(LOCALE[A.lang]); list = list.filter(e => String(e.name).toLocaleLowerCase(LOCALE[A.lang]).includes(q) || String(e.phone || '').includes(q)); }
  if (A.area) list = list.filter(e => empArea(e) === A.area);
  if (A.tct) list = list.filter(e => e.ct === A.tct);
  list = sortedStaff(list);
  const y = m.ctx.year;
  let h = '<section class="team"><div class="bar1"><h1>' + esc(t('tab_team')) + ' <small>' + esc(t('staff_n', { n: staffArr().filter(e => e.active !== false).length })) + '</small></h1><div class="spacer"></div>' +
    '<button class="btn" data-a="import">' + ic('copy') + '<span>' + esc(t('import_xl')) + '</span></button>' +
    '<button class="btn primary" data-a="emp-new">' + ic('plus') + '<span>' + esc(t('add_staff')) + '</span></button></div>';
  h += '<div class="bar2"><div class="chips"><button class="chip-f' + (!A.area ? ' on' : '') + '" data-a="area" data-v="">' + esc(t('all')) + '</button>' + (A.cfg.areas || []).map(a => '<button class="chip-f ' + arCls(a.id) + (A.area === a.id ? ' on' : '') + '" data-a="area" data-v="' + esc(a.id) + '"><i></i>' + esc(L(a.name)) + '</button>').join('') + '</div>' +
    '<select data-f="tct" aria-label="' + esc(t('contract')) + '"><option value="">' + esc(t('all_contracts')) + '</option>' + CTS.map(c => '<option value="' + c + '"' + (A.tct === c ? ' selected' : '') + '>' + esc(t('ct_' + c)) + '</option>').join('') + '</select>' +
    '<input type="search" class="q" data-f="tq" id="teamQ" value="' + esc(A.tq) + '" placeholder="' + esc(t('search_name')) + '" aria-label="' + esc(t('search_name')) + '"></div>';
  h += '<div class="tablewrap" id="teamTable">' + teamTable(list, m, y) + '</div></section>';
  return h;
}
function teamTable(list, m, y) {
  let h = '<table class="tbl"><thead><tr><th>' + esc(t('name')) + '</th><th>' + esc(t('roles')) + '</th><th>' + esc(t('contract')) + '</th><th class="r">' + esc(t('target_wk')) + '</th><th class="r">' + esc(t('wage')) + '</th><th class="r">' + esc(t('this_week')) + '</th><th class="r">' + esc(t('minijob_month')) + '</th><th class="r">' + esc(t('sundays')) + '</th><th>' + esc(t('msg_lang')) + '</th><th>' + esc(t('contact')) + '</th></tr></thead><tbody>';
  for (const e of list) {
    const st = m.S[e.id] || { wh: 0, target: 0, mon: {}, sun: 0 };
    const H = m.hist[e.id] || {};
    const mk = C.monthKey(m.dates[3]);
    const mj = e.ct === 'MJ' ? ((H.monE || {})[mk] || 0) + (st.mon[mk] || 0) : null;
    const cap = C.minijobCap(y, A.cfg);
    const sunUsed = (H.sunY || 0) + (st.sun || 0);
    h += '<tr class="' + (e.active === false ? 'inactive' : '') + '" data-a="emp" data-id="' + esc(e.id) + '" tabindex="0">' +
      '<td><b>' + esc(e.name) + '</b>' + (e.active === false ? ' <span class="tag">' + esc(t('inactive')) + '</span>' : '') + (C.ageOn(e.birth, todayISO()) < 18 ? ' <span class="tag yo">' + esc(t('youth')) + '</span>' : '') + '</td>' +
      '<td>' + (e.roles || []).map(r => '<span class="rl ' + arCls(roleArea(r)) + (r === e.primary ? ' main' : '') + '">' + esc(L((roleById(r) || {}).name) || r) + '</span>').join('') + '</td>' +
      '<td>' + esc(t('ct_' + e.ct)) + '</td>' +
      '<td class="r">' + (e.ct === 'MJ' || e.ct === 'AH' ? '–' : nf(e.wh, 1) + ' h') + '</td>' +
      '<td class="r">' + eur(e.wage, 2) + '</td>' +
      '<td class="r">' + nf(st.wh, 1) + (st.target ? ' / ' + nf(st.target, 1) : '') + ' h</td>' +
      '<td class="r">' + (mj != null ? '<span class="' + (mj > cap ? 'neg' : mj > cap * 0.9 ? 'wrn' : '') + '">' + eur(mj) + ' / ' + eur(cap) + '</span>' : '–') + '</td>' +
      '<td class="r">' + sunUsed + ' / ' + m.ctx.sunAllowed + '</td>' +
      '<td>' + esc((C.MSG[e.lang] || C.MSG.de).label) + '</td>' +
      '<td>' + (e.phone ? esc(e.phone) : e.email ? esc(e.email) : '<span class="muted">' + esc(t('no_contact')) + '</span>') + '</td></tr>';
  }
  if (!list.length) h += '<tr><td colspan="10" class="empty">' + esc(staffArr().length ? t('no_match') : t('no_staff')) + '</td></tr>';
  return h + '</tbody></table>';
}

/* ---------------- Abwesenheiten ---------------- */
function viewAbs() {
  const today = todayISO();
  const all = []; for (const y in A.abs) for (const a of A.abs[y] || []) all.push(a);
  const cur = all.filter(a => a.t >= today).sort((a, b) => a.f.localeCompare(b.f));
  const past = all.filter(a => a.t < today && a.t >= C.addDays(today, -60)).sort((a, b) => b.f.localeCompare(a.f));
  const opts = sortedStaff(staffArr().filter(e => e.active !== false)).map(e => '<option value="' + esc(e.id) + '">' + esc(e.name) + '</option>').join('');
  let h = '<section class="absv"><div class="bar1"><h1>' + esc(t('tab_abs')) + '</h1></div>';
  h += '<form class="card absform" data-a="abs-add-form"><div class="frow">' +
    '<label class="fld"><span>' + esc(t('employee')) + '</span><select id="absEmp" required><option value="">' + esc(t('choose')) + '</option>' + opts + '</select></label>' +
    '<label class="fld"><span>' + esc(t('kind')) + '</span><select id="absKind">' + ABS_KINDS.map(k => '<option value="' + k + '">' + esc(t('abs_' + k)) + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>' + esc(t('from')) + '</span><input type="date" id="absFrom" value="' + today + '" required></label>' +
    '<label class="fld"><span>' + esc(t('to')) + '</span><input type="date" id="absTo" value="' + today + '" required></label>' +
    '<label class="fld grow"><span>' + esc(t('note')) + '</span><input id="absNote" maxlength="120"></label>' +
    '<button class="btn primary" data-a="abs-add">' + ic('plus') + '<span>' + esc(t('enter')) + '</span></button></div>' +
    '<p class="hint">' + esc(t('abs_hint')) + '</p></form>';
  if (A.affected && A.affected.list.length) h += affectedBox();
  h += '<h2>' + esc(t('abs_current')) + '</h2>' + absTable(cur) + (past.length ? '<details class="past"><summary>' + esc(t('abs_past', { n: past.length })) + '</summary>' + absTable(past) + '</details>' : '');
  return h + '</section>';
}
function affectedBox() {
  const x = A.affected, e = emp(x.a.emp);
  let h = '<div class="card affected"><h3>' + ic('warn') + esc(t('aff_h', { n: x.list.length, name: e ? e.name : '?' })) + '</h3><ul>';
  for (const it of x.list) { const doc = A.weeks[it.wk], sh = doc && (doc.shifts || []).find(s => s.id === it.id); if (!sh) continue; h += '<li><span>' + esc(fmtDay(sh.d)) + ' ' + sh.s + '–' + sh.e + ' ' + esc(shiftName(sh)) + '</span><button class="btn sm" data-a="aff-open" data-wk="' + esc(it.wk) + '" data-id="' + esc(it.id) + '">' + esc(t('find_repl')) + '</button></li>'; }
  return h + '</ul><div class="row gap"><button class="btn primary" data-a="aff-auto">' + ic('spark') + '<span>' + esc(t('repl_auto')) + '</span></button><button class="btn" data-a="aff-close">' + esc(t('later')) + '</button></div></div>';
}
function absTable(list) {
  if (!list.length) return '<p class="muted">' + esc(t('none')) + '</p>';
  return '<table class="tbl"><thead><tr><th>' + esc(t('employee')) + '</th><th>' + esc(t('kind')) + '</th><th>' + esc(t('from')) + '</th><th>' + esc(t('to')) + '</th><th>' + esc(t('days')) + '</th><th>' + esc(t('note')) + '</th><th></th></tr></thead><tbody>' +
    list.map(a => { const e = emp(a.emp); const n = C.dayNum(a.t) - C.dayNum(a.f) + 1; return '<tr><td>' + esc(e ? e.name : '?') + '</td><td>' + absChip(a) + '</td><td>' + esc(fmtDay(a.f)) + '</td><td>' + esc(fmtDay(a.t)) + '</td><td>' + n + '</td><td>' + esc(a.n || '') + '</td><td class="r"><button class="btn sm ghost" data-a="abs-del" data-id="' + esc(a.id) + '" aria-label="' + esc(t('delete')) + '">' + ic('trash') + '</button></td></tr>'; }).join('') + '</tbody></table>';
}

/* ---------------- Bedarf ---------------- */
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
function dowName(i) { return fmtDay(C.addDays('2026-11-15', i), { weekday: 'short' }).replace('.', ''); } // 15.11.2026 = Sonntag
function viewDemand() {
  const cfg = A.cfg;
  let h = '<section class="demand"><div class="bar1"><h1>' + esc(t('tab_demand')) + '</h1><div class="spacer"></div>' + '<button class="btn primary" data-a="cfg-save-demand">' + ic('check') + '<span>' + esc(t('save')) + '</span></button></div>';
  h += '<p class="lead">' + esc(t('demand_intro')) + '</p>';
  h += '<div class="card"><h2>' + esc(t('guests_rev')) + '</h2><div class="dowrow">' + DOW_ORDER.map(i => '<label class="fld sm"><span>' + esc(dowName(i)) + '</span><input type="number" min="0" step="10" id="g' + i + '" value="' + (+((cfg.guests || [])[i]) || 0) + '"></label>').join('') + '</div>' +
    '<div class="frow"><label class="fld"><span>' + esc(t('spend')) + '</span><input type="number" min="0" step="0.5" id="cfgSpend" value="' + (+cfg.spend || 0) + '"></label>' +
    '<label class="fld"><span>' + esc(t('ev_spend')) + '</span><input type="number" min="0" step="1" id="cfgEvSpend" value="' + (+cfg.evSpend || 40) + '"></label>' +
    '<label class="fld"><span>' + esc(t('target_q')) + '</span><input type="number" min="5" max="80" step="1" id="cfgTarget" value="' + (+cfg.target || 32) + '"></label></div><p class="hint">' + esc(t('guests_hint')) + '</p></div>';
  // Vorlagen
  h += '<div class="card"><div class="row"><h2>' + esc(t('templates')) + '</h2><div class="spacer"></div><button class="btn sm" data-a="tpl-add">' + ic('plus') + '<span>' + esc(t('tpl_add')) + '</span></button></div><p class="hint">' + esc(t('tpl_hint')) + '</p>';
  h += '<div class="tablewrap"><table class="tbl tpl"><thead><tr><th>' + esc(t('name')) + '</th><th>' + esc(t('role')) + '</th><th>' + esc(t('start')) + '</th><th>' + esc(t('end')) + '</th><th>' + esc(t('break_m')) + '</th>' + DOW_ORDER.map(i => '<th class="c">' + esc(dowName(i)) + '</th>').join('') + '<th class="c">' + esc(t('scale')) + '</th><th>' + esc(t('season')) + '</th><th class="c">' + esc(t('active')) + '</th><th></th></tr></thead><tbody>';
  const roleOpts = sel => (cfg.roles || []).map(r => '<option value="' + esc(r.id) + '"' + (r.id === sel ? ' selected' : '') + '>' + esc(L(r.name)) + '</option>').join('');
  const tpls = (cfg.tpl || []).slice().sort((a, b) => areaIndex(roleArea(a.r)) - areaIndex(roleArea(b.r)) || C.toMin(a.s) - C.toMin(b.s));
  for (const tp of tpls) {
    const id = esc(tp.id);
    h += '<tr class="' + arCls(roleArea(tp.r)) + (tp.on === false ? ' inactive' : '') + '" data-tpl="' + id + '"><td><span class="dot"></span><input class="tn" data-k="name" value="' + esc(L(tp.name)) + '" aria-label="' + esc(t('name')) + '"></td><td><select data-k="r">' + roleOpts(tp.r) + '</select></td>' +
      '<td><input type="time" data-k="s" value="' + esc(tp.s) + '"></td><td><input type="time" data-k="e" value="' + esc(tp.e) + '"></td><td><input type="number" min="0" max="120" step="5" data-k="b" value="' + (+tp.b || 0) + '" class="num"></td>' +
      DOW_ORDER.map(i => '<td class="c"><input type="number" min="0" max="60" data-k="dem' + i + '" value="' + (+((tp.dem || [])[i]) || 0) + '" class="num sm"></td>').join('') +
      '<td class="c"><input type="checkbox" data-k="scale"' + (tp.scale !== false ? ' checked' : '') + '></td>' +
      '<td><input data-k="months" class="season" value="' + esc((tp.months || []).length ? monthsToStr(tp.months) : '') + '" placeholder="' + esc(t('all_year')) + '"></td>' +
      '<td class="c"><input type="checkbox" data-k="on"' + (tp.on !== false ? ' checked' : '') + '></td>' +
      '<td><button class="btn sm ghost" data-a="tpl-del" data-id="' + id + '" aria-label="' + esc(t('delete')) + '">' + ic('trash') + '</button></td></tr>';
  }
  h += '</tbody></table></div>';
  const totH = (cfg.tpl || []).filter(x => x.on !== false).reduce((a, x) => a + (x.dem || []).reduce((p, q) => p + (+q || 0), 0) * C.netH({ s: x.s, e: x.e, b: x.b }), 0);
  h += '<p class="hint">' + esc(t('tpl_total', { h: nf(totH, 0) })) + '</p></div>';
  // Feiern
  const today = todayISO();
  const evs = []; for (const y in A.evt) for (const e of A.evt[y] || []) evs.push(e);
  const up = evs.filter(e => e.d >= C.addDays(today, -7)).sort((a, b) => a.d.localeCompare(b.d));
  h += '<div class="card"><div class="row"><h2>' + esc(t('events')) + '</h2><div class="spacer"></div><button class="btn sm" data-a="event-new">' + ic('plus') + '<span>' + esc(t('event_add')) + '</span></button></div><p class="hint">' + esc(t('events_hint')) + '</p>';
  if (up.length) {
    h += '<table class="tbl"><thead><tr><th>' + esc(t('date')) + '</th><th>' + esc(t('name')) + '</th><th>' + esc(t('kind')) + '</th><th>' + esc(t('time')) + '</th><th class="r">' + esc(t('guests')) + '</th><th>' + esc(t('staff_need')) + '</th></tr></thead><tbody>';
    for (const ev of up) h += '<tr data-a="event-edit" data-id="' + esc(ev.id) + '" tabindex="0"><td>' + esc(fmtDay(ev.d)) + '</td><td><b>' + esc(ev.name) + '</b></td><td>' + esc(t('ev_' + ev.k)) + '</td><td>' + esc(ev.s + '–' + ev.e) + '</td><td class="r">' + nf(ev.g, 0) + '</td><td>' + esc(needText(ev)) + '</td></tr>';
    h += '</tbody></table>';
  } else h += '<p class="muted">' + esc(t('none')) + '</p>';
  h += '</div>';
  // Besondere Tage
  const y = +today.slice(0, 4);
  const bis = C.builtinSpecials(y).concat(C.builtinSpecials(y + 1)).filter(s => s.to >= today).sort((a, b) => a.from.localeCompare(b.from));
  const off = new Set(cfg.specOff || []);
  h += '<div class="card"><div class="row"><h2>' + esc(t('specials')) + '</h2><div class="spacer"></div><button class="btn sm" data-a="special-add">' + ic('plus') + '<span>' + esc(t('special_add')) + '</span></button></div><p class="hint">' + esc(t('specials_hint')) + '</p><table class="tbl"><thead><tr><th class="c">' + esc(t('active')) + '</th><th>' + esc(t('name')) + '</th><th>' + esc(t('from')) + '</th><th>' + esc(t('to')) + '</th><th class="r">' + esc(t('f_day')) + '</th><th class="r">' + esc(t('f_eve')) + '</th><th></th></tr></thead><tbody>';
  const fy = d => fmtDay(d, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  for (const s of bis) h += '<tr><td class="c"><input type="checkbox" data-a="special-toggle" data-id="' + esc(s.id) + '"' + (off.has(s.id) ? '' : ' checked') + ' aria-label="' + esc(t('active')) + '"></td><td>' + esc(t(s.k)) + '</td><td>' + esc(fy(s.from)) + '</td><td>' + esc(fy(s.to)) + '</td><td class="r">×' + nf(s.fDay, 2) + '</td><td class="r">×' + nf(s.fEve, 2) + '</td><td></td></tr>';
  for (const s of cfg.specials || []) h += '<tr><td class="c">' + ic('check') + '</td><td>' + esc(L(s.name)) + '</td><td>' + esc(fy(s.from)) + '</td><td>' + esc(fy(s.to)) + '</td><td class="r">×' + nf(s.fDay, 2) + '</td><td class="r">×' + nf(s.fEve, 2) + '</td><td class="r"><button class="btn sm ghost" data-a="special-del" data-id="' + esc(s.id) + '" aria-label="' + esc(t('delete')) + '">' + ic('trash') + '</button></td></tr>';
  h += '</tbody></table></div>';
  return h + '</section>';
}
function monthsToStr(ms) { const s = ms.slice().sort((a, b) => a - b); if (s.length > 1 && s[s.length - 1] - s[0] === s.length - 1) return s[0] + '–' + s[s.length - 1]; return s.join(','); }
function strToMonths(v) {
  v = String(v || '').trim(); if (!v) return null;
  const out = new Set();
  for (const part of v.split(/[,;\s]+/)) { const m = part.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/); if (m) { let a = +m[1], b = +m[2]; for (let x = a; ; x = x % 12 + 1) { out.add(x); if (x === b || out.size > 12) break; } } else if (+part >= 1 && +part <= 12) out.add(+part); }
  return out.size ? [...out].sort((a, b) => a - b) : null;
}
function needText(ev) {
  const sl = C.eventSlots(ev, A.cfg);
  return sl.map(s => s.n + '× ' + L((roleById(s.r) || {}).name)).join(', ');
}

/* ---------------- Versand ---------------- */
function viewSend() {
  const m = weekModel(A.wk);
  const sent = A.sent[A.wk] || { m: {}, dm: {} };
  const tomorrow = C.addDays(todayISO(), 1);
  const sd = A.sendDay || (m.dates.includes(tomorrow) ? tomorrow : m.dates[0]);
  const mode = A.sendMode;
  const rows = sendRows(m, mode, sd);
  const nSent = rows.filter(r => r.sent).length, nChanged = rows.filter(r => r.changed).length, nNo = rows.filter(r => !r.reach).length;
  let h = '<section class="send"><div class="bar1">' + weekNav(m) + '<div class="seg" role="group">' +
    [['week', 'sm_week'], ['day', 'sm_day'], ['changes', 'sm_changes']].map(([v, k]) => '<button class="' + (mode === v ? 'on' : '') + '" data-a="send-mode" data-v="' + v + '">' + esc(t(k)) + '</button>').join('') + '</div>' +
    (mode === 'day' ? '<select data-f="sendDay" aria-label="' + esc(t('date')) + '">' + m.dates.map(d => '<option value="' + d + '"' + (d === sd ? ' selected' : '') + '>' + esc(fmtDay(d, { weekday: 'long', day: '2-digit', month: '2-digit' })) + '</option>').join('') + '</select>' : '') + '</div>';
  if (!(m.doc && m.doc.pub)) h += '<div class="banner info">' + ic('info') + '<span>' + esc(t('send_unpub')) + '</span><button class="btn sm" data-a="publish">' + esc(t('publish')) + '</button></div>';
  h += '<div class="kpis small">' + kpi(t('recipients'), String(rows.length), t('recipients_sub'), '') + kpi(t('sent_k'), String(nSent), t('of_n', { n: rows.length }), nSent === rows.length && rows.length ? 'good' : '') +
    (mode !== 'day' ? kpi(t('changed_k'), String(nChanged), t('changed_sub'), nChanged ? 'warn' : '') : '') + kpi(t('no_contact_k'), String(nNo), t('no_contact_sub'), nNo ? 'warn' : '') + '</div>';
  const waRows = rows.filter(r => r.reach && r.ch !== 'mail' && !r.sent);
  const mailRows = rows.filter(r => r.ch === 'mail' && r.e.email && !r.sent);
  h += '<div class="row gap wrap actions">' +
    '<button class="btn primary" data-a="queue"' + (waRows.length ? '' : ' disabled') + '>' + ic('chat') + '<span>' + esc(t('queue_btn', { n: waRows.length })) + '</span></button>' +
    (A.gmail ? '<button class="btn" data-a="mail-all"' + (mailRows.length ? '' : ' disabled') + '>' + ic('mail') + '<span>' + esc(t('mail_all', { n: mailRows.length })) + '</span></button>' : '') +
    '<button class="btn" data-a="team-text">' + ic('copy') + '<span>' + esc(t('team_text')) + '</span></button></div>';
  h += '<div class="tablewrap"><table class="tbl sendtbl"><thead><tr><th>' + esc(t('employee')) + '</th><th>' + esc(t('msg_lang')) + '</th><th>' + esc(t('channel')) + '</th><th>' + esc(t('contact')) + '</th><th>' + esc(t('status')) + '</th><th class="r">' + esc(t('actions')) + '</th></tr></thead><tbody>';
  for (const r of rows) {
    const e = r.e;
    const status = r.changed ? '<span class="pill warn">' + esc(t('changed_after')) + '</span>' : r.sent ? '<span class="pill good">' + esc(t('sent_at', { d: fmtDay(r.sentAt.slice(0, 10)) })) + '</span>' : '<span class="pill">' + esc(t('not_sent')) + '</span>';
    const contact = r.ch === 'mail' ? '<input class="inl" type="email" data-f="emp-email" data-id="' + esc(e.id) + '" value="' + esc(e.email || '') + '" placeholder="name@mail.de" aria-label="' + esc(t('email')) + '">' : '<input class="inl" type="tel" data-f="emp-phone" data-id="' + esc(e.id) + '" value="' + esc(e.phone || '') + '" placeholder="0151 …" aria-label="' + esc(t('phone')) + '">';
    const wa = r.phone ? '<a class="btn sm wa" href="https://wa.me/' + r.phone + '?text=' + encodeURIComponent(r.text) + '" target="_blank" rel="noopener" data-a="sent-link" data-id="' + esc(e.id) + '" data-ch="wa">' + ic('chat') + '<span>WhatsApp</span></a>' : '';
    const sms = r.phone ? '<a class="btn sm ghost" href="sms:+' + r.phone + '?&body=' + encodeURIComponent(r.text) + '" data-a="sent-link" data-id="' + esc(e.id) + '" data-ch="sms" title="SMS">' + ic('sms') + '</a>' : '';
    const mail = r.ch === 'mail' && e.email && A.gmail ? '<button class="btn sm" data-a="mail-one" data-id="' + esc(e.id) + '">' + ic('mail') + '<span>' + esc(t('send')) + '</span></button>' : '';
    h += '<tr><td><b>' + esc(e.name) + '</b><details class="pv"><summary>' + esc(t('preview')) + '</summary><pre dir="auto">' + esc(r.text) + '</pre></details></td>' +
      '<td><select class="inl" data-f="emp-lang" data-id="' + esc(e.id) + '" aria-label="' + esc(t('msg_lang')) + '">' + MSG_LANGS.map(l => '<option value="' + l + '"' + (e.lang === l ? ' selected' : '') + '>' + esc(C.MSG[l].label) + '</option>').join('') + '</select></td>' +
      '<td><select class="inl" data-f="emp-ch" data-id="' + esc(e.id) + '" aria-label="' + esc(t('channel')) + '">' + ['wa', 'sms', 'mail', 'none'].map(c => '<option value="' + c + '"' + ((e.ch || 'wa') === c ? ' selected' : '') + '>' + esc(t('ch_' + c)) + '</option>').join('') + '</select></td>' +
      '<td>' + contact + '</td><td>' + status + '</td><td class="r nowrap">' + wa + sms + mail +
      '<button class="btn sm ghost" data-a="copy-msg" data-id="' + esc(e.id) + '" title="' + esc(t('copy')) + '" aria-label="' + esc(t('copy')) + '">' + ic('copy') + '</button>' +
      '<button class="btn sm ghost" data-a="toggle-sent" data-id="' + esc(e.id) + '" title="' + esc(r.sent ? t('mark_unsent') : t('mark_sent')) + '" aria-label="' + esc(r.sent ? t('mark_unsent') : t('mark_sent')) + '">' + ic(r.sent ? 'x' : 'check') + '</button></td></tr>';
  }
  if (!rows.length) h += '<tr><td colspan="6" class="empty">' + esc(mode === 'changes' ? t('no_changes') : t('no_recipients')) + '</td></tr>';
  h += '</tbody></table></div>';
  // Automatik
  const n = A.cfg.notify || {};
  h += '<div class="card auto"><h2>' + esc(t('auto_h')) + '</h2><p>' + esc(t('auto_p')) + '</p><div class="frow">' +
    '<label class="fld"><span>' + esc(t('auto_week')) + '</span><select id="nWeekDay">' + [0, 1, 2, 3, 4, 5, 6].map(i => '<option value="' + i + '"' + (+n.weekDay === i ? ' selected' : '') + '>' + esc(fmtDay(C.addDays('2026-11-15', i), { weekday: 'long' })) + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>' + esc(t('time')) + '</span><input type="time" id="nWeekTime" value="' + esc(n.weekTime || '18:00') + '"></label>' +
    '<label class="fld chk"><input type="checkbox" id="nDaily"' + (n.daily ? ' checked' : '') + '><span>' + esc(t('auto_daily')) + '</span></label>' +
    '<label class="fld"><span>' + esc(t('time')) + '</span><input type="time" id="nDailyTime" value="' + esc(n.dailyTime || '10:00') + '"></label></div>' +
    '<details><summary>' + esc(t('footer_h')) + '</summary><div class="footgrid">' + MSG_LANGS.map(l => '<label class="fld"><span>' + esc(C.MSG[l].label) + '</span><input id="foot_' + l + '" dir="auto" value="' + esc((n.footer || {})[l] || '') + '" maxlength="200"></label>').join('') + '</div></details>' +
    '<div class="row gap"><button class="btn" data-a="notify-save">' + ic('check') + '<span>' + esc(t('save')) + '</span></button></div>' +
    '<ul class="ticks"><li>' + esc(t('auto_o1')) + '</li><li>' + esc(t('auto_o2')) + '</li><li>' + esc(t('auto_o3')) + '</li></ul></div>';
  return h + '</section>';
}
function sendRows(m, mode, d) {
  const sent = A.sent[m.wk] || {};
  const out = [];
  for (const e of sortedStaff(staffArr())) {
    const has = m.shifts.some(s => s.emp === e.id && (mode === 'day' ? s.d === d : m.dates.includes(s.d)));
    const prev = (sent.m || {})[e.id];
    if (mode === 'day' && !has) continue;
    if (mode !== 'day' && !has && !prev) continue;
    if ((e.ch || 'wa') === 'none') continue;
    const hash = C.msgHash(e, m.shifts, m.dates);
    const changed = !!prev && prev.h !== hash;
    if (mode === 'changes' && !changed) continue;
    const text = mode === 'day' ? C.dayMessage(e, m.shifts, d, A.cfg) : C.weekMessage(e, m.shifts, m.wk, A.cfg, { update: mode === 'changes' || changed });
    const phone = C.normPhone(e.phone);
    const ch = e.ch || 'wa';
    const sentAt = mode === 'day' ? (((sent.dm || {})[d] || {})[e.id] || '') : (prev ? prev.at : '');
    const upToDate = mode === 'day' ? !!sentAt : mode === 'changes' ? false : (!!prev && !changed);
    out.push({ e, text, phone, ch, reach: ch === 'mail' ? !!e.email : !!phone, sent: upToDate, changed: mode !== 'day' && changed, sentAt });
  }
  return out;
}
function teamText(m) {
  const cfg = A.cfg, lines = [cfg.biz + ' – ' + t('kw', { w: +m.wk.split('-W')[1] }) + ' (' + ddmm(m.dates[0]) + '–' + ddmm(m.dates[6]) + ')'];
  for (const d of m.dates) {
    const day = m.shifts.filter(s => s.d === d && s.emp).sort((a, b) => areaIndex(a.a || roleArea(a.r)) - areaIndex(b.a || roleArea(b.r)) || C.toMin(a.s) - C.toMin(b.s));
    if (!day.length) continue;
    lines.push('', fmtDay(d, { weekday: 'long', day: '2-digit', month: '2-digit' }));
    let cur = null;
    for (const s of day) { const a = s.a || roleArea(s.r); if (a !== cur) { cur = a; lines.push('  ' + L((areaById(a) || {}).name)); } lines.push('    ' + s.s + '–' + s.e + '  ' + shortName(emp(s.emp))); }
  }
  return lines.join('\n');
}

/* ---------------- Auswertung ---------------- */
function viewReport() {
  const m = weekModel(A.wk);
  const revTot = m.rev.reduce((a, r) => a + r.rev, 0);
  const over = staffArr().reduce((a, e) => { const st = m.S[e.id]; return a + (st && st.target && e.ct !== 'MJ' && st.wh > st.target ? st.wh - st.target : 0); }, 0);
  let h = '<section class="report"><div class="bar1">' + weekNav(m) + '<div class="spacer"></div><button class="btn" data-a="csv">' + ic('dl') + '<span>' + esc(t('csv_btn')) + '</span></button></div>';
  h += '<div class="kpis">' + kpi(t('k_hours'), nf(m.hours, 0) + ' h', t('k_hours_sub', { n: Object.keys(m.empCost).length }), '') + kpi(t('k_cost'), eur(m.costTot), t('incl_sur', { s: eur(m.surTot) }), '') +
    kpi(t('rev_fc'), eur(revTot), t('rev_sub'), '') + kpi(t('quote'), revTot ? pct(m.costTot / revTot, 1) : '–', t('target_is', { t: A.cfg.target || 32 }), revTot && m.costTot / revTot * 100 > (A.cfg.target || 32) + 4 ? 'bad' : revTot && m.costTot / revTot * 100 > (A.cfg.target || 32) ? 'warn' : 'good') +
    kpi(t('overtime'), nf(over, 1) + ' h', t('overtime_sub'), over > 20 ? 'warn' : '') + '</div>';
  h += costChart(m);
  // Tabelle je Mitarbeiter
  h += '<div class="tablewrap"><table class="tbl rep"><thead><tr><th>' + esc(t('employee')) + '</th><th>' + esc(t('contract')) + '</th><th class="r">' + esc(t('target')) + '</th><th class="r">' + esc(t('planned')) + '</th><th class="r">' + esc(t('diff')) + '</th><th class="r">' + esc(t('night_h')) + '</th><th class="r">' + esc(t('sun_h')) + '</th><th class="r">' + esc(t('hol_h')) + '</th><th class="r">' + esc(t('cost')) + '</th><th class="r">' + esc(t('we4')) + '</th><th class="r">' + esc(t('sundays')) + '</th></tr></thead><tbody>';
  for (const e of sortedStaff(staffArr().filter(x => x.active !== false || m.empCost[x.id]))) {
    const st = m.S[e.id] || { wh: 0, target: 0 }, c = m.empCost[e.id] || { c: 0, night: 0, sun: 0, hol: 0 }, H = m.hist[e.id] || {};
    const diff = st.wh - st.target;
    h += '<tr data-a="emp" data-id="' + esc(e.id) + '" tabindex="0"><td>' + esc(e.name) + '</td><td>' + esc(t('ct_' + e.ct + '_s')) + '</td><td class="r">' + (st.target ? nf(st.target, 1) : '–') + '</td><td class="r">' + nf(st.wh, 1) + '</td><td class="r ' + (st.target && diff > 1 && C.salaried(e.ct) ? 'wrn' : st.target && diff < -4 && C.salaried(e.ct) ? 'neg' : '') + '">' + (st.target ? (diff > 0 ? '+' : '') + nf(diff, 1) : '–') + '</td><td class="r">' + nf(c.night, 1) + '</td><td class="r">' + nf(c.sun, 1) + '</td><td class="r">' + nf(c.hol, 1) + '</td><td class="r">' + eur(c.c) + '</td><td class="r">' + ((H.we4 || 0) + (st.we || 0)) + '</td><td class="r">' + ((H.sunY || 0) + (st.sun || 0)) + ' / ' + m.ctx.sunAllowed + '</td></tr>';
  }
  h += '</tbody></table></div><p class="hint">' + esc(t('report_hint')) + '</p></section>';
  return h;
}
function costChart(m) {
  const areas = (A.cfg.areas || []).map(a => a.id);
  const W = 640, H = 200, pl = 56, pb = 28, n = 7, bw = (W - pl) / n;
  const max = Math.max(1000, ...m.costDay.map(c => c.tot)) * 1.1;
  const sy = v => (H - pb) * v / max;
  let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('chart_cost')) + '">';
  const step = Math.pow(10, Math.floor(Math.log10(max / 4))) * (max / 4 / Math.pow(10, Math.floor(Math.log10(max / 4))) > 5 ? 5 : max / 4 / Math.pow(10, Math.floor(Math.log10(max / 4))) > 2 ? 2 : 1);
  for (let v = 0; v <= max; v += step) { const y = H - pb - sy(v); svg += '<line class="gl" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(eur(v)) + '</text>'; }
  m.dates.forEach((d, i) => {
    let y = H - pb; const x = pl + i * bw + bw * 0.2, w = bw * 0.6;
    const c = m.costDay[i]; let tip = fmtDay(d) + ': ' + eur(c.tot) + (m.rev[i].rev ? ' (' + pct(c.tot / m.rev[i].rev, 1) + ')' : '');
    areas.forEach(a => { const v = c.by[a] || 0; if (!v) return; const hh = sy(v); y -= hh; svg += '<rect class="' + arCls(a) + ' bar" x="' + x + '" y="' + (y + 1) + '" width="' + w + '" height="' + Math.max(0, hh - 2) + '" rx="2"/>'; tip += '\n' + L((areaById(a) || {}).name) + ': ' + eur(v); });
    svg += '<text class="vl" x="' + (x + w / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + esc(eur(c.tot)) + '</text>';
    svg += '<rect class="hit" x="' + (pl + i * bw) + '" y="0" width="' + bw + '" height="' + (H - pb) + '" data-tip="' + esc(tip) + '"></rect>';
    svg += '<text class="ax" x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(wdShort(d) + ' ' + ddmm(d)) + '</text>';
  });
  svg += '</svg>';
  const legend = '<div class="legend">' + areas.map(a => '<span class="' + arCls(a) + '"><i></i>' + esc(L((areaById(a) || {}).name)) + '</span>').join('') + '</div>';
  const qrow = '<div class="qrow">' + m.dates.map((d, i) => '<span><small>' + esc(wdShort(d)) + '</small>' + (m.rev[i].rev ? pct(m.costDay[i].tot / m.rev[i].rev) : '–') + '</span>').join('') + '</div>';
  return '<figure class="chartbox"><figcaption>' + esc(t('chart_cost')) + '</figcaption>' + legend + svg + '<p class="hint">' + esc(t('quote_per_day')) + '</p>' + qrow + '</figure>';
}

/* ---------------- Einstellungen ---------------- */
function viewSettings() {
  const c = A.cfg, R = c.rules || {}, S = c.sur || {}, F = c.fac || {}, E = c.evr || {};
  const y = +todayISO().slice(0, 4);
  const num = (id, v, step, min, max) => '<input type="number" id="' + id + '" value="' + esc(v) + '" step="' + (step || 1) + '"' + (min != null ? ' min="' + min + '"' : '') + (max != null ? ' max="' + max + '"' : '') + '>';
  const chk = (id, on) => '<input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '>';
  let h = '<section class="settings"><div class="bar1"><h1>' + esc(t('tab_settings')) + '</h1><div class="spacer"></div><button class="btn primary" data-a="cfg-save">' + ic('check') + '<span>' + esc(t('save')) + '</span></button></div>';
  h += viewAccess();
  h += '<div class="card"><h2>' + esc(t('business')) + '</h2><div class="frow"><label class="fld grow"><span>' + esc(t('biz_name')) + '</span><input id="sBiz" value="' + esc(c.biz) + '"></label>' +
    '<label class="fld"><span>' + esc(t('state')) + '</span><select id="sState">' + C.STATES.map(s => '<option value="' + s + '"' + (c.state === s ? ' selected' : '') + '>' + esc(t('st_' + s)) + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>' + esc(t('default_lang')) + '</span><select id="sLang">' + UI_LANGS.map(l => '<option value="' + l + '"' + (c.lang === l ? ' selected' : '') + '>' + esc({ tr: 'Türkçe', de: 'Deutsch', en: 'English' }[l]) + '</option>').join('') + '</select></label></div></div>';
  h += '<div class="card"><h2>' + esc(t('rules_h')) + '</h2><p class="hint">' + esc(t('rules_hint')) + '</p><div class="rules">' +
    rule(t('r_rest_l'), num('rRest', R.rest || 11, 0.5, 9, 14) + ' h', t('r_rest_d')) +
    rule(t('r_rest10_l'), chk('rRest10', R.rest10), t('r_rest10_d')) +
    rule(t('r_maxday_l'), num('rMaxDay', R.maxDay || 10, 0.5, 6, 12) + ' h', t('r_maxday_d')) +
    rule(t('r_maxweek_l'), num('rMaxWeek', R.maxWeek || 48, 1, 20, 60) + ' h', t('r_maxweek_d')) +
    rule(t('r_run_l'), num('rRun', R.maxRun || 6, 1, 3, 12), t('r_run_d')) +
    rule(t('r_sun_l'), chk('rSun', R.sun15 !== false) + ' ' + num('rMinFree', R.minFreeSun != null ? R.minFreeSun : 15, 1, 0, 52), t('r_sun_d')) +
    rule(t('r_holsun_l'), chk('rHolSun', R.holAsSun !== false), t('r_holsun_d')) +
    rule(t('r_youth_l'), '<input type="time" id="rYouth" value="' + esc(R.youthUntil || '22:00') + '">', t('r_youth_d')) +
    '</div></div>';
  h += '<div class="card"><h2>' + esc(t('law_h', { y })) + '</h2><div class="frow">' +
    '<label class="fld"><span>' + esc(t('minwage')) + '</span><input type="number" step="0.01" id="lMinWage" placeholder="' + esc(nf(C.minWage(y, null), 2)) + '" value="' + esc((c.law && c.law.minWage) || '') + '"></label>' +
    '<label class="fld"><span>' + esc(t('minijob_cap')) + '</span><input type="number" step="1" id="lMinijob" placeholder="' + esc(C.minijobCap(y, null)) + '" value="' + esc((c.law && c.law.minijob) || '') + '"></label></div><p class="hint">' + esc(t('law_hint', { w1: nf(C.MINWAGE[2026], 2), w2: nf(C.MINWAGE[2027], 2), m1: C.MINIJOB[2026], m2: C.MINIJOB[2027] })) + '</p></div>';
  h += '<div class="card"><h2>' + esc(t('sur_h')) + '</h2><div class="frow">' +
    '<label class="fld chk">' + chk('sOn', S.on) + '<span>' + esc(t('sur_on')) + '</span></label>' +
    '<label class="fld"><span>' + esc(t('night_from')) + '</span><input type="time" id="sNightFrom" value="' + esc(S.nightFrom || '22:00') + '"></label>' +
    '<label class="fld sm"><span>' + esc(t('sur_night')) + ' %</span>' + num('sNight', S.night || 0, 1, 0, 100) + '</label>' +
    '<label class="fld sm"><span>' + esc(t('sur_sun')) + ' %</span>' + num('sSun', S.sun || 0, 1, 0, 200) + '</label>' +
    '<label class="fld sm"><span>' + esc(t('sur_hol')) + ' %</span>' + num('sHol', S.hol || 0, 1, 0, 300) + '</label>' +
    '<label class="fld sm"><span>' + esc(t('sur_x150')) + ' %</span>' + num('sX150', S.x150 || 0, 1, 0, 300) + '</label></div>' +
    '<div class="row gap"><button class="btn sm" data-a="sur-3b">' + esc(t('sur_3b')) + '</button></div><p class="hint">' + esc(t('sur_hint')) + '</p></div>';
  h += '<div class="card"><h2>' + esc(t('fac_h')) + '</h2><div class="frow">' + CTS.map(ct => '<label class="fld sm"><span>' + esc(t('ct_' + ct)) + '</span>' + num('f' + ct, F[ct] || 1.21, 0.01, 1, 2) + '</label>').join('') + '</div><p class="hint">' + esc(t('fac_hint')) + '</p></div>';
  h += '<div class="card"><h2>' + esc(t('evr_h')) + '</h2><div class="frow">' +
    [['svc', 'evr_svc'], ['kit', 'evr_kit'], ['dish', 'evr_dish'], ['bar', 'evr_bar'], ['leadFrom', 'evr_lead'], ['catKit', 'evr_catkit'], ['catDrv', 'evr_catdrv'], ['catSvc', 'evr_catsvc']].map(([k, l]) => '<label class="fld sm"><span>' + esc(t(l)) + '</span>' + num('e_' + k, E[k] || '', 1, 1, 500) + '</label>').join('') + '</div><p class="hint">' + esc(t('evr_hint')) + '</p></div>';
  h += '<div class="card"><h2>' + esc(t('data_h')) + '</h2><p class="hint">' + esc(t(A.mode === 'local' ? 'data_local' : 'data_db')) + '</p><div class="row gap wrap">' +
    (A.caps.downloads ? '<button class="btn" data-a="backup-dl">' + ic('dl') + '<span>' + esc(t('backup_dl')) + '</span></button>' : '') +
    '<button class="btn" data-a="backup-copy">' + ic('copy') + '<span>' + esc(t('backup_copy')) + '</span></button>' +
    '<label class="btn file">' + ic('dl') + '<span>' + esc(t('backup_load')) + '</span><input type="file" accept=".json,application/json" id="backupFile" data-f="backup-file"></label>' +
    (c.demo ? '<button class="btn" data-a="demo-end">' + esc(t('demo_end')) + '</button>' : '') +
    '<button class="btn danger" data-a="wipe-all">' + ic('trash') + '<span>' + esc(t('wipe_all')) + '</span></button></div>' + (A.busyWipe ? '<p class="hint">' + esc(t('wiping')) + '</p>' : '') + '</div>';
  h += '<p class="hint legal">' + esc(t('legal')) + '</p>';
  return h + '</section>';
}
function rule(label, ctrl, desc) { return '<div class="rule"><div class="rl2"><b>' + esc(label) + '</b><p>' + esc(desc) + '</p></div><div class="rc">' + ctrl + '</div></div>'; }

/* ==========================================================================
   App: Seitenleisten, Dialoge, Assistent, Export, Ereignisse
   ========================================================================== */
const STRATS = ['balanced', 'cost', 'fair', 'wish'];

function reasonText(r) {
  if (!r) return '';
  if (r.startsWith('r_abs_')) return t('r_abs', { k: t('abs_' + r.slice(6)) });
  return t(r);
}
function whyChips(why) {
  return (why || []).slice(0, 4).map(([k, v]) => '<span class="why ' + (k === 'w_over' || k === 'w_wish_off' || k === 'w_rest10' || k === 'w_second' ? 'neg' : 'pos') + '">' + esc(t(k, { h: v })) + '</span>').join('');
}
function issueText(is) {
  const e = emp(is.emp), name = e ? e.name : '';
  const d = is.d ? fmtDay(is.d) : '';
  if (is.code === 'c_open') {
    const tp = is.t && !String(is.t).startsWith('ev:') ? tplById(is.t) : null;
    return t('c_open', { n: is.n, d, shift: tp ? L(tp.name) : L((roleById(is.r) || {}).name), s: is.s, e: is.e });
  }
  if (is.code === 'c_minwage_next') return t('c_minwage_next', { n: is.n, v: eur(is.v, 2), y: is.y });
  return t(is.code, { name, d, v: typeof is.v === 'number' ? nf(is.v, 1) : is.v, m: is.m, k: is.k ? t('abs_' + is.k) : '', n: is.n, mk: is.mk || '' });
}
function drawerShell(title, sub, body) {
  return '<div class="dr-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div><button class="btn icon ghost" data-a="close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div><div class="dr-body">' + body + '</div>';
}
function viewDrawer() {
  const d = A.drawer;
  try {
    switch (d.type) {
      case 'shift': return drawerShift(d);
      case 'cell': return drawerCell(d);
      case 'emp': return drawerEmp(d);
      case 'day': return drawerDay(d);
      case 'issues': return drawerIssues(d);
      case 'event': return drawerEvent(d);
    }
  } catch (err) { console.error(err); return drawerShell(t('error'), '', '<p>' + esc(String(err && err.message || err)) + '</p>'); }
  return '';
}

/* ---- Schicht ---- */
function drawerShift(d) {
  const m = weekModel(d.wk), sh = m.shifts.find(s => s.id === d.id);
  if (!sh) return drawerShell(t('shift'), '', '<p>' + esc(t('gone')) + '</p>');
  const e = emp(sh.emp);
  const cand = C.candidates(m.input, sh.id);
  const iss = m.issueBy[sh.id] || [];
  let b = '';
  if (e) {
    const st = m.S[e.id] || { wh: 0, target: 0 };
    b += '<div class="assigned ' + arCls(sh.a || roleArea(sh.r)) + '"><div><b>' + esc(e.name) + '</b><small>' + esc(t('ct_' + e.ct)) + ' · ' + nf(st.wh, 1) + (st.target ? ' / ' + nf(st.target, 1) : '') + ' h</small></div>' +
      '<div class="row gap"><button class="btn sm" data-a="lock" data-id="' + esc(sh.id) + '">' + ic('lock') + '<span>' + esc(sh.lk ? t('unlock') : t('lock')) + '</span></button><button class="btn sm" data-a="unassign" data-id="' + esc(sh.id) + '">' + ic('x') + '<span>' + esc(t('remove')) + '</span></button></div></div>';
  } else b += '<div class="assigned open"><b>' + esc(t('open_shift')) + '</b><small>' + esc(t('pick_below')) + '</small></div>';
  if (iss.length) b += '<ul class="issues">' + iss.map(i => '<li class="' + i.sev + '">' + ic(i.sev === 'err' ? 'err' : i.sev === 'warn' ? 'warn' : 'info') + '<span>' + esc(issueText(i)) + '</span></li>').join('') + '</ul>';
  b += '<h3>' + esc(e ? t('swap_with') : t('suggestions')) + '</h3>';
  if (cand.ok.length) {
    b += '<ul class="cands">' + cand.ok.slice(0, 8).map((c, i) => { const ce = emp(c.id); return '<li><div class="cn"><b>' + esc(ce.name) + '</b>' + (i === 0 ? '<span class="pill good">' + esc(t('best')) + '</span>' : '') + '<small>' + esc(t('ct_' + ce.ct + '_s')) + ' · ' + nf(c.wh, 1) + (c.target ? '/' + nf(c.target, 1) : '') + ' h</small><div class="whys">' + whyChips(c.why) + '</div></div><button class="btn sm primary" data-a="assign" data-id="' + esc(sh.id) + '" data-emp="' + esc(c.id) + '">' + esc(e ? t('swap') : t('assign')) + '</button></li>'; }).join('') + '</ul>';
  } else b += '<p class="muted">' + esc(t('no_cands')) + '</p>';
  if (cand.no.length) b += '<details class="nocands"><summary>' + esc(t('not_possible', { n: cand.no.length })) + '</summary><ul>' + cand.no.slice(0, 30).map(c => '<li><span>' + esc(emp(c.id).name) + '</span><small>' + esc(reasonText(c.r)) + '</small><button class="btn sm ghost" data-a="assign" data-force="1" data-id="' + esc(sh.id) + '" data-emp="' + esc(c.id) + '">' + esc(t('assign_anyway')) + '</button></li>').join('') + '</ul></details>';
  const need = C.legalBreak(C.netMin(sh), e && C.ageOn(e.birth, sh.d) < 18);
  b += '<h3>' + esc(t('times')) + '</h3><div class="frow"><label class="fld sm"><span>' + esc(t('start')) + '</span><input type="time" id="shS" value="' + esc(sh.s) + '"></label><label class="fld sm"><span>' + esc(t('end')) + '</span><input type="time" id="shE" value="' + esc(sh.e) + '"></label><label class="fld sm"><span>' + esc(t('break_m')) + '</span><input type="number" id="shB" min="0" max="120" step="5" value="' + (+sh.b || 0) + '"></label></div>' +
    '<p class="hint">' + esc(t('break_legal', { m: need, h: nf(C.netH(sh), 2) })) + '</p>' +
    '<label class="fld"><span>' + esc(t('note')) + '</span><input id="shN" maxlength="80" value="' + esc(sh.n || '') + '"></label>' +
    '<div class="row gap"><button class="btn" data-a="shift-save" data-id="' + esc(sh.id) + '">' + ic('check') + '<span>' + esc(t('save')) + '</span></button><button class="btn danger ghost" data-a="shift-del" data-id="' + esc(sh.id) + '">' + ic('trash') + '<span>' + esc(t('shift_delete')) + '</span></button></div>';
  return drawerShell(shiftName(sh), fmtDay(sh.d, { weekday: 'long', day: '2-digit', month: 'long' }) + ', ' + sh.s + '–' + sh.e, b);
}

/* ---- Zelle (Mitarbeiter × Tag) ---- */
function drawerCell(d) {
  const m = weekModel(d.wk), e = emp(d.emp);
  if (!e) return drawerShell('?', '', '');
  const ab = C.absenceOn(m.absBy, e.id, d.d);
  const mine = m.shifts.filter(s => s.emp === e.id && s.d === d.d);
  let b = '';
  if (ab) b += '<div class="assigned">' + absChip(ab) + '<small>' + esc(fmtDay(ab.f) + ' – ' + fmtDay(ab.t)) + '</small><button class="btn sm" data-a="abs-del" data-id="' + esc(ab.id) + '">' + ic('trash') + '<span>' + esc(t('delete')) + '</span></button></div>';
  if (mine.length) b += '<h3>' + esc(t('shifts_today')) + '</h3><div class="chipsrow">' + mine.map(s => chipShift(s, m)).join('') + '</div>';
  const st = m.S[e.id];
  const open = m.shifts.filter(s => s.d === d.d && !s.emp && (e.roles || []).includes(s.r));
  if (open.length) {
    b += '<h3>' + esc(t('open_fit')) + '</h3><ul class="cands">';
    for (const s of open) {
      const r = C.canWork(e, s, st, m.ctx);
      b += '<li><div class="cn"><b>' + esc(shiftName(s)) + '</b><small>' + s.s + '–' + s.e + '</small>' + (r ? '<div class="whys"><span class="why neg">' + esc(reasonText(r)) + '</span></div>' : '') + '</div><button class="btn sm ' + (r ? 'ghost' : 'primary') + '" data-a="assign" data-id="' + esc(s.id) + '" data-emp="' + esc(e.id) + '"' + (r ? ' data-force="1"' : '') + '>' + esc(r ? t('assign_anyway') : t('take')) + '</button></li>';
    }
    b += '</ul>';
  }
  const tpls = (A.cfg.tpl || []).filter(x => x.on !== false && (e.roles || []).includes(x.r));
  b += '<h3>' + esc(t('new_shift_for', { name: C.firstName(e.name) })) + '</h3><div class="frow"><label class="fld grow"><span>' + esc(t('template')) + '</span><select id="cellTpl">' + tpls.map(x => '<option value="' + esc(x.id) + '">' + esc(L(x.name) + ' ' + x.s + '–' + x.e) + '</option>').join('') + '<option value="">' + esc(t('custom_time')) + '</option></select></label></div>' +
    '<div class="frow"><label class="fld sm"><span>' + esc(t('role')) + '</span><select id="cellRole">' + (e.roles || []).map(r => '<option value="' + esc(r) + '">' + esc(L((roleById(r) || {}).name)) + '</option>').join('') + '</select></label><label class="fld sm"><span>' + esc(t('start')) + '</span><input type="time" id="cellS" value="17:00"></label><label class="fld sm"><span>' + esc(t('end')) + '</span><input type="time" id="cellE" value="22:00"></label></div>' +
    '<button class="btn" data-a="cell-add" data-emp="' + esc(e.id) + '" data-d="' + d.d + '">' + ic('plus') + '<span>' + esc(t('add_shift')) + '</span></button>';
  if (!ab) b += '<h3>' + esc(t('absence_today')) + '</h3><div class="row gap wrap">' + ['krank', 'urlaub', 'wunsch', 'frei'].map(k => '<button class="btn sm" data-a="cell-abs" data-k="' + k + '" data-emp="' + esc(e.id) + '" data-d="' + d.d + '">' + esc(t('abs_' + k)) + '</button>').join('') + '</div>';
  return drawerShell(e.name, fmtDay(d.d, { weekday: 'long', day: '2-digit', month: 'long' }), b);
}

/* ---- Mitarbeiter ---- */
function drawerEmp(d) {
  const isNew = !d.id;
  const e = isNew ? { id: '', name: '', active: true, roles: [], primary: '', ct: 'TZ', wh: 25, wage: Math.max(14, C.minWage(+todayISO().slice(0, 4), A.cfg)), lang: A.lang === 'en' ? 'en' : A.lang, ch: 'wa', phone: '', email: '', pref: '', maxD: null, split: false, birth: '', school: [], locs: [], note: '' } : emp(d.id);
  if (!e) return drawerShell('?', '', '');
  const roles = A.cfg.roles || [];
  const av = e.av || [];
  let b = '<div class="frow"><label class="fld grow"><span>' + esc(t('name')) + '</span><input id="eName" value="' + esc(e.name) + '" required autocomplete="off"></label><label class="fld chk"><input type="checkbox" id="eActive"' + (e.active !== false ? ' checked' : '') + '><span>' + esc(t('active')) + '</span></label></div>';
  b += '<fieldset class="fs"><legend>' + esc(t('roles')) + '</legend><div class="rolepick">' + roles.map(r => '<label class="rp ' + arCls(r.a) + '"><input type="checkbox" name="eRole" value="' + esc(r.id) + '"' + ((e.roles || []).includes(r.id) ? ' checked' : '') + '><span>' + esc(L(r.name)) + '</span></label>').join('') + '</div>' +
    '<label class="fld"><span>' + esc(t('primary_role')) + '</span><select id="ePrimary">' + roles.map(r => '<option value="' + esc(r.id) + '"' + (e.primary === r.id ? ' selected' : '') + '>' + esc(L(r.name)) + '</option>').join('') + '</select></label></fieldset>';
  b += '<div class="frow"><label class="fld"><span>' + esc(t('contract')) + '</span><select id="eCt">' + CTS.map(c => '<option value="' + c + '"' + (e.ct === c ? ' selected' : '') + '>' + esc(t('ct_' + c)) + '</option>').join('') + '</select></label>' +
    '<label class="fld sm"><span>' + esc(t('target_wk')) + '</span><input type="number" id="eWh" min="0" max="48" step="0.5" value="' + (+e.wh || 0) + '"></label>' +
    '<label class="fld sm"><span>' + esc(t('wage')) + '</span><input type="number" id="eWage" min="0" step="0.05" value="' + (+e.wage || 0) + '"></label>' +
    '<label class="fld sm"><span>' + esc(t('max_days')) + '</span><input type="number" id="eMaxD" min="1" max="7" value="' + (e.maxD || C.defaultMaxDays(e.ct)) + '"></label></div>' +
    '<p class="hint">' + esc(t('ct_hint')) + '</p>';
  b += '<div class="frow"><label class="fld"><span>' + esc(t('birth')) + '</span><input type="date" id="eBirth" value="' + esc(e.birth || '') + '"></label>' +
    '<fieldset class="fs inline"><legend>' + esc(t('school_days')) + '</legend>' + DOW_ORDER.map(i => '<label class="dchk"><input type="checkbox" name="eSchool" value="' + i + '"' + ((e.school || []).includes(i) ? ' checked' : '') + '><span>' + esc(dowName(i)) + '</span></label>').join('') + '</fieldset></div>';
  b += '<fieldset class="fs"><legend>' + esc(t('availability')) + '</legend><p class="hint">' + esc(t('avail_hint')) + '</p><div class="avgrid">' + DOW_ORDER.map(i => {
    const a = av.length ? av[i] : undefined; const off = a === null; const f = a && a.f ? a.f : ''; const tt = a && a.t && a.t !== '24:00' ? (C.toMin(a.t) >= 1440 ? C.fromMin(C.toMin(a.t)) : a.t) : '';
    return '<div class="avrow"><label class="dchk"><input type="checkbox" name="eAvOn" value="' + i + '"' + (off ? '' : ' checked') + '><span>' + esc(dowName(i)) + '</span></label><input type="time" id="eAvF' + i + '" value="' + esc(f) + '" aria-label="' + esc(t('from')) + '"><span>–</span><input type="time" id="eAvT' + i + '" value="' + esc(tt) + '" aria-label="' + esc(t('to')) + '"></div>';
  }).join('') + '</div></fieldset>';
  b += '<div class="frow"><label class="fld"><span>' + esc(t('pref')) + '</span><select id="ePref"><option value="">' + esc(t('pref_none')) + '</option><option value="early"' + (e.pref === 'early' ? ' selected' : '') + '>' + esc(t('pref_early')) + '</option><option value="late"' + (e.pref === 'late' ? ' selected' : '') + '>' + esc(t('pref_late')) + '</option></select></label>' +
    '<label class="fld chk"><input type="checkbox" id="eSplit"' + (e.split ? ' checked' : '') + '><span>' + esc(t('split_ok')) + '</span></label></div>';
  b += '<fieldset class="fs"><legend>' + esc(t('contact')) + '</legend><div class="frow"><label class="fld"><span>' + esc(t('phone')) + '</span><input type="tel" id="ePhone" value="' + esc(e.phone || '') + '" placeholder="0151 2345678" autocomplete="off"></label>' +
    '<label class="fld"><span>' + esc(t('email')) + '</span><input type="email" id="eEmail" value="' + esc(e.email || '') + '" autocomplete="off"></label></div><div class="frow">' +
    '<label class="fld"><span>' + esc(t('channel')) + '</span><select id="eCh">' + ['wa', 'sms', 'mail', 'none'].map(c => '<option value="' + c + '"' + ((e.ch || 'wa') === c ? ' selected' : '') + '>' + esc(t('ch_' + c)) + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>' + esc(t('msg_lang')) + '</span><select id="eLang">' + MSG_LANGS.map(l => '<option value="' + l + '"' + (e.lang === l ? ' selected' : '') + '>' + esc(C.MSG[l].label) + '</option>').join('') + '</select></label></div><p class="hint">' + esc(t('consent_hint')) + '</p></fieldset>';
  b += '<div class="frow"><label class="fld"><span>' + esc(t('start_date')) + '</span><input type="date" id="eStart" value="' + esc(e.start || '') + '"></label><label class="fld"><span>' + esc(t('end_date')) + '</span><input type="date" id="eEnd" value="' + esc(e.end || '') + '"></label></div>';
  b += '<label class="fld"><span>' + esc(t('note')) + '</span><input id="eNote" maxlength="160" value="' + esc(e.note || '') + '"></label>';
  if (!isNew) {
    const m = weekModel(A.wk), st = m.S[e.id] || { wh: 0, target: 0, sun: 0, we: 0, mon: {} }, H = m.hist[e.id] || {};
    const mk = C.monthKey(m.dates[3]);
    b += '<div class="statbox"><div><small>' + esc(t('this_week')) + '</small><b>' + nf(st.wh, 1) + (st.target ? ' / ' + nf(st.target, 1) : '') + ' h</b></div><div><small>' + esc(t('sundays')) + '</small><b>' + ((H.sunY || 0) + (st.sun || 0)) + ' / ' + m.ctx.sunAllowed + '</b></div><div><small>' + esc(t('we4')) + '</small><b>' + ((H.we4 || 0) + (st.we || 0)) + '</b></div>' + (e.ct === 'MJ' ? '<div><small>' + esc(t('minijob_month')) + '</small><b>' + eur(((H.monE || {})[mk] || 0) + (st.mon[mk] || 0)) + ' / ' + eur(C.minijobCap(m.ctx.year, A.cfg)) + '</b></div>' : '') + '</div>';
  }
  b += '<div class="row gap sticky-actions"><button class="btn primary" data-a="emp-save" data-id="' + esc(e.id) + '">' + ic('check') + '<span>' + esc(t('save')) + '</span></button>' + (isNew ? '' : '<button class="btn danger ghost" data-a="emp-del" data-id="' + esc(e.id) + '">' + ic('trash') + '<span>' + esc(t('delete')) + '</span></button>') + '</div>';
  return drawerShell(isNew ? t('add_staff') : e.name, isNew ? '' : t('ct_' + e.ct), b);
}

/* ---- Tag ---- */
function drawerDay(d) {
  const m = weekModel(d.wk), i = m.dates.indexOf(d.d);
  if (i < 0) return drawerShell('?', '', '');
  const di = m.days[d.d] || {}, f = C.dayFactors(d.d, A.cfg, di), r = m.rev[i];
  const hol = C.holidayOf(d.d, A.cfg.state), sp = C.specialsFor(d.d, A.cfg);
  let b = '<div class="frow"><label class="fld"><span>' + esc(t('exp_guests')) + '</span><input type="number" id="dayG" min="0" step="10" value="' + (di.g != null ? di.g : '') + '" placeholder="' + f.forecast + '"></label><label class="fld chk"><input type="checkbox" id="dayClosed"' + (di.closed ? ' checked' : '') + '><span>' + esc(t('closed_day')) + '</span></label></div>' +
    '<p class="hint">' + esc(t('guests_fc', { n: f.forecast, w: dowName(C.dow(d.d)) })) + (sp.length ? ' ' + esc(t('special_applied', { s: sp.map(x => x.k ? t(x.k) : L(x.name)).join(', ') })) : '') + (hol ? ' ' + esc(t('hol_applied', { h: t(hol) })) : '') + '</p>' +
    '<label class="fld"><span>' + esc(t('note')) + '</span><input id="dayN" maxlength="120" value="' + esc(di.n || '') + '"></label>' +
    '<div class="row gap"><button class="btn primary" data-a="day-save" data-d="' + d.d + '">' + ic('check') + '<span>' + esc(t('save')) + '</span></button></div>' +
    '<div class="statbox"><div><small>' + esc(t('rev_fc')) + '</small><b>' + eur(r.rev) + '</b></div><div><small>' + esc(t('k_cost')) + '</small><b>' + eur(m.costDay[i].tot) + '</b></div><div><small>' + esc(t('quote')) + '</small><b>' + (r.rev ? pct(m.costDay[i].tot / r.rev, 1) : '–') + '</b></div></div>';
  const evs = m.events.filter(e => e.d === d.d);
  b += '<h3>' + esc(t('events')) + '</h3>' + (evs.length ? '<ul class="cands">' + evs.map(ev => '<li><div class="cn"><b>' + esc(ev.name) + '</b><small>' + esc(ev.s + '–' + ev.e + ', ' + t('guests_n', { n: ev.g })) + '</small><div class="whys"><span class="why">' + esc(needText(ev)) + '</span></div></div><button class="btn sm" data-a="event-edit" data-id="' + esc(ev.id) + '">' + esc(t('edit')) + '</button></li>').join('') + '</ul>' : '<p class="muted">' + esc(t('none')) + '</p>') +
    '<button class="btn sm" data-a="event-new" data-d="' + d.d + '">' + ic('plus') + '<span>' + esc(t('event_add')) + '</span></button>';
  b += staffingChart(m, d.d);
  return drawerShell(fmtDay(d.d, { weekday: 'long', day: '2-digit', month: 'long' }), hol ? t(hol) : '', b);
}

/* ---- Hinweise ---- */
function drawerIssues(d) {
  const m = weekModel(d.wk);
  if (!m.issues.length) return drawerShell(t('k_rules'), '', '<p class="okmsg">' + ic('check') + esc(t('all_ok')) + '</p>');
  let b = '';
  for (const sev of ['err', 'warn', 'info']) {
    const list = m.issues.filter(i => i.sev === sev); if (!list.length) continue;
    b += '<h3>' + esc(t('sev_' + sev)) + ' (' + list.length + ')</h3><ul class="issues">' + list.map(i => '<li class="' + sev + '">' + ic(sev === 'err' ? 'err' : sev === 'warn' ? 'warn' : 'info') + '<span>' + esc(issueText(i)) + '</span>' + (i.shiftId ? '<button class="btn sm ghost" data-a="shift" data-id="' + esc(i.shiftId) + '">' + esc(t('open_it')) + '</button>' : i.emp ? '<button class="btn sm ghost" data-a="emp" data-id="' + esc(i.emp) + '">' + esc(t('open_it')) + '</button>' : '') + '</li>').join('') + '</ul>';
  }
  return drawerShell(t('k_rules'), t('kw', { w: +d.wk.split('-W')[1] }), b);
}

/* ---- Feier / Catering ---- */
function drawerEvent(d) {
  let ev = null;
  if (d.id) for (const y in A.evt) { const f = (A.evt[y] || []).find(x => x.id === d.id); if (f) ev = f; }
  ev = ev || { id: '', d: d.d || todayISO(), name: '', k: 'feier', s: '18:00', e: '23:00', g: 100, svc: false, n: '' };
  const b = '<div class="frow"><label class="fld"><span>' + esc(t('date')) + '</span><input type="date" id="evD" value="' + esc(ev.d) + '"></label><label class="fld grow"><span>' + esc(t('name')) + '</span><input id="evName" value="' + esc(ev.name) + '" maxlength="80" placeholder="' + esc(t('ev_ph')) + '"></label></div>' +
    '<div class="frow"><label class="fld"><span>' + esc(t('kind')) + '</span><select id="evK">' + ['feier', 'catering', 'sonst'].map(k => '<option value="' + k + '"' + (ev.k === k ? ' selected' : '') + '>' + esc(t('ev_' + k)) + '</option>').join('') + '</select></label>' +
    '<label class="fld sm"><span>' + esc(t('start')) + '</span><input type="time" id="evS" value="' + esc(ev.s) + '"></label><label class="fld sm"><span>' + esc(t('end')) + '</span><input type="time" id="evE" value="' + esc(ev.e) + '"></label>' +
    '<label class="fld sm"><span>' + esc(t('guests')) + '</span><input type="number" id="evG" min="1" step="5" value="' + (+ev.g || 0) + '"></label></div>' +
    '<label class="fld chk"><input type="checkbox" id="evSvc"' + (ev.svc ? ' checked' : '') + '><span>' + esc(t('ev_with_svc')) + '</span></label>' +
    '<label class="fld"><span>' + esc(t('note')) + '</span><input id="evN" maxlength="120" value="' + esc(ev.n || '') + '"></label>' +
    '<p class="hint">' + esc(t('ev_need', { x: ev.id ? needText(ev) : '–' })) + '</p>' +
    '<div class="row gap"><button class="btn primary" data-a="event-save" data-id="' + esc(ev.id) + '">' + ic('check') + '<span>' + esc(t('save')) + '</span></button>' + (ev.id ? '<button class="btn danger ghost" data-a="event-del" data-id="' + esc(ev.id) + '">' + ic('trash') + '<span>' + esc(t('delete')) + '</span></button>' : '') + '</div>';
  return drawerShell(ev.id ? ev.name : t('event_add'), '', b);
}

/* ---------------- Dialoge ---------------- */
function modalShell(title, body, foot) {
  return '<div class="mo-card" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="dr-head"><h2>' + esc(title) + '</h2><button class="btn icon ghost" data-a="mclose" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div><div class="mo-body">' + body + '</div>' + (foot ? '<div class="mo-foot">' + foot + '</div>' : '') + '</div>';
}
function viewModal() {
  const md = A.modal;
  switch (md.type) {
    case 'autoplan': {
      const m = weekModel(A.wk);
      const assigned = m.shifts.filter(s => s.emp).length;
      const def = assigned > m.total * 0.3 ? 'fill' : 'replan';
      return modalShell(t('autoplan'), '<p>' + esc(t('ap_intro')) + '</p><fieldset class="fs"><legend>' + esc(t('ap_strategy')) + '</legend>' + STRATS.map((s, i) => '<label class="opt"><input type="radio" name="apS" value="' + s + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(t('s_' + s)) + '</b><small>' + esc(t('s_' + s + '_d')) + '</small></span></label>').join('') + '</fieldset>' +
        '<fieldset class="fs"><legend>' + esc(t('ap_scope')) + '</legend><label class="opt"><input type="radio" name="apM" value="fill"' + (def === 'fill' ? ' checked' : '') + '><span><b>' + esc(t('ap_fill')) + '</b><small>' + esc(t('ap_fill_d')) + '</small></span></label><label class="opt"><input type="radio" name="apM" value="replan"' + (def === 'replan' ? ' checked' : '') + '><span><b>' + esc(t('ap_replan')) + '</b><small>' + esc(t('ap_replan_d')) + '</small></span></label></fieldset><p class="hint">' + esc(t('ap_rules')) + '</p>',
        '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="ap-run">' + ic('spark') + '<span>' + esc(t('ap_go')) + '</span></button>');
    }
    case 'confirm':
      return modalShell(md.title, '<p>' + esc(md.text) + '</p>', '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn ' + (md.danger ? 'danger' : 'primary') + '" data-a="confirm-ok">' + esc(md.ok || t('ok')) + '</button>');
    case 'copyprev':
      return modalShell(t('copy_prev'), '<p>' + esc(t('copy_intro')) + '</p><label class="fld chk"><input type="checkbox" id="cpFill" checked><span>' + esc(t('copy_fill')) + '</span></label>', '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="copy-run">' + esc(t('copy_go')) + '</button>');
    case 'import': return modalImport(md);
    case 'queue': return modalQueue(md);
    case 'export': return modalExport();
    case 'demoend':
      return modalShell(t('demo_end'), '<p>' + esc(t('demo_end_p')) + '</p>', '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn danger" data-a="demo-wipe">' + esc(t('demo_end_go')) + '</button>');
    case 'special':
      return modalShell(t('special_add'), '<div class="frow"><label class="fld grow"><span>' + esc(t('name')) + '</span><input id="spName" maxlength="60"></label></div><div class="frow"><label class="fld"><span>' + esc(t('from')) + '</span><input type="date" id="spFrom" value="' + todayISO() + '"></label><label class="fld"><span>' + esc(t('to')) + '</span><input type="date" id="spTo" value="' + todayISO() + '"></label><label class="fld sm"><span>' + esc(t('f_day')) + '</span><input type="number" id="spFd" step="0.05" min="0.3" max="3" value="1.2"></label><label class="fld sm"><span>' + esc(t('f_eve')) + '</span><input type="number" id="spFe" step="0.05" min="0.3" max="3" value="1.2"></label></div><p class="hint">' + esc(t('special_hint')) + '</p>',
        '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="special-save">' + esc(t('save')) + '</button>');
    case 'pw':
      return modalShell(t('pw_change'), pwFld('pwOld', t('pw_old'), 'current-password') + pwFld('pwNew', t('pw_new'), 'new-password', true) + pwFld('pwNew2', t('f_pass2'), 'new-password') + '<p class="hint">' + esc(t('pass_rule')) + '</p>' + (md.err ? '<p class="err" role="alert">' + esc(md.err) + '</p>' : ''),
        '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="pw-save"' + (md.busy ? ' disabled' : '') + '>' + esc(t('save')) + '</button>');
    case 'accnew':
      return modalShell(t('acc_new'), '<label class="fld"><span>' + esc(t('name')) + '</span><input id="anName" autocomplete="off" maxlength="40" value="' + esc(md.name || '') + '"></label>' +
        '<label class="fld"><span>' + esc(t('acc_role')) + '</span><select id="anRole">' + ['edit', 'view', 'admin'].map(r => '<option value="' + r + '"' + ((md.role || 'edit') === r ? ' selected' : '') + '>' + esc(t('role_' + r)) + ' (' + esc(t('role_' + r + '_d')) + ')</option>').join('') + '</select></label>' +
        pwFld('anPass', t('f_pass'), 'new-password', true) + '<p class="hint">' + esc(t('pass_rule')) + '</p>' + (md.err ? '<p class="err" role="alert">' + esc(md.err) + '</p>' : ''),
        '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="acc-create"' + (md.busy ? ' disabled' : '') + '>' + esc(t('acc_create')) + '</button>');
    case 'accpw':
      return modalShell(t('acc_reset') + ': ' + md.name, pwFld('apPass', t('pw_new'), 'new-password', true) + '<p class="hint">' + esc(t('pass_rule')) + '</p>' + (md.err ? '<p class="err" role="alert">' + esc(md.err) + '</p>' : ''),
        '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="accpw-save"' + (md.busy ? ' disabled' : '') + '>' + esc(t('save')) + '</button>');
    case 'accdone':
      return modalShell(md.name, '<p>' + esc(t(md.isNew ? 'acc_created' : 'acc_pw_set', { n: md.name })) + '</p><div class="pwshow"><span>' + esc(t('name')) + '</span><b>' + esc(md.name) + '</b><span>' + esc(t('f_pass')) + '</span><b class="mono">' + esc(md.pw) + '</b></div>' +
        '<p class="hint">' + esc(t('acc_share')) + '</p>',
        '<button class="btn" data-a="copy-login" data-v="' + esc(location.origin + location.pathname + '\n' + t('name') + ': ' + md.name + '\n' + t('f_pass') + ': ' + md.pw) + '">' + ic('copy') + '<span>' + esc(t('copy')) + '</span></button><button class="btn primary" data-a="mclose">' + esc(t('close')) + '</button>');
    case 'text':
      return modalShell(md.title, '<textarea class="bigtext" id="mText" readonly dir="auto">' + esc(md.text) + '</textarea>', '<button class="btn" data-a="mclose">' + esc(t('close')) + '</button><button class="btn primary" data-a="copy-mtext">' + ic('copy') + '<span>' + esc(t('copy')) + '</span></button>');
    case 'restore':
      return modalShell(t('backup_load'), '<p>' + esc(t('restore_p', { n: Object.keys(md.data.staff || {}).length, w: Object.keys(md.data.weeks || {}).length })) + '</p>', '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn danger" data-a="restore-go">' + esc(t('restore_go')) + '</button>');
  }
  return '';
}
function modalExport() {
  const can = !!A.caps.downloads;
  let b = '<p>' + esc(t('exp_intro')) + '</p>';
  b += '<label class="fld"><span>' + esc(t('area')) + '</span><select id="exArea"><option value="">' + esc(t('all')) + '</option>' + (A.cfg.areas || []).map(a => '<option value="' + esc(a.id) + '"' + (A.area === a.id ? ' selected' : '') + '>' + esc(L(a.name)) + '</option>').join('') + '</select></label>';
  b += '<div class="exgrid">' + (can ? '<button class="btn" data-a="ex-pdf">' + ic('dl') + '<span>' + esc(t('ex_pdf')) + '</span></button><button class="btn" data-a="ex-png">' + ic('dl') + '<span>' + esc(t('ex_png')) + '</span></button><button class="btn" data-a="csv">' + ic('dl') + '<span>' + esc(t('csv_btn')) + '</span></button>' : '') +
    '<button class="btn" data-a="team-text">' + ic('copy') + '<span>' + esc(t('team_text')) + '</span></button></div>' + (can ? '' : '<p class="hint">' + esc(t('no_dl')) + '</p>');
  return modalShell(t('export'), b, '<button class="btn" data-a="mclose">' + esc(t('close')) + '</button>');
}

/* ---- Import aus Excel ---- */
const ROLE_WORDS = {
  leitung: ['leitung', 'schichtleitung', 'sorumlu', 'müdür', 'mudur', 'yönetici', 'manager', 'lead', 'chef de rang'],
  kuechenchef: ['küchenchef', 'kuechenchef', 'şef', 'sef', 'head chef', 'chefkoch', 'sous'],
  koch: ['koch', 'köchin', 'aşçı', 'asci', 'cook', 'commis'],
  grill: ['grill', 'mangal', 'ızgara', 'izgara', 'döner', 'doner', 'kebap'],
  vorb: ['vorbereitung', 'hazırlık', 'hazirlik', 'prep', 'küchenhilfe', 'beikoch', 'yardımcı'],
  fruehst: ['frühstück', 'fruehstueck', 'kahvaltı', 'kahvalti', 'breakfast', 'buffet', 'büfe'],
  service: ['service', 'servis', 'kellner', 'kellnerin', 'garson', 'waiter', 'server', 'bedienung'],
  empfang: ['empfang', 'karşılama', 'karsilama', 'host', 'hostess', 'rezeption'],
  bar: ['bar', 'theke', 'çay', 'cay', 'barista', 'getränke', 'içecek'],
  spueler: ['spüle', 'spuele', 'spüler', 'bulaşık', 'bulasik', 'dishwasher', 'dish'],
  fahrer: ['fahrer', 'kurye', 'driver', 'lieferung', 'lieferfahrer'],
  reinigung: ['reinigung', 'temizlik', 'cleaning', 'putz']
};
function matchRoles(txt) {
  const s = String(txt || '').toLocaleLowerCase('de-DE');
  const out = [];
  for (const id in ROLE_WORDS) if (ROLE_WORDS[id].some(w => s.includes(w))) out.push(id);
  return out.filter(r => roleById(r));
}
function matchCt(txt) {
  const s = String(txt || '').toLowerCase();
  if (/mini|450|520|538|556|603|633|geringf/.test(s)) return 'MJ';
  if (/azubi|ausbild|çırak|cirak|stajyer|appren/.test(s)) return 'AZ';
  if (/werk|student|öğrenci|ogrenci/.test(s)) return 'WS';
  if (/aushilf|abruf|event|kurzfr|extra/.test(s)) return 'AH';
  if (/teil|tz|part|yarı|yari/.test(s)) return 'TZ';
  if (/voll|vz|full|tam/.test(s)) return 'VZ';
  return '';
}
function matchLang(txt) {
  const s = String(txt || '').toLowerCase().trim();
  const map = { de: ['de', 'deutsch', 'almanca', 'german'], tr: ['tr', 'türk', 'turk'], en: ['en', 'eng', 'ingilizce'], ar: ['ar', 'arab', 'عرب'], ku: ['ku', 'kurd', 'kürt', 'kurmanc'], ckb: ['ckb', 'soran'], sq: ['sq', 'alban', 'arnavut', 'shqip'], sr: ['sr', 'serb', 'sırp', 'srpski', 'bosn', 'kroat'], fa: ['fa', 'dari', 'farsi', 'persisch', 'afgh'], ps: ['ps', 'pasch', 'pasht', 'peşt'] };
  for (const k in map) if (map[k].some(w => s === w || (w.length > 2 && s.includes(w)))) return k;
  return '';
}
function parseImport(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  let rows = lines.map(l => l.split(sep).map(x => x.trim().replace(/^"|"$/g, '')));
  const head = rows[0].map(x => x.toLowerCase());
  const find = words => head.findIndex(h => words.some(w => h.includes(w)));
  let col = { name: find(['name', 'isim', 'ad soyad', 'mitarbeiter', 'personel']), role: find(['rolle', 'bereich', 'görev', 'gorev', 'role', 'position', 'tätigkeit']), ct: find(['vertrag', 'sözleşme', 'sozlesme', 'contract', 'art']), wh: find(['stunden', 'saat', 'hours', 'std']), wage: find(['lohn', 'ücret', 'ucret', 'wage', '€']), phone: find(['tel', 'handy', 'mobil', 'phone', 'whatsapp']), email: find(['mail', 'e-mail', 'eposta']), lang: find(['sprache', 'dil', 'language']) };
  const hasHead = col.name >= 0;
  if (!hasHead) col = { name: 0, role: 1, ct: 2, wh: 3, wage: 4, phone: 5, email: -1, lang: 6 };
  else rows = rows.slice(1);
  const num = v => { const n = parseFloat(String(v || '').replace(/[^\d,.-]/g, '').replace(',', '.')); return isFinite(n) ? n : null; };
  return rows.filter(r => r[col.name]).map(r => {
    const roles = matchRoles(col.role >= 0 ? r[col.role] : '');
    const ct = matchCt(col.ct >= 0 ? r[col.ct] : '') || 'TZ';
    return { name: r[col.name], roles: roles.length ? roles : ['service'], ct, wh: col.wh >= 0 ? (num(r[col.wh]) || 0) : (ct === 'VZ' ? 40 : 20), wage: col.wage >= 0 ? (num(r[col.wage]) || 0) : 0, phone: col.phone >= 0 ? r[col.phone] : '', email: col.email >= 0 ? r[col.email] : '', lang: (col.lang >= 0 && matchLang(r[col.lang])) || A.lang };
  });
}
function modalImport(md) {
  const rows = md.rows || [];
  let b = '<p>' + esc(t('imp_intro')) + '</p><textarea class="bigtext" id="impText" placeholder="' + esc(t('imp_ph')) + '">' + esc(md.text || '') + '</textarea><div class="row gap"><button class="btn" data-a="imp-parse">' + esc(t('imp_check')) + '</button></div>';
  if (rows.length) {
    b += '<div class="tablewrap"><table class="tbl"><thead><tr><th>' + esc(t('name')) + '</th><th>' + esc(t('roles')) + '</th><th>' + esc(t('contract')) + '</th><th class="r">' + esc(t('target_wk')) + '</th><th class="r">' + esc(t('wage')) + '</th><th>' + esc(t('phone')) + '</th><th>' + esc(t('msg_lang')) + '</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td>' + esc(r.name) + '</td><td>' + r.roles.map(x => esc(L((roleById(x) || {}).name))).join(', ') + '</td><td>' + esc(t('ct_' + r.ct)) + '</td><td class="r">' + nf(r.wh, 1) + '</td><td class="r">' + (r.wage ? eur(r.wage, 2) : '–') + '</td><td>' + esc(r.phone) + '</td><td>' + esc((C.MSG[r.lang] || C.MSG.de).label) + '</td></tr>').join('') + '</tbody></table></div><p class="hint">' + esc(t('imp_after')) + '</p>';
  }
  return modalShell(t('import_xl'), b, '<button class="btn" data-a="mclose">' + esc(t('cancel')) + '</button><button class="btn primary" data-a="imp-go"' + (rows.length ? '' : ' disabled') + '>' + esc(t('imp_go', { n: rows.length })) + '</button>');
}

/* ---- Nacheinander senden ---- */
function modalQueue(md) {
  const m = weekModel(A.wk);
  const rows = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).filter(r => md.ids.includes(r.e.id));
  const r = rows.find(x => x.e.id === md.ids[md.i]);
  if (!r) return modalShell(t('queue_h'), '<p class="okmsg">' + ic('check') + esc(t('queue_done')) + '</p>', '<button class="btn primary" data-a="mclose">' + esc(t('close')) + '</button>');
  const wa = r.ch === 'sms' ? 'sms:+' + r.phone + '?&body=' + encodeURIComponent(r.text) : 'https://wa.me/' + r.phone + '?text=' + encodeURIComponent(r.text);
  return modalShell(t('queue_h'), '<p class="qprog">' + esc(t('queue_prog', { i: md.i + 1, n: md.ids.length })) + '</p><h3>' + esc(r.e.name) + ' <small>' + esc(C.MSG[r.e.lang] ? C.MSG[r.e.lang].label : '') + '</small></h3><pre class="msg" dir="auto">' + esc(r.text) + '</pre><p class="hint">' + esc(t('queue_hint')) + '</p>',
    '<button class="btn" data-a="queue-skip">' + esc(t('skip')) + '</button><a class="btn primary wa" href="' + esc(wa) + '" target="_blank" rel="noopener" data-a="queue-send" data-id="' + esc(r.e.id) + '">' + ic(r.ch === 'sms' ? 'sms' : 'chat') + '<span>' + esc(r.ch === 'sms' ? t('open_sms') : t('open_wa')) + '</span></a>');
}

/* ---------------- KI-Assistent ---------------- */
function viewAI() {
  if (!A.ai.open) return '<button class="ai-fab" data-a="ai-open">' + ic('spark') + '<span>' + esc(t('ai_name')) + '</span></button>';
  const log = A.ai.log.slice(-12).map(x => '<div class="msg ' + x.role + '" dir="auto">' + esc(x.text) + '</div>').join('');
  let plan = '';
  if (A.ai.plan && A.ai.plan.actions.length) plan = '<div class="aiplan"><b>' + esc(t('ai_plan')) + '</b><ul>' + A.ai.plan.actions.map(a => '<li>' + esc(describeAction(a)) + '</li>').join('') + '</ul><div class="row gap"><button class="btn primary sm" data-a="ai-run">' + ic('check') + '<span>' + esc(t('ai_run')) + '</span></button><button class="btn sm" data-a="ai-drop">' + esc(t('ai_drop')) + '</button></div></div>';
  const ex = ['ai_ex1', 'ai_ex2', 'ai_ex3', 'ai_ex4'].map(k => '<button class="chip-f" data-a="ai-ex" data-k="' + k + '">' + esc(t(k)) + '</button>').join('');
  return '<div class="ai-panel" role="dialog" aria-label="' + esc(t('ai_name')) + '"><div class="dr-head"><h2>' + ic('spark') + esc(t('ai_name')) + '</h2><button class="btn icon ghost" data-a="ai-close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div>' +
    '<div class="ai-log" id="aiLog">' + (log || '<p class="muted">' + esc(t('ai_hello')) + '</p><div class="chips wrap">' + ex + '</div>') + (A.ai.busy ? '<div class="msg ai busy">' + esc(t('ai_thinking')) + '</div>' : '') + plan + '</div>' +
    '<div class="ai-in"><textarea id="aiText" rows="2" dir="auto" placeholder="' + esc(t('ai_ph')) + '"' + (A.ai.busy ? ' disabled' : '') + '></textarea>' +
    (A.caps.dictation ? '<button class="btn icon' + (A.ai.listening ? ' rec' : '') + '" data-a="ai-mic" aria-label="' + esc(t('ai_mic')) + '">' + ic(A.ai.listening ? 'stop' : 'mic') + '</button>' : '') +
    (A.ai.busy ? '<button class="btn icon" data-a="ai-stop" aria-label="' + esc(t('stop')) + '">' + ic('stop') + '</button>' : '<button class="btn primary icon" data-a="ai-send" aria-label="' + esc(t('send')) + '">' + ic('send') + '</button>') + '</div></div>';
}
function aiContext() {
  const m = weekModel(A.wk);
  const nextWk = C.wkShift(A.wk, 1);
  return {
    today: todayISO(), weekday_today: fmtDay(todayISO(), { weekday: 'long' }), ui_language: A.lang,
    week: { id: A.wk, dates: m.dates }, next_week: { id: nextWk, dates: C.weekDates(C.wkStart(nextWk)) },
    roles: (A.cfg.roles || []).map(r => [r.id, C.nameOf(r.name, 'de'), C.nameOf(r.name, 'tr')]),
    templates: (A.cfg.tpl || []).filter(x => x.on !== false).map(x => [x.id, C.nameOf(x.name, 'de'), x.r, x.s, x.e]),
    staff: sortedStaff(staffArr().filter(e => e.active !== false)).map(e => [e.id, e.name, (e.roles || []).join('+'), e.ct, e.wh || 0]),
    shifts_this_week: m.shifts.map(s => [s.id, s.d, s.t || '', s.r, s.s, s.e, s.emp || null]),
    absences: m.input.absences.filter(a => a.t >= m.dates[0]).map(a => [a.emp, a.k, a.f, a.t]),
    events: evtList(yearsOf(m.dates)).map(e => [e.id, e.d, e.name, e.k, e.s, e.e, e.g])
  };
}
const AI_RULES = `Du bist der Assistent einer Schichtplan-App für ein Restaurant in Deutschland. Der Nutzer ist Inhaber oder Schichtleitung.
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt: {"reply": string, "actions": [ ... ]}.
- "reply": kurze, freundliche Antwort (höchstens 3 Sätze) in der Sprache der Nutzeranweisung. Ist die Sprache unklar, nutze die ui_language.
- Fragen (z. B. "Wer arbeitet Freitag Abend an der Bar?") beantwortest du nur in "reply" aus den DATEN, mit "actions": [].
- Nutze nur IDs aus den DATEN. Erfinde nichts. Datumsangaben immer als YYYY-MM-DD; "heute", "morgen", "Freitag" beziehen sich auf "today".
- Die Anweisung kann auch die weitergeleitete Nachricht eines Mitarbeiters sein, in jeder Sprache (Türkisch, Arabisch, Kurdisch, Albanisch, Serbisch, Dari, Paschtu …). Deute sie sinngemäß: "Ich bin krank" → absence kind "krank" (+ replace); "Freitag kann ich nicht" → absence kind "wunsch" für diesen Tag.
- Bei Krankheit/Urlaub eines Mitarbeiters: zuerst "absence", danach "replace" für denselben Zeitraum.
Erlaubte actions (nur diese Felder):
{"type":"absence","emp":"<staffId>","kind":"krank|urlaub|wunsch|frei|schule|sonst","from":"YYYY-MM-DD","to":"YYYY-MM-DD","note":""}
{"type":"replace","emp":"<staffId>","from":"YYYY-MM-DD","to":"YYYY-MM-DD"}
{"type":"assign","shift":"<shiftId>","emp":"<staffId>"}
{"type":"unassign","shift":"<shiftId>"}
{"type":"event","date":"YYYY-MM-DD","name":"...","kind":"feier|catering|sonst","start":"HH:MM","end":"HH:MM","guests":120}
{"type":"guests","date":"YYYY-MM-DD","guests":500}
{"type":"avail","emp":"<staffId>","dow":[1,2],"from":"HH:MM","to":"HH:MM"}   (dow: 0=Sonntag … 6=Samstag; ohne from/to = an diesen Tagen nicht verfügbar)
{"type":"autoplan","week":"this|next","mode":"fill|replan"}`;
function sanitizeActions(list) {
  const okDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')), okTime = s => /^\d{1,2}:\d{2}$/.test(String(s || ''));
  const out = [];
  for (const a of Array.isArray(list) ? list.slice(0, 12) : []) {
    if (!a || typeof a !== 'object') continue;
    const ty = a.type;
    if ((ty === 'absence' || ty === 'replace') && emp(a.emp) && okDate(a.from) && okDate(a.to || a.from)) out.push({ type: ty, emp: a.emp, kind: ABS_KINDS.includes(a.kind) ? a.kind : 'sonst', from: a.from, to: a.to && a.to >= a.from ? a.to : a.from, note: String(a.note || '').slice(0, 100) });
    else if (ty === 'assign' && emp(a.emp) && weekModel(A.wk).shifts.some(s => s.id === a.shift)) out.push({ type: ty, shift: a.shift, emp: a.emp });
    else if (ty === 'unassign' && weekModel(A.wk).shifts.some(s => s.id === a.shift)) out.push({ type: ty, shift: a.shift });
    else if (ty === 'event' && okDate(a.date) && +a.guests > 0) out.push({ type: ty, date: a.date, name: String(a.name || t('event')).slice(0, 80), kind: ['feier', 'catering', 'sonst'].includes(a.kind) ? a.kind : 'feier', start: okTime(a.start) ? a.start : '18:00', end: okTime(a.end) ? a.end : '23:00', guests: Math.min(2000, Math.round(+a.guests)) });
    else if (ty === 'guests' && okDate(a.date) && +a.guests >= 0) out.push({ type: ty, date: a.date, guests: Math.round(+a.guests) });
    else if (ty === 'avail' && emp(a.emp) && Array.isArray(a.dow)) out.push({ type: ty, emp: a.emp, dow: a.dow.map(Number).filter(x => x >= 0 && x <= 6), from: okTime(a.from) ? a.from : '', to: okTime(a.to) ? a.to : '' });
    else if (ty === 'autoplan') out.push({ type: ty, week: a.week === 'next' ? 'next' : 'this', mode: a.mode === 'replan' ? 'replan' : 'fill' });
  }
  return out;
}
function describeAction(a) {
  const n = a.emp ? (emp(a.emp) || {}).name : '';
  switch (a.type) {
    case 'absence': return t('ai_d_abs', { n, k: t('abs_' + a.kind), f: fmtDay(a.from), t: fmtDay(a.to) });
    case 'replace': return t('ai_d_repl', { n, f: fmtDay(a.from), t: fmtDay(a.to) });
    case 'assign': { const sh = weekModel(A.wk).shifts.find(s => s.id === a.shift); return t('ai_d_assign', { n, s: sh ? fmtDay(sh.d) + ' ' + sh.s + '–' + sh.e + ' ' + shiftName(sh) : a.shift }); }
    case 'unassign': { const sh = weekModel(A.wk).shifts.find(s => s.id === a.shift); return t('ai_d_unassign', { s: sh ? fmtDay(sh.d) + ' ' + sh.s + '–' + sh.e + ' ' + shiftName(sh) : a.shift }); }
    case 'event': return t('ai_d_event', { name: a.name, d: fmtDay(a.date), g: a.guests, s: a.start, e: a.end });
    case 'guests': return t('ai_d_guests', { d: fmtDay(a.date), g: a.guests });
    case 'avail': return t('ai_d_avail', { n, days: a.dow.map(dowName).join(', '), x: a.from ? a.from + '–' + a.to : t('not_avail') });
    case 'autoplan': return t('ai_d_autoplan', { w: a.week === 'next' ? t('next_week') : t('this_week') });
  }
  return a.type;
}
async function aiSend(text) {
  text = String(text || '').trim();
  if (!text || A.ai.busy) return;
  const sample = A.caps.sample; if (!sample) return;
  A.ai.log.push({ role: 'user', text }); A.ai.busy = true; A.ai.plan = null;
  const ta0 = $('#aiText'); if (ta0) ta0.value = '';
  render();
  const ctl = new AbortController(); A.ai.ctl = ctl;
  try {
    const prompt = AI_RULES + '\n\nDATEN:\n' + JSON.stringify(aiContext()) + '\n\nANWEISUNG DES NUTZERS:\n' + text;
    const res = await sample.json(prompt, { modelTier: 'default', cache: false, signal: ctl.signal });
    const reply = res && typeof res.reply === 'string' ? res.reply : '';
    const actions = sanitizeActions(res && res.actions);
    A.ai.log.push({ role: 'ai', text: reply || (actions.length ? t('ai_plan') : t('ai_none')) });
    A.ai.plan = actions.length ? { actions } : null;
  } catch (e) {
    const code = e && e.code;
    if (code === 'cancelled') { /* nichts */ }
    else if (code === 'not_granted' || code === 'sampling_disabled') { A.ai.log.push({ role: 'ai', text: t('ai_off') }); }
    else if (code === 'rate_limited') A.ai.log.push({ role: 'ai', text: t('ai_rate') });
    else A.ai.log.push({ role: 'ai', text: t('ai_err') + (code ? ' (' + code + ')' : '') });
  }
  A.ai.busy = false; A.ai.ctl = null; render();
  const lg = $('#aiLog'); if (lg) lg.scrollTop = lg.scrollHeight;
}
function aiRun() {
  const plan = A.ai.plan; if (!plan) return;
  A.ai.plan = null;
  for (const a of plan.actions) {
    try {
      if (a.type === 'absence') { addAbsence({ emp: a.emp, k: a.kind, f: a.from, t: a.to, n: a.note || '' }); }
      else if (a.type === 'replace') { const list = affectedShifts({ emp: a.emp, k: 'krank', f: a.from, t: a.to }); if (list.length) autoReplace(list); }
      else if (a.type === 'assign') assignShift(A.wk, a.shift, a.emp);
      else if (a.type === 'unassign') unassignShift(A.wk, a.shift);
      else if (a.type === 'event') saveEvent({ id: C.uid('ev'), d: a.date, name: a.name, k: a.kind, s: a.start, e: a.end, g: a.guests, svc: false, loc: '', n: '' });
      else if (a.type === 'guests') { const wk = C.wkId(a.date); setDayInfo(wk, a.date, { g: a.guests }); }
      else if (a.type === 'avail') { const e = clone(emp(a.emp)); const av = e.av ? e.av.slice() : [0, 1, 2, 3, 4, 5, 6].map(() => ({ f: '00:00', t: '24:00' })); for (const d of a.dow) av[d] = a.from ? { f: a.from, t: a.to || '24:00' } : null; e.av = av; const map = clone(A.staff); map[e.id] = e; saveStaff(map); }
      else if (a.type === 'autoplan') runAutoPlan(a.week === 'next' ? C.wkShift(A.wk, 1) : A.wk, a.mode, 'balanced');
    } catch (err) { console.error(err); }
  }
  A.ai.log.push({ role: 'ai', text: t('ai_done') });
  render();
}
function aiMic() {
  const d = A.caps.dictation; if (!d) return;
  if (A.ai.listening) { d.stop().catch(() => {}); return; }
  if (!A.ai.dictWired) {
    A.ai.dictWired = true;
    d.onPartial(({ text }) => { const el = $('#aiText'); if (el) el.placeholder = text; });
    d.onFinal(({ text }) => { const el = $('#aiText'); if (el) { el.value = (el.value ? el.value + ' ' : '') + text; el.placeholder = t('ai_ph'); } });
    d.onState(({ state }) => { A.ai.listening = state === 'listening'; const keep = ($('#aiText') || {}).value || ''; render(); const el = $('#aiText'); if (el) el.value = keep; });
  }
  d.start().catch(e => { if (e && e.code === 'not_granted') { A.caps.dictation = null; render(); } });
}

/* ---------------- Export ---------------- */
async function saveFile(name, data) {
  const dl = A.caps.downloads;
  if (!dl) { toast(t('no_dl'), 'warn'); return false; }
  try { await dl.save({ filename: name, data }); toast(t('saved_file', { f: name }), 'ok'); return true; }
  catch (e) { if (e && e.code !== 'declined') toast(t('dl_err') + ' (' + (e.code || '?') + ')', 'err'); return false; }
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast(t('copied'), 'ok'); return true; }
  catch (e) { A.modal = { type: 'text', title: t('copy'), text: txt }; render(); return false; }
}
function planRows(m, area) {
  const list = sortedStaff(staffArr().filter(e => m.shifts.some(s => s.emp === e.id && m.dates.includes(s.d) && (!area || (s.a || roleArea(s.r)) === area)) || (e.active !== false && (!area || empArea(e) === area))));
  return list.map(e => {
    const cells = m.dates.map(d => {
      const ab = C.absenceOn(m.absBy, e.id, d);
      const sh = m.shifts.filter(s => s.emp === e.id && s.d === d && (!area || (s.a || roleArea(s.r)) === area)).sort((x, y) => C.toMin(x.s) - C.toMin(y.s));
      return { ab: ab && ab.k !== 'wunsch' ? ab : null, sh };
    });
    return { e, cells, lines: Math.max(1, ...cells.map(c => c.sh.length + (c.ab ? 1 : 0))) };
  });
}
async function planPages(m, area) {
  try { await document.fonts.load('500 12px Jost'); await document.fonts.load('600 12px Jost'); await document.fonts.load('600 20px "Playfair Display"'); } catch (e) { }
  const S = 2, PW = 1123, PH = 794, M = 28, NAMEW = 190, HEAD = 92, FOOT = 26, LH = 15;
  const colW = (PW - 2 * M - NAMEW) / 7;
  const rows = planRows(m, area);
  const pages = []; let cur = [], y = HEAD;
  for (const r of rows) { const h = 8 + r.lines * LH; if (y + h > PH - FOOT && cur.length) { pages.push(cur); cur = []; y = HEAD; } cur.push(r); y += h; }
  if (cur.length || !pages.length) pages.push(cur);
  const title = A.cfg.biz + ' – ' + t('kw', { w: +m.wk.split('-W')[1] }) + '  (' + ddmm(m.dates[0]) + '–' + ddmm(m.dates[6]) + m.dates[6].slice(0, 4) + ')' + (area ? ' – ' + L((areaById(area) || {}).name) : '');
  const canvases = [];
  pages.forEach((rowsP, pi) => {
    const cv = document.createElement('canvas'); cv.width = PW * S; cv.height = PH * S;
    const g = cv.getContext('2d'); g.scale(S, S);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, PW, PH);
    g.fillStyle = '#0F3A44'; g.font = '600 20px "Playfair Display", Georgia, serif'; g.fillText(title, M, 38);
    g.font = '500 10px Jost, Arial, sans-serif'; g.fillStyle = '#56636a';
    g.fillText(t('pdf_sub', { d: fmtDay(todayISO(), { day: '2-digit', month: '2-digit', year: 'numeric' }) }) + (m.doc && m.doc.pub ? '' : ' – ' + t('draft')), M, 56);
    g.fillText(t('page_n', { i: pi + 1, n: pages.length }), PW - M - 60, 56);
    let x = M + NAMEW;
    g.fillStyle = '#EEF3F2'; g.fillRect(M, 64, PW - 2 * M, 24);
    g.fillStyle = '#0F3A44'; g.font = '600 11px Jost, Arial, sans-serif'; g.fillText(t('employee'), M + 6, 80);
    m.dates.forEach(d => { const hol = C.holidayOf(d, A.cfg.state); g.fillStyle = hol ? '#9a3b2f' : '#0F3A44'; g.fillText(wdShort(d) + ' ' + ddmm(d) + (hol ? ' *' : ''), x + 6, 80); x += colW; });
    let yy = HEAD, lastArea = null;
    for (const r of rowsP) {
      const h = 8 + r.lines * LH, a = empArea(r.e);
      if (a !== lastArea) { lastArea = a; }
      g.strokeStyle = '#d9dfdd'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(M, yy + h); g.lineTo(PW - M, yy + h); g.stroke();
      const ac = (areaById(a) || {}).c || '#888';
      g.fillStyle = ac; g.fillRect(M, yy + 3, 3, h - 6);
      g.fillStyle = '#16262b'; g.font = '600 11px Jost, Arial, sans-serif'; g.fillText(fitText(g, r.e.name, NAMEW - 58), M + 9, yy + 4 + LH - 3);
      g.font = '500 9px Jost, Arial, sans-serif'; g.fillStyle = '#6a777c'; g.textAlign = 'right'; g.fillText(t('ct_' + r.e.ct + '_s'), M + NAMEW - 8, yy + 4 + LH - 3); g.textAlign = 'left';
      let cx = M + NAMEW;
      r.cells.forEach(c => {
        let ly = yy + 4 + LH - 3;
        if (c.ab) { g.fillStyle = '#8a5a00'; g.font = '600 10px Jost, Arial, sans-serif'; g.fillText(t('abs_' + c.ab.k), cx + 6, ly); ly += LH; }
        for (const s of c.sh) {
          g.fillStyle = (areaById(s.a || roleArea(s.r)) || {}).c || '#888'; g.fillRect(cx + 5, ly - 8, 3, 9);
          g.fillStyle = '#16262b'; g.font = '600 10px Jost, Arial, sans-serif'; const tt = s.s + '–' + s.e; g.fillText(tt, cx + 11, ly);
          const tx = cx + 11 + g.measureText(tt).width + 6;
          g.font = '500 9px Jost, Arial, sans-serif'; g.fillStyle = '#4b5a60'; g.fillText(fitText(g, roleShort(s.r), cx + colW - tx - 4), tx, ly); ly += LH;
        }
        g.strokeStyle = '#eef1f0'; g.beginPath(); g.moveTo(cx, yy); g.lineTo(cx, yy + h); g.stroke();
        cx += colW;
      });
      yy += h;
    }
    g.font = '500 9px Jost, Arial, sans-serif'; g.fillStyle = '#7a8689';
    g.fillText('* ' + t('holiday'), M, PH - 12);
    canvases.push(cv);
  });
  return canvases;
}
function fitText(g, s, w) { s = String(s || ''); if (g.measureText(s).width <= w) return s; while (s.length > 1 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
async function canvasJpeg(cv) {
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
  return new Uint8Array(await blob.arrayBuffer());
}
async function makePdf(canvases) {
  const enc = new TextEncoder(), parts = [], offs = [];
  let pos = 0;
  const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; };
  push('%PDF-1.4\n');
  const n = canvases.length, total = 2 + n * 3;
  const obj = (id, body) => { offs[id] = pos; push(id + ' 0 obj\n'); for (const b of [].concat(body)) push(b); push('\nendobj\n'); };
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [' + canvases.map((c, i) => (3 + i * 3) + ' 0 R').join(' ') + '] /Count ' + n + ' >>');
  for (let i = 0; i < n; i++) {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2, cv = canvases[i];
    const jpg = await canvasJpeg(cv);
    const content = 'q 842 0 0 595 0 0 cm /Im0 Do Q';
    obj(pid, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>');
    obj(cid, ['<< /Length ' + content.length + ' >>\nstream\n', content, '\nendstream']);
    obj(iid, ['<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n', jpg, '\nendstream']);
  }
  const xref = pos;
  let x = 'xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(x + 'trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return new Blob(parts, { type: 'application/pdf' });
}
async function exportPdf(area) {
  const m = weekModel(A.wk);
  toast(t('making_file'));
  const cvs = await planPages(m, area);
  const blob = await makePdf(cvs);
  await saveFile(fileBase(m, area) + '.pdf', blob);
}
async function exportPng(area) {
  const m = weekModel(A.wk);
  toast(t('making_file'));
  const cvs = await planPages(m, area);
  const out = document.createElement('canvas'); out.width = cvs[0].width; out.height = cvs.reduce((a, c) => a + c.height, 0);
  const g = out.getContext('2d'); let y = 0; for (const c of cvs) { g.drawImage(c, 0, y); y += c.height; }
  const blob = await new Promise(r => out.toBlob(r, 'image/png'));
  await saveFile(fileBase(m, area) + '.png', blob);
}
function fileBase(m, area) { return (t('file_plan') + '-' + m.wk + (area ? '-' + area : '')).replace(/[^\w.-]+/g, '_'); }
function csvReport() {
  const m = weekModel(A.wk), sep = ';', dec = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const head = [t('id'), t('name'), t('contract'), t('target') + ' (h)', t('planned') + ' (h)', t('diff') + ' (h)', t('night_h'), t('sun_h'), t('hol_h'), t('wage') + ' (€/h)', t('cost') + ' (€)'];
  const lines = [head.join(sep)];
  for (const e of sortedStaff(staffArr())) {
    const st = m.S[e.id] || { wh: 0, target: 0 }, c = m.empCost[e.id] || { c: 0, night: 0, sun: 0, hol: 0 };
    if (!st.wh && e.active === false) continue;
    lines.push([e.id, '"' + String(e.name).replace(/"/g, '""') + '"', e.ct, dec(st.target), dec(st.wh), dec(st.wh - st.target), dec(c.night), dec(c.sun), dec(c.hol), dec(+e.wage || 0), dec(c.c)].join(sep));
  }
  return '﻿' + lines.join('\r\n');
}
async function backupData() {
  const out = { app: 'nirvana-schichtplan', v: 1, at: new Date().toISOString(), cfg: A.cfg, staff: A.staff, abs: A.abs, evt: A.evt, weeks: {}, stats: A.stats, sent: {} };
  if (A.mode === 'local' || !Store.db) { out.weeks = A.weeks; out.sent = A.sent; }
  else {
    try { const qs = await Store.db.collection('weeks').get(); for (const d of qs.docs) out.weeks[d.id] = d.data(); } catch (e) { out.weeks = A.weeks; }
    try { const qs = await Store.db.collection('sent').get(); for (const d of qs.docs) out.sent[d.id] = d.data(); } catch (e) { out.sent = A.sent; }
  }
  return out;
}
async function restoreData(d) {
  if (!guard()) return;
  A.cfg = d.cfg; A.staff = d.staff || {}; A.abs = d.abs || {}; A.evt = d.evt || {}; A.weeks = d.weeks || {}; A.stats = d.stats || {}; A.sent = d.sent || {};
  if (A.mode === 'empty') A.mode = Store.db ? 'db' : 'local';
  Store.write('app/config', A.cfg); Store.write('app/staff', { emp: A.staff });
  for (const y in A.abs) Store.write('abs/' + y, { y: +y, list: A.abs[y] });
  for (const y in A.evt) Store.write('evt/' + y, { y: +y, list: A.evt[y] });
  for (const w in A.weeks) { if (A.weeks[w]) { Store.write('weeks/' + w, A.weeks[w]); await sleep(40); } }
  for (const w in A.stats) { Store.write('stats/' + w, A.stats[w]); await sleep(40); }
  for (const w in A.sent) { if (A.sent[w]) Store.write('sent/' + w, A.sent[w]); }
  bump(); render(); toast(t('restored'), 'ok');
}

/* ---------------- Gmail-Versand ---------------- */
async function sendMail(e, text, subject) {
  const mcp = A.caps.mcp; if (!mcp) throw { code: 'not_granted' };
  return mcp.callTool('Gmail', 'send_message', { to: [e.email], subject, body: text });
}
async function mailAll(ids) {
  const m = weekModel(A.wk);
  const rows = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).filter(r => ids.includes(r.e.id));
  let ok = 0;
  for (const r of rows) {
    try {
      await sendMail(r.e, r.text, A.cfg.biz + ' – ' + (A.sendMode === 'day' ? t('mail_subj_day') : t('mail_subj_week', { w: +A.wk.split('-W')[1] })));
      markSent(A.wk, r.e.id, A.sendMode === 'day' ? 'day' : 'week', { ch: 'mail', d: A.sendDay }); ok++;
      await sleep(400);
    } catch (err) {
      const code = err && err.code;
      if (code === 'server_not_connected' || code === 'needs_reauth') { toast(t('gmail_missing'), 'err'); break; }
      if (code === 'approval_required' || code === 'not_in_manifest') { toast(t('gmail_approval'), 'warn'); break; }
      toast(t('mail_fail', { n: r.e.name }), 'err'); break;
    }
  }
  if (ok) toast(t('mail_ok', { n: ok }), 'ok');
}

/* ---- Anmeldung und Zugänge (eigene Domain) ---- */
function pwFld(id, label, ac, gen) {
  return '<label class="fld"><span>' + esc(label) + '</span><span class="pwrow"><input id="' + id + '" type="password" autocomplete="' + ac + '" autocapitalize="off" spellcheck="false">' +
    (gen ? '<button class="btn sm" type="button" data-a="pw-gen" data-for="' + id + '">' + esc(t('pw_suggest')) + '</button>' : '') + '</span></label>';
}
function genPw() {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint8Array(12);
  crypto.getRandomValues(r);
  const s = Array.from(r, x => abc[x % abc.length]).join('');
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
}
const ERR_KEYS = { login_bad: 'login_bad', locked: 'login_locked', unavailable: 'login_off', setup_bad: 'setup_bad', name_bad: 'name_bad', pass_short: 'pass_short', name_taken: 'name_taken', last_admin: 'last_admin', already: 'setup_already', permission_denied: 'err_readonly', unauthenticated: 'session_end' };
function errText(e) { const c = (e && e.code) || ''; return ERR_KEYS[c] ? t(ERR_KEYS[c]) : t('error') + (c ? ' (' + c + ')' : ''); }
const inVal = id => { const el = $('#' + id); return el ? el.value : ''; };
async function doLogin() {
  const L0 = A.login; if (!L0 || L0.busy) return;
  const name = inVal('lgName').trim(), pw = inVal('lgPass');
  L0.name = name;
  if (!name || !pw) { L0.err = t('login_bad'); render(); return; }
  L0.busy = true; L0.err = ''; render();
  try {
    const r = await Remote.api('POST', '/login', { name, password: pw });
    Remote.saveAuth(Object.assign({ token: r.token }, r.account));
    try { sessionStorage.removeItem(TRY_KEY); } catch (e) { /* egal */ }
    location.reload();
  } catch (e) { L0.busy = false; L0.err = errText(e); render(); }
}
async function doSetup() {
  const L0 = A.login; if (!L0 || L0.busy) return;
  const code = inVal('suCode').trim(), name = inVal('suName').trim(), pw = inVal('suPass'), pw2 = inVal('suPass2');
  L0.code = code; L0.name = name;
  if (name.length < 2 || name.length > 40) { L0.err = t('name_bad'); render(); return; }
  if (pw.length < 8) { L0.err = t('pass_short'); render(); return; }
  if (pw !== pw2) { L0.err = t('pass_mismatch'); render(); return; }
  L0.busy = true; L0.err = ''; render();
  try {
    const r = await Remote.api('POST', '/setup', { code, name, password: pw });
    Remote.saveAuth(Object.assign({ token: r.token }, r.account));
    location.reload();
  } catch (e) { L0.busy = false; L0.err = errText(e); if (e.code === 'already') L0.setup = true; render(); }
}
async function savePw() {
  const md = A.modal; if (!md || md.busy) return;
  const old = inVal('pwOld'), pw = inVal('pwNew'), pw2 = inVal('pwNew2');
  if (pw.length < 8) { md.err = t('pass_short'); render(); return; }
  if (pw !== pw2) { md.err = t('pass_mismatch'); render(); return; }
  md.busy = true; md.err = ''; render();
  try { await Remote.call('POST', '/password', { old, password: pw }); A.modal = null; toast(t('pw_changed'), 'ok'); }
  catch (e) { md.busy = false; md.err = e.code === 'login_bad' ? t('pw_old_bad') : errText(e); }
  render();
}
async function createAcc() {
  const md = A.modal; if (!md || md.busy) return;
  const name = inVal('anName').trim(), role = inVal('anRole') || 'edit', pw = inVal('anPass');
  md.name = name; md.role = role;
  if (name.length < 2 || name.length > 40) { md.err = t('name_bad'); render(); return; }
  if (pw.length < 8) { md.err = t('pass_short'); render(); return; }
  md.busy = true; md.err = ''; render();
  try { const r = await Remote.call('POST', '/accounts', { name, role, password: pw }); A.accounts = r.accounts; A.modal = { type: 'accdone', name, pw, isNew: true }; }
  catch (e) { md.busy = false; md.err = errText(e); }
  render();
}
async function resetAccPw() {
  const md = A.modal; if (!md || md.busy) return;
  const pw = inVal('apPass');
  if (pw.length < 8) { md.err = t('pass_short'); render(); return; }
  md.busy = true; md.err = ''; render();
  try { const r = await Remote.call('POST', '/accounts/' + md.id, { password: pw }); A.accounts = r.accounts; A.modal = { type: 'accdone', name: md.name, pw, isNew: false }; }
  catch (e) { md.busy = false; md.err = errText(e); }
  render();
}
async function updAcc(id, patch) {
  try { const r = await Remote.call('POST', '/accounts/' + id, patch); A.accounts = r.accounts; toast(t('saved'), 'ok'); }
  catch (e) { toast(errText(e), 'err'); A.accounts = null; }
  render();
}

/* ==========================================================================
   App: Klicks, Eingaben, Tastatur, Start
   ========================================================================== */
const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
const checked = id => { const el = document.getElementById(id); return !!(el && el.checked); };
const confirmBox = (title, text, fn, opt) => { A.modal = Object.assign({ type: 'confirm', title, text, fn }, opt || {}); render(); };
function openDrawer(d) { A.drawer = d; render(); const b = $('#drawer .dr-body'); if (b) b.scrollTop = 0; }
function gotoWeek(wk) { A.wk = wk; Store.subWeeks(wk); A.drawer = null; A.affected = A.affected && A.affected.list.some(x => x.wk === wk) ? A.affected : A.affected; render(); }

function collectDemandForm() {
  const cfg = clone(A.cfg);
  cfg.guests = [0, 1, 2, 3, 4, 5, 6].map(i => Math.max(0, +val('g' + i) || 0));
  cfg.spend = Math.max(0, +val('cfgSpend') || 0);
  cfg.evSpend = Math.max(0, +val('cfgEvSpend') || 0);
  cfg.target = Math.min(80, Math.max(5, +val('cfgTarget') || 32));
  for (const tr of $$('tr[data-tpl]')) {
    const tp = cfg.tpl.find(x => x.id === tr.dataset.tpl); if (!tp) continue;
    const g = k => { const el = $('[data-k="' + k + '"]', tr); return el ? (el.type === 'checkbox' ? el.checked : el.value) : null; };
    const nm = String(g('name') || '').trim();
    if (nm && nm !== L(tp.name)) { tp.name = typeof tp.name === 'object' ? Object.assign({}, tp.name, { [A.lang]: nm }) : nm; }
    tp.r = g('r') || tp.r; tp.a = roleArea(tp.r);
    if (/^\d{2}:\d{2}$/.test(g('s'))) tp.s = g('s');
    if (/^\d{2}:\d{2}$/.test(g('e'))) tp.e = g('e');
    tp.b = Math.max(0, Math.min(120, +g('b') || 0));
    tp.dem = [0, 1, 2, 3, 4, 5, 6].map(i => Math.max(0, Math.min(60, Math.round(+g('dem' + i) || 0))));
    tp.scale = !!g('scale'); tp.on = !!g('on');
    tp.months = strToMonths(g('months'));
    if (!tp.months) delete tp.months;
  }
  return cfg;
}
function readEmpForm(id) {
  const name = val('eName').trim();
  const roles = $$('input[name="eRole"]:checked').map(x => x.value);
  let primary = val('ePrimary');
  if (!roles.length && primary) roles.push(primary);
  if (!roles.includes(primary)) primary = roles[0] || '';
  const av = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const on = $$('input[name="eAvOn"]').find(x => +x.value === i);
    if (on && !on.checked) return null;
    const f = val('eAvF' + i), tt = val('eAvT' + i);
    if (!f && !tt) return { f: '00:00', t: '24:00' };
    let tm = tt || '24:00';
    if (tt && f && C.toMin(tt) <= C.toMin(f)) tm = C.fromMin(C.toMin(tt)).replace(/^(\d\d)/, h => String(+h + 24));
    return { f: f || '00:00', t: tm };
  });
  const allOpen = av.every(a => a && a.f === '00:00' && a.t === '24:00');
  const ct = val('eCt');
  const e = Object.assign({}, id ? emp(id) : {}, {
    id: id || C.uid('e'), name, active: checked('eActive'), roles, primary, ct,
    wh: ct === 'MJ' || ct === 'AH' ? 0 : Math.max(0, +val('eWh') || 0), wage: Math.max(0, +val('eWage') || 0),
    maxD: Math.max(1, Math.min(7, +val('eMaxD') || C.defaultMaxDays(ct))), birth: val('eBirth'), school: $$('input[name="eSchool"]:checked').map(x => +x.value),
    pref: val('ePref'), split: checked('eSplit'), phone: val('ePhone').trim(), email: val('eEmail').trim(), ch: val('eCh'), lang: val('eLang'),
    start: val('eStart'), end: val('eEnd'), note: val('eNote').trim(), locs: (id && emp(id) && emp(id).locs) || ((A.cfg.locs || [])[0] ? [A.cfg.locs[0].id] : [])
  });
  if (allOpen) delete e.av; else e.av = av;
  delete e.demo;
  return e;
}
function readSettings() {
  const c = clone(A.cfg);
  c.biz = val('sBiz').trim() || c.biz; c.state = val('sState') || c.state; c.lang = val('sLang') || c.lang;
  c.rules = Object.assign({}, c.rules, {
    rest: +val('rRest') || 11, rest10: checked('rRest10'), maxDay: +val('rMaxDay') || 10, maxWeek: +val('rMaxWeek') || 48, maxRun: +val('rRun') || 6,
    sun15: checked('rSun'), minFreeSun: Math.max(0, +val('rMinFree') || 0), holAsSun: checked('rHolSun'), youthUntil: val('rYouth') || '22:00'
  });
  c.law = { minWage: +val('lMinWage') || null, minijob: +val('lMinijob') || null };
  c.sur = { on: checked('sOn'), nightFrom: val('sNightFrom') || '22:00', night: +val('sNight') || 0, sun: +val('sSun') || 0, hol: +val('sHol') || 0, x150: +val('sX150') || 0 };
  c.fac = {}; for (const ct of CTS) c.fac[ct] = Math.max(1, +val('f' + ct) || 1.21);
  c.evr = Object.assign({}, c.evr); for (const k of ['svc', 'kit', 'dish', 'bar', 'leadFrom', 'catKit', 'catDrv', 'catSvc']) { const v = +val('e_' + k); if (v > 0) c.evr[k] = v; }
  return c;
}
function needSendIds() {
  const m = weekModel(A.wk);
  return sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).filter(r => r.reach && r.ch !== 'mail' && !r.sent).map(r => r.e.id);
}
function updEmp(id, patch) {
  const map = clone(A.staff); if (!map[id]) return;
  Object.assign(map[id], patch); saveStaff(map);
}

const ACT = {
  tab: (el, ev) => { ev.preventDefault(); A.view = el.dataset.v; A.drawer = null; if (location.hash !== '#' + A.view) location.hash = A.view; render(); window.scrollTo(0, 0); },
  lang: el => { A.lang = el.dataset.l; lsSet('sp-lang', A.lang); bump(); render(); },
  'wk-prev': () => gotoWeek(C.wkShift(A.wk, -1)),
  'wk-next': () => gotoWeek(C.wkShift(A.wk, 1)),
  'wk-today': () => gotoWeek(C.wkId(todayISO())),
  pv: el => { A.planView = el.dataset.v; render(); },
  area: el => { A.area = el.dataset.v; render(); },
  dayidx: el => { A.dayIdx = +el.dataset.i; render(); },
  day: el => openDrawer({ type: 'day', wk: A.wk, d: el.dataset.d }),
  shift: el => openDrawer({ type: 'shift', wk: A.wk, id: el.dataset.id }),
  cell: el => { if (A.canWrite) openDrawer({ type: 'cell', wk: A.wk, emp: el.dataset.emp, d: el.dataset.d }); },
  emp: el => openDrawer({ type: 'emp', id: el.dataset.id }),
  'emp-new': () => openDrawer({ type: 'emp', id: null }),
  issues: () => openDrawer({ type: 'issues', wk: A.wk }),
  'open-first': () => { const m = weekModel(A.wk); const s = m.shifts.find(x => !x.emp && m.dates.includes(x.d)); if (s) openDrawer({ type: 'shift', wk: A.wk, id: s.id }); },
  close: () => { A.drawer = null; render(); },
  mclose: () => { A.modal = null; render(); },
  undo: () => undo(),
  'copy-prev': () => { A.modal = { type: 'copyprev' }; render(); },
  'copy-run': () => { const f = checked('cpFill'); A.modal = null; copyPrevWeek(A.wk, f); },
  publish: () => {
    const m = weekModel(A.wk), on = !(m.doc && m.doc.pub);
    if (!on) return confirmBox(t('unpublish'), t('unpub_q'), () => publishWeek(A.wk, false));
    publishWeek(A.wk, true); toast(t('pub_toast'), 'ok');
  },
  autoplan: () => { if (guard()) { A.modal = { type: 'autoplan' }; render(); } },
  'ap-run': () => { const s = ($('input[name="apS"]:checked') || {}).value || 'balanced', mo = ($('input[name="apM"]:checked') || {}).value || 'fill'; A.modal = null; render(); setTimeout(() => runAutoPlan(A.wk, mo, s, Math.floor(Math.random() * 1e9)), 20); },
  'apply-demand': () => { const r = applyDemand(A.wk); if (r) toast(t('demand_applied', { p: r.added, m: r.removed }), 'ok'); },
  export: () => { A.modal = { type: 'export' }; render(); },
  'ex-pdf': () => exportPdf(val('exArea')),
  'ex-png': () => exportPng(val('exArea')),
  csv: () => { const txt = csvReport(); if (A.caps.downloads) saveFile(t('file_payroll') + '-' + A.wk + '.csv', txt); else copyText(txt); },
  'team-text': () => copyText(teamText(weekModel(A.wk))),
  assign: el => { const empId = el.dataset.emp; assignShift(A.drawer && A.drawer.wk || A.wk, el.dataset.id, empId); if (A.drawer && A.drawer.type === 'cell') A.drawer = null; toast(t('assigned', { n: (emp(empId) || {}).name || '' }), 'ok'); render(); },
  unassign: el => unassignShift(A.drawer.wk, el.dataset.id),
  lock: el => toggleLock(A.drawer.wk, el.dataset.id),
  'shift-save': el => {
    const s = val('shS'), e = val('shE'), b = Math.max(0, Math.min(120, +val('shB') || 0)), n = val('shN').trim();
    if (!/^\d{2}:\d{2}$/.test(s) || !/^\d{2}:\d{2}$/.test(e)) return toast(t('bad_time'), 'err');
    editShift(A.drawer.wk, el.dataset.id, { s, e, b, n }); toast(t('saved'), 'ok');
  },
  'shift-del': el => confirmBox(t('shift_delete'), t('shift_del_q'), () => { deleteShift(A.drawer.wk, el.dataset.id); A.drawer = null; render(); }, { danger: true, ok: t('delete') }),
  'cell-add': el => {
    const tpl = val('cellTpl'), d = el.dataset.d, e = el.dataset.emp;
    if (tpl) addShift(A.drawer.wk, d, { tpl }, e);
    else { const s = val('cellS'), en = val('cellE'); if (!/^\d{2}:\d{2}$/.test(s) || !/^\d{2}:\d{2}$/.test(en)) return toast(t('bad_time'), 'err'); addShift(A.drawer.wk, d, { r: val('cellRole'), s, e: en }, e); }
    A.drawer = null; render();
  },
  'cell-abs': el => {
    const a = addAbsence({ emp: el.dataset.emp, k: el.dataset.k, f: el.dataset.d, t: el.dataset.d, n: '' });
    const aff = affectedShifts(a);
    if (aff.length) { A.drawer = { type: 'shift', wk: aff[0].wk, id: aff[0].id }; toast(t('abs_saved_repl'), 'warn'); }
    else { A.drawer = null; toast(t('abs_saved'), 'ok'); }
    render();
  },
  'abs-add': () => {
    const a = { emp: val('absEmp'), k: val('absKind'), f: val('absFrom'), t: val('absTo'), n: val('absNote').trim() };
    if (!a.emp || !a.f || !a.t) return toast(t('fill_req'), 'err');
    if (a.t < a.f) { const x = a.f; a.f = a.t; a.t = x; }
    const saved = addAbsence(a);
    const aff = affectedShifts(saved);
    A.affected = aff.length ? { a: saved, list: aff } : null;
    toast(aff.length ? t('abs_saved_repl') : t('abs_saved'), aff.length ? 'warn' : 'ok'); render();
  },
  'abs-del': el => { removeAbsence(el.dataset.id); if (A.drawer && A.drawer.type === 'cell') render(); },
  'aff-open': el => { const wk = el.dataset.wk; if (wk !== A.wk) { A.wk = wk; Store.subWeeks(wk); } openDrawer({ type: 'shift', wk, id: el.dataset.id }); },
  'aff-auto': () => { const l = A.affected.list; A.affected = null; autoReplace(l); },
  'aff-close': () => { A.affected = null; render(); },
  'emp-save': el => {
    const e = readEmpForm(el.dataset.id || '');
    if (!e.name) return toast(t('name_req'), 'err');
    if (!e.roles.length) return toast(t('role_req'), 'err');
    const map = clone(A.staff || {}); map[e.id] = e; saveStaff(map);
    A.drawer = null; render(); toast(t('saved'), 'ok');
  },
  'emp-del': el => confirmBox(t('delete'), t('emp_del_q', { n: (emp(el.dataset.id) || {}).name }), () => {
    const id = el.dataset.id, map = clone(A.staff); delete map[id]; saveStaff(map);
    for (const wk in A.weeks) { const doc = A.weeks[wk]; if (doc && (doc.shifts || []).some(s => s.emp === id && s.d >= todayISO())) mutWeek(wk, d => { for (const s of d.shifts) if (s.emp === id && s.d >= todayISO()) { s.emp = null; if (s.b0 != null) s.b = s.b0; } }, { noUndo: true }); }
    A.drawer = null; render();
  }, { danger: true, ok: t('delete') }),
  import: () => { A.modal = { type: 'import', text: '', rows: [] }; render(); },
  'imp-parse': () => { const text = val('impText'); A.modal = { type: 'import', text, rows: parseImport(text) }; render(); },
  'imp-go': () => {
    const rows = (A.modal && A.modal.rows) || []; if (!rows.length) return;
    const map = clone(A.staff || {});
    for (const r of rows) { const id = C.uid('e'); map[id] = { id, name: r.name, active: true, roles: r.roles, primary: r.roles[0], ct: r.ct, wh: r.ct === 'MJ' || r.ct === 'AH' ? 0 : r.wh, wage: r.wage || C.minWage(+todayISO().slice(0, 4), A.cfg), lang: r.lang, ch: r.phone ? 'wa' : (r.email ? 'mail' : 'wa'), phone: r.phone, email: r.email, pref: '', maxD: null, split: false, birth: '', school: [], locs: [(A.cfg.locs || [{ id: '' }])[0].id], note: '' }; }
    saveStaff(map); A.modal = null; render(); toast(t('imp_done', { n: rows.length }), 'ok');
  },
  'tpl-add': () => { const c = collectDemandForm(); const r = (c.roles || [])[0] || { id: 'service', a: 'service' }; c.tpl.push({ id: C.uid('t'), name: { de: 'Neue Schicht', tr: 'Yeni vardiya', en: 'New shift' }, r: r.id, a: r.a, s: '10:00', e: '18:00', b: 30, dem: [1, 1, 1, 1, 1, 1, 1] }); saveCfg(c); },
  'tpl-del': el => { const c = collectDemandForm(); c.tpl = c.tpl.filter(x => x.id !== el.dataset.id); saveCfg(c); toast(t('deleted'), 'ok'); },
  'cfg-save-demand': () => { saveCfg(collectDemandForm()); toast(t('saved_demand'), 'ok'); },
  'event-new': el => openDrawer({ type: 'event', id: null, d: el.dataset.d || todayISO() }),
  'event-edit': el => openDrawer({ type: 'event', id: el.dataset.id }),
  'event-save': el => {
    const ev = { id: el.dataset.id || C.uid('ev'), d: val('evD'), name: val('evName').trim() || t('ev_' + val('evK')), k: val('evK'), s: val('evS') || '18:00', e: val('evE') || '23:00', g: Math.max(1, Math.round(+val('evG') || 0)), svc: checked('evSvc'), loc: (A.cfg.locs || [{ id: '' }])[0].id, n: val('evN').trim() };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.d)) return toast(t('fill_req'), 'err');
    saveEvent(ev); A.drawer = null; render(); toast(t('ev_saved', { x: needText(ev) }), 'ok');
  },
  'event-del': el => confirmBox(t('delete'), t('ev_del_q'), () => { deleteEvent(el.dataset.id); A.drawer = null; render(); }, { danger: true, ok: t('delete') }),
  'special-toggle': el => { const off = new Set(A.cfg.specOff || []); if (el.checked) off.delete(el.dataset.id); else off.add(el.dataset.id); saveCfg({ specOff: [...off] }); },
  'special-add': () => { A.modal = { type: 'special' }; render(); },
  'special-save': () => {
    const name = val('spName').trim(), from = val('spFrom'), to = val('spTo') || from;
    if (!name || !from) return toast(t('fill_req'), 'err');
    const list = clone(A.cfg.specials || []); list.push({ id: C.uid('sp'), name, from: from <= to ? from : to, to: from <= to ? to : from, fDay: +val('spFd') || 1, fEve: +val('spFe') || 1 });
    A.modal = null; saveCfg({ specials: list });
  },
  'special-del': el => saveCfg({ specials: (A.cfg.specials || []).filter(x => x.id !== el.dataset.id) }),
  'send-mode': el => { A.sendMode = el.dataset.v; render(); },
  queue: () => { const ids = needSendIds(); if (!ids.length) return toast(t('queue_done'), 'ok'); A.modal = { type: 'queue', ids, i: 0 }; render(); },
  'queue-send': el => { markSent(A.wk, el.dataset.id, A.sendMode === 'day' ? 'day' : 'week', { ch: 'wa', d: A.sendDay || C.addDays(todayISO(), 1) }); setTimeout(() => { if (A.modal && A.modal.type === 'queue') { A.modal.i++; render(); } }, 250); },
  'queue-skip': () => { A.modal.i++; render(); },
  'sent-link': el => { markSent(A.wk, el.dataset.id, A.sendMode === 'day' ? 'day' : 'week', { ch: el.dataset.ch, d: A.sendDay || C.addDays(todayISO(), 1) }); },
  'copy-msg': el => { const m = weekModel(A.wk); const r = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).find(x => x.e.id === el.dataset.id); if (r) copyText(r.text); },
  'toggle-sent': el => { const m = weekModel(A.wk); const r = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).find(x => x.e.id === el.dataset.id); if (!r) return; if (r.sent) unmarkSent(A.wk, r.e.id, A.sendMode === 'day' ? 'day' : 'week', A.sendDay || C.addDays(todayISO(), 1)); else markSent(A.wk, r.e.id, A.sendMode === 'day' ? 'day' : 'week', { ch: 'manual', d: A.sendDay || C.addDays(todayISO(), 1) }); },
  'mail-one': async el => { const m = weekModel(A.wk); const r = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).find(x => x.e.id === el.dataset.id); if (r) await mailAll([r.e.id]); },
  'mail-all': () => { const m = weekModel(A.wk); const ids = sendRows(m, A.sendMode, A.sendDay || C.addDays(todayISO(), 1)).filter(r => r.ch === 'mail' && r.e.email && !r.sent).map(r => r.e.id); confirmBox(t('mail_all', { n: ids.length }), t('mail_q', { n: ids.length }), () => mailAll(ids), { ok: t('send') }); },
  'notify-save': () => { const n = Object.assign({}, A.cfg.notify || {}, { weekDay: +val('nWeekDay'), weekTime: val('nWeekTime') || '18:00', daily: checked('nDaily'), dailyTime: val('nDailyTime') || '10:00', footer: {} }); for (const l of MSG_LANGS) { const v = val('foot_' + l).trim(); if (v) n.footer[l] = v; } saveCfg({ notify: n }); toast(t('saved'), 'ok'); },
  'cfg-save': () => { saveCfg(readSettings()); toast(t('saved'), 'ok'); },
  'sur-3b': () => { const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; }; set('sNightFrom', '20:00'); set('sNight', 25); set('sSun', 50); set('sHol', 125); set('sX150', 150); const on = document.getElementById('sOn'); if (on) on.checked = true; toast(t('sur_3b_set'), 'ok'); },
  'login-go': () => doLogin(),
  'setup-go': () => doSetup(),
  'login-retry': () => Store.showLogin(),
  'try-local': () => { try { sessionStorage.setItem(TRY_KEY, '1'); } catch (e) { /* egal */ } location.reload(); },
  'to-login': () => { try { sessionStorage.removeItem(TRY_KEY); } catch (e) { /* egal */ } location.reload(); },
  'logout': () => Store.logout(),
  'pw-open': () => { A.modal = { type: 'pw' }; render(); },
  'pw-save': () => savePw(),
  'pw-gen': el => { const inp = $('#' + el.dataset.for); if (inp) { inp.value = genPw(); inp.type = 'text'; inp.focus(); } },
  'acc-new': () => { A.modal = { type: 'accnew' }; render(); },
  'acc-create': () => createAcc(),
  'acc-pw': el => { const a = (A.accounts || []).find(x => x.id === +el.dataset.id); if (a) { A.modal = { type: 'accpw', id: a.id, name: a.name }; render(); } },
  'accpw-save': () => resetAccPw(),
  'acc-toggle': el => { const a = (A.accounts || []).find(x => x.id === +el.dataset.id); if (a) updAcc(a.id, { active: !a.active }); },
  'copy-login': el => copyText(el.dataset.v),
  'import-local': () => { const d = A.localOffer; if (d) { A.localOffer = null; restoreData(d); } },
  'backup-dl': async () => { const d = await backupData(); if (await saveFile(t('file_backup') + '-' + todayISO() + '.json', JSON.stringify(d))) { lsSet(BACKUP_KEY, todayISO()); render(); } },
  'backup-copy': async () => { const d = await backupData(); if (await copyText(JSON.stringify(d))) { lsSet(BACKUP_KEY, todayISO()); render(); } },
  'demo-end': () => { A.modal = { type: 'demoend' }; render(); },
  'demo-wipe': () => { A.modal = null; wipeData(true); A.view = 'team'; location.hash = 'team'; },
  'wipe-all': () => confirmBox(t('wipe_all'), t('wipe_q'), () => wipeData(false), { danger: true, ok: t('wipe_all') }),
  'restore-go': () => { const d = A.modal.data; A.modal = null; restoreData(d); },
  'onb-demo': () => { const biz = val('onbBiz').trim(); loadDemo().then(() => { if (biz && biz !== A.cfg.biz) saveCfg({ biz }); }); },
  'onb-empty': () => startEmpty(val('onbBiz').trim()),
  'confirm-ok': () => { const fn = A.modal && A.modal.fn; A.modal = null; render(); if (fn) fn(); },
  'copy-mtext': () => { const el = $('#mText'); if (el) { el.select(); copyText(el.value); } },
  'ai-open': () => { A.ai.open = true; render(); const el = $('#aiText'); if (el) el.focus(); },
  'ai-close': () => { A.ai.open = false; render(); },
  'ai-send': () => aiSend(val('aiText')),
  'ai-stop': () => { if (A.ai.ctl) A.ai.ctl.abort(); },
  'ai-ex': el => { const ta = $('#aiText'); if (ta) { ta.value = t(el.dataset.k); ta.focus(); } },
  'ai-run': () => aiRun(),
  'ai-drop': () => { A.ai.plan = null; render(); },
  'ai-mic': () => aiMic()
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) { if (A.drawer && ev.target.closest('#modal') && !ev.target.closest('.mo-card')) { A.modal = null; render(); } return; }
  if (el.tagName === 'INPUT' && el.type === 'checkbox' && el.dataset.a !== 'special-toggle') return;
  if (el.tagName === 'FORM') return;
  const fn = ACT[el.dataset.a];
  if (!fn) return;
  if (el.tagName === 'BUTTON') ev.preventDefault();
  try { fn(el, ev); } catch (e) { console.error(e); toast(t('error') + ': ' + (e && e.message || e), 'err'); }
});
document.addEventListener('input', ev => {
  const f = ev.target.dataset && ev.target.dataset.f;
  if (f === 'q') { A.q = ev.target.value; render(); }
  else if (f === 'tq') { A.tq = ev.target.value; render(); }
});
document.addEventListener('change', ev => {
  const el = ev.target, f = el.dataset && el.dataset.f;
  if (!f) return;
  if (f === 'tct') { A.tct = el.value; render(); }
  else if (f === 'sendDay') { A.sendDay = el.value; render(); }
  else if (f === 'acc-role') updAcc(+el.dataset.id, { role: el.value });
  else if (f === 'emp-lang') updEmp(el.dataset.id, { lang: el.value });
  else if (f === 'emp-ch') updEmp(el.dataset.id, { ch: el.value });
  else if (f === 'emp-phone') updEmp(el.dataset.id, { phone: el.value.trim() });
  else if (f === 'emp-email') updEmp(el.dataset.id, { email: el.value.trim() });
  else if (f === 'backup-file') {
    const file = el.files && el.files[0]; if (!file) return;
    file.text().then(txt => {
      let d = null; try { d = JSON.parse(txt); } catch (e) { }
      if (!d || d.app !== 'nirvana-schichtplan' || !d.cfg) return toast(t('bad_backup'), 'err');
      A.modal = { type: 'restore', data: d }; render();
    });
  }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') {
    if (A.modal) { A.modal = null; render(); }
    else if (A.drawer) { A.drawer = null; render(); }
    else if (A.ai.open) { A.ai.open = false; render(); }
    return;
  }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('tr[data-a],[tabindex][data-a]')) { ev.preventDefault(); ev.target.click(); }
  if (ev.key === 'Enter' && ev.target.id === 'aiText' && !ev.shiftKey) { ev.preventDefault(); aiSend(ev.target.value); }
  if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.enter && ACT[ev.target.dataset.enter]) { ev.preventDefault(); ACT[ev.target.dataset.enter](ev.target, ev); }
});
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.some(([id]) => id === h) && h !== A.view) { A.view = h; A.drawer = null; render(); } });

/* Tooltip für Diagramme */
document.addEventListener('pointerover', ev => { const el = ev.target.closest && ev.target.closest('[data-tip]'); const tip = $('#tip'); if (!tip) return; if (el) { tip.textContent = el.dataset.tip; tip.hidden = false; } });
document.addEventListener('pointermove', ev => { const tip = $('#tip'); if (!tip || tip.hidden) return; const x = Math.min(window.innerWidth - tip.offsetWidth - 8, ev.clientX + 14), y = Math.min(window.innerHeight - tip.offsetHeight - 8, ev.clientY + 14); tip.style.transform = 'translate(' + x + 'px,' + y + 'px)'; });
document.addEventListener('pointerout', ev => { const el = ev.target.closest && ev.target.closest('[data-tip]'); const tip = $('#tip'); if (el && tip) tip.hidden = true; });

/* Fokus beim Neuzeichnen behalten */
const _render = render;
render = function () {
  const a = document.activeElement, id = a && a.id, pos = a && typeof a.selectionStart === 'number' ? [a.selectionStart, a.selectionEnd] : null;
  const keepVals = {};
  for (const el of $$('#ai textarea, #drawer input, #drawer select, #drawer textarea')) if (el.id && el.type !== 'checkbox' && el.type !== 'radio') keepVals[el.id] = el.value;
  _render();
  if (A.keepDrawerVals) for (const k in keepVals) { const el = document.getElementById(k); if (el) el.value = keepVals[k]; }
  const ta = $('#aiText'); if (ta && keepVals.aiText) ta.value = keepVals.aiText;
  if (id) { const el = document.getElementById(id); if (el && el !== document.activeElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) { el.focus(); if (pos && el.setSelectionRange) try { el.setSelectionRange(pos[0], pos[1]); } catch (e) { } } }
};

function init() {
  document.addEventListener('submit', e => e.preventDefault(), true);   // Formulare nie abschicken (keine Inline-Handler wegen CSP)
  window.addEventListener('beforeunload', e => { if (A.pending > 0 && Store.db && Store.db.remote) { e.preventDefault(); e.returnValue = ''; } });
  if (IS_WEB && 'serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline-Hülle weiter */ });
  }
  const h = location.hash.slice(1);
  if (TABS.some(([id]) => id === h)) A.view = h;
  A.lang = pickLang();
  render();
  Store.start();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
