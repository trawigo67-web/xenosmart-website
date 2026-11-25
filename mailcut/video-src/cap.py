import json, sys, os, datetime
from playwright.sync_api import sync_playwright
base="http://127.0.0.1:8090"; lang=sys.argv[1]; out="shots/"+lang; os.makedirs(out,exist_ok=True)
ses=json.load(open("session.json"))
UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
due=(datetime.date.today()+datetime.timedelta(days=5)).isoformat()
AI={"betreff":"Jahresabrechnung Strom 2025","absender":"Stadtwerke Musterstadt","absenderEmail":"","kategorie":"rechnung","briefdatum":datetime.date.today().isoformat(),"empfaenger":"Murat",
 "zusammenfassung":"Das ist die Jahresabrechnung für Strom. Du musst 184,37 € nachzahlen. Dein neuer Abschlag ist 118 € im Monat.","zusammenfassungTr":"Bu yıllık elektrik faturası. 184,37 € ek ödeme yapman gerekiyor. Yeni aylık taksitin 118 €.",
 "aufgaben":["184,37 € überweisen"],"frist":{"datum":due,"art":"zahlung","textstelle":"Bitte überweisen Sie den Betrag bis zum genannten Datum.","sicherheit":"hoch","regel":None},
 "betrag":184.37,"iban":"DE89370400440532013000","verwendungszweck":"Kundennr 4711 Rechnung 2025","aktenzeichen":"4711","dringlichkeit":"mittel","istWerbung":False,"aufbewahrung":"3 Jahre","volltext":"…"}
def S(pg,n): pg.wait_for_timeout(500); pg.screenshot(path=f"{out}/{n}.png",type="png")
full = len(sys.argv)>2
with sync_playwright() as p:
    b=p.webkit.launch()
    def ctx(auth):
        c=b.new_context(viewport={"width":390,"height":844},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent=UA,locale="de-DE")
        if auth: c.add_cookies([{"name":k,"value":v,"url":base} for k,v in ses["cookies"].items()])
        c.add_init_script("try{localStorage.setItem('pw_lang','%s')}catch(e){}"%lang)
        return c
    c=ctx(False); pg=c.new_page(); pg.goto(base+"/"); pg.wait_for_selector("#zfAuth"); pg.wait_for_timeout(700); S(pg,"welcome"); c.close()
    c=ctx(True); pg=c.new_page()
    pg.route("**/api/ai", lambda r: r.fulfill(status=200,content_type="application/json",body=json.dumps({"text": json.dumps(AI),"usage":{"scans":{"used":1,"limit":30},"helps":{"used":1,"limit":60},"resets":"2026-12-01"}})))
    pg.goto(base+"/#start"); pg.wait_for_selector(".statusc"); pg.wait_for_timeout(800); S(pg,"start")
    if full:
        pg.evaluate("go('fristen')"); S(pg,"fristen")
        pg.evaluate("go('familie')"); S(pg,"familie")
        pg.evaluate("go('schreiben')"); S(pg,"schreiben")
        pg.locator("#langBtn").tap(); S(pg,"sprachen"); pg.locator('[data-act="langClose"]').tap()
        pg.evaluate("go('neu')"); S(pg,"neu")
        pg.locator("#fileIn").set_input_files("brief.jpg"); pg.wait_for_selector(".thumb img"); S(pg,"foto")
        pg.locator('[data-act="analyze"]').tap(); pg.wait_for_selector("#review"); pg.wait_for_timeout(600); S(pg,"pruefen")
        pg.locator('[data-act="saveDraft"]').tap(); pg.wait_for_selector(".sheet .panel"); pg.wait_for_timeout(2600); S(pg,"brief")
        pg.locator('[data-accgo="pay"]').tap(); pg.wait_for_timeout(900); S(pg,"zahlen")
        pg.locator('[data-acc="pay"] summary').tap(); pg.locator('[data-accgo="reply"]').tap(); pg.wait_for_timeout(900); S(pg,"antwort")
        pg.locator('.sheet .panel').evaluate("e=>e.scrollTop=0"); pg.locator('.sheet [data-setstatus="erledigt"]').tap(); pg.wait_for_timeout(2600); S(pg,"erledigt")
    b.close()
