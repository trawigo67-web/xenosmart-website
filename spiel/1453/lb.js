/* Buko Games – Puan Tablosu (Supabase, Frankfurt)
   Kullanım:  BukoLB.open({game:'blok', score:()=>SAVE.hi, unit:'puan'})
   Oyunlar:   '1453' · 'disfirlat' · 'blok' · 'batak'                       */
(function(){
  const CFG = window.BUKO_LB_CFG || { url: 'https://itrdtnftppscgusugmfy.supabase.co', key: 'sb_publishable_5meGoR4G9XMFPWiNOXXTZg_o8cyFkfJ' };
  const NAMES = { '1453':'1453 Surları Yık', disfirlat:'Diş Fırlat', blok:'Neon Blok', batak:'Neon Batak' };
  const L = {
    tr:{title:'PUAN TABLOSU', week:'Bu hafta', all:'Tüm zamanlar', you:'Senin rekorun', name:'Takma adın', send:'Tabloya yaz', sent:'Kaydedildi! Sıran: ', empty:'Henüz kimse yok – ilk sen ol!', err:'Bağlantı yok, sonra tekrar dene.', bad:'Bu isim kullanılamaz.', short:'En az 2 harf yaz.', close:'Kapat', none:'Önce bir puan kazan!', note:'Sadece takma ad ve puan kaydedilir.', wait:'Biraz bekle, sonra tekrar dene.', me:'SEN'},
    de:{title:'BESTENLISTE', week:'Diese Woche', all:'Alle Zeiten', you:'Dein Rekord', name:'Spitzname', send:'Eintragen', sent:'Gespeichert! Platz: ', empty:'Noch niemand – sei der Erste!', err:'Keine Verbindung, bitte später erneut.', bad:'Dieser Name ist nicht erlaubt.', short:'Mindestens 2 Zeichen.', close:'Schließen', none:'Hol dir zuerst Punkte!', note:'Gespeichert werden nur Spitzname und Punkte.', wait:'Kurz warten, dann erneut versuchen.', me:'DU'},
    en:{title:'LEADERBOARD', week:'This week', all:'All time', you:'Your best', name:'Nickname', send:'Submit', sent:'Saved! Your rank: ', empty:'Nobody yet – be the first!', err:'No connection, try again later.', bad:'This name is not allowed.', short:'At least 2 characters.', close:'Close', none:'Score some points first!', note:'Only nickname and score are stored.', wait:'Please wait a moment.', me:'YOU'}
  };
  const BAD = ['amk','amina','aminakoy','orospu','oç','pic','piç','sik','yarak','göt','got','ibne','kahpe','pezevenk','gavat','yavsak','yavşak','sürtük','fuck','shit','bitch','cunt','nigger','nigga','fotze','hure','wichser','schlampe','arschloch','hitler','nazi','porn','sex'];
  const norm = s => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g,'').replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s');
  const isBad = s => { const n = norm(s); return BAD.some(w => n.includes(norm(w))); };
  const lang = () => { const l=(document.documentElement.lang||'tr').slice(0,2); return L[l]?l:'tr'; };
  const T = k => L[lang()][k];
  function device(){ try{ let d=localStorage.getItem('bukoDevice'); if(!d){ d=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()); localStorage.setItem('bukoDevice',d); } return d; }catch(e){ return 'nostore'; } }
  const myName = () => { try{ return localStorage.getItem('bukoName')||''; }catch(e){ return ''; } };
  const ready = () => /^https:/.test(CFG.url);
  async function rpc(fn, body){
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {method:'POST', headers:Object.assign({'apikey':CFG.key,'Content-Type':'application/json'}, CFG.key.startsWith('sb_')?{}:{'Authorization':'Bearer '+CFG.key}), body:JSON.stringify(body)});
    if (!r.ok){ const t=await r.text(); const e=new Error(t); e.status=r.status; throw e; }
    return r.json();
  }
  const top = (game, period, limit=20) => rpc('top_scores', {p_game:game, p_period:period, p_limit:limit, p_device:device()});
  const submit = (game, name, score) => rpc('submit_score', {p_game:game, p_name:name, p_score:Math.floor(score), p_device:device()});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const CSS = `
  #bukoLB{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-family:inherit;padding:calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom))}
  #bukoLB .lb{width:min(440px,96vw);max-height:92vh;max-height:92dvh;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;color:#fff;background:linear-gradient(160deg,var(--lb1,#1f8a6a),var(--lb2,#16234f));border:1px solid rgba(255,255,255,.3);box-shadow:0 20px 60px rgba(0,0,0,.5);animation:lbIn .3s cubic-bezier(.2,1.3,.4,1)}
  @keyframes lbIn{from{transform:scale(.85);opacity:0}}
  #bukoLB .hd{padding:16px 18px 8px;text-align:center}
  #bukoLB h3{margin:0;font-size:26px;letter-spacing:2px;font-weight:900}
  #bukoLB .gm{font-size:13px;opacity:.85;font-weight:700}
  #bukoLB .tabs{display:flex;gap:6px;justify-content:center;margin-top:10px}
  #bukoLB .tab{font:inherit;font-weight:800;font-size:14px;padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
  #bukoLB .tab.on{background:#fff;color:#13231f}
  #bukoLB ol{list-style:none;margin:0;padding:6px 12px;overflow-y:auto;flex:1;min-height:120px}
  #bukoLB li{display:flex;align-items:center;gap:10px;padding:8px 10px;margin:4px 0;border-radius:12px;background:rgba(0,0,0,.18);font-weight:800;font-size:16px}
  #bukoLB li.me{background:rgba(255,215,64,.28);box-shadow:inset 0 0 0 2px #ffd23f}
  #bukoLB .rk{width:30px;height:30px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:14px;background:rgba(255,255,255,.15)}
  #bukoLB .r1{background:linear-gradient(135deg,#fff3a0,#f2b632);color:#5a3a00}
  #bukoLB .r2{background:linear-gradient(135deg,#ffffff,#b9c3cc);color:#333}
  #bukoLB .r3{background:linear-gradient(135deg,#ffc89a,#c2702e);color:#3a1a00}
  #bukoLB .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #bukoLB .sc{font-variant-numeric:tabular-nums;color:#ffe27a}
  #bukoLB .tg{font-size:10px;padding:2px 6px;border-radius:6px;background:#ffd23f;color:#3a2a00;margin-left:6px}
  #bukoLB .msg{padding:18px;text-align:center;opacity:.9;font-weight:700}
  #bukoLB .ft{padding:12px 14px 14px;background:rgba(0,0,0,.22);border-top:1px solid rgba(255,255,255,.15)}
  #bukoLB .yr{display:flex;justify-content:space-between;font-weight:800;font-size:14px;margin-bottom:8px}
  #bukoLB .row{display:flex;gap:8px}
  #bukoLB input{flex:1;min-width:0;font:inherit;font-weight:800;font-size:16px;padding:10px 12px;border-radius:12px;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.95);color:#13231f;outline:none}
  #bukoLB .go{font:inherit;font-weight:900;font-size:15px;padding:10px 16px;border-radius:12px;border:0;background:#ffd23f;color:#3a2a00;cursor:pointer}
  #bukoLB .go:disabled{opacity:.5}
  #bukoLB .st{min-height:18px;font-size:13px;font-weight:700;margin-top:6px;text-align:center}
  #bukoLB .nt{font-size:11px;opacity:.7;text-align:center;margin-top:4px}
  #bukoLB .x{font:inherit;font-weight:800;margin-top:10px;width:100%;padding:9px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;cursor:pointer}
  #bukoLB.ott .lb{background:linear-gradient(170deg,#f4e4bc,#e7cf96);color:#1a1008;border:4px solid #1a1008;border-radius:8px;box-shadow:8px 8px 0 #1a1008}
  #bukoLB.ott h3{font-family:'Bangers',Impact,sans-serif;font-weight:400;font-size:34px;color:#b3261e;letter-spacing:3px}
  #bukoLB.ott .tab{border-color:#1a1008;color:#1a1008;background:#fff6dc;font-family:'Bangers',Impact,sans-serif;font-weight:400;letter-spacing:1px}
  #bukoLB.ott .tab.on{background:#b3261e;color:#fff}
  #bukoLB.ott li{background:rgba(255,255,255,.55);border:2px solid #1a1008}
  #bukoLB.ott li.me{background:#ffe08a}
  #bukoLB.ott .sc{color:#b3261e}
  #bukoLB.ott .rk{background:#fff6dc;border:2px solid #1a1008;color:#1a1008}
  #bukoLB.ott .ft{background:rgba(26,16,8,.08);border-color:#1a1008}
  #bukoLB.ott input{border-color:#1a1008}
  #bukoLB.ott .go{background:#b3261e;color:#fff;border:2px solid #1a1008}
  #bukoLB.ott .x{border-color:#1a1008;color:#1a1008}
  #bukoLB h3 svg{width:1.1em;height:1.1em;vertical-align:-.15em;margin-right:.25em}
  @media (max-height:560px){
    #bukoLB .lb{width:min(700px,96vw);max-height:96vh;max-height:96dvh}
    #bukoLB .hd{padding:8px 14px 4px;display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap}
    #bukoLB h3{font-size:20px} #bukoLB.ott h3{font-size:24px} #bukoLB .gm{font-size:12px}
    #bukoLB .tabs{margin-top:0}
    #bukoLB .tab{padding:4px 10px;font-size:12px}
    #bukoLB ol{min-height:60px;padding:2px 10px}
    #bukoLB li{padding:4px 8px;margin:3px 0;font-size:14px}
    #bukoLB .rk{width:24px;height:24px;font-size:12px}
    #bukoLB .ft{padding:6px 12px 8px;display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center}
    #bukoLB .yr{margin:0;flex-direction:column;font-size:12px}
    #bukoLB input{padding:7px 10px;font-size:15px} #bukoLB .go{padding:7px 12px;font-size:14px}
    #bukoLB .st{grid-column:1/3;margin:0;min-height:0} #bukoLB .nt{display:none}
    #bukoLB .x{margin:0;padding:6px 10px;width:auto;grid-column:3;grid-row:1}
    #bukoLB .row{grid-column:2}
  }`;
  const CUP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10v6a5 5 0 0 1-10 0z" fill="#f2b632"/><path d="M7 5.5H4.2a3.2 3.2 0 0 0 3.3 4.4M17 5.5h2.8a3.2 3.2 0 0 1-3.3 4.4M12 14.5v3"/><path d="M8 21h8l-1-3.5H9z" fill="#c0392b"/></svg>';
  let styled=false, period='week', opts=null;
  function close(){ const el=document.getElementById('bukoLB'); if(el) el.remove(); if(opts&&opts.onClose) opts.onClose(); }
  async function load(){
    const ol=document.querySelector('#bukoLB ol'); if(!ol) return;
    if (!ready()){ ol.innerHTML=`<div class="msg">${T('err')}</div>`; return; }
    ol.innerHTML='<div class="msg">…</div>';
    try{
      const rows=await top(opts.game, period);
      if (!rows.length){ ol.innerHTML=`<div class="msg">${T('empty')}</div>`; return; }
      ol.innerHTML=rows.map((r,i)=>`<li class="${r.me?'me':''}"><span class="rk ${i<3?'r'+(i+1):''}">${i+1}</span><span class="nm">${esc(r.name)}${r.me?`<span class="tg">${T('me')}</span>`:''}</span><span class="sc">${Number(r.score).toLocaleString(lang())}</span></li>`).join('');
    }catch(e){ ol.innerHTML=`<div class="msg">${T('err')}</div>`; }
  }
  function open(o){
    opts=o; close(); opts=o;
    if(!styled){ const st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st); styled=true; }
    const sc=Math.floor(Number(o.score&&o.score())||0);
    const el=document.createElement('div'); el.id='bukoLB'; if(o.theme) el.className=o.theme;
    if(o.colors){ el.style.setProperty('--lb1',o.colors[0]); el.style.setProperty('--lb2',o.colors[1]); }
    el.innerHTML=`<div class="lb"><div class="hd"><h3>${CUP}${T('title')}</h3><div class="gm">${NAMES[o.game]||''}</div>
      <div class="tabs"><button class="tab ${period==='week'?'on':''}" data-p="week">${T('week')}</button><button class="tab ${period==='all'?'on':''}" data-p="all">${T('all')}</button></div></div>
      <ol></ol>
      <div class="ft"><div class="yr"><span>${T('you')}</span><span>${sc.toLocaleString(lang())} ${o.unit||''}</span></div>
      <div class="row"><input maxlength="14" placeholder="${T('name')}" value="${esc(myName())}" autocomplete="nickname" enterkeyhint="send"><button class="go" ${sc>0?'':'disabled'}>${T('send')}</button></div>
      <div class="st">${sc>0?'':T('none')}</div><div class="nt">${T('note')}</div><button class="x">${T('close')}</button></div></div>`;
    document.body.appendChild(el);
    ['pointerdown','touchstart','keydown','click'].forEach(ev=>el.addEventListener(ev,e=>e.stopPropagation()));
    el.addEventListener('pointerdown',e=>{ if(e.target===el) close(); });
    el.querySelector('.x').onclick=close;
    el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ period=b.dataset.p; el.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b)); load(); });
    const inp=el.querySelector('input'), go=el.querySelector('.go'), st=el.querySelector('.st');
    const send=async()=>{
      const name=inp.value.trim().replace(/\s+/g,' ');
      if(name.length<2){ st.textContent=T('short'); return; }
      if(isBad(name)){ st.textContent=T('bad'); return; }
      if(!ready()){ st.textContent=T('err'); return; }
      go.disabled=true; st.textContent='…';
      try{ localStorage.setItem('bukoName',name); }catch(e){}
      try{ const r=await submit(o.game,name,sc); st.textContent=T('sent')+(r&&r.rank?r.rank:'?'); period='week'; el.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.p==='week')); await load(); }
      catch(e){ st.textContent = /name/i.test(e.message)?T('bad'): /wait|rate/i.test(e.message)?T('wait'):T('err'); }
      go.disabled=false;
    };
    go.onclick=send; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
    load();
  }
  window.BukoLB={open,close,top,submit,ready,device};
})();
