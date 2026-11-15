/* Leonn Reservierungen – Admin-Bereich (als App aufs Handy legbar) */
(() => {
'use strict';
const API = (window.LEONN_CFG && window.LEONN_CFG.api) || '';
const SITE = (window.LEONN_CFG && window.LEONN_CFG.site) || new URL('../', location.href).href;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const pad = (n) => (n < 10 ? '0' : '') + n;
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dObj = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const addDays = (s, n) => { const d = dObj(s); d.setDate(d.getDate() + n); return ymd(d); };
const toMin = (s) => (+s.slice(0, 2)) * 60 + (+s.slice(3, 5));
const ic = (n) => '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>';

/* ------------------------------------------------------------ Sprache (Deutsch / Türkisch) */
const LOC = ['de-DE', 'tr-TR'];
let LI = store.get('leonn-admin-lang') === 'tr' ? 1 : 0;
const T = {
  app: ['Leonn Reservierungen', 'Leonn Rezervasyonlar'],
  'pin.enter': ['PIN eingeben', 'PIN girin'],
  'pin.wrong': ['PIN stimmt nicht. Noch {n} Versuche.', 'PIN yanlış. {n} deneme hakkı kaldı.'],
  'pin.locked': ['Zu viele Versuche. Bitte {n} Minuten warten.', 'Çok fazla deneme. Lütfen {n} dakika bekleyin.'],
  net: ['Keine Verbindung. Bitte noch einmal versuchen.', 'Bağlantı yok. Lütfen tekrar deneyin.'],
  off: ['Keine Verbindung zum Reservierungssystem. Die App versucht es von selbst wieder.', 'Rezervasyon sistemine bağlantı yok. Uygulama kendiliğinden tekrar dener.'],
  soon: ['Das Reservierungssystem wird gerade eingerichtet. Danach ist das hier die App für das Restaurant.', 'Rezervasyon sistemi şu anda kuruluyor. Ardından burası restoranın uygulaması olacak.'],
  'name.q': ['Dein Name', 'Adın'],
  'name.h': ['Damit im Verlauf steht, wer bestätigt hat.', 'Kimin onayladığı kayıtta görünsün diye.'],
  'setup.h': ['Ersteinrichtung', 'İlk kurulum'],
  'setup.p': ['Gib den Einrichtungs-Code ein und wähle eine PIN mit 6 Ziffern. Die PIN gilt für das ganze Team.', 'Kurulum kodunu gir ve 6 haneli bir PIN belirle. PIN tüm ekip için geçerlidir.'],
  'setup.code': ['Einrichtungs-Code', 'Kurulum kodu'],
  'setup.pin': ['Neue PIN (6 Ziffern)', 'Yeni PIN (6 hane)'],
  'setup.pin2': ['PIN wiederholen', 'PIN tekrar'],
  'setup.go': ['Einrichten', 'Kur'],
  'setup.badcode': ['Der Code stimmt nicht.', 'Kod yanlış.'],
  'setup.mismatch': ['Die beiden PINs sind verschieden.', 'İki PIN aynı değil.'],
  'setup.pin6': ['Die PIN braucht genau 6 Ziffern.', 'PIN tam 6 haneli olmalı.'],
  'setup.none': ['Der Admin-Bereich ist noch nicht freigeschaltet.', 'Yönetim alanı henüz etkin değil.'],
  'tab.day': ['Tag', 'Gün'], 'tab.inbox': ['Anfragen', 'Talepler'], 'tab.cal': ['Kalender', 'Takvim'], 'tab.more': ['Mehr', 'Diğer'],
  today: ['Heute', 'Bugün'], tomorrow: ['Morgen', 'Yarın'],
  guests: ['Gäste', 'Misafir'], res: ['Buchungen', 'Rezervasyon'], open: ['Offen', 'Bekleyen'],
  search: ['Suchen', 'Ara'], 'search.ph': ['Name, Telefon oder Nummer', 'Ad, telefon veya numara'], 'search.none': ['Nichts gefunden.', 'Sonuç bulunamadı.'],
  'none.day': ['Für diesen Tag gibt es noch keine Reservierung.', 'Bu gün için henüz rezervasyon yok.'],
  'none.inbox': ['Keine offenen Anfragen. Alles erledigt.', 'Bekleyen talep yok. Hepsi tamam.'],
  'new.req': ['Neue Anfragen', 'Yeni talepler'],
  'day.list': ['Reservierungen', 'Rezervasyonlar'],
  'day.off': ['Erledigt und abgesagt', 'Tamamlanan ve iptal edilen'],
  load: ['Auslastung', 'Doluluk'],
  confirm: ['Bestätigen', 'Onayla'], decline: ['Ablehnen', 'Reddet'],
  'st.pending': ['Offen', 'Bekliyor'], 'st.confirmed': ['Bestätigt', 'Onaylandı'], 'st.declined': ['Abgelehnt', 'Reddedildi'], 'st.cancelled': ['Storniert', 'İptal'],
  'st.seated': ['Am Tisch', 'Masada'], 'st.done': ['Fertig', 'Tamamlandı'], 'st.noshow': ['Nicht erschienen', 'Gelmedi'],
  pers: ['Pers.', 'kişi'], persons: ['Personen', 'Kişi'], clock: [' Uhr', ''],
  rest: ['Restaurant', 'Restoran'], vip: ['V.I.P Room', 'V.I.P Room'],
  table: ['Tisch', 'Masa'], note: ['Wunsch des Gastes', 'Misafirin notu'], inote: ['Interne Notiz', 'Dahili not'],
  seated: ['Ist da', 'Geldi'], done: ['Fertig', 'Bitti'], noshow: ['Nicht erschienen', 'Gelmedi'], cancel: ['Stornieren', 'İptal et'], reopen: ['Wieder öffnen', 'Yeniden aç'],
  call: ['Anrufen', 'Ara'], wa: ['WhatsApp', 'WhatsApp'], sms: ['SMS', 'SMS'], mail: ['E-Mail', 'E-posta'], copy: ['Text kopieren', 'Metni kopyala'], copied: ['Kopiert', 'Kopyalandı'],
  tell: ['Gast informieren', 'Misafire haber ver'],
  'tell.p': ['Wähle, wie du dem Gast Bescheid gibst. Der Text ist schon vorbereitet.', 'Misafire nasıl haber vereceğini seç. Metin hazır.'],
  'tell.ok': ['Zusage', 'Onay'], 'tell.no': ['Absage', 'Ret'],
  edit: ['Bearbeiten', 'Düzenle'], del: ['Löschen', 'Sil'], 'del.q': ['Diese Reservierung endgültig löschen?', 'Bu rezervasyon kalıcı olarak silinsin mi?'],
  yes: ['Ja', 'Evet'], no: ['Nein', 'Hayır'], save: ['Speichern', 'Kaydet'], close: ['Schließen', 'Kapat'], back: ['Zurück', 'Geri'],
  saved: ['Gespeichert', 'Kaydedildi'], history: ['Verlauf', 'Geçmiş'],
  'new.h': ['Reservierung eintragen', 'Rezervasyon ekle'], 'edit.h': ['Reservierung ändern', 'Rezervasyonu düzenle'],
  date: ['Datum', 'Tarih'], time: ['Uhrzeit', 'Saat'], area: ['Bereich', 'Alan'], name: ['Name', 'Ad Soyad'], phone: ['Telefon', 'Telefon'], email: ['E-Mail', 'E-posta'],
  src: ['Herkunft', 'Kaynak'], 'src.phone': ['Telefon', 'Telefon'], 'src.walkin': ['Laufkundschaft', 'Kapıdan'], 'src.web': ['Webseite', 'Web sitesi'],
  left: ['{n} frei', '{n} boş'], full: ['voll', 'dolu'],
  'full.q': ['Laut Einstellungen ist diese Zeit voll (noch {n} Plätze). Trotzdem eintragen?', 'Ayarlara göre bu saat dolu ({n} yer kaldı). Yine de eklensin mi?'],
  'force': ['Trotzdem eintragen', 'Yine de ekle'],
  need: ['Bitte Name, Datum und Uhrzeit ausfüllen.', 'Lütfen ad, tarih ve saati doldurun.'],
  'need.phone': ['Bitte Telefonnummer prüfen.', 'Lütfen telefon numarasını kontrol edin.'],
  'new.toast': ['Neue Anfrage: {x}', 'Yeni talep: {x}'],
  'cancel.toast': ['Storniert vom Gast: {x}', 'Misafir iptal etti: {x}'],
  test: ['Testbetrieb', 'Test aşaması'], live: ['Live', 'Canlı'], 'live.q': ['Wirklich live schalten?', 'Canlıya alınsın mı?'], 'test.q': ['Zurück auf Test?', 'Teste dönülsün mü?'], 'test.s': ['Testbetrieb', 'Test'],
  'more.mode': ['Betrieb', 'Çalışma şekli'],
  'more.design': ['Design der Webseite', 'Web sitesi tasarımı'], 'design.p': ['Gilt für alle Gäste, die auf der Seite nichts anderes wählen. „Automatisch“ wechselt nach Jahreszeit und zu Ramadan & Bayram, Weihnachten und Silvester.', 'Sitede başka bir seçim yapmayan tüm misafirler için geçerlidir. „Otomatik“ mevsime göre ve Ramazan & Bayram, Noel ve yılbaşında değişir.'],
  'ds.auto': ['Automatisch', 'Otomatik'], 'ds.klassik': ['Leonn Klassik', 'Leonn Klasik'], 'ds.fruehling': ['Frühling', 'İlkbahar'], 'ds.sommer': ['Sommer', 'Yaz'], 'ds.herbst': ['Herbst', 'Sonbahar'], 'ds.winter': ['Winter', 'Kış'], 'ds.ramadan': ['Ramadan & Bayram', 'Ramazan & Bayram'], 'ds.weihnachten': ['Weihnachten', 'Noel'], 'ds.silvester': ['Silvester', 'Yılbaşı'],
  'more.mode.p': ['Im Testbetrieb sehen Gäste den Hinweis, dass Reservierungen noch nicht gelten. Auf „Live“ stellen, sobald ihr das System wirklich nutzt.', 'Test aşamasında misafirler rezervasyonların henüz geçerli olmadığı uyarısını görür. Sistemi gerçekten kullanmaya başlayınca “Canlı” yapın.'],
  'more.times': ['Reservierungszeiten', 'Rezervasyon saatleri'],
  first: ['Erste Zeit', 'İlk saat'], last: ['Letzte Zeit', 'Son saat'], step: ['Raster (Min.)', 'Aralık (dk)'], dur: ['Aufenthalt (Min.)', 'Kalış süresi (dk)'],
  'more.seats': ['Plätze', 'Kapasite'],
  seats: ['Plätze, die online gleichzeitig belegt sein dürfen', 'Aynı anda çevrim içi dolabilecek yer sayısı'],
  perSlot: ['Höchstens neue Gäste pro Zeitfenster', 'Bir zaman diliminde en fazla yeni misafir'],
  maxParty: ['Online buchbar bis … Personen', 'Çevrim içi en fazla … kişi'],
  'more.vip': ['V.I.P Room', 'V.I.P Room'], 'vip.on': ['Online buchbar', 'Çevrim içi rezerve edilebilir'], vipMin: ['Ab … Personen', 'En az … kişi'], vipMax: ['Bis … Personen', 'En fazla … kişi'], vipDur: ['Dauer (Min.)', 'Süre (dk)'],
  'more.lead': ['Vorlauf', 'Ön süre'], leadMin: ['Frühestens … Minuten vorher', 'En erken … dakika önce'], maxDays: ['Höchstens … Tage im Voraus', 'En fazla … gün önceden'],
  'more.closed': ['Ruhetage', 'Kapalı günler'], 'closed.wd': ['Jede Woche geschlossen', 'Her hafta kapalı'], 'closed.dates': ['Einzelne Tage', 'Tek tek günler'], add: ['Hinzufügen', 'Ekle'],
  'more.auto': ['Automatisch bestätigen', 'Otomatik onay'],
  'more.auto.p': ['Aus: Jede Anfrage wartet, bis ihr sie bestätigt. An: Freie Zeiten werden sofort zugesagt.', 'Kapalı: Her talep onayınızı bekler. Açık: Uygun saatler hemen onaylanır.'],
  'more.push': ['Mitteilungen', 'Bildirimler'],
  'push.p': ['Dieses Handy meldet sich, sobald eine neue Anfrage kommt, auch wenn die App zu ist.', 'Uygulama kapalı olsa bile yeni talep gelince bu telefon haber verir.'],
  'push.on': ['Mitteilungen einschalten', 'Bildirimleri aç'], 'push.off': ['Mitteilungen ausschalten', 'Bildirimleri kapat'], 'push.test': ['Test senden', 'Test gönder'],
  'push.ok': ['Mitteilungen sind an.', 'Bildirimler açık.'], 'push.denied': ['Mitteilungen sind in den Handy-Einstellungen gesperrt.', 'Bildirimler telefon ayarlarında engelli.'],
  'push.ios': ['Auf dem iPhone geht das erst, wenn die App auf dem Home-Bildschirm liegt (siehe „App installieren“).', 'iPhone’da bu, uygulama ana ekrana eklendikten sonra çalışır (“Uygulamayı yükle” bölümüne bakın).'],
  'push.no': ['Dieses Gerät unterstützt keine Mitteilungen.', 'Bu cihaz bildirimleri desteklemiyor.'],
  'push.sent': ['Test gesendet an {n} Gerät(e).', 'Test {n} cihaza gönderildi.'],
  'more.sec': ['Sicherheit', 'Güvenlik'], 'pin.change': ['PIN ändern', 'PIN değiştir'], 'pin.old': ['Alte PIN', 'Eski PIN'], 'pin.new': ['Neue PIN', 'Yeni PIN'], 'pin.oldbad': ['Die alte PIN stimmt nicht.', 'Eski PIN yanlış.'],
  'pin.changed': ['PIN geändert. Andere Geräte wurden abgemeldet.', 'PIN değişti. Diğer cihazların oturumu kapatıldı.'],
  logout: ['Abmelden', 'Çıkış yap'], devices: ['Angemeldete Geräte', 'Oturum açık cihazlar'],
  'more.data': ['Daten', 'Veriler'], keepDays: ['Gästedaten … Tage nach dem Termin entfernen', 'Misafir verilerini randevudan … gün sonra sil'],
  purge: ['Test-Reservierungen löschen', 'Test rezervasyonlarını sil'], 'purge.q': ['Alle Reservierungen aus dem Testbetrieb löschen?', 'Test aşamasındaki tüm rezervasyonlar silinsin mi?'], purged: ['{n} gelöscht', '{n} silindi'],
  'more.app': ['App installieren', 'Uygulamayı yükle'],
  'app.ios': ['iPhone: unten auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.', 'iPhone: alttaki “Paylaş”a, sonra “Ana Ekrana Ekle”ye dokunun.'],
  'app.and': ['Android: oben rechts auf die drei Punkte tippen, dann „App installieren“ oder „Zum Startbildschirm hinzufügen“.', 'Android: sağ üstteki üç noktaya, sonra “Uygulamayı yükle” veya “Ana ekrana ekle”ye dokunun.'],
  'app.btn': ['Jetzt installieren', 'Şimdi yükle'], 'app.done': ['Die App ist installiert.', 'Uygulama yüklü.'],
  'more.stats': ['Letzte 4 Wochen', 'Son 4 hafta'], 'stats.res': ['Buchungen', 'Rezervasyon'], 'stats.guests': ['Gäste', 'Misafir'], 'stats.noshow': ['Nicht erschienen', 'Gelmeyen'], 'stats.web': ['über die Webseite', 'web sitesinden'],
  lang: ['Sprache', 'Dil'], 'err.fields': ['Bitte die markierten Felder prüfen.', 'Lütfen işaretli alanları kontrol edin.'],
  placeholder: ['Platzhalter: bitte an eure echten Zahlen anpassen.', 'Örnek değerler: lütfen gerçek sayılarınıza göre ayarlayın.'],
  'log.created': ['Anfrage über die Webseite', 'Web sitesinden talep'], 'log.created_auto': ['Über die Webseite, automatisch bestätigt', 'Web sitesinden, otomatik onay'], 'log.created_admin': ['Von Hand eingetragen', 'Elle eklendi'],
  'log.moved': ['Termin geändert', 'Randevu değişti'], 'log.edited': ['Daten geändert', 'Bilgiler değişti'], 'log.table': ['Tisch geändert', 'Masa değişti'], 'log.note': ['Notiz geändert', 'Not değişti'], 'log.cancelled_guest': ['Vom Gast storniert', 'Misafir iptal etti'],
  // Catering
  'tab.cat': ['Catering', 'Catering'], 'demo.s': ['Vorschau', 'Önizleme'],
  'cat.none': ['Noch keine Catering-Anfragen.', 'Henüz catering talebi yok.'],
  'cat.run': ['Laufende Aufträge', 'Devam eden siparişler'], 'cat.old': ['Erledigt und abgesagt', 'Tamamlanan ve iptal edilen'],
  'cat.guests': ['Gäste', 'misafir'], 'cat.firm': ['Feste Aufträge', 'Kesin sipariş'], 'cat.sum': ['Umsatz fest', 'Kesin ciro'],
  'cst.pending': ['Angefragt', 'Talep'], 'cst.offered': ['Angebot gesendet', 'Teklif gönderildi'], 'cst.confirmed': ['Bestätigt', 'Onaylandı'], 'cst.paid': ['Anzahlung da', 'Kapora alındı'], 'cst.done': ['Geliefert', 'Teslim edildi'], 'cst.declined': ['Abgelehnt', 'Reddedildi'], 'cst.cancelled': ['Storniert', 'İptal'],
  'cat.offer': ['Angebot senden', 'Teklif gönder'], 'cat.accepted': ['Kunde hat angenommen', 'Müşteri kabul etti'], 'cat.paid': ['Anzahlung erhalten', 'Kapora alındı'], 'cat.done': ['Geliefert', 'Teslim edildi'], 'cat.decline': ['Ablehnen', 'Reddet'],
  'cat.kitchen': ['Küchenliste', 'Mutfak listesi'], 'cat.total': ['Gesamt', 'Toplam'], 'cat.dep': ['Anzahlung', 'Kapora'], 'cat.pp': ['pro Gast', 'kişi başı'],
  'cat.food': ['Speisen, {pp} pro Person', 'Yemekler, kişi başı {pp}'], 'cat.disc': ['Mengenrabatt {n} %', 'Miktar indirimi %{n}'],
  'cat.addr': ['Lieferadresse', 'Teslimat adresi'],
  'cat.del.q': ['Diese Catering-Anfrage endgültig löschen?', 'Bu catering talebi kalıcı olarak silinsin mi?'],
  'cat.toast': ['Neue Catering-Anfrage: {x}', 'Yeni catering talebi: {x}'],
  'cat.tell.offer': ['Angebot', 'Teklif'],
  'cat.demo': ['Catering-Vorschau ansehen', 'Catering önizlemesini gör'],
  'cat.demo.p': ['Vorführ-Modus: Beispiel-Anfragen und alles, was auf diesem Gerät im Catering-Konfigurator abgeschickt wurde. Es wird nichts gesendet.', 'Tanıtım modu: Örnek talepler ve bu cihazda catering sayfasından gönderilenler. Hiçbir şey gönderilmez.'],
  'clog.created': ['Anfrage über die Webseite', 'Web sitesinden talep'], 'clog.offered': ['Angebot gesendet', 'Teklif gönderildi'], 'clog.confirmed': ['Bestätigt', 'Onaylandı'], 'clog.paid': ['Anzahlung erhalten', 'Kapora alındı'], 'clog.done': ['Geliefert', 'Teslim edildi'],
  'clog.declined': ['Abgelehnt', 'Reddedildi'], 'clog.cancelled': ['Storniert', 'İptal edildi'], 'clog.pending': ['Wieder geöffnet', 'Yeniden açıldı'], 'clog.note': ['Notiz geändert', 'Not değişti'], 'clog.accepted_guest': ['Vom Kunden angenommen', 'Müşteri kabul etti'], 'clog.cancelled_guest': ['Vom Kunden storniert', 'Müşteri iptal etti'],
  'cc.m': ['Meze und Salate', 'Meze ve salatalar'], 'cc.f': ['Warme Kleinigkeiten', 'Sıcak atıştırmalıklar'], 'cc.h': ['Grill und Güveç', 'Izgara ve güveç'], 'cc.b': ['Beilagen', 'Garnitürler'], 'cc.d': ['Desserts', 'Tatlılar'], 'cc.k': ['Frühstück', 'Kahvaltı'],
  'cx.soft': ['Wasser und Softdrinks', 'Su ve meşrubat'], 'cx.cay': ['Semaver-Çay und Türk Kahvesi', 'Semaver çayı ve Türk kahvesi'], 'cx.ayran': ['Ayran und Limonata', 'Ayran ve limonata'], 'cx.eco': ['Kompostierbares Geschirr', 'Kompost edilebilir tabak ve çatal'], 'cx.porz': ['Porzellan, Besteck, Stoffservietten', 'Porselen, çatal bıçak, kumaş peçete'],
  'cx.staff': ['{n} × Service, {h} Std.', '{n} × servis, {h} saat'], 'cx.deko': ['Tisch- und Buffetdeko', 'Masa ve büfe süslemesi'], 'cx.deliv.a': ['Lieferung bis 10 km', "10 km'ye kadar teslimat"], 'cx.deliv.b': ['Lieferung 10 bis 30 km', '10–30 km teslimat'], 'cx.deliv.c': ['Lieferung 30 bis 60 km', '30–60 km teslimat'],
  'occ.Geburtstag': ['Geburtstag', 'Doğum günü'], 'occ.Hochzeit': ['Hochzeit', 'Düğün'], 'occ.Verlobung': ['Verlobung', 'Nişan'], 'occ.Familienfeier': ['Familienfeier', 'Aile kutlaması'], 'occ.Firmenfeier': ['Firmenfeier', 'Şirket kutlaması'], 'occ.Geschäftsessen': ['Geschäftsessen', 'İş yemeği'], 'occ.Sonstiges': ['Sonstiges', 'Diğer'],
};
const t = (k, o) => { const v = T[k]; let s = v ? v[LI] : k; if (o) s = s.replace(/\{(\w+)\}/g, (m, x) => (o[x] !== undefined ? o[x] : m)); return s; };
const MSG = {
  ok: { de: 'Hallo {name}, Ihre Reservierung im Leonn Restaurant ist bestätigt: {date} um {time} Uhr für {n} Personen{vip}. Wir freuen uns auf Sie! {link}',
        tr: 'Merhaba {name}, Leonn Restaurant rezervasyonunuz onaylandı: {date}, saat {time}, {n} kişi{vip}. Sizi ağırlamaktan mutluluk duyarız! {link}',
        en: 'Hello {name}, your reservation at Leonn Restaurant is confirmed: {date} at {time} for {n} guests{vip}. We look forward to seeing you! {link}' },
  no: { de: 'Hallo {name}, leider können wir Ihre Reservierungsanfrage für {date} um {time} Uhr nicht bestätigen. Rufen Sie uns gern an, wir finden eine andere Zeit: {tel}',
        tr: 'Merhaba {name}, maalesef {date} saat {time} için rezervasyon talebinizi onaylayamıyoruz. Bizi arayın, birlikte başka bir saat bulalım: {tel}',
        en: 'Hello {name}, unfortunately we cannot confirm your reservation request for {date} at {time}. Please call us and we will find another time: {tel}' },
};
const MLOC = { de: 'de-DE', tr: 'tr-TR', en: 'en-GB' };
const CMSG = {
  offer: { de: 'Hallo {name}, Ihr Catering-Angebot vom Leonn Restaurant ist da: {date} um {time} Uhr für {n} Gäste, gesamt {total}, Anzahlung {dep}. Hier ansehen und mit einem Tipp annehmen: {link}',
           tr: 'Merhaba {name}, Leonn Restaurant catering teklifiniz hazır: {date}, saat {time}, {n} misafir, toplam {total}, kapora {dep}. Buradan görüp tek dokunuşla kabul edebilirsiniz: {link}',
           en: 'Hello {name}, your catering offer from Leonn Restaurant is ready: {date} at {time} for {n} guests, total {total}, deposit {dep}. View and accept it here: {link}' },
  ok: { de: 'Hallo {name}, Ihr Catering am {date} um {time} Uhr für {n} Gäste ist bestätigt. Die Anzahlung beträgt {dep}. Wir freuen uns auf Ihr Fest! {link}',
        tr: 'Merhaba {name}, {date} saat {time} için {n} misafirlik catering siparişiniz onaylandı. Kapora tutarı {dep}. Kutlamanızda sizinle olmaktan mutluluk duyarız! {link}',
        en: 'Hello {name}, your catering on {date} at {time} for {n} guests is confirmed. The deposit is {dep}. We look forward to your celebration! {link}' },
  no: { de: 'Hallo {name}, leider können wir Ihr Catering am {date} nicht übernehmen. Rufen Sie uns gern an, wir suchen gemeinsam eine Lösung: {tel}',
        tr: 'Merhaba {name}, maalesef {date} tarihli catering talebinizi karşılayamıyoruz. Bizi arayın, birlikte bir çözüm bulalım: {tel}',
        en: 'Hello {name}, unfortunately we cannot take on your catering on {date}. Please call us and we will look for a solution together: {tel}' },
};

/* ------------------------------------------------------------ Zustand */
const S = { token: store.get('leonn-admin-token') || '', name: store.get('leonn-admin-name') || '', view: 'day', date: '', today: '', time: '', mode: 'test',
  byId: new Map(), day: {}, pending: [], counts: {}, calYm: '', cfg: null, defaults: null, devices: [], since: 0, boot: Date.now(), seen: new Set(), stats: null,
  pin: '', pinMsg: '', lock: 'load', busy: false, deferred: null, sheet: null, pushOn: false, demo: false,
  cat: { rows: [], ts: 0, open: 0, loaded: false, known: false, seen: new Set() } };
const fmtDay = (s, o) => dObj(s).toLocaleDateString(LOC[LI], o || { weekday: 'long', day: 'numeric', month: 'long' });
const dayName = (s) => (s === S.today ? t('today') : s === addDays(S.today, 1) ? t('tomorrow') : '');
const areaName = (a) => (a === 'v' ? t('vip') : t('rest'));
const ACTIVE = ['pending', 'confirmed', 'seated', 'done'];

async function call(method, path, body) {
  if (S.demo) return demoCall(method, path, body);   // Vorführ-Modus: nichts ansprechen
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(API + path, { method, signal: ctl.signal, headers: Object.assign({ 'Content-Type': 'application/json' }, S.token ? { Authorization: 'Bearer ' + S.token } : {}), body: body === undefined ? undefined : JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && S.token) { S.token = ''; store.del('leonn-admin-token'); S.lock = 'pin'; S.pin = ''; render(); }
    return { ok: r.ok, status: r.status, j };
  } catch (e) { return { ok: false, status: 0, j: { error: 'net' } }; } finally { clearTimeout(to); }
}
function toast(msg, kind) {
  const el = $('#toast'); el.textContent = msg; el.className = 'on' + (kind ? ' ' + kind : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.className = ''; }, 3600);
}
function chime() {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const ac = chime.ac || (chime.ac = new A()), now = ac.currentTime;
    [[880, 0], [1174.7, 0.16]].forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, now + d); g.gain.exponentialRampToValueAtTime(0.18, now + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.5); o.connect(g); g.connect(ac.destination); o.start(now + d); o.stop(now + d + 0.55); });
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  } catch (e) {}
}
function badge() { try { if (navigator.setAppBadge) { const n = S.pending.length + S.cat.open; if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (e) {} }

/* ------------------------------------------------------------ Daten holen */
function take(rows) { rows.forEach((r) => S.byId.set(r.id, r)); }
function setPending(list) { S.pending = list.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.id - b.id); list.forEach((r) => S.seen.add(r.id)); badge(); }
async function loadDay(date, quiet) {
  if (!quiet && !S.day[date]) renderMain();
  const r = await call('GET', '/admin/list?from=' + date + '&to=' + date);
  if (!r.ok) { if (r.status !== 401) toast(t('net'), 'bad'); return; }
  take(r.j.rows); take(r.j.pending);
  S.day[date] = r.j.rows.map((x) => x.id);
  S.today = r.j.today; S.time = r.j.time; S.mode = r.j.mode; S.since = Math.max(S.since, r.j.ts - 2000);
  setPending(r.j.pending);
  catSeen(r.j.cat);
  if (S.lock === 'ok') renderMain();
}
async function loadCounts() {
  const first = S.calYm + '-01', last = ymd(new Date(+S.calYm.slice(0, 4), +S.calYm.slice(5), 0));
  const r = await call('GET', '/admin/counts?from=' + first + '&to=' + last);
  if (!r.ok) return;
  const c = {}; r.j.rows.forEach((x) => { const o = c[x.date] || (c[x.date] = { n: 0, p: 0, pend: 0 }); if (ACTIVE.includes(x.status)) { o.n += x.c; o.p += x.p || 0; } if (x.status === 'pending') o.pend += x.c; });
  S.counts[S.calYm] = c;
  if (S.view === 'cal') renderMain();
}
async function loadSettings() {
  const r = await call('GET', '/admin/settings');
  if (r.ok) {
    const first = !S.cfg;
    S.cfg = r.j.cfg; S.defaults = r.j.defaults; S.devices = r.j.devices || []; S.mode = S.cfg.mode;
    if (first && S.lock === 'ok' && S.view === 'day' && !S.sheet) renderMain();   // Auslastung braucht die Platzzahl
  }
  return r.ok;
}
async function poll() {
  if (S.lock !== 'ok' || document.hidden || !S.since) return;
  const r = await call('GET', '/admin/poll?since=' + S.since);
  if (!r.ok) return;
  S.since = r.j.ts - 2000; S.today = r.j.today; S.time = r.j.time; S.mode = r.j.mode;
  catSeen(r.j.cat);
  if (!r.j.rows.length && r.j.pending === S.pending.length) return;
  let fresh = null, gone = null;
  r.j.rows.forEach((x) => {
    const old = S.byId.get(x.id); S.byId.set(x.id, x);
    if (x.status === 'pending' && !S.seen.has(x.id)) { S.seen.add(x.id); if (x.source === 'web') fresh = x; }
    if (old && old.status !== 'cancelled' && x.status === 'cancelled' && x.updated_at > S.boot) gone = x;
    const list = S.day[x.date]; if (list && !list.includes(x.id)) list.push(x.id);
    Object.keys(S.day).forEach((d) => { if (d !== x.date) S.day[d] = S.day[d].filter((i) => i !== x.id); });
  });
  setPending(Array.from(S.byId.values()).filter((x) => x.status === 'pending' && x.date >= S.today));
  S.counts = {};
  if (fresh) { chime(); toast(t('new.toast', { x: fresh.name + ', ' + fmtDay(fresh.date, { day: 'numeric', month: 'short' }) + ' ' + fresh.time }), 'new'); }
  else if (gone) toast(t('cancel.toast', { x: gone.name + ', ' + gone.time }), 'bad');
  if (!S.sheet || S.sheet.kind === 'detail') { renderMain(); if (S.sheet && S.sheet.kind === 'detail' && S.byId.get(S.sheet.id)) openDetail(S.sheet.id, true); }
  if (S.view === 'cal') loadCounts();
}

/* ------------------------------------------------------------ Anmeldung */
async function boot() {
  if (!API) { S.lock = 'soon'; render(); return; }   // noch nicht eingerichtet: nichts ansprechen
  const st = await call('GET', '/admin/state');
  if (!st.ok) { if (S.lock !== 'off') { S.lock = 'off'; render(); } setTimeout(boot, 5000); return; }   // keine Verbindung: warten und selbst wieder versuchen
  S.mode = st.j.mode;
  if (!st.j.setup) { S.lock = st.j.canSetup ? 'setup' : 'none'; render(); return; }
  if (S.token) {
    S.lock = 'ok'; S.date = S.date || ymd(new Date()); render();
    await loadDay(S.date); if (S.lock === 'ok') { S.date = S.date < S.today ? S.today : S.date; loadSettings(); }
    return;
  }
  S.lock = 'pin'; render();
}
function lockHtml() {
  const head = '<div class="lk-brand"><img src="../img/logo.svg" alt="" width="60" height="75"><b>LEONN</b><span>' + esc(t('app').replace('Leonn ', '')) + '</span></div>';
  const lang = '<div class="lk-lang"><button type="button" data-a="lang" data-v="de" aria-pressed="' + (LI === 0) + '">DE</button><button type="button" data-a="lang" data-v="tr" aria-pressed="' + (LI === 1) + '">TR</button></div>';
  if (S.lock === 'load') return '<div class="lock">' + head + '<p class="lk-msg">…</p></div>';
  if (S.lock === 'none') return '<div class="lock">' + head + '<p class="lk-msg">' + esc(t('setup.none')) + '</p>' + lang + '</div>';
  if (S.lock === 'off' || S.lock === 'soon') return '<div class="lock">' + head + '<p class="lk-msg wait">' + esc(t(S.lock)) + '</p>' + (S.lock === 'soon' ? '<button type="button" class="btn line" data-a="demo">' + esc(t('cat.demo')) + '</button>' : '') + lang + '</div>';
  if (S.lock === 'setup') return '<div class="lock">' + head + '<form class="lk-form" id="setupForm" novalidate><h1>' + esc(t('setup.h')) + '</h1><p>' + esc(t('setup.p')) + '</p>' +
    '<label>' + esc(t('setup.code')) + '<input id="suCode" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label>' +
    '<label>' + esc(t('name.q')) + '<input id="suName" autocomplete="given-name" maxlength="30" value="' + esc(S.name) + '" required></label>' +
    '<label>' + esc(t('setup.pin')) + '<input id="suPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" required></label>' +
    '<label>' + esc(t('setup.pin2')) + '<input id="suPin2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" required></label>' +
    '<p class="lk-msg" id="suMsg" role="alert">' + esc(S.pinMsg) + '</p><button class="btn" type="submit">' + esc(t('setup.go')) + '</button></form>' + lang + '</div>';
  let dots = ''; for (let i = 0; i < 6; i++) dots += '<i class="' + (i < S.pin.length ? 'on' : '') + '"></i>';
  let keys = ''; ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'x'].forEach((k) => { keys += k === '' ? '<span></span>' : '<button type="button" data-a="key" data-v="' + k + '"' + (k === 'x' ? ' aria-label="' + esc(t('del')) + '"' : '') + '>' + (k === 'x' ? ic('back') : k) + '</button>'; });
  return '<div class="lock">' + head + (S.name ? '' : '<label class="lk-name">' + esc(t('name.q')) + '<input id="lkName" autocomplete="given-name" maxlength="30" placeholder="' + esc(t('name.h')) + '"></label>') +
    '<h1 class="lk-h">' + esc(t('pin.enter')) + '</h1><div class="dots' + (S.busy ? ' busy' : '') + '" aria-hidden="true">' + dots + '</div><p class="lk-msg" role="alert">' + esc(S.pinMsg) + '</p><div class="keys">' + keys + '</div>' + lang + '</div>';
}
async function tryPin() {
  if (S.busy) return; S.busy = true; render();
  const nm = $('#lkName'); if (nm && nm.value.trim()) { S.name = nm.value.trim().slice(0, 30); store.set('leonn-admin-name', S.name); }
  const r = await call('POST', '/admin/login', { pin: S.pin, device: S.name || 'Admin' });
  S.busy = false; S.pin = '';
  if (r.ok && r.j.token) { S.token = r.j.token; store.set('leonn-admin-token', S.token); S.pinMsg = ''; S.lock = 'ok'; S.date = ymd(new Date()); render(); await loadDay(S.date); S.date = S.today || S.date; loadSettings(); return; }
  S.pinMsg = r.status === 429 ? t('pin.locked', { n: r.j.minutes || 15 }) : r.status === 403 ? t('pin.wrong', { n: r.j.left == null ? 0 : r.j.left }) : r.status === 409 ? t('setup.none') : t('net');
  render(); const d = $('.dots'); if (d) { d.classList.add('shake'); if (navigator.vibrate) navigator.vibrate(160); }
}
async function doSetup() {
  const code = $('#suCode').value.trim(), nm = $('#suName').value.trim(), p1 = $('#suPin').value, p2 = $('#suPin2').value, msg = $('#suMsg');
  if (!/^\d{6}$/.test(p1)) { msg.textContent = t('setup.pin6'); return; }
  if (p1 !== p2) { msg.textContent = t('setup.mismatch'); return; }
  if (nm) { S.name = nm.slice(0, 30); store.set('leonn-admin-name', S.name); }
  const r = await call('POST', '/admin/setup', { code, pin: p1, device: S.name || 'Admin' });
  if (r.ok && r.j.token) { S.token = r.j.token; store.set('leonn-admin-token', S.token); S.pinMsg = ''; S.lock = 'ok'; S.date = ymd(new Date()); render(); await loadDay(S.date); S.date = S.today || S.date; loadSettings(); return; }
  msg.textContent = r.status === 403 ? t('setup.badcode') : r.status === 429 ? t('pin.locked', { n: r.j.minutes || 15 }) : r.status === 409 ? t('setup.none') : t('net');
}

/* ------------------------------------------------------------ Hauptansichten */
function chip(r) { return '<span class="st st-' + r.status + '">' + esc(t('st.' + r.status)) + '</span>'; }
function rowHtml(r, withDate) {
  return '<button type="button" class="row st-' + r.status + '" data-a="open" data-id="' + r.id + '"><span class="r-time">' + (withDate ? '<i>' + esc(dayName(r.date) || fmtDay(r.date, { weekday: 'short', day: 'numeric', month: 'short' })) + '</i>' : '') + '<b>' + esc(r.time) + '</b></span>' +
    '<span class="r-main"><b>' + esc(r.name) + '</b><span>' + ic('person') + r.persons + (r.area === 'v' ? ' · <em>V.I.P</em>' : '') + (r.tbl ? ' · ' + esc(t('table')) + ' ' + esc(r.tbl) : '') + (r.note ? ' · ' + ic('note') : '') + (r.test ? ' · Test' : '') + '</span></span>' + chip(r) + '</button>';
}
function reqHtml(r) {
  return '<div class="req" data-id="' + r.id + '"><button type="button" class="req-body" data-a="open" data-id="' + r.id + '"><span class="req-when"><i>' + esc(dayName(r.date) || fmtDay(r.date, { weekday: 'short', day: 'numeric', month: 'short' })) + '</i><b>' + esc(r.time) + '</b></span>' +
    '<span class="r-main"><b>' + esc(r.name) + '</b><span>' + ic('person') + r.persons + ' ' + esc(t('pers')) + ' · ' + esc(areaName(r.area)) + (r.test ? ' · Test' : '') + '</span>' + (r.note ? '<span class="req-note">„' + esc(r.note) + '“</span>' : '') + '</span></button>' +
    '<div class="req-act"><button type="button" class="btn no" data-a="set" data-id="' + r.id + '" data-v="declined">' + ic('x') + esc(t('decline')) + '</button><button type="button" class="btn ok" data-a="set" data-id="' + r.id + '" data-v="confirmed">' + ic('check') + esc(t('confirm')) + '</button></div></div>';
}
function loadBars(rows) {
  const c = S.cfg; if (!c) return '';
  const act = rows.filter((r) => ACTIVE.includes(r.status) && r.area !== 'v'), out = [];
  for (let m = toMin(c.firstSlot); m <= toMin(c.lastSlot); m += c.slotMin) { let n = 0; act.forEach((r) => { const a = toMin(r.time); if (a <= m && a + c.durMin > m) n += r.persons; }); out.push({ m, n }); }
  if (!out.some((x) => x.n)) return '';
  const nowM = S.date === S.today && S.time ? toMin(S.time) : -1;
  return '<section class="card"><h2>' + esc(t('load')) + '<small>' + esc(t('rest')) + ' · max. ' + c.seats + '</small></h2><div class="bars" aria-hidden="true">' + out.map((x) => {
    const p = Math.min(100, Math.round(x.n / c.seats * 100));
    return '<i class="' + (p >= 100 ? 'full' : p >= 75 ? 'hi' : '') + (nowM >= x.m && nowM < x.m + c.slotMin ? ' now' : '') + '" style="--h:' + Math.max(3, p) + '%" title="' + pad(Math.floor(x.m / 60)) + ':' + pad(x.m % 60) + ' · ' + x.n + '"></i>';
  }).join('') + '</div><div class="bars-x"><span>' + esc(c.firstSlot) + '</span><span>' + esc(c.lastSlot) + '</span></div></section>';
}
function dayHtml() {
  const ids = S.day[S.date], rows = ids ? ids.map((i) => S.byId.get(i)).filter((r) => r && r.date === S.date).sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id) : null;
  let h = '<div class="daybar"><button type="button" class="sq" data-a="day" data-v="-1" aria-label="' + esc(t('back')) + '">' + ic('left') + '</button><button type="button" class="daybtn" data-a="pick"><b>' + esc(dayName(S.date) || fmtDay(S.date, { weekday: 'long' })) + '</b><span>' + esc(fmtDay(S.date, { day: 'numeric', month: 'long', year: 'numeric' })) + '</span><input type="date" id="dayPick" value="' + S.date + '" tabindex="-1" aria-hidden="true"></button><button type="button" class="sq" data-a="day" data-v="1" aria-label="→">' + ic('right') + '</button></div>';
  if (S.today && S.date !== S.today) h += '<button type="button" class="pill" data-a="today">' + esc(t('today')) + '</button>';
  if (!rows) return h + '<p class="empty">…</p>';
  const act = rows.filter((r) => ['confirmed', 'seated', 'done', 'pending'].includes(r.status)), pend = rows.filter((r) => r.status === 'pending');
  h += '<div class="kpis"><div><b>' + act.reduce((a, r) => a + r.persons, 0) + '</b><span>' + esc(t('guests')) + '</span></div><div><b>' + act.length + '</b><span>' + esc(t('res')) + '</span></div><div class="' + (pend.length ? 'warn' : '') + '"><b>' + pend.length + '</b><span>' + esc(t('open')) + '</span></div></div>';
  if (pend.length) h += '<section class="card hot"><h2>' + esc(t('new.req')) + '</h2>' + pend.map(reqHtml).join('') + '</section>';
  h += loadBars(rows);
  const main = rows.filter((r) => ['confirmed', 'seated'].includes(r.status)), off = rows.filter((r) => ['done', 'declined', 'cancelled', 'noshow'].includes(r.status));
  h += main.length ? '<section class="card"><h2>' + esc(t('day.list')) + '</h2><div class="rows">' + main.map((r) => rowHtml(r)).join('') + '</div></section>' : (pend.length ? '' : '<p class="empty">' + esc(t('none.day')) + '</p>');
  if (off.length) h += '<section class="card dim"><h2>' + esc(t('day.off')) + '</h2><div class="rows">' + off.map((r) => rowHtml(r)).join('') + '</div></section>';
  return h;
}
function inboxHtml() {
  if (!S.pending.length) return '<p class="empty big">' + ic('check') + esc(t('none.inbox')) + '</p>';
  return '<section class="card hot"><h2>' + esc(t('new.req')) + '<small>' + S.pending.length + '</small></h2>' + S.pending.map(reqHtml).join('') + '</section>';
}
function calHtml() {
  const y = +S.calYm.slice(0, 4), m = +S.calYm.slice(5), first = (new Date(y, m - 1, 1).getDay() + 6) % 7, last = new Date(y, m, 0).getDate(), c = S.counts[S.calYm];
  let h = '<div class="daybar"><button type="button" class="sq" data-a="mon" data-v="-1" aria-label="' + esc(t('back')) + '">' + ic('left') + '</button><div class="daybtn"><b>' + esc(new Date(y, m - 1, 1).toLocaleDateString(LOC[LI], { month: 'long' })) + '</b><span>' + y + '</span></div><button type="button" class="sq" data-a="mon" data-v="1" aria-label="→">' + ic('right') + '</button></div><div class="cal">';
  for (let i = 0; i < 7; i++) h += '<span class="wd">' + esc(new Date(2024, 0, 1 + i).toLocaleDateString(LOC[LI], { weekday: 'short' }).replace('.', '')) + '</span>';
  for (let i = 0; i < first; i++) h += '<span></span>';
  const closedD = (S.cfg && S.cfg.closedDates) || [], closedW = (S.cfg && S.cfg.closedWeekdays) || [];
  for (let d = 1; d <= last; d++) {
    const date = S.calYm + '-' + pad(d), o = c && c[date], closed = closedD.includes(date) || closedW.includes(dObj(date).getDay());
    h += '<button type="button" class="cd' + (date === S.today ? ' today' : '') + (date < S.today ? ' past' : '') + (closed ? ' closed' : '') + '" data-a="goto" data-v="' + date + '"><b>' + d + '</b>' + (o && o.n ? '<span>' + o.p + '</span>' : '<span>&nbsp;</span>') + (o && o.pend ? '<i></i>' : '') + '</button>';
  }
  return h + '</div><p class="hint">' + ic('person') + ' ' + esc(t('guests')) + ' &nbsp; <i class="dot"></i> ' + esc(t('open')) + '</p>';
}
const num = (k, label, min, max, step) => '<label class="f"><span>' + esc(label) + '</span><input type="number" inputmode="numeric" data-k="' + k + '" min="' + min + '" max="' + max + '"' + (step ? ' step="' + step + '"' : '') + ' value="' + esc(S.cfg[k]) + '"></label>';
const tog = (k, label) => '<label class="tg"><span>' + esc(label) + '</span><input type="checkbox" data-k="' + k + '"' + (S.cfg[k] ? ' checked' : '') + '><i></i></label>';
function moreHtml() {
  const c = S.cfg; if (!c) return '<p class="empty">…</p>';
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isDefault = S.defaults && ['seats', 'perSlot', 'maxParty'].every((k) => c[k] === S.defaults[k]);
  let wd = ''; for (let i = 1; i <= 7; i++) { const g = i % 7; wd += '<button type="button" class="chipb" data-a="wd" data-v="' + g + '" aria-pressed="' + c.closedWeekdays.includes(g) + '">' + esc(new Date(2024, 0, i).toLocaleDateString(LOC[LI], { weekday: 'short' }).replace('.', '')) + '</button>'; }
  const st = S.stats;
  return '<section class="card"><h2>' + esc(t('more.mode')) + '</h2><div class="seg"><button type="button" data-a="mode" data-v="test" aria-pressed="' + (c.mode === 'test') + '">' + esc(t('test')) + '</button><button type="button" data-a="mode" data-v="live" aria-pressed="' + (c.mode === 'live') + '">' + esc(t('live')) + '</button></div><p class="hint">' + esc(t('more.mode.p')) + '</p></section>' +
    '<section class="card"><h2>' + esc(t('more.design')) + '</h2><p class="hint">' + esc(t('design.p')) + '</p><div class="chips">' + ['auto', 'klassik', 'fruehling', 'sommer', 'herbst', 'winter', 'ramadan', 'weihnachten', 'silvester'].map((d) => '<button type="button" class="chipb" data-a="design" data-v="' + d + '" aria-pressed="' + ((c.design || 'auto') === d) + '">' + esc(t('ds.' + d)) + '</button>').join('') + '</div></section>' +
    '<section class="card"><h2>' + esc(t('more.push')) + '</h2><p class="hint">' + esc(t('push.p')) + '</p><div class="btns"><button type="button" class="btn" data-a="push">' + esc(t(S.pushOn ? 'push.off' : 'push.on')) + '</button>' + (S.pushOn ? '<button type="button" class="btn line" data-a="pushtest">' + esc(t('push.test')) + '</button>' : '') + '</div><p class="hint" id="pushMsg">' + (S.pushOn ? esc(t('push.ok')) : '') + '</p></section>' +
    '<section class="card"><h2>' + esc(t('more.app')) + '</h2>' + (standalone ? '<p class="hint">' + esc(t('app.done')) + '</p>' : (S.deferred ? '<div class="btns"><button type="button" class="btn" data-a="install">' + esc(t('app.btn')) + '</button></div>' : '') + '<p class="hint">' + esc(t('app.ios')) + '</p><p class="hint">' + esc(t('app.and')) + '</p>') + '</section>' +
    '<form id="cfgForm" novalidate><section class="card"><h2>' + esc(t('more.seats')) + '</h2>' + (isDefault ? '<p class="hint warn">' + esc(t('placeholder')) + '</p>' : '') + num('seats', t('seats'), 1, 500) + num('perSlot', t('perSlot'), 1, 500) + num('maxParty', t('maxParty'), 1, 40) + '</section>' +
    '<section class="card"><h2>' + esc(t('more.times')) + '</h2><div class="grid2"><label class="f"><span>' + esc(t('first')) + '</span><input type="time" data-k="firstSlot" value="' + esc(c.firstSlot) + '"></label><label class="f"><span>' + esc(t('last')) + '</span><input type="time" data-k="lastSlot" value="' + esc(c.lastSlot) + '"></label>' +
    '<label class="f"><span>' + esc(t('step')) + '</span><select data-k="slotMin">' + [15, 30, 60].map((v) => '<option' + (c.slotMin === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>' + num('durMin', t('dur'), 30, 300, 15) + '</div></section>' +
    '<section class="card"><h2>' + esc(t('more.vip')) + '</h2>' + tog('vip', t('vip.on')) + '<div class="grid2">' + num('vipMin', t('vipMin'), 1, 40) + num('vipMax', t('vipMax'), 1, 60) + num('vipDurMin', t('vipDur'), 30, 480, 15) + '</div></section>' +
    '<section class="card"><h2>' + esc(t('more.lead')) + '</h2><div class="grid2">' + num('leadMin', t('leadMin'), 0, 2880, 15) + num('maxDays', t('maxDays'), 1, 365) + '</div></section>' +
    '<section class="card"><h2>' + esc(t('more.auto')) + '</h2>' + tog('autoConfirm', t('more.auto')) + '<p class="hint">' + esc(t('more.auto.p')) + '</p></section>' +
    '<section class="card"><h2>' + esc(t('more.closed')) + '</h2><p class="lbl">' + esc(t('closed.wd')) + '</p><div class="chips">' + wd + '</div><p class="lbl">' + esc(t('closed.dates')) + '</p><div class="chips">' + (c.closedDates.length ? c.closedDates.map((d) => '<button type="button" class="chipb on" data-a="undate" data-v="' + d + '">' + esc(fmtDay(d, { day: 'numeric', month: 'short', year: '2-digit' })) + ' ×</button>').join('') : '<span class="hint">–</span>') + '</div><div class="addrow"><input type="date" id="closeDate" min="' + S.today + '"><button type="button" class="btn line" data-a="adddate">' + esc(t('add')) + '</button></div></section>' +
    '<section class="card"><h2>' + esc(t('more.data')) + '</h2>' + num('keepDays', t('keepDays'), 7, 730) + '<div class="btns"><button type="button" class="btn line" data-a="purge">' + esc(t('purge')) + '</button></div></section>' +
    '<div class="savebar"><button type="submit" class="btn">' + esc(t('save')) + '</button></div></form>' +
    (st ? '<section class="card"><h2>' + esc(t('more.stats')) + '</h2><div class="kpis"><div><b>' + st.res + '</b><span>' + esc(t('stats.res')) + '</span></div><div><b>' + st.guests + '</b><span>' + esc(t('stats.guests')) + '</span></div><div><b>' + st.noshow + '</b><span>' + esc(t('stats.noshow')) + '</span></div></div><p class="hint">' + st.web + ' ' + esc(t('stats.web')) + '</p></section>' : '') +
    '<section class="card"><h2>' + esc(t('more.sec')) + '</h2><div class="btns"><button type="button" class="btn line" data-a="pinchange">' + esc(t('pin.change')) + '</button><button type="button" class="btn line" data-a="logout">' + esc(t('logout')) + '</button></div><p class="lbl">' + esc(t('devices')) + '</p><ul class="devs">' + S.devices.map((d) => '<li><b>' + esc(d.device || 'Admin') + '</b><span>' + esc(new Date(d.seen_at).toLocaleDateString(LOC[LI], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span></li>').join('') + '</ul></section>' +
    '<section class="card"><h2>' + esc(t('lang')) + '</h2><div class="seg"><button type="button" data-a="lang" data-v="de" aria-pressed="' + (LI === 0) + '">Deutsch</button><button type="button" data-a="lang" data-v="tr" aria-pressed="' + (LI === 1) + '">Türkçe</button></div></section>';
}
function mainHtml() {
  const all = [['day', 'cal2', t('tab.day')], ['inbox', 'bell', t('tab.inbox')], ['cal', 'grid', t('tab.cal')], ['cat', 'tray', t('tab.cat')], ['more', 'gear', t('tab.more')]];
  const tabs = S.demo ? all.filter((x) => x[0] === 'cat') : all, cnt = (k) => (k === 'inbox' ? S.pending.length : k === 'cat' ? S.cat.open : 0);
  return '<header class="top"><div class="brand"><img src="../img/logo.svg" alt="" width="26" height="33"><b>LEONN</b></div><span class="mode ' + (S.demo ? 'demo' : S.mode) + '">' + esc(t(S.demo ? 'demo.s' : S.mode === 'live' ? 'live' : 'test.s')) + '</span>' + (S.demo ? '' : '<button type="button" class="sq" data-a="search" aria-label="' + esc(t('search')) + '">' + ic('search') + '</button>') + '<button type="button" class="sq" data-a="reload" aria-label="↻">' + ic('refresh') + '</button></header>' +
    '<main id="view" class="v-' + S.view + '">' + (S.view === 'day' ? dayHtml() : S.view === 'inbox' ? inboxHtml() : S.view === 'cal' ? calHtml() : S.view === 'cat' ? catHtml() : moreHtml()) + '</main>' +
    (S.demo ? '' : '<button type="button" class="fab" data-a="new" aria-label="' + esc(t('new.h')) + '">' + ic('plus') + '</button>') +
    '<nav class="tabs">' + tabs.map((x) => '<button type="button" data-a="tab" data-v="' + x[0] + '" aria-current="' + (S.view === x[0] ? 'page' : 'false') + '">' + ic(x[1]) + '<span>' + esc(x[2]) + '</span>' + (cnt(x[0]) ? '<i class="cnt">' + cnt(x[0]) + '</i>' : '') + '</button>').join('') + '</nav>';
}
function render() {
  document.documentElement.lang = LI ? 'tr' : 'de';
  const app = $('#app'); app.className = S.lock === 'ok' ? 'main' : 'locked';
  if (S.lock !== 'ok') { app.innerHTML = lockHtml(); return; }
  if (!S.calYm) S.calYm = (S.today || ymd(new Date())).slice(0, 7);
  app.innerHTML = mainHtml();
}
function renderMain() {
  if (S.lock !== 'ok') return;
  const v = $('#view'); if (!v) { render(); return; }
  if (S.view === 'more' && v.classList.contains('v-more') && $('#cfgForm') && document.activeElement && v.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return; // Eingaben nicht überschreiben
  const y = window.scrollY; render(); window.scrollTo(0, y);
}

/* ------------------------------------------------------------ Blätter (Detail, Neu, Nachricht) */
function sheet(html, kind, id) {
  const el = $('#sheet'); S.sheet = { kind, id };
  el.innerHTML = '<div class="sh-bg" data-a="close"></div><div class="sh" role="dialog" aria-modal="true"><button type="button" class="sh-x sq" data-a="close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' + html + '</div>';
  el.hidden = false; document.body.classList.add('noscroll');
  const f = $('.sh [autofocus]', el) || $('.sh-x', el); if (f) setTimeout(() => f.focus(), 30);
}
function closeSheet() { const el = $('#sheet'); el.hidden = true; el.innerHTML = ''; S.sheet = null; document.body.classList.remove('noscroll'); }
function waNum(p) { let d = String(p || '').replace(/[^\d+]/g, ''); if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = '49' + d.slice(1); return d.replace(/\D/g, ''); }
function msgText(r, kind) {
  const L = MSG[kind][r.lang] ? r.lang : 'de';
  return MSG[kind][L].replace('{name}', r.name).replace('{date}', dObj(r.date).toLocaleDateString(MLOC[L], { weekday: 'long', day: 'numeric', month: 'long' })).replace('{time}', r.time).replace('{n}', r.persons)
    .replace('{vip}', r.area === 'v' ? (L === 'tr' ? ', V.I.P Room' : L === 'en' ? ' in the V.I.P Room' : ' im V.I.P Room') : '').replace('{link}', SITE + '?r=' + r.token + '#reservieren').replace('{tel}', (S.cfg && S.cfg.phone) || '02443 9124069');
}
function tellHtml(r, kind) {
  const txt = msgText(r, kind), e = encodeURIComponent(txt), wa = waNum(r.phone);
  return '<div class="tellbox"><div class="seg"><button type="button" data-a="tellkind" data-id="' + r.id + '" data-v="ok" aria-pressed="' + (kind === 'ok') + '">' + esc(t('tell.ok')) + '</button><button type="button" data-a="tellkind" data-id="' + r.id + '" data-v="no" aria-pressed="' + (kind === 'no') + '">' + esc(t('tell.no')) + '</button></div>' +
    '<textarea id="tellTxt" rows="5" readonly>' + esc(txt) + '</textarea><div class="acts">' +
    (wa.length >= 8 ? '<a class="act wa" href="https://wa.me/' + wa + '?text=' + e + '" target="_blank" rel="noopener">' + ic('chat') + esc(t('wa')) + '</a><a class="act" href="sms:' + esc(r.phone.replace(/\s/g, '')) + '?&body=' + e + '">' + ic('sms') + esc(t('sms')) + '</a>' : '') +
    (r.email ? '<a class="act" href="mailto:' + encodeURIComponent(r.email) + '?subject=' + encodeURIComponent('Leonn Restaurant – ' + r.code) + '&body=' + e + '">' + ic('mail') + esc(t('mail')) + '</a>' : '') +
    '<button type="button" class="act" data-a="copy">' + ic('copy') + esc(t('copy')) + '</button></div></div>';
}
function detailHtml(r, log, tell) {
  const btn = (v, label, cls, icn) => '<button type="button" class="btn ' + (cls || 'line') + '" data-a="set" data-id="' + r.id + '" data-v="' + v + '">' + (icn ? ic(icn) : '') + esc(label) + '</button>';
  let act = '';
  if (r.status === 'pending') act = btn('declined', t('decline'), 'no', 'x') + btn('confirmed', t('confirm'), 'ok', 'check');
  else if (r.status === 'confirmed') act = btn('seated', t('seated'), 'ok', 'check') + btn('noshow', t('noshow')) + btn('cancelled', t('cancel'));
  else if (r.status === 'seated') act = btn('done', t('done'), 'ok', 'check') + btn('confirmed', t('reopen'));
  else act = btn('confirmed', t('reopen'));
  const tel = r.phone.replace(/[^\d+]/g, '');
  return '<div class="d-head"><span class="d-when"><i>' + esc(dayName(r.date) ? dayName(r.date) + ' · ' : '') + esc(fmtDay(r.date)) + '</i><b>' + esc(r.time) + esc(t('clock')) + '</b></span>' + chip(r) + '</div>' +
    '<h2 class="d-name">' + esc(r.name) + '</h2><p class="d-meta">' + ic('person') + r.persons + ' ' + esc(t('persons')) + ' · ' + esc(areaName(r.area)) + ' · ' + esc(r.code) + ' · ' + esc(t('src.' + r.source)) + (r.test ? ' · Test' : '') + '</p>' +
    (r.note ? '<p class="d-note"><span>' + esc(t('note')) + '</span>' + esc(r.note) + '</p>' : '') +
    '<div class="acts">' + (tel ? '<a class="act" href="tel:' + esc(tel) + '">' + ic('phone') + esc(t('call')) + '<small>' + esc(r.phone) + '</small></a>' : '') + '<button type="button" class="act" data-a="tell" data-id="' + r.id + '">' + ic('chat') + esc(t('tell')) + '</button></div>' +
    (tell ? tellHtml(r, tell) : '') +
    '<div class="d-act">' + act + '</div>' +
    '<div class="grid2"><label class="f"><span>' + esc(t('table')) + '</span><input id="dTbl" maxlength="20" value="' + esc(r.tbl) + '" enterkeyhint="done"></label><label class="f"><span>' + esc(t('inote')) + '</span><input id="dNote" maxlength="400" value="' + esc(r.admin_note) + '" enterkeyhint="done"></label></div>' +
    '<div class="d-foot"><button type="button" class="btn line" data-a="savenote" data-id="' + r.id + '">' + esc(t('save')) + '</button><button type="button" class="btn line" data-a="editres" data-id="' + r.id + '">' + esc(t('edit')) + '</button><button type="button" class="btn line danger" data-a="delres" data-id="' + r.id + '">' + esc(t('del')) + '</button></div>' +
    (log && log.length ? '<details class="d-log"><summary>' + esc(t('history')) + '</summary><ul>' + log.map((l) => '<li><span>' + esc(new Date(l.ts).toLocaleDateString(LOC[LI], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span>' + esc(T['log.' + l.action] ? t('log.' + l.action) : (T['st.' + l.action] ? t('st.' + l.action) : l.action)) + (l.who && l.who !== 'web' ? ' · ' + esc(l.who) : '') + '</li>').join('') + '</ul></details>' : '');
}
async function openDetail(id, keep, tell) {
  const r = S.byId.get(id); if (!r) return;
  const prev = S.sheet && S.sheet.kind === 'detail' && S.sheet.id === id ? S.sheet : null;
  const tk = tell !== undefined ? tell : (prev ? prev.tell : null);
  if (!keep || !prev) sheet(detailHtml(r, prev ? prev.log : null, tk), 'detail', id);
  else { const tb = $('#dTbl'), nt = $('#dNote'), a = tb && document.activeElement === tb, b = nt && document.activeElement === nt; if (a || b) return; $('.sh').innerHTML = '<button type="button" class="sh-x sq" data-a="close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' + detailHtml(r, prev.log, tk); }
  S.sheet = { kind: 'detail', id, tell: tk, log: prev ? prev.log : null };
  if (!prev || !prev.log) { const d = await call('GET', '/admin/res/' + id); if (d.ok && S.sheet && S.sheet.kind === 'detail' && S.sheet.id === id) { S.byId.set(id, d.j.row); S.sheet.log = d.j.log; const o = document.activeElement; if (!o || !/INPUT|TEXTAREA/.test(o.tagName)) $('.sh').innerHTML = '<button type="button" class="sh-x sq" data-a="close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' + detailHtml(d.j.row, d.j.log, S.sheet.tell); } }
}
async function setStatus(id, status) {
  const r = await call('PATCH', '/admin/res/' + id, { status });
  if (!r.ok) { toast(t('net'), 'bad'); return; }
  S.byId.set(id, r.j.row); setPending(S.pending.filter((x) => x.id !== id).concat(r.j.row.status === 'pending' ? [r.j.row] : []));
  S.counts = {}; renderMain();
  const tell = r.j.row.source === 'web' && (status === 'confirmed' || status === 'declined') ? (status === 'confirmed' ? 'ok' : 'no') : null;
  if (S.sheet && S.sheet.kind === 'detail' && S.sheet.id === id) { S.sheet.log = null; openDetail(id, false, tell || null); }
  else if (tell) openDetail(id, false, tell);
  toast(t('st.' + status), status === 'declined' || status === 'cancelled' || status === 'noshow' ? 'bad' : 'good');
}
async function slotOptions(date, persons, area, sel, ignore) {
  const r = await call('GET', '/admin/slots?date=' + date + '&persons=' + persons + '&area=' + area + (ignore ? '&ignore=' + ignore : ''));
  const el = $('#fTime'); if (!el || !r.ok) return;
  let cur = sel || el.value, h = '', has = false;
  if (!cur) { // heute: das laufende Zeitfenster, sonst 19:00
    const up = r.j.slots.filter((x) => x.s !== 'past'), nowS = up.filter((x) => x.t <= S.time);
    cur = date === S.today ? ((nowS.length ? nowS[nowS.length - 1] : up[0]) || {}).t : ((r.j.slots.find((x) => x.t === '19:00') || r.j.slots[0] || {}).t); cur = cur || '';
  }
  r.j.slots.forEach((x) => { if (x.t === cur) has = true; h += '<option value="' + x.t + '"' + (x.t === cur ? ' selected' : '') + '>' + x.t + (x.s === 'past' ? '' : ' · ' + (x.s === 'full' ? t('full') : t('left', { n: x.left }))) + '</option>'; });
  if (cur && !has) h = '<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>' + h;
  el.innerHTML = h;
}
function formHtml(r) {
  const e = !!r, d = r || { date: S.date < S.today ? S.today : S.date, time: '', persons: 2, area: 'r', name: '', phone: '', email: '', note: '', source: 'phone' };
  return '<h2 class="sh-h">' + esc(t(e ? 'edit.h' : 'new.h')) + '</h2><form id="resForm" novalidate data-id="' + (e ? r.id : '') + '">' +
    '<div class="stepper"><span>' + esc(t('persons')) + '</span><button type="button" class="sq" data-a="pp" data-v="-1" aria-label="−">' + ic('minus') + '</button><input id="fPers" type="number" inputmode="numeric" min="1" max="99" value="' + d.persons + '"><button type="button" class="sq" data-a="pp" data-v="1" aria-label="+">' + ic('plus') + '</button></div>' +
    '<div class="seg" id="fArea"><button type="button" data-a="farea" data-v="r" aria-pressed="' + (d.area !== 'v') + '">' + esc(t('rest')) + '</button><button type="button" data-a="farea" data-v="v" aria-pressed="' + (d.area === 'v') + '">' + esc(t('vip')) + '</button></div>' +
    '<div class="grid2"><label class="f"><span>' + esc(t('date')) + '</span><input id="fDate" type="date" value="' + esc(d.date) + '" required></label><label class="f"><span>' + esc(t('time')) + '</span><select id="fTime" required>' + (d.time ? '<option selected>' + esc(d.time) + '</option>' : '') + '</select></label></div>' +
    '<label class="f"><span>' + esc(t('name')) + '</span><input id="fName" maxlength="80" autocomplete="off" value="' + esc(d.name) + '" required' + (e ? '' : ' autofocus') + '></label>' +
    '<div class="grid2"><label class="f"><span>' + esc(t('phone')) + '</span><input id="fPhone" type="tel" inputmode="tel" maxlength="30" autocomplete="off" value="' + esc(d.phone) + '"></label><label class="f"><span>' + esc(t('email')) + '</span><input id="fMail" type="email" maxlength="120" autocomplete="off" value="' + esc(d.email) + '"></label></div>' +
    '<label class="f"><span>' + esc(t('note')) + '</span><input id="fNote" maxlength="400" value="' + esc(d.note) + '"></label>' +
    (e ? '' : '<div class="seg" id="fSrc"><button type="button" data-a="fsrc" data-v="phone" aria-pressed="true">' + ic('phone') + esc(t('src.phone')) + '</button><button type="button" data-a="fsrc" data-v="walkin" aria-pressed="false">' + ic('person') + esc(t('src.walkin')) + '</button></div>') +
    '<p class="lk-msg" id="fMsg" role="alert"></p><div class="d-act"><button type="submit" class="btn ok">' + esc(t('save')) + '</button></div></form>';
}
function openForm(r) {
  sheet(formHtml(r), 'form', r ? r.id : 0);
  const d = $('#fDate').value; slotOptions(d, +$('#fPers').value, $('#fArea [aria-pressed="true"]').dataset.v, r ? r.time : '', r ? r.id : 0);
}
function refreshSlots() { const f = $('#resForm'); if (!f) return; slotOptions($('#fDate').value, +$('#fPers').value || 1, $('#fArea [aria-pressed="true"]').dataset.v, $('#fTime').value, +f.dataset.id || 0); }
async function saveForm(force) {
  const f = $('#resForm'), id = +f.dataset.id || 0, msg = $('#fMsg');
  const b = { date: $('#fDate').value, time: $('#fTime').value, persons: +$('#fPers').value, area: $('#fArea [aria-pressed="true"]').dataset.v, name: $('#fName').value.trim(), phone: $('#fPhone').value.trim(), email: $('#fMail').value.trim(), note: $('#fNote').value.trim() };
  if (b.name.length < 2 || !b.date || !b.time || !(b.persons >= 1)) { msg.textContent = t('need'); return; }
  if (!id) { b.source = $('#fSrc [aria-pressed="true"]').dataset.v; if (b.source === 'walkin') b.status = 'seated'; if (force) b.force = true; }
  const r = id ? await call('PATCH', '/admin/res/' + id, b) : await call('POST', '/admin/res', b);
  if (r.status === 409 && r.j.error === 'full') { msg.innerHTML = esc(t('full.q', { n: r.j.left || 0 })) + ' <button type="button" class="btn line" data-a="force">' + esc(t('force')) + '</button>'; return; }
  if (!r.ok) { msg.textContent = r.j.error === 'fields' ? ((r.j.fields || []).includes('phone') ? t('need.phone') : t('err.fields')) : t('net'); return; }
  S.byId.set(r.j.row.id, r.j.row); S.counts = {}; closeSheet(); toast(t('saved'), 'good');
  S.date = r.j.row.date; S.view = 'day'; await loadDay(S.date, true);
}

/* ------------------------------------------------------------ Catering */
const money = (c, whole) => (Number(c) / 100).toLocaleString(LOC[LI], Object.assign({ style: 'currency', currency: 'EUR' }, whole ? { maximumFractionDigits: 0 } : {}));
const cchip = (r) => '<span class="st c-' + r.status + '">' + esc(t('cst.' + r.status)) + '</span>';
const occName = (o) => (T['occ.' + o] ? t('occ.' + o) : o);
const catWhen = (r) => dayName(r.date) || fmtDay(r.date, { weekday: 'short', day: 'numeric', month: 'short' });
const catById = (id) => S.cat.rows.find((x) => x.id === id);
const catPut = (row) => { const i = S.cat.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.cat.rows[i] = row; else S.cat.rows.push(row); };
const catCount = () => { S.cat.open = S.cat.rows.filter((x) => x.status === 'pending').length; badge(); };
// Zähler aus Tagesliste und Abfrage: zeigt die Zahl am Reiter und lädt die Liste nach, sobald sich etwas geändert hat
function catSeen(c) {
  if (!c) return;
  const changed = c.open !== S.cat.open, moved = c.ts !== S.cat.ts;
  S.cat.open = c.open; S.cat.ts = c.ts; badge();
  if (!S.cat.known) { S.cat.known = true; loadCat(true); }
  else if (moved) loadCat(true);
  else if (changed && S.lock === 'ok' && !S.sheet) renderMain();
}
let catGen = 0;   // steigt bei jeder Änderung von diesem Gerät aus; eine Liste, die davor angefragt wurde, ist dann veraltet
async function loadCat(quiet) {
  const g = catGen, r = await call('GET', '/admin/catering');
  if (!r.ok) { if (r.status !== 401 && !quiet) toast(t('net'), 'bad'); return; }
  if (g !== catGen) { loadCat(true); return; }   // inzwischen hier etwas geändert: Antwort verwerfen und frisch holen
  const first = !S.cat.loaded; let fresh = null;
  r.j.rows.forEach((x) => { if (x.status === 'pending' && !S.cat.seen.has(x.id)) { S.cat.seen.add(x.id); if (!first) fresh = x; } });
  S.cat.rows = r.j.rows; S.cat.loaded = true; S.cat.known = true;
  if (r.j.cat) { S.cat.open = r.j.cat.open; S.cat.ts = r.j.cat.ts; } else catCount();
  if (r.j.today && !S.today) S.today = r.j.today;
  badge();
  if (fresh) { chime(); toast(t('cat.toast', { x: fresh.name + ', ' + fmtDay(fresh.date, { day: 'numeric', month: 'short' }) + ', ' + fresh.guests + ' ' + t('cat.guests') }), 'new'); }
  if (S.lock !== 'ok') return;
  if (S.sheet && S.sheet.kind === 'cdetail') { if (catById(S.sheet.id)) openCat(S.sheet.id, true); renderMain(); }
  else if (!S.sheet) renderMain();
}
function catRow(r) {
  return '<button type="button" class="row" data-a="copen" data-id="' + r.id + '"><span class="r-time"><i>' + esc(catWhen(r)) + '</i><b>' + esc(r.time) + '</b></span>' +
    '<span class="r-main"><b>' + esc(r.name) + '</b><span>' + r.guests + ' ' + esc(t('cat.guests')) + ' · ' + esc(occName(r.occasion)) + ' · ' + esc(money(r.total)) + (r.test ? ' · Test' : '') + '</span></span>' + cchip(r) + '</button>';
}
function catReq(r) {
  return '<div class="req" data-id="' + r.id + '"><button type="button" class="req-body" data-a="copen" data-id="' + r.id + '"><span class="req-when"><i>' + esc(catWhen(r)) + '</i><b>' + esc(r.time) + '</b></span>' +
    '<span class="r-main"><b>' + esc(r.name) + '</b><span>' + r.guests + ' ' + esc(t('cat.guests')) + ' · ' + esc(occName(r.occasion)) + ' · ' + esc(money(r.total)) + (r.test ? ' · Test' : '') + '</span>' + (r.note ? '<span class="req-note">„' + esc(r.note) + '“</span>' : '') + '</span></button>' +
    '<div class="req-act"><button type="button" class="btn no" data-a="cset" data-id="' + r.id + '" data-v="declined">' + ic('x') + esc(t('cat.decline')) + '</button><button type="button" class="btn ok" data-a="cset" data-id="' + r.id + '" data-v="offered">' + ic('check') + esc(t('cat.offer')) + '</button></div></div>';
}
function catHtml() {
  const demo = S.demo ? '<p class="hint warn">' + esc(t('cat.demo.p')) + '</p>' : '';
  if (!S.cat.loaded) return demo + '<p class="empty">…</p>';
  const rows = S.cat.rows.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.id - b.id);
  const pend = rows.filter((r) => r.status === 'pending'), run = rows.filter((r) => ['offered', 'confirmed', 'paid'].includes(r.status)), off = rows.filter((r) => ['done', 'declined', 'cancelled'].includes(r.status)).reverse();
  const firm = rows.filter((r) => r.status === 'confirmed' || r.status === 'paid');
  let h = demo + '<div class="kpis"><div class="' + (pend.length ? 'warn' : '') + '"><b>' + pend.length + '</b><span>' + esc(t('open')) + '</span></div><div><b>' + firm.length + '</b><span>' + esc(t('cat.firm')) + '</span></div><div><b class="sm">' + esc(money(firm.reduce((a, r) => a + r.total, 0), true)) + '</b><span>' + esc(t('cat.sum')) + '</span></div></div>';
  if (!rows.length) return h + '<p class="empty">' + esc(t('cat.none')) + '</p>';
  if (pend.length) h += '<section class="card hot"><h2>' + esc(t('new.req')) + '<small>' + pend.length + '</small></h2>' + pend.map(catReq).join('') + '</section>';
  if (run.length) h += '<section class="card"><h2>' + esc(t('cat.run')) + '</h2><div class="rows">' + run.map(catRow).join('') + '</div></section>';
  if (off.length) h += '<section class="card dim"><h2>' + esc(t('cat.old')) + '</h2><div class="rows">' + off.map(catRow).join('') + '</div></section>';
  return h;
}
function cmsgText(r, kind) {
  const L = CMSG[kind][r.lang] ? r.lang : 'de', loc = MLOC[L], m = (c) => (c / 100).toLocaleString(loc, { style: 'currency', currency: 'EUR' });
  const v = { name: r.name, date: dObj(r.date).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }), time: r.time, n: r.guests, total: m(r.total), dep: m(r.deposit), link: (S.demo ? new URL('../catering/', location.href).href : SITE + 'catering/') + '?a=' + r.token, tel: (S.cfg && S.cfg.phone) || '02443 9124069' };
  return CMSG[kind][L].replace(/\{(\w+)\}/g, (x, k) => (v[k] !== undefined ? v[k] : x));
}
function ctellHtml(r, kind) {
  const txt = cmsgText(r, kind), e = encodeURIComponent(txt), wa = waNum(r.phone);
  const kb = (k, label) => '<button type="button" data-a="ctellkind" data-id="' + r.id + '" data-v="' + k + '" aria-pressed="' + (kind === k) + '">' + esc(label) + '</button>';
  return '<div class="tellbox"><div class="seg">' + kb('offer', t('cat.tell.offer')) + kb('ok', t('tell.ok')) + kb('no', t('tell.no')) + '</div>' +
    '<textarea id="tellTxt" rows="5" readonly>' + esc(txt) + '</textarea><div class="acts">' +
    (wa.length >= 8 ? '<a class="act wa" href="https://wa.me/' + wa + '?text=' + e + '" target="_blank" rel="noopener">' + ic('chat') + esc(t('wa')) + '</a><a class="act" href="sms:' + esc(r.phone.replace(/\s/g, '')) + '?&body=' + e + '">' + ic('sms') + esc(t('sms')) + '</a>' : '') +
    (r.email ? '<a class="act" href="mailto:' + encodeURIComponent(r.email) + '?subject=' + encodeURIComponent('Leonn Catering – ' + r.code) + '&body=' + e + '">' + ic('mail') + esc(t('mail')) + '</a>' : '') +
    '<button type="button" class="act" data-a="copy">' + ic('copy') + esc(t('copy')) + '</button></div></div>';
}
function catDetailHtml(r, log, tell) {
  const btn = (v, label, cls, icn) => '<button type="button" class="btn ' + (cls || 'line') + '" data-a="cset" data-id="' + r.id + '" data-v="' + v + '">' + (icn ? ic(icn) : '') + esc(label) + '</button>';
  let act = '';
  if (r.status === 'pending') act = btn('declined', t('cat.decline'), 'no', 'x') + btn('offered', t('cat.offer'), 'ok', 'check');
  else if (r.status === 'offered') act = btn('confirmed', t('cat.accepted'), 'ok', 'check') + btn('cancelled', t('cancel'));
  else if (r.status === 'confirmed') act = btn('paid', t('cat.paid'), 'ok', 'check') + btn('cancelled', t('cancel'));
  else if (r.status === 'paid') act = btn('done', t('cat.done'), 'ok', 'check') + btn('cancelled', t('cancel'));
  else act = btn('pending', t('reopen'));
  const tel = String(r.phone || '').replace(/[^\d+]/g, ''), d = r.data || {}, lines = d.lines || [], extra = d.extra || [];
  const kg = (g) => (g / 1000).toLocaleString(LOC[LI], { maximumFractionDigits: 1 });
  const kitchen = lines.map((l) => '<tr><th colspan="2">' + esc(T['cc.' + l.cat] ? t('cc.' + l.cat) : l.name) + '</th></tr>' + (l.rows || []).map((x) => '<tr><td>' + esc(x.name) + '</td><td>' + r.guests + ' × ' + x.pg + ' g · ' + kg(x.pg * r.guests) + ' kg</td></tr>').join('')).join('');
  const xl = (e) => (e.k === 'staff' ? t('cx.staff', { n: e.n, h: e.h }) : e.k === 'deliv' ? (T['cx.deliv.' + e.z] ? t('cx.deliv.' + e.z) : e.label) : (T['cx.' + e.k] ? t('cx.' + e.k) : e.label));
  return '<div class="d-head c-head"><span class="d-when"><i>' + esc(dayName(r.date) ? dayName(r.date) + ' · ' : '') + esc(fmtDay(r.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</i><b>' + esc(r.time) + esc(t('clock')) + '</b></span>' + cchip(r) + '</div>' +
    '<h2 class="d-name">' + esc(r.name) + '</h2><p class="d-meta">' + ic('person') + r.guests + ' ' + esc(t('cat.guests')) + ' · ' + esc(occName(r.occasion)) + ' · ' + esc(r.code) + (r.test ? ' · Test' : '') + '</p>' +
    (r.address ? '<p class="d-note plain"><span>' + esc(t('cat.addr')) + '</span>' + esc(r.address) + '</p>' : '') +
    (r.note ? '<p class="d-note"><span>' + esc(t('note')) + '</span>' + esc(r.note) + '</p>' : '') +
    '<div class="acts">' + (tel ? '<a class="act" href="tel:' + esc(tel) + '">' + ic('phone') + esc(t('call')) + '<small>' + esc(r.phone) + '</small></a>' : '') + '<button type="button" class="act" data-a="ctell" data-id="' + r.id + '">' + ic('chat') + esc(t('tell')) + '</button></div>' +
    (tell ? ctellHtml(r, tell) : '') +
    '<div class="d-act">' + act + '</div>' +
    '<div class="c-sum"><div><span>' + esc(t('cat.total')) + '</span><b>' + esc(money(r.total)) + '</b></div><div><span>' + esc(t('cat.pp')) + '</span><b>' + esc(money(Math.round(r.total / Math.max(1, r.guests)))) + '</b></div><div><span>' + esc(t('cat.dep')) + '</span><b>' + esc(money(r.deposit)) + '</b></div></div>' +
    '<table class="ktab"><caption>' + esc(t('cat.kitchen')) + '</caption><tbody>' + kitchen + '</tbody></table>' +
    '<ul class="c-x"><li><span>' + esc(t('cat.food', { pp: money(d.pp || 0) })) + '</span><b>' + esc(money(d.food || 0)) + '</b></li>' + (d.disc ? '<li><span>' + esc(t('cat.disc', { n: d.rate })) + '</span><b>−' + esc(money(d.disc)) + '</b></li>' : '') +
    extra.map((e) => '<li><span>' + esc(xl(e)) + '</span><b>' + (e.amount ? esc(money(e.amount)) : '–') + '</b></li>').join('') + '</ul>' +
    '<label class="f"><span>' + esc(t('inote')) + '</span><input id="cNote" maxlength="600" value="' + esc(r.admin_note) + '" enterkeyhint="done"></label>' +
    '<div class="d-foot"><button type="button" class="btn line" data-a="csavenote" data-id="' + r.id + '">' + esc(t('save')) + '</button><button type="button" class="btn line danger" data-a="cdel" data-id="' + r.id + '">' + esc(t('del')) + '</button></div>' +
    (log && log.length ? '<details class="d-log"><summary>' + esc(t('history')) + '</summary><ul>' + log.map((l) => '<li><span>' + esc(new Date(l.ts).toLocaleDateString(LOC[LI], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span>' + esc(T['clog.' + l.action] ? t('clog.' + l.action) : l.action) + (l.who && l.who !== 'web' ? ' · ' + esc(l.who) : '') + '</li>').join('') + '</ul></details>' : '');
}
async function openCat(id, keep, tell) {
  const r = catById(id); if (!r) return;
  const prev = S.sheet && S.sheet.kind === 'cdetail' && S.sheet.id === id ? S.sheet : null;
  const tk = tell !== undefined ? tell : (prev ? prev.tell : null);
  const x = '<button type="button" class="sh-x sq" data-a="close" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>';
  if (!keep || !prev) sheet(catDetailHtml(r, prev ? prev.log : null, tk), 'cdetail', id);
  else { const nt = $('#cNote'); if (nt && document.activeElement === nt) return; $('.sh').innerHTML = x + catDetailHtml(r, prev.log, tk); }
  S.sheet = { kind: 'cdetail', id, tell: tk, log: prev ? prev.log : null };
  if (!prev || !prev.log) {
    const g = catGen, d = await call('GET', '/admin/catering/' + id);
    if (d.ok && g === catGen && S.sheet && S.sheet.kind === 'cdetail' && S.sheet.id === id) { catPut(d.j.row); S.sheet.log = d.j.log; const o = document.activeElement; if (!o || !/INPUT|TEXTAREA/.test(o.tagName)) $('.sh').innerHTML = x + catDetailHtml(d.j.row, d.j.log, S.sheet.tell); }
  }
}
async function catSet(id, status) {
  const r = await call('PATCH', '/admin/catering/' + id, { status });
  if (!r.ok) { toast(t('net'), 'bad'); return; }
  catGen++; catPut(r.j.row); catCount(); renderMain();
  const tell = status === 'offered' ? 'offer' : status === 'confirmed' ? 'ok' : status === 'declined' ? 'no' : null;
  if (S.sheet && S.sheet.kind === 'cdetail' && S.sheet.id === id) { S.sheet.log = r.j.log || null; openCat(id, false, tell !== null ? tell : S.sheet.tell); }
  else if (tell) openCat(id, false, tell);
  toast(t('cst.' + status), status === 'declined' || status === 'cancelled' ? 'bad' : 'good');
}
// Tipps im Catering-Teil. Gibt true zurück, wenn der Tipp hier erledigt wurde.
async function catClick(a, v, id, el) {
  if (a === 'demo') { S.demo = true; S.lock = 'ok'; S.view = 'cat'; S.mode = 'test'; render(); loadCat(); return true; }
  if (a === 'copen') { openCat(id); return true; }
  if (a === 'cset') { el.disabled = true; await catSet(id, v); return true; }
  if (a === 'ctell') { const r = catById(id); if (r) openCat(id, false, r.status === 'declined' ? 'no' : (r.status === 'pending' || r.status === 'offered') ? 'offer' : 'ok'); return true; }
  if (a === 'ctellkind') { openCat(id, false, v); return true; }
  if (a === 'csavenote') {
    const r = await call('PATCH', '/admin/catering/' + id, { admin_note: $('#cNote').value });
    if (r.ok) { catGen++; catPut(r.j.row); if (S.sheet && S.sheet.kind === 'cdetail' && r.j.log) S.sheet.log = r.j.log; toast(t('saved'), 'good'); renderMain(); } else toast(t('net'), 'bad');
    return true;
  }
  if (a === 'cdel') {
    if (el.dataset.sure) { const r = await call('DELETE', '/admin/catering/' + id, {}); if (r.ok) { catGen++; S.cat.rows = S.cat.rows.filter((x) => x.id !== id); catCount(); closeSheet(); renderMain(); } else toast(t('net'), 'bad'); }
    else { el.dataset.sure = '1'; el.textContent = t('cat.del.q') + ' ' + t('yes'); }
    return true;
  }
  if (a === 'reload' && (S.demo || S.view === 'cat')) { el.classList.add('spin'); await loadCat(); if (!S.demo) loadDay(S.date, true); return true; }
  if (a === 'tab' && S.demo) return true;
  return false;
}
/* Vorführ-Modus ohne Schnittstelle: Beispiel-Anfragen und alles, was auf diesem Gerät im Catering-Konfigurator abgeschickt wurde */
const DEMO_KEY = 'leonn-catering-demo';
let demoSamples = null;
const demoLocal = () => { try { const l = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); return Array.isArray(l) ? l.filter((r) => r && typeof r.token === 'string' && r.data && typeof r.id === 'number') : []; } catch (e) { return []; } };
async function demoCall(method, path, body) {
  if (!demoSamples) {
    try {
      const core = await import('../catering/core.js'), now = Date.now();
      const mk = (id, status, days, guests, occasion, name, pi, over, time) => {
        const c = core.calc(Object.assign({ guests, sel: core.PRESETS[pi].ids.slice() }, over || {})), o = c.order;
        return { id, code: 'CDEMO' + id, token: 'demo-sample-' + id, date: addDays(ymd(new Date()), days), time: time || '18:00', guests, occasion, name, phone: '0221 000000', email: '', address: 'Beispielstraße 1, Köln', note: '', lang: 'de', status, total: c.total, deposit: c.dep,
          data: { sel: o.sel, drinks: o.drinks, ware: o.ware, staff: o.staff, hours: o.hours, deko: o.deko, deliv: o.deliv, pp: c.pp, grams: c.grams, rate: c.rate, food: c.food, disc: c.disc, lines: c.lines, extra: c.extra },
          admin_note: '', test: true, created_at: now, updated_at: now, log: [{ ts: now, action: 'created', who: 'web' }], sample: true };
      };
      demoSamples = [mk(1, 'pending', 9, 60, 'Firmenfeier', 'Beispiel GmbH', 1, { staff: 2, ware: 'porz', deliv: 'b', drinks: ['soft'] }), mk(2, 'offered', 16, 120, 'Hochzeit', 'Familie Beispiel', 2, { staff: 4, hours: 6, deko: true, ware: 'porz', drinks: ['soft', 'cay'] }),
        mk(3, 'paid', 5, 25, 'Geburtstag', 'Erika Beispiel', 0), mk(4, 'confirmed', 11, 35, 'Familienfeier', 'Familie Muster', 3, { drinks: ['cay'] }, '10:30')];
    } catch (e) { demoSamples = []; }
  }
  const local = demoLocal(), all = local.concat(demoSamples), save = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(local)); } catch (e) {} };
  const nf = { ok: false, status: 404, j: { error: 'not_found' } }, m = /^\/admin\/catering(?:\/(\d+))?$/.exec(path);
  if (!m) return nf;
  if (!m[1]) return { ok: true, status: 200, j: { rows: all, today: ymd(new Date()), ts: Date.now(), mode: 'test', cat: { open: all.filter((x) => x.status === 'pending').length, ts: Math.max(0, ...all.map((x) => x.updated_at || 0)) } } };
  const r = all.find((x) => x.id === +m[1]); if (!r) return nf;
  if (method === 'GET') return { ok: true, status: 200, j: { row: r, log: r.log || [] } };
  if (method === 'DELETE') { if (r.sample) demoSamples = demoSamples.filter((x) => x !== r); else { local.splice(local.indexOf(r), 1); save(); } return { ok: true, status: 200, j: { ok: true } }; }
  if (method === 'PATCH') {
    const now = Date.now(), who = S.name || 'Admin'; r.log = r.log || [];
    if (body.status !== undefined && body.status !== r.status) { r.status = body.status; r.log.push({ ts: now, action: body.status, who }); }
    if (body.admin_note !== undefined && body.admin_note !== r.admin_note) { r.admin_note = String(body.admin_note).slice(0, 600); r.log.push({ ts: now, action: 'note', who }); }
    r.updated_at = now; if (!r.sample) save();
    return { ok: true, status: 200, j: { ok: true, row: r, log: r.log } };
  }
  return nf;
}

/* ------------------------------------------------------------ Mitteilungen (Push) und Installation */
const b64ToU8 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
async function pushState() {
  try { if (!('serviceWorker' in navigator) || !('PushManager' in window)) return; const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); S.pushOn = !!sub && Notification.permission === 'granted'; } catch (e) { S.pushOn = false; }
}
const pushBody = (sub) => { const j = sub.toJSON ? sub.toJSON() : {}, k = j.keys || {}; return { endpoint: sub.endpoint, p256dh: k.p256dh || '', auth: k.auth || '', lang: LI === 1 ? 'tr' : 'de' }; };
// Sprache der Mitteilungen dem Gerät nachführen
async function pushSync() {
  try { if (!S.pushOn || S.lock !== 'ok') return; const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) await call('POST', '/admin/push', pushBody(sub)); } catch (e) {}
}
async function pushToggle() {
  const msg = (k, o) => { const el = $('#pushMsg'); if (el) el.textContent = t(k, o); };
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { msg(/iPhone|iPad/.test(navigator.userAgent) ? 'push.ios' : 'push.no'); return; }
  try {
    if (S.pushOn) {
      const r0 = await navigator.serviceWorker.ready, c0 = await r0.pushManager.getSubscription();
      if (c0) { await call('DELETE', '/admin/push', { endpoint: c0.endpoint }); await c0.unsubscribe(); }
      S.pushOn = false; renderMain(); return;
    }
    const perm = await Notification.requestPermission();   // sofort im Tipp fragen, sonst unterdrückt das iPhone die Frage
    if (perm !== 'granted') { msg('push.denied'); return; }
    const reg = await navigator.serviceWorker.ready, cur = await reg.pushManager.getSubscription();
    const k = await call('GET', '/admin/vapid'); if (!k.ok) { msg('net'); return; }
    const sub = cur || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(k.j.key) });
    const r = await call('POST', '/admin/push', pushBody(sub));
    if (!r.ok) { msg('net'); return; }
    S.pushOn = true; renderMain();
  } catch (e) { msg(/iPhone|iPad/.test(navigator.userAgent) ? 'push.ios' : 'push.no'); }
}
async function loadStats() {
  const r = await call('GET', '/admin/stats'); if (!r.ok) return;
  const o = { res: 0, guests: 0, noshow: 0, web: 0 };
  r.j.rows.forEach((x) => { if (x.date > r.j.today) return; if (['confirmed', 'seated', 'done', 'noshow'].includes(x.status)) { o.res += x.c; if (x.source === 'web') o.web += x.c; } if (['confirmed', 'seated', 'done'].includes(x.status)) o.guests += x.p || 0; if (x.status === 'noshow') o.noshow += x.c; });
  S.stats = o; if (S.view === 'more') renderMain();
}

/* ------------------------------------------------------------ Bedienung */
function cfgRead() {
  const o = {}; $$('#cfgForm [data-k]').forEach((el) => { const k = el.dataset.k; o[k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.tagName === 'SELECT' ? Number(el.value) : el.value); });
  o.closedDates = S.cfg.closedDates; o.closedWeekdays = S.cfg.closedWeekdays; o.mode = S.cfg.mode;
  return o;
}
async function cfgSave(patch, quiet) {
  const r = await call('PUT', '/admin/settings', patch);
  if (!r.ok) { if (r.j.fields) { $$('#cfgForm [data-k]').forEach((el) => el.classList.toggle('bad', r.j.fields.includes(el.dataset.k))); toast(t('err.fields'), 'bad'); } else toast(t('net'), 'bad'); return false; }
  S.cfg = r.j.cfg; S.mode = S.cfg.mode; if (!quiet) toast(t('saved'), 'good');
  render(); return true;
}
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v, id = +el.dataset.id || 0;
  if (await catClick(a, v, id, el)) return;
  if (a === 'key') { if (S.busy) return; if (v === 'x') S.pin = S.pin.slice(0, -1); else if (S.pin.length < 6) S.pin += v; S.pinMsg = S.pin.length ? '' : S.pinMsg; const nm = $('#lkName'), keep = nm ? nm.value : null; render(); if (keep !== null && $('#lkName')) $('#lkName').value = keep; if (S.pin.length === 6) tryPin(); }
  else if (a === 'lang') { LI = v === 'tr' ? 1 : 0; store.set('leonn-admin-lang', v); render(); pushSync(); }
  else if (a === 'tab') { S.view = v; closeSheet(); render(); window.scrollTo(0, 0); if (v === 'day') loadDay(S.date, true); else if (v === 'cal') loadCounts(); else if (v === 'more') { await loadSettings(); await pushState(); render(); loadStats(); } else if (v === 'inbox') loadDay(S.date, true); else if (v === 'cat') loadCat(); }
  else if (a === 'day') { S.date = addDays(S.date, +v); render(); loadDay(S.date); }
  else if (a === 'today') { S.date = S.today; render(); loadDay(S.date); }
  else if (a === 'pick') { const p = $('#dayPick'); try { if (p.showPicker) p.showPicker(); else p.focus(); } catch (x) { p.focus(); } }
  else if (a === 'goto') { S.date = v; S.view = 'day'; render(); window.scrollTo(0, 0); loadDay(S.date); }
  else if (a === 'mon') { let y = +S.calYm.slice(0, 4), m = +S.calYm.slice(5) + (+v); if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } S.calYm = y + '-' + pad(m); render(); loadCounts(); }
  else if (a === 'reload') { el.classList.add('spin'); await loadDay(S.date, true); if (S.view === 'cal') loadCounts(); }
  else if (a === 'open') openDetail(id);
  else if (a === 'search') sheet('<h2 class="sh-h">' + esc(t('search')) + '</h2><label class="f"><input id="sQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(t('search.ph')) + '" autofocus></label><div class="rows" id="sRes"></div>', 'search');
  else if (a === 'close') closeSheet();
  else if (a === 'set') { el.disabled = true; await setStatus(id, v); }
  else if (a === 'tell') openDetail(id, false, S.byId.get(id).status === 'declined' ? 'no' : 'ok');
  else if (a === 'tellkind') openDetail(id, false, v);
  else if (a === 'copy') { const tx = $('#tellTxt'); try { await navigator.clipboard.writeText(tx.value); } catch (x) { tx.select(); try { document.execCommand('copy'); } catch (y) {} } toast(t('copied'), 'good'); }
  else if (a === 'savenote') { const r = await call('PATCH', '/admin/res/' + id, { tbl: $('#dTbl').value, admin_note: $('#dNote').value }); if (r.ok) { S.byId.set(id, r.j.row); toast(t('saved'), 'good'); renderMain(); } else toast(t('net'), 'bad'); }
  else if (a === 'editres') openForm(S.byId.get(id));
  else if (a === 'delres') { if (el.dataset.sure) { const r = await call('DELETE', '/admin/res/' + id, {}); if (r.ok) { S.byId.delete(id); Object.keys(S.day).forEach((d) => { S.day[d] = S.day[d].filter((i) => i !== id); }); setPending(S.pending.filter((x) => x.id !== id)); S.counts = {}; closeSheet(); renderMain(); } else toast(t('net'), 'bad'); } else { el.dataset.sure = '1'; el.textContent = t('del.q') + ' ' + t('yes'); } }
  else if (a === 'new') openForm(null);
  else if (a === 'pp') { const p = $('#fPers'); p.value = Math.max(1, Math.min(99, (+p.value || 1) + (+v))); refreshSlots(); }
  else if (a === 'farea' || a === 'fsrc') { $$('[data-a="' + a + '"]', el.parentNode).forEach((x) => x.setAttribute('aria-pressed', x === el ? 'true' : 'false')); if (a === 'farea') refreshSlots(); }
  else if (a === 'force') saveForm(true);
  else if (a === 'design') { if ((S.cfg.design || 'auto') !== v) await cfgSave(Object.assign(cfgRead(), { design: v })); }
  else if (a === 'mode') {   // Umschalten erst nach einem zweiten Tipp, damit es nicht versehentlich passiert
    if (S.cfg.mode === v) return;
    if (el.dataset.sure) await cfgSave(Object.assign(cfgRead(), { mode: v }));
    else { el.dataset.sure = '1'; el.textContent = t(v === 'live' ? 'live.q' : 'test.q'); setTimeout(() => { if (el.isConnected && el.dataset.sure) { delete el.dataset.sure; el.textContent = t(v === 'live' ? 'live' : 'test'); } }, 6000); }
  }
  else if (a === 'wd') { const g = +v, l = S.cfg.closedWeekdays.slice(), i = l.indexOf(g); if (i >= 0) l.splice(i, 1); else l.push(g); await cfgSave(Object.assign(cfgRead(), { closedWeekdays: l }), true); }
  else if (a === 'adddate') { const d = $('#closeDate').value; if (d && !S.cfg.closedDates.includes(d)) await cfgSave(Object.assign(cfgRead(), { closedDates: S.cfg.closedDates.concat([d]) }), true); }
  else if (a === 'undate') await cfgSave(Object.assign(cfgRead(), { closedDates: S.cfg.closedDates.filter((d) => d !== v) }), true);
  else if (a === 'push') pushToggle();
  else if (a === 'pushtest') { const r = await call('POST', '/admin/pushtest', {}); if (r.ok) toast(t('push.sent', { n: r.j.devices }), 'good'); }
  else if (a === 'install') { if (S.deferred) { S.deferred.prompt(); S.deferred = null; render(); } }
  else if (a === 'purge') { if (el.dataset.sure) { const r = await call('POST', '/admin/purge', { what: 'test' }); if (r.ok) { toast(t('purged', { n: r.j.removed }), 'good'); S.byId.clear(); S.day = {}; S.counts = {}; setPending([]); await loadDay(S.date, true); } } else { el.dataset.sure = '1'; el.textContent = t('purge.q') + ' ' + t('yes'); } }
  else if (a === 'logout') { await call('POST', '/admin/logout', {}); S.token = ''; store.del('leonn-admin-token'); S.lock = 'pin'; S.pin = ''; S.pinMsg = ''; render(); }
  else if (a === 'pinchange') sheet('<h2 class="sh-h">' + esc(t('pin.change')) + '</h2><form id="pinForm" novalidate><label class="f"><span>' + esc(t('pin.old')) + '</span><input id="pOld" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password" autofocus></label><label class="f"><span>' + esc(t('setup.pin')) + '</span><input id="pNew" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password"></label><label class="f"><span>' + esc(t('setup.pin2')) + '</span><input id="pNew2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password"></label><p class="lk-msg" id="pMsg" role="alert"></p><div class="d-act"><button type="submit" class="btn ok">' + esc(t('save')) + '</button></div></form>', 'pin');
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'setupForm') doSetup();
  else if (id === 'resForm') saveForm(false);
  else if (id === 'cfgForm') { if (document.activeElement) document.activeElement.blur(); await cfgSave(cfgRead()); }
  else if (id === 'pinForm') {
    const o = $('#pOld').value, n = $('#pNew').value, n2 = $('#pNew2').value, msg = $('#pMsg');
    if (!/^\d{6}$/.test(n)) { msg.textContent = t('setup.pin6'); return; }
    if (n !== n2) { msg.textContent = t('setup.mismatch'); return; }
    const r = await call('POST', '/admin/pin', { old: o, pin: n });
    if (r.ok) { closeSheet(); toast(t('pin.changed'), 'good'); loadSettings().then(renderMain); } else msg.textContent = r.status === 403 ? t('pin.oldbad') : r.j.error === 'pin' ? t('setup.pin6') : t('net');
  }
});
let sTimer = null;
document.addEventListener('input', (e) => {
  if (e.target.id !== 'sQ') return;
  clearTimeout(sTimer); const q = e.target.value.trim();
  sTimer = setTimeout(async () => {
    const box = $('#sRes'); if (!box) return;
    if (q.length < 2) { box.innerHTML = ''; return; }
    const r = await call('GET', '/admin/search?q=' + encodeURIComponent(q)); if (!r.ok || !$('#sRes') || $('#sQ').value.trim() !== q) return;
    take(r.j.rows); box.innerHTML = r.j.rows.length ? r.j.rows.map((x) => rowHtml(x, true)).join('') : '<p class="empty">' + esc(t('search.none')) + '</p>';
  }, 280);
});
const cfgDirty = (e) => { const f = e.target.closest && e.target.closest('#cfgForm'); if (f) f.classList.add('dirty'); };
document.addEventListener('input', cfgDirty);
document.addEventListener('change', (e) => {
  cfgDirty(e);
  const id = e.target.id;
  if (id === 'dayPick' && e.target.value) { S.date = e.target.value; render(); loadDay(S.date); }
  else if (id === 'fDate' || id === 'fPers') refreshSlots();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
  if (S.lock === 'pin' && !/INPUT/.test((e.target.tagName || ''))) { if (/^\d$/.test(e.key)) { const b = $('[data-a="key"][data-v="' + e.key + '"]'); if (b) b.click(); } else if (e.key === 'Backspace') { const b = $('[data-a="key"][data-v="x"]'); if (b) b.click(); } }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.lock === 'ok') { if (S.demo) { loadCat(true); return; } poll(); loadDay(S.date, true); if (S.view === 'cat') loadCat(true); } });
window.addEventListener('storage', (e) => { if (S.demo && e.key === DEMO_KEY) loadCat(true); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.deferred = e; if (S.view === 'more') renderMain(); });
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data === 'leonn-new' && S.lock === 'ok') poll(); });
}
setInterval(poll, 20000);
render(); boot();
})();
