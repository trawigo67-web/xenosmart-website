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
    '.bk-candy{background:#FFC93C!important;color:#12301E!important;border:3px solid #12301E!important;border-radius:14px!important;box-shadow:0 4px 0 #12301E!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;text-shadow:none!important;opacity:1!important;filter:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-decoration:none!important;cursor:pointer;transition:transform .08s,box-shadow .08s!important;box-sizing:border-box!important;-webkit-tap-highlight-color:transparent}',
    '.bk-candy:active{transform:translateY(3px)!important;box-shadow:0 1px 0 #12301E!important}',
    '.bk-candy.bk-sq{min-width:40px!important;min-height:40px!important;padding:0!important}',
    '.bk-candy.bk-sq>svg.bk-ic{width:24px;height:24px;flex:none}',
    '.bk-candy.bk-txt{gap:8px;padding:9px 18px!important;border-radius:999px!important;font-family:"Lilita One",system-ui,sans-serif!important;font-weight:400!important;font-size:18px!important;letter-spacing:1px!important;line-height:1!important;width:auto!important;height:auto!important}',
    '.bk-candy.bk-txt>svg.bk-ic{width:22px;height:22px;flex:none}',
    'svg.bk-ic{display:inline-block;vertical-align:-.2em;width:1.15em;height:1.15em;pointer-events:none}',
    'img.bk-mini{display:inline-block;height:1.35em;width:auto;vertical-align:-.35em;margin-right:.15em}',
    '.bk-brand{font-family:"Lilita One",system-ui,sans-serif!important;font-weight:400!important;color:#7ED957!important;-webkit-text-stroke:3px #12301E;paint-order:stroke fill;letter-spacing:1.5px!important;display:flex!important;align-items:center;gap:6px}',
    '.bk-mascot{display:block;width:min(104px,26vw);height:auto;margin:0 auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,.35))}',
    'body[data-device=tablet] .bk-candy.bk-sq{min-width:48px!important;min-height:48px!important}',
    'body[data-device=tablet] .bk-candy.bk-sq>svg.bk-ic{width:28px;height:28px}'
  ].join('\n');
  var st=document.createElement('style'); st.id='bukoUI'; st.textContent=css; (document.head||document.documentElement).appendChild(st);

  var P='fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC={
    home:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M3.2 11.6 12 4.2l8.8 7.4"/><path d="M5.8 10v9.4h12.4V10"/><path d="M10.2 19.4v-4.8h3.6v4.8"/></svg>',
    back:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M14.8 5.2 8 12l6.8 6.8"/></svg>',
    restart:'<svg class="bk-ic" viewBox="0 0 24 24" '+P+'><path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.3"/><path d="M4.6 4v4.6h4.6"/></svg>'
  };
  window.BukoIcons=IC;
  var MASCOT=base+'buko.svg';

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
        else if (s==='🦎'){ var im=document.createElement('img'); im.src=MASCOT; im.alt=''; im.className='bk-mini'; frag.appendChild(im); }
        else if (s) frag.appendChild(document.createTextNode(s));
      });
      p.replaceChild(frag, t);
    });
  }
  var path=location.pathname;
  function apply(roots){
    var q=function(s){ return document.querySelector(s); };
    // Diş Fırlat, Neon Blok, Neon Batak, Tavla, Zıpzıp: üst köşedeki ana sayfa butonu
    var h=q('#home'); if (h && (h.tagName==='A' || /zipzip/.test(path))) candy(h,'home');
    // MechaBlock
    candy(q('#bBack'),'back'); candy(q('#bRestart'),'restart');
    var hb=q('a.homeb#bHome'); if (hb) candyText(hb,'Buko Games');
    var mc=q('.mascot'); if (mc && !mc.__bk){ mc.innerHTML='<img class="bk-mascot" src="'+MASCOT+'" alt="Buko">'; mc.__bk=1; }
    // MUSA
    candy(q('#tb a[href="index.html"]'),'home');
    // 1453
    candy(q('#hHome'),'home');
    // Oyun seçici başlığı
    var pk=document.querySelectorAll('#picker .pk > div:first-child');
    for (var i=0;i<pk.length;i++){ if (!pk[i].querySelector('img.bk-mini') && /BUKO GAMES/.test(pk[i].textContent)){ pk[i].innerHTML='<img class="bk-mini" src="'+MASCOT+'" alt="" style="height:30px">BUKO GAMES'; pk[i].classList.add('bk-brand'); pk[i].__bk=1; } }
    var pkh=document.querySelectorAll('#picker a.pkh');
    for (var j=0;j<pkh.length;j++){ var sv=pkh[j].querySelector('svg'); if (sv && !sv.classList.contains('bk-ic')){ var d=document.createElement('span'); d.innerHTML=IC.home; pkh[j].replaceChild(d.firstChild, sv); } }
    if (roots) roots.forEach(swapEmoji); else swapEmoji(document.body);
  }
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
