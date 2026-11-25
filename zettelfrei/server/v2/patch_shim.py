import sys
s=open(sys.argv[1],encoding='utf-8').read()
def rep(old,new,n=1):
    global s
    assert s.count(old)==n,(s.count(old),old[:80]); s=s.replace(old,new)
# Texte
rep('''consent:"Ich bin einverstanden, dass meine Briefe auf dem Mailcut-Server in Deutschland gespeichert und zum Auslesen an einen KI-Dienst übermittelt werden."},''',
'''consent:"Ich bin einverstanden, dass meine Briefe auf dem Mailcut-Server in Deutschland gespeichert und zum Auslesen an einen KI-Dienst übermittelt werden.",
   startFree:"Kostenlos starten",haveAcc:"Ich habe schon ein Konto",haveCode:"Ich habe einen Einladungscode",back:"Zurück",showPw:"Passwort anzeigen",
   hReg:"Neues Familienkonto",hLogin:"Willkommen zurück",hJoin:"Mit Einladungscode beitreten",pwShort:"Passwort",pwHint:"Mindestens 8 Zeichen",famOpt:"Familienname (z. B. Yılmaz)",needOk:"Bitte setz unten den Haken, dann geht es weiter."},''')
rep('''consent:"Mektuplarımın Almanya'daki Mailcut sunucusunda saklanmasını ve okunması için bir yapay zekâ hizmetine gönderilmesini kabul ediyorum."}''',
'''consent:"Mektuplarımın Almanya'daki Mailcut sunucusunda saklanmasını ve okunması için bir yapay zekâ hizmetine gönderilmesini kabul ediyorum.",
   startFree:"Ücretsiz başla",haveAcc:"Zaten hesabım var",haveCode:"Davet kodum var",back:"Geri",showPw:"Şifreyi göster",
   hReg:"Yeni aile hesabı",hLogin:"Tekrar hoş geldin",hJoin:"Davet koduyla katıl",pwShort:"Şifre",pwHint:"En az 8 karakter",famOpt:"Aile adı (ör. Yılmaz)",needOk:"Devam etmek için lütfen aşağıdaki kutuyu işaretle."}''')
i=s.index("function authScreen(mode){"); j=s.index("/* --------------------------------------------------- Testphase & Konto")
NEW=r'''function authScreen(mode){
  const el=document.createElement("div"); el.id="zfAuth";
  const logo=`<svg viewBox="0 0 100 100" width="84" height="84" aria-hidden="true" style="border-radius:20px;box-shadow:0 0 0 3px rgba(255,255,255,.35)"><rect width="100" height="100" rx="22" fill="#1d4ed8"/><rect x="18" y="28" width="64" height="46" rx="6" fill="#fff"/><path d="M22 33L50 54L78 33" fill="none" stroke="#1d4ed8" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/><path d="M30 86L74 16" stroke="#1d4ed8" stroke-width="12" stroke-linecap="round"/><path d="M30 86L74 16" stroke="#facc15" stroke-width="5" stroke-linecap="round"/></svg>`;
  const css=`<style>
  #zfAuth{position:fixed;inset:0;z-index:200;background:linear-gradient(160deg,#0f2a8a,#1d4ed8);color:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;font-family:"Instrument Sans",system-ui,sans-serif}
  body.kb #zfAuth{top:var(--vvo,0px);bottom:auto;height:var(--vvh,100%)}
  #zfAuth .box{max-width:440px;min-height:100%;margin:0 auto;padding:calc(env(safe-area-inset-top) + 20px) calc(env(safe-area-inset-right) + 20px) calc(env(safe-area-inset-bottom) + 28px) calc(env(safe-area-inset-left) + 20px);display:flex;flex-direction:column;gap:16px}
  #zfAuth h1{font-family:"Bricolage Grotesque",system-ui;font-weight:800;font-size:2.6rem;margin:0;letter-spacing:-.02em}
  #zfAuth h2{font-family:"Bricolage Grotesque",system-ui;font-weight:800;font-size:1.7rem;margin:0;line-height:1.15}
  #zfAuth form{background:#fff;color:#14213d;border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:14px}
  #zfAuth label{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:.95rem;color:#5b6478}
  #zfAuth input[type=text],#zfAuth input[type=email],#zfAuth input[type=password]{border:1px solid #d8deea;border-radius:12px;padding:14px;font-size:17px;min-height:54px;background:#eef1f6;color:#14213d;width:100%;-webkit-appearance:none;appearance:none}
  #zfAuth .go,#zfAuth .big{display:flex;align-items:center;justify-content:center;border:0;border-radius:16px;padding:16px;min-height:60px;font-size:1.15rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit;touch-action:manipulation}
  #zfAuth .go{background:#1d4ed8;color:#fff}
  #zfAuth .big.w{background:#fff;color:#1d4ed8}
  #zfAuth .big.o{background:rgba(255,255,255,.14);color:#fff;border:1.5px solid rgba(255,255,255,.55)}
  #zfAuth .lnk{background:none;border:0;color:#fff;font-weight:700;font-size:1rem;min-height:48px;padding:8px;cursor:pointer;text-decoration:underline;text-underline-offset:3px;font-family:inherit}
  #zfAuth .go:active,#zfAuth .big:active,#zfAuth .lnk:active{opacity:.7}
  #zfAuth .err{color:#b42318;font-weight:700}
  #zfAuth .err:empty{display:none}
  #zfAuth .pill{display:inline-block;background:#facc15;color:#14213d;border-radius:999px;padding:5px 14px;font-weight:800;font-size:.9rem}
  #zfAuth .langs{display:flex;gap:8px;justify-content:flex-end} #zfAuth .langs button{background:rgba(255,255,255,.15);border:0;color:#fff;border-radius:12px;padding:8px 14px;min-height:44px;cursor:pointer;font-weight:700;font-size:1rem;font-family:inherit}
  #zfAuth .langs button[aria-pressed=true]{background:#fff;color:#1d4ed8}
  #zfAuth .backb{align-self:flex-start;background:rgba(255,255,255,.15);border:0;color:#fff;border-radius:12px;padding:8px 16px 8px 10px;min-height:44px;cursor:pointer;font-weight:700;font-size:1rem;font-family:inherit;display:flex;align-items:center;gap:4px}
  #zfAuth .pwrow{display:flex;gap:10px;align-items:center;font-weight:400;color:#14213d;flex-direction:row}
  #zfAuth input[type=checkbox]{width:26px;height:26px;flex:none;margin:0;accent-color:#1d4ed8}
  #zfAuth a{color:#cfd8ff}
  #zfAuth .foot{font-size:.9rem;opacity:.9;margin-top:auto;padding-top:8px}
  </style>`;
  const langs=`<div class="langs"><button type="button" data-l="de" aria-pressed="${LANG==="de"}">Deutsch</button><button type="button" data-l="tr" aria-pressed="${LANG==="tr"}">Türkçe</button></div>`;
  const foot=`<div class="foot">${TX.contact} · <a href="https://mailcut.de/" target="_blank" rel="noopener">mailcut.de</a> · <a href="https://mailcut.de/datenschutz" target="_blank" rel="noopener">${TX.privacy}</a> · <a href="https://xenosmart.de/impressum.html" target="_blank" rel="noopener">${TX.imprint}</a></div>`;
  if(mode==="welcome"){
    el.innerHTML=css+`<div class="box">${langs}
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:6vh">${logo}
        <h1>Mailcut</h1>
        <div style="font-size:1.4rem;font-weight:700;line-height:1.25">${TX.hello}</div><div style="font-size:1.08rem;opacity:.92;line-height:1.45">${TX.sub}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:5vh">
        <button class="big w" type="button" data-m="register">${TX.startFree}</button>
        <div style="text-align:center;font-weight:700;color:#facc15;margin:-2px 0 6px">${TX.trial}</div>
        <button class="big o" type="button" data-m="login">${TX.haveAcc}</button>
        <button class="lnk" type="button" data-m="join">${TX.haveCode}</button>
      </div>${foot}</div>`;
  } else {
    el.innerHTML=css+`<div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><button class="backb" type="button" data-m="welcome"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>${TX.back}</button>${langs}</div>
      <h2>${mode==="login"?TX.hLogin:mode==="join"?TX.hJoin:TX.hReg}</h2>
      <form id="zfForm" novalidate>
        ${mode==="join"?`<label>${TX.code}<input type="text" id="zf_code" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="next" style="text-transform:uppercase;letter-spacing:.15em" required></label>`:""}
        ${mode!=="login"?`<label>${TX.name}<input type="text" id="zf_name" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" required></label>`:""}
        ${mode==="register"?`<label>${TX.famOpt}<input type="text" id="zf_fam" autocomplete="family-name" autocapitalize="words" enterkeyhint="next"></label>`:""}
        <label>${TX.email}<input type="email" id="zf_email" autocomplete="${mode==="login"?"username":"email"}" inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" required></label>
        <label>${mode==="login"?TX.pwShort:TX.pwShort+" · "+TX.pwHint}<input type="password" id="zf_pw" autocomplete="${mode==="login"?"current-password":"new-password"}" autocapitalize="none" autocorrect="off" minlength="8" enterkeyhint="go" required></label>
        <label class="pwrow"><input type="checkbox" id="zf_show"> <span>${TX.showPw}</span></label>
        ${mode!=="login"?`<label class="pwrow" style="align-items:flex-start"><input type="checkbox" id="zf_ok" required style="margin-top:2px"> <span>${TX.consent} <a href="https://mailcut.de/datenschutz" target="_blank" rel="noopener" style="color:#1d4ed8">${TX.privacy}</a></span></label>`:""}
        <div class="err" id="zf_err" role="alert"></div>
        <button class="go" type="submit">${mode==="login"?TX.login:TX.go}</button>
      </form>
      ${mode==="login"?`<button class="lnk" type="button" data-m="register">${TX.register}</button>`:`<button class="lnk" type="button" data-m="login">${TX.haveAcc}</button>`}
      ${foot}</div>`;
  }
  document.getElementById("zfAuth")?.remove(); document.body.appendChild(el);
  el.scrollTop=0;
  el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>authScreen(b.dataset.m));
  el.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{ try{localStorage.setItem("pw_lang",b.dataset.l)}catch(e){} location.reload(); });
  const show=el.querySelector("#zf_show"); if(show) show.onchange=()=>{ el.querySelector("#zf_pw").type=show.checked?"text":"password"; };
  const form=el.querySelector("#zfForm"); if(!form) return;
  form.onsubmit=async(ev)=>{ ev.preventDefault(); const g=id=>el.querySelector("#"+id); const err=g("zf_err"); err.textContent="";
    if(g("zf_ok")&&!g("zf_ok").checked){ err.textContent=TX.needOk; return; }
    const btn=form.querySelector(".go"); btn.disabled=true; btn.style.opacity=".6";
    const body={email:g("zf_email").value.trim(), password:g("zf_pw").value, name:g("zf_name")?.value.trim(), familyName:g("zf_fam")?.value.trim(), code:g("zf_code")?.value.trim()};
    try{ await api("/api/"+mode,{method:"POST", body:JSON.stringify(body)}); try{localStorage.setItem("zf_known","1")}catch(e){} location.reload(); }catch(e){ err.textContent=e.message||TX.err; btn.disabled=false; btn.style.opacity=""; try{ err.scrollIntoView({block:"center"}); }catch(x){} } };
}

'''
s=s[:i]+NEW+s[j:]
rep('''const show=()=>document.body?authScreen("register"):setTimeout(show,50); show();''',
'''let known=false; try{ known=!!(localStorage.getItem("zf_known")||localStorage.getItem("pw_me")); }catch(x){}
    const show=()=>document.body?authScreen(known?"login":"welcome"):setTimeout(show,50); show();''')
rep('''try{ if(!localStorage.getItem("pw_me")) localStorage.setItem("pw_me", ZF.me.user.memberId); }catch(e){}''',
'''try{ if(!localStorage.getItem("pw_me")) localStorage.setItem("pw_me", ZF.me.user.memberId); localStorage.setItem("zf_known","1"); }catch(e){}''')
# Test-Abzeichen: gut tippbar
rep('''s.style.cssText="border:0;border-radius:999px;padding:4px 10px;font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap;"''',
'''s.style.cssText="border:0;border-radius:999px;padding:4px 12px;min-height:44px;font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap;flex:none;"''')
open(sys.argv[2],'w',encoding='utf-8').write(s); print("shim ok",len(s))
