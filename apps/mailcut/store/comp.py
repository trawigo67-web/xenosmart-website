import os,base64
from playwright.sync_api import sync_playwright
CAP={"de":{"start":"Alle Briefe der Familie.<br>Auf einen Blick.","neu":"Brief fotografieren.<br>Fertig.","brief":"Verstehen, was drinsteht.<br>Und bis wann.","fristen":"Keine Frist<br>mehr verpassen."},
"tr":{"start":"Ailenin tüm mektupları.<br>Tek bakışta.","neu":"Mektubu fotoğrafla.<br>Bu kadar.","brief":"Ne yazdığını anla.<br>Ve ne zamana kadar.","fristen":"Artık hiçbir süreyi<br>kaçırma."},
"en":{"start":"All your family's letters.<br>At a glance.","neu":"Snap a photo of the letter.<br>Done.","brief":"Understand what it says.<br>And by when.","fristen":"Never miss<br>a deadline again."}}
T="""<html><body style="margin:0;width:1290px;height:2796px;background:linear-gradient(170deg,#1d4ed8,#1e3a8a);font-family:'DejaVu Sans',Arial,sans-serif;overflow:hidden">
<div style="color:#fff;font-size:78px;font-weight:700;line-height:1.14;text-align:center;padding:150px 60px 0;height:330px">%s</div>
<div style="width:1040px;margin:70px auto 0;border-radius:70px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.45);border:10px solid #0b1b4d"><img src="data:image/png;base64,%s" style="width:1040px;display:block"></div></body></html>"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1290,"height":2796})
    for l in CAP:
        os.makedirs(f"final/{l}",exist_ok=True)
        for i,k in enumerate(["start","neu","brief","fristen"]):
            pg.set_content(T%(CAP[l][k],base64.b64encode(open(f"raw/{l}/{k}.png","rb").read()).decode())); pg.wait_for_timeout(900)
            pg.screenshot(path=f"final/{l}/mailcut_{l}_{i+1}_{k}.png")
    b.close()
