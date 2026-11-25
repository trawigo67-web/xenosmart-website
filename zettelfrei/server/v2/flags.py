"""Mailcut: kleine SVG-Flaggen fuer die Sprachauswahl (App und Produktseite).

Bewusst als SVG und nicht als Emoji: Windows zeigt Flaggen-Emojis nur als zwei Buchstaben.
Alle Flaggen ohne IDs (mehrfach auf einer Seite moeglich), Seitenverhaeltnis 3:2.

Zuordnung Sprache -> Flagge (Entscheidung, bei Bedarf hier aendern):
  de Deutschland, tr Tuerkei, en Grossbritannien, ar Syrien (groesste arabischsprachige
  Gruppe in Deutschland), ku Kurdistan-Flagge, sq Albanien, fr Frankreich, ru Russland,
  uk Ukraine, pl Polen, ro Rumaenien, fa Iran (vereinfacht, ohne Wappen-Schrift).
"""
import json
import math

W, H = 30, 20


def _star(cx, cy, r_out, r_in, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot + i * 180 / n)
        pts.append(f"{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}")
    return " ".join(pts)


def _h3(a, b, c):
    return (f'<rect width="30" height="20" fill="{a}"/><rect y="6.67" width="30" height="6.67" fill="{b}"/>'
            f'<rect y="13.33" width="30" height="6.67" fill="{c}"/>')


def _v3(a, b, c):
    return (f'<rect width="10" height="20" fill="{a}"/><rect x="10" width="10" height="20" fill="{b}"/>'
            f'<rect x="20" width="10" height="20" fill="{c}"/>')


def _svg(body, vb="0 0 30 20"):
    return (f'<svg viewBox="{vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" '
            f'focusable="false">{body}</svg>')


FLAGS = {
    "de": _svg(_h3("#000", "#DD0000", "#FFCE00")),
    "tr": _svg('<rect width="30" height="20" fill="#E30A17"/>'
               '<circle cx="11.2" cy="10" r="5" fill="#fff"/><circle cx="12.45" cy="10" r="4" fill="#E30A17"/>'
               f'<polygon points="{_star(16.9, 10, 2.5, 1.0, rot=180)}" fill="#fff"/>'),
    "en": _svg('<rect width="60" height="30" fill="#012169"/>'
               '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>'
               '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2"/>'
               '<path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>'
               '<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>', "0 0 60 30"),
    "ar": _svg(_h3("#007A3D", "#fff", "#000")
               + "".join(f'<polygon points="{_star(x, 10, 2.1, 0.85)}" fill="#CE1126"/>' for x in (9, 15, 21))),
    "ku": _svg(_h3("#ED2024", "#fff", "#278E43")
               + f'<polygon points="{_star(15, 10, 3.1, 1.9, n=21)}" fill="#FEBD11"/>'
               + '<circle cx="15" cy="10" r="1.9" fill="#FEBD11"/>'),
    "sq": _svg('<rect width="30" height="20" fill="#E41E20"/>'
               '<path fill="#000" d="M15 4.2l-1.1 1.5-1.9-1.1-1.3 1.1 1.5.7-2.7.9-2.5-.5.9 1.6-1.5.6 2.3.8'
               '-1.1 1.2 2.7-.1.9 1.9-.9 2.4 1.5 1.3 1.1-1.3 1.1 1.3 1.1-1.3 1.1 1.3 1.5-1.3-.9-2.4.9-1.9 2.7.1'
               '-1.1-1.2 2.3-.8-1.5-.6.9-1.6-2.5.5-2.7-.9 1.5-.7-1.3-1.1-1.9 1.1z"/>'),
    "fr": _svg(_v3("#0055A4", "#fff", "#EF4135")),
    "ru": _svg(_h3("#fff", "#0039A6", "#D52B1E")),
    "uk": _svg('<rect width="30" height="10" fill="#0057B7"/><rect y="10" width="30" height="10" fill="#FFD700"/>'),
    "pl": _svg('<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#DC143C"/>'),
    "ro": _svg(_v3("#002B7F", "#FCD116", "#CE1126")),
    "fa": _svg(_h3("#239F40", "#fff", "#DA0000")
               + '<circle cx="15" cy="10" r="1.9" fill="none" stroke="#DA0000" stroke-width=".9"/>'
               + '<path d="M15 8v4" stroke="#DA0000" stroke-width=".8"/>'),
}

# Reihenfolge: die vier wichtigsten zuerst (Wunsch Timur 25.11.2026), dann die weiteren.
MAIN = ["de", "tr", "ar", "en"]
MORE = ["ku", "sq", "fr", "ru", "uk", "pl", "ro", "fa"]

# "Weitere Sprachen" in jeder Sprache (fuer den Knopf mit den kleinen Flaggen).
MORE_LABEL = {
    "de": "Weitere Sprachen", "tr": "Diğer diller", "en": "More languages", "ar": "لغات أخرى",
    "ku": "Zimanên din", "sq": "Gjuhë të tjera", "fr": "Autres langues", "ru": "Другие языки",
    "uk": "Інші мови", "pl": "Inne języki", "ro": "Alte limbi", "fa": "زبان‌های دیگر",
}


def js():
    """Globaler JS-Block: MCFLAGS, MCFLAG(k), MC_MAIN, MC_MORE, MC_MORE_LABEL."""
    return ("/* Mailcut: Flaggen fuer die Sprachauswahl (aus v2/flags.py erzeugt). */\n"
            f"window.MCFLAGS={json.dumps(FLAGS, ensure_ascii=False)};\n"
            f"window.MC_MAIN={json.dumps(MAIN)};window.MC_MORE={json.dumps(MORE)};\n"
            f"window.MC_MORE_LABEL={json.dumps(MORE_LABEL, ensure_ascii=False)};\n"
            "window.MCFLAG=function(k,c){return '<span class=\"fl'+(c?' '+c:'')+'\">'+(window.MCFLAGS[k]||'')+'</span>';};\n")


if __name__ == "__main__":
    print(js())
