# Mailcut v2 "Einfach": wendet alle Aenderungen als genaue Ersetzungen auf die App-Quelle an.
# Aufruf: python3 patch_app.py app-src.orig.html app-src.html
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()

def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:90])
    s = s.replace(old, new)

def between(start, end, new):
    """ersetzt von start (inkl.) bis end (exkl.)"""
    global s
    assert s.count(start) == 1, (s.count(start), start[:60])
    i = s.index(start)
    j = s.index(end, i + len(start))
    s = s[:i] + new + s[j:]

# ---------------------------------------------------------------- CSS
CSS = r'''
/* ===== v2 "Einfach": iPhone-Feinschliff und ruhigere Oberflaeche ===== */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
html,body{overflow:hidden;overscroll-behavior:none}
body{position:fixed;inset:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.app{height:100%}
main{overscroll-behavior:contain}
button,.btn,.chip,.tab,.tile,.item,summary{-webkit-user-select:none;user-select:none;touch-action:manipulation;-webkit-touch-callout:none}
@media (hover:none){.btn:hover{border-color:var(--line)}.btn.pri:hover{border-color:var(--accent)}.btn.danger:hover{border-color:var(--danger-soft)}}
.btn:active,.abtn:active,.qt:active,.tab:active,.chip:active,.statusc:active,.acc>summary:active,.icon-btn:active{opacity:.6}
.item:active{background:var(--bg)}
.top{padding-left:calc(env(safe-area-inset-left) + 16px);padding-right:calc(env(safe-area-inset-right) + 16px)}
.wrap{padding-left:calc(env(safe-area-inset-left) + 16px);padding-right:calc(env(safe-area-inset-right) + 16px);padding-bottom:calc(env(safe-area-inset-bottom) + 120px)}
.who{min-height:44px;padding:4px 12px 4px 6px}
.who span{font-size:1rem}
.btn{min-height:50px;padding:12px 16px;border-radius:14px}
.btn.big{min-height:60px;font-size:1.15rem}
.chip{min-height:44px;padding:8px 16px;font-size:1rem}
.chips{gap:8px;padding-bottom:4px}
.seg{gap:8px}
.seg button{min-height:46px;padding:10px 16px;font-size:1rem;border-radius:12px}
input.i,select.i,textarea.i{min-height:52px;font-size:17px;border-radius:12px;padding:12px 14px}
.search input.i{padding-left:46px}
.search svg{left:14px}
select.i{-webkit-appearance:none;appearance:none;padding-right:38px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-size:18px}
input[type=date].i{-webkit-appearance:none;appearance:none;display:block;min-width:0;text-align:left}
input[type=date].i::-webkit-date-and-time-value{text-align:left}
label.f{font-size:.95rem;gap:6px;min-width:0}
.tabs{padding-left:calc(env(safe-area-inset-left) + 6px);padding-right:calc(env(safe-area-inset-right) + 6px)}
.tab{min-height:52px;font-size:.8rem;justify-content:center}
.tab svg{width:26px;height:26px}
.tab.cap .capbtn{width:64px;height:64px;border-radius:22px;margin-top:-30px}
.tab.cap .capbtn svg{width:32px;height:32px}
.item .mid{padding:14px 0;gap:4px}
.item .ttl{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:1.05rem;line-height:1.25}
.item .sub,.item .small{font-size:.92rem}
.item .right{padding:14px 14px 14px 0}
.pill{font-size:.84rem;padding:3px 10px}
.small{font-size:.92rem}
.icon-btn{width:48px;height:48px;border-radius:14px}
.check{padding:12px 0;gap:12px;align-items:center}
.check input{width:28px;height:28px;flex:none;margin:0}
.thumb .x{width:44px;height:44px;font-size:1.4rem;top:2px;right:2px}
.viewer button{width:52px;height:52px}
.toast{font-size:1.05rem;padding:12px 18px;top:calc(env(safe-area-inset-top) + 14px);bottom:auto;box-shadow:0 8px 24px rgba(0,0,0,.25)}
@media (prefers-reduced-motion:no-preference){.sheet .panel{animation:none}.sheet .panel.in{animation:up .22s ease-out}}
.acc[data-acc="pay"] .acc-b>.card>h3:first-child{display:none}
/* Blatt (Brief-Detail) */
.sheet .panel{overscroll-behavior:contain;max-height:calc(100% - env(safe-area-inset-top) - 14px)}
.sheet .head{padding:18px 16px 12px;align-items:flex-start}
.sheet .head h2{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;padding-top:4px}
.grab{position:absolute;top:7px;left:50%;width:42px;height:5px;margin-left:-21px;border-radius:3px;background:var(--line)}
.hero{border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px;background:var(--accent-soft)}
.hero.late{background:var(--danger-soft)} .hero.soon{background:var(--warn-soft)} .hero.done{background:var(--ok-soft)}
.hero-k{font-size:.9rem;font-weight:700;color:var(--muted)}
.hero-d{font-family:var(--f-display);font-size:1.7rem;font-weight:800;line-height:1.1}
.hero.late .hero-d{color:var(--danger)} .hero.soon .hero-d{color:var(--warn)}
.lead{font-size:1.12rem;line-height:1.5;margin:0}
.acts{display:flex;flex-direction:column;gap:10px}
.g3{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(0,1fr))}
.abtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:84px;padding:12px 6px;border:1px solid var(--line);background:var(--surface);border-radius:16px;font-weight:700;cursor:pointer;text-align:center;line-height:1.2}
.abtn svg{width:28px;height:28px;color:var(--accent)}
/* Aufklapp-Bereiche */
.acc{border:1px solid var(--line);border-radius:16px;background:var(--surface);scroll-margin-top:84px}
.acc>summary{list-style:none;display:flex;align-items:center;gap:12px;min-height:58px;padding:8px 16px;font-family:var(--f-display);font-weight:700;font-size:1.1rem;cursor:pointer}
.acc>summary::-webkit-details-marker{display:none}
.acc>summary>span{flex:1;min-width:0}
.acc>summary>svg{width:22px;height:22px;color:var(--muted);transition:transform .15s;flex:none}
.acc[open]>summary>svg{transform:rotate(90deg)}
.acc[open]>summary{border-bottom:1px solid var(--line)}
.acc-b{padding:16px;display:flex;flex-direction:column;gap:14px}
.acc-b>.card{border:0;box-shadow:none;padding:0;background:none;border-radius:0}
.acc-b>.card.std{border-left:0}
.acc-b>.card>h2:first-child{display:none}
.acc[data-acc="calc"] .acc-b>.card>h2,.acc[data-acc="v:calc"] .acc-b>.card>h2{display:none}
/* Start */
.statusc{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:0;border-radius:16px;padding:16px;font:inherit;color:inherit;cursor:pointer;background:var(--ok-soft)}
.statusc.late{background:var(--danger-soft)} .statusc.soon{background:var(--warn-soft)} .statusc.info{background:var(--accent-soft)}
.statusc .dotc{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--ok);color:#fff}
.statusc.late .dotc{background:var(--danger)} .statusc.soon .dotc{background:var(--warn)} .statusc.info .dotc{background:var(--accent);color:var(--accent-ink)}
.statusc .dotc svg{width:26px;height:26px}
.statusc b{font-size:1.12rem;line-height:1.25;flex:1}
.btn.snap{min-height:76px;font-size:1.3rem;border-radius:20px;box-shadow:0 8px 22px rgba(29,78,216,.28)}
.btn.snap svg{width:30px;height:30px}
.qtiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.qt{display:flex;flex-direction:column;gap:8px;align-items:flex-start;text-align:left;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:16px;font:inherit;color:inherit;cursor:pointer;box-shadow:var(--shadow);min-height:108px}
.qt .wico{width:44px;height:44px}
.qt b{line-height:1.2}
/* Erfassen */
.steps{display:flex;gap:8px;align-items:center}
.steps span{flex:1;display:flex;flex-direction:column;gap:6px;font-size:.88rem;font-weight:700;color:var(--muted)}
.steps span::before{content:"";height:6px;border-radius:3px;background:var(--line)}
.steps span.on{color:var(--accent)} .steps span.on::before{background:var(--accent)}
.thumbs{gap:12px}
.thumb{width:112px;height:150px;border-radius:12px}
.spin{width:22px;height:22px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--accent);flex:none}
@media (prefers-reduced-motion:no-preference){.spin{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}}
.linkbtn{background:none;border:0;color:var(--accent);font-weight:700;min-height:48px;padding:8px 10px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
/* Familie */
.mrow{display:flex;flex-direction:column;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.colors{display:flex;gap:10px;flex-wrap:wrap}
.colors button{width:44px;height:44px;border-radius:50%;cursor:pointer;padding:0}
.brow{grid-template-columns:minmax(0,1fr) auto;row-gap:8px}
.brow>input:first-child{grid-column:1/-1}
.budget-bar + .kv>b{white-space:nowrap}
.brand{min-width:0}
.brand b{white-space:nowrap;display:block}
#zfBadge{flex:none}
@media (max-width:389px){#zfBadge{display:none!important}.who{max-width:42%}}
/* Tastatur offen: Leiste unten ausblenden, Inhalt auf den sichtbaren Bereich begrenzen */
body.kb .tabs{display:none}
body.kb .app{position:fixed;left:0;right:0;top:var(--vvo,0px);height:var(--vvh,100%)}
body.kb .wrap{padding-bottom:28px}
body.kb .sheet{top:var(--vvo,0px);bottom:auto;height:var(--vvh,100%)}
'''
rep("</style>\n</head>", CSS + "</style>\n</head>")

# ---------------------------------------------------------------- Texte
TXT = r'''Object.assign(T.de,{
  stOver1:"1 Brief ist überfällig", stOverN:"{n} Briefe sind überfällig", stWeek1:"1 Brief ist diese Woche dran", stWeekN:"{n} Briefe sind diese Woche dran",
  stOk:"Alles im Griff. Nichts Dringendes.", stEmpty:"Fotografiere deinen ersten Brief – den Rest machen wir.", showAll:"Alle Briefe ansehen", todoNow:"Das ist dran",
  snapMore:"Noch eine Seite", snapDone:"Fertig – jetzt lesen lassen", snapFirst:"Mach ein Foto von deinem Brief", snapTip:"Leg den Brief gerade hin. Gutes Licht hilft.",
  snapBusy:"Foto wird vorbereitet …", snapManualLink:"Lieber selbst eintragen", stepA:"1 · Foto", stepB:"2 · Lesen", stepC:"3 · Speichern",
  rvTitle:"Stimmt das so?", rvSub:"Schau kurz drüber. Du kannst alles ändern.", rvMore:"Mehr Angaben", rvWho:"Wer kümmert sich?", rvDue:"Bis wann?", rvWhat:"Worum geht es?",
  aPay:"Bezahlen", aReply:"Antworten", aExplain:"Erklär mir das", reopen:"Wieder öffnen",
  accTpl:"So gehst du vor", accAI:"Erklären & fragen", accReply:"Antwort schreiben", accPlan:"Frist & wer kümmert sich", accDetails:"Angaben ändern", accAcct:"Konto & Einladungscode",
  flt:"Filter", mdelQ:"Wirklich entfernen?", yes:"Ja", no:"Nein", photoFail:"Das Foto konnte nicht gelesen werden. Bitte noch einmal versuchen."
});
Object.assign(T.tr,{
  stOver1:"1 mektubun süresi geçti", stOverN:"{n} mektubun süresi geçti", stWeek1:"Bu hafta 1 mektup sırada", stWeekN:"Bu hafta {n} mektup sırada",
  stOk:"Her şey yolunda. Acil bir şey yok.", stEmpty:"İlk mektubunun fotoğrafını çek – gerisini biz hallederiz.", showAll:"Tüm mektupları gör", todoNow:"Sırada bunlar var",
  snapMore:"Bir sayfa daha", snapDone:"Tamam – şimdi okut", snapFirst:"Mektubunun fotoğrafını çek", snapTip:"Mektubu düz koy. İyi ışık yardımcı olur.",
  snapBusy:"Fotoğraf hazırlanıyor …", snapManualLink:"Kendim yazmak istiyorum", stepA:"1 · Fotoğraf", stepB:"2 · Okuma", stepC:"3 · Kaydet",
  rvTitle:"Böyle doğru mu?", rvSub:"Kısaca bir bak. Her şeyi değiştirebilirsin.", rvMore:"Diğer bilgiler", rvWho:"Kim ilgilenecek?", rvDue:"Ne zamana kadar?", rvWhat:"Konu ne?",
  aPay:"Öde", aReply:"Cevap yaz", aExplain:"Bunu bana açıkla", reopen:"Yeniden aç",
  accTpl:"Ne yapmalısın?", accAI:"Açıkla ve sor", accReply:"Cevap yaz", accPlan:"Son tarih ve kim ilgilenecek", accDetails:"Bilgileri değiştir", accAcct:"Hesap ve davet kodu",
  flt:"Filtre", mdelQ:"Gerçekten çıkarılsın mı?", yes:"Evet", no:"Hayır", photoFail:"Fotoğraf okunamadı. Lütfen bir daha dene."
});
'''
rep("const CATS = {", TXT + "const CATS = {")

# ---------------------------------------------------------------- Zustand, Icons, Helfer
rep("S.w = wFresh();", "S.w = wFresh(); S.acc = {}; S.mdelAsk = \"\";")
rep("  down:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v11M7 10l5 5 5-5M5 20h14\"/></svg>'\n};",
    "  down:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v11M7 10l5 5 5-5M5 20h14\"/></svg>',\n"
    "  chev:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 5l7 7-7 7\"/></svg>',\n"
    "  pen:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 20h4L19 9l-4-4L4 16z\"/><path d=\"M13.5 6.5l4 4\"/></svg>',\n"
    "  euro:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15.5 8.6a4.4 4.4 0 1 0 0 6.8M7 11h6M7 13.5h5\"/></svg>',\n"
    "  help:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7\"/><path d=\"M12 17h.01\"/></svg>',\n"
    "  wallet:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12\"/><path d=\"M16 13h.01\" stroke-linecap=\"round\" stroke-width=\"3\"/></svg>',\n"
    "  alert:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M12 7v6M12 17h.01\"/></svg>'\n};\n"
    "function acc(k,title,inner,def){ const o=(k in S.acc)?S.acc[k]:!!def; return `<details class=\"acc\" data-acc=\"${k}\" ${o?\"open\":\"\"}><summary><span>${esc(title)}</span>${I.chev}</summary><div class=\"acc-b\">${inner}</div></details>`; }\n"
    "const cap1 = x => x ? x.charAt(0).toUpperCase()+x.slice(1) : x;\n"
    "const COARSE = !!(window.matchMedia && window.matchMedia(\"(pointer:coarse)\").matches);")

# Kamera-Knopf in der Leiste: ein Tipp oeffnet die Kamera
rep('''`<button class="tab cap" type="button" data-go="neu" aria-label''', '''`<button class="tab cap" type="button" data-act="snap" aria-label''')

# ---------------------------------------------------------------- Start
between("function viewStart(){", "function filtered(){", r'''function viewStart(){
  const st=computeStats(); const me=member(S.me);
  const upcoming=[...st.open].filter(l=>l.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5);
  const noDate=st.open.filter(l=>!l.dueDate).slice(0,Math.max(0,5-upcoming.length));
  const nO=st.overdue.length, nW=st.week.length;
  const cls=nO?"late":nW?"soon":S.letters.length?"":"info";
  const msg=nO?(nO===1?t("stOver1"):t("stOverN",{n:nO})):nW?(nW===1?t("stWeek1"):t("stWeekN",{n:nW})):S.letters.length?t("stOk"):t("stEmpty");
  const child=member(S.me)?.role==="child";
  return `
  <div class="hello"><div><h1>${esc(t("hello"))}${me?", "+esc(me.name):""}</h1></div></div>
  ${!S.members.length?`<div class="note stack"><b>${esc(t("setupTitle"))}</b><span>${esc(t("setupText"))}</span><button class="btn pri" type="button" data-go="familie">${I.people}<span>${esc(t("addMember"))}</span></button></div>`:""}
  ${S.letters.length?`<button class="statusc ${cls}" type="button" data-go="${nO||nW?"fristen":"briefe"}"><span class="dotc">${nO||nW?I.alert:I.check}</span><b>${esc(msg)}</b>${I.chev.replace("<svg",'<svg style="width:22px;height:22px;flex:none;opacity:.6"')}</button>`:`<p class="lead muted">${esc(msg)}</p>`}
  <button class="btn pri big snap" type="button" data-act="snap">${I.cam}<span>${esc(t("scanNow"))}</span></button>
  ${st.waitDue.length?`<div class="note warn"><b>${esc(t("waiting"))}:</b> ${st.waitDue.map(l=>esc(l.title||l.sender)).join(", ")}</div>`:""}
  ${upcoming.length||noDate.length?`<section class="stack"><h2>${esc(t("todoNow"))}</h2>
    <div class="list">${upcoming.map(letterRow).join("")}${noDate.map(letterRow).join("")}</div>
    <button class="btn" type="button" data-filter="offen"><span>${esc(t("showAll"))}</span>${I.chev}</button>
  </section>`:""}
  <div class="qtiles">
    <button class="qt" type="button" data-go="${window.ZF?"mails":"schreiben"}"><span class="wico">${I.mic}</span><b>${esc(t(window.ZF?"mStartBtn":"wStartBtn"))}</b></button>
    ${child?"":`<button class="qt" type="button" data-go="budget"><span class="wico">${I.wallet}</span><b>${esc(t("budget"))}</b></button>`}
  </div>
  <p class="small muted">${esc(t("privacy"))}</p>`;
}

''')

# ---------------------------------------------------------------- Briefe: Filter einklappen
rep('''  <div class="grid g2">
    <select class="i" id="fcat"''', '''  ${acc("v:flt",t("flt"),`<div class="grid g2 rsp">
    <select class="i" id="fcat"''')
rep('''<option value="${esc(m.id)}" ${f.person===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}</select>
  </div>
  ${list.length''', '''<option value="${esc(m.id)}" ${f.person===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}</select>
  </div><button class="btn" type="button" data-act="export">${I.down}<span>${esc(t("export"))}</span></button>`,!!(f.cat||f.person))}
  ${list.length''')
rep('''`<div class="card empty">${esc(S.letters.length?t("noMatch"):t("noLetters"))}</div>`}
  <div class="row"><button class="btn" type="button" data-act="export">${I.down}<span>${esc(t("export"))}</span></button></div>`;''',
    '''`<div class="card empty">${esc(S.letters.length?t("noMatch"):t("noLetters"))}</div>`}`;''')

# ---------------------------------------------------------------- Fristen: Rechner einklappen
rep('''`<div class="card empty">${esc(t("nothingDue"))}</div>`}</div>
  ${calcCard()}`;''', '''`<div class="card empty">${esc(t("nothingDue"))}</div>`}</div>
  ${acc("v:calc",t("calc"),calcCard())}`;''')

# ---------------------------------------------------------------- Familie
between("function viewFamilie(){", "/* ------------------------------ Erfassen", r'''function viewFamilie(){
  const acct = window.ZF && window.ZF.accountCard ? window.ZF.accountCard() : "";
  const child = member(S.me)?.role==="child";
  const members = `${S.members.map(m=>`<div class="mrow">
      <div class="row" style="flex-wrap:nowrap">${avatar(m.id,true)}<input class="i" style="flex:1;min-width:0" data-mname="${esc(m.id)}" value="${esc(m.name)}" aria-label="${esc(t("name"))}">
        <button class="icon-btn" type="button" data-mdelask="${esc(m.id)}" aria-label="${esc(t("delete"))}">${I.x}</button></div>
      ${S.mdelAsk===m.id?`<div class="note danger stack"><b>${esc(m.name)}: ${esc(t("mdelQ"))}</b><div class="grid g2"><button class="btn" type="button" data-mdelno="1">${esc(t("no"))}</button><button class="btn danger" type="button" data-mdel="${esc(m.id)}">${esc(t("yes"))}</button></div></div>`:""}
      <select class="i" data-mrole="${esc(m.id)}" aria-label="${esc(t("role"))}"><option value="adult" ${m.role!=="child"?"selected":""}>${esc(t("adult"))}</option><option value="child" ${m.role==="child"?"selected":""}>${esc(t("child"))}</option></select>
      <div class="colors" role="group" aria-label="${esc(t("color"))}">${COLORS.map(c=>`<button type="button" data-mcolor="${esc(m.id)}" data-c="${c}" aria-label="${c}" style="background:${c};border:${m.color===c?"4px solid var(--ink)":"1px solid var(--line)"}"></button>`).join("")}</div>
    </div>`).join("")}
    <form class="stack" id="addMember"><input class="i" id="newMember" placeholder="${esc(t("name"))}" aria-label="${esc(t("name"))}" autocomplete="off" enterkeyhint="done"><button class="btn pri" type="submit">+ ${esc(t("addMember"))}</button></form>`;
  const settings = `<label class="f">${esc(t("familyName"))}<input class="i" id="famInput" value="${esc(S.settings.familyName||"")}" autocomplete="off" enterkeyhint="done"></label>
    <button class="btn" type="button" data-act="export">${I.down}<span>${esc(t("export"))}</span></button><span class="small muted">${esc(t("exportSub"))}</span>`;
  const fb = `<p class="small muted" style="margin:0">${esc(t("fbSub"))}</p>
    <form class="stack" id="fbForm"><textarea class="i" id="fbIn" placeholder="${esc(t("fbPh"))}"></textarea><button class="btn pri" type="submit">${esc(t("fbSend"))}</button>${S.dict?`<button class="btn" type="button" data-dict="fbIn">${I.mic}<span>${esc(t("dictate"))}</span></button>`:""}</form>`;
  return `<h1>${esc(t("family"))}</h1>
  <section class="card stack"><h2>${esc(t("whoAreYou"))}</h2>
    <div class="chips" style="flex-wrap:wrap">${S.members.map(m=>`<button class="chip" type="button" data-me="${esc(m.id)}" aria-pressed="${S.me===m.id}">${avatar(m.id)}${esc(m.name)}</button>`).join("")||`<span class="muted">—</span>`}</div>
  </section>
  <section class="card stack"><h2>${esc(t("language"))}</h2>
    <div class="grid g2"><button class="btn ${S.lang==="de"?"pri":""}" type="button" data-lang="de" aria-pressed="${S.lang==="de"}">Deutsch</button><button class="btn ${S.lang==="tr"?"pri":""}" type="button" data-lang="tr" aria-pressed="${S.lang==="tr"}">Türkçe</button></div>
  </section>
  ${child?"":`<button class="btn big" type="button" data-go="budget" style="justify-content:flex-start">${I.wallet}<span style="flex:1;text-align:left">${esc(t("budget"))}</span>${I.chev}</button>`}
  ${acc("v:mem",t("members"),members)}
  ${acct?acc("v:acct",t("accAcct"),acct):""}
  ${acc("v:set",t("settings"),settings)}
  ${acc("v:fb",t("fbTitle"),fb)}
  <p class="small muted">${esc(t("legal"))}</p>`;
}

''')

# ---------------------------------------------------------------- Erfassen
between("function viewNeu(){", "function sel(id,opts,val,lab){", r'''function viewNeu(){
  if(!S.draft) S.draft=newDraft(); const d=S.draft;
  const thumbs=d.pages.map((p,i)=>`<div class="thumb">${p.type==="pdf"?`<div class="pdf">PDF</div>`:`<img src="${p.url}" alt="${esc(t("pages"))} ${i+1}">`}<button class="x" type="button" data-rmpage="${i}" aria-label="${esc(t("delete"))}">×</button></div>`).join("");
  const canAI = S.sample && S.imgLimits && d.pages.some(p=>p.type!=="pdf");
  const aiOk = canAI&&!d.analyzing&&!(window.ZF&&window.ZF.aiBlocked&&window.ZF.aiBlocked());
  const stepNo = d.step==="review"?3:(d.pages.length?2:1);
  const inputs = `<input id="camIn" class="hide" type="file" accept="image/*" capture="environment"><input id="fileIn" class="hide" type="file" accept="image/*,application/pdf" multiple>`;
  return `<h1>${esc(t("newLetter"))}</h1>
  <div class="steps" aria-hidden="true"><span class="${stepNo>=1?"on":""}">${esc(t("stepA"))}</span><span class="${stepNo>=2?"on":""}">${esc(t("stepB"))}</span><span class="${stepNo>=3?"on":""}">${esc(t("stepC"))}</span></div>
  ${d.step==="pick"&&!d.pages.length?`<section class="card stack" id="drop">
      <h2>${esc(t("snapFirst"))}</h2><p class="muted" style="margin:0">${esc(t("snapTip"))}</p>
      ${d.adding?`<div class="note row"><span class="spin"></span><b>${esc(t("snapBusy"))}</b></div>`:""}
      <label class="btn pri big snap" for="camIn">${I.cam}<span>${esc(t("takePhoto"))}</span></label>
      <label class="btn big" for="fileIn">${I.img}<span>${esc(t("pickFiles"))}</span></label>
      ${inputs}
      <button class="linkbtn" type="button" data-act="manual">${esc(t("snapManualLink"))}</button>
    </section>`:""}
  ${d.step==="pick"&&d.pages.length?`<section class="card stack" id="drop">
      <div class="thumbs">${thumbs}</div>
      ${d.adding?`<div class="note row"><span class="spin"></span><b>${esc(t("snapBusy"))}</b></div>`:""}
      ${d.pages.some(p=>p.type==="pdf")?`<span class="small muted">${esc(t("pdfNote"))}</span>`:""}
      ${d.analyzing?`<div class="note stack"><div class="row"><span class="spin"></span><b>${esc(t("reading"))}</b></div><button class="btn" type="button" data-act="stopAI">${esc(t("stop"))}</button></div>`
        :`<button class="btn pri big snap" type="button" data-act="analyze" ${aiOk?"":"disabled"}>${I.spark}<span>${esc(t("snapDone"))}</span></button>
          <div class="grid g2"><label class="btn" for="camIn">${I.cam}<span>${esc(t("snapMore"))}</span></label><label class="btn" for="fileIn">${I.img}<span>${esc(t("photos"))}</span></label></div>`}
      ${inputs}
      ${!S.sample?`<div class="note warn small">${esc(t("noAI"))}</div>`:""}
      ${S.sample&&window.ZF&&window.ZF.aiHint?window.ZF.aiHint():""}
      ${d.error?`<div class="note danger">${esc(d.error)}</div>`:""}
      ${d.analyzing?"":`<button class="linkbtn" type="button" data-act="manual">${esc(t("snapManualLink"))}</button>`}
    </section>`:""}
  ${d.step==="review"?(d.pages.length?`<div class="thumbs">${thumbs}</div>`:"")+reviewForm(d.data):""}`;
}
''')

between("function reviewForm(x){", "function ruleHint(x){", r'''function reviewForm(x){
  const more = `
    <label class="f">${esc(t("template"))}<select class="i" id="tplSel"><option value="">${esc(t("templateNone"))}</option>${TPL.map(tp=>`<option value="${tp.id}" ${x.tpl===tp.id?"selected":""}>${esc((tp[S.lang]||tp.de).t)}</option>`).join("")}</select></label>
    ${sel("category",Object.keys(CATS).map(k=>[k,L(CATS[k])]),x.category,t("category"))}
    ${inp("senderEmail",x.senderEmail,t("senderEmail"),"email",'placeholder="'+esc(t("emailPh"))+'" autocapitalize="none" autocorrect="off"')}
    <div class="grid g2 rsp">${inp("letterDate",x.letterDate,t("letterDate"),"date")}${inp("receivedAt",x.receivedAt,t("received"),"date")}</div>
    ${sel("recipientId",memberOpts(),x.recipientId,t("recipient"))}
    ${x.summaryTr?`<label class="f">Türkçe<textarea class="i" data-f="summaryTr">${esc(x.summaryTr)}</textarea></label>`:""}
    ${sel("dueKind",Object.keys(DUEKINDS).map(k=>[k,L(DUEKINDS[k])]),x.dueKind,t("dueKind"))}
    ${sel("priority",[["hoch",t("p_hoch")],["mittel",t("p_mittel")],["niedrig",t("p_niedrig")]],x.priority,t("priority"))}
    ${inp("reference",x.reference,t("reference"))}${inp("iban",x.iban,t("iban"),"text",'autocapitalize="characters" autocorrect="off"')}
    ${inp("purpose",x.purpose,t("purpose"))}${inp("keep",x.keep,t("keep"))}
    <div class="stack"><b class="small muted">${esc(t("tasks"))}</b>${(x.tasks||[]).map((tk,i)=>`<div class="row" style="flex-wrap:nowrap"><input class="i" style="flex:1;min-width:0" data-task="${i}" value="${esc(tk.text)}"><button class="icon-btn" type="button" data-rmtask="${i}" aria-label="${esc(t("delete"))}">${I.x}</button></div>`).join("")}
      <button class="btn ghost" type="button" data-act="addTask">+ ${esc(t("addTask"))}</button></div>
    ${sel("status",STATUSES.map(s=>[s,t("st_"+s)]),x.status,t("status"))}`;
  return `<section class="card stack" id="review"><h2>${esc(t("rvTitle"))}</h2><p class="muted" style="margin:0">${esc(t("rvSub"))}</p>
    ${x.isAd?`<div class="note warn">${esc(t("ad"))}</div>`:""}
    ${inp("title",x.title,t("rvWhat"))}
    ${inp("sender",x.sender,t("sender"))}
    <label class="f">${esc(t("summary"))}<textarea class="i" data-f="summary">${esc(x.summary||"")}</textarea></label>
    <div class="card stack" style="background:var(--bg);box-shadow:none">
      ${inp("dueDate",x.dueDate,t("rvDue"),"date")}
      ${x.dueSource?`<div class="small"><b>${esc(t("dueSource"))}:</b> „${esc(x.dueSource)}“ ${x.dueCertainty?`<span class="pill ${x.dueCertainty==="hoch"?"st-erledigt":x.dueCertainty==="mittel"?"st-offen":"st-info"}">${esc(t("certainty"))}: ${esc(x.dueCertainty)}</span>`:""}</div>`:""}
      ${x.dueRule&&RULES[x.dueRule]?ruleHint(x):""}
      <label class="check" style="border:0;padding:4px 0"><input type="checkbox" data-f="dueConfirmed" ${x.dueConfirmed?"checked":""}><span>${esc(t("confirmDue"))}</span></label>
    </div>
    ${inp("amount",x.amount,t("amount")+" (€)","number",'step="0.01" inputmode="decimal"')}
    ${S.members.length>1?sel("assigneeId",memberOpts(),x.assigneeId,t("rvWho")):""}
    ${acc("v:rv",t("rvMore"),more)}
    <button class="btn pri big" type="button" data-act="saveDraft" ${S.busy?"disabled":""}>${I.check}<span>${esc(S.busy?t("saving"):t("save"))}</span></button>
    <button class="btn" type="button" data-act="cancelDraft">${esc(t("cancel"))}</button>
  </section>`;
}
''')

# ---------------------------------------------------------------- Brief-Detail
i = s.index("  const taskDone=(l.tasks||[]).filter(x=>x.done).length, taskAll=(l.tasks||[]).length;\n  layer.innerHTML = `<div class=\"sheet\" data-close=\"1\">")
j = s.index("  const panel=layer.querySelector(\".panel\"); panel.dataset.id=l.id;", i)
SHEET = r'''  const taskDone=(l.tasks||[]).filter(x=>x.done).length, taskAll=(l.tasks||[]).length;
  const pay=payCard(l), tpl=tplCard(l), isOpen=OPEN.has(l.status);
  const sum=S.lang==="tr"&&l.summaryTr?l.summaryTr:l.summary;
  const hero = l.dueDate ? `<div class="hero ${isOpen?(dc==="late"?"late":dc==="soon"?"soon":""):"done"}">
      <span class="hero-k">${esc(L(DUEKINDS[l.dueKind]||DUEKINDS.sonstiges))}${l.amount?" · "+esc(euro(l.amount)):""}</span>
      <b class="hero-d">${esc(!isOpen?de(l.dueDate):(dc==="late"&&S.lang!=="tr"?t("overdue")+" "+dueLabel(l.dueDate):cap1(dueLabel(l.dueDate))))}</b>
      <span>${esc(t("due"))}: <span class="due">${esc(de(l.dueDate))}</span>${l.dueConfirmed?" ✓":""}</span>
      ${l.dueConfirmed?"":`<span class="small">${esc(t("unconfirmed"))}</span>`}${l.dueSource?`<span class="small">„${esc(l.dueSource)}“</span>`:""}
    </div>` : "";
  const secTasks = taskAll?l.tasks.map((x,i)=>`<label class="check ${x.done?"done":""}"><input type="checkbox" data-dtask="${i}" ${x.done?"checked":""}><span>${esc(x.text)}</span></label>`).join(""):"";
  const secPlan = `${isOpen&&l.status!=="arbeit"?`<button class="btn" type="button" data-setstatus="arbeit">${esc(t("startWork"))}</button>`:""}
        ${sel("d:assigneeId",memberOpts(),l.assigneeId,t("assignee"))}${sel("d:status",STATUSES.map(s=>[s,t("st_"+s)]),l.status,t("status"))}
        ${inp("d:dueDate",l.dueDate,t("dueDate"),"date")}${sel("d:dueKind",Object.keys(DUEKINDS).map(k=>[k,L(DUEKINDS[k])]),l.dueKind,t("dueKind"))}
        <label class="check" style="border:0;padding:4px 0"><input type="checkbox" data-f="d:dueConfirmed" ${l.dueConfirmed?"checked":""}><span>${esc(t("confirmDue"))}</span></label>
        ${l.status==="warten"?inp("d:followUp",l.followUp,t("followUp"),"date"):""}`;
  const secAI = `<div class="seg"><button type="button" data-ai="explain:de">${esc(t("explain"))}</button><button type="button" data-ai="explain:tr">${esc(t("explainTr"))}</button><button type="button" data-ai="explain:en">${esc(t("explainEn"))}</button>${S.tts?`<button type="button" data-act="speak">${esc(t("readAloud"))}</button>`:""}</div>
        <div class="ai" id="aiOut" aria-live="polite"></div>
        <form class="stack" id="askForm"><label class="f">${esc(t("ask"))}<input class="i" id="askIn" placeholder="${esc(t("askPh"))}" enterkeyhint="send"></label><button class="btn" type="submit">${esc(t("askBtn"))}</button></form>
        ${!S.sample?`<div class="note warn small">${esc(t("noAI"))}</div>`:""}`;
  const secReply = `<button class="btn" type="button" data-wfrom="${esc(l.id)}">${I.mic}<span>${esc(t("wFromLetter"))}</span></button>
        <div class="seg" role="group" aria-label="${esc(t("replyType"))}">${["widerspruch","raten","verlaengerung","rueckfrage","kuendigung","frei"].map(k=>`<button type="button" data-rtype="${k}" aria-pressed="${(S.rtype||"rueckfrage")===k}">${esc(t("r_"+k))}</button>`).join("")}</div>
        <label class="f">${esc(t("replyNotes"))}<textarea class="i" id="rNotes" style="min-height:70px"></textarea></label>
        <button class="btn pri" type="button" data-act="draftReply">${I.spark}<span>${esc(t("generate"))}</span></button>${S.dict?`<button class="btn" type="button" data-dict="rNotes">${I.mic}<span>${esc(t("dictate"))}</span></button>`:""}
        <textarea class="i" id="rText" style="min-height:220px" aria-label="${esc(t("reply"))}">${esc(l.reply?.text||"")}</textarea>
        ${replyHintHtml(l,S.rtype||"rueckfrage")}
        <label class="f">${esc(t("senderEmail"))}<input class="i" type="email" data-f="d:senderEmail" value="${esc(l.senderEmail||"")}" placeholder="${esc(t("emailPh"))}" autocapitalize="none" autocorrect="off"></label>
        <button class="btn pri" type="button" data-act="mailReply">${I.mail}<span>${esc(t("sendMail"))}</span></button><button class="btn" type="button" data-act="printReply">${I.down}<span>${esc(t("asPdf"))}</span></button>
        <div class="grid g2"><button class="btn" type="button" data-act="copyReply">${I.copy}<span>${esc(t("copy"))}</span></button>${navigator.share?`<button class="btn" type="button" data-act="shareReply">${esc(t("share"))}</button>`:""}<button class="btn" type="button" data-act="saveReply">${esc(t("save"))}</button></div>
        <select class="i" id="rVia" aria-label="${esc(t("sentVia"))}">${VIAS.map(v=>`<option value="${v}" ${l.reply?.via===v?"selected":""}>${esc(t("sentVia"))}: ${esc(t("v_"+v))}</option>`).join("")}</select><button class="btn" type="button" data-act="markSent">${esc(t("markSent"))}</button>
        ${l.reply?.sentAt?`<span class="small muted">✓ ${esc(de(l.reply.sentAt))} · ${esc(t("v_"+(l.reply.via||"post")))}</span>`:""}`;
  const secDetails = `${inp("d:title",l.title,t("subject"))}${inp("d:sender",l.sender,t("sender"))}
        <div class="grid g2 rsp">${inp("d:letterDate",l.letterDate,t("letterDate"),"date")}${inp("d:receivedAt",l.receivedAt,t("received"),"date")}</div>
        ${sel("d:recipientId",memberOpts(),l.recipientId,t("recipient"))}${sel("d:category",Object.keys(CATS).map(k=>[k,L(CATS[k])]),l.category,t("category"))}
        ${inp("d:amount",l.amount,t("amount")+" (€)","number",'step="0.01" inputmode="decimal"')}${sel("d:priority",[["hoch",t("p_hoch")],["mittel",t("p_mittel")],["niedrig",t("p_niedrig")]],l.priority,t("priority"))}
        ${inp("d:reference",l.reference,t("reference"))}${inp("d:iban",l.iban,t("iban"),"text",'autocapitalize="characters" autocorrect="off"')}
        ${inp("d:purpose",l.purpose,t("purpose"))}${inp("d:keep",l.keep,t("keep"))}`;
  const secHist = `<form class="stack" id="cForm"><textarea class="i" id="cIn" style="min-height:60px" placeholder="${esc(t("comment"))}"></textarea><button class="btn" type="submit">${esc(t("addComment"))}</button>${S.dict?`<button class="btn" type="button" data-dict="cIn">${I.mic}<span>${esc(t("dictate"))}</span></button>`:""}</form>
        <div class="log">${(l.log||[]).slice().reverse().map(e=>`<div class="e">${avatar(e.who)}<div><time>${esc(fmtTs(e.at))} · ${esc(memberName(e.who)||"—")}</time>${esc(e.text)}</div></div>`).join("")}</div>`;
  layer.innerHTML = `<div class="sheet" data-close="1"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="dtitle">
    <div class="head"><span class="grab" aria-hidden="true"></span><h2 id="dtitle">${esc(l.title||l.sender||"—")}</h2><button class="icon-btn" type="button" data-act="closeSheet" aria-label="${esc(t("close"))}">${I.x}</button></div>
    <div class="body">
      ${l.example?`<div class="note small"><span class="stamp">${esc(t("example"))}</span> ${S.lang==="tr"?"Bu örnek mektup. Silebilirsin.":"Das ist ein Beispielbrief zum Ausprobieren. Du kannst ihn löschen."}</div>`:""}
      <div class="row"><span class="pill st-${esc(l.status)}">${esc(t("st_"+l.status))}</span><span class="small muted">${esc([l.sender,L(CATS[l.category])].filter(Boolean).join(" · "))}</span>${l.priority==="hoch"?`<span class="pill" style="background:var(--danger-soft);color:var(--danger)">${esc(t("p_hoch"))}</span>`:""}</div>
      ${hero}
      ${sum?`<section class="stack"><h3>${esc(t("summary"))}</h3><p class="lead">${esc(sum)}</p>${S.tts?`<button class="btn" type="button" data-act="speakSum">${I.speaker}<span>${esc(t("readAloud"))}</span></button>`:""}</section>`:""}
      ${(l.pages||[]).length?`<div class="thumbs">${l.pages.map((p,i)=>p.type==="pdf"?`<a class="thumb" href="/_blob/${esc(p.id)}" target="_blank" rel="noopener"><div class="pdf">PDF</div></a>`:`<button class="thumb" type="button" data-view="/_blob/${esc(p.id)}" aria-label="${esc(t("photos"))} ${i+1}"><img src="/_blob/${esc(p.id)}" alt="" loading="lazy"></button>`).join("")}</div>`:""}
      <div class="acts">
        ${isOpen?`<button class="btn pri big" type="button" data-setstatus="erledigt">${I.check}<span>${esc(t("markDone"))}</span></button>`:`<button class="btn big" type="button" data-setstatus="offen">${esc(t("reopen"))}</button>`}
        <div class="g3">
          ${pay?`<button class="abtn" type="button" data-accgo="pay">${I.euro}<span>${esc(t("aPay"))}</span></button>`:""}
          <button class="abtn" type="button" data-accgo="reply">${I.pen}<span>${esc(t("aReply"))}</span></button>
          <button class="abtn" type="button" data-accgo="${tpl?"tpl":"ai"}">${I.help}<span>${esc(t("aExplain"))}</span></button>
        </div>
      </div>
      ${tpl?acc("tpl",t("accTpl"),tpl):""}
      ${taskAll?acc("tasks",t("tasks")+" · "+taskDone+"/"+taskAll,secTasks,true):""}
      ${pay?acc("pay",t("aPay")+" · "+euro(Number(l.amount)),pay):""}
      ${acc("ai",t("accAI"),secAI)}
      ${acc("reply",t("accReply"),secReply)}
      ${acc("plan",t("accPlan"),secPlan)}
      ${acc("details",t("accDetails"),secDetails)}
      ${acc("calc",t("calc"),calcCard(l.id))}
      ${acc("hist",t("history"),secHist)}
      <button class="btn danger" type="button" data-act="askDelete">${esc(t("delete"))}</button>
      <p class="small muted">${esc(t("legal"))}</p>
    </div></div></div>`;
'''
s = s[:i] + SHEET + s[j:]

# ---------------------------------------------------------------- Navigation: Zurueck schliesst das Blatt
rep('''function openLetter(id){ S.openId=id; S.rtype=S.rtype||"rueckfrage"; try{ history.replaceState(null,"","#b-"+id); }catch(e){} renderSheet(); }
function closeLetter(){ S.openId=null; try{ history.replaceState(null,"","#"+S.view); }catch(e){} renderSheet(); }''',
'''function openLetter(id){ const was=S.openId; if(was!==id){ for(const k in S.acc) if(!k.startsWith("v:")) delete S.acc[k]; } S.openId=id; S.rtype=S.rtype||"rueckfrage"; try{ let top=false; try{ top=!!(history.state&&history.state.zs); }catch(e){} if(was||top) history.replaceState({zs:1},"","#b-"+id); else history.pushState({zs:1},"","#b-"+id); }catch(e){} renderSheet(); }
function closeLetter(){ if(!S.openId) return; S.openId=null; let back=false; try{ back=!!(history.state&&history.state.zs); if(back) history.back(); }catch(e){ back=false; } if(!back){ try{ history.replaceState(null,"","#"+S.view); }catch(e){} } renderSheet(); }
window.addEventListener("popstate", ()=>{ const h=(location.hash||"").slice(1); if(h.startsWith("b-")) return; const v=document.getElementById("viewer"); if(v) v.remove(); if(S.openId){ S.openId=null; renderSheet(); } });''')

# ---------------------------------------------------------------- Klick-Logik
rep('''  if(ds.mdel){ queued("m"+ds.mdel,''', '''  if(ds.accgo){ S.acc[ds.accgo]=true; renderSheet(); const dd=document.querySelector('#layer [data-acc="'+ds.accgo+'"]'); if(dd){ dd.open=true; setTimeout(()=>{ try{ dd.scrollIntoView({behavior:"smooth",block:"start"}); }catch(e){} },40); } if(ds.accgo==="ai"&&S.sample&&$("#aiOut")&&!$("#aiOut").textContent.trim()) explain(S.lang==="tr"?"tr":"de"); return; }
  if(ds.mdelask){ S.mdelAsk=ds.mdelask; render(); return; }
  if(ds.mdelno!=null){ S.mdelAsk=""; render(); return; }
  if(ds.mdel){ S.mdelAsk=""; queued("m"+ds.mdel,''')
rep('''    case "closeSheet": closeLetter(); break;''', '''    case "closeSheet": closeLetter(); break;
    case "snap": { go("neu"); const dr=S.draft; if(COARSE&&dr&&dr.step==="pick"&&!dr.pages.length){ const ci=document.getElementById("camIn"); if(ci){ try{ ci.click(); }catch(e){} } } break; }
    case "speakSum": { const l=S.letters.find(x=>x.id===S.openId); const txt=l&&(S.lang==="tr"&&l.summaryTr?l.summaryTr:l.summary); if(txt&&S.tts) S.tts.speak(txt.slice(0,2000)).catch(()=>{}); break; }''')
rep('''data-act="doDelete">${esc(t("yesDelete"))}</button''', '''data-act="doDelete">${esc(t("yesDelete"))}</button''')
rep('''    case "noDelete": $("#delq")?.remove(); break;''', '''    case "noDelete": $("#delq")?.remove(); break;''')

# Fotos: Rueckmeldung waehrend der Vorbereitung
rep('''async function addFiles(files){
  const d=S.draft||(S.draft=newDraft());
  for(const f of files){''', '''async function addFiles(files){
  const d=S.draft||(S.draft=newDraft());
  if(!files.length) return;
  d.adding=true; render();
  for(const f of files){''')
rep('''catch(e){ toast("Bild konnte nicht gelesen werden"); }
  }
  render();
}''', '''catch(e){ toast(t("photoFail")); }
  }
  d.adding=false; render();
  setTimeout(()=>{ const m=$("#main"); if(m&&S.view==="neu") m.scrollTop=0; },30);
}''')

# ---------------------------------------------------------------- iPhone-Verhalten (Tastatur, Wischen, Aufklapp-Zustand)
JS = r'''
/* ------------------------------ iPhone-Feinschliff ------------------------------ */
document.addEventListener("toggle", ev=>{ const d=ev.target; if(d&&d.dataset&&d.dataset.acc) S.acc[d.dataset.acc]=d.open; }, true);
(function(){
  const vv=window.visualViewport, root=document.documentElement;
  function kb(){ if(!vv) return; const open=(window.innerHeight-vv.height)>140; root.style.setProperty("--vvh",Math.round(vv.height)+"px"); root.style.setProperty("--vvo",Math.round(vv.offsetTop)+"px"); document.body.classList.toggle("kb",open); }
  if(vv){ vv.addEventListener("resize",kb); vv.addEventListener("scroll",kb); kb(); }
  const FIELD="input:not([type=checkbox]):not([type=file]):not([type=radio]),textarea";
  document.addEventListener("focusin", ev=>{ const el=ev.target; if(!el||!el.matches||!el.matches(FIELD)) return; setTimeout(()=>{ if(document.activeElement===el){ try{ el.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){} } },350); });
  document.addEventListener("focusout", ()=>{ setTimeout(()=>{ const a=document.activeElement; if(!a||!a.matches||!a.matches(FIELD)){ try{ window.scrollTo(0,0); }catch(e){} kb(); } },150); });
  let sy=null, pn=null;
  document.addEventListener("touchstart", ev=>{ sy=null; pn=null; const tg=ev.target; if(!tg||!tg.closest) return; const h=tg.closest(".sheet .head"); if(!h||tg.closest("button")) return; sy=ev.touches[0].clientY; pn=h.closest(".panel"); }, {passive:true});
  document.addEventListener("touchmove", ev=>{ if(sy==null||!pn) return; const dy=ev.touches[0].clientY-sy; if(dy>0){ pn.style.transition="none"; pn.style.transform="translateY("+dy+"px)"; } }, {passive:true});
  document.addEventListener("touchend", ev=>{ if(sy==null||!pn) return; const dy=ev.changedTouches[0].clientY-sy, p=pn; sy=null; pn=null; if(dy>110) closeLetter(); else { p.style.transition="transform .18s"; p.style.transform=""; } }, {passive:true});
})();

/* ------------------------------ Start ------------------------------ */'''
rep("\n/* ------------------------------ Start ------------------------------ */", JS)

# Loeschen-Rueckfrage sichtbar machen
rep('''    case "askDelete": $("#layer .body").insertAdjacentHTML("beforeend",''', '''    case "askDelete": if($("#delq")){ $("#delq").scrollIntoView({block:"center"}); break; } setTimeout(()=>{ try{ $("#delq")?.scrollIntoView({behavior:"smooth",block:"center"}); }catch(e){} },40); $("#layer .body").insertAdjacentHTML("beforeend",''')

# Blatt nur beim ersten Oeffnen einblenden (kein Flackern beim Neuzeichnen)
rep("  const prevScroll = layer.querySelector(\".panel\")?.scrollTop||0;", "  const hadPanel = !!layer.querySelector(\".panel\");\n  const prevScroll = layer.querySelector(\".panel\")?.scrollTop||0;")
rep("  const panel=layer.querySelector(\".panel\"); panel.dataset.id=l.id;", "  const panel=layer.querySelector(\".panel\"); panel.dataset.id=l.id; if(!hadPanel) panel.classList.add(\"in\");")
# Nach dem Speichern: Adresse stimmt, damit "Zurueck" zur Briefliste fuehrt
rep('S.view="briefe"; S.filter.status="offen"; render(); openLetter(id); }', 'S.view="briefe"; S.filter.status="offen"; try{ history.replaceState(null,"","#briefe"); }catch(e){} render(); $("#main").scrollTop=0; openLetter(id); }')

open(dst, "w", encoding="utf-8").write(s)
print("ok", len(s))
