import httpx, sys, json, datetime, secrets
base=sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8090"
c=httpx.Client(base_url=base)
email="demo%s@example.test"%secrets.token_hex(3)
r=c.post("/api/register",json={"email":email,"password":"demo-passwort-1","name":"Murat","familyName":"Yılmaz"}); print(r.status_code,r.text)
today=datetime.date.today()
def d(n): return (today+datetime.timedelta(days=n)).isoformat()
mem=c.get("/api/col/members").json(); print(mem)
me=(mem[0].get("id") if isinstance(mem,list) else None)
for i,(n,role,col) in enumerate([("Ayşe","adult","#b45309"),("Elif","child","#147a4a"),("Can","child","#7c3aed")]):
    c.put("/api/doc/members/m%s"%secrets.token_hex(4),json={"name":n,"role":role,"color":col,"order":i+1})
now=datetime.datetime.utcnow().isoformat()+"Z"
L=[
 dict(title="Stromrechnung Jahresabrechnung",sender="Stadtwerke Köln",category="rechnung",dueDate=d(3),dueKind="zahlung",amount=184.37,iban="DE89370400440532013000",status="neu",priority="hoch",summary="Die Jahresabrechnung für Strom. Es sind 184,37 € nachzuzahlen bis zum Fälligkeitstag.",summaryTr="Yıllık elektrik faturası. Son ödeme tarihine kadar 184,37 € ödenmeli."),
 dict(title="Bescheid über Kindergeld",sender="Familienkasse NRW West",category="behoerde",dueDate=d(21),dueKind="widerspruch",amount="",status="in_arbeit",priority="mittel",summary="Die Familienkasse bittet um einen Nachweis (Schulbescheinigung) für Elif.",summaryTr="Aile kasası Elif için okul belgesi istiyor."),
 dict(title="Rundfunkbeitrag Zahlungserinnerung",sender="ARD ZDF Deutschlandradio Beitragsservice",category="rechnung",dueDate=d(-2),dueKind="zahlung",amount=55.08,status="neu",priority="hoch",summary="Zahlungserinnerung für den Rundfunkbeitrag.",summaryTr="Yayın ücreti için ödeme hatırlatması."),
 dict(title="Elternbrief Klassenfahrt",sender="Gesamtschule Holweide",category="schule",dueDate=d(9),dueKind="rueckmeldung",amount=120,status="neu",priority="mittel",summary="Anmeldung zur Klassenfahrt, bitte Abschnitt unterschrieben zurückgeben.",summaryTr="Sınıf gezisi kaydı, imzalı bölümü geri verin."),
 dict(title="Nebenkostenabrechnung 2025",sender="Hausverwaltung Schmitz",category="wohnen",dueDate="",amount="",status="erledigt",priority="niedrig",summary="Guthaben 62 €, wird überwiesen.",summaryTr="62 € alacak, havale edilecek."),
]
for x in L:
    b=dict(letterDate=d(-5),receivedAt=d(-3),recipientId="",assigneeId="",dueSource="",dueCertainty="",dueRule="",dueConfirmed=False,senderEmail="",tpl="",purpose="",reference="",keep="",tasks=[],ocrText="",pages=[],reply=None,followUp="",createdAt=now,updatedAt=now,createdBy="",log=[],iban="")
    b.update(x)
    r=c.put("/api/doc/letters/l%s"%secrets.token_hex(5),json=b)
    if r.status_code>=300: print(r.status_code,r.text)
json.dump({"email":email,"cookies":dict(c.cookies)},open("session.json","w"))
print("seeded",email,dict(c.cookies))
