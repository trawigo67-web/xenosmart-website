/* 🦎 Buko Games – ortak çekirdek: jeton, günlük görevler, başarımlar, mağaza seçimi
   Tüm oyunlar ve ana sayfa bu dosyayı kullanır. Veriler sadece cihazda (localStorage 'bukoCore'). */
(function(){
  const KEY='bukoCore';
  const today=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
  let D={coins:0, day:'', tasks:[], played:[], ach:{}, owned:{back_classic:1, skin_gem:1, skin_neon:1}, sel:{back:'classic', skin:'neon'}, total:0};
  try{ Object.assign(D, JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){}
  if (!D.neonV){ D.owned=D.owned||{}; D.owned.skin_neon=1; D.sel=D.sel||{}; if (!D.sel.skin||D.sel.skin==='gem') D.sel.skin='neon'; D.neonV=1; }
  const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} };
  const lang=()=>{ try{ const l=(JSON.parse(localStorage.getItem('disfirlat2')||'{}').lang)||(navigator.language||'tr').slice(0,2); return ['tr','de','en'].includes(l)?l:'en'; }catch(e){ return 'tr'; } };

  const TASKS={
    df_perfect:{goal:10, r:40, tr:'Diş Fırlat: 10 PERFECT yap', de:'Diş Fırlat: 10× PERFECT', en:'Diş Fırlat: 10 PERFECTs'},
    df_level:  {goal:2,  r:40, tr:'Diş Fırlat: 2 seviye bitir', de:'Diş Fırlat: 2 Level schaffen', en:'Diş Fırlat: clear 2 levels'},
    bl_lines:  {goal:15, r:40, tr:'Neon Blok: 15 satır patlat', de:'Neon Block: 15 Reihen sprengen', en:'Neon Block: clear 15 lines'},
    bl_tetra:  {goal:1,  r:60, tr:'Neon Blok: 1 kez MEGA x4', de:'Neon Block: 1× MEGA x4', en:'Neon Block: 1 MEGA x4'},
    bt_tricks: {goal:15, r:40, tr:'Neon Batak: 15 el al', de:'Neon Batak: 15 Stiche holen', en:'Neon Batak: win 15 tricks'},
    bt_made:   {goal:2,  r:50, tr:'Neon Batak: 2 ihaleyi tuttur', de:'Neon Batak: 2 Gebote erfüllen', en:'Neon Batak: make 2 bids'},
    tv_win:    {goal:1,  r:60, tr:'Tavla: 1 oyun kazan', de:'Tavla: 1 Spiel gewinnen', en:'Tavla: win 1 game'},
    play3:     {goal:3,  r:60, tr:'3 farklı oyun oyna', de:'3 verschiedene Spiele spielen', en:'Play 3 different games'},
  };
  const ACH={
    first_perfect:{tr:'İlk PERFECT!', de:'Erstes PERFECT!', en:'First PERFECT!', r:20},
    df_15:{tr:'Çark Ustası – 15. seviye', de:'Zahnrad-Meister – Level 15', en:'Gear Master – level 15', r:200},
    bl_tetra:{tr:'MEGA Patlatıcı', de:'MEGA-Sprenger', en:'MEGA Blaster', r:50},
    bt_win:{tr:'Kahvehane Şampiyonu', de:'Kahvehane-Champion', en:'Tea House Champion', r:100},
    bt_13:{tr:'13 ihale tutturan efsane', de:'Legende: 13 erfüllt', en:'Legend: made 13', r:300},
    tv_win:{tr:'Tavla Ağası', de:'Tavla-Meister', en:'Tavla Master', r:100},
    rich:{tr:'1000 jeton biriktir', de:'1000 Münzen gesammelt', en:'Saved 1000 coins', r:50},
  };
  const SHOP=[
    {id:'back_classic', type:'back', price:0,   tr:'Klasik bordo',  de:'Klassisch Bordeaux', en:'Classic burgundy'},
    {id:'back_nazar',   type:'back', price:150, tr:'Nazar boncuğu', de:'Nazar-Auge',         en:'Evil eye'},
    {id:'back_neon',    type:'back', price:200, tr:'Neon',          de:'Neon',               en:'Neon'},
    {id:'back_gold',    type:'back', price:300, tr:'Altın lale',    de:'Goldene Tulpe',      en:'Golden tulip'},
    {id:'skin_neon',    type:'skin', price:0,   tr:'Neon',          de:'Neon',               en:'Neon'},
    {id:'skin_gem',     type:'skin', price:0,   tr:'Değerli taş',   de:'Edelstein',          en:'Gem'},
    {id:'skin_candy',   type:'skin', price:150, tr:'Şeker',         de:'Bonbon',             en:'Candy'},
    {id:'skin_pixel',   type:'skin', price:200, tr:'Piksel',        de:'Pixel',              en:'Pixel'},
  ];

  function rollTasks(){
    if (D.day===today() && D.tasks.length) return;
    D.day=today(); D.played=[];
    const ids=Object.keys(TASKS); let h=7; for (const ch of D.day) h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;
    const pool=ids.slice(), pick=[]; while(pick.length<3 && pool.length){ h=(Math.imul(h,1103515245)+12345)>>>0; pick.push(pool.splice((h>>>8)%pool.length,1)[0]); }
    D.tasks=pick.map(id=>({id, p:0, done:false})); save();
  }
  rollTasks();

  // --- günlük seri (her gün oynayana artan ödül) ---
  function streakInfo(){
    const t=today(), y=(()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); })();
    if (D.sDay!==t){ D.streak = (D.sDay===y) ? (D.streak||0)+1 : 1; D.sDay=t; D.claimed=false; save(); }
    const reward=20+10*Math.min((D.streak||1)-1,6);
    return {streak:D.streak, claimed:!!D.claimed, reward};
  }
  function claimDaily(){ const i=streakInfo(); if (i.claimed) return 0; D.claimed=true; D.coins+=i.reward; D.total=(D.total||0)+i.reward; save(); return i.reward; }
  streakInfo();

  // --- küçük bildirim kutusu ---
  let box=null;
  function toast(html, color){
    try{
      if (!box){ box=document.createElement('div'); const land=innerWidth>innerHeight && innerHeight<500; box.style.cssText=(land?'position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));align-items:flex-end;':'position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom));transform:translateX(-50%);align-items:center;')+'z-index:99999;display:flex;flex-direction:column;gap:6px;pointer-events:none;font-family:inherit;max-width:94vw'; document.body.appendChild(box); }
      const el=document.createElement('div');
      el.style.cssText=`font-weight:900;font-size:13px;padding:6px 12px;border-radius:999px;background:rgba(10,30,30,.82);border:1px solid ${color||'#ffd23f'};color:#fff;box-shadow:0 0 16px ${color||'#ffd23f'}66;transition:.35s;opacity:0;transform:translateY(-8px);white-space:nowrap`;
      el.innerHTML=html; box.appendChild(el);
      requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='none'; });
      setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-8px)'; setTimeout(()=>el.remove(),400); }, 1900);
    }catch(e){}
  }
  function add(n, quiet){ if(!n) return; D.coins+=n; D.total=(D.total||0)+n; save(); if(!quiet) toast(`+${n} 🪙`,'#ffd23f'); if (D.coins>=1000) ach('rich'); }
  function ev(id, n=1){
    rollTasks();
    for (const t of D.tasks){ if (t.id!==id || t.done) continue; t.p=Math.min(TASKS[id].goal, t.p+n);
      if (t.p>=TASKS[id].goal){ t.done=true; D.coins+=TASKS[id].r; D.total=(D.total||0)+TASKS[id].r; save();
        const L=lang(); toast(`✅ ${TASKS[id][L]} · +${TASKS[id].r} 🪙`,'#7dff6a'); } }
    save();
  }
  function played(game){ rollTasks(); if (!D.played.includes(game)){ D.played.push(game); save(); ev('play3'); } }
  function ach(id){ if (D.ach[id] || !ACH[id]) return; D.ach[id]=Date.now(); D.coins+=ACH[id].r; save(); const L=lang(); setTimeout(()=>toast(`🏆 ${ACH[id][L]} · +${ACH[id].r} 🪙`,'#ff9f1c'),300); }
  function buy(id){ const it=SHOP.find(x=>x.id===id); if(!it || D.owned[id]) return false; if (D.coins<it.price) return false; D.coins-=it.price; D.owned[id]=1; save(); return true; }
  function select(id){ const it=SHOP.find(x=>x.id===id); if(!it||!D.owned[id]) return; D.sel[it.type]=id.split('_')[1]; save(); }

  window.BK={ get coins(){ return D.coins; }, get data(){ return D; }, add, ev, played, ach, buy, select, toast, streakInfo, claimDaily, TASKS, ACH, SHOP, lang, rollTasks };
})();
