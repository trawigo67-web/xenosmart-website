/* 🦎 Buko Games – ortak görünüm: yazı tipleri, "Şeker 3D" ana sayfa butonları, Buko maskotu.
   Tüm oyunlar bu dosyayı yükler (1453 ve Zıpzıp: ../buko-ui.js). */
(function(){
  if (window.__bukoUI) return; window.__bukoUI=1;
  var cs=document.currentScript, base=(cs&&cs.src)?cs.src.replace(/[^\/?#]*([?#].*)?$/,''):'';
  var LAT='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  var EXT='U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  function ff(fam,w,file,r){ return "@font-face{font-family:'"+fam+"';font-style:normal;font-weight:"+w+";font-display:swap;src:url("+base+"fonts/"+file+") format('woff2');unicode-range:"+r+"}"; }
  var css=[
    ff('Lilita One',400,'lilita-one-latin-400-normal.woff2',LAT), ff('Lilita One',400,'lilita-one-latin-ext-400-normal.woff2',EXT),
    ff('Fredoka',600,'fredoka-latin-600-normal.woff2',LAT), ff('Fredoka',600,'fredoka-latin-ext-600-normal.woff2',EXT),
    ff('Fredoka',700,'fredoka-latin-700-normal.woff2',LAT), ff('Fredoka',700,'fredoka-latin-ext-700-normal.woff2',EXT),
    /* Şeker 3D buton */
    '.bk-candy{background:#FFC93C!important;color:#12301E!important;border:3px solid #12301E!important;border-radius:14px!important;box-shadow:0 4px 0 #12301E!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;text-shadow:none!important;filter:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-decoration:none!important;cursor:pointer;transition:transform .08s,box-shadow .08s!important;box-sizing:border-box!important;-webkit-tap-highlight-color:transparent}',
    '.bk-candy:active{transform:translateY(3px)!important;box-shadow:0 1px 0 #12301E!important}',
    '.bk-candy.bk-sq{min-width:40px!important;min-height:40px!important;padding:0!important}',
    '.bk-candy.bk-sq>svg.bk-ic{width:24px;height:24px;flex:none}',
    '.bk-candy.bk-txt{gap:8px;padding:9px 18px!important;border-radius:999px!important;font-family:"Lilita One",system-ui,sans-serif!important;font-weight:400!important;font-size:18px!important;letter-spacing:1px!important;line-height:1!important;width:auto!important;height:auto!important}',
    '.bk-candy.bk-txt>svg.bk-ic{width:22px;height:22px;flex:none}',
    'svg.bk-ic{display:inline-block;vertical-align:-.2em;width:1.15em;height:1.15em;pointer-events:none}',
    'img.bk-mini{display:inline-block;height:1.35em;width:auto;vertical-align:-.35em;margin-right:.15em}',
    '.bk-brand{font-family:"Lilita One",system-ui,sans-serif!important;font-weight:400!important;color:#7ED957!important;-webkit-text-stroke:3px #12301E;paint-order:stroke fill;letter-spacing:1.5px!important;display:flex!important;align-items:center;gap:6px}',
    '.bk-mascot{display:block;width:min(104px,26vw);height:auto;margin:0 auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,.35))}',
    '.bk-candy.bk-fit{border-width:2.5px!important;border-radius:12px!important;box-shadow:0 3px 0 #12301E!important}',
    '.bk-candy.bk-fit:active{box-shadow:0 0 0 #12301E!important;transform:translateY(3px)!important}',
    '.bk-candy.bk-fit>svg.bk-ic{width:62%;height:62%;max-width:26px;max-height:26px}',
    '.bk-candy svg:not(.bk-ic){filter:none!important}',
    '.bk-candy.bk-on{background:#7ED957!important}',
    '.bk-lock.bk-float{position:fixed!important;z-index:40;right:calc(10px + env(safe-area-inset-right));top:calc(64px + env(safe-area-inset-top));width:44px;height:44px;padding:0}',
    '#bkToast{position:fixed;left:50%;top:calc(70px + env(safe-area-inset-top));transform:translateX(-50%);z-index:99999;max-width:88vw;text-align:center;font:700 15px/1.35 Fredoka,system-ui,sans-serif;color:#12301E;background:#FFC93C;border:3px solid #12301E;border-radius:16px;box-shadow:0 4px 0 #12301E;padding:9px 14px;pointer-events:none;transition:opacity .3s;opacity:0}',
    '#bkDock{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom));width:min(480px,calc(100vw - 32px));z-index:99990;display:none}',
    '#bkDock.on{display:block}',
    '#bkDock button{width:100%;min-height:62px;border-radius:20px;border:3px solid #12301E;background:#FFC93C;color:#12301E;box-shadow:0 5px 0 #12301E,0 10px 30px rgba(0,0,0,.35);font:400 24px/1.1 "Lilita One",system-ui,sans-serif;letter-spacing:1px;padding:8px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '#bkDock button:active{transform:translateY(4px);box-shadow:0 1px 0 #12301E}',
    '@media (max-height:500px){#bkDock{left:auto;right:calc(14px + env(safe-area-inset-right));transform:none;width:300px;bottom:calc(12px + env(safe-area-inset-bottom))}#bkDock button{min-height:52px;font-size:20px}}',
    'body.bk-dock-on .bk-primary-hidden{display:none!important}',
    'body.bk-dock-on #card .box,body.bk-dock-on #card2 .box{padding-bottom:96px!important}',
    'body.bk-dock-on #oStart{padding-bottom:110px!important}',
    '.bk-rtog{display:inline-flex;align-items:center;gap:6px;margin:8px auto 4px;padding:10px 18px;min-height:44px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:inherit;font:600 15px Fredoka,system-ui,sans-serif;cursor:pointer}',
    '.bk-rules-h{display:none!important}',
    '@keyframes bkIn{from{opacity:0}to{opacity:1}}body{animation:bkIn .22s ease-out}',
    '#bkSheet{position:fixed;inset:0;z-index:100000;display:none;align-items:flex-end;justify-content:center;background:rgba(3,14,16,.55);-webkit-tap-highlight-color:transparent}',
    '#bkSheet.on{display:flex}',
    '#bkSheet .pn{width:100%;max-width:520px;background:#0E3434;border:3px solid #12301E;border-bottom:0;border-radius:26px 26px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.45);padding:10px 18px calc(18px + env(safe-area-inset-bottom));font-family:Fredoka,system-ui,sans-serif;color:#fff;transform:translateY(0);animation:bkUp .22s ease-out}',
    '@keyframes bkUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}',
    '#bkSheet .hd{width:44px;height:5px;border-radius:9px;background:rgba(255,255,255,.3);margin:2px auto 10px}',
    '#bkSheet h3{margin:0 0 14px;text-align:center;font:400 24px/1 "Lilita One",system-ui,sans-serif;letter-spacing:1px;color:#7ED957;-webkit-text-stroke:3px #12301E;paint-order:stroke fill}',
    '#bkSheet .gr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 10px}',
    '#bkSheet .tl{display:flex;flex-direction:column;align-items:center;gap:7px;font-weight:600;font-size:14px;line-height:1.15;text-align:center;color:#E6FFF4}',
    '#bkSheet .tl>.bk-candy,#bkSheet .tl>button,#bkSheet .tl>a{width:60px!important;height:60px!important;min-width:60px!important;border-radius:18px!important;font-size:24px!important;padding:0!important;position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important}',
    '#bkSheet .tl svg{width:28px!important;height:28px!important}',
    '#bkSheet .cl{display:block;width:100%;margin-top:18px;height:54px;border-radius:16px;border:3px solid #12301E;background:#7ED957;color:#12301E;font:400 20px "Lilita One",system-ui,sans-serif;letter-spacing:1px;box-shadow:0 4px 0 #12301E;cursor:pointer}',
    '#bkSheet .cl:active{transform:translateY(3px);box-shadow:0 1px 0 #12301E}',
    '.lft.bk-compact{gap:8px!important}.lft.bk-compact>#home,.lft.bk-compact>#bkMenu{min-width:44px!important;width:44px!important;height:44px!important;padding:0!important;flex:none}',
    '.lft.bk-compact>#home svg.bk-ic,.lft.bk-compact>#bkMenu svg.bk-ic{width:24px!important;height:24px!important}',
    '@media (min-width:700px) and (min-height:500px){#top .lft>.bk-candy{min-width:48px!important;min-height:44px!important}}',
    '@media (min-width:700px) and (min-height:500px){#bkSheet{align-items:center}#bkSheet .pn{border-radius:26px;border-bottom:3px solid #12301E;padding-bottom:20px}}',
    'body[data-device=tablet] .bk-candy.bk-sq{min-width:48px!important;min-height:48px!important}',
    'body[data-device=tablet] .bk-candy.bk-sq>svg.bk-ic{width:28px;height:28px}'
  ].join('\n');
  var st=document.createElement('style'); st.id='bukoUI'; st.textContent=css; (document.head||document.documentElement).appendChild(st);

  var P='fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC={
    home:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M3.2 11.6 12 4.2l8.8 7.4"/><path d="M5.8 10v9.4h12.4V10"/><path d="M10.2 19.4v-4.8h3.6v4.8"/></svg>',
    back:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M14.8 5.2 8 12l6.8 6.8"/></svg>',
    restart:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.3"/><path d="M4.6 4v4.6h4.6"/></svg>',
    pause:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M9 5.5v13"/><path d="M15 5.5v13"/></svg>',
    play:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/></svg>',
    sound:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M4 9.3v5.4h3.6l4.9 4V5.3l-4.9 4z" fill="currentColor"/><path d="M16 9a4.2 4.2 0 0 1 0 6"/><path d="M18.6 6.4a8 8 0 0 1 0 11.2"/></svg>',
    mute:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M4 9.3v5.4h3.6l4.9 4V5.3l-4.9 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    more:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><circle cx="5.5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor"/></svg>',
    rot:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><rect x="4" y="7" width="10" height="14" rx="2"/><path d="M13 3.2a8 8 0 0 1 7.6 7.4"/><path d="M21.2 7.2l-.6 3.4-3.2-1.2"/></svg>',
    lock:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" fill-opacity=".2"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/></svg>'
  };
  var EMO={'\uD83D\uDD0A':'sound','\uD83D\uDD09':'sound','\uD83D\uDD08':'sound','\uD83D\uDD07':'mute','\u23F8':'pause','\u23F8\uFE0F':'pause','\u25B6':'play','\u25B6\uFE0F':'play','\u21BB':'restart','\u21BA':'restart','\uD83D\uDD04':'restart','\u2B05':'back','\u2B05\uFE0F':'back'};
  window.BukoIcons=IC;
  var MASCOT=base+'buko.webp', MINI=base+'buko-mini.webp';

  function candy(el, icon, kind){
    if (!el) return;
    if (!el.querySelector('svg.bk-ic')) el.innerHTML=IC[icon];
    if (!el.classList.contains('bk-candy')) el.classList.add('bk-candy', kind||'bk-sq');
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('title')||'Buko Games');
  }
  function candyText(el, label){
    if (!el || el.querySelector('svg.bk-ic')) return;
    el.innerHTML=IC.home+'<span>'+label+'</span>'; el.classList.add('bk-candy','bk-txt'); el.__bk='txt';
  }
  var SKIP={SCRIPT:1,STYLE:1,TITLE:1,TEXTAREA:1,CANVAS:1,SVG:1};
  function swapEmoji(root){
    if (!root || !document.createTreeWalker) return;
    var w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list=[];
    while ((n=w.nextNode())) { var v=n.nodeValue; if (v && (v.indexOf('🏠')>=0 || v.indexOf('🦎')>=0)) list.push(n); }
    list.forEach(function(t){
      var p=t.parentNode; if (!p || SKIP[p.nodeName.toUpperCase()]) return;
      var parts=t.nodeValue.split(/(🏠|🦎)/), frag=document.createDocumentFragment();
      parts.forEach(function(s){
        if (s==='🏠'){ var sp=document.createElement('span'); sp.innerHTML=IC.home; frag.appendChild(sp.firstChild); }
        else if (s==='🦎'){ var im=document.createElement('img'); im.src=MINI; im.alt=''; im.className='bk-mini'; frag.appendChild(im); }
        else if (s) frag.appendChild(document.createTextNode(s));
      });
      p.replaceChild(frag, t);
    });
  }
  function fit(el){
    if (!el) return;
    if (!el.querySelector('svg')){ var k=EMO[(el.textContent||'').trim()]; if (k) el.innerHTML=IC[k]; }
    if (!el.classList.contains('bk-candy')) el.classList.add('bk-candy','bk-fit');
  }
  function fitAll(sel){ var l=document.querySelectorAll(sel); for (var i=0;i<l.length;i++) fit(l[i]); }

  /* ---- Ekran sabitleme (döndürme kilidi) ---- */
  var T={
    tr:{label:'Ekranı sabitle', on:{landscape:'Ekran yatay sabitlendi', portrait:'Ekran dikey sabitlendi'}, off:'Ekran serbest – telefonla birlikte döner', ios:'iPhone: Denetim Merkezi’nden “Döndürme Kilidi”ni aç', app:'Telefon ayarlarından “Otomatik döndür”ü kapat', no:'Bu tarayıcıda olmuyor – telefonun “Otomatik döndür” ayarını kapat'},
    de:{label:'Bildschirm fixieren', on:{landscape:'Bildschirm quer fixiert', portrait:'Bildschirm hochkant fixiert'}, off:'Bildschirm frei – dreht wieder mit', ios:'iPhone: im Kontrollzentrum die „Ausrichtungssperre“ einschalten', app:'In den Handy-Einstellungen „Automatisch drehen“ ausschalten', no:'Geht in diesem Browser nicht – „Automatisch drehen“ am Handy ausschalten'},
    en:{label:'Lock screen rotation', on:{landscape:'Screen locked in landscape', portrait:'Screen locked in portrait'}, off:'Screen unlocked – rotates again', ios:'iPhone: turn on “Rotation Lock” in Control Center', app:'Turn off “Auto-rotate” in your phone settings', no:'Not possible in this browser – turn off “Auto-rotate” on your phone'}
  };
  function L(){ var l; try{ l=window.BK&&BK.lang?BK.lang():((JSON.parse(localStorage.getItem('disfirlat2')||'{}').lang)||(navigator.language||'tr').slice(0,2)); }catch(e){ l='tr'; } return T[l]?T[l]:T.en; }
  var tt=null;
  function say(msg){ var b=document.getElementById('bkToast'); if(!b){ b=document.createElement('div'); b.id='bkToast'; b.setAttribute('role','status'); document.body.appendChild(b); } b.textContent=msg; b.style.opacity='1'; clearTimeout(tt); tt=setTimeout(function(){ b.style.opacity='0'; },2600); }
  var path=location.pathname;
  var LK='bukoLock', locked=false, isGame=!/\/spiel\/(index\.html)?$/.test(path);
  var IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1), APP=/BukoGamesApp/.test(navigator.userAgent)||!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
  function pref(v){ try{ if(v===undefined) return localStorage.getItem(LK)||''; if(v) localStorage.setItem(LK,v); else localStorage.removeItem(LK); }catch(e){ return ''; } }
  function cur(){ return innerWidth>innerHeight?'landscape':'portrait'; }
  function capSO(){ try{ return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.ScreenOrientation; }catch(e){ return null; } }
  function nativeLock(t){
    try{ if (window.BukoNative && BukoNative.lockOrientation){ BukoNative.lockOrientation(t); return true; } }catch(e){}
    var so=capSO(); if (so){ try{ if (t==='none') so.unlock(); else so.lock({orientation:t}); return true; }catch(e){} }
    return false;
  }
  function tryLock(t){
    if (nativeLock(t)) return Promise.resolve(true);
    var de=document.documentElement, wasFs=!!document.fullscreenElement;
    var fs=(!wasFs && de.requestFullscreen)? de.requestFullscreen({navigationUI:'hide'}).catch(function(){}) : Promise.resolve();
    return fs.then(function(){ return (screen.orientation&&screen.orientation.lock)? screen.orientation.lock(t) : Promise.reject(); })
      .then(function(){ return true; })
      .catch(function(){ if(!wasFs && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function(){}); return false; });
  }
  function unlock(){ nativeLock('none'); try{ screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock(); }catch(e){} locked=false; }
  function paint(){ var b=document.querySelectorAll('.bk-lock'); for (var i=0;i<b.length;i++){ var on=!!pref(); b[i].innerHTML=on?IC.lock:IC.rot; b[i].classList.toggle('bk-on',on); b[i].setAttribute('aria-pressed',on?'true':'false'); b[i].setAttribute('aria-label',L().label); b[i].title=L().label; } }
  function onLockTap(e){
    e.preventDefault(); e.stopPropagation();
    if (pref()){ pref(''); unlock(); paint(); say(L().off); return; }
    var t=cur();
    tryLock(t).then(function(ok){
      if (ok){ locked=true; pref(t); paint(); say(L().on[t]); }
      else { paint(); say(IOS?L().ios:(APP?L().app:L().no)); }
    });
  }
  function addLock(){
    if (!isGame || document.querySelector('.bk-lock')) return;
    var b=document.createElement('button'); b.type='button'; b.className='bk-lock';
    var box=document.querySelector('#top .lft'), tb=document.querySelector('#tb'), hb=document.querySelector('.hbtns');
    if (box){ b.className+=' pill ib'; box.appendChild(b); }
    else if (hb){ b.className+=' ibtn'; hb.appendChild(b); }
    else if (tb){ tb.appendChild(b); }
    else { b.className+=' bk-float'; if (/zipzip/.test(path)) b.style.top='calc(114px + env(safe-area-inset-top))'; document.body.appendChild(b); }
    b.classList.add('bk-candy','bk-fit');
    b.addEventListener('click', onLockTap); b.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
    paint();
  }
  // Kaydedilmiş kilit: ilk dokunuşta yeniden uygula (tarayıcı dokunuş istiyor)
  document.addEventListener('pointerdown', function(e){ var p=pref(); if (p && !locked && isGame && !(e.target.closest&&e.target.closest('.bk-lock'))) tryLock(p).then(function(ok){ locked=ok; }); }, true);
  document.addEventListener('fullscreenchange', function(){ if (!document.fullscreenElement) locked=false; });

  function apply(roots){
    var q=function(s){ return document.querySelector(s); };
    // Diş Fırlat, Neon Blok, Neon Batak, Tavla, Zıpzıp: üst köşedeki ana sayfa butonu
    var h=q('#home'); if (h && (h.tagName==='A' || /zipzip/.test(path))) candy(h,'home');
    // MechaBlock
    candy(q('#bBack'),'back'); candy(q('#bRestart'),'restart');
    var hb=q('a.homeb#bHome'); if (hb){ candy(hb,'home'); hb.setAttribute('aria-label','Buko Games'); }
    var mc=q('.mascot'); if (mc && !mc.__bk){ mc.innerHTML='<img class="bk-mascot" src="'+MASCOT+'" alt="Buko">'; mc.__bk=1; }
    // MUSA
    candy(q('#tb a[href="index.html"]'),'home');
    // 1453
    candy(q('#hHome'),'home');
    // diğer butonlar: Şeker 3D
    fitAll('#top .lft .ib:not(#home)'); fit(q('#pz')); fit(q('#bPause'));
    fitAll('#tb button'); fitAll('.hbtns .ibtn:not(#hHome)');
    if (/zipzip/.test(path)) fit(q('#snd'));
    addLock(); compactBar();
    // Oyun seçici başlığı
    var pk=document.querySelectorAll('#picker .pk > div:first-child');
    for (var i=0;i<pk.length;i++){ if (!pk[i].querySelector('img.bk-mini') && /BUKO GAMES/.test(pk[i].textContent)){ pk[i].innerHTML='<img class="bk-mini" src="'+MINI+'" alt="" style="height:30px">BUKO GAMES'; pk[i].classList.add('bk-brand'); pk[i].__bk=1; } }
    var pkh=document.querySelectorAll('#picker a.pkh');
    for (var j=0;j<pkh.length;j++){ var sv=pkh[j].querySelector('svg'); if (sv && !sv.classList.contains('bk-ic')){ var d=document.createElement('span'); d.innerHTML=IC.home; pkh[j].replaceChild(d.firstChild, sv); } }
    if (roots) roots.forEach(swapEmoji); else swapEmoji(document.body);
  }

  /* ---- Telefonda üst çubuğu sadeleştir: Ana sayfa + "Menü"; diğerleri alttan açılan pencerede ---- */
  var NAMES={tr:{lbb:'Puan tablosu',sw:'Oyunlar',mus:'Müzik',vol:'Ses',lock:'Ekran kilidi',menu:'Menü',close:'Kapat'},
             de:{lbb:'Bestenliste',sw:'Spiele',mus:'Musik',vol:'Ton',lock:'Bildschirm fixieren',menu:'Menü',close:'Schließen'},
             en:{lbb:'Leaderboard',sw:'Games',mus:'Music',vol:'Sound',lock:'Lock rotation',menu:'Menu',close:'Close'}};
  function NL(){ var l; try{ l=window.BK&&BK.lang?BK.lang():((JSON.parse(localStorage.getItem('disfirlat2')||'{}').lang)||(navigator.language||'tr').slice(0,2)); }catch(e){ l='tr'; } return NAMES[l]||NAMES.en; }
  function isPhone(){ return Math.min(screen.width||innerWidth, screen.height||innerHeight) < 600 || Math.min(innerWidth,innerHeight) < 500; }
  var sheet=null;
  function openSheet(){ if(!sheet) return; var n=NL(); sheet.querySelector('h3').textContent=n.menu; sheet.querySelector('.cl').textContent=n.close;
    var tl=sheet.querySelectorAll('.tl'); for(var i=0;i<tl.length;i++){ var k=tl[i].getAttribute('data-k'); tl[i].querySelector('span.lb').textContent=n[k]||''; }
    sheet.classList.add('on'); }
  function closeSheet(){ if(sheet) sheet.classList.remove('on'); }
  function compactBar(){
    var lft=document.querySelector('#top .lft'); if(!lft || lft.__bkc || !isPhone()) return;
    var home=lft.querySelector('#home'); if(!home) return;
    lft.__bkc=1; lft.classList.add('bk-compact');
    sheet=document.createElement('div'); sheet.id='bkSheet'; sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true');
    sheet.innerHTML='<div class="pn"><div class="hd"></div><h3></h3><div class="gr"></div><button type="button" class="cl"></button></div>';
    document.body.appendChild(sheet);
    var gr=sheet.querySelector('.gr');
    var kids=[].slice.call(lft.children).filter(function(c){ return c!==home; });
    kids.forEach(function(c){
      var k=c.classList.contains('bk-lock')?'lock':(c.id||'');
      var t=document.createElement('div'); t.className='tl'; t.setAttribute('data-k',k);
      t.appendChild(c); var sp=document.createElement('span'); sp.className='lb'; t.appendChild(sp); gr.appendChild(t);
      if (k==='lbb'||k==='sw'){ c.addEventListener('click', function(){ setTimeout(closeSheet,0); }); c.addEventListener('pointerup', function(){ setTimeout(closeSheet,0); }); }
    });
    var m=document.createElement('button'); m.type='button'; m.id='bkMenu'; m.className='pill ib bk-candy bk-fit'; m.innerHTML=IC.more; m.setAttribute('aria-label',NL().menu);
    m.addEventListener('click', function(e){ e.stopPropagation(); openSheet(); });
    home.insertAdjacentElement('afterend', m);
    sheet.addEventListener('click', function(e){ if(e.target===sheet) closeSheet(); });
    sheet.querySelector('.cl').addEventListener('click', closeSheet);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeSheet(); });
  }

  /* ---- Telefonda: ana "Oyna" butonu başparmak bölgesinde (altta), uzun kurallar katlanır ---- */
  var RT={tr:['📖 Kurallar','▲ Kuralları gizle'],de:['📖 Regeln','▲ Regeln ausblenden'],en:['📖 Rules','▲ Hide rules']};
  function RL(){ var l; try{ l=window.BK&&BK.lang?BK.lang():((JSON.parse(localStorage.getItem('disfirlat2')||'{}').lang)||(navigator.language||'tr').slice(0,2)); }catch(e){ l='tr'; } return RT[l]||RT.en; }
  function shown(el){ if(!el) return false; if(el.offsetParent===null && getComputedStyle(el).position!=='fixed') return false;
    for (var e=el; e && e!==document.body; e=e.parentElement){ var cs=getComputedStyle(e); if (cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05||cs.pointerEvents==='none'&&e!==el&&+cs.opacity<0.5) return false; if (/(^|\s)(hide|hidden|off)(\s|$)/.test(e.className)&&e.id) return false; }
    var r=el.getBoundingClientRect(); return r.width>0 && r.height>0 && r.bottom>0 && r.top<innerHeight; }
  function menuRoot(){
    var c=['#card .box','#card2 .box','#oStart'];
    for (var i=0;i<c.length;i++){ var e=document.querySelector(c[i]); if (e && shown(e) && (c[i]!=='#card2 .box' || !document.getElementById('card2').classList.contains('hide'))) return e; }
    return null;
  }
  function primaryIn(root){
    if (root.id==='oStart') return root.querySelector('#bPlay');
    var b=root.querySelectorAll('button.btn, a.btn');
    for (var i=0;i<b.length;i++){ var x=b[i]; if (!/ghost|alt|small|sm\b/.test(x.className) && (x.textContent||'').trim().length>1) return x; }
    return null;
  }
  function foldRules(root){
    if (root.__bkf===root.innerHTML.length) return;
    var L=RL(), els=root.querySelectorAll('p,div,span'), list=[];
    for (var i=0;i<els.length;i++){
      var e=els[i]; if (e.__bkfold || e.querySelector('button,a,input,select,img,svg,canvas')) continue;
      var t=(e.textContent||'').trim(); if (t.length<160 || e.children.length>8) continue;
      var up=e.parentElement, inside=false; while(up&&up!==root){ if(up.__bkfold){inside=true;break;} up=up.parentElement; } if(inside) continue;
      e.__bkfold=1; list.push(e);
    }
    if (list.length){
      list.forEach(function(e){ e.classList.add('bk-rules-h'); });
      var tg=document.createElement('button'); tg.type='button'; tg.className='bk-rtog'; tg.textContent=L[0];
      tg.addEventListener('click',function(ev){ ev.stopPropagation(); var h=!list[0].classList.contains('bk-rules-h'); list.forEach(function(e){ e.classList.toggle('bk-rules-h',h); }); tg.textContent=h?L[0]:L[1]; });
      list[0].parentNode.insertBefore(tg,list[0]);
    }
    root.__bkf=root.innerHTML.length;
  }
  var dock=null, dockFor=null;
  function tickDock(){
    if (!isGame || !isPhone()) return;
    if (!dock){ dock=document.createElement('div'); dock.id='bkDock'; dock.innerHTML='<button type="button"></button>'; document.body.appendChild(dock);
      dock.firstChild.addEventListener('click',function(){ var t=dockFor; if(!t) return;
        try{ t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch'})); }catch(e){}
        try{ t.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch'})); }catch(e){}
        t.click(); }); }
    var root=menuRoot(), p=root&&primaryIn(root);
    if (root && document.getElementById('bkSheet') && document.getElementById('bkSheet').classList.contains('on')) p=null;
    if (p){
      if (root.id!=='oStart') foldRules(root);
      if (dockFor!==p){ if(dockFor) dockFor.classList.remove('bk-primary-hidden'); dockFor=p; p.classList.add('bk-primary-hidden'); }
      var lbl=(p.textContent||'').trim(); if (dock.firstChild.textContent!==lbl) dock.firstChild.textContent=lbl;
      dock.classList.add('on'); document.body.classList.add('bk-dock-on');
    } else {
      if (dockFor) dockFor.classList.remove('bk-primary-hidden'); dockFor=null;
      dock.classList.remove('on'); document.body.classList.remove('bk-dock-on');
    }
  }
  setInterval(function(){ try{ tickDock(); }catch(e){} }, 250);
  var pend=false, roots=[];
  function later(muts){
    if (muts && muts.forEach) muts.forEach(function(m){ for (var k=0;k<m.addedNodes.length;k++){ var a=m.addedNodes[k]; var r=a.nodeType===3?a.parentNode:a; if (r && r.nodeType===1 && roots.indexOf(r)<0) roots.push(r); } });
    if (pend) return; pend=true;
    (window.requestAnimationFrame||setTimeout)(function(){ pend=false; var rs=roots; roots=[]; try{ apply(rs); }catch(e){} });
  }
  function start(){
    try{ apply(); }catch(e){}
    if (window.MutationObserver) new MutationObserver(later).observe(document.body,{childList:true,subtree:true});
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
  addEventListener('load', function(){ try{ apply(); }catch(e){} });
})();
