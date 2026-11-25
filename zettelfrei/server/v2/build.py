import sys
import os
a=open(os.environ.get('APP','app-src.html'),encoding='utf-8').read(); shim=open(os.environ.get('SHIM','shim.html'),encoding='utf-8').read()
HEAD='''<meta name="theme-color" content="#1d4ed8">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-title" content="Mailcut">
<meta name="apple-mobile-web-app-capable" content="yes">
'''
G='''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap" rel="stylesheet">
'''
def rep(s,x,y):
    assert s.count(x)==1,(s.count(x),x[:60]); return s.replace(x,y)
b=rep(a,'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',HEAD+'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">')
b=rep(b,G,'<link rel="stylesheet" href="/fonts/fonts.css">\n')
b=rep(b,'--f-body:"Atkinson Hyperlegible",','--f-body:"Instrument Sans",')
b=rep(b,'<script>\n"use strict";',shim+'<script>\n"use strict";')
open(sys.argv[1] if len(sys.argv)>1 else 'index.html','w',encoding='utf-8').write(b)
print(len(b))
