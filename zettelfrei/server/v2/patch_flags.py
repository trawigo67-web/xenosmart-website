"""Mailcut: Flaggen statt Globus in der Sprachauswahl (Wunsch Timur 25.11.2026).

Arbeitet auf der fertig gebauten index.html (letzter Schritt in make.sh):
  python3 patch_flags.py index.html index-neu.html

- Anmeldeseite: die vier wichtigsten Sprachen (DE, TR, AR, EN) als Flaggen-Knoepfe,
  dazu ein Knopf "+8" mit kleinen Flaggen, der alle 12 Sprachen mit Flagge zeigt.
- Andere Anmelde-Schritte und App-Kopfzeile: Flagge der aktuellen Sprache statt Globus.
- Sprach-Fenster in der App: vier grosse Flaggen-Kacheln, darunter "Weitere Sprachen".
- ?lang=xx in der Adresse waehlt die Sprache (Links von mailcut.de).
"""
import sys
import flags


def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        raise SystemExit(f"patch_flags: erwartet {count}x, gefunden {n}x: {old[:90]!r}")
    return s.replace(old, new)


def main(src, dst):
    s = open(src, encoding="utf-8").read()
    if "window.MCFLAGS=" in s:
        raise SystemExit("patch_flags: Datei ist schon gepatcht")

    # 1) Flaggen-Block als eigenes Script vor dem Server-Shim.
    s = rep(s, "<script>\n/* Mailcut Web: verbindet", "<script>\n" + flags.js() + "</script>\n<script>\n/* Mailcut Web: verbindet")

    # 2) ?lang=xx aus der Adresse uebernehmen (vor der Sprach-Erkennung im Shim).
    s = rep(s, 'const LANG = (()=>{ let v=""; try{ v=localStorage.getItem("pw_lang")||""; }catch(e){} if(ZLN[v]) return v;',
            'try{ const q=new URLSearchParams(location.search).get("lang"); if(q&&ZLN[q]){ localStorage.setItem("pw_lang",q); }'
            ' if(q!==null) history.replaceState(null,"",location.pathname+location.hash); }catch(e){}\n'
            'const LANG = (()=>{ let v=""; try{ v=localStorage.getItem("pw_lang")||""; }catch(e){} if(ZLN[v]) return v;')

    # 3) Anmeldeseite: Flaggen-Knoepfe.
    old_langs = ('const langs=`<div class="langs"><button type="button" data-lp="1" aria-expanded="false" '
                 'aria-label="Sprache · Language · Dil · اللغة">${globe}<span>${ZLN[LANG].n}</span></button></div>`;')
    new_langs = (
        'const FM=window.MC_MAIN, FX=window.MC_MORE, FL=window.MCFLAG, moreLbl=(window.MC_MORE_LABEL[LANG]||window.MC_MORE_LABEL.en);\n'
        '  const inMore=FX.includes(LANG);\n'
        '  const langs = mode==="welcome"\n'
        '    ? `<div class="langs fl4" role="group" aria-label="Sprache · Language · Dil · اللغة">${FM.map(k=>`<button type="button" class="flb" data-l="${k}" lang="${k}" aria-pressed="${LANG===k}" aria-label="${ZLN[k].n}" title="${ZLN[k].n}">${FL(k)}</button>`).join("")}'
        '<button type="button" class="flmore" data-lp="1" aria-expanded="false" aria-pressed="${inMore}" aria-label="${moreLbl}" title="${moreLbl}">${inMore?FL(LANG):""}<b>+${FX.length}</b><span class="minis">${FX.filter(k=>k!==LANG).slice(0,3).map(k=>FL(k)).join("")}</span></button></div>`\n'
        '    : `<div class="langs"><button type="button" data-lp="1" aria-expanded="false" aria-label="Sprache · Language · Dil · اللغة">${FL(LANG)}<span>${LANG.toUpperCase()}</span></button></div>`;'
    )
    s = rep(s, old_langs, new_langs)

    old_panel = ('const lpanel=`<div class="lgp" id="zf_lgp" hidden>${Object.keys(ZLN).map(k=>`<button type="button" data-l="${k}" '
                 'lang="${k}" dir="${ZLN[k].rtl?"rtl":"ltr"}" aria-pressed="${LANG===k}">${ZLN[k].n}</button>`).join("")}</div>`;')
    new_panel = ('const lpanel=`<div class="lgp" id="zf_lgp" hidden>${FM.concat(FX).map(k=>`<button type="button" data-l="${k}" '
                 'lang="${k}" dir="${ZLN[k].rtl?"rtl":"ltr"}" aria-pressed="${LANG===k}">${FL(k)}<span>${ZLN[k].n}</span></button>`).join("")}</div>`;')
    s = rep(s, old_panel, new_panel)

    # CSS fuer die Anmeldeseite (an den bestehenden Stil-Block anhaengen).
    old_css = '  #zfAuth .lgp button[aria-pressed=true]{background:#fff;color:#1d4ed8}'
    new_css = old_css + (
        '\n  #zfAuth .fl{display:inline-block;width:30px;height:20px;border-radius:4px;overflow:hidden;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.18)}'
        '\n  #zfAuth .fl svg{display:block;width:100%;height:100%}'
        '\n  #zfAuth .langs.fl4{gap:6px;flex-wrap:wrap}'
        '\n  #zfAuth .langs .flb{padding:6px 8px;min-width:48px;justify-content:center}'
        '\n  #zfAuth .langs .flb .fl{width:33px;height:22px}'
        '\n  #zfAuth .langs button[aria-pressed=true]{background:#fff;box-shadow:0 0 0 3px #facc15}'
        '\n  #zfAuth .langs .flmore{gap:6px;padding:6px 10px}'
        '\n  #zfAuth .langs .flmore[aria-pressed=true]{color:#1d4ed8}'
        '\n  #zfAuth .langs .flmore b{font-size:.95rem}'
        '\n  #zfAuth .langs .flmore .minis{display:inline-flex;flex-direction:row;align-items:center}'
        '\n  #zfAuth .langs .flmore b{direction:ltr;unicode-bidi:isolate}'
        '\n  #zfAuth .minis .fl{width:15px;height:10px;border-radius:2px;margin-inline-start:-4px;box-shadow:0 0 0 1.5px #1d4ed8}'
        '\n  #zfAuth .minis .fl:first-child{margin-inline-start:0}'
        '\n  #zfAuth .lgp button{display:flex;align-items:center;gap:10px;text-align:start}'
        '\n  #zfAuth .lgp .fl{width:27px;height:18px}'
        '\n  @media (max-width:380px){#zfAuth .langs.fl4{gap:5px}#zfAuth .langs .flb{min-width:44px;padding:6px 5px}#zfAuth .langs .flb .fl{width:30px;height:20px}#zfAuth .langs .flmore .minis{display:none}#zfAuth .langs .flmore{padding:6px 8px}}'
    )
    s = rep(s, old_css, new_css)

    # 4) App: Knopf in der Kopfzeile.
    s = rep(s, 'const h=GLOBE+`<span>${esc(S.lang.toUpperCase())}</span>`;',
            'const h=(window.MCFLAG?window.MCFLAG(S.lang):GLOBE)+`<span>${esc(S.lang.toUpperCase())}</span>`;')

    # 5) App: Sprach-Fenster mit vier grossen Flaggen und "Weitere Sprachen".
    old_grid = ('return `<div class="langs" role="group" aria-label="${esc(t("language"))}">${Object.keys(LN).map(k=>`<button type="button" '
                'data-lang="${k}" lang="${k}" dir="${LN[k].rtl?"rtl":"ltr"}" aria-pressed="${S.lang===k}"><b>${esc(LN[k].n)}</b>'
                '<small>${esc(LN[k].de)}</small></button>`).join("")}</div>')
    new_grid = (
        'const FL=window.MCFLAG||(()=>""), FM=(window.MC_MAIN||["de","tr","ar","en"]).filter(k=>LN[k]), FX=Object.keys(LN).filter(k=>!FM.includes(k));\n'
        '  const b=(k,big)=>`<button type="button" class="${big?"lbig":""}" data-lang="${k}" lang="${k}" dir="${LN[k].rtl?"rtl":"ltr"}" aria-pressed="${S.lang===k}">${FL(k)}<span><b>${esc(LN[k].n)}</b><small>${esc(LN[k].de)}</small></span></button>`;\n'
        '  const ml=(window.MC_MORE_LABEL&&(window.MC_MORE_LABEL[S.lang]||window.MC_MORE_LABEL.en))||"";\n'
        '  return `<div class="langs l4" role="group" aria-label="${esc(t("language"))}">${FM.map(k=>b(k,1)).join("")}</div>'
        '${FX.length?`<h3 class="lmore">${esc(ml)}</h3><div class="langs" role="group" aria-label="${esc(ml)}">${FX.map(k=>b(k,0)).join("")}</div>`:""}'
    )
    s = rep(s, old_grid, new_grid)

    # 6) App: Globus auf der Startkarte und unter "Familie" durch die Flagge ersetzen.
    s = rep(s, 'data-act="langOpen">${GLOBE}<span>${esc(LN[S.lang].n)} · ${esc(t("langTitle"))}</span>',
            'data-act="langOpen">${window.MCFLAG?window.MCFLAG(S.lang):GLOBE}<span>${esc(LN[S.lang].n)} · ${esc(t("langTitle"))}</span>')
    s = rep(s, '${GLOBE.replace("<svg",\'<svg style="width:24px;height:24px;flex:none"\')}<span style="flex:1;text-align:start">${esc(LN[S.lang].n)}</span>',
            '${window.MCFLAG?window.MCFLAG(S.lang):GLOBE.replace("<svg",\'<svg style="width:24px;height:24px;flex:none"\')}<span style="flex:1;text-align:start">${esc(LN[S.lang].n)}</span>')

    # CSS der App.
    old_acss = '.langs b{font-size:1.04rem;font-family:var(--f-body)} .langs small{color:var(--muted);font-size:.78rem}'
    new_acss = old_acss + (
        '\n.fl{display:inline-block;width:27px;height:18px;border-radius:4px;overflow:hidden;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.15)}'
        '\n.fl svg,.langbtn .fl svg,.btn .fl svg{display:block;width:100%!important;height:100%!important}'
        '\n.langbtn .fl{width:24px;height:16px}'
        '\n.langs button{flex-direction:row;align-items:center;gap:10px}'
        '\n.langs button>span{display:flex;flex-direction:column;gap:1px;min-width:0}'
        '\n.langs.l4,.lmore+.langs{grid-template-columns:repeat(2,minmax(0,1fr))}'
        '\n.langs.l4 button{min-height:66px}'
        '\n.langs.l4 .fl{width:39px;height:26px}'
        '\n.lmore{font-size:.95rem;margin:6px 0 -2px;color:var(--muted);font-family:var(--f-body)}'
    )
    s = rep(s, old_acss, new_acss)

    open(dst, "w", encoding="utf-8").write(s)
    print(f"patch_flags: ok ({len(s)} Bytes)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
