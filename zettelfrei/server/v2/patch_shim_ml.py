# Sprachpaket fuer den Web-Shim (Anmeldung, Konto, KI-Kontingent): 12 Sprachen, Rechts-nach-links.
import sys, json
s=open(sys.argv[1],encoding='utf-8').read()
V2=json.load(open(sys.argv[3],encoding='utf-8'))
def rep(old,new,n=1):
    global s
    assert s.count(old)==n,(s.count(old),old[:80]); s=s.replace(old,new)
ZLN={"de":{"n":"Deutsch","loc":"de-DE","sr":"de-DE"},"tr":{"n":"Türkçe","loc":"tr-TR","sr":"tr-TR"},"en":{"n":"English","loc":"en-GB","sr":"en-US"},
 "ar":{"n":"العربية","loc":"ar-u-nu-latn","sr":"ar-SA","rtl":1},"ku":{"n":"Kurdî (Kurmancî)","loc":"ku","sr":"tr-TR"},"sq":{"n":"Shqip","loc":"sq-AL","sr":"sq-AL"},
 "fr":{"n":"Français","loc":"fr-FR","sr":"fr-FR"},"ru":{"n":"Русский","loc":"ru-RU","sr":"ru-RU"},"uk":{"n":"Українська","loc":"uk-UA","sr":"uk-UA"},
 "pl":{"n":"Polski","loc":"pl-PL","sr":"pl-PL"},"ro":{"n":"Română","loc":"ro-RO","sr":"ro-RO"},"fa":{"n":"فارسی / دری","loc":"fa-IR-u-nu-latn","sr":"fa-IR","rtl":1}}
ZTX={k:v["S"] for k,v in V2.items()}
rep('''const LANG = (()=>{ try{ return localStorage.getItem("pw_lang") || (navigator.language||"de").slice(0,2); }catch(e){ return "de"; } })()==="tr"?"tr":"de";''',
'''const ZLN = '''+json.dumps(ZLN,ensure_ascii=False)+''';
const LANG = (()=>{ let v=""; try{ v=localStorage.getItem("pw_lang")||""; }catch(e){} if(ZLN[v]) return v;
  const nav=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);
  for(const x of nav){ const c=String(x).toLowerCase().split("-")[0]; if(c==="kmr"||c==="ckb"||c==="sdh") return "ku"; if(c==="prs") return "fa"; if(ZLN[c]) return c; }
  return "de"; })();
const ZRTL = !!ZLN[LANG].rtl;''')
rep('}[LANG];','}[LANG==="tr"?"tr":"de"];')
rep('}[LANG]);','''}[LANG==="tr"?"tr":"de"]);
TX.badge = LANG==="tr"?"Deneme {n} gün":"Test {n} T.";
Object.assign(TX, ('''+json.dumps(ZTX,ensure_ascii=False)+''')[LANG]||{});''')
rep('toLocaleDateString(LANG==="tr"?"tr-TR":"de-DE",','toLocaleDateString((()=>{ try{ new Intl.DateTimeFormat(ZLN[LANG].loc); return ZLN[LANG].loc; }catch(e){ return "de-DE"; } })(),')
rep('lang=(o&&o.lang)||(LANG==="tr"?"tr-TR":"de-DE");','lang=(o&&o.lang)||ZLN[LANG].sr||"de-DE";')
rep('''(LANG==="tr"?"Deneme ":"Test ")+a.trialDaysLeft+(LANG==="tr"?" gün":" T.")''','''TX.badge.replace("{n}",a.trialDaysLeft)''')
# Sprachwahl auf der Anmeldeseite
rep('''const langs=`<div class="langs"><button type="button" data-l="de" aria-pressed="${LANG==="de"}">Deutsch</button><button type="button" data-l="tr" aria-pressed="${LANG==="tr"}">Türkçe</button></div>`;''',
'''const globe=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9s1.3-6.5 3.9-9z"/></svg>`;
  const langs=`<div class="langs"><button type="button" data-lp="1" aria-expanded="false" aria-label="Sprache · Language · Dil · اللغة">${globe}<span>${ZLN[LANG].n}</span></button></div>`;
  const lpanel=`<div class="lgp" id="zf_lgp" hidden>${Object.keys(ZLN).map(k=>`<button type="button" data-l="${k}" lang="${k}" dir="${ZLN[k].rtl?"rtl":"ltr"}" aria-pressed="${LANG===k}">${ZLN[k].n}</button>`).join("")}</div>`;''')
rep('''#zfAuth .langs button[aria-pressed=true]{background:#fff;color:#1d4ed8}''',
'''#zfAuth .langs{display:flex;grid-template-columns:none}
  #zfAuth .langs button{display:flex;flex-direction:row;align-items:center;gap:6px;white-space:nowrap;border:0}
  #zfAuth .lgp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;background:rgba(255,255,255,.12);border-radius:16px;padding:10px}
  #zfAuth .lgp[hidden]{display:none}
  #zfAuth .lgp button{background:rgba(255,255,255,.16);border:0;color:#fff;border-radius:12px;min-height:48px;padding:8px 10px;font-weight:700;font-size:1rem;font-family:inherit;cursor:pointer}
  #zfAuth .lgp button[aria-pressed=true]{background:#fff;color:#1d4ed8}
  #zfAuth[dir=rtl] .backb svg{transform:scaleX(-1)}
  #zfAuth[dir=rtl] .backb{padding:8px 10px 8px 16px}
  #zfAuth[dir=rtl] input[type=email],#zfAuth[dir=rtl] input[type=password],#zfAuth[dir=rtl] #zf_code{direction:ltr;text-align:right}
  #zfAuth[dir=rtl] .langs{justify-content:flex-start}''')
rep('''el.innerHTML=css+`<div class="box">${langs}
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:6vh">''','''el.innerHTML=css+`<div class="box">${langs}${lpanel}
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:6vh">''')
rep('''${TX.back}</button>${langs}</div>''','''${TX.back}</button>${langs}</div>${lpanel}''')
rep('''document.getElementById("zfAuth")?.remove(); document.body.appendChild(el);''','''el.dir=ZRTL?"rtl":"ltr"; el.lang=LANG;
  document.getElementById("zfAuth")?.remove(); document.body.appendChild(el);
  el.querySelectorAll("[data-lp]").forEach(b=>b.onclick=()=>{ const p=el.querySelector("#zf_lgp"); p.hidden=!p.hidden; b.setAttribute("aria-expanded",String(!p.hidden)); });''')
open(sys.argv[2],'w',encoding='utf-8').write(s); print("shim ml ok",len(s))
