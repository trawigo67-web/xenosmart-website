/* Mailcut als iPhone-/Android-App (Capacitor-Huelle in apps/mailcut).
   Nur aktiv, wenn die Seite in der App laeuft; im Browser passiert hier nichts.
   1) "Brief fotografieren" oeffnet den Dokumenten-Scanner des Geraets (Kanten, gerade ziehen, mehrere Seiten).
   2) Frist-Erinnerungen als Mitteilung: 3 Tage vorher, 1 Tag vorher und am Tag selbst um 9 Uhr.
   3) Tippen auf die Mitteilung oeffnet den Brief. */
(function(){
  "use strict";
  const C = window.Capacitor;
  if(!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const P = C.Plugins || {}, PLAT = C.getPlatform();
  document.documentElement.classList.add("native-app", "native-"+PLAT);

  /* ---------------- 1) Scanner ---------------- */
  const hasScanner = () => (PLAT==="ios" && !!P.MailcutScanner) || (PLAT==="android" && !!P.DocumentScanner);
  async function scanPages(){
    if(PLAT==="ios"){
      const r = await P.MailcutScanner.scan({quality:0.8, maxSide:2200});
      return (r && r.pages) || [];
    }
    const r = await P.DocumentScanner.scanDocument({resultFormats:"JPEG", galleryImportAllowed:false, pageLimit:10, scannerMode:"FULL"});
    const out = [];
    for(const u of (r && r.scannedImages) || []){ out.push(await (await fetch(C.convertFileSrc(u))).blob()); }
    return out;
  }
  function toFile(x, i){
    const name = "seite-"+(i+1)+".jpg";
    if(x instanceof Blob) return new File([x], name, {type:"image/jpeg"});
    const bin = atob(String(x).split(",")[1] || ""), a = new Uint8Array(bin.length);
    for(let j=0;j<bin.length;j++) a[j] = bin.charCodeAt(j);
    return new File([a], name, {type:"image/jpeg"});
  }
  let scanning = false, scanOff = false;
  document.addEventListener("click", async ev => {
    const el = ev.target;
    if(!el || el.id !== "camIn" || scanOff || !hasScanner()) return;   // sonst normale Kamera
    ev.preventDefault(); ev.stopPropagation();
    if(scanning) return; scanning = true;
    try{
      const pages = await scanPages();
      if(pages.length && typeof addFiles === "function") await addFiles(pages.map(toFile));
    }catch(e){
      const msg = String((e && (e.message || e.code)) || e);
      if(!/cancel/i.test(msg)){ scanOff = true; try{ el.click(); }catch(_){} }   // Scanner geht nicht: einmal normale Kamera
    }finally{ scanning = false; }
  }, true);

  /* ---------------- 2) Frist-Erinnerungen ---------------- */
  const LNP = P.LocalNotifications;
  if(!LNP) return;
  const TXT = {
    de:["Frist in 3 Tagen","Frist morgen","Frist heute"],
    tr:["Son tarihe 3 gün kaldı","Son tarih yarın","Son tarih bugün"],
    en:["Deadline in 3 days","Deadline tomorrow","Deadline today"],
    ar:["تبقّى 3 أيام على الموعد","الموعد النهائي غدًا","الموعد النهائي اليوم"],
    ku:["3 roj heta dawiya demê","Dawiya demê sibê ye","Dawiya demê îro ye"],
    sq:["Afati pas 3 ditësh","Afati nesër","Afati sot"],
    fr:["Échéance dans 3 jours","Échéance demain","Échéance aujourd'hui"],
    ru:["Срок через 3 дня","Срок завтра","Срок сегодня"],
    uk:["Строк через 3 дні","Строк завтра","Строк сьогодні"],
    pl:["Termin za 3 dni","Termin jutro","Termin dziś"],
    ro:["Termen în 3 zile","Termen mâine","Termen azi"],
    fa:["۳ روز تا مهلت","مهلت فردا است","مهلت امروز است"]
  };
  const lang = () => { try{ return (typeof S!=="undefined" && S.lang) || "de"; }catch(e){ return "de"; } };
  const hash = s => { let h=0; for(const ch of String(s)) h = (h*31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 100000000; };
  function wanted(){
    let list = [];
    try{ if(typeof S==="undefined" || !S.letters) return []; list = S.letters; }catch(e){ return []; }
    const isOpen = l => { try{ return typeof OPEN!=="undefined" ? OPEN.has(l.status) : l.status!=="erledigt"; }catch(e){ return true; } };
    const tx = TXT[lang()] || TXT.en, now = Date.now(), out = [];
    for(const l of list){
      if(!l || !l.dueDate || !isOpen(l) || !/^\d{4}-\d{2}-\d{2}$/.test(l.dueDate)) continue;
      const [y,m,d] = l.dueDate.split("-").map(Number);
      [[3,0],[1,1],[0,2]].forEach(([before,k]) => {
        const at = new Date(y, m-1, d-before, 9, 0, 0);
        if(at.getTime() > now + 60000) out.push({
          id: hash(l.id)*10 + k, title: tx[k], body: String(l.title || l.sender || "Mailcut").slice(0,120),
          schedule:{at, allowWhileIdle:true}, extra:{letterId:l.id}
        });
      });
    }
    out.sort((a,b)=>a.schedule.at-b.schedule.at);
    return out.slice(0, 60);   // iOS erlaubt hoechstens 64 geplante Mitteilungen
  }
  let lastSig = "", asked = false, busy = false;
  async function sync(){
    if(busy) return; busy = true;
    try{
      const want = wanted();
      const sig = lang()+"|"+want.map(n=>n.id+"@"+n.schedule.at.getTime()+"#"+n.body).join(",");
      if(sig === lastSig) return;
      if(want.length){
        let perm = await LNP.checkPermissions();
        if(perm.display !== "granted"){
          let tried = false; try{ tried = localStorage.getItem("mc_notif_asked")==="1"; }catch(e){}
          if(perm.display === "denied" || tried || asked){ lastSig = sig; return; }
          asked = true; try{ localStorage.setItem("mc_notif_asked","1"); }catch(e){}
          perm = await LNP.requestPermissions();
          if(perm.display !== "granted"){ lastSig = sig; return; }
        }
      }
      const pend = await LNP.getPending();
      if(pend && pend.notifications && pend.notifications.length) await LNP.cancel({notifications: pend.notifications.map(n=>({id:n.id}))});
      if(want.length) await LNP.schedule({notifications: want});
      lastSig = sig;
    }catch(e){ /* naechster Versuch beim naechsten Durchlauf */ }
    finally{ busy = false; }
  }
  setTimeout(sync, 4000);
  setInterval(sync, 30000);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) sync(); });

  /* ---------------- 3) Mitteilung antippen -> Brief oeffnen ---------------- */
  try{
    LNP.addListener("localNotificationActionPerformed", a => {
      const id = a && a.notification && a.notification.extra && a.notification.extra.letterId;
      if(!id) return;
      const open = () => { if(typeof openLetter === "function"){ try{ if(typeof go==="function") go("briefe"); }catch(e){} openLetter(id); } };
      if(typeof S!=="undefined" && S.loaded) open(); else setTimeout(open, 2500);
    });
  }catch(e){}
})();
