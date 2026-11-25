import json,re,sys
from scripts import N
from align import cuts, weight
OFF=0.4; TAIL=1.4
def caps(k,T):
    out=[]
    for i,p in enumerate(N[k].split('\n\n')):
        p=p.replace('meylkat nokta ep','mailcut.app').replace('mailcut punkt app','mailcut.app').replace('Meylkat','Mailcut').replace('İki bin yirmi beşte','2025\'te')
        parts=re.split(r'(?<=[.?!])\s+',p) if len(p)>80 else [p]
        q=[]
        for x in parts:
            if len(x)>92:
                cs=[m.end() for m in re.finditer(r'(, | – |: )',x)]
                if cs:
                    c=min(cs,key=lambda i:abs(i-len(x)/2)); q+= [x[:c].rstrip(' –').rstrip(), x[c:]]; continue
            q.append(x)
        parts=q
        # sehr kurze Saetze an den Nachbarn haengen
        m=[]
        for s in parts:
            if m and (len(s)<22 or len(m[-1])<22) and len(m[-1])+len(s)<85: m[-1]+=' '+s
            else: m.append(s)
        ws=[weight(s) for s in m]; tot=sum(ws); a=T[i]; span=T[i+1]-T[i]
        for s,w in zip(m,ws):
            b=a+span*w/tot; out.append({'t0':round(a,2),'t1':round(b,2),'text':s}); a=b
    return out
S={
 'de':dict(tag='Schluss mit dem Papierkram',trial='30 Tage kostenlos testen',stamp='FRIST!',
   p_h='Papierkram ohne Ende?',p_s='Briefe vom Amt, Rechnungen, Mahnungen …',
   f_h='Einfach fotografieren',f_s='Ein Tipp genügt',
   r_h='Mailcut liest & erklärt',r_s='Absender, Betrag, Frist – automatisch',
   d_h='Bezahlen. Antworten. Erledigt.',d_s='Alles an einem Ort',
   l_h='Für die ganze Familie',l_s='In 12 Sprachen',
   c_due='In 5 Tagen',c_duel='Frist',c_amtl='Betrag',c_sndl='Absender',
   e1='Wer behält da den Überblick?',step='Schritt {n} von 5',
   e2='Brief fotografieren',e2b=['Ein Tipp öffnet die Kamera','Mehrere Seiten möglich','Auch PDF'],
   e3='Die KI liest alles aus',e3b=['Absender, Betrag, Frist','Du prüfst nur noch kurz','Fristen nach deutschem Recht'],
   e4='Sofort verstehen',e4b=['Einfache Worte','In deiner Sprache','Vorlesen lassen'],
   e5='Bezahlen oder antworten',e5b=['QR-Code für die Bank-App','Antwort einfach einsprechen','Sauberer deutscher Brief'],
   e6='Erledigt',e6b=['Ein Tipp – abgehakt','Alle Fristen im Blick','Für die ganze Familie'],
   e7='In 12 Sprachen',e7s='Briefe verstehen – in der eigenen Sprache',
   k1='39 Mio.',k1l='neue Inkasso-Fälle in Deutschland',k1s='im Jahr 2025',k2='53 %',k2l='zahlen Rechnungen zu spät',k2s='Menschen in Deutschland, 2026',
   k3='Was ein vergessener Brief kosten kann',
   rows=[('Inkasso-Gebühr','Forderung 50–500 €, einfacher Fall','30,90 €'),('Mahnbescheid','Gerichtskosten','mind. 38 €'),('Steuererklärung zu spät','Verspätungszuschlag','mind. 25 € / Monat'),('Rundfunkbeitrag zu spät','Säumniszuschlag','mind. 8 €'),('Kindergeld-Nachweis vergessen','Rückforderung möglich','259 € / Monat')],
   k6='Eine Gebühr kostet mehr als 6 Monate Mailcut',b1='1 × Inkasso-Gebühr',b2='6 Monate Mailcut (6 × 4,99 €)',
   k7='Jede Frist im Blick',k7b=['Überfällig, diese Woche, später','Bevor es teuer wird','Für die ganze Familie'],
   src='Quellen: BDIU Branchenreport 2025 · Intrum ECPR 2026 · RVG § 13 · GKG Nr. 1100 · § 152 AO · Rundfunkbeitragssatzung · Kindergeld 2026',
   i1='Mailcut aufs Handy',i1s='in 1 Minute',i2='Safari öffnen',i2s='mailcut.app eingeben',i3='Teilen antippen',i3s='oder zuerst die drei Punkte',i4='„Zum Home-Bildschirm“',i4s='nach unten scrollen',
   i5='„Hinzufügen“ – fertig!',i5s='Mailcut öffnet sich wie eine App',i6='Chrome: drei Punkte',i6s='„Installieren und Verknüpfung erstellen“',i7='Kostenlos starten',i7s='30 Tage gratis',i8='Ersten Brief fotografieren',i8s='Mailcut erklärt ihn dir',langs=['de','ar','ru']),
 'tr':dict(tag='Kâğıt işleri derdine son',trial='30 gün ücretsiz dene',stamp='SON TARİH!',
   p_h='Bitmeyen kâğıt işleri?',p_s='Resmî yazılar, faturalar, ihtarlar …',
   f_h='Sadece fotoğrafını çek',f_s='Tek dokunuş yeter',
   r_h='Mailcut okur ve açıklar',r_s='Gönderen, tutar, son tarih – otomatik',
   d_h='Öde. Cevapla. Bitti.',d_s='Hepsi tek yerde',
   l_h='Bütün aile için',l_s='12 dilde',
   c_due='5 gün sonra',c_duel='Son tarih',c_amtl='Tutar',c_sndl='Gönderen',
   e1='Bunları kim takip edebilir?',step='Adım {n} / 5',
   e2='Mektubun fotoğrafını çek',e2b=['Tek dokunuşla kamera açılır','Birden fazla sayfa olur','PDF de olur'],
   e3='Yapay zekâ hepsini okur',e3b=['Gönderen, tutar, son tarih','Sen sadece kısaca kontrol et','Alman hukukuna göre süreler'],
   e4='Hemen anla',e4b=['Sade kelimeler','Kendi dilinde','Sesli okuma'],
   e5='Öde ya da cevap yaz',e5b=['Banka uygulaması için QR kod','Cevabı sadece söyle','Düzgün Almanca mektup'],
   e6='Bitti',e6b=['Tek dokunuş – tamam','Tüm süreler göz önünde','Bütün aile için'],
   e7='12 dilde',e7s='Mektupları kendi dilinde anla',
   k1='39 milyon',k1l='Almanya’da yeni İnkasso dosyası',k1s='2025 yılında',k2='%53',k2l='faturalarını geç ödüyor',k2s='Almanya’da yaşayanlar, 2026',
   k3='Unutulan bir mektup kaça patlar?',
   rows=[('İnkasso ücreti','50–500 € alacak, basit durum','30,90 €'),('Mahkeme ödeme emri','Mahnbescheid · mahkeme masrafı','en az 38 €'),('Vergi beyannamesi gecikirse','Gecikme zammı','en az 25 € / ay'),('Yayın ücreti gecikirse','Rundfunkbeitrag · gecikme zammı','en az 8 €'),('Kindergeld belgesi unutulursa','Geri istenebilir','259 € / ay')],
   k6='Tek bir ücret, 6 aylık Mailcut’tan pahalı',b1='1 × İnkasso ücreti',b2='6 ay Mailcut (6 × 4,99 €)',
   k7='Her son tarih göz önünde',k7b=['Süresi geçen, bu hafta, sonra','İş pahalıya patlamadan','Bütün aile için'],
   src='Kaynaklar: BDIU Branchenreport 2025 · Intrum ECPR 2026 · RVG § 13 · GKG Nr. 1100 · § 152 AO · Rundfunkbeitragssatzung · Kindergeld 2026',
   i1='Mailcut telefonunda',i1s='1 dakikada',i2='Safari’yi aç',i2s='mailcut.app yaz',i3='Paylaş’a dokun',i3s='ya da önce üç noktaya',i4='„Ana Ekrana Ekle“',i4s='aşağı kaydır',
   i5='„Ekle“ – tamam!',i5s='Mailcut uygulama gibi açılır',i6='Chrome: üç nokta',i6s='„Yükle ve kısayol oluştur“',i7='Ücretsiz başla',i7s='30 gün ücretsiz',i8='İlk mektubunu çek',i8s='Mailcut onu sana açıklar',langs=['tr','ar','ru'])}
def build(name):
    kind,lang=name.split('_'); s=S[lang]; c=cuts(name); T=[0]+[round(x+OFF,2) for x in c[1:]]; T[-1]=round(c[-1]+OFF,2)
    fmt='v' if kind in('spot','install') else 'h'
    sc=[]; n=lambda i:T[i]
    logo=lambda i,url,tr=True:dict(t0=n(i),kind='logo',bg='dark',tag=s['tag'],url=url,trial=s['trial'] if tr else '')
    if kind=='spot':
        sc=[dict(t0=0,kind='papers',bg='dark',h=s['p_h'],s=s['p_s'],stamp=s['stamp'],stampAt=round(n(0)+(n(1)-n(0))*.55,2)),
            dict(t0=n(1),kind='phone',h=s['f_h'],s=s['f_s'],screens=[dict(src='start'),dict(src='foto',at=n(1)+1.3)],taps=[dict(at=n(1)+1.0,x=195,y=264)]),
            dict(t0=n(2),kind='phone',h=s['r_h'],s=s['r_s'],screens=[dict(src='foto'),dict(src='pruefen',at=n(2)+0.9),dict(src='brief',at=n(2)+2.6)],taps=[dict(at=n(2)+0.6,x=195,y=403)],
                 chips=[dict(at=n(2)+3.0,side='l',y=150,label=s['c_duel'],value=s['c_due'],cls='warn'),dict(at=n(2)+3.5,side='r',y=330,label=s['c_amtl'],value='184,37 €')]),
            dict(t0=n(3),kind='phone',h=s['d_h'],s=s['d_s'],screens=[dict(src='brief'),dict(src='zahlen',at=n(3)+0.8),dict(src='antwort',at=n(3)+1.9),dict(src='erledigt',at=n(3)+3.0)],taps=[dict(at=n(3)+0.5,x=74,y=818)]),
            dict(t0=n(4),kind='langs',h=s['l_h'],s=s['l_s'],langs=s['langs']),
            logo(5,'mailcut.de')]
    if kind=='expl':
        st=lambda k:s['step'].format(n=k)
        sc=[dict(t0=0,kind='papers',bg='dark',h=s['e1'],s=s['p_s'],stamp=s['stamp'],stampAt=round(n(0)+(n(1)-n(0))*.6,2)),
            dict(t0=n(1),kind='phone',kick=st(1),step=1,h=s['e2'],bullets=s['e2b'],screens=[dict(src='start'),dict(src='neu',at=n(1)+2.6),dict(src='foto',at=n(1)+4.4)],taps=[dict(at=n(1)+2.3,x=195,y=264),dict(at=n(1)+4.1,x=195,y=310)]),
            dict(t0=n(2),kind='phone',kick=st(2),step=2,h=s['e3'],bullets=s['e3b'],screens=[dict(src='foto'),dict(src='pruefen',at=n(2)+1.4)],taps=[dict(at=n(2)+1.1,x=195,y=403)],
                 chips=[dict(at=n(2)+2.4,side='l',y=180,label=s['c_sndl'],value='Stadtwerke Musterstadt'),dict(at=n(2)+3.0,side='l',y=400,label=s['c_duel'],value=s['c_due'],cls='warn'),dict(at=n(2)+3.6,side='l',y=600,label=s['c_amtl'],value='184,37 €')]),
            dict(t0=n(3),kind='phone',kick=st(3),step=3,h=s['e4'],bullets=s['e4b'],screens=[dict(src='brief')],taps=[dict(at=n(4)-2.2,x=195,y=533)]),
            dict(t0=n(4),kind='phone',kick=st(4),step=4,h=s['e5'],bullets=s['e5b'],screens=[dict(src='brief'),dict(src='zahlen',at=n(4)+1.0),dict(src='antwort',at=n(4)+4.6),dict(src='schreiben',at=n(4)+7.0)],taps=[dict(at=n(4)+0.7,x=74,y=818)]),
            dict(t0=n(5),kind='phone',kick=st(5),step=5,h=s['e6'],bullets=s['e6b'],screens=[dict(src='brief'),dict(src='erledigt',at=n(5)+1.2),dict(src='fristen',at=n(5)+2.8)],taps=[dict(at=n(5)+0.9,x=195,y=775)]),
            dict(t0=n(6),kind='langs',h=s['e7'],s=s['e7s'],langs=s['langs']),
            logo(7,'mailcut.de')]
    if kind=='kosten':
        r=s['rows']; at=[n(2)+2.2,n(3)+0.3,n(3)+(n(4)-n(3))*.45,n(4)+0.3,n(4)+(n(5)-n(4))*.4]
        rows=[dict(n=a,s=b,v=v,at=round(at[i],2),cool=round(at[i+1] if i<4 else n(5),2)) for i,(a,b,v) in enumerate(r)]
        sc=[dict(t0=0,kind='number',bg='dark',num=s['k1'],label=s['k1l'],s=s['k1s']),
            dict(t0=n(1),kind='number',bg='dark',num=s['k2'],label=s['k2l'],s=s['k2s']),
            dict(t0=n(2),kind='list',bg='dark',h=s['k3'],rows=rows),
            dict(t0=n(5),kind='compare',h=s['k6'],bars=[dict(l=s['b1'],v='30,90 €',w=100,c='#dc2626'),dict(l=s['b2'],v='29,94 €',w=96.9,c='#1d4ed8')]),
            dict(t0=n(6),kind='phone',h=s['k7'],bullets=s['k7b'],screens=[dict(src='start'),dict(src='fristen',at=n(6)+1.6)],taps=[dict(at=n(6)+1.3,x=195,y=168)]),
            logo(7,'mailcut.de')]
    if kind=='install':
        d=lambda i,f:round(n(i)+(n(i+1)-n(i))*f,2)
        sc=[dict(t0=0,kind='title',bg='dark',h=s['i1'],s=s['i1s']),
            dict(t0=n(1),kind='phone',plat='iPhone',h='1 · '+s['i2'],s=s['i2s'],screens=[dict(mock=dict(k='safari',type=d(1,.5)))]),
            dict(t0=n(2),kind='phone',plat='iPhone',h='2 · '+s['i3'],s=s['i3s'],screens=[dict(mock=dict(k='safari',r1=n(2)+0.4,r2=d(2,.45)))]),
            dict(t0=n(3),kind='phone',plat='iPhone',h='3 · '+s['i4'],s=s['i4s'],screens=[dict(mock=dict(k='safari')),dict(mock=dict(k='share',scroll=n(3)+0.9,hl=n(3)+1.8),at=n(3)+0.2)],taps=[dict(at=n(3)+2.6,x=195,y=468)]),
            dict(t0=n(4),kind='phone',plat='iPhone',h='4 · '+s['i5'],s=s['i5s'],screens=[dict(mock=dict(k='add',r=n(4)+0.4)),dict(mock=dict(k='home',pop=n(4)+2.2),at=n(4)+1.8),dict(src='start',at=d(4,.72))],taps=[dict(at=n(4)+1.5,x=322,y=408),dict(at=d(4,.72)-0.3,x=150,y=335)]),
            dict(t0=n(5),kind='phone',plat='Android',h=s['i6'],s=s['i6s'],screens=[dict(mock=dict(k='chrome',type=n(5)+1.6,r=d(5,.45),menu=d(5,.6),hl=d(5,.72)))],taps=[dict(at=d(5,.86),x=230,y=296)]),
            dict(t0=n(6),kind='phone',h=s['i7'],s=s['i7s'],screens=[dict(src='welcome')],taps=[dict(at=n(6)+1.2,x=195,y=462)]),
            dict(t0=n(7),kind='phone',h=s['i8'],s=s['i8s'],screens=[dict(src='start'),dict(src='foto',at=n(7)+1.6),dict(src='brief',at=n(7)+3.4)],taps=[dict(at=n(7)+1.3,x=195,y=264),dict(at=n(7)+3.1,x=195,y=403)]),
            logo(8,'mailcut.app',False)]
    W,H=(1080,1920) if fmt=='v' else (1920,1080)
    return dict(name=name,fmt=fmt,W=W,H=H,lang=lang,scenes=sc,caps=caps(name,T),total=round(T[-1]+TAIL,2),src=s['src'] if kind=='kosten' else '',off=OFF)
if __name__=='__main__':
    for k in N:
        c=build(k); print(k,c['total'],[x['t0'] for x in c['scenes']],len(c['caps']))
