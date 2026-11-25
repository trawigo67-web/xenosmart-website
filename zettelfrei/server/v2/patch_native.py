"""Mailcut: Bruecke zur iPhone-/Android-App (native.js) in die fertige index.html einsetzen.
  python3 patch_native.py index.html index-neu.html
Im normalen Browser macht native.js nichts (nur aktiv, wenn window.Capacitor nativ laeuft)."""
import os
import sys


def main(src, dst):
    s = open(src, encoding="utf-8").read()
    if "native-app" in s:
        raise SystemExit("patch_native: Datei ist schon gepatcht")
    js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "native.js"), encoding="utf-8").read()
    i = s.rfind("</body>")   # letztes </body> (ein weiteres steht in einem JS-Text fuer den Druck)
    if i < 0 or s[i:].strip() not in ("</body>\n</html>", "</body></html>", "</body>\n</html>\n"):
        raise SystemExit("patch_native: Ende der Seite nicht gefunden")
    s = s[:i] + "<script>\n" + js + "</script>\n" + s[i:]
    open(dst, "w", encoding="utf-8").write(s)
    print("patch_native: ok")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
