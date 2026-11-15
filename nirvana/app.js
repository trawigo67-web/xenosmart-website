/* Nirvana Vorschau – Verhalten: Sprache, Speisekarte, Warenkorb & Bestellung, Reservierung, Feiern, Kids, Gutschein, Bewegung.
   Aufgebaut auf der Leonn-Vorschau (gleiche Technik, eigene Farben und Inhalte). */
(function () {
'use strict';
var M = window.NIRVANA_MENU || [], TX = window.NIRVANA_TX || {}, CFG = window.NIRVANA_CFG || {};
var PHONE = CFG.phone || '02443 9124069', TEL = 'tel:' + (CFG.phoneIntl || '+4924439124069');
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function ic(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
if (CFG.preview) document.documentElement.classList.add('preview');

/* ------------------------------------------------------------------ Sprache */
var LANGS = ['de', 'tr', 'en'], LOCALE = ['de-DE', 'tr-TR', 'en-GB'], LI = 0;
var I = {
'note': ['Interne Vorschau · Entwurf für die neue Website, nicht die offizielle Nirvana-Seite', 'Dahili önizleme · Yeni site için taslak, resmi Nirvana sitesi değildir', 'Internal preview · Draft for the new website, not the official Nirvana site'],
'skip': ['Zum Inhalt springen', 'İçeriğe geç', 'Skip to content'],
'nav.menu': ['Speisekarte', 'Menü', 'Menu'],
'nav.order': ['Bestellen', 'Sipariş', 'Order'],
'nav.res': ['Reservieren', 'Rezervasyon', 'Reservations'],
'nav.events': ['Feiern', 'Davetler', 'Events'],
'nav.catering': ['Catering', 'Catering', 'Catering'],
'nav.kids': ['Kids', 'Çocuk', 'Kids'],
'nav.about': ['Über uns', 'Hakkımızda', 'About us'],
'nav.gift': ['Gutschein', 'Hediye Çeki', 'Gift card'],
'nav.contact': ['Kontakt', 'İletişim', 'Contact'],
'cta.res': ['Tisch reservieren', 'Masa ayırt', 'Book a table'],
'cta.order': ['Jetzt bestellen', 'Sipariş ver', 'Order now'],
'cta.menu': ['Speisekarte ansehen', 'Menüyü gör', 'View the menu'],
'hero.h': ['Türkische Küche <em>am See.</em>', 'Göl kenarında <em>Türk mutfağı.</em>', 'Turkish cuisine <em>by the lake.</em>'],
'hero.p': ['Frühstücksbuffet, Meze, Grill und Güveç in Mechernich-Kommern. Täglich über 70 Gerichte, frisch zubereitet – mit Blick ins Grüne.', 'Mechernich-Kommern’de açık büfe kahvaltı, meze, ızgara ve güveç. Her gün 70’ten fazla çeşit, taze hazırlanır – yeşil manzara eşliğinde.', 'Breakfast buffet, meze, grill and güveç in Mechernich-Kommern. More than 70 dishes freshly prepared every day – with a view of the green.'],
'hero.hours': ['Täglich ab 10 Uhr, sonntags ab 9 Uhr', 'Her gün 10:00’dan, pazar 09:00’dan itibaren', 'Daily from 10 am, Sundays from 9 am'],
'f.dishes': ['Gerichte, täglich frisch zubereitet', 'çeşit, her gün taze hazırlanır', 'dishes, freshly prepared daily'],
'f.inside': ['Plätze im Haus – für Familie und Feste', 'kişilik salon – aile ve davetler için', 'seats inside – for families and celebrations'],
'f.terrace': ['Plätze auf der Terrasse am See', 'kişilik göl kenarı teras', 'seats on the lakeside terrace'],
'f.since': ['seit diesem Jahr in Mechernich', 'yılından beri Mechernich’te', 'in Mechernich since this year'],
'h.kitchen': ['Aus unserer Küche', 'Mutfağımızdan', 'From our kitchen'],
'h.all': ['Zur ganzen Speisekarte', 'Tüm menüye git', 'See the full menu'],
'show.detail': ['Details ansehen', 'Ayrıntılar', 'View details'],
'h.cats': ['Worauf haben Sie Lust?', 'Canınız ne çekiyor?', 'What are you in the mood for?'],
'h.cats.s': ['Ein Klick führt direkt in die Karte', 'Tek tıkla doğrudan menüye', 'One click takes you straight to the menu'],
'bf.e': ['Jeden Tag', 'Her gün', 'Every day'],
'bf.h': ['Das Nirvana-Frühstücksbuffet', 'Nirvana açık büfe kahvaltı', 'The Nirvana breakfast buffet'],
'bf.p': ['Kalte und warme Spezialitäten, Börek, frisches Gemüse und Obst – so viel Sie möchten. Sonntags in zwei Runden um 9 und um 11 Uhr, am besten mit Reservierung.', 'Soğuk ve sıcak lezzetler, börekler, taze sebze ve meyve – dilediğiniz kadar. Pazar günleri 09:00 ve 11:00’de iki seans; rezervasyon önerilir.', 'Cold and warm specialities, börek, fresh vegetables and fruit – as much as you like. On Sundays in two sittings at 9 and 11 am, ideally with a reservation.'],
'bf.cta': ['Frühstück reservieren', 'Kahvaltı için yer ayırt', 'Book breakfast'],
'bf.a': ['Erwachsene', 'Yetişkin', 'Adults'],
'bf.k': ['Kinder 3–9 Jahre', 'Çocuk (3–9 yaş)', 'Children aged 3–9'],
'bf.l1': ['Kalte und warme Spezialitäten', 'Soğuk ve sıcak lezzetler', 'Cold and warm specialities'],
'bf.l2': ['Börek und frisches Gebäck', 'Börek ve taze hamur işleri', 'Börek and fresh pastries'],
'bf.l3': ['Frisches Gemüse und Obst', 'Taze sebze ve meyve', 'Fresh vegetables and fruit'],
'bf.l4': ['Sonntags um 09:00 und 11:00 Uhr', 'Pazar 09:00 ve 11:00', 'Sundays at 9:00 and 11:00'],
'nm.e': ['Für den ganzen Tisch', 'Bütün masa için', 'For the whole table'],
'h.more': ['Mehr als ein Restaurant', 'Bir restorandan fazlası', 'More than a restaurant'],
't1.e': ['Bis 275 Gäste', '275 misafire kadar', 'Up to 275 guests'],
't1.h': ['Feiern im Nirvana', 'Nirvana’da davetler', 'Celebrate at Nirvana'],
't1.p': ['Hochzeit, Verlobung, Geburtstag oder Firmenfeier – mit Menü, Deko und Saal am See.', 'Düğün, nişan, doğum günü veya şirket kutlaması – menü, süsleme ve göl kenarındaki salonumuzla.', 'Wedding, engagement, birthday or company party – with menu, decoration and a hall by the lake.'],
't2.e': ['Ab 10 Gästen', '10 kişiden itibaren', 'From 10 guests'],
't2.h': ['Catering', 'Catering', 'Catering'],
't2.p': ['Meze, Grill und Güveç aus unserer Küche – geliefert, aufgebaut, mit Preis auf einen Blick.', 'Mutfağımızdan meze, ızgara ve güveç – teslim, kurulum ve fiyat tek bakışta.', 'Meze, grill and güveç from our kitchen – delivered, set up, with the price at a glance.'],
't3.e': ['Für Familien', 'Aileler için', 'For families'],
't3.h': ['Nirvana Kids', 'Nirvana Kids', 'Nirvana Kids'],
't3.p': ['Kinderkarte, Kinder-Frühstück und Kindergeburtstag am See.', 'Çocuk menüsü, çocuk kahvaltısı ve göl kenarında doğum günü.', 'Kids’ menu, kids’ breakfast and birthday parties by the lake.'],
'x.h': ['Vertraute Gesichter. Ein neues Kapitel.', 'Tanıdık yüzler. Yeni bir sayfa.', 'Familiar faces. A new chapter.'],
'x.p': ['Seit 2019 schreiben wir mit Ihnen die Geschichte von Nirvana. Mit unserem neuen Restaurant Leonn in Köln-Mülheim beginnt ein neues Kapitel – mit demselben Team und derselben Herzlichkeit. Das Signaturgericht von Leonn gibt es auch bei uns:', '2019’dan beri Nirvana’nın hikâyesini sizlerle yazıyoruz. Köln-Mülheim’daki yeni restoranımız Leonn ile yeni bir sayfa açıyoruz – aynı ekip, aynı samimiyetle. Leonn’un imza lezzeti bizde de:', 'Since 2019 we have been writing the story of Nirvana with you. With our new restaurant Leonn in Cologne-Mülheim a new chapter begins – with the same team and the same warmth. Leonn’s signature dish is available here too:'],
'x.cgn': ['Leonn Restaurant · Bergisch Gladbacher Str. 261–263 · Köln-Mülheim', 'Leonn Restaurant · Bergisch Gladbacher Str. 261–263 · Köln-Mülheim', 'Leonn Restaurant · Bergisch Gladbacher Str. 261–263 · Cologne-Mülheim'],
'gift.e': ['Zum Verschenken', 'Hediye etmek için', 'A gift to give'],
'gift.short': ['Ein Frühstück oder ein Abend im Nirvana als Geschenk – mit Betrag nach Wahl und persönlicher Nachricht.', 'Nirvana’da bir kahvaltı ya da akşam yemeğini hediye edin; tutarı ve mesajı siz belirleyin.', 'A breakfast or an evening at Nirvana as a gift – with an amount of your choice and a personal message.'],
'gift.make': ['Gutschein gestalten', 'Hediye çeki hazırla', 'Design a gift card'],
'gift.card': ['Für einen schönen Tag im Nirvana', 'Nirvana’da güzel bir gün için', 'For a lovely day at Nirvana'],
'visit.h': ['Besuchen Sie uns', 'Bizi ziyaret edin', 'Visit us'],
'con.addr': ['Adresse', 'Adres', 'Address'],
'con.route': ['Route in Google Maps öffnen', 'Google Haritalar’da yol tarifi', 'Open route in Google Maps'],
'con.hours': ['Öffnungszeiten', 'Çalışma saatleri', 'Opening hours'],
'con.hv': ['Mo – Do 10:00 – 22:00<br>Fr – Sa 10:00 – 23:00<br>So 09:00 – 22:00', 'Pzt – Prş 10:00 – 22:00<br>Cum – Cmt 10:00 – 23:00<br>Pazar 09:00 – 22:00', 'Mon – Thu 10:00 – 22:00<br>Fri – Sat 10:00 – 23:00<br>Sun 09:00 – 22:00'],
'con.bf': ['Frühstücksbuffet jeden Tag', 'Açık büfe kahvaltı her gün', 'Breakfast buffet every day'],
'con.tel': ['Telefon', 'Telefon', 'Phone'],
'con.p': ['Haben Sie Fragen, Wünsche oder möchten Sie direkt telefonisch reservieren? Wir freuen uns auf Ihre Nachricht.', 'Sorunuz ya da isteğiniz mi var, telefonla rezervasyon mu yapmak istersiniz? Mesajınızı bekliyoruz.', 'Do you have questions or requests, or would you like to book by phone? We look forward to hearing from you.'],
'con.park': ['Parkplätze direkt am Haus, am See.', 'Göl kenarında, restoranın önünde otopark.', 'Parking right at the restaurant, by the lake.'],
'm.e': ['Türkische Küche · Mechernich', 'Türk mutfağı · Mechernich', 'Turkish cuisine · Mechernich'],
'm.h': ['Unsere <em>Speisekarte</em>', '<em>Menümüz</em>', 'Our <em>menu</em>'],
'm.p': ['Tippen Sie ein Gericht an, um es groß zu sehen. Mit „+“ legen Sie es in den Warenkorb – zum Abholen, Liefern oder als Merkliste für den Tisch.', 'Büyük görmek için bir yemeğe dokunun. “+” ile sepete ekleyin – gel al, eve servis ya da masanız için liste olarak.', 'Tap a dish to see it large. Use “+” to add it to your basket – for pick-up, delivery or as a list for your table.'],
'm.search': ['Gericht suchen', 'Yemek ara', 'Search dishes'],
'm.ph': ['Gericht suchen, z. B. Künefe', 'Yemek ara, örn. Künefe', 'Search dishes, e.g. Künefe'],
'fl.all': ['Alle', 'Hepsi', 'All'],
'fl.photo': ['Mit Foto', 'Fotoğraflı', 'With photo'],
'fl.veg': ['Vegetarisch', 'Vejetaryen', 'Vegetarian'],
'fl.hot': ['Scharf', 'Acılı', 'Spicy'],
'fl.u10': ['Unter 10 €', '10 € altı', 'Under 10 €'],
'm.quote': ['Hier wird mit Liebe und Herz gekocht – jeden Tag frisch. Unser Service berät Sie gern zu Allergenen und Zusatzstoffen.', 'Burada her gün sevgiyle ve taze pişiriyoruz. Alerjenler ve katkı maddeleri hakkında servis ekibimiz size memnuniyetle yardımcı olur.', 'We cook with love, fresh every day. Our staff will gladly advise you on allergens and additives.'],
'm.quote.s': ['Afiyet olsun', 'Afiyet olsun', 'Afiyet olsun'],
'm.fine': ['Die Abbildungen der Gerichte können vom Original abweichen. Informationen zu Zutaten, die Allergien auslösen können, erhalten Sie bei unserem Servicepersonal.', 'Görseller orijinalden farklı olabilir. Alerji yapabilecek içerikler hakkında bilgiyi servis ekibimizden alabilirsiniz.', 'Pictures may differ from the actual dishes. Ask our staff for information on ingredients that may cause allergies.'],
'ord.e': ['Abholen oder liefern lassen', 'Gel al veya eve servis', 'Pick-up or delivery'],
'ord.h': ['Online bestellen', 'Online sipariş', 'Order online'],
'ord.p': ['Stellen Sie Ihre Bestellung aus der Speisekarte zusammen, wählen Sie Abholung oder Lieferung und eine Uhrzeit. Bezahlt wird bei Abholung oder Lieferung.', 'Siparişinizi menüden oluşturun, gel al veya eve servis ve saati seçin. Ödeme teslimatta yapılır.', 'Put your order together from the menu, choose pick-up or delivery and a time. You pay on pick-up or delivery.'],
'ord.phone': ['Lieber telefonisch bestellen?', 'Telefonla mı sipariş vermek istersiniz?', 'Prefer to order by phone?'],
'res.e': ['Täglich ab 10 Uhr · sonntags ab 9 Uhr', 'Her gün 10:00’dan · pazar 09:00’dan', 'Daily from 10 am · Sundays from 9 am'],
'res.h': ['Tisch reservieren', 'Masa ayırt', 'Book a table'],
'res.p': ['Wählen Sie Personen, Bereich, Tag und Uhrzeit – Sie sehen sofort, was frei ist. Für Gruppen ab 10 Personen und Feiern melden wir uns persönlich.', 'Kişi sayısını, alanı, günü ve saati seçin – uygun yerleri hemen görürsünüz. 10 kişi ve üzeri gruplar ile davetler için sizinle bizzat iletişime geçeriz.', 'Choose guests, area, day and time – you see right away what is available. For groups of 10 or more and celebrations we get back to you personally.'],
'res.phone': ['Lieber telefonisch?', 'Telefonla mı tercih edersiniz?', 'Prefer to call?'],
'res.pers': ['Personen', 'Kişi sayısı', 'Guests'],
'res.where': ['Bereich', 'Alan', 'Area'],
'res.name': ['Name', 'Ad Soyad', 'Name'],
'res.tel': ['Telefon', 'Telefon', 'Phone'],
'res.mail': ['E-Mail für die Bestätigung', 'Onay için e-posta', 'Email for the confirmation'],
'res.note': ['Wunsch (optional)', 'Notunuz (isteğe bağlı)', 'Request (optional)'],
'res.occ': ['Anlass', 'Vesile', 'Occasion'],
'res.kids': ['Davon Kinder', 'Çocuk sayısı', 'Of which children'],
'res.chairs': ['Hochstühle', 'Mama sandalyesi', 'High chairs'],
'res.fine': ['Eine Reservierungsanfrage ist noch keine bestätigte Reservierung. Verbindlich wird sie erst mit unserer ausdrücklichen Bestätigung.', 'Rezervasyon talebi henüz onaylanmış bir rezervasyon değildir. Ancak tarafımızca açıkça onaylandığında kesinleşir.', 'A reservation request is not yet a confirmed reservation. It only becomes binding once we have explicitly confirmed it.'],
'tk.label': ['Reservierung', 'Rezervasyon', 'Reservation'],
'ar.r': ['Restaurant', 'Restoran', 'Restaurant'],
'ar.w': ['Wintergarten am See', 'Göl manzaralı kış bahçesi', 'Lakeside conservatory'],
'ar.t': ['Terrasse', 'Teras', 'Terrace'],
'ar.g': ['Gruppe & Feier', 'Grup & davet', 'Group & party'],
'ar.r.s': ['Im großen Gastraum, 1 bis {n} Personen', 'Ana salonda, 1–{n} kişi', 'In the main dining room, 1 to {n} guests'],
'ar.w.s': ['Mit Blick auf See und Wald, 1 bis {n} Personen', 'Göl ve orman manzaralı, 1–{n} kişi', 'Overlooking the lake and woods, 1 to {n} guests'],
'ar.t.s': ['Draußen am See, Mai bis September', 'Göl kenarında, Mayıs–Eylül', 'Outside by the lake, May to September'],
'ar.t.off': ['Die Terrasse ist von Mai bis September geöffnet.', 'Teras Mayıs–Eylül arası açıktır.', 'The terrace is open from May to September.'],
'ar.g.s': ['{a} bis {b} Personen, wir bestätigen persönlich', '{a}–{b} kişi, bizzat onaylarız', '{a} to {b} guests, confirmed personally'],
'rsv.s1': ['Personen & Bereich', 'Kişi & alan', 'Guests & area'],
'rsv.s2': ['Tag & Uhrzeit', 'Gün ve saat', 'Day & time'],
'rsv.s3': ['Ihre Daten', 'Bilgileriniz', 'Your details'],
'rsv.q1': ['Wie viele Personen kommen?', 'Kaç kişi geliyorsunuz?', 'How many guests are coming?'],
'rsv.more': ['Mehr Personen', 'Daha fazla', 'More guests'],
'rsv.area': ['Wo möchten Sie sitzen?', 'Nerede oturmak istersiniz?', 'Where would you like to sit?'],
'rsv.g.only': ['Ab {n} Personen nehmen wir Ihre Reservierung als Gruppenanfrage an und melden uns persönlich.', '{n} kişi ve üzeri rezervasyonlar grup talebi olarak alınır, sizinle bizzat iletişime geçeriz.', 'From {n} guests we take your booking as a group request and get back to you personally.'],
'rsv.big': ['Mehr als {n} Personen? Dann planen wir es als Feier mit Ihnen:', '{n} kişiden fazla mısınız? Davetinizi birlikte planlayalım:', 'More than {n} guests? Let’s plan it as a celebration:'],
'rsv.party': ['Feier anfragen', 'Davet talebi', 'Request a celebration'],
'rsv.next': ['Weiter', 'Devam', 'Continue'],
'rsv.back': ['Zurück', 'Geri', 'Back'],
'rsv.change': ['Ändern', 'Değiştir', 'Change'],
'rsv.q2': ['Wann möchten Sie kommen?', 'Ne zaman gelmek istersiniz?', 'When would you like to come?'],
'rsv.pick': ['Bitte wählen Sie zuerst einen Tag.', 'Lütfen önce bir gün seçin.', 'Please choose a day first.'],
'rsv.times': ['Freie Zeiten am {d}', '{d} için uygun saatler', 'Available times on {d}'],
'rsv.g1': ['Frühstück & Vormittag', 'Kahvaltı & öğleden önce', 'Breakfast & morning'],
'rsv.g2': ['Mittag & Nachmittag', 'Öğle ve öğleden sonra', 'Lunch & afternoon'],
'rsv.g3': ['Abend', 'Akşam', 'Evening'],
'rsv.free': ['frei', 'uygun', 'available'],
'rsv.few': ['wenige Plätze', 'az yer kaldı', 'few seats left'],
'rsv.full': ['ausgebucht', 'dolu', 'fully booked'],
'rsv.closed': ['geschlossen', 'kapalı', 'closed'],
'rsv.pm': ['Vorheriger Monat', 'Önceki ay', 'Previous month'],
'rsv.nm': ['Nächster Monat', 'Sonraki ay', 'Next month'],
'rsv.noslots': ['An diesem Tag ist online nichts mehr frei. Rufen Sie uns gern an:', 'Bu gün için çevrim içi yer kalmadı. Bizi arayabilirsiniz:', 'Nothing is available online on this day. Feel free to call us:'],
'rsv.sun': ['Sonntags-Frühstück in zwei Runden: 09:00 und 11:00 Uhr.', 'Pazar kahvaltısı iki seans: 09:00 ve 11:00.', 'Sunday breakfast in two sittings: 9:00 and 11:00.'],
'rsv.loading': ['Freie Zeiten werden geladen …', 'Uygun saatler yükleniyor …', 'Loading available times …'],
'rsv.off.h': ['Die Online-Reservierung ist gerade nicht erreichbar', 'Online rezervasyona şu anda ulaşılamıyor', 'Online booking is unavailable right now'],
'rsv.off.p': ['Es wurde nichts gespeichert. Bitte versuchen Sie es gleich noch einmal oder rufen Sie uns an:', 'Hiçbir şey kaydedilmedi. Lütfen birazdan tekrar deneyin veya bizi arayın:', 'Nothing has been saved. Please try again in a moment or call us:'],
'rsv.retry': ['Erneut versuchen', 'Tekrar dene', 'Try again'],
'rsv.q3': ['Auf welchen Namen dürfen wir reservieren?', 'Rezervasyonu hangi isme yapalım?', 'What name should we book under?'],
'rsv.consent': ['Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Reservierung gespeichert werden.', 'Bilgilerimin rezervasyonun işlenmesi için kaydedilmesini kabul ediyorum.', 'I agree that my details are stored in order to process the reservation.'],
'rsv.send': ['Reservierung anfragen', 'Rezervasyon talebi gönder', 'Request reservation'],
'rsv.send2': ['Jetzt reservieren', 'Şimdi rezerve et', 'Reserve now'],
'rsv.sending': ['Wird gesendet …', 'Gönderiliyor …', 'Sending …'],
'rsv.done.h': ['Ihre Anfrage ist eingegangen', 'Talebiniz bize ulaştı', 'We have received your request'],
'rsv.done.h2': ['Ihre Reservierung ist bestätigt', 'Rezervasyonunuz onaylandı', 'Your reservation is confirmed'],
'rsv.done.p': ['Wir prüfen Ihre Anfrage und melden uns per Telefon oder E-Mail. Den aktuellen Stand sehen Sie jederzeit oben auf dieser Seite.', 'Talebinizi inceleyip size telefon veya e-posta ile dönüş yapacağız. Güncel durumu her zaman bu sayfanın üst kısmında görebilirsiniz.', 'We will review your request and get back to you by phone or email. You can see the current status at the top of this page at any time.'],
'rsv.done.p2': ['Wir freuen uns auf Ihren Besuch. Ihre Reservierung finden Sie jederzeit oben auf dieser Seite.', 'Sizi ağırlamaktan mutluluk duyacağız. Rezervasyonunuzu her zaman bu sayfanın üst kısmında bulabilirsiniz.', 'We look forward to your visit. You can find your reservation at the top of this page at any time.'],
'rsv.code': ['Reservierungsnummer', 'Rezervasyon numarası', 'Reservation number'],
'rsv.st.pending': ['Angefragt', 'Talep edildi', 'Requested'],
'rsv.st.confirmed': ['Bestätigt', 'Onaylandı', 'Confirmed'],
'rsv.st.declined': ['Leider nicht möglich', 'Maalesef mümkün değil', 'Unfortunately not possible'],
'rsv.st.cancelled': ['Storniert', 'İptal edildi', 'Cancelled'],
'rsv.st.done': ['Danke für Ihren Besuch', 'Ziyaretiniz için teşekkürler', 'Thank you for your visit'],
'rsv.st.gone': ['Abgelaufen', 'Süresi doldu', 'Expired'],
'rsv.mine': ['Ihre Reservierung', 'Rezervasyonunuz', 'Your reservation'],
'rsv.cancel': ['Stornieren', 'İptal et', 'Cancel'],
'rsv.cancel.q': ['Reservierung wirklich stornieren?', 'Rezervasyon iptal edilsin mi?', 'Really cancel this reservation?'],
'rsv.yes': ['Ja, stornieren', 'Evet, iptal et', 'Yes, cancel'],
'rsv.no': ['Nein', 'Hayır', 'No'],
'rsv.new': ['Weitere Reservierung', 'Yeni rezervasyon', 'Another reservation'],
'rsv.cal': ['In Kalender eintragen', 'Takvime ekle', 'Add to calendar'],
'rsv.refresh': ['Stand aktualisieren', 'Durumu güncelle', 'Refresh status'],
'rsv.test': ['Testbetrieb: Dieses Reservierungssystem wird gerade erprobt. Eine Reservierung hier gilt noch nicht. Bitte reservieren Sie bis dahin telefonisch.', 'Test aşaması: Bu rezervasyon sistemi şu anda deneniyor. Buradan yapılan rezervasyon henüz geçerli değildir. Lütfen şimdilik telefonla rezervasyon yapın.', 'Trial run: this reservation system is being tested. A reservation made here is not valid yet. Until then, please book by phone.'],
'rsv.demo': ['Vorführ-Modus: Diese Vorschau ist noch nicht mit dem Restaurant verbunden. Eingaben bleiben nur auf diesem Gerät.', 'Tanıtım modu: Bu önizleme henüz restorana bağlı değil. Girdiler yalnızca bu cihazda kalır.', 'Demo mode: this preview is not yet connected to the restaurant. Entries stay on this device only.'],
'rsv.err.full': ['Diese Zeit ist gerade vergeben worden. Bitte wählen Sie eine andere.', 'Bu saat az önce doldu. Lütfen başka bir saat seçin.', 'This time has just been taken. Please choose another one.'],
'rsv.err.rate': ['Zu viele Anfragen. Bitte versuchen Sie es später noch einmal oder rufen Sie uns an.', 'Çok fazla talep. Lütfen daha sonra tekrar deneyin veya bizi arayın.', 'Too many requests. Please try again later or call us.'],
'rsv.err.net': ['Das hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal.', 'Şu anda olmadı. Lütfen tekrar deneyin.', 'That did not work just now. Please try again.'],
'occ.none': ['Kein besonderer Anlass', 'Özel bir vesile yok', 'No special occasion'],
'occ.bday': ['Geburtstag', 'Doğum günü', 'Birthday'],
'occ.kbday': ['Kindergeburtstag', 'Çocuk doğum günü', 'Children’s birthday'],
'occ.anniv': ['Jubiläum / Jahrestag', 'Yıl dönümü', 'Anniversary'],
'occ.biz': ['Geschäftsessen', 'İş yemeği', 'Business meal'],
'occ.wed': ['Hochzeit', 'Düğün', 'Wedding'],
'occ.eng': ['Verlobung', 'Nişan', 'Engagement'],
'occ.henna': ['Henna-Abend', 'Kına gecesi', 'Henna night'],
'occ.comp': ['Firmenfeier', 'Şirket kutlaması', 'Company party'],
'occ.xmas': ['Weihnachts- & Jahresabschlussfeier', 'Yılbaşı / yıl sonu kutlaması', 'Christmas & year-end party'],
'occ.family': ['Familienfeier', 'Aile kutlaması', 'Family celebration'],
'occ.other': ['Sonstiges', 'Diğer', 'Other'],
'gift.h': ['Gutschein verschenken', 'Hediye çeki gönderin', 'Give a gift card'],
'gift.p': ['Schenken Sie ein Frühstück am See oder einen Abend mit Freunden.', 'Göl kenarında bir kahvaltı ya da dostlarla bir akşam hediye edin.', 'Give a breakfast by the lake or an evening with friends.'],
'gift.1': ['Betrag wählen', 'Tutar seçin', 'Choose an amount'],
'gift.2': ['Persönliche Daten', 'Kişisel bilgiler', 'Personal details'],
'gift.3': ['Zahlung', 'Ödeme', 'Payment'],
'gift.own': ['Eigener Betrag (€)', 'Özel tutar (€)', 'Custom amount (€)'],
'gift.for': ['Für wen ist der Gutschein?', 'Hediye çeki kimin için?', 'Who is the gift card for?'],
'gift.from': ['Ihr Name', 'Adınız', 'Your name'],
'gift.msg': ['Persönliche Nachricht (optional)', 'Kişisel mesaj (isteğe bağlı)', 'Personal message (optional)'],
'gift.pay': ['Die Zahlung erfolgt sicher im nächsten Schritt. Zur Auswahl stehen PayPal, Klarna und Kreditkarte.', 'Ödeme bir sonraki adımda güvenle yapılır. PayPal, Klarna ve kredi kartı seçenekleri mevcuttur.', 'Payment is made securely in the next step. You can choose between PayPal, Klarna and credit card.'],
'gift.terms': ['Gutscheine sind ab Ausstellungsdatum drei Jahre gültig. Ein Restguthaben bleibt erhalten, eine Barauszahlung ist nicht möglich.', 'Hediye çekleri düzenlenme tarihinden itibaren üç yıl geçerlidir. Kalan bakiye korunur, nakde çevrilemez.', 'Gift cards are valid for three years from the date of issue. Any remaining balance is kept; cash payouts are not possible.'],
'about.w': ['Herzlich willkommen', 'Hoş geldiniz', 'A warm welcome'],
'about.1': ['Das Nirvana in Mechernich-Kommern ist ein türkisches Restaurant und Café. Jeden Tag bieten wir ein Frühstück mit vielen verschiedenen Sorten und à la carte mehr als 70 Gerichte der türkischen Küche. Hier wird mit Liebe und Herz gekocht.', 'Mechernich-Kommern’deki Nirvana bir Türk restoranı ve kafesidir. Her gün birçok çeşitle kahvaltı ve alakart olarak 70’ten fazla Türk yemeği sunuyoruz. Burada sevgiyle ve gönülden pişiriyoruz.', 'Nirvana in Mechernich-Kommern is a Turkish restaurant and café. Every day we serve a breakfast with a wide variety and more than 70 dishes of Turkish cuisine à la carte. We cook here with love and heart.'],
'about.2': ['Unsere Speisen werden immer frisch und täglich zubereitet. Qualität und Frische sind uns wichtig – wir möchten Ihnen nur das Beste servieren. Erleben Sie türkische Gastfreundschaft und einen Service, bei dem Ihre Wünsche zählen.', 'Yemeklerimiz her gün taze hazırlanır. Kalite ve tazelik bizim için önemlidir – size yalnızca en iyisini sunmak istiyoruz. Türk misafirperverliğini ve isteklerinizin önemsendiği bir hizmeti yaşayın.', 'Our dishes are always freshly prepared every day. Quality and freshness matter to us – we only want to serve you the best. Experience Turkish hospitality and a service where your wishes count.'],
'about.3': ['Wir sind ein allergikerfreundliches Restaurant. Unsere Servicekräfte informieren Sie gern über die Allergene in unseren Speisen und beraten Sie ganz individuell.', 'Alerjisi olan misafirlerimize özen gösteren bir restoranız. Servis ekibimiz yemeklerimizdeki alerjenler hakkında sizi memnuniyetle bilgilendirir.', 'We are an allergy-friendly restaurant. Our staff will gladly inform you about the allergens in our dishes and advise you individually.'],
'about.5': ['Wir freuen uns, Sie oft als Gast begrüßen zu dürfen. Afiyet olsun.', 'Sizi sık sık misafir etmekten mutluluk duyarız. Afiyet olsun.', 'We look forward to welcoming you often. Afiyet olsun.'],
'legal.hint': ['Die Rechtstexte stehen auf Deutsch.', 'Yasal metinler Almancadır.', 'The legal texts are in German.'],
'ft.more': ['Mehr', 'Diğer', 'More'],
'ft.privacy': ['Datenschutz', 'Gizlilik', 'Privacy'],
'ft.family': ['Ein Team, zwei Häuser: Mechernich und Köln-Mülheim', 'Tek ekip, iki restoran: Mechernich ve Köln-Mülheim', 'One team, two houses: Mechernich and Cologne-Mülheim'],
'ft.note': ['Interne Vorschau von XenoSmart für das Nirvana Restaurant. Diese Seite ist nicht die offizielle Website; im Vorführ-Modus wird nichts bestellt, gebucht oder gesendet.', 'Nirvana Restaurant için XenoSmart tarafından hazırlanan dahili önizleme. Bu sayfa resmi site değildir; tanıtım modunda hiçbir sipariş, rezervasyon veya gönderim yapılmaz.', 'Internal preview by XenoSmart for Nirvana Restaurant. This page is not the official website; in demo mode nothing is ordered, booked or sent.'],
'dock.call': ['Anrufen', 'Ara', 'Call'],
'dock.route': ['Route', 'Yol tarifi', 'Route'],
'tb.title': ['Warenkorb', 'Sepet', 'Basket'],
'tb.sum': ['Summe laut Karte', 'Menüye göre toplam', 'Total per menu'],
'tb.hint': ['Bestellen Sie zum Abholen oder Liefern – oder zeigen Sie die Liste im Restaurant.', 'Gel al veya eve servis için sipariş verin – ya da listeyi restoranda gösterin.', 'Order for pick-up or delivery – or show the list in the restaurant.'],
'tb.order': ['Zur Bestellung', 'Siparişe geç', 'Go to order'],
'tb.clear': ['Warenkorb leeren', 'Sepeti boşalt', 'Clear basket'],
/* Bestellung */
'ord.s1': ['Warenkorb', 'Sepet', 'Basket'],
'ord.s2': ['Abholung oder Lieferung', 'Gel al veya servis', 'Pick-up or delivery'],
'ord.s3': ['Ihre Daten', 'Bilgileriniz', 'Your details'],
'ord.q1': ['Was dürfen wir für Sie zubereiten?', 'Sizin için ne hazırlayalım?', 'What may we prepare for you?'],
'ord.empty': ['Ihr Warenkorb ist noch leer. Wählen Sie Ihre Gerichte in der Speisekarte mit „+“.', 'Sepetiniz henüz boş. Menüden “+” ile yemeklerinizi seçin.', 'Your basket is still empty. Choose your dishes in the menu with “+”.'],
'ord.tomenu': ['Zur Speisekarte', 'Menüye git', 'Go to the menu'],
'ord.more': ['Weitere Gerichte hinzufügen', 'Başka yemek ekle', 'Add more dishes'],
'ord.inhouse': ['Nur im Restaurant – nicht bestellbar:', 'Sadece restoranda – sipariş edilemez:', 'Only in the restaurant – cannot be ordered:'],
'ord.q2': ['Wie möchten Sie Ihre Bestellung erhalten?', 'Siparişinizi nasıl almak istersiniz?', 'How would you like to receive your order?'],
'ord.pickup': ['Abholung', 'Gel al', 'Pick-up'],
'ord.pickup.s': ['Im Restaurant am Ernst-Becker-Weg 1', 'Restoranımızdan, Ernst-Becker-Weg 1', 'At the restaurant, Ernst-Becker-Weg 1'],
'ord.delivery': ['Lieferung', 'Eve servis', 'Delivery'],
'ord.delivery.s': ['Mechernich und Umgebung', 'Mechernich ve çevresi', 'Mechernich and surroundings'],
'ord.zip': ['Postleitzahl', 'Posta kodu', 'Postcode'],
'ord.zip.q': ['Liefern wir zu Ihnen? Postleitzahl eingeben:', 'Size servis var mı? Posta kodunu girin:', 'Do we deliver to you? Enter your postcode:'],
'ord.zip.ok': ['Wir liefern nach {n}: Mindestbestellwert {m}, Liefergebühr {f}.', '{n} bölgesine servis var: en az sipariş {m}, servis ücreti {f}.', 'We deliver to {n}: minimum order {m}, delivery fee {f}.'],
'ord.zip.no': ['Diese Postleitzahl liegt leider außerhalb unseres Liefergebiets. Gern können Sie abholen.', 'Bu posta kodu maalesef servis alanımızın dışında. Gel al seçeneğini kullanabilirsiniz.', 'Unfortunately this postcode is outside our delivery area. You are welcome to pick up.'],
'ord.min': ['Für die Lieferung fehlen noch {x} bis zum Mindestbestellwert.', 'Servis için en az sipariş tutarına {x} kaldı.', '{x} more needed to reach the minimum order for delivery.'],
'ord.when': ['Wann?', 'Ne zaman?', 'When?'],
'ord.asap': ['So schnell wie möglich', 'Mümkün olan en kısa sürede', 'As soon as possible'],
'ord.asap.s': ['ca. {n} Minuten', 'yaklaşık {n} dakika', 'about {n} minutes'],
'ord.later': ['Zu einer Wunschzeit', 'İstediğim saatte', 'At a chosen time'],
'ord.today': ['Heute', 'Bugün', 'Today'],
'ord.tomorrow': ['Morgen', 'Yarın', 'Tomorrow'],
'ord.closed': ['Heute nehmen wir online keine Bestellungen mehr an. Wählen Sie gern eine Zeit für morgen.', 'Bugün artık çevrim içi sipariş alamıyoruz. Yarın için bir saat seçebilirsiniz.', 'We are no longer taking online orders today. Feel free to choose a time tomorrow.'],
'ord.q3': ['Fast geschafft – Ihre Kontaktdaten', 'Neredeyse bitti – iletişim bilgileriniz', 'Almost done – your contact details'],
'ord.street': ['Straße und Hausnummer', 'Sokak ve kapı no', 'Street and house number'],
'ord.city': ['Ort', 'Şehir / semt', 'Town'],
'ord.mail': ['E-Mail (optional, für die Bestätigung)', 'E-posta (isteğe bağlı, onay için)', 'Email (optional, for the confirmation)'],
'ord.note': ['Hinweise zur Bestellung, Allergien (optional)', 'Sipariş notu, alerjiler (isteğe bağlı)', 'Notes on your order, allergies (optional)'],
'ord.pay': ['Bezahlung', 'Ödeme', 'Payment'],
'ord.pay.bar': ['Bar', 'Nakit', 'Cash'],
'ord.pay.karte': ['Karte (EC oder Kreditkarte)', 'Kart (banka veya kredi kartı)', 'Card (debit or credit)'],
'ord.pay.s': ['Bezahlt wird bei Abholung bzw. Lieferung.', 'Ödeme teslimatta yapılır.', 'You pay on pick-up or delivery.'],
'ord.consent': ['Ich bin einverstanden, dass meine Angaben zur Abwicklung der Bestellung gespeichert werden.', 'Bilgilerimin siparişin işlenmesi için kaydedilmesini kabul ediyorum.', 'I agree that my details are stored in order to process the order.'],
'ord.send': ['Zahlungspflichtig bestellen', 'Siparişi onayla (ödemeli)', 'Place order (payment due)'],
'ord.send.demo': ['Bestellung abschicken (Vorführung)', 'Siparişi gönder (tanıtım)', 'Send order (demo)'],
'ord.done.h': ['Danke! Ihre Bestellung ist eingegangen.', 'Teşekkürler! Siparişiniz bize ulaştı.', 'Thank you! Your order has been received.'],
'ord.done.demo': ['Vorführung: Im echten Betrieb bestätigt das Restaurant jetzt per SMS oder E-Mail. In dieser Vorschau wurde nichts gesendet.', 'Tanıtım: Gerçek kullanımda restoran şimdi SMS veya e-posta ile onaylar. Bu önizlemede hiçbir şey gönderilmedi.', 'Demo: in real operation the restaurant now confirms by text message or email. Nothing was sent in this preview.'],
'ord.done.p': ['Wir bereiten alles frisch zu. Bei Fragen rufen wir Sie unter der angegebenen Nummer an.', 'Her şeyi taze hazırlıyoruz. Bir sorumuz olursa verdiğiniz numaradan sizi ararız.', 'We are preparing everything fresh. If we have any questions we will call you on the number you gave.'],
'ord.code': ['Bestellnummer', 'Sipariş numarası', 'Order number'],
'ord.copy': ['Als Text kopieren', 'Metin olarak kopyala', 'Copy as text'],
'ord.copied': ['Kopiert', 'Kopyalandı', 'Copied'],
'ord.new': ['Neue Bestellung', 'Yeni sipariş', 'New order'],
'ord.wa': ['Per WhatsApp senden', 'WhatsApp ile gönder', 'Send via WhatsApp'],
'ord.mailto': ['Per E-Mail senden', 'E-posta ile gönder', 'Send by email'],
'ord.sub': ['Zwischensumme', 'Ara toplam', 'Subtotal'],
'ord.fee': ['Liefergebühr', 'Servis ücreti', 'Delivery fee'],
'ord.total': ['Gesamt', 'Toplam', 'Total'],
'ord.bon.h': ['Ihre Bestellung', 'Siparişiniz', 'Your order'],
'ord.bon.e': ['Noch keine Gerichte gewählt', 'Henüz yemek seçilmedi', 'No dishes chosen yet'],
'ord.at': ['um', 'saat', 'at'],
/* Anfragen (Feier, Kindergeburtstag) */
'rq.date': ['Wunschtermin', 'İstenen tarih', 'Preferred date'],
'rq.time': ['Uhrzeit', 'Saat', 'Time'],
'rq.guests': ['Anzahl Gäste', 'Misafir sayısı', 'Number of guests'],
'rq.kids': ['Anzahl Kinder', 'Çocuk sayısı', 'Number of children'],
'rq.age': ['Alter des Geburtstagskindes', 'Doğum günü çocuğunun yaşı', 'Age of the birthday child'],
'rq.occ': ['Anlass', 'Vesile', 'Occasion'],
'rq.pkg': ['Paket', 'Paket', 'Package'],
'rq.pkg.open': ['Noch offen – bitte beraten', 'Henüz karar vermedim – lütfen önerin', 'Not sure yet – please advise'],
'rq.deko': ['Wir wünschen Deko (Blumenbogen, Tischdeko)', 'Süsleme istiyoruz (çiçek kemeri, masa süsü)', 'We would like decoration (flower arch, table decor)'],
'rq.name': ['Ihr Name', 'Adınız', 'Your name'],
'rq.tel': ['Telefon oder WhatsApp', 'Telefon veya WhatsApp', 'Phone or WhatsApp'],
'rq.mail': ['E-Mail (optional)', 'E-posta (isteğe bağlı)', 'Email (optional)'],
'rq.msg': ['Ihre Wünsche, Allergien, Fragen (optional)', 'İstekleriniz, alerjiler, sorular (isteğe bağlı)', 'Your wishes, allergies, questions (optional)'],
'rq.consent': ['Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden.', 'Bilgilerimin talebin işlenmesi için kaydedilmesini kabul ediyorum.', 'I agree that my details are stored in order to process the request.'],
'rq.send': ['Anfrage senden', 'Talep gönder', 'Send request'],
'rq.done': ['Danke, {n}! Ihre Anfrage ist notiert. Wir melden uns innerhalb eines Werktags.', 'Teşekkürler {n}! Talebiniz alındı. Bir iş günü içinde size dönüş yapacağız.', 'Thank you, {n}! Your request has been noted. We will get back to you within one working day.'],
'rq.demo': ['Vorführung: In dieser Vorschau wurde nichts gesendet.', 'Tanıtım: Bu önizlemede hiçbir şey gönderilmedi.', 'Demo: nothing was sent in this preview.'],
'rq.lead': ['Frühestens in {n} Tagen', 'En erken {n} gün sonra', 'At the earliest in {n} days'],
'rq.h.feier': ['Feier-Anfrage', 'Davet talebi', 'Celebration request'],
'rq.h.kids': ['Kindergeburtstag', 'Çocuk doğum günü', 'Children’s birthday'],
/* Feiern */
'ev.e': ['Hochzeit · Verlobung · Geburtstag · Firmenfeier', 'Düğün · Nişan · Doğum günü · Şirket kutlaması', 'Wedding · Engagement · Birthday · Company party'],
'ev.h': ['Feiern im <em>Nirvana</em>', 'Nirvana’da <em>davetler</em>', 'Celebrate at <em>Nirvana</em>'],
'ev.p': ['Lange Tafeln, Blumenbögen und ein Saal mit Blick ins Grüne: Bei uns feiern Sie mit bis zu 275 Gästen. Wir kümmern uns um Menü, Deko und Ablauf – Sie um Ihre Gäste.', 'Uzun sofralar, çiçek kemerleri ve yeşil manzaralı bir salon: 275 misafire kadar davetleriniz için. Menü, süsleme ve organizasyonu biz üstleniyoruz – siz misafirlerinizle ilgilenin.', 'Long tables, flower arches and a hall with a view of the green: celebrate with up to 275 guests. We take care of the menu, decoration and flow – you take care of your guests.'],
'ev.f1': ['Gäste im Haus', 'Salonda misafir', 'Guests inside'],
'ev.f2': ['Terrasse am See', 'Göl kenarı teras', 'Lakeside terrace'],
'ev.f3': ['Festmenü ab', 'Davet menüsü', 'Set menu from'],
'ev.f4': ['Parkplätze', 'Otopark', 'Parking'],
'ev.f4v': ['am Haus', 'restoranın önünde', 'on site'],
'ev.cta': ['Feier anfragen', 'Davet talebi', 'Request a celebration'],
'ev.cat': ['Lieber Catering?', 'Catering mi istersiniz?', 'Prefer catering?'],
'ev.pk.h': ['Festmenüs pro Person', 'Kişi başı davet menüleri', 'Set menus per person'],
'ev.pk.s': ['Alle Pakete mit hausgemachtem Ballonbrot, Çay und Türk Kahvesi', 'Tüm paketlerde ev yapımı balon ekmek, çay ve Türk kahvesi', 'All packages with homemade balloon bread, çay and Turkish coffee'],
'ev.gal': ['So feiern unsere Gäste', 'Misafirlerimizin davetlerinden', 'How our guests celebrate'],
'ev.f.e': ['Unverbindlich', 'Bağlayıcı değildir', 'No obligation'],
'ev.f.h': ['Feier anfragen', 'Davet talebi', 'Request a celebration'],
'ev.f.p': ['Erzählen Sie uns kurz von Ihrer Feier. Wir melden uns innerhalb eines Werktags mit einem Vorschlag.', 'Bize davetinizden kısaca bahsedin. Bir iş günü içinde önerimizle size dönelim.', 'Tell us briefly about your celebration. We will get back to you within one working day with a proposal.'],
'ev.pp': ['pro Person', 'kişi başı', 'per person'],
'ev.from': ['ab {n} Gästen', '{n} kişiden itibaren', 'from {n} guests'],
'ev.choose': ['Dieses Menü anfragen', 'Bu menüyü iste', 'Request this menu'],
'prop': ['Vorschlag', 'Öneri', 'Proposal'],
/* Kids */
'k.e': ['Für die Kleinen', 'Küçükler için', 'For the little ones'],
'k.p': ['Bei uns sind Familien zu Hause: Kinder-Frühstücksbuffet, eine eigene Kinderkarte und Kindergeburtstage am See.', 'Aileler bizde kendini evinde hisseder: çocuk kahvaltısı, çocuk menüsü ve göl kenarında doğum günleri.', 'Families feel at home here: kids’ breakfast buffet, a kids’ menu and birthday parties by the lake.'],
'k.menu': ['Kinderkarte', 'Çocuk menüsü', 'Kids’ menu'],
'k.fam.h': ['Damit sich Familien wohlfühlen', 'Aileler kendini rahat hissetsin diye', 'So that families feel at home'],
'k.fam.s': ['Neu geplant – bitte vom Restaurant bestätigen', 'Yeni planlandı – restoran tarafından onaylanmalı', 'Newly planned – to be confirmed by the restaurant'],
'k.bd.h': ['Kindergeburtstag im Nirvana', 'Nirvana’da çocuk doğum günü', 'Children’s birthday at Nirvana'],
'k.bd.s': ['2 Stunden Feiern, Essen und Überraschung – Eltern bestellen à la carte', '2 saat eğlence, yemek ve sürpriz – ebeveynler alakart sipariş verir', '2 hours of party, food and surprises – parents order à la carte'],
'k.f.e': ['Unverbindlich anfragen', 'Bağlayıcı olmadan sorun', 'Enquire without obligation'],
'k.f.h': ['Kindergeburtstag anfragen', 'Çocuk doğum günü talebi', 'Request a children’s birthday'],
'k.f.p': ['Wunschtermin, Anzahl der Kinder und Paket – wir bestätigen innerhalb eines Werktags.', 'İstenen tarih, çocuk sayısı ve paket – bir iş günü içinde onaylarız.', 'Preferred date, number of children and package – we confirm within one working day.'],
'k.per': ['pro Kind', 'çocuk başı', 'per child'],
'k.min': ['ab {n} Kindern', '{n} çocuktan itibaren', 'from {n} children'],
/* nur im Skript verwendet */
'add': ['Hinzufügen', 'Ekle', 'Add'],
'added': ['Im Warenkorb', 'Sepette', 'In basket'],
'inhouse': ['Nur im Restaurant', 'Sadece restoranda', 'In the restaurant only'],
'found': ['Treffer', 'sonuç', 'results'],
'none': ['Kein Gericht gefunden. Bitte anders suchen.', 'Sonuç bulunamadı. Lütfen başka bir arama deneyin.', 'No dish found. Please try a different search.'],
'open': ['Jetzt geöffnet · bis {t} Uhr', 'Şu an açık · {t}’e kadar', 'Open now · until {t}'],
'closed': ['Geschlossen · öffnet {d} um {t} Uhr', 'Kapalı · {d} {t}’de açılır', 'Closed · opens {d} at {t}'],
'day.today': ['heute', 'bugün', 'today'],
'day.tomorrow': ['morgen', 'yarın', 'tomorrow'],
'pp': ['pro Person', 'kişi başı', 'per person'],
'empty': ['Noch nichts im Warenkorb. Tippen Sie bei einem Gericht auf „+“.', 'Sepetiniz boş. Bir yemekte “+”ya dokunun.', 'Your basket is empty. Tap “+” on a dish.'],
'pay': ['Weiter zur Zahlung', 'Ödemeye geç', 'Continue to payment'],
'pers1': ['Person', 'kişi', 'guest'],
'persN': ['Personen', 'kişi', 'guests'],
'demoG': ['Vorschau: Auf der echten Seite beginnt hier die Zahlung. In dieser Vorschau wird nichts bestellt.', 'Önizleme: Gerçek sitede ödeme burada başlar. Bu önizlemede sipariş verilmez.', 'Preview: on the real site payment starts here. Nothing is ordered in this preview.'],
'need': ['Bitte füllen Sie die markierten Felder aus.', 'Lütfen işaretli alanları doldurun.', 'Please fill in the highlighted fields.'],
'for_': ['Für', 'Kime:', 'For'],
'from_': ['von', 'Gönderen:', 'from'],
'hot': ['Scharf', 'Acılı', 'Spicy'],
'mild': ['Leicht scharf', 'Hafif acılı', 'Mildly spicy'],
'veg': ['Vegetarisch', 'Vejetaryen', 'Vegetarian'],
'kidtag': ['Für Kinder', 'Çocuklar için', 'For kids'],
'rec': ['Empfehlung des Hauses', 'Evin önerisi', 'House recommendation'],
'bfph': ['Unser Frühstücksbuffet', 'Kahvaltı büfemiz', 'Our breakfast buffet'],
'dishes': ['Gerichte', 'çeşit', 'dishes'],
'daily': ['jeden Tag', 'her gün', 'every day'],
'clock': [' Uhr', '', ''],
'prev': ['Vorheriges Gericht', 'Önceki yemek', 'Previous dish'],
'next': ['Nächstes Gericht', 'Sonraki yemek', 'Next dish'],
'close': ['Schließen', 'Kapat', 'Close'],
'pauseV': ['Bilder anhalten', 'Görselleri durdur', 'Pause pictures'],
'playV': ['Bilder abspielen', 'Görselleri oynat', 'Play pictures'],
'menuBtn': ['Menü', 'Menü', 'Menu'],
'totop': ['Nach oben', 'Yukarı', 'Back to top'],
'amount': ['Betrag', 'Tutar', 'Amount'],
'reserve': ['Reservieren', 'Rezervasyon', 'Book'],
'photo': ['Foto', 'Fotoğraf', 'Photo']
};
/* Abschnittstitel und Hinweise: [TR-Titel, TR-Hinweis, EN-Titel, EN-Hinweis] – Deutsch kommt aus den Originaldaten */
var SEC = window.NIRVANA_SECTX || {};
var GROUPS = [
{ id: 'g1', n: ['Frühstück', 'Kahvaltı', 'Breakfast'], s: ['fruhstuck'] },
{ id: 'g2', n: ['Suppen & Salate', 'Çorba & Salata', 'Soups & Salads'], s: ['suppen', 'salate'] },
{ id: 'g3', n: ['Vorspeisen', 'Başlangıçlar', 'Starters'], s: ['vorspeisen', 'warme-vorspeisen'] },
{ id: 'g4', n: ['Grill & Steak', 'Izgara & Steak', 'Grill & Steak'], s: ['grill', 'filets', 'exclusive'] },
{ id: 'g5', n: ['Güveç & Pfanne', 'Güveç & Tava', 'Güveç & Pan'], s: ['chefkoch', 'pfannen'] },
{ id: 'g6', n: ['Menüs für 2–4', '2–4 kişilik menüler', 'Menus for 2–4'], s: ['nirvana-menu', 'kuzu-cevirme'] },
{ id: 'g7', n: ['Fisch', 'Balık', 'Fish'], s: ['fisch'] },
{ id: 'g8', n: ['Desserts', 'Tatlılar', 'Desserts'], s: ['desserts'] },
{ id: 'g9', n: ['Kinder', 'Çocuk', 'Kids'], s: ['kinder'] },
{ id: 'g10', n: ['Getränke', 'İçecekler', 'Drinks'], s: ['kalte-getraenke', 'warme-getraenke'] }
];
/* Festmenüs (Feiern im Haus) – Preise sind Vorschläge */
var EV_PKGS = [
{ id: 'e1', p: 29, min: 20, img: 'karisik-izgara', n: ['Meze & Grill', 'Meze & Izgara', 'Meze & Grill'],
  d: [['Meze-Auswahl mit Haydari und Ezme', 'Çoban Salatası', 'Karışık Izgara mit Reis', 'Baklava'], ['Haydari ve ezmeli meze seçkisi', 'Çoban salatası', 'Pilavlı karışık ızgara', 'Baklava'], ['Meze selection with haydari and ezme', 'Shepherd’s salad', 'Mixed grill with rice', 'Baklava']] },
{ id: 'e2', p: 39, min: 30, img: 'nirvana-spesiyal', n: ['Festmenü Nirvana', 'Nirvana davet menüsü', 'Nirvana feast'],
  d: [['Sıcak Soğuk Meze Tabağı', 'Gavurdağı Salatası', 'Nirvana Spesiyal mit Reis und Grillgemüse', 'Künefe'], ['Sıcak soğuk meze tabağı', 'Gavurdağı salatası', 'Pilav ve ızgara sebzeli Nirvana spesiyal', 'Künefe'], ['Hot & cold meze platter', 'Gavurdağı salad', 'Nirvana special with rice and grilled vegetables', 'Künefe']] },
{ id: 'e3', p: 49, min: 40, img: 'kuzu-cevirme', n: ['Festtafel mit Leonn Kuzu Çevirme', 'Leonn Kuzu Çevirme’li davet sofrası', 'Feast with Leonn Kuzu Çevirme'],
  d: [['Meze, İçli Köfte und Kalem Böreği', 'Lamm vom Spieß mit Butter-Drillingen und Ege-Turşusu', 'Söğüş und Reis', 'Künefe und Baklava'], ['Meze, içli köfte ve kalem böreği', 'Tereyağlı mini patates ve Ege turşusu ile kuzu çevirme', 'Söğüş ve pilav', 'Künefe ve baklava'], ['Meze, stuffed bulgur dumplings and cheese rolls', 'Spit-roasted lamb with buttered potatoes and Aegean pickles', 'Fresh vegetable plate and rice', 'Künefe and baklava']] },
{ id: 'e4', p: 24, min: 20, img: 'kahvalti-buffet', n: ['Frühstücks-Feier', 'Kahvaltılı davet', 'Breakfast party'],
  d: [['Frühstücksbuffet für Ihre Gruppe', 'Menemen und Sucuklu Yumurta', 'Çay so viel Sie möchten', 'Ideal für Henna-Abend am Vormittag, Taufe oder Geburtstag'], ['Grubunuz için açık büfe kahvaltı', 'Menemen ve sucuklu yumurta', 'Sınırsız çay', 'Gündüz kına, vaftiz veya doğum günü için ideal'], ['Breakfast buffet for your group', 'Menemen and eggs with sucuk', 'Çay as much as you like', 'Ideal for a morning henna party, christening or birthday']] }
];
var EV_OCC = ['occ.wed', 'occ.eng', 'occ.henna', 'occ.bday', 'occ.family', 'occ.comp', 'occ.xmas', 'occ.other'];
/* Kids: Familien-Ausstattung (Vorschläge) und Geburtstags-Pakete (Vorschläge) */
var K_FAM = [
{ i: 'person', n: ['Hochstühle', 'Mama sandalyeleri', 'High chairs'], d: ['Genug für jede Familie – bei der Reservierung einfach angeben.', 'Her aileye yetecek kadar – rezervasyonda belirtmeniz yeterli.', 'Enough for every family – just mention it when booking.'] },
{ i: 'gift', n: ['Malset zum Tisch', 'Masaya boyama seti', 'Colouring set'], d: ['Ausmalkarte und Buntstifte, sobald Kinder Platz nehmen.', 'Çocuklar oturur oturmaz boyama kartı ve kalemler.', 'Colouring card and crayons as soon as children sit down.'] },
{ i: 'star', n: ['Kinderessen zuerst', 'Önce çocukların yemeği', 'Kids’ food first'], d: ['Die Kinderteller kommen vor den Erwachsenen – ohne Scharfes.', 'Çocuk tabakları büyüklerden önce gelir – acısız.', 'Kids’ plates arrive before the adults’ – nothing spicy.'] },
{ i: 'kid', n: ['Spielecke im Blick', 'Göz önünde oyun köşesi', 'Play corner in view'], d: ['Ruhig gelegen, abseits der Servicewege, die Eltern immer in Sichtweite.', 'Servis yollarından uzak, ebeveynlerin hep görebileceği bir köşe.', 'Away from the service routes, always in sight of the parents.'] },
{ i: 'leaf', n: ['Wickeltisch', 'Bebek bakım masası', 'Changing table'], d: ['Sauber und gut erreichbar.', 'Temiz ve kolay ulaşılır.', 'Clean and easy to reach.'] },
{ i: 'cal', n: ['Familien-Sonntag', 'Aile pazarı', 'Family Sunday'], d: ['Ein- bis zweimal im Monat von 10 bis 13 Uhr: Basteln oder Kinderschminken.', 'Ayda bir iki kez 10:00–13:00 arası el işi veya yüz boyama.', 'Once or twice a month from 10 am to 1 pm: crafts or face painting.'] }
];
var K_PKGS = [
{ id: 'k1', p: 14.9, min: 6, img: 'nuggets', n: ['Klassik', 'Klasik', 'Classic'],
  d: [['2 Stunden am eigenen Tisch', 'Kindergericht nach Wahl und ein Getränk', 'Eis mit Wunderkerze für alle', 'Tischdeko, Geburtstagskind isst frei'], ['Kendi masanızda 2 saat', 'Seçilecek çocuk yemeği ve bir içecek', 'Herkese maytaplı dondurma', 'Masa süsü, doğum günü çocuğu ücretsiz'], ['2 hours at your own table', 'Kids’ dish of choice and a drink', 'Ice cream with a sparkler for everyone', 'Table decoration, the birthday child eats free']] },
{ id: 'k2', p: 19.9, min: 8, img: 'mini-lahmacun', n: ['Mini-Chef', 'Mini Şef', 'Mini Chef'],
  d: [['Alles aus „Klassik“', 'Die Kinder belegen mit unserem Koch ihre eigene Mini Lahmacun', 'Kochmütze zum Mitnehmen', 'Ideal ab 5 Jahren'], ['“Klasik” paketteki her şey', 'Çocuklar şefimizle kendi mini lahmacunlarını hazırlar', 'Hediye aşçı şapkası', '5 yaş ve üzeri için ideal'], ['Everything from “Classic”', 'The children top their own mini lahmacun with our chef', 'Chef’s hat to take home', 'Ideal from age 5']] }
];
function t(k) { var v = I[k]; return v ? v[LI] : k; }
function secT(s) { var x = SEC[s.id]; return LI === 0 || !x ? s.title : x[LI === 1 ? 0 : 2]; }
function secN(s) { var x = SEC[s.id]; return LI === 0 || !x ? s.note : x[LI === 1 ? 1 : 3]; }
function L3(a) { return a[LI] != null ? a[LI] : a[0]; }

/* ------------------------------------------------------------------ Daten */
var ITEMS = {}, ALL = [], secById = {};
function parsePrice(p) { return parseFloat(String(p).replace('€', '').replace(/\./g, '').replace(',', '.')) || 0; }
function money(v) { return (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }
M.forEach(function (s) {
  secById[s.id] = s;
  s.items.forEach(function (it, i) {
    it.id = s.id + '-' + i; it.sec = s.id;
    var m = /^(\d+)\.\s*(.*)$/.exec(it.name);
    it.no = m ? m[1] : ''; it.nm = m ? m[2] : it.name;
    it.p = it.price[0] || ''; it.v = parsePrice(it.p);
    var d = it.desc || '';
    it.mild = /\(leicht scharf\)/i.test(d);
    it.hot = !it.mild && /\(scharf\)/i.test(d);
    it.dd = d.replace(/\s*\((leicht scharf|scharf)\)/gi, '').trim();
    ITEMS[it.id] = it; ALL.push(it);
  });
});
function nm(it) { var x = TX[it.id]; if (x) { if (LI === 1 && x.ntr) return x.ntr; if (LI === 2 && x.nen) return x.nen; } return it.nm; }
function ds(it) {
  var x = TX[it.id] || {};
  if (LI === 1) return x.tr || (x.de ? '' : it.dd);
  if (LI === 2) return x.en || it.dd;
  return it.dd || x.de || '';
}

/* ------------------------------------------------------------------ Warenkorb */
var table = {};
try { table = JSON.parse(store('nirvana-cart') || '{}') || {}; } catch (e) { table = {}; }
Object.keys(table).forEach(function (k) { if (!ITEMS[k] || !(table[k] > 0) || ITEMS[k].inhouse) delete table[k]; });
function saveT() { store('nirvana-cart', JSON.stringify(table)); }
function tCount() { var n = 0; for (var k in table) n += table[k]; return n; }
function tSum() { var s = 0; for (var k in table) s += table[k] * ITEMS[k].v; return Math.round(s * 100) / 100; }
function addT(id, d) {
  if (!ITEMS[id] || ITEMS[id].inhouse) return;
  table[id] = (table[id] || 0) + d; if (table[id] <= 0) delete table[id];
  saveT(); renderTable(); syncAdds(); if (curView === 'bestellen') ordRender();
  var f = $('#fab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump');
}
function qtyHtml(k, small) {
  var it = ITEMS[k];
  return '<div class="qty' + (small ? ' sm' : '') + '"><button type="button" data-q="-1" data-id="' + k + '" aria-label="−1 ' + esc(nm(it)) + '">−</button><span class="num">' + table[k] + '</span><button type="button" data-q="1" data-id="' + k + '" aria-label="+1 ' + esc(nm(it)) + '">+</button></div>';
}
function renderTable() {
  var n = tCount(), f = $('#fab'), sum = tSum();
  f.classList.toggle('on', n > 0 && curView !== 'bestellen');
  f.innerHTML = ic('bag') + '<span>' + esc(t('tb.title')) + ' · ' + n + ' · <span class="num">' + money(sum) + '</span></span>';
  var h = '';
  Object.keys(table).forEach(function (k) {
    var it = ITEMS[k];
    h += '<div class="it" data-row="' + k + '"><b>' + esc(nm(it)) + '</b><span class="price num">' + money(it.v * table[k]) + '</span>' + qtyHtml(k) + '<small class="num">' + esc(it.p) + '</small></div>';
  });
  $('#tItems').innerHTML = h || '<p class="empty">' + esc(t('empty')) + '</p>';
  $('#tSum').textContent = money(sum);
  $('#tOrder').classList.toggle('off', !n);
}
function addBtn(it) {
  if (it.inhouse) return '<span class="tag pre ih">' + ic('fork') + esc(t('inhouse')) + '</span>';
  var on = !!table[it.id];
  return '<button type="button" class="add' + (on ? ' on' : '') + '" data-add="' + it.id + '" aria-pressed="' + on + '" aria-label="' + esc(t('add') + ': ' + nm(it)) + '" title="' + esc(t(on ? 'added' : 'add')) + '">' + ic(on ? 'check' : 'plus') + '<span>' + esc(t(on ? 'added' : 'add')) + '</span></button>';
}
function syncAdds() {
  $$('.add[data-add]').forEach(function (b) {
    var on = !!table[b.getAttribute('data-add')];
    if (b.classList.contains('on') === on) return;
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.title = t(on ? 'added' : 'add');
    b.innerHTML = ic(on ? 'check' : 'plus') + '<span>' + esc(t(on ? 'added' : 'add')) + '</span>';
  });
}
var lastFocus = null;
function drawer(o) {
  var d = $('#drawer');
  if (o) lastFocus = document.activeElement;
  d.classList.toggle('on', o); d.setAttribute('aria-hidden', o ? 'false' : 'true');
  if (o) setTimeout(function () { $('#drawerX').focus(); }, 60);
  else if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ------------------------------------------------------------------ Speisekarte */
var filter = 'all', query = '', visible = [];
function match(it) {
  if (filter === 'photo' && !it.img) return false;
  if (filter === 'veg' && !it.veg) return false;
  if (filter === 'hot' && !(it.hot || it.mild)) return false;
  if (filter === 'u10' && !(it.v > 0 && it.v < 10)) return false;
  if (query) {
    var q = query.toLowerCase(), hay = (it.name + ' ' + nm(it) + ' ' + it.desc + ' ' + ds(it)).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}
function tags(it) {
  var h = '';
  if (it.rec) h += '<span class="tag rec">' + ic('star') + esc(t('rec')) + '</span>';
  if (it.veg) h += '<span class="tag veg">' + ic('leaf') + esc(t('veg')) + '</span>';
  if (it.hot) h += '<span class="tag hot">' + ic('flame') + esc(t('hot')) + '</span>';
  if (it.mild) h += '<span class="tag hot">' + ic('flame') + esc(t('mild')) + '</span>';
  return h;
}
function numTag(it) { return it.no ? '<small>' + it.no + '</small>' : ''; }
function card(it) {
  var d = ds(it);
  return '<article class="card" data-item="' + it.id + '" data-rv>' +
    '<button type="button" class="open" data-open="' + it.id + '" aria-label="' + esc(nm(it)) + '"></button>' +
    '<div class="ph"><img src="img/s/' + it.img + '" alt="' + esc(nm(it)) + '" width="' + it.sw + '" height="' + it.sh + '" loading="lazy" decoding="async"></div>' +
    '<div class="t"><h4>' + numTag(it) + esc(nm(it)) + '</h4><span class="price num">' + esc(it.p) + '</span></div>' +
    (d ? '<p>' + esc(d) + '</p>' : '') +
    '<div class="foot">' + addBtn(it) + tags(it) + '</div></article>';
}
function row(it) {
  var d = ds(it), tg = tags(it);
  return '<div class="rowi" data-item="' + it.id + '"><div class="l">' + numTag(it) + '<button type="button" class="n" data-open="' + it.id + '">' + esc(nm(it)) + '</button><span class="dots2" aria-hidden="true"></span></div>' +
    '<div class="r"><span class="price num">' + esc(it.p) + '</span>' + addBtn(it) + '</div>' +
    (d ? '<p class="d">' + esc(d) + '</p>' : '') + (tg ? '<div class="tags">' + tg + '</div>' : '') + '</div>';
}
function splitList(s) { return String(s).split(/,\s(?![^(]*\))/); }
function cevParts(it) {
  var d = ds(it), m = d.split(/\s*(?:Garnituren|Garnitürler|Sides):\s*/);
  return { lead: m[0], garn: m[1] ? splitList(m[1]) : [] };
}
function garnHtml(list) {
  var imgs = (secById['kuzu-cevirme'] || {}).garnImg || [];
  return list.map(function (g, i) {
    var m = /^([^(]+)\s*(\(.*\))?$/.exec(g), x = imgs[i];
    return '<li' + (x ? ' class="gi"' : '') + '>' + (x ? '<img src="img/xs/' + x.img + '" alt="" loading="lazy" decoding="async">' : '') + '<b>' + esc((m ? m[1] : g).trim()) + '</b>' + (m && m[2] ? ' ' + esc(m[2]) : '') + '</li>';
  }).join('');
}
function persLabel(n) { return n + ' ' + t(n > 1 ? 'persN' : 'pers1'); }
function persTiles(s) {
  return s.items.map(function (it) {
    return '<div data-item="' + it.id + '"><span>' + esc(persLabel(it.pers || 1)) + '</span><b class="price num">' + esc(it.p) + '</b>' + addBtn(it) + '</div>';
  }).join('');
}
function nmLead() {
  var it = (secById['nirvana-menu'] || { items: [] }).items[0]; return it ? ds(it) : '';
}
function nmList(it) {
  return ds(it).split(/\s(?=(?:Vorspeise|Hauptgang|Salat|Başlangıç|Ana yemek|Salata|Starter|Main|Salad):)/).map(function (x) { var p = x.split(/:\s*/); return '<li><b>' + esc(p[0]) + '</b> ' + esc(p.slice(1).join(': ')) + '</li>'; }).join('');
}
function renderGroups() {
  $('#groups').innerHTML = GROUPS.map(function (g, i) {
    return '<button type="button" data-g="' + g.id + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(g.n[LI]) + '</button>';
  }).join('');
}
function renderMenu() {
  var h = '', total = 0, plain = filter === 'all' && !query;
  visible = [];
  GROUPS.forEach(function (g) {
    var gh = '', multi = g.s.length > 1;
    g.s.forEach(function (sid) {
      var s = secById[sid]; if (!s) return;
      var its = s.items.filter(match); if (!its.length) return;
      total += its.length;
      its.forEach(function (it) { visible.push(it.id); });
      var title = secT(s), note = secN(s);
      if (!gh) gh += '<div class="head"><h2>' + esc(multi ? g.n[LI] : title) + '</h2>' + (!multi && note ? '<p>' + esc(note) + '</p>' : '') + '</div>';
      if (multi) gh += '<h3 class="sub">' + esc(title) + '</h3>' + (note ? '<p class="sn">' + esc(note) + '</p>' : '');
      if (sid === 'fruhstuck' && plain) {
        var a = s.items[0], b = s.items[1], bp = s.photos || [];
        gh += '<div class="ess" data-rv>' + (bp.length ? '<figure class="ess-ph"><img src="img/' + bp[0].img + '" alt="' + esc(t('bfph')) + '" width="' + bp[0].w + '" height="' + bp[0].h + '" loading="lazy" decoding="async">' +
          bp.slice(1).map(function (x, i) { return '<img class="acc a' + i + '" src="img/s/' + x.img + '" alt="" width="' + x.sw + '" height="' + x.sh + '" loading="lazy" decoding="async">'; }).join('') + '</figure>' : '') + '<div><p class="eyebrow">' + esc(t('daily')) + '</p><h3>' + esc(nm(a)) + '</h3>' +
          '<div class="pl" data-item="' + a.id + '"><span>' + esc(t('bf.a')) + '</span><i></i><span class="price num">' + esc(a.p) + '</span></div>' +
          '<div class="pl" data-item="' + b.id + '"><span>' + esc(t('bf.k')) + '</span><i></i><span class="price num">' + esc(b.p) + '</span></div>' +
          '<a class="btn sm" href="#reservieren" style="margin-top:18px">' + esc(t('bf.cta')) + '</a></div>' +
          '<ul>' + ['bf.l1', 'bf.l2', 'bf.l3', 'bf.l4'].map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join('') + '</ul></div>';
        return;
      }
      if ((sid === 'kuzu-cevirme' || sid === 'nirvana-menu') && plain) {
        var f = s.items[0], cev = sid === 'kuzu-cevirme', c = cev ? cevParts(f) : null;
        gh += '<div class="feature' + (cev ? ' leonn' : '') + '" data-rv><div class="tray"><img' + (cev ? '' : ' class="roundph"') + ' src="img/' + f.img + '" alt="' + esc(secT(s)) + '" width="' + f.w + '" height="' + f.h + '" loading="lazy" decoding="async"></div>' +
          '<div><p class="eyebrow">' + (cev ? 'NIRVANA <span class="xsym">×</span> LEONN' : esc(t('nm.e'))) + '</p><h3>' + esc(secT(s)) + '</h3>' +
          (cev ? '<p>' + esc(c.lead) + '</p><ul class="garn">' + garnHtml(c.garn) + '</ul>' : '<ul class="garn nm">' + nmList(f) + '</ul>') +
          '<div class="tiles">' + persTiles(s) + '</div></div></div>';
        return;
      }
      var ph = its.filter(function (x) { return x.img && !x.pers; }), li = its.filter(function (x) { return !x.img || x.pers; });
      if (ph.length) gh += '<div class="grid n' + Math.min(ph.length, 9) + '">' + ph.map(card).join('') + '</div>';
      if (li.length) gh += '<div class="list">' + li.map(row).join('') + '</div>';
    });
    if (gh) h += '<section class="msec" id="' + g.id + '">' + gh + '</section>';
  });
  $('#menu').innerHTML = h || '<p class="empty">' + esc(t('none')) + '</p>';
  $('#count').textContent = plain ? '' : total + ' ' + t('found');
  setupReveal(); onScroll();
}

/* ------------------------------------------------------------------ Großansicht (Gericht oder Foto) */
var modalList = [], modalId = null;
function openItem(id, list) {
  var it = ITEMS[id]; if (!it) return;
  if (!$('#veil').classList.contains('on')) lastFocus = document.activeElement;
  if (list) modalList = list;
  if (modalList.indexOf(id) < 0) modalList = ALL.map(function (x) { return x.id; });
  modalId = id;
  var s = secById[it.sec], pos = modalList.indexOf(id), d = ds(it), n = secN(s), tg = tags(it);
  if (it.sec === 'kuzu-cevirme') d = cevParts(it).lead;
  $('#modal').classList.remove('photo-only');
  $('#modal').innerHTML =
    (it.img ? '<div class="mi"><img src="img/' + it.img + '" alt="' + esc(nm(it)) + '" width="' + it.w + '" height="' + it.h + '" decoding="async"></div>' : '') +
    '<div class="mt"><div class="mrow"><p class="eyebrow">' + esc(secT(s)) + '</p><button class="x" type="button" data-close aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div>' +
    '<h3 id="mName">' + (it.no ? '<small style="font-family:var(--body);font-size:16px;font-weight:400;color:var(--mute);margin-right:8px">' + it.no + '</small>' : '') + esc(nm(it)) + '</h3>' +
    (tg ? '<div class="tags" style="display:flex;flex-wrap:wrap;gap:6px">' + tg + '</div>' : '') +
    (d ? '<p>' + esc(d) + '</p>' : '') + (n ? '<p style="font-size:15px">' + esc(n) + '</p>' : '') +
    '<span class="price num" style="font-size:40px">' + esc(it.p) + '</span>' + addBtn(it) +
    '<div class="mnav"><button class="sq" type="button" data-mnav="-1" aria-label="' + esc(t('prev')) + '">' + ic('left') + '</button><button class="sq" type="button" data-mnav="1" aria-label="' + esc(t('next')) + '">' + ic('right') + '</button><span class="num">' + (pos + 1) + ' / ' + modalList.length + '</span></div></div>';
  $('#veil').classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  var x = $('#modal [data-close]'); if (x) x.focus();
}
function openPhoto(name, alt) {
  if (!$('#veil').classList.contains('on')) lastFocus = document.activeElement;
  modalId = null;
  $('#modal').classList.add('photo-only');
  $('#modal').innerHTML = '<div class="mi"><img src="img/' + esc(name) + '.webp" alt="' + esc(alt || '') + '" decoding="async"></div><div class="mt"><div class="mrow"><p class="eyebrow">' + esc(t('photo')) + '</p><button class="x" type="button" data-close aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div>' + (alt ? '<p>' + esc(alt) + '</p>' : '') + '</div>';
  $('#veil').classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  var x = $('#modal [data-close]'); if (x) x.focus();
}
function modalStep(d) {
  var i = modalList.indexOf(modalId); if (i < 0) return;
  var n = (i + d + modalList.length) % modalList.length, keep = document.activeElement && document.activeElement.getAttribute('data-mnav');
  openItem(modalList[n]);
  if (keep) { var b = $('#modal [data-mnav="' + keep + '"]'); if (b) b.focus(); }
}
function closeItem() {
  if (!$('#veil').classList.contains('on')) return;
  $('#veil').classList.remove('on'); modalId = null;
  document.documentElement.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function trap(e, box) {
  var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', box).filter(function (el) { return el.offsetParent !== null; });
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ------------------------------------------------------------------ Start: Laufband, Karussell, Kacheln, Menüs */
var beltPending = false;
function renderBelt() {
  var seen = {}, ph = ALL.filter(function (x) { if (!x.img || seen[x.img]) return false; seen[x.img] = 1; return true; });
  var ids = ph.map(function (x) { return x.id; });
  $('#belt').beltIds = ids;
  if (curView !== 'start' && !$('#belt').firstChild) { beltPending = true; return; }
  beltPending = false;
  function r(arr, c) {
    var x = arr.map(function (it) { return '<button type="button" data-open="' + it.id + '" data-belt="1" aria-label="' + esc(nm(it)) + '"><img src="img/xs/' + it.img + '" alt="" width="190" height="145" decoding="async" fetchpriority="low"></button>'; }).join('');
    var y = x.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');
    return '<div class="row ' + c + '">' + x + y + '</div>';
  }
  $('#belt').innerHTML = r(ph.filter(function (_, i) { return i % 2 === 0; }), '') + r(ph.filter(function (_, i) { return i % 2 === 1; }), 'rev');
  $('#belt').beltIds = ids;
}
var SHOW = ['grill-9', 'exclusive-0', 'grill-8', 'chefkoch-1', 'grill-10', 'vorspeisen-6', 'fisch-2', 'pfannen-0', 'desserts-0'].filter(function (id) { return ITEMS[id] && ITEMS[id].img; });
var showI = 0, showBusy = false, showTimer = null, showHold = false;
function showFill() {
  var it = ITEMS[SHOW[showI]]; if (!it) return;
  $('#showSec').textContent = secT(secById[it.sec]);
  $('#showName').innerHTML = (it.no ? '<small style="font-family:var(--body);font-size:16px;font-weight:400;color:var(--mute);margin-right:10px">' + it.no + '</small>' : '') + esc(nm(it));
  $('#showDesc').textContent = ds(it);
  $('#showPrice').textContent = it.p;
  $('#showAdd').innerHTML = addBtn(it);
  $('#showNo').textContent = (showI + 1 < 10 ? '0' : '') + (showI + 1);
  var img = $('#showImg'); img.alt = nm(it);
  $$('#showDots button').forEach(function (b, i) { b.setAttribute('aria-current', i === showI ? 'true' : 'false'); });
}
function showGo(i, instant) {
  if (!SHOW.length) return;
  i = (i + SHOW.length) % SHOW.length;
  if (showBusy || (i === showI && !instant)) return;
  var img = $('#showImg'), it = ITEMS[SHOW[i]], copy = $('#showCopy');
  function swap() {
    showI = i; img.src = 'img/' + it.img; img.width = it.w; img.height = it.h;
    showFill();
    img.classList.remove('out');
    if (!reduce && !instant) { img.classList.add('in'); copy.classList.remove('swap'); void copy.offsetWidth; copy.classList.add('swap'); }
    showBusy = false;
    var nx = ITEMS[SHOW[(i + 1) % SHOW.length]]; if (nx && curView === 'start') { var pre = new Image(); pre.src = 'img/' + nx.img; }
  }
  if (reduce || instant) { swap(); return; }
  showBusy = true; img.classList.remove('in'); img.classList.add('out');
  setTimeout(swap, 380);
}
function showAuto() {
  clearInterval(showTimer);
  if (reduce) return;
  showTimer = setInterval(function () {
    if (showHold || document.hidden || !$('#v-start').classList.contains('on') || $('#veil').classList.contains('on')) return;
    var r = $('#show').getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    showGo(showI + 1);
  }, 6000);
}
function renderShow() {
  $('#showDots').innerHTML = SHOW.map(function (id, i) { return '<button type="button" data-show="' + i + '" aria-label="' + esc(nm(ITEMS[id])) + '"></button>'; }).join('');
  $('#showPrev').setAttribute('aria-label', t('prev')); $('#showNext').setAttribute('aria-label', t('next'));
  showFill();
}
var CATS = [['g1', 'kahvalti-buffet', 'daily'], ['g3', 'soguk-meze', ''], ['g4', 'karisik-izgara', ''], ['g5', 'et-guvec', ''], ['g2', 'coban-salatasi', ''], ['g8', 'kunefe', '']];
function groupCount(g) {
  var seen = {}, n = 0;
  g.s.forEach(function (sid) { (secById[sid] ? secById[sid].items : []).forEach(function (it) { var k = it.nm.replace(/\s*\(.*\)\s*/g, ''); if (!seen[k]) { seen[k] = 1; n++; } }); });
  return n;
}
function renderCats() {
  $('#cats').innerHTML = CATS.map(function (c) {
    var g = GROUPS.filter(function (x) { return x.id === c[0]; })[0]; if (!g) return '';
    return '<button type="button" class="cat" data-go="' + g.id + '" data-rv><img src="img/s/' + c[1] + '.webp" alt="" width="210" height="210" loading="lazy" decoding="async">' +
      '<span class="num">' + groupCount(g) + ' ' + esc(t('dishes')) + '</span><b>' + esc(g.n[LI]) + '</b>' + (c[2] ? '<i>' + esc(t(c[2])) + '</i>' : '') + ic('right') + '</button>';
  }).join('');
}
function renderBands() {
  var s = secById['kuzu-cevirme'];
  if (s) { var c = cevParts(s.items[0]); $('#cevLead').textContent = c.lead; $('#cevGarn').innerHTML = garnHtml(c.garn); $('#cevTiles').innerHTML = persTiles(s); }
  var n = secById['nirvana-menu'];
  if (n) { $('#nmLead').innerHTML = '<ul class="garn nm">' + nmList(n.items[0]) + '</ul>'; $('#nmTiles').innerHTML = persTiles(n); }
  var b = secById['fruhstuck'];
  if (b) $('#bfTiles').innerHTML = '<div><span>' + esc(t('bf.a')) + '</span><b class="price num">' + esc(b.items[0].p) + '</b></div><div><span>' + esc(t('bf.k')) + '</span><b class="price num">' + esc(b.items[1].p) + '</b></div>';
}

/* ------------------------------------------------------------------ Öffnungszeiten */
function berlinNow() {
  try {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()), o = {};
    p.forEach(function (x) { o[x.type] = x.value; });
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    return { wd: wd, min: (+o.hour % 24) * 60 + (+o.minute), date: o.year + '-' + o.month + '-' + o.day };
  } catch (e) { var d = new Date(); return { wd: d.getDay(), min: d.getHours() * 60 + d.getMinutes(), date: ymd(d) }; }
}
function hm(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function fmtMin(m) { return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); }
function hoursOf(wd) { var h = (CFG.hours || {})[wd]; return h ? [hm(h[0]), hm(h[1])] : null; }
function setStatus() {
  var n = berlinNow(), h = hoursOf(n.wd), open = h && n.min >= h[0] && n.min < h[1], txt;
  if (open) txt = fill(t('open'), { t: fmtMin(h[1]) });
  else {
    var later = h && n.min < h[0], nh = later ? h : hoursOf((n.wd + 1) % 7);
    txt = fill(t('closed'), { d: t(later ? 'day.today' : 'day.tomorrow'), t: nh ? fmtMin(nh[0]) : '' });
  }
  ['', '2'].forEach(function (x) {
    var el = $('#status' + x); if (!el) return;
    el.classList.toggle('closed', !open); $('#statusText' + x).textContent = txt;
  });
}
/* ------------------------------------------------------------------ Reservierung
   Spricht mit dem Reservierungssystem (config.js). Ist es nicht eingerichtet, läuft ein Vorführ-Modus nur auf diesem Gerät. */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fmtDate(v) {
  var p = String(v).split('-'); if (p.length !== 3) return '';
  var d = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(d)) return '';
  return d.toLocaleDateString(LOCALE[LI], { weekday: 'long', day: 'numeric', month: 'long' });
}
function wdOf(date) { var p = date.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).getDay(); }
var API = CFG.api || '', DEMO_OK = CFG.demo !== false || !API, RC = CFG.rsv || { maxParty: 9, groupMin: 10, groupMax: 40, maxDays: 60, terrace: [5, 9], sundayBreakfast: ['09:00', '11:00'] };
var RS = { step: 1, persons: 2, area: 'r', ym: '', date: '', time: '', cfg: null, demo: false, loading: false, months: {}, days: {}, more: false,
  form: { name: '', tel: '', mail: '', note: '', occ: 'occ.none', kids: 0, chairs: 0, ok: false }, t0: 0, busy: false, done: null, mine: {}, ask: '', timer: null };
function apiCall(path, opt) {
  if (!API) return Promise.reject(new Error('no api'));
  var ctl = ('AbortController' in window) ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
  opt = opt || {}; if (ctl) opt.signal = ctl.signal;
  return fetch(API + path, opt).then(function (r) { clearTimeout(to); return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); }, function (e) { clearTimeout(to); throw e; });
}
function addDaysStr(d, n) { var p = d.split('-'), x = new Date(+p[0], +p[1] - 1, +p[2] + n); return ymd(x); }
function demoHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function demoCfg() { var n = berlinNow(); return { mode: 'demo', maxParty: RC.maxParty, groupMin: RC.groupMin, groupMax: RC.groupMax, maxDays: RC.maxDays, phone: PHONE, autoConfirm: false, today: n.date, now: fmtMin(n.min) }; }
function demoState(date) { var c = RS.cfg; return date < c.today ? 'past' : (date > addDaysStr(c.today, c.maxDays) ? 'far' : (!hoursOf(wdOf(date)) ? 'closed' : 'open')); }
function terraceOpen(date) { var m = +String(date || RS.cfg.today).slice(5, 7), r = RC.terrace || [5, 9]; return m >= r[0] && m <= r[1]; }
function demoDay(date) {
  var c = RS.cfg, st = demoState(date), out = [], wd = wdOf(date), h = hoursOf(wd);
  if (st !== 'open') return { date: date, state: st, slots: [] };
  for (var m = h[0]; m <= h[1] - 60; m += 30) {
    var tm = fmtMin(m);
    if (wd === 0 && m < 12 * 60 && (RC.sundayBreakfast || []).indexOf(tm) < 0) continue;
    var x = demoHash(date + tm + RS.area), s = x % 9 === 0 ? 'full' : (x % 4 === 0 ? 'few' : 'free');
    if (RS.area === 'g' && s === 'free' && x % 3 === 0) s = 'few';
    if (date === c.today && m < hm(c.now) + 60) s = 'past';
    out.push({ t: tm, s: s });
  }
  return { date: date, state: 'open', slots: out };
}
function demoMonth(ym) {
  var days = {}, last = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate();
  for (var d = 1; d <= last; d++) { var date = ym + '-' + pad(d), st = demoState(date); if (st === 'open' && RS.area === 't' && !terraceOpen(date)) st = 'closed'; days[date] = st === 'open' ? (demoHash(date) % 7 === 0 ? 'few' : 'free') : st; }
  return { ym: ym, days: days };
}
function demoAll() { try { return JSON.parse(store('nirvana-res-demo') || '{}') || {}; } catch (e) { return {}; } }
function rsvKey() { return RS.persons + '|' + RS.area; }
function rsvMonth(ym) {
  var k = ym + '|' + rsvKey();
  if (RS.months[k]) return Promise.resolve(RS.months[k]);
  var p = RS.demo ? Promise.resolve(demoMonth(ym)) : apiCall('/month?ym=' + ym + '&persons=' + RS.persons + '&area=' + RS.area).then(function (r) { if (!r.ok) throw new Error('month'); return r.j; });
  return p.then(function (j) { RS.months[k] = j.days; return j.days; });
}
function rsvDay(date, fresh) {
  var k = date + '|' + rsvKey();
  if (RS.days[k] && !fresh) return Promise.resolve(RS.days[k]);
  var p = RS.demo ? Promise.resolve(demoDay(date)) : apiCall('/day?date=' + date + '&persons=' + RS.persons + '&area=' + RS.area).then(function (r) { if (!r.ok) throw new Error('day'); return r.j; });
  return p.then(function (j) { RS.days[k] = j; return j; });
}
function areaLabel(a) { return t('ar.' + (a || 'r')); }
function fmtShort(v) { var p = String(v).split('-'); if (p.length !== 3) return ''; return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(LOCALE[LI], { weekday: 'short', day: 'numeric', month: 'long' }); }
function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
function ticket() {
  var d = RS.done;
  $('#tkDate').textContent = fmtDate(RS.date) || '—';
  $('#tkTime').textContent = RS.time ? RS.time + t('clock') : '– – : – –';
  $('#tkPers').textContent = persLabel(RS.persons);
  $('#tkWhere').textContent = areaLabel(RS.area);
  $('#tkName').textContent = RS.form.name.trim();
  var st = $('#tkStamp'); st.hidden = !d; st.textContent = d ? d.code + ' · ' + t('rsv.st.' + d.status) : '';
}
function rsvFix() {
  var c = RS.cfg; if (!c) return;
  if (RS.persons > c.groupMax) RS.persons = c.groupMax;
  if (RS.persons >= c.groupMin) RS.area = 'g';
  else if (RS.area === 'g') RS.area = 'r';
  if (RS.area === 't' && !terraceOpen(RS.date)) { if (RS.date) RS.area = 'r'; }
}
function rsvSteps() {
  var names = [t('rsv.s1'), t('rsv.s2'), t('rsv.s3')];
  $('#rsvSteps').innerHTML = RS.step > 3 ? '' : names.map(function (n, i) {
    var k = i + 1, cls = k === RS.step ? 'on' : (k < RS.step ? 'done' : '');
    return '<li class="' + cls + '"' + (k === RS.step ? ' aria-current="step"' : '') + '>' + (k < RS.step ? '<button type="button" data-rsv="go" data-step="' + k + '">' : '<span>') + '<i class="num">' + (k < RS.step ? ic('check') : k) + '</i><em>' + esc(n) + '</em>' + (k < RS.step ? '</button>' : '</span>') + '</li>';
  }).join('');
  $('#rsvSteps').hidden = RS.step > 3;
}
var AREAS = [['r', 'saal-tafel', 'ar.r.s'], ['w', 'wintergarten', 'ar.w.s'], ['t', 'aussen-see', 'ar.t.s'], ['g', 'festtafel-2', 'ar.g.s']];
function rsvPanel1() {
  var c = RS.cfg, h = '', i, ppl = '', grp = RS.persons >= c.groupMin, shown = Math.max(12, RS.persons <= 12 ? 12 : 0);
  for (i = 1; i <= Math.min(Math.max(RS.persons, 10), 14); i++) ppl += '<span class="' + (i <= RS.persons ? 'on' : '') + '">' + ic('person') + '</span>';
  if (RS.persons > 14) ppl += '<b class="num plus">+' + (RS.persons - 14) + '</b>';
  h += '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q1')) + '</h2><div class="rsv-people" aria-hidden="true">' + ppl + '</div><div class="rsv-nums" role="radiogroup" aria-label="' + esc(t('res.pers')) + '">';
  for (i = 1; i <= shown; i++) h += '<button type="button" role="radio" aria-checked="' + (i === RS.persons) + '" data-n="' + i + '" class="num' + (i >= c.groupMin ? ' vipn' : '') + '">' + i + '</button>';
  h += '<label class="more' + (RS.persons > 12 ? ' on' : '') + '"><span>' + esc(t('rsv.more')) + '</span><input type="number" id="rMore" min="13" max="' + c.groupMax + '" inputmode="numeric" placeholder="13–' + c.groupMax + '" value="' + (RS.persons > 12 ? RS.persons : '') + '"></label>';
  h += '</div><p class="rsv-hint">' + (grp ? esc(fill(t('rsv.g.only'), { n: c.groupMin })) + ' ' : '') + esc(fill(t('rsv.big'), { n: c.groupMax })) + ' <a href="#feiern" class="nb">' + esc(t('rsv.party')) + '</a> · <a href="' + TEL + '" class="nb">' + esc(c.phone) + '</a></p>';
  h += '<h2 class="rsv-q sm">' + esc(t('rsv.area')) + '</h2><div class="rsv-areas four" role="radiogroup" aria-label="' + esc(t('res.where')) + '">' +
    AREAS.map(function (a) {
      var ok = a[0] === 'g' ? grp : !grp, sub = a[0] === 't' && !terraceOpen(RS.date) ? t('ar.t.off') : fill(t(a[2]), { n: c.maxParty, a: c.groupMin, b: c.groupMax });
      return '<button type="button" class="rsv-area" role="radio" data-area="' + a[0] + '" aria-checked="' + (RS.area === a[0]) + '"' + (ok ? '' : ' disabled') + '><img src="img/s/' + a[1] + '.webp" alt="" loading="lazy"><span><b>' + esc(areaLabel(a[0])) + '</b><i>' + esc(sub) + '</i></span></button>';
    }).join('') +
    '</div><div class="rsv-nav"><button type="button" class="btn" data-rsv="next">' + esc(t('rsv.next')) + ic('right') + '</button></div>';
  return h;
}
function calHtml(days) {
  var c = RS.cfg, y = +RS.ym.slice(0, 4), m = +RS.ym.slice(5), first = (new Date(y, m - 1, 1).getDay() + 6) % 7, last = new Date(y, m, 0).getDate(), i, h;
  var minYm = c.today.slice(0, 7), maxYm = addDaysStr(c.today, c.maxDays).slice(0, 7);
  h = '<div class="cal"><div class="cal-head"><button type="button" class="sq" data-rsv="pm" aria-label="' + esc(t('rsv.pm')) + '"' + (RS.ym <= minYm ? ' disabled' : '') + '>' + ic('left') + '</button><b>' +
    esc(new Date(y, m - 1, 1).toLocaleDateString(LOCALE[LI], { month: 'long', year: 'numeric' })) + '</b><button type="button" class="sq" data-rsv="nm" aria-label="' + esc(t('rsv.nm')) + '"' + (RS.ym >= maxYm ? ' disabled' : '') + '>' + ic('right') + '</button></div><div class="cal-grid">';
  for (i = 0; i < 7; i++) h += '<span class="wd">' + esc(new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE[LI], { weekday: 'short' }).replace('.', '')) + '</span>';
  for (i = 0; i < first; i++) h += '<span></span>';
  for (i = 1; i <= last; i++) {
    var date = RS.ym + '-' + pad(i), st = days ? (days[date] || 'past') : 'wait', can = st === 'free' || st === 'few';
    h += '<button type="button" class="day s-' + st + (date === c.today ? ' today' : '') + '" data-date="' + date + '"' + (can ? '' : ' disabled') + ' aria-pressed="' + (date === RS.date) + '" aria-label="' + esc(fmtDate(date) + (st === 'few' ? ', ' + t('rsv.few') : st === 'full' ? ', ' + t('rsv.full') : st === 'closed' ? ', ' + t('rsv.closed') : '')) + '">' + i + '</button>';
  }
  return h + '</div><div class="cal-legend"><span class="lg free">' + esc(t('rsv.free')) + '</span><span class="lg few">' + esc(t('rsv.few')) + '</span><span class="lg full">' + esc(t('rsv.full')) + '</span></div></div>';
}
function timesHtml(day) {
  if (!RS.date) return '<p class="rsv-pick">' + ic('cal') + esc(t('rsv.pick')) + '</p>';
  if (!day) return '<p class="rsv-load">' + esc(t('rsv.loading')) + '</p>';
  var g = [[], [], []], h = '<h3>' + esc(fill(t('rsv.times'), { d: fmtDate(RS.date) })) + '</h3>';
  day.slots.forEach(function (x) { if (x.s !== 'past') g[x.t < '12:00' ? 0 : (x.t < '17:00' ? 1 : 2)].push(x); });
  if (!day.slots.some(function (x) { return x.s === 'free' || x.s === 'few'; })) return h + '<p class="rsv-pick">' + esc(t('rsv.noslots')) + ' <a href="' + TEL + '" class="nb">' + esc(RS.cfg.phone) + '</a></p>';
  ['rsv.g1', 'rsv.g2', 'rsv.g3'].forEach(function (k, i) {
    if (!g[i].length) return;
    h += '<div class="tgroup"><h4>' + esc(t(k)) + '</h4><div class="tms">' + g[i].map(function (x) {
      return '<button type="button" class="tm s-' + x.s + '" data-time="' + x.t + '"' + (x.s === 'full' ? ' disabled' : '') + ' aria-pressed="' + (x.t === RS.time) + '" aria-label="' + x.t + t('clock') + (x.s === 'few' ? ', ' + esc(t('rsv.few')) : x.s === 'full' ? ', ' + esc(t('rsv.full')) : '') + '"><b class="num">' + x.t + '</b>' + (x.s === 'few' ? '<i>' + esc(t('rsv.few')) + '</i>' : x.s === 'full' ? '<i>' + esc(t('rsv.full')) + '</i>' : '') + '</button>';
    }).join('') + '</div></div>';
  });
  return h + (wdOf(RS.date) === 0 ? '<p class="rsv-bf">' + esc(t('rsv.sun')) + '</p>' : '<p class="rsv-bf">' + esc(t('con.bf')) + '</p>');
}
function rsvPanel2() {
  var k = RS.ym + '|' + rsvKey(), dk = RS.date + '|' + rsvKey();
  return '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q2')) + '</h2><div class="rsv-sum"><span>' + esc(persLabel(RS.persons)) + '</span><span>' + esc(areaLabel(RS.area)) + '</span><button type="button" class="lnk" data-rsv="go" data-step="1">' + esc(t('rsv.change')) + '</button></div>' +
    '<div class="rsv-when"><div id="rsvCal">' + calHtml(RS.months[k]) + '</div><div class="times" id="rsvTimes" aria-live="polite">' + timesHtml(RS.days[dk]) + '</div></div>' +
    '<div class="rsv-nav"><button type="button" class="btn ghost" data-rsv="back">' + esc(t('rsv.back')) + '</button><button type="button" class="btn" data-rsv="next"' + (RS.date && RS.time ? '' : ' disabled') + '>' + esc(t('rsv.next')) + ic('right') + '</button></div>';
}
var RSV_OCC = ['occ.none', 'occ.bday', 'occ.kbday', 'occ.anniv', 'occ.biz', 'occ.family', 'occ.other'];
function numSel(id, max, val) { var h = '<select id="' + id + '">'; for (var i = 0; i <= max; i++) h += '<option' + (i === +val ? ' selected' : '') + '>' + i + '</option>'; return h + '</select>'; }
function rsvPanel3() {
  var f = RS.form;
  return '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q3')) + '</h2><div class="rsv-sum"><span>' + esc(persLabel(RS.persons)) + '</span><span>' + esc(fmtShort(RS.date)) + '</span><span>' + esc(RS.time + t('clock')) + '</span><span>' + esc(areaLabel(RS.area)) + '</span><button type="button" class="lnk" data-rsv="go" data-step="2">' + esc(t('rsv.change')) + '</button></div>' +
    '<form class="form" id="rsvForm" novalidate>' +
    '<label><span>' + esc(t('res.name')) + '</span><input type="text" id="rName" autocomplete="name" maxlength="80" required value="' + esc(f.name) + '"></label>' +
    '<label><span>' + esc(t('res.tel')) + '</span><input type="tel" id="rTel" autocomplete="tel" inputmode="tel" maxlength="30" required value="' + esc(f.tel) + '"></label>' +
    '<label class="full"><span>' + esc(t('res.mail')) + '</span><input type="email" id="rMail" autocomplete="email" maxlength="120" required value="' + esc(f.mail) + '"></label>' +
    '<label><span>' + esc(t('res.occ')) + '</span><select id="rOcc">' + RSV_OCC.map(function (k) { return '<option value="' + k + '"' + (k === f.occ ? ' selected' : '') + '>' + esc(t(k)) + '</option>'; }).join('') + '</select></label>' +
    '<div class="pair"><label><span>' + esc(t('res.kids')) + '</span>' + numSel('rKids', Math.min(20, RS.persons), f.kids) + '</label><label><span>' + esc(t('res.chairs')) + '</span>' + numSel('rChairs', 6, f.chairs) + '</label></div>' +
    '<label class="full"><span>' + esc(t('res.note')) + '</span><textarea id="rNote" rows="2" maxlength="400">' + esc(f.note) + '</textarea></label>' +
    '<label class="hp" aria-hidden="true">Website<input type="text" id="rWeb" tabindex="-1" autocomplete="off"></label>' +
    '<label class="full check"><input type="checkbox" id="rOk"' + (f.ok ? ' checked' : '') + '><span>' + esc(t('rsv.consent')) + '</span></label>' +
    '<div class="full rsv-nav"><button type="button" class="btn ghost" data-rsv="back">' + esc(t('rsv.back')) + '</button><button class="btn" type="submit" id="rsvSend"' + (RS.busy ? ' disabled' : '') + '>' + esc(RS.busy ? t('rsv.sending') : t(RS.cfg.autoConfirm ? 'rsv.send2' : 'rsv.send')) + '</button></div></form>';
}
function rsvPanel4() {
  var d = RS.done, live = RS.mine[d.token]; if (live) d.status = live.status;
  var ok = d.status === 'confirmed';
  return '<div class="rsv-done s-' + d.status + '"><div class="rsv-check" aria-hidden="true">' + ic('check') + '</div><h2 class="rsv-q" tabindex="-1">' + esc(t(ok ? 'rsv.done.h2' : 'rsv.done.h')) + '</h2>' +
    '<p>' + esc(t(ok ? 'rsv.done.p2' : 'rsv.done.p')) + '</p>' + (RS.demo ? '<p class="fine">' + esc(t('rsv.demo')) + '</p>' : '') +
    '<div class="rsv-code"><span>' + esc(t('rsv.code')) + '</span><b class="num">' + esc(d.code) + '</b></div>' +
    '<div class="rsv-sum"><span>' + esc(persLabel(d.persons)) + '</span><span>' + esc(fmtShort(d.date)) + '</span><span>' + esc(d.time + t('clock')) + '</span><span>' + esc(areaLabel(d.area)) + '</span></div>' +
    '<div class="rsv-nav"><button type="button" class="btn ghost" data-rsv="cal" data-tok="' + esc(d.token) + '">' + ic('cal') + esc(t('rsv.cal')) + '</button><button type="button" class="btn ghost" data-rsv="new">' + esc(t('rsv.new')) + '</button></div></div>';
}
function rsvRender(focus) {
  var p = $('#rsvPanel'), c = RS.cfg, n = $('#rsvNote');
  if (!c) {
    $('#rsvSteps').hidden = true; n.hidden = true;
    p.innerHTML = RS.off ? '<div class="rsv-off"><h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.off.h')) + '</h2><p>' + esc(t('rsv.off.p')) + ' <a href="' + TEL + '" class="nb">' + esc(PHONE) + '</a></p><div class="rsv-nav"><button type="button" class="btn" data-rsv="retry">' + ic('refresh') + esc(t('rsv.retry')) + '</button></div></div>'
      : '<p class="rsv-load">' + esc(t('rsv.loading')) + '</p>';
    p.setAttribute('data-step', RS.off ? 'off' : 'load'); ticket();
    if (RS.off && focus) { var oh = $('.rsv-q', p); if (oh) { try { oh.focus({ preventScroll: true }); } catch (e) {} } }
    return;
  }
  rsvFix(); rsvSteps();
  n.hidden = !(RS.demo || c.mode === 'test'); n.textContent = RS.demo ? t('rsv.demo') : t('rsv.test'); n.className = 'rsv-note' + (RS.demo ? ' demo' : '');
  p.innerHTML = RS.step === 1 ? rsvPanel1() : RS.step === 2 ? rsvPanel2() : RS.step === 3 ? rsvPanel3() : rsvPanel4();
  p.setAttribute('data-step', RS.step);
  ticket();
  if (RS.step === 2) rsvLoad2();
  if (focus) { var h = $('.rsv-q', p); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } } var y = $('#rsvSteps').getBoundingClientRect().top + window.pageYOffset - hhNow() - 18; if (window.pageYOffset > y || p.getBoundingClientRect().top > window.innerHeight * 0.6) window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }
}
function rsvLoad2() {
  var key = rsvKey(), ym = RS.ym;
  rsvMonth(ym).then(function () {
    if (RS.step !== 2 || key !== rsvKey() || ym !== RS.ym) return;
    var days = RS.months[ym + '|' + key];
    if (RS.date && RS.date.slice(0, 7) === ym && days[RS.date] !== 'free' && days[RS.date] !== 'few') { RS.date = ''; RS.time = ''; }
    $('#rsvCal').innerHTML = calHtml(days); rsvTimes();
  }).catch(function () { rsvFail(); });
}
function rsvTimes(fresh) {
  var key = rsvKey(), date = RS.date, box = $('#rsvTimes'); if (!box) return;
  if (!date) { box.innerHTML = timesHtml(null); rsvNextBtn(); return; }
  if (!RS.days[date + '|' + key] || fresh) box.innerHTML = timesHtml(null);
  rsvDay(date, fresh).then(function (day) {
    if (RS.step !== 2 || key !== rsvKey() || date !== RS.date) return;
    var sl = day.slots.filter(function (x) { return x.t === RS.time; })[0];
    if (RS.time && (!sl || sl.s === 'full' || sl.s === 'past')) RS.time = '';
    $('#rsvTimes').innerHTML = timesHtml(day); rsvNextBtn(); ticket();
  }).catch(function () { rsvFail(); });
}
function rsvNextBtn() { var b = $('#rsvPanel [data-rsv="next"]'); if (b) b.disabled = RS.step === 2 && !(RS.date && RS.time); }
function rsvMsg(txt) { var o = $('#resOut'); if (!txt) { o.classList.remove('on'); o.innerHTML = ''; return; } o.innerHTML = esc(txt); o.classList.remove('on'); void o.offsetWidth; o.classList.add('on'); }
function rsvFail() { rsvMsg(t('rsv.err.net')); }
function rsvEnter() {
  if (!RS.t0) RS.t0 = Date.now();
  if (!RS.cfg && !RS.loading) {
    RS.loading = true; RS.off = false; rsvRender();
    var fail = function () { if (DEMO_OK) { RS.demo = true; RS.cfg = demoCfg(); } else RS.off = true; };
    apiCall('/config').then(function (r) { if (!r.ok || !r.j || !r.j.today) throw new Error('cfg'); RS.cfg = r.j; RS.cfg.groupMin = RS.cfg.groupMin || RC.groupMin; RS.cfg.groupMax = RS.cfg.groupMax || RC.groupMax; RS.demo = false; })
      .catch(fail)
      .then(function () { RS.loading = false; if (RS.cfg) RS.ym = RS.ym || RS.cfg.today.slice(0, 7); rsvRender(RS.off); if (RS.cfg) mineLoad(); });
  } else if (RS.cfg) mineLoad();
  clearInterval(RS.timer);
  RS.timer = setInterval(function () {
    if (curView !== 'reservieren' || document.hidden) return;
    if (Object.keys(RS.mine).some(function (k) { return RS.mine[k] && RS.mine[k].status === 'pending'; })) mineLoad();
  }, 30000);
}
function rsvSubmit() {
  var f = RS.form, bad = [], chk = [['rName', f.name.trim().length > 1], ['rTel', f.tel.replace(/\D/g, '').length >= 6], ['rMail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.mail.trim())], ['rOk', f.ok]];
  chk.forEach(function (c) { var el = $('#' + c[0]); el.classList.toggle('bad', !c[1]); el.setAttribute('aria-invalid', c[1] ? 'false' : 'true'); if (!c[1]) bad.push(el); });
  if (bad.length) { rsvMsg(t('need')); bad[0].focus(); return; }
  if (RS.busy) return;
  var extra = [f.occ !== 'occ.none' ? I[f.occ][0] : '', +f.kids ? 'Kinder: ' + f.kids : '', +f.chairs ? 'Hochstühle: ' + f.chairs : ''].filter(Boolean).join(' · ');
  var body = { date: RS.date, time: RS.time, persons: RS.persons, area: RS.area, name: f.name.trim(), phone: f.tel.trim(), email: f.mail.trim(), note: [extra, f.note.trim()].filter(Boolean).join(' – '), occasion: f.occ.replace('occ.', ''), kids: +f.kids, chairs: +f.chairs, lang: LANGS[LI], consent: true, web: $('#rWeb').value, el: Date.now() - RS.t0 };
  RS.busy = true; rsvMsg(''); var btn = $('#rsvSend'); btn.disabled = true; btn.textContent = t('rsv.sending');
  var p;
  if (RS.demo) {
    var all = demoAll(), tok = 'demo-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    all[tok] = { code: 'N' + Math.random().toString(36).slice(2, 7).toUpperCase(), date: body.date, time: body.time, persons: body.persons, area: body.area, name: body.name, status: 'pending', test: true, canCancel: true };
    store('nirvana-res-demo', JSON.stringify(all));
    p = new Promise(function (res) { setTimeout(function () { res({ ok: true, status: 200, j: { ok: true, code: all[tok].code, token: tok, status: 'pending', test: true } }); }, 600); });
  } else p = apiCall('/reserve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  p.then(function (r) {
    RS.busy = false;
    if (r.ok && r.j.ok) {
      RS.done = { code: r.j.code, token: r.j.token, status: r.j.status, test: r.j.test, date: body.date, time: body.time, persons: body.persons, area: body.area, name: body.name };
      var l = mineList(); l.push({ t: r.j.token, d: body.date }); mineSave(l);
      RS.months = {}; RS.days = {}; RS.step = 4; RS.t0 = Date.now(); rsvRender(true); mineLoad();
      return;
    }
    var e = r.j && r.j.error;
    if (r.status === 409) { RS.months = {}; RS.days = {}; RS.time = ''; RS.step = 2; rsvRender(true); rsvMsg(t('rsv.err.full')); return; }
    rsvRender();
    if (r.status === 429) rsvMsg(t('rsv.err.rate'));
    else if (e === 'fields') { (r.j.fields || []).forEach(function (k) { var el = $({ name: '#rName', phone: '#rTel', email: '#rMail', consent: '#rOk' }[k] || '#x'); if (el) el.classList.add('bad'); }); rsvMsg(t('need')); }
    else rsvMsg(t('rsv.err.net'));
  }).catch(function () { RS.busy = false; rsvRender(); rsvMsg(t('rsv.err.net')); });
}
/* eigene Reservierungen dieses Geräts: Stand anzeigen, stornieren */
function mineList() { try { var a = JSON.parse(store('nirvana-res') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function mineSave(a) { store('nirvana-res', JSON.stringify(a.slice(-4))); }
function mineLoad() {
  var today = (RS.cfg && RS.cfg.today) || ymd(new Date()), list = mineList().filter(function (x) { return x && x.t && (!x.d || x.d >= today); });
  mineSave(list);
  Object.keys(RS.mine).forEach(function (k) { if (!list.some(function (x) { return x.t === k; })) delete RS.mine[k]; });
  if (!list.length) { mineRender(); return; }
  list.forEach(function (x) {
    var p = x.t.indexOf('demo-') === 0 ? Promise.resolve(demoAll()[x.t] || null) : apiCall('/r/' + x.t).then(function (r) { return r.ok ? r.j : (r.status === 404 ? null : undefined); });
    p.then(function (d) {
      if (d === null) { mineSave(mineList().filter(function (y) { return y.t !== x.t; })); delete RS.mine[x.t]; }
      else if (d) { var was = RS.mine[x.t]; RS.mine[x.t] = d; if (RS.done && RS.done.token === x.t && RS.step === 4 && (!was || was.status !== d.status)) rsvRender(); }
      mineRender();
    }).catch(function () {});
  });
}
function mineRender() {
  var box = $('#rsvMine'), keys = mineList().map(function (x) { return x.t; }).filter(function (k) { return RS.mine[k]; });
  if (!keys.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<h2 class="rsv-q sm">' + esc(t('rsv.mine')) + '</h2>' + keys.reverse().map(function (k) {
    var d = RS.mine[k], st = { seated: 'done', noshow: 'gone' }[d.status] || d.status, ask = RS.ask === k;
    return '<div class="mine s-' + st + '"><div class="mine-t"><span class="badge">' + esc(t('rsv.st.' + st)) + '</span><b>' + esc(fmtShort(d.date)) + ' · ' + esc(d.time + t('clock')) + '</b><span>' + esc(persLabel(d.persons)) + ' · ' + esc(areaLabel(d.area)) + ' · ' + esc(d.code) + (d.test ? ' · Test' : '') + '</span></div>' +
      (ask ? '<div class="mine-a"><span>' + esc(t('rsv.cancel.q')) + '</span><button type="button" class="chip" data-rsv="cancel2" data-tok="' + esc(k) + '">' + esc(t('rsv.yes')) + '</button><button type="button" class="chip" data-rsv="cancel0">' + esc(t('rsv.no')) + '</button></div>'
           : '<div class="mine-a"><button type="button" class="chip" data-rsv="refresh" aria-label="' + esc(t('rsv.refresh')) + '">' + ic('refresh') + '</button>' + (st === 'confirmed' || st === 'pending' ? '<button type="button" class="chip" data-rsv="cal" data-tok="' + esc(k) + '">' + esc(t('rsv.cal')) + '</button>' : '') + (d.canCancel ? '<button type="button" class="chip" data-rsv="cancel" data-tok="' + esc(k) + '">' + esc(t('rsv.cancel')) + '</button>' : '') + '</div>') + '</div>';
  }).join('');
}
function mineCancel(k) {
  RS.ask = '';
  if (k.indexOf('demo-') === 0) { var all = demoAll(); if (all[k]) { all[k].status = 'cancelled'; all[k].canCancel = false; store('nirvana-res-demo', JSON.stringify(all)); } mineLoad(); return; }
  apiCall('/r/' + k + '/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(function (r) { if (r.ok) RS.mine[k] = r.j; RS.months = {}; RS.days = {}; mineRender(); if (RS.step === 4 && RS.done && RS.done.token === k) rsvRender(); }).catch(function () { rsvFail(); mineRender(); });
}
function rsvIcs(k) {
  var d = RS.mine[k] || (RS.done && RS.done.token === k ? RS.done : null); if (!d) return;
  var dd = d.date.replace(/-/g, ''), tm = d.time.replace(':', '') + '00', end = pad(Math.min(23, +d.time.slice(0, 2) + 2)) + d.time.slice(3) + '00';
  var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nirvana Restaurant//Reservierung//DE', 'BEGIN:VEVENT', 'UID:' + d.code + '@nirvana', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    'DTSTART;TZID=Europe/Berlin:' + dd + 'T' + tm, 'DTEND;TZID=Europe/Berlin:' + dd + 'T' + end, 'SUMMARY:Nirvana Restaurant – ' + persLabel(d.persons), 'LOCATION:Ernst-Becker-Weg 1\\, 53894 Mechernich', 'DESCRIPTION:' + t('rsv.code') + ': ' + d.code, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'nirvana-' + d.code + '.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); } catch (e) {}
}
function setPersons(n) { RS.persons = Math.max(1, Math.min(RS.cfg ? RS.cfg.groupMax : 40, n)); rsvFix(); RS.time = ''; rsvRender(); }
function initRes() {
  var root = $('#v-reservieren');
  root.addEventListener('click', function (e) {
    var el, c = RS.cfg;
    if (!c) { if (e.target.closest('[data-rsv="retry"]')) rsvEnter(); return; }
    if ((el = e.target.closest('[data-n]'))) { setPersons(+el.getAttribute('data-n')); var b = $('#rsvPanel [data-n="' + RS.persons + '"]'); if (b) b.focus(); return; }
    if ((el = e.target.closest('[data-area]'))) { if (el.disabled) return; RS.area = el.getAttribute('data-area'); RS.time = ''; RS.months = {}; rsvRender(); var a = $('#rsvPanel [data-area="' + RS.area + '"]'); if (a) a.focus(); return; }
    if ((el = e.target.closest('[data-date]'))) { if (el.disabled) return; RS.date = el.getAttribute('data-date'); RS.time = ''; $$('#rsvCal [data-date]').forEach(function (x) { x.setAttribute('aria-pressed', x === el ? 'true' : 'false'); }); rsvTimes(true); ticket(); if (window.innerWidth < 760) { var tb = $('#rsvTimes'); window.scrollTo({ top: tb.getBoundingClientRect().top + window.pageYOffset - hhNow() - 12, behavior: reduce ? 'auto' : 'smooth' }); } return; }
    if ((el = e.target.closest('[data-time]'))) { if (el.disabled) return; RS.time = el.getAttribute('data-time'); $$('#rsvTimes [data-time]').forEach(function (x) { x.setAttribute('aria-pressed', x === el ? 'true' : 'false'); }); rsvNextBtn(); ticket(); return; }
    if (!(el = e.target.closest('[data-rsv]'))) return;
    var act = el.getAttribute('data-rsv'), tok = el.getAttribute('data-tok');
    if (act === 'next') { if (RS.step === 2 && !(RS.date && RS.time)) return; rsvMsg(''); RS.step = Math.min(3, RS.step + 1); rsvRender(true); }
    else if (act === 'back') { rsvMsg(''); RS.step = Math.max(1, RS.step - 1); rsvRender(true); }
    else if (act === 'go') { rsvMsg(''); RS.step = +el.getAttribute('data-step'); rsvRender(true); }
    else if (act === 'pm' || act === 'nm') { var y = +RS.ym.slice(0, 4), m = +RS.ym.slice(5) + (act === 'nm' ? 1 : -1); if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } RS.ym = y + '-' + pad(m); $('#rsvCal').innerHTML = calHtml(RS.months[RS.ym + '|' + rsvKey()]); rsvLoad2(); var nb = $('#rsvCal [data-rsv="' + act + '"]'); if (nb && !nb.disabled) nb.focus(); }
    else if (act === 'new') { RS.done = null; RS.step = 1; RS.date = ''; RS.time = ''; rsvRender(true); }
    else if (act === 'refresh') mineLoad();
    else if (act === 'cal') rsvIcs(tok);
    else if (act === 'cancel') { RS.ask = tok; mineRender(); var yb = $('#rsvMine [data-rsv="cancel2"]'); if (yb) yb.focus(); }
    else if (act === 'cancel0') { RS.ask = ''; mineRender(); }
    else if (act === 'cancel2') mineCancel(tok);
  });
  root.addEventListener('input', function (e) {
    var id = e.target.id, f = RS.form;
    if (id === 'rName') { f.name = e.target.value; ticket(); } else if (id === 'rTel') f.tel = e.target.value; else if (id === 'rMail') f.mail = e.target.value; else if (id === 'rNote') f.note = e.target.value; else if (id === 'rOk') f.ok = e.target.checked;
    if (e.target.classList && e.target.classList.contains('bad')) { e.target.classList.remove('bad'); e.target.setAttribute('aria-invalid', 'false'); if (!$('#rsvForm .bad')) rsvMsg(''); }
  });
  root.addEventListener('change', function (e) {
    var id = e.target.id, f = RS.form;
    if (id === 'rOk') f.ok = e.target.checked; else if (id === 'rOcc') f.occ = e.target.value; else if (id === 'rKids') f.kids = +e.target.value; else if (id === 'rChairs') f.chairs = +e.target.value;
    else if (id === 'rMore') { var v = parseInt(e.target.value, 10); if (v >= 13) { setPersons(v); var mi = $('#rMore'); if (mi) mi.focus(); } }
  });
  root.addEventListener('submit', function (e) { e.preventDefault(); rsvSubmit(); });
  root.addEventListener('keydown', function (e) {
    if (e.target.id === 'rMore' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); return; }
    var g = e.target.closest && e.target.closest('.rsv-nums'); if (!g || e.target.tagName === 'INPUT') return;
    var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0); if (!d) return;
    e.preventDefault(); var n = $('#rsvPanel [data-n="' + (RS.persons + d) + '"]'); if (n) n.click();
  });
  var m = /[?&]r=([A-Za-z0-9_-]{20,60})/.exec(location.search || '');
  if (m) { var l = mineList(); if (!l.some(function (x) { return x.t === m[1]; })) { l.push({ t: m[1], d: '' }); mineSave(l); } try { history.replaceState(null, '', location.pathname + '#reservieren'); } catch (e) { location.hash = '#reservieren'; } }
}
/* ------------------------------------------------------------------ Online-Bestellung (Abholung / Lieferung)
   Vorführ-Modus: nichts wird gesendet. Live: über das Bestellsystem (api), WhatsApp oder E-Mail – siehe config.js. */
var OC = CFG.order || { pickupMin: 25, deliveryMin: 50, stepMin: 15, lastBeforeClose: 30, delivery: [], pay: ['bar', 'karte'] };
var OS = { step: 1, mode: 'pickup', when: 'asap', day: 0, time: '', zip: '', busy: false, done: null, copied: false,
  form: { name: '', tel: '', mail: '', street: '', city: '', note: '', pay: 'bar', ok: false } };
try { var _o = JSON.parse(store('nirvana-order-form') || 'null'); if (_o) ['name', 'tel', 'mail', 'street', 'city', 'pay'].forEach(function (k) { if (typeof _o[k] === 'string') OS.form[k] = _o[k]; }); if (_o && _o.zip) OS.zip = _o.zip; } catch (e) {}
function ordItems() { return Object.keys(table).filter(function (k) { return ITEMS[k] && !ITEMS[k].inhouse; }); }
function zipArea(z) { z = String(z || '').trim(); return (OC.delivery || []).filter(function (a) { return a.zip === z; })[0] || null; }
function ordFee() { if (OS.mode !== 'delivery') return 0; var a = zipArea(OS.zip); return a ? a.fee : 0; }
function ordTotal() { return Math.round((tSum() + ordFee()) * 100) / 100; }
function ordSlots(dayOff) {
  var n = berlinNow(), wd = (n.wd + dayOff) % 7, h = hoursOf(wd), out = []; if (!h) return out;
  var lead = OS.mode === 'delivery' ? OC.deliveryMin : OC.pickupMin, step = OC.stepMin || 15;
  var start = h[0] + lead, end = h[1] - (OC.lastBeforeClose || 30);
  if (dayOff === 0) start = Math.max(start, n.min + lead);
  start = Math.ceil(start / step) * step;
  for (var m = start; m <= end; m += step) out.push(fmtMin(m));
  return out;
}
function ordAsapOk() { var n = berlinNow(), h = hoursOf(n.wd); return !!h && n.min >= h[0] && n.min + (OS.mode === 'delivery' ? OC.deliveryMin : OC.pickupMin) <= h[1] - (OC.lastBeforeClose || 30) + (OC.stepMin || 15); }
function ordSteps() {
  var names = [t('ord.s1'), t('ord.s2'), t('ord.s3')];
  $('#ordSteps').innerHTML = OS.step > 3 ? '' : names.map(function (n, i) {
    var k = i + 1, cls = k === OS.step ? 'on' : (k < OS.step ? 'done' : '');
    return '<li class="' + cls + '"' + (k === OS.step ? ' aria-current="step"' : '') + '>' + (k < OS.step ? '<button type="button" data-ord="go" data-step="' + k + '">' : '<span>') + '<i class="num">' + (k < OS.step ? ic('check') : k) + '</i><em>' + esc(n) + '</em>' + (k < OS.step ? '</button>' : '</span>') + '</li>';
  }).join('');
  $('#ordSteps').hidden = OS.step > 3;
}
function ordPanel1() {
  var ks = ordItems(), h = '<h2 class="rsv-q" tabindex="-1">' + esc(t('ord.q1')) + '</h2>';
  if (!ks.length) return h + '<div class="ord-empty"><p>' + esc(t('ord.empty')) + '</p><a class="btn" href="#speisekarte">' + esc(t('ord.tomenu')) + ic('right') + '</a></div>' + ordQuick();
  h += '<div class="ord-list">' + ks.map(function (k) {
    var it = ITEMS[k];
    return '<div class="ord-it" data-row="' + k + '">' + (it.img ? '<img src="img/xs/' + it.img + '" alt="" width="76" height="58" loading="lazy">' : '<span class="noimg">' + ic('fork') + '</span>') +
      '<div class="t"><b>' + esc(nm(it)) + '</b><small class="num">' + esc(it.p) + '</small></div>' + qtyHtml(k, true) + '<span class="price num">' + money(it.v * table[k]) + '</span></div>';
  }).join('') + '</div>';
  h += ordQuick();
  return h + '<div class="rsv-nav"><a class="btn ghost" href="#speisekarte">' + esc(t('ord.more')) + '</a><button type="button" class="btn" data-ord="next">' + esc(t('rsv.next')) + ic('right') + '</button></div>';
}
function ordQuick() {
  var ids = ['grill-8', 'nirvana-menu-0', 'vorspeisen-6', 'chefkoch-1', 'desserts-0', 'kinder-0'].filter(function (id) { return ITEMS[id] && !table[id]; }).slice(0, 4);
  if (!ids.length) return '';
  return '<div class="quick"><p class="eyebrow">' + esc(t('h.kitchen')) + '</p><div class="qgrid">' + ids.map(function (id) { var it = ITEMS[id]; return '<div class="qi">' + (it.img ? '<img src="img/xs/' + it.img + '" alt="" loading="lazy">' : '') + '<b>' + esc(nm(it)) + '</b><span class="price num">' + esc(it.p) + '</span>' + addBtn(it) + '</div>'; }).join('') + '</div></div>';
}
function ordPanel2() {
  var sub = tSum(), a = zipArea(OS.zip), h = '<h2 class="rsv-q" tabindex="-1">' + esc(t('ord.q2')) + '</h2>';
  h += '<div class="seg" role="radiogroup">' + [['pickup', 'bag', 'ord.pickup', 'ord.pickup.s'], ['delivery', 'car', 'ord.delivery', 'ord.delivery.s']].map(function (x) {
    return '<button type="button" role="radio" data-mode="' + x[0] + '" aria-checked="' + (OS.mode === x[0]) + '">' + ic(x[1]) + '<span><b>' + esc(t(x[2])) + '</b><i>' + esc(t(x[3])) + '</i></span></button>';
  }).join('') + '</div>';
  if (OS.mode === 'delivery') {
    h += '<div class="form zipbox"><label><span>' + esc(t('ord.zip.q')) + '</span><input type="text" id="oZip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="' + esc(OS.zip) + '" placeholder="53894"></label></div>';
    if (OS.zip.length === 5) h += a ? '<p class="okmsg prop-i">' + esc(fill(t('ord.zip.ok'), { n: a.name, m: money(a.min), f: money(a.fee) })) + (sub < a.min ? ' <b>' + esc(fill(t('ord.min'), { x: money(a.min - sub) })) + '</b>' : '') + '</p>' : '<p class="errmsg">' + esc(t('ord.zip.no')) + '</p>';
    h += '<p class="fine">' + esc((OC.delivery || []).map(function (x) { return x.zip + ' ' + x.name; }).join(' · ')) + '</p>';
  }
  var asap = ordAsapOk(), today = ordSlots(0), tomorrow = ordSlots(1);
  if (!asap && OS.when === 'asap') OS.when = 'later';
  if (OS.when === 'later' && OS.day === 0 && !today.length) OS.day = 1;
  var slots = OS.day ? tomorrow : today; if (OS.time && slots.indexOf(OS.time) < 0) OS.time = '';
  h += '<h3 class="rsv-q sm">' + esc(t('ord.when')) + '</h3><div class="seg sm" role="radiogroup">' +
    '<button type="button" role="radio" data-when="asap" aria-checked="' + (OS.when === 'asap') + '"' + (asap ? '' : ' disabled') + '>' + ic('clock') + '<span><b>' + esc(t('ord.asap')) + '</b><i>' + esc(fill(t('ord.asap.s'), { n: OS.mode === 'delivery' ? OC.deliveryMin : OC.pickupMin })) + '</i></span></button>' +
    '<button type="button" role="radio" data-when="later" aria-checked="' + (OS.when === 'later') + '">' + ic('cal') + '<span><b>' + esc(t('ord.later')) + '</b><i>' + esc(t('ord.today')) + ' / ' + esc(t('ord.tomorrow')) + '</i></span></button></div>';
  if (!asap && !today.length) h += '<p class="fine">' + esc(t('ord.closed')) + '</p>';
  if (OS.when === 'later') {
    h += '<div class="daytabs">' + [0, 1].map(function (d) { var s = d ? tomorrow : today; return '<button type="button" class="chip" data-day="' + d + '" aria-pressed="' + (OS.day === d) + '"' + (s.length ? '' : ' disabled') + '>' + esc(t(d ? 'ord.tomorrow' : 'ord.today')) + '</button>'; }).join('') + '</div>';
    h += '<div class="tms">' + slots.map(function (x) { return '<button type="button" class="tm" data-otime="' + x + '" aria-pressed="' + (x === OS.time) + '"><b class="num">' + x + '</b></button>'; }).join('') + '</div>';
  }
  return h + '<div class="rsv-nav"><button type="button" class="btn ghost" data-ord="back">' + esc(t('rsv.back')) + '</button><button type="button" class="btn" data-ord="next"' + (ord2Ok() ? '' : ' disabled') + '>' + esc(t('rsv.next')) + ic('right') + '</button></div>';
}
function ord2Ok() {
  if (OS.mode === 'delivery') { var a = zipArea(OS.zip); if (!a || tSum() < a.min) return false; }
  if (OS.when === 'asap') return ordAsapOk();
  return !!OS.time;
}
function ordPanel3() {
  var f = OS.form, del = OS.mode === 'delivery';
  return '<h2 class="rsv-q" tabindex="-1">' + esc(t('ord.q3')) + '</h2><div class="rsv-sum"><span>' + esc(t(del ? 'ord.delivery' : 'ord.pickup')) + '</span><span>' + esc(ordWhenLabel()) + '</span><button type="button" class="lnk" data-ord="go" data-step="2">' + esc(t('rsv.change')) + '</button></div>' +
    '<form class="form" id="ordForm" novalidate>' +
    '<label><span>' + esc(t('res.name')) + '</span><input type="text" id="oName" autocomplete="name" maxlength="80" value="' + esc(f.name) + '"></label>' +
    '<label><span>' + esc(t('res.tel')) + '</span><input type="tel" id="oTel" autocomplete="tel" inputmode="tel" maxlength="30" value="' + esc(f.tel) + '"></label>' +
    (del ? '<label class="full"><span>' + esc(t('ord.street')) + '</span><input type="text" id="oStreet" autocomplete="street-address" maxlength="120" value="' + esc(f.street) + '"></label>' +
      '<label><span>' + esc(t('ord.zip')) + '</span><input type="text" id="oZip2" value="' + esc(OS.zip) + '" disabled></label><label><span>' + esc(t('ord.city')) + '</span><input type="text" id="oCity" autocomplete="address-level2" maxlength="60" value="' + esc(f.city || (zipArea(OS.zip) || {}).name || '') + '"></label>' : '') +
    '<label class="full"><span>' + esc(t('ord.mail')) + '</span><input type="email" id="oMail" autocomplete="email" maxlength="120" value="' + esc(f.mail) + '"></label>' +
    '<label class="full"><span>' + esc(t('ord.note')) + '</span><textarea id="oNote" rows="2" maxlength="400">' + esc(f.note) + '</textarea></label>' +
    '<fieldset class="full pay"><legend>' + esc(t('ord.pay')) + '</legend>' + (OC.pay || ['bar']).map(function (p) { return '<label class="check"><input type="radio" name="oPay" value="' + p + '"' + (f.pay === p ? ' checked' : '') + '><span>' + esc(t('ord.pay.' + p)) + '</span></label>'; }).join('') + '<small>' + esc(t('ord.pay.s')) + '</small></fieldset>' +
    '<label class="hp" aria-hidden="true">Website<input type="text" id="oWeb" tabindex="-1" autocomplete="off"></label>' +
    '<label class="full check"><input type="checkbox" id="oOk"' + (f.ok ? ' checked' : '') + '><span>' + esc(t('ord.consent')) + '</span></label>' +
    '<div class="full rsv-nav"><button type="button" class="btn ghost" data-ord="back">' + esc(t('rsv.back')) + '</button><button class="btn" type="submit" id="ordSend"' + (OS.busy ? ' disabled' : '') + '>' + esc(OS.busy ? t('rsv.sending') : t(API || !CFG.demo ? 'ord.send' : 'ord.send.demo')) + '</button></div></form>';
}
function ordWhenLabel(o) {
  o = o || OS; if (o.when === 'asap') return t('ord.asap');
  return t(o.day ? 'ord.tomorrow' : 'ord.today') + ' ' + t('ord.at') + ' ' + o.time + t('clock');
}
function ordText(o) {
  var L = ['Bestellung' + (o.code ? ' ' + o.code : '') + ' – Nirvana Mechernich', (o.mode === 'delivery' ? 'Lieferung' : 'Abholung') + ', ' + o.whenDe];
  o.items.forEach(function (x) { L.push(x.q + '× ' + x.n + ' – ' + money(x.sum)); });
  if (o.fee) L.push('Liefergebühr – ' + money(o.fee));
  L.push('Gesamt: ' + money(o.total) + ' (Bezahlung: ' + (o.pay === 'karte' ? 'Karte' : 'bar') + ')');
  L.push('Name: ' + o.name + ', Tel.: ' + o.phone);
  if (o.mode === 'delivery') L.push('Adresse: ' + o.street + ', ' + o.zip + ' ' + o.city);
  if (o.note) L.push('Hinweis: ' + o.note);
  return L.join('\n');
}
function ordPanel4() {
  var d = OS.done, text = ordText(d), live = !d.demo, ch = OC.kanal;
  return '<div class="rsv-done s-pending"><div class="rsv-check" aria-hidden="true">' + ic('check') + '</div><h2 class="rsv-q" tabindex="-1">' + esc(t('ord.done.h')) + '</h2>' +
    '<p>' + esc(t('ord.done.p')) + '</p>' + (d.demo ? '<p class="fine">' + esc(t('ord.done.demo')) + '</p>' : '') +
    '<div class="rsv-code"><span>' + esc(t('ord.code')) + '</span><b class="num">' + esc(d.code) + '</b></div>' +
    '<div class="rsv-sum"><span>' + esc(t(d.mode === 'delivery' ? 'ord.delivery' : 'ord.pickup')) + '</span><span>' + esc(ordWhenLabel(d)) + '</span><span class="num">' + money(d.total) + '</span></div>' +
    '<pre class="otext" id="oText">' + esc(text) + '</pre>' +
    '<div class="rsv-nav"><button type="button" class="btn ghost" data-ord="copy">' + ic('copy') + esc(t(OS.copied ? 'ord.copied' : 'ord.copy')) + '</button>' +
    (live && ch === 'whatsapp' && CFG.whatsapp ? '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(CFG.whatsapp) + '?text=' + encodeURIComponent(text) + '">' + esc(t('ord.wa')) + '</a>' : '') +
    (live && ch === 'mail' ? '<a class="btn" href="mailto:' + esc(CFG.mail) + '?subject=' + encodeURIComponent('Bestellung ' + d.code) + '&body=' + encodeURIComponent(text) + '">' + esc(t('ord.mailto')) + '</a>' : '') +
    '<button type="button" class="btn ghost" data-ord="new">' + esc(t('ord.new')) + '</button></div></div>';
}
function ordBon() {
  var ks = ordItems(), sub = tSum(), fee = ordFee(), h = '<div class="bon-in"><img class="script" src="img/logo-script.png" alt="Nirvana" width="738" height="200"><p class="meta">Ernst-Becker-Weg 1 · 53894 Mechernich</p><hr><p class="sec">' + esc(t('ord.bon.h')) + '</p>';
  if (OS.done) { ks = OS.done.items.map(function (x) { return x; }); }
  if (!ks.length) h += '<p class="empty">' + esc(t('ord.bon.e')) + '</p>';
  else if (OS.done) OS.done.items.forEach(function (x) { h += '<div class="ln"><span>' + x.q + '× ' + esc(x.n) + '</span><span class="num">' + money(x.sum) + '</span></div>'; });
  else ks.forEach(function (k) { var it = ITEMS[k]; h += '<div class="ln"><span>' + table[k] + '× ' + esc(nm(it)) + '</span><span class="num">' + money(it.v * table[k]) + '</span></div>'; });
  var dsub = OS.done ? OS.done.sub : sub, dfee = OS.done ? OS.done.fee : fee, mode = OS.done ? OS.done.mode : OS.mode;
  h += '<hr><div class="ln"><span>' + esc(t('ord.sub')) + '</span><span class="num">' + money(dsub) + '</span></div>';
  if (mode === 'delivery') h += '<div class="ln"><span>' + esc(t('ord.fee')) + '</span><span class="num">' + (zipArea(OS.done ? OS.done.zip : OS.zip) ? money(dfee) : '–') + '</span></div>';
  h += '<div class="ln tot"><span>' + esc(t('ord.total')) + '</span><span class="num">' + money(dsub + dfee) + '</span></div>';
  h += '<p class="when">' + esc(t(mode === 'delivery' ? 'ord.delivery' : 'ord.pickup')) + ' · ' + esc(ordWhenLabel(OS.done || OS)) + '</p></div>';
  $('#ordBon').innerHTML = h;
}
function ordMsg(txt) { var o = $('#ordOut'); if (!txt) { o.classList.remove('on'); o.innerHTML = ''; return; } o.innerHTML = esc(txt); o.classList.remove('on'); void o.offsetWidth; o.classList.add('on'); }
function ordRender(focus) {
  if (!$('#ordPanel')) return;
  if (OS.step > 1 && OS.step < 4 && !ordItems().length) OS.step = 1;
  ordSteps();
  var n = $('#ordNote'); n.hidden = !(CFG.demo !== false || !API); n.textContent = t('rsv.demo');
  $('#ordPanel').innerHTML = OS.step === 1 ? ordPanel1() : OS.step === 2 ? ordPanel2() : OS.step === 3 ? ordPanel3() : ordPanel4();
  ordBon(); renderTable();
  if (focus) { var h = $('#ordPanel .rsv-q'); if (h) { try { h.focus({ preventScroll: true }); } catch (e) {} } var y = $('#ordSteps').getBoundingClientRect().top + window.pageYOffset - hhNow() - 18; if (window.pageYOffset > y) window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }
}
function ordSubmit() {
  var f = OS.form, del = OS.mode === 'delivery', bad = [];
  var chk = [['oName', f.name.trim().length > 1], ['oTel', f.tel.replace(/\D/g, '').length >= 6], ['oOk', f.ok]];
  if (f.mail.trim()) chk.push(['oMail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.mail.trim())]);
  if (del) chk.push(['oStreet', f.street.trim().length > 3], ['oCity', (f.city || '').trim().length > 1]);
  chk.forEach(function (c) { var el = $('#' + c[0]); if (!el) return; el.classList.toggle('bad', !c[1]); el.setAttribute('aria-invalid', c[1] ? 'false' : 'true'); if (!c[1]) bad.push(el); });
  if (bad.length) { ordMsg(t('need')); bad[0].focus(); return; }
  if (OS.busy) return;
  store('nirvana-order-form', JSON.stringify({ name: f.name, tel: f.tel, mail: f.mail, street: f.street, city: f.city, pay: f.pay, zip: OS.zip }));
  var items = ordItems().map(function (k) { var it = ITEMS[k]; return { id: k, n: (it.no ? it.no + '. ' : '') + it.nm, q: table[k], sum: Math.round(it.v * table[k] * 100) / 100 }; });
  var o = { code: 'B' + Math.random().toString(36).slice(2, 6).toUpperCase(), mode: OS.mode, when: OS.when, day: OS.day, time: OS.time, whenDe: OS.when === 'asap' ? 'so schnell wie möglich' : (OS.day ? 'morgen' : 'heute') + ' um ' + OS.time + ' Uhr',
    items: items, sub: tSum(), fee: ordFee(), total: ordTotal(), name: f.name.trim(), phone: f.tel.trim(), email: f.mail.trim(), street: f.street.trim(), zip: OS.zip, city: (f.city || '').trim(), note: f.note.trim(), pay: f.pay, lang: LANGS[LI], web: $('#oWeb').value, demo: true };
  var live = CFG.demo === false && !!API, ch = OC.kanal, p;
  OS.busy = true; ordMsg('');
  if (live && ch === 'api') { o.demo = false; p = apiCall('/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) }).then(function (r) { if (!r.ok || !r.j.ok) throw new Error('order'); o.code = r.j.code || o.code; return o; }); }
  else if (CFG.demo === false && (ch === 'whatsapp' || ch === 'mail')) { o.demo = false; p = Promise.resolve(o); }
  else { var all = []; try { all = JSON.parse(store('nirvana-orders-demo') || '[]'); } catch (e) {} all.push({ code: o.code, at: Date.now(), total: o.total, mode: o.mode }); store('nirvana-orders-demo', JSON.stringify(all.slice(-10))); p = new Promise(function (res) { setTimeout(function () { res(o); }, 600); }); }
  p.then(function (d) { OS.busy = false; OS.done = d; OS.step = 4; OS.copied = false; table = {}; saveT(); syncAdds(); ordRender(true); })
   .catch(function () { OS.busy = false; ordRender(); ordMsg(t('rsv.err.net')); });
}
function copyText(txt, done) {
  function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
}
function initOrder() {
  var root = $('#v-bestellen');
  root.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-mode]'))) { OS.mode = el.getAttribute('data-mode'); OS.time = ''; ordRender(); var b = $('#ordPanel [data-mode="' + OS.mode + '"]'); if (b) b.focus(); return; }
    if ((el = e.target.closest('[data-when]'))) { if (el.disabled) return; OS.when = el.getAttribute('data-when'); ordRender(); var w = $('#ordPanel [data-when="' + OS.when + '"]'); if (w) w.focus(); return; }
    if ((el = e.target.closest('[data-day]'))) { if (el.disabled) return; OS.day = +el.getAttribute('data-day'); OS.time = ''; ordRender(); return; }
    if ((el = e.target.closest('[data-otime]'))) { OS.time = el.getAttribute('data-otime'); $$('#ordPanel [data-otime]').forEach(function (x) { x.setAttribute('aria-pressed', x === el ? 'true' : 'false'); }); var nb = $('#ordPanel [data-ord="next"]'); if (nb) nb.disabled = !ord2Ok(); ordBon(); return; }
    if (!(el = e.target.closest('[data-ord]'))) return;
    var act = el.getAttribute('data-ord');
    if (act === 'next') { if (OS.step === 2 && !ord2Ok()) return; ordMsg(''); OS.step = Math.min(3, OS.step + 1); ordRender(true); }
    else if (act === 'back') { ordMsg(''); OS.step = Math.max(1, OS.step - 1); ordRender(true); }
    else if (act === 'go') { ordMsg(''); OS.step = +el.getAttribute('data-step'); ordRender(true); }
    else if (act === 'new') { OS.done = null; OS.step = 1; OS.time = ''; OS.when = 'asap'; ordRender(true); }
    else if (act === 'copy') { copyText(ordText(OS.done), function () { OS.copied = true; ordRender(); }); }
  });
  root.addEventListener('input', function (e) {
    var id = e.target.id, f = OS.form;
    if (id === 'oZip') { OS.zip = e.target.value.replace(/\D/g, '').slice(0, 5); if (OS.zip.length === 5 || e.target.value === '') { var pos = e.target.selectionStart; ordRender(); var z = $('#oZip'); if (z) { z.focus(); try { z.setSelectionRange(pos, pos); } catch (x) {} } } return; }
    var map = { oName: 'name', oTel: 'tel', oMail: 'mail', oStreet: 'street', oCity: 'city', oNote: 'note' };
    if (map[id]) f[map[id]] = e.target.value;
    if (e.target.classList && e.target.classList.contains('bad')) { e.target.classList.remove('bad'); e.target.setAttribute('aria-invalid', 'false'); if (!$('#ordForm .bad')) ordMsg(''); }
  });
  root.addEventListener('change', function (e) { if (e.target.id === 'oOk') OS.form.ok = e.target.checked; else if (e.target.name === 'oPay') OS.form.pay = e.target.value; });
  root.addEventListener('submit', function (e) { e.preventDefault(); ordSubmit(); });
}

/* ------------------------------------------------------------------ Anfragen: Feier und Kindergeburtstag */
var REQ = { feier: { occ: 'occ.wed', pkg: '' }, kids: { pkg: 'k1' } };
function isoPlus(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
function reqFields(kind) {
  var r = REQ[kind], h = '';
  if (kind === 'feier') {
    h += '<label><span>' + esc(t('rq.occ')) + '</span><select name="occ">' + EV_OCC.map(function (k) { return '<option value="' + k + '"' + (r.occ === k ? ' selected' : '') + '>' + esc(t(k)) + '</option>'; }).join('') + '</select></label>';
    h += '<label><span>' + esc(t('rq.date')) + '</span><input type="date" name="date" min="' + isoPlus(7) + '" required></label>';
    h += '<label><span>' + esc(t('rq.guests')) + '</span><input type="number" name="guests" min="10" max="275" inputmode="numeric" placeholder="80" required></label>';
    h += '<label><span>' + esc(t('rq.pkg')) + '</span><select name="pkg"><option value="">' + esc(t('rq.pkg.open')) + '</option>' + EV_PKGS.map(function (p) { return '<option value="' + p.id + '"' + (r.pkg === p.id ? ' selected' : '') + '>' + esc(L3(p.n)) + ' · ' + p.p + ' € ' + esc(t('ev.pp')) + '</option>'; }).join('') + '</select></label>';
    h += '<label class="full check"><input type="checkbox" name="deko"><span>' + esc(t('rq.deko')) + '</span></label>';
  } else {
    h += '<label><span>' + esc(t('rq.date')) + '</span><input type="date" name="date" min="' + isoPlus(3) + '" required></label>';
    h += '<label><span>' + esc(t('rq.time')) + '</span><select name="time">' + ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></label>';
    h += '<label><span>' + esc(t('rq.kids')) + '</span><input type="number" name="kids" min="6" max="30" inputmode="numeric" placeholder="8" required></label>';
    h += '<label><span>' + esc(t('rq.age')) + '</span><input type="number" name="age" min="1" max="14" inputmode="numeric" placeholder="6"></label>';
    h += '<label class="full"><span>' + esc(t('rq.pkg')) + '</span><select name="pkg">' + K_PKGS.map(function (p) { return '<option value="' + p.id + '"' + (r.pkg === p.id ? ' selected' : '') + '>' + esc(L3(p.n)) + ' · ' + money(p.p) + ' ' + esc(t('k.per')) + '</option>'; }).join('') + '</select></label>';
  }
  h += '<label><span>' + esc(t('rq.name')) + '</span><input type="text" name="name" autocomplete="name" maxlength="80" required></label>';
  h += '<label><span>' + esc(t('rq.tel')) + '</span><input type="tel" name="tel" autocomplete="tel" inputmode="tel" maxlength="30" required></label>';
  h += '<label class="full"><span>' + esc(t('rq.mail')) + '</span><input type="email" name="mail" autocomplete="email" maxlength="120"></label>';
  h += '<label class="full"><span>' + esc(t('rq.msg')) + '</span><textarea name="msg" rows="3" maxlength="800"></textarea></label>';
  h += '<label class="hp" aria-hidden="true">Website<input type="text" name="web" tabindex="-1" autocomplete="off"></label>';
  h += '<label class="full check"><input type="checkbox" name="ok"><span>' + esc(t('rq.consent')) + '</span></label>';
  h += '<div class="full rsv-nav"><button class="btn" type="submit">' + esc(t('rq.send')) + '</button></div>';
  return h;
}
function reqRender(kind) {
  var f = $(kind === 'feier' ? '#evReq' : '#kReq'); if (!f) return;
  var keep = {}; $$('input,select,textarea', f).forEach(function (el) { if (el.name) keep[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
  f.innerHTML = reqFields(kind);
  $$('input,select,textarea', f).forEach(function (el) { if (el.name && keep[el.name] !== undefined) { if (el.type === 'checkbox') el.checked = keep[el.name]; else if (keep[el.name] !== '') el.value = keep[el.name]; } });
}
function reqSubmit(form) {
  var kind = form.getAttribute('data-kind'), v = {}, bad = [], out = $(kind === 'feier' ? '#evOut' : '#kOut');
  $$('input,select,textarea', form).forEach(function (el) { if (el.name) v[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
  var need = kind === 'feier' ? [['date', !!v.date], ['guests', +v.guests >= 10], ['name', v.name.length > 1], ['tel', v.tel.replace(/\D/g, '').length >= 6], ['ok', v.ok]]
                              : [['date', !!v.date], ['kids', +v.kids >= 1], ['name', v.name.length > 1], ['tel', v.tel.replace(/\D/g, '').length >= 6], ['ok', v.ok]];
  if (v.mail) need.push(['mail', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.mail)]);
  need.forEach(function (c) { var el = form.querySelector('[name="' + c[0] + '"]'); el.classList.toggle('bad', !c[1]); el.setAttribute('aria-invalid', c[1] ? 'false' : 'true'); if (!c[1]) bad.push(el); });
  if (bad.length) { out.innerHTML = esc(t('need')); out.classList.remove('on'); void out.offsetWidth; out.classList.add('on'); bad[0].focus(); return; }
  var pk = kind === 'feier' ? EV_PKGS.filter(function (p) { return p.id === v.pkg; })[0] : K_PKGS.filter(function (p) { return p.id === v.pkg; })[0];
  var txt = [(kind === 'feier' ? 'Feier-Anfrage' : 'Kindergeburtstag') + ' – Nirvana Mechernich', 'Datum: ' + v.date + (v.time ? ', ' + v.time + ' Uhr' : ''),
    kind === 'feier' ? 'Anlass: ' + I[v.occ][0] + ', Gäste: ' + v.guests : 'Kinder: ' + v.kids + (v.age ? ', Alter: ' + v.age : ''),
    'Paket: ' + (pk ? pk.n[0] : 'noch offen') + (v.deko ? ', mit Deko' : ''), 'Name: ' + v.name + ', Tel.: ' + v.tel + (v.mail ? ', ' + v.mail : ''), v.msg ? 'Nachricht: ' + v.msg : ''].filter(Boolean).join('\n');
  var live = CFG.demo === false && !!API;
  var p = live ? apiCall('/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: kind, data: v, text: txt, lang: LANGS[LI] }) }) : Promise.resolve({ ok: true, demo: true });
  p.then(function (r) {
    out.innerHTML = '<b>' + esc(fill(t('rq.done'), { n: v.name.split(' ')[0] })) + '</b>' + (r.demo ? '<br><small>' + esc(t('rq.demo')) + '</small>' : '') + '<pre class="otext">' + esc(txt) + '</pre>';
    out.classList.remove('on'); void out.offsetWidth; out.classList.add('on');
    if (r.demo) { var all = []; try { all = JSON.parse(store('nirvana-req-demo') || '[]'); } catch (e) {} all.push({ kind: kind, at: Date.now() }); store('nirvana-req-demo', JSON.stringify(all.slice(-10))); }
    form.reset();
  }).catch(function () { out.innerHTML = esc(t('rsv.err.net')); out.classList.add('on'); });
}
function renderEvents() {
  $('#evOcc').innerHTML = EV_OCC.slice(0, 7).map(function (k) { return '<span class="chip static">' + esc(t(k)) + '</span>'; }).join('');
  $('#evPkgs').innerHTML = EV_PKGS.map(function (p) {
    return '<article class="pkg prop" data-rv><div class="pimg"><img src="img/s/' + p.img + '.webp" alt="" loading="lazy"></div><div class="pt"><h3>' + esc(L3(p.n)) + '</h3><p class="pp"><b class="price num">' + p.p + ' €</b> ' + esc(t('ev.pp')) + ' <small>' + esc(fill(t('ev.from'), { n: p.min })) + '</small></p><ul>' + L3(p.d).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><button type="button" class="btn ghost sm" data-evpkg="' + p.id + '">' + esc(t('ev.choose')) + '</button></div></article>';
  }).join('');
  reqRender('feier');
}
function renderKids() {
  var ks = (secById['kinder'] || { items: [] }).items.concat([(secById['fruhstuck'] || { items: [] }).items[1]]).filter(Boolean);
  $('#kMenu').innerHTML = '<h2 class="rsv-q sm">' + esc(t('k.menu')) + '</h2>' + ks.map(function (it) {
    return '<div class="krow" data-item="' + it.id + '">' + (it.img ? '<img src="img/xs/' + it.img + '" alt="" loading="lazy">' : '<span class="noimg">' + ic('kid') + '</span>') + '<div class="t"><b>' + esc(nm(it)) + '</b><small>' + esc(ds(it)) + '</small></div><span class="price num">' + esc(it.p) + '</span>' + addBtn(it) + '</div>';
  }).join('');
  $('#kFam').innerHTML = K_FAM.map(function (f) { return '<div class="fi" data-rv>' + ic(f.i) + '<b>' + esc(L3(f.n)) + '</b><p>' + esc(L3(f.d)) + '</p></div>'; }).join('');
  $('#kPkgs').innerHTML = K_PKGS.map(function (p) {
    return '<article class="pkg prop" data-rv><div class="pimg"><img src="img/s/' + p.img + '.webp" alt="" loading="lazy"></div><div class="pt"><h3>' + esc(L3(p.n)) + '</h3><p class="pp"><b class="price num">' + money(p.p) + '</b> ' + esc(t('k.per')) + ' <small>' + esc(fill(t('k.min'), { n: p.min })) + '</small></p><ul>' + L3(p.d).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><button type="button" class="btn ghost sm" data-kpkg="' + p.id + '">' + esc(t('ev.choose')) + '</button></div></article>';
  }).join('');
  reqRender('kids');
}
function initReq() {
  ['#evReq', '#kReq'].forEach(function (s) {
    var f = $(s);
    f.addEventListener('submit', function (e) { e.preventDefault(); reqSubmit(f); });
    f.addEventListener('input', function (e) { if (e.target.classList.contains('bad')) { e.target.classList.remove('bad'); e.target.setAttribute('aria-invalid', 'false'); } });
  });
}
var privacyDone = false;
function renderPrivacy() { if (privacyDone) return; privacyDone = true; $('#privacyText').innerHTML = window.NIRVANA_PRIVACY || ''; }
/* ------------------------------------------------------------------ Gutschein */
var amt = 50;
function updGift() {
  $('#vAmt').textContent = amt + ' €';
  $('#gBtn').textContent = t('pay') + ' (' + amt + ' €)';
  var f = $('#gFor').value.trim(), m = $('#gMsg').value.trim(), fr = $('#gFrom').value.trim(), parts = [];
  if (f) parts.push(t('for_') + ' ' + f);
  if (m) parts.push(m);
  if (fr) parts.push(t('from_') + ' ' + fr);
  $('#vMsg').textContent = parts.join(' · ') || t('gift.card');
  $('#amounts').setAttribute('aria-label', t('amount'));
}
function initGift() {
  var a = $('#amounts');
  a.innerHTML = [25, 50, 100, 150, 200].map(function (v) { return '<button type="button" data-a="' + v + '" aria-pressed="' + (v === 50) + '">' + v + ' €</button>'; }).join('');
  a.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    amt = +b.getAttribute('data-a'); $('#gOwn').value = '';
    $$('[data-a]', a).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    updGift();
  });
  $('#gOwn').addEventListener('input', function () {
    var v = Math.floor(+this.value);
    if (v >= 10 && v <= 5000) { amt = v; $$('[data-a]', a).forEach(function (x) { x.setAttribute('aria-pressed', +x.getAttribute('data-a') === v ? 'true' : 'false'); }); updGift(); }
  });
  ['gFor', 'gMsg', 'gFrom'].forEach(function (id) { $('#' + id).addEventListener('input', updGift); });
  $('#giftForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('#giftOut'); o.innerHTML = '<b class="num">' + amt + ' €</b> · ' + esc(t('demoG'));
    o.classList.remove('on'); void o.offsetWidth; o.classList.add('on');
  });
}

/* ------------------------------------------------------------------ Sprache anwenden */
function splitWords() {
  var h = $('#heroH'); if (!h || reduce) return;
  var i = 0;
  h.innerHTML = h.innerHTML.replace(/(<em>.*?<\/em>)|([^\s<]+)/g, function (m) { return '<span class="w" style="animation-delay:' + (0.09 * i++).toFixed(2) + 's">' + m + '</span>'; });
}
function applyLang() {
  document.documentElement.lang = LANGS[LI];
  $$('[data-i]').forEach(function (el) { var v = I[el.getAttribute('data-i')]; if (v) el.innerHTML = v[LI]; });
  $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === LANGS[LI] ? 'true' : 'false'); });
  $('#q').placeholder = t('m.ph');
  $('#burger').setAttribute('aria-label', t('menuBtn'));
  $('#drawerX').setAttribute('aria-label', t('close'));
  $('#totop').setAttribute('aria-label', t('totop')); $('#findBtn').setAttribute('aria-label', t('m.search'));
  splitWords(); renderBelt(); renderGroups(); renderMenu(); renderShow(); renderCats(); renderBands(); renderTable(); setStatus(); updGift(); rsvRender(); mineRender(); vidLabel();
  renderEvents(); renderKids(); ordRender();
  if (modalId) openItem(modalId);
  setupReveal();
}

/* ------------------------------------------------------------------ Navigation zwischen den Ansichten */
var VIEWS = ['start', 'speisekarte', 'bestellen', 'reservieren', 'feiern', 'kids', 'gutschein', 'ueber-uns', 'kontakt', 'impressum', 'datenschutz'], pendingGroup = null, curView = null, pendingJump = null;
function navOpen(o) {
  $('#nav').classList.toggle('open', o); $('#burger').setAttribute('aria-expanded', o ? 'true' : 'false');
  document.documentElement.style.overflow = o ? 'hidden' : '';
}
function scrollToGroup(id, smooth) {
  var el = document.getElementById(id); if (!el) return;
  var y = el.getBoundingClientRect().top + window.pageYOffset - (barsH() + 6);
  window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce ? 'smooth' : 'auto' });
}
function scrollToEl(id, smooth) {
  var el = document.getElementById(id); if (!el) return;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - hhNow() - 10), behavior: smooth && !reduce ? 'smooth' : 'auto' });
}
function route() {
  var h = (location.hash || '').replace('#', ''), jump = null;
  if (h === 'feier-anfrage') { h = 'feiern'; jump = 'evForm'; }
  if (h === 'kindergeburtstag') { h = 'kids'; jump = 'kForm'; }
  if (VIEWS.indexOf(h) < 0) h = 'start';
  navOpen(false);
  if (h !== curView) {
    curView = h;
    VIEWS.forEach(function (v) { var el = document.getElementById('v-' + v); if (el) el.classList.toggle('on', v === h); });
    $$('nav.main a').forEach(function (a) { var on = a.getAttribute('href') === '#' + h; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
  }
  setHH(); setupReveal(); onScroll(); renderTable();
  if (h === 'speisekarte' && pendingGroup) { var g = pendingGroup; pendingGroup = null; setTimeout(function () { scrollToGroup(g, false); onScroll(); }, 60); }
  if (h === 'start' && beltPending) renderBelt();
  if (h === 'reservieren') rsvEnter();
  if (h === 'bestellen') { if (OS.step === 4 && !OS.done) OS.step = 1; ordRender(); drawer(false); }
  if (h === 'datenschutz') renderPrivacy();
  if (jump || pendingJump) { var j = jump || pendingJump; pendingJump = null; setTimeout(function () { scrollToEl(j, false); }, 80); }
  slidesRun();
}

/* ------------------------------------------------------------------ Bewegung */
var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px' }) : null;
function setupReveal() {
  if (!io || reduce) return;
  $$('.view.on [data-rv]:not([data-o])').forEach(function (el) {
    el.setAttribute('data-o', '1');
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) io.observe(el);
  });
}
function hhNow() { return $('#top').offsetHeight; }
function barsH() { var f = $('#fbar'); return hhNow() + $('#mbar').offsetHeight + (getComputedStyle(f).position === 'sticky' ? f.offsetHeight : 0); }
function setHH() { var d = document.documentElement.style; d.setProperty('--hh', hhNow() + 'px'); d.setProperty('--gh', $('#mbar').offsetHeight + 'px'); }
var ticking = false, lastY = 0;
function onScroll() {
  var d = document.documentElement, y = window.pageYOffset, max = d.scrollHeight - window.innerHeight;
  $('#prog').style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
  $('#top').classList.toggle('scrolled', y > 30);
  $('#totop').classList.toggle('on', y > 900 && y < lastY - 2 || (y > 900 && $('#totop').classList.contains('on') && y <= lastY)); lastY = y;
  if (curView === 'speisekarte') {
    var cur = null, line = barsH() + 40;
    GROUPS.forEach(function (g) { var el = document.getElementById(g.id); if (el && el.getBoundingClientRect().top < line) cur = g.id; });
    if (!cur) { var first = $('#menu .msec'); cur = first ? first.id : 'g1'; }
    $$('#groups button').forEach(function (b) {
      var on = b.getAttribute('data-g') === cur;
      if (on && b.getAttribute('aria-current') !== 'true') { var box = $('#groups'); box.scrollLeft = b.offsetLeft - (box.clientWidth - b.offsetWidth) / 2; }
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }
  if (!reduce) {
    $$('.view.on [data-par] img').forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      img.style.setProperty('--pp', (-p * 7).toFixed(2) + '%');
    });
    if (curView === 'start') { var sy = Math.min(y, 900); $$('#stage .float').forEach(function (f) { f.style.setProperty('--py', (-(sy * (+f.getAttribute('data-depth')) / 420)).toFixed(1) + 'px'); }); }
  }
  ticking = false;
}
window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
window.addEventListener('resize', function () { setHH(); onScroll(); });
function counters() {
  if (reduce || !('IntersectionObserver' in window)) return;
  var done = false, box = $('#facts');
  var ob = new IntersectionObserver(function (es) {
    if (done || !es[0].isIntersecting) return; done = true; ob.disconnect();
    $$('[data-count]', box).forEach(function (el) {
      var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
      function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1500); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  ob.observe(box);
}
/* Lichtpunkte wie Glitzern auf dem See (statt Glut bei Leonn) */
function embers() {
  var c = $('#embers'); if (!c || reduce) return;
  var x = c.getContext('2d'), P = [], W = 0, H = 0, i;
  function size() { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; }
  function nw(any) { return { x: W * (0.3 + Math.random() * 0.7), y: any ? Math.random() * H : H + 10, r: Math.random() * 1.5 + 0.4, vy: Math.random() * 0.32 + 0.1, vx: (Math.random() - 0.5) * 0.25, a: Math.random() * 0.6 + 0.2, ph: Math.random() * 6.28 }; }
  size(); window.addEventListener('resize', size);
  for (i = 0; i < 46; i++) P.push(nw(true));
  (function tick(ts) {
    if (curView === 'start' && !document.hidden && window.pageYOffset < H + 200) {
      x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
      for (i = 0; i < P.length; i++) {
        var p = P[i]; p.y -= p.vy; p.x += p.vx + Math.sin(ts / 1400 + p.ph) * 0.25; if (p.y < -10) P[i] = nw(false);
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28);
        x.fillStyle = 'rgba(190,240,228,' + (p.a * (0.55 + 0.45 * Math.sin(ts / 520 + p.ph))).toFixed(3) + ')';
        x.shadowBlur = 12; x.shadowColor = 'rgba(140,220,205,.9)'; x.fill();
      }
    }
    requestAnimationFrame(tick);
  })(0);
}
function pointerFx() {
  if (reduce) return;
  var stage = $('#stage'), hero = stage && stage.closest('.hero');
  if (hero) hero.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = hero.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5;
    $$('.float', stage).forEach(function (f) { f.style.setProperty('--px', (dx * (+f.getAttribute('data-depth'))).toFixed(1) + 'px'); });
  });
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var el = e.target.closest ? e.target.closest('.card,.tilt') : null;
    $$('.tilting').forEach(function (x) { if (x !== el) { x.classList.remove('tilting'); x.style.transform = ''; } });
    if (!el) return;
    var r = el.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5, k = el.classList.contains('tilt') ? 11 : 7;
    el.classList.add('tilting');
    el.style.transform = 'perspective(900px) rotateY(' + (dx * k).toFixed(2) + 'deg) rotateX(' + (-dy * k).toFixed(2) + 'deg)' + (el.classList.contains('card') ? ' translateY(-6px)' : '');
  });
}
/* Bilder im Bogenfenster (statt Grill-Video) */
var vidPaused = false, slideTimer = null, slideI = 0;
function vidLabel() {
  var b = $('#vidToggle'); if (!b) return;
  b.setAttribute('aria-label', t(vidPaused ? 'playV' : 'pauseV')); b.setAttribute('aria-pressed', vidPaused ? 'true' : 'false');
  b.innerHTML = ic(vidPaused ? 'play' : 'pause');
}
function slidesRun() {
  clearInterval(slideTimer);
  if (reduce || vidPaused || curView !== 'start') return;
  slideTimer = setInterval(function () {
    if (document.hidden) return;
    var imgs = $$('#heroSlides img'); if (!imgs.length) return;
    imgs[slideI].classList.remove('on'); slideI = (slideI + 1) % imgs.length; imgs[slideI].classList.add('on');
  }, 5200);
}
function initVideo() {
  var b = $('#vidToggle'); if (!b) return;
  if (reduce) vidPaused = true;
  b.addEventListener('click', function () { vidPaused = !vidPaused; vidLabel(); slidesRun(); });
  vidLabel();
}

/* ------------------------------------------------------------------ Ereignisse */
document.addEventListener('click', function (e) {
  var tg = e.target, el;
  if ((el = tg.closest('[data-add]'))) { var id = el.getAttribute('data-add'); addT(id, table[id] ? -table[id] : 1); return; }
  if ((el = tg.closest('[data-q]'))) { var qid = el.getAttribute('data-id'), qd = el.getAttribute('data-q'); addT(qid, parseInt(qd, 10)); var keep = $('#tItems [data-row="' + qid + '"] [data-q="' + qd + '"]') || $('#ordPanel [data-row="' + qid + '"] [data-q="' + qd + '"]'); if (keep && el.closest('#drawer,#ordPanel')) keep.focus(); return; }
  if ((el = tg.closest('[data-mnav]'))) { modalStep(parseInt(el.getAttribute('data-mnav'), 10)); return; }
  if ((el = tg.closest('[data-close]'))) { closeItem(); return; }
  if ((el = tg.closest('[data-open]'))) {
    var list = el.hasAttribute('data-belt') ? $('#belt').beltIds : (tg.closest('#menu') ? visible.slice() : null);
    openItem(el.getAttribute('data-open'), list); return;
  }
  if ((el = tg.closest('[data-zoom]'))) { var im = el.querySelector('img'); openPhoto(el.getAttribute('data-zoom'), im ? im.alt : ''); return; }
  if ((el = tg.closest('[data-evpkg]'))) { REQ.feier.pkg = el.getAttribute('data-evpkg'); reqRender('feier'); var s1 = $('#evReq [name="pkg"]'); if (s1) s1.value = REQ.feier.pkg; scrollToEl('evForm', true); return; }
  if ((el = tg.closest('[data-kpkg]'))) { REQ.kids.pkg = el.getAttribute('data-kpkg'); reqRender('kids'); var s2 = $('#kReq [name="pkg"]'); if (s2) s2.value = REQ.kids.pkg; scrollToEl('kForm', true); return; }
  if ((el = tg.closest('[data-jump]'))) { e.preventDefault(); scrollToEl(el.getAttribute('data-jump'), true); return; }
  if ((el = tg.closest('[data-g]'))) { scrollToGroup(el.getAttribute('data-g'), true); return; }
  if ((el = tg.closest('[data-go]'))) { goGroup(el.getAttribute('data-go')); return; }
  if ((el = tg.closest('[data-f]'))) {
    filter = el.getAttribute('data-f');
    $$('[data-f]').forEach(function (c) { c.setAttribute('aria-pressed', c === el ? 'true' : 'false'); });
    renderMenu(); return;
  }
  if ((el = tg.closest('[data-show]'))) { showGo(parseInt(el.getAttribute('data-show'), 10)); return; }
  if ((el = tg.closest('[data-lang]'))) { LI = Math.max(0, LANGS.indexOf(el.getAttribute('data-lang'))); store('nirvana-lang', LANGS[LI]); applyLang(); return; }
  if (tg === $('#veil')) { closeItem(); return; }
});
function goGroup(g) {
  if (curView === 'speisekarte') { scrollToGroup(g, true); return; }
  pendingGroup = g; location.hash = '#speisekarte';
}
document.addEventListener('keydown', function (e) {
  var modalOn = $('#veil').classList.contains('on'), drawerOn = $('#drawer').classList.contains('on');
  if (e.key === 'Escape') { if (modalOn) closeItem(); else if (drawerOn) drawer(false); else if ($('#nav').classList.contains('open')) navOpen(false); return; }
  if (modalOn) {
    if (e.key === 'ArrowLeft' && modalId) { modalStep(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && modalId) { modalStep(1); e.preventDefault(); }
    else if (e.key === 'Tab') trap(e, $('#modal'));
  } else if (drawerOn && e.key === 'Tab') trap(e, $('#drawer'));
});
function init() {
  var sl = store('nirvana-lang'); if (sl && LANGS.indexOf(sl) >= 0) LI = LANGS.indexOf(sl);
  $('#q').addEventListener('input', function () { query = this.value.trim(); renderMenu(); });
  $('#fab').addEventListener('click', function () { drawer(true); });
  $('#drawerX').addEventListener('click', function () { drawer(false); });
  $('#tOrder').addEventListener('click', function () { drawer(false); });
  $('#tClear').addEventListener('click', function () { table = {}; saveT(); renderTable(); syncAdds(); if (curView === 'bestellen') ordRender(); });
  $('#burger').addEventListener('click', function () { navOpen(!$('#nav').classList.contains('open')); });
  $('#totop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  $('#skip').addEventListener('click', function (e) { e.preventDefault(); $('#main').focus(); });
  $('#findBtn').addEventListener('click', function () {
    var f = $('#fbar'), y = f.getBoundingClientRect().top + window.pageYOffset - (hhNow() + $('#mbar').offsetHeight);
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); $('#q').focus();
  });
  $('#showPrev').addEventListener('click', function () { showGo(showI - 1); });
  $('#showNext').addEventListener('click', function () { showGo(showI + 1); });
  $('#showOpen').addEventListener('click', function () { openItem(SHOW[showI], SHOW.slice()); });
  $('#showImg').addEventListener('click', function () { openItem(SHOW[showI], SHOW.slice()); });
  var sh = $('#show'), sx = null;
  sh.addEventListener('pointerenter', function () { showHold = true; });
  sh.addEventListener('pointerleave', function () { showHold = false; });
  sh.addEventListener('focusin', function () { showHold = true; });
  sh.addEventListener('focusout', function () { showHold = false; });
  $('#showStage').addEventListener('pointerdown', function (e) { sx = e.clientX; });
  $('#showStage').addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 44) showGo(showI + (dx < 0 ? 1 : -1)); });
  window.addEventListener('hashchange', route);
  initRes(); initOrder(); initReq(); initGift(); initVideo();
  applyLang(); showGo(0, true); route();
  counters(); embers(); pointerFx(); showAuto();
  setInterval(setStatus, 60000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setHH(); onScroll(); });
}
init();
})();
