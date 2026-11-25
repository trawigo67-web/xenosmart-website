"""Produktseite mailcut.de: Flaggen statt "DE | TR", Hinweis auf 12 Sprachen,
Seite zusaetzlich auf Englisch und Arabisch (Wunsch Timur 25.11.2026).

  python3 patch_site.py site/index.html site/index-neu.html

Die vier wichtigsten Sprachen (DE, TR, AR, EN) schalten die Seite um. Der Knopf "+8"
zeigt alle 12 Sprachen der App; die weiteren 8 oeffnen die App direkt in dieser Sprache
(https://app.mailcut.de/?lang=xx). Videos gibt es nur auf DE/TR; EN/AR zeigen die deutschen.
"""
import re
import sys
import flags
import site_i18n as I

NAMES = {"de": "Deutsch", "tr": "Türkçe", "en": "English", "ar": "العربية", "ku": "Kurdî", "sq": "Shqip",
         "fr": "Français", "ru": "Русский", "uk": "Українська", "pl": "Polski", "ro": "Română", "fa": "فارسی / دری"}
MAIN = ["de", "tr", "ar", "en"]


def fl(k, cls=""):
    return f'<span class="fl{(" " + cls) if cls else ""}">{flags.FLAGS[k]}</span>'


def L(de, tr, en, ar):
    return (f'<span lang-de>{de}</span><span lang-tr>{tr}</span>'
            f'<span lang-en>{en}</span><span lang-ar>{ar}</span>')


def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        raise SystemExit(f"patch_site: erwartet {count}x, gefunden {n}x: {old[:90]!r}")
    return s.replace(old, new)


def main(src, dst):
    s = open(src, encoding="utf-8").read()
    if "lang-en" in s:
        raise SystemExit("patch_site: Datei ist schon gepatcht")

    # 1) Alle Textpaare um EN/AR ergaenzen (und DE/TR-Texte zu den Sprachen aktualisieren).
    uniq = []
    for d in re.findall(r'<span lang-de>(.*?)</span><span lang-tr>', s):
        if d not in uniq:
            uniq.append(d)
    if len(uniq) != len(I.EN) or len(uniq) != len(I.AR):
        raise SystemExit(f"patch_site: {len(uniq)} Texte, aber EN {len(I.EN)} / AR {len(I.AR)}")

    def sub(m):
        d, t = m.group(1), m.group(2)
        i = uniq.index(d)
        if d in I.DE_TR_NEW:
            d, t = I.DE_TR_NEW[d]
        return L(d, t, I.EN[i], I.AR[i])
    s, n = re.subn(r'<span lang-de>(.*?)</span><span lang-tr>(.*?)</span>', sub, s)
    print("patch_site: Textpaare", n)

    # 2) CSS: Sprachen ein-/ausblenden, Flaggen, Sprachfenster.
    s = rep(s, '[lang-tr]{display:none}\nhtml[lang="tr"] [lang-de]{display:none} html[lang="tr"] [lang-tr]{display:revert}',
            '[lang-tr],[lang-en],[lang-ar]{display:none}\n'
            + "\n".join(f'html[lang="{k}"] [lang-de]{{display:none}} html[lang="{k}"] [lang-{k}]{{display:revert}}' for k in ("tr", "en", "ar"))
            + '\nhtml[dir="rtl"] body{font-family:"Segoe UI",Tahoma,system-ui,sans-serif}'
            '\n.fl{display:inline-block;width:27px;height:18px;border-radius:4px;overflow:hidden;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.18);vertical-align:middle}'
            '\n.fl svg{display:block;width:100%;height:100%}'
            '\n.flags{display:flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:12px;padding:3px;position:relative}'
            '\n.flags button{display:grid;place-items:center;border:0;background:none;padding:6px;border-radius:8px;cursor:pointer;min-width:40px;min-height:36px;color:var(--ink)}'
            '\n.flags button[aria-pressed="true"]{background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--accent)}'
            '\n.flags .more{display:flex;gap:5px;font:700 .85rem var(--f-body);padding:6px 8px}'
            '\n.flags .more b{direction:ltr;unicode-bidi:isolate}'
            '\n.minis{display:inline-flex}.minis .fl{width:14px;height:10px;border-radius:2px;margin-inline-start:-4px;box-shadow:0 0 0 1.5px var(--bg)}.minis .fl:first-child{margin-inline-start:0}'
            '\n.lgpop{position:absolute;top:calc(100% + 8px);inset-inline-end:0;width:min(340px,calc(100vw - 24px));background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 50px rgba(15,23,42,.25);padding:14px;z-index:20}'
            '\n.lgpop[hidden]{display:none}'
            '\n.lgpop p{font-weight:700;margin:0 0 4px}.lgpop small{display:block;color:var(--muted);font-size:.82rem;margin-bottom:10px}'
            '\n.lgpop .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'
            '\n.lgpop a,.lgpop button{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;min-height:44px;background:var(--bg);color:var(--ink);text-decoration:none;font:600 .95rem var(--f-body);cursor:pointer;text-align:start;justify-content:flex-start}'
            '\n.lgpop [aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}'
            '\n.tagflags{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 20px}.tagflags .fl{width:24px;height:16px;box-shadow:0 0 0 1px rgba(255,255,255,.5)}'
            '\n@media (max-width:560px){.lgpop{position:fixed;top:72px;left:12px;right:12px;width:auto;max-height:calc(100vh - 90px);overflow:auto}.logo .lt{display:none}.flags button{min-width:36px;padding:5px}.flags .fl{width:24px;height:16px}.flags .more .minis{display:none}}'
            '\n@media (max-width:370px){header.top .btn.sm{display:none}}')

    # 3) Kopfzeile: Flaggen statt "DE | TR".
    s = rep(s, '</svg>Mailcut</a>', '</svg><span class="lt">Mailcut</span></a>')
    head = ('<div class="flags" role="group" aria-label="Sprache · Dil · Language · اللغة">'
            + "".join(f'<button type="button" data-lang="{k}" aria-pressed="{str(k == "de").lower()}" aria-label="{NAMES[k]}" title="{NAMES[k]}">{fl(k)}</button>' for k in MAIN)
            + f'<button type="button" class="more" id="lgmore" aria-expanded="false" aria-controls="lgpop" title="12">'
            f'<b>+{len(flags.MORE)}</b><span class="minis">{"".join(fl(k) for k in flags.MORE[:3])}</span></button>'
            + '<div class="lgpop" id="lgpop" hidden>'
            + '<p>' + L("Mailcut gibt es in 12 Sprachen", "Mailcut 12 dilde", "Mailcut speaks 12 languages", "Mailcut متوفر بـ 12 لغة") + '</p>'
            + '<small>' + L("Die weiteren Sprachen öffnen direkt die App.", "Diğer diller doğrudan uygulamayı açar.",
                            "The other languages open the app directly.", "اللغات الأخرى تفتح التطبيق مباشرة.") + '</small>'
            + '<div class="grid">'
            + "".join(f'<button type="button" data-lang="{k}" aria-pressed="{str(k == "de").lower()}">{fl(k)}<span>{NAMES[k]}</span></button>' for k in MAIN)
            + "".join(f'<a href="https://app.mailcut.de/?lang={k}" lang="{k}">{fl(k)}<span>{NAMES[k]}</span></a>' for k in flags.MORE)
            + '</div></div></div>')
    s = rep(s, '<div class="langs" role="group" aria-label="Sprache / Dil"><button type="button" data-lang="de" aria-pressed="true">DE</button>'
               '<button type="button" data-lang="tr" aria-pressed="false">TR</button></div>', head)

    # 4) Hero: Flaggenreihe unter "in 12 Sprachen".
    tag_end = I.AR[1] + '</span></span>'
    s = rep(s, tag_end, tag_end + '\n    <div class="tagflags" aria-hidden="true">'
            + "".join(fl(k) for k in MAIN + flags.MORE) + '</div>')
    s = rep(s, '.tag{display:inline-block;', '.tag{display:inline-block;margin-inline-end:8px;')

    # 5) Beschreibung fuer Suchmaschinen.
    s = rep(s, 'Auf Deutsch und Türkisch. 30 Tage', 'In 12 Sprachen. 30 Tage')

    # 6) Script: vier Sprachen, Richtung, Videos (nur DE/TR), App-Links mit ?lang=, Sprachfenster.
    old_js = s[s.index('<script>\n(function(){\n  const set=(l)=>'):s.index('</script>\n</body>')]
    media = re.search(r'const src="([^"]*)"\+n', old_js).group(1)
    poster = re.search(r'v\.poster="([^"]*)"\+n', old_js).group(1)
    new_js = ('<script>\n(function(){\n'
              '  const MAIN=["de","tr","ar","en"], pop=document.getElementById("lgpop"), more=document.getElementById("lgmore");\n'
              '  const set=(l)=>{ if(!MAIN.includes(l)) l="de"; const h=document.documentElement; h.lang=l; h.dir=(l==="ar")?"rtl":"ltr";\n'
              '    document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));\n'
              '    document.querySelectorAll(\'a[href^="https://app.mailcut.de/"]:not([lang])\').forEach(a=>{ a.href="https://app.mailcut.de/?lang="+l; });\n'
              '    const vl=(l==="tr")?"tr":"de";\n'
              '    const sv=document.getElementById("spot"), ev=document.getElementById("expl"), kv=document.getElementById("kostenv");\n'
              f'    [[sv,"spot"],[ev,"expl"],[kv,"kosten"]].forEach(([v,n])=>{{ const src="{media}"+n+"_"+vl+".mp4"; if(!v.querySelector("source").src.endsWith(src)){{ v.pause(); v.poster="{poster}"+n+"_"+vl+".jpg"; v.querySelector("source").src=src; v.load(); }} }});\n'
              '    try{ localStorage.setItem("pw_lang",l); }catch(e){} };\n'
              '  document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>{ set(b.dataset.lang); pop.hidden=true; more.setAttribute("aria-expanded","false"); }));\n'
              '  more.addEventListener("click",ev=>{ ev.stopPropagation(); pop.hidden=!pop.hidden; more.setAttribute("aria-expanded",String(!pop.hidden)); });\n'
              '  document.addEventListener("click",ev=>{ if(!pop.hidden&&!pop.contains(ev.target)){ pop.hidden=true; more.setAttribute("aria-expanded","false"); } });\n'
              '  document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!pop.hidden){ pop.hidden=true; more.setAttribute("aria-expanded","false"); more.focus(); } });\n'
              '  let l="de"; try{ const q=new URLSearchParams(location.search).get("lang"); const st=localStorage.getItem("pw_lang");\n'
              '    const nav=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]).map(x=>String(x).toLowerCase().split("-")[0]);\n'
              '    l=[q,st].find(x=>MAIN.includes(x))||nav.find(x=>MAIN.includes(x))||(nav.some(x=>x&&x!=="de")?"en":"de"); }catch(e){}\n'
              '  set(l);\n'
              '})();\n')
    s = s.replace(old_js, new_js)

    open(dst, "w", encoding="utf-8").write(s)
    print(f"patch_site: ok ({len(s.encode())} Bytes)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
