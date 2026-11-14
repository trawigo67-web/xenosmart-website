/* Leonn Vorschau – Verhalten: Sprache, Speisekarte, Merkliste, Karussell, Formulare, Bewegung */
(function () {
'use strict';
var M = window.LEONN_MENU || [], TX = window.LEONN_TX || {};
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function ic(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

/* ------------------------------------------------------------------ Sprache */
var LANGS = ['de', 'tr', 'en'], LOCALE = ['de-DE', 'tr-TR', 'en-GB'], LI = 0;
var I = {
'note': ['Interne Vorschau · Entwurf für die neue Seite, nicht die offizielle Leonn-Website', 'Dahili önizleme · Yeni site için taslak, resmi Leonn sitesi değildir', 'Internal preview · Draft for the new site, not the official Leonn website'],
'skip': ['Zum Inhalt springen', 'İçeriğe geç', 'Skip to content'],
'nav.menu': ['Speisekarte', 'Menü', 'Menu'],
'nav.about': ['Über uns', 'Hakkımızda', 'About us'],
'nav.res': ['Reservieren', 'Rezervasyon', 'Reservations'],
'nav.gift': ['Gutschein', 'Hediye Çeki', 'Gift card'],
'nav.contact': ['Kontakt', 'İletişim', 'Contact'],
'cta.res': ['Tisch reservieren', 'Masa ayırt', 'Book a table'],
'cta.menu': ['Speisekarte ansehen', 'Menüyü gör', 'View the menu'],
'hero.h': ['Mehr als ein Ort zum <em>Essen.</em>', 'Bir sofradan <em>fazlası.</em>', 'More than a place to <em>eat.</em>'],
'hero.p': ['Frühstück, Meze, Grill und Güveç in Köln. Täglich mehr als 70 Speisen, frisch zubereitet.', 'Köln’de kahvaltı, meze, ızgara ve güveç. Her gün 70’ten fazla çeşit, taze hazırlanır.', 'Breakfast, meze, grill and güveç in Cologne. More than 70 dishes, freshly prepared every day.'],
'hero.hours': ['Montag bis Sonntag, 09:00 – 23:00', 'Pazartesi – Pazar, 09:00 – 23:00', 'Monday to Sunday, 09:00 – 23:00'],
'f.dishes': ['Speisen täglich frisch zubereitet', 'çeşit, her gün taze hazırlanır', 'dishes freshly prepared daily'],
'f.hours': ['Uhr, Montag bis Sonntag', 'Pazartesi – Pazar', 'Monday to Sunday'],
'f.breakfast': ['Uhr: so lange gibt es täglich Frühstück', 'her gün bu saate kadar kahvaltı', 'breakfast is served daily until then'],
'f.vip': ['Plätze im V.I.P Room', 'kişilik V.I.P Room', 'seats in the V.I.P Room'],
'h.kitchen': ['Aus unserer Küche', 'Mutfağımızdan', 'From our kitchen'],
'h.all': ['Zur ganzen Speisekarte', 'Tüm menüye git', 'See the full menu'],
'show.detail': ['Details ansehen', 'Ayrıntılar', 'View details'],
'h.cats': ['Worauf haben Sie Lust?', 'Canınız ne çekiyor?', 'What are you in the mood for?'],
'h.cats.s': ['Ein Klick führt direkt in die Karte', 'Tek tıkla doğrudan menüye', 'One click takes you straight to the menu'],
'cev.e': ['Lamm vom Spieß', 'Şişte kuzu', 'Lamb from the spit'],
'about.q': ['Der gedeckte Tisch steht für Gemeinschaft, Teilen und Gastfreundschaft.', 'Sofra; birliktelik, paylaşmak ve misafirperverlik demektir.', 'A laid table stands for togetherness, sharing and hospitality.'],
'about.short': ['Die Geschichte von Leonn ist eng mit unseren türkischen Wurzeln, unserer Küche und der türkischen Gastfreundschaft verbunden.', 'Leonn’un hikâyesi Türk köklerimizle, mutfağımızla ve Türk misafirperverliğiyle yakından bağlıdır.', 'The story of Leonn is closely tied to our Turkish roots, our cuisine and Turkish hospitality.'],
'about.more': ['Unsere Geschichte', 'Hikâyemiz', 'Our story'],
'vip.e': ['Für besondere Anlässe', 'Özel günler için', 'For special occasions'],
'vip.short': ['Ein privater Raum für bis zu 15 Personen: Geburtstage, Familienfeiern, Geschäftsessen.', '15 kişiye kadar özel bir salon: doğum günleri, aile kutlamaları, iş yemekleri.', 'A private room for up to 15 guests: birthdays, family celebrations, business dinners.'],
'vip.ask': ['Raum ansehen', 'Salonu gör', 'See the room'],
'gift.e': ['Zum Verschenken', 'Hediye etmek için', 'A gift to give'],
'gift.short': ['Ein Abend bei Leonn als Geschenk, mit Betrag nach Wahl und persönlicher Nachricht.', 'Leonn’da bir akşamı hediye edin; tutarı ve kişisel mesajı siz belirleyin.', 'An evening at Leonn as a gift, with an amount of your choice and a personal message.'],
'gift.make': ['Gutschein gestalten', 'Hediye çeki hazırla', 'Design a gift card'],
'gift.card': ['Für einen Abend bei Leonn', 'Leonn’da bir akşam için', 'For an evening at Leonn'],
'visit.h': ['Besuchen Sie uns', 'Bizi ziyaret edin', 'Visit us'],
'con.addr': ['Adresse', 'Adres', 'Address'],
'con.route': ['Route in Google Maps öffnen', 'Google Haritalar’da yol tarifi', 'Open route in Google Maps'],
'con.hours': ['Öffnungszeiten', 'Çalışma saatleri', 'Opening hours'],
'con.hv': ['Montag – Sonntag<br>09:00 – 23:00', 'Pazartesi – Pazar<br>09:00 – 23:00', 'Monday – Sunday<br>09:00 – 23:00'],
'con.bf': ['Frühstück täglich bis 14:00 Uhr', 'Kahvaltı her gün 14:00’e kadar', 'Breakfast daily until 14:00'],
'con.tel': ['Telefon', 'Telefon', 'Phone'],
'con.p': ['Haben Sie Fragen oder möchten Sie direkt telefonisch reservieren? Wir freuen uns auf Ihre Kontaktaufnahme.', 'Sorularınız mı var ya da doğrudan telefonla rezervasyon mu yapmak istiyorsunuz? Sizden haber almaktan memnuniyet duyarız.', 'Do you have questions or would you like to book directly by phone? We look forward to hearing from you.'],
'm.e': ['Anatolische Küche · Köln', 'Anadolu mutfağı · Köln', 'Anatolian cuisine · Cologne'],
'm.h': ['Unsere <em>Speisekarte</em>', '<em>Menümüz</em>', 'Our <em>menu</em>'],
'm.p': ['Tippen Sie ein Gericht an, um es groß zu sehen. Mit „Merken“ stellen Sie Ihre Auswahl für den Tisch zusammen.', 'Büyük görmek için bir yemeğe dokunun. “Ekle” ile masanız için seçiminizi oluşturun.', 'Tap a dish to see it large. Use “Add” to put together your selection for the table.'],
'm.search': ['Gericht suchen', 'Yemek ara', 'Search dishes'],
'm.ph': ['Gericht suchen, z. B. Künefe', 'Yemek ara, örn. Künefe', 'Search dishes, e.g. Künefe'],
'fl.all': ['Alle', 'Hepsi', 'All'],
'fl.photo': ['Mit Foto', 'Fotoğraflı', 'With photo'],
'fl.hot': ['Scharf', 'Acılı', 'Spicy'],
'fl.u10': ['Unter 10 €', '10 € altı', 'Under 10 €'],
'm.quote': ['Diese Speisekarte ist Ausdruck unserer Verbundenheit mit der türkischen Küche, unseren Wurzeln und der Gastfreundschaft, die uns seit jeher begleitet.', 'Bu menü; Türk mutfağına, köklerimize ve bize her zaman eşlik eden misafirperverliğe olan bağlılığımızın bir ifadesidir.', 'This menu is an expression of our bond with Turkish cuisine, our roots and the hospitality that has always accompanied us.'],
'm.quote.s': ['Afiyet olsun', 'Afiyet olsun', 'Afiyet olsun'],
'about.1': ['Die Geschichte von Leonn ist eng mit unseren türkischen Wurzeln, unserer Küche und der türkischen Gastfreundschaft verbunden. Es ist unsere Leidenschaft, die Aromen, Traditionen und die besondere Bedeutung des gemeinsamen Essens, mit denen wir aufgewachsen sind, unseren Gästen näherzubringen.', 'Leonn’un hikâyesi Türk köklerimizle, mutfağımızla ve Türk misafirperverliğiyle yakından bağlıdır. Birlikte büyüdüğümüz lezzetleri, gelenekleri ve aynı sofrayı paylaşmanın özel anlamını misafirlerimize yaşatmak bizim tutkumuzdur.', 'The story of Leonn is closely tied to our Turkish roots, our cuisine and Turkish hospitality. It is our passion to bring our guests closer to the flavours, the traditions and the special meaning of eating together that we grew up with.'],
'about.2': ['In unserer Küche werden täglich mehr als 70 verschiedene Speisen frisch zubereitet. Vom Frühstück über Mezze und Grillgerichte bis hin zu traditionellen anatolischen Spezialitäten und Desserts legen wir großen Wert auf Frische, hochwertige Zutaten und eine sorgfältige Zubereitung. Traditionelle Rezepte bewahren wir dabei und verbinden sie mit der eigenen Handschrift von Leonn.', 'Mutfağımızda her gün 70’ten fazla çeşit yemek taze olarak hazırlanır. Kahvaltıdan mezelere, ızgaralardan geleneksel Anadolu lezzetlerine ve tatlılara kadar tazeliğe, kaliteli malzemeye ve özenli hazırlığa büyük önem veririz. Geleneksel tarifleri korur, onları Leonn’un kendi yorumuyla buluştururuz.', 'More than 70 different dishes are freshly prepared in our kitchen every day. From breakfast to meze and grilled dishes through to traditional Anatolian specialities and desserts, we place great value on freshness, high-quality ingredients and careful preparation. We preserve traditional recipes and combine them with Leonn’s own signature.'],
'about.3': ['In der türkischen Kultur ist der gedeckte Tisch weit mehr als nur ein Ort zum Essen. Er steht für Gemeinschaft, Teilen und Gastfreundschaft. Genau dieses Gefühl möchten wir bei Leonn weitergeben und jedem Gast das Gefühl vermitteln, herzlich willkommen zu sein.', 'Türk kültüründe sofra, yemek yenen bir yerden çok daha fazlasıdır. Birlikteliğin, paylaşmanın ve misafirperverliğin simgesidir. Leonn’da tam da bu duyguyu yaşatmak ve her misafirimize kendini gönülden hoş karşılanmış hissettirmek istiyoruz.', 'In Turkish culture, a laid table is far more than just a place to eat. It stands for togetherness, sharing and hospitality. This is exactly the feeling we want to pass on at Leonn, making every guest feel truly welcome.'],
'about.4': ['Diese Speisekarte ist Ausdruck unserer Verbundenheit mit der türkischen Küche, unseren Wurzeln und der Gastfreundschaft, die uns seit jeher begleitet.', 'Bu menü; Türk mutfağına, köklerimize ve bize her zaman eşlik eden misafirperverliğe olan bağlılığımızın bir ifadesidir.', 'This menu is an expression of our bond with Turkish cuisine, our roots and the hospitality that has always accompanied us.'],
'about.5': ['Herzlich willkommen bei Leonn. Afiyet olsun.', 'Leonn’a hoş geldiniz. Afiyet olsun.', 'Welcome to Leonn. Afiyet olsun.'],
'res.e': ['Montag bis Sonntag 09:00 – 23:00', 'Pazartesi – Pazar 09:00 – 23:00', 'Monday to Sunday 09:00 – 23:00'],
'res.h': ['Tisch reservieren', 'Masa ayırt', 'Book a table'],
'res.p': ['Wählen Sie Tag, Uhrzeit und Personenzahl. Für Gruppen ab 10 Personen empfehlen wir den V.I.P Room.', 'Günü, saati ve kişi sayısını seçin. 10 kişi ve üzeri gruplar için V.I.P Room’u öneririz.', 'Choose the day, time and number of guests. For groups of 10 or more we recommend the V.I.P Room.'],
'res.phone': ['Lieber telefonisch?', 'Telefonla mı tercih edersiniz?', 'Prefer to call?'],
'res.date': ['Datum', 'Tarih', 'Date'],
'res.time': ['Uhrzeit', 'Saat', 'Time'],
'res.pers': ['Personen', 'Kişi sayısı', 'Guests'],
'res.where': ['Bereich', 'Alan', 'Area'],
'res.w1': ['Restaurant', 'Restoran', 'Restaurant'],
'res.name': ['Name', 'Ad Soyad', 'Name'],
'res.tel': ['Telefon', 'Telefon', 'Phone'],
'res.mail': ['E-Mail für die Bestätigung', 'Onay için e-posta', 'Email for the confirmation'],
'res.note': ['Wunsch (optional)', 'Notunuz (isteğe bağlı)', 'Request (optional)'],
'res.send': ['Anfrage prüfen', 'Talebi kontrol et', 'Check request'],
'res.fine': ['Eine Reservierungsanfrage ist noch keine bestätigte Reservierung. Verbindlich wird sie erst mit der ausdrücklichen Bestätigung per E-Mail.', 'Rezervasyon talebi henüz onaylanmış bir rezervasyon değildir. Ancak e-posta ile açıkça onaylandığında kesinleşir.', 'A reservation request is not yet a confirmed reservation. It only becomes binding with the explicit confirmation by email.'],
'tk.label': ['Reservierung', 'Rezervasyon', 'Reservation'],
'gift.h': ['Gutschein verschenken', 'Hediye çeki gönderin', 'Give a gift card'],
'gift.p': ['Schenken Sie ein unvergessliches kulinarisches Erlebnis.', 'Unutulmaz bir lezzet deneyimi hediye edin.', 'Give an unforgettable culinary experience.'],
'gift.1': ['Betrag wählen', 'Tutar seçin', 'Choose an amount'],
'gift.2': ['Persönliche Daten', 'Kişisel bilgiler', 'Personal details'],
'gift.3': ['Zahlung', 'Ödeme', 'Payment'],
'gift.own': ['Eigener Betrag (€)', 'Özel tutar (€)', 'Custom amount (€)'],
'gift.for': ['Für wen ist der Gutschein?', 'Hediye çeki kimin için?', 'Who is the gift card for?'],
'gift.from': ['Ihr Name', 'Adınız', 'Your name'],
'gift.msg': ['Persönliche Nachricht (optional)', 'Kişisel mesaj (isteğe bağlı)', 'Personal message (optional)'],
'gift.pay': ['Die Zahlung erfolgt sicher im nächsten Schritt. Zur Auswahl stehen PayPal, Klarna und Kreditkarte.', 'Ödeme bir sonraki adımda güvenle yapılır. PayPal, Klarna ve kredi kartı seçenekleri mevcuttur.', 'Payment is made securely in the next step. You can choose between PayPal, Klarna and credit card.'],
'gift.terms': ['Gutscheine sind ab Ausstellungsdatum drei Jahre gültig. Ein Restguthaben bleibt erhalten, eine Barauszahlung ist nicht möglich.', 'Hediye çekleri düzenlenme tarihinden itibaren üç yıl geçerlidir. Kalan bakiye korunur, nakde çevrilemez.', 'Gift cards are valid for three years from the date of issue. Any remaining balance is kept; cash payouts are not possible.'],
'vip.1': ['Ob Geburtstage, Familienfeiern, Geschäftsessen oder private Veranstaltungen – unser stilvoller VIP Room bietet Platz für bis zu 15 Personen.', 'Doğum günleri, aile kutlamaları, iş yemekleri veya özel davetler – şık VIP salonumuz 15 kişiye kadar yer sunar.', 'Whether birthdays, family celebrations, business dinners or private events – our stylish VIP Room has space for up to 15 guests.'],
'vip.2': ['Genießen Sie Ihre besonderen Anlässe in einer privaten und gemütlichen Atmosphäre.', 'Özel günlerinizin tadını samimi ve size özel bir ortamda çıkarın.', 'Enjoy your special occasions in a private and cosy atmosphere.'],
'vip.3': ['Jetzt reservieren und unvergessliche Momente erleben!', 'Hemen rezervasyon yapın, unutulmaz anlar yaşayın!', 'Book now and enjoy unforgettable moments!'],
'vip.t1': ['Plätze', 'Kişi', 'Seats'],
'vip.t1v': ['bis 15', '15’e kadar', 'up to 15'],
'vip.t2': ['Atmosphäre', 'Ortam', 'Atmosphere'],
'vip.t2v': ['Privat', 'Size özel', 'Private'],
'vip.now': ['Jetzt anfragen', 'Hemen sorun', 'Enquire now'],
'ft.legal': ['Rechtliches', 'Yasal bilgiler', 'Legal'],
'ft.imp': ['Impressum, AGB und Datenschutz des Restaurants bleiben wie auf der aktuellen Seite.', 'Restoranın künyesi, şartları ve gizlilik bilgileri mevcut sitedeki gibi kalır.', 'The restaurant’s imprint, terms and privacy policy stay as on the current site.'],
'ft.note': ['Interne Vorschau von XenoSmart für das Leonn Restaurant. Diese Seite ist nicht die offizielle Website; hier wird nichts bestellt, gebucht oder gesendet.', 'Leonn Restaurant için XenoSmart tarafından hazırlanan dahili önizleme. Bu sayfa resmi site değildir; burada sipariş, rezervasyon veya gönderim yapılmaz.', 'Internal preview by XenoSmart for Leonn Restaurant. This page is not the official website; nothing is ordered, booked or sent here.'],
'ft.imprint': ['Impressum der Vorschau', 'Önizlemenin künyesi', 'Imprint of this preview'],
'ft.privacy': ['Datenschutz', 'Gizlilik', 'Privacy'],
'tb.title': ['Mein Tisch', 'Masam', 'My table'],
'tb.sum': ['Summe laut Karte', 'Menüye göre toplam', 'Total per menu'],
'tb.split': ['Aufteilen auf Personen', 'Kişi sayısına böl', 'Split between guests'],
'tb.pp': ['pro Person', 'kişi başı', 'per person'],
'tb.hint': ['Zeigen Sie diese Liste beim Bestellen am Tisch.', 'Sipariş verirken bu listeyi gösterin.', 'Show this list when you order at the table.'],
'tb.clear': ['Liste leeren', 'Listeyi boşalt', 'Clear list'],
'dock.route': ['Route', 'Yol tarifi', 'Route'],
/* nur im Skript verwendet */
'add': ['Merken', 'Ekle', 'Add'],
'added': ['Gemerkt', 'Eklendi', 'Added'],
'found': ['Treffer', 'sonuç', 'results'],
'none': ['Kein Gericht gefunden. Bitte anders suchen.', 'Sonuç bulunamadı. Lütfen başka bir arama deneyin.', 'No dish found. Please try a different search.'],
'open': ['Jetzt geöffnet · bis 23:00', 'Şu an açık · 23:00’e kadar', 'Open now · until 23:00'],
'bf': ['Jetzt geöffnet · Frühstück bis 14:00', 'Şu an açık · kahvaltı 14:00’e kadar', 'Open now · breakfast until 14:00'],
'closed': ['Geschlossen · öffnet um 09:00', 'Kapalı · 09:00’da açılır', 'Closed · opens at 09:00'],
'pp': ['pro Person', 'kişi başı', 'per person'],
'kid': ['Kinder 3–9 Jahre', 'Çocuk, 3–9 yaş', 'Children aged 3–9'],
'incl': ['Bei jedem Frühstück inklusive', 'Her kahvaltıya dahildir', 'Included with every breakfast'],
'empty': ['Noch nichts gemerkt. Tippen Sie bei einem Gericht auf „Merken“.', 'Henüz bir şey eklenmedi. Bir yemekte “Ekle”ye dokunun.', 'Nothing added yet. Tap “Add” on a dish.'],
'pay': ['Weiter zur Zahlung', 'Ödemeye geç', 'Continue to payment'],
'pers1': ['Person', 'kişi', 'guest'],
'persN': ['Personen', 'kişi', 'guests'],
'demoR': ['Vorschau: Auf der echten Seite geht diese Anfrage an das Restaurant. Hier wird nichts gesendet.', 'Önizleme: Gerçek sitede bu talep restorana iletilir. Burada hiçbir şey gönderilmez.', 'Preview: on the real site this request goes to the restaurant. Nothing is sent here.'],
'demoG': ['Vorschau: Auf der echten Seite beginnt hier die Zahlung. In dieser Vorschau wird nichts bestellt.', 'Önizleme: Gerçek sitede ödeme burada başlar. Bu önizlemede sipariş verilmez.', 'Preview: on the real site payment starts here. Nothing is ordered in this preview.'],
'need': ['Bitte füllen Sie die markierten Felder aus.', 'Lütfen işaretli alanları doldurun.', 'Please fill in the highlighted fields.'],
'for_': ['Für', 'Kime:', 'For'],
'from_': ['von', 'Gönderen:', 'from'],
'hot': ['Scharf', 'Acılı', 'Spicy'],
'mild': ['Leicht scharf', 'Hafif acılı', 'Mildly spicy'],
'pre': ['Nur auf Vorbestellung', 'Yalnızca ön siparişle', 'Pre-order only'],
'dishes': ['Gerichte', 'çeşit', 'dishes'],
'until14': ['täglich bis 14:00 Uhr', 'her gün 14:00’e kadar', 'daily until 14:00'],
'clock': [' Uhr', '', ''],
'prev': ['Vorheriges Gericht', 'Önceki yemek', 'Previous dish'],
'next': ['Nächstes Gericht', 'Sonraki yemek', 'Next dish'],
'close': ['Schließen', 'Kapat', 'Close'],
'pauseV': ['Video anhalten', 'Videoyu durdur', 'Pause video'],
'playV': ['Video abspielen', 'Videoyu oynat', 'Play video'],
'menuBtn': ['Menü', 'Menü', 'Menu'],
'totop': ['Nach oben', 'Yukarı', 'Back to top'],
'less': ['Eine Person weniger', 'Bir kişi azalt', 'One guest fewer'],
'more': ['Eine Person mehr', 'Bir kişi ekle', 'One more guest'],
'amount': ['Betrag', 'Tutar', 'Amount']
};
/* Abschnittstitel und Hinweise: [TR-Titel, TR-Hinweis, EN-Titel, EN-Hinweis] – Deutsch kommt aus den Originaldaten */
var SEC = {
'fruhstuck': ['Kahvaltı', 'Kahvaltı her gün 14:00’e kadar servis edilir. Essentials her kahvaltıya dahildir.', 'Breakfast', 'We serve breakfast daily until 14:00. Our Essentials are included with every breakfast.'],
'fruhstuck-extras': ['Kahvaltı Ekstraları', 'Kişi başı 1 ekstra, ek ücret olmadan dahildir', 'Breakfast Extras', '1 extra per person is included at no extra charge'],
'suppen': ['Çorbalar', 'balon ekmek ve söğüş ile servis edilir', 'Soups', 'served with balloon bread and söğüş'],
'salate': ['Salatalar', '', 'Salads', ''],
'oriental-bites': ['Oriental Bites', 'balon ekmek ile servis edilir', 'Oriental Bites', 'served with balloon bread'],
'anatolian-sauce-grill': ['Anatolian Sauce & Grill', 'pirinç pilavı ile servis edilir', 'Anatolian Sauce & Grill', 'served with rice'],
'aus-dem-guvec': ['Güveçten', 'pirinç pilavı ile servis edilir', 'From the Güveç', 'served with rice'],
'aus-dem-meer': ['Denizden', 'Leonn Selection salata ile servis edilir', 'From the Sea', 'served with the Leonn Selection salad'],
'bonfilet-selection': ['Bonfilet Selection', 'patates kızartması ile servis edilir', 'Bonfilet Selection', 'served with French fries'],
'chef-s-grill-selection': ['Chef’s Grill Selection', 'patates kızartması ile servis edilir', 'Chef’s Grill Selection', 'served with French fries'],
'steak-selection': ['Steak Selection', 'özenle seçilmiş garnitür ile servis edilir', 'Steak Selection', 'served with individually matched garnish'],
'leonn-kuzu-cevirme': ['Leonn Kuzu Çevirme', '', 'Leonn Kuzu Çevirme', ''],
'desserts': ['Tatlılar', 'Günlük değişen ve mevsimlik tatlılarımız ile taze pastalarımız için vitrinimize göz atabilirsiniz', 'Desserts', 'For our daily changing and seasonal desserts and fresh cakes, please have a look at our display'],
'kids': ['Çocuk', 'TÜM çocuk menüleri patates kızartması ile servis edilir.', 'Kids', 'ALL kids dishes are served with French fries.'],
'leonn-refreshments': ['Leonn Refreshments', '', 'Leonn Refreshments', ''],
'leonn-tea-selection': ['Leonn Tea Selection', '', 'Leonn Tea Selection', ''],
'barista-selection': ['Barista Selection', '', 'Barista Selection', '']
};
var GROUPS = [
{ id: 'g1', n: ['Frühstück', 'Kahvaltı', 'Breakfast'], s: ['fruhstuck', 'fruhstuck-extras'] },
{ id: 'g2', n: ['Suppen & Salate', 'Çorba & Salata', 'Soups & Salads'], s: ['suppen', 'salate'] },
{ id: 'g3', n: ['Meze', 'Meze', 'Meze'], s: ['oriental-bites'] },
{ id: 'g4', n: ['Grill & Steak', 'Izgara & Steak', 'Grill & Steak'], s: ['anatolian-sauce-grill', 'bonfilet-selection', 'chef-s-grill-selection', 'steak-selection'] },
{ id: 'g5', n: ['Güveç & Meer', 'Güveç & Deniz', 'Güveç & Sea'], s: ['aus-dem-guvec', 'aus-dem-meer'] },
{ id: 'g6', n: ['Kuzu Çevirme', 'Kuzu Çevirme', 'Kuzu Çevirme'], s: ['leonn-kuzu-cevirme'] },
{ id: 'g7', n: ['Desserts', 'Tatlılar', 'Desserts'], s: ['desserts'] },
{ id: 'g8', n: ['Kids', 'Çocuk', 'Kids'], s: ['kids'] },
{ id: 'g9', n: ['Getränke', 'İçecekler', 'Drinks'], s: ['leonn-refreshments', 'leonn-tea-selection', 'barista-selection'] }
];
function t(k) { var v = I[k]; return v ? v[LI] : k; }
function secT(s) { var x = SEC[s.id]; return LI === 0 || !x ? s.title : x[LI === 1 ? 0 : 2]; }
function secN(s) { var x = SEC[s.id]; return LI === 0 || !x ? s.note : x[LI === 1 ? 1 : 3]; }

/* ------------------------------------------------------------------ Daten */
var ITEMS = {}, ALL = [], secById = {};
function parsePrice(p) { return parseFloat(String(p).replace('€', '').replace(/\./g, '').replace(',', '.')) || 0; }
function money(v) { return v.toFixed(2).replace('.', ',') + ' €'; }
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
    it.pre = /\(Nur auf Vorbestellung\)/i.test(d);
    it.dd = d.replace(/\s*\((leicht scharf|scharf|Nur auf Vorbestellung)\)/gi, '').trim();
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

/* ------------------------------------------------------------------ Merkliste „Mein Tisch“ */
var table = {}, ppl = 1;
try { table = JSON.parse(store('leonn-table') || '{}') || {}; } catch (e) { table = {}; }
Object.keys(table).forEach(function (k) { if (!ITEMS[k] || !(table[k] > 0)) delete table[k]; });
ppl = Math.max(1, Math.min(20, parseInt(store('leonn-ppl'), 10) || 1));
function saveT() { store('leonn-table', JSON.stringify(table)); store('leonn-ppl', String(ppl)); }
function tCount() { var n = 0; for (var k in table) n += table[k]; return n; }
function tSum() { var s = 0; for (var k in table) s += table[k] * ITEMS[k].v; return Math.round(s * 100) / 100; }
function addT(id, d) {
  if (!ITEMS[id]) return;
  table[id] = (table[id] || 0) + d; if (table[id] <= 0) delete table[id];
  saveT(); renderTable(); syncAdds();
  var f = $('#fab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump');
}
function renderTable() {
  var n = tCount(), f = $('#fab'), sum = tSum();
  f.classList.toggle('on', n > 0);
  f.innerHTML = ic('list') + '<span>' + esc(t('tb.title')) + ' · ' + n + ' · <span class="num">' + money(sum) + '</span></span>';
  var h = '';
  Object.keys(table).forEach(function (k) {
    var it = ITEMS[k];
    h += '<div class="it" data-row="' + k + '"><b>' + esc(nm(it)) + '</b><span class="price num">' + money(it.v * table[k]) + '</span>' +
      '<div class="qty"><button type="button" data-q="-1" data-id="' + k + '" aria-label="−1 ' + esc(nm(it)) + '">−</button><span class="num">' + table[k] + '</span><button type="button" data-q="1" data-id="' + k + '" aria-label="+1 ' + esc(nm(it)) + '">+</button></div>' +
      '<small class="num">' + esc(it.p) + '</small></div>';
  });
  $('#tItems').innerHTML = h || '<p class="empty">' + esc(t('empty')) + '</p>';
  $('#tSum').textContent = money(sum);
  $('#ppN').textContent = ppl;
  $('#tPP').textContent = money(sum / ppl);
}
function addBtn(it) {
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
  if (it.hot) h += '<span class="tag hot">' + ic('flame') + esc(t('hot')) + '</span>';
  if (it.mild) h += '<span class="tag hot">' + ic('flame') + esc(t('mild')) + '</span>';
  if (it.pre) h += '<span class="tag pre">' + ic('clock') + esc(t('pre')) + '</span>';
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
  return list.map(function (g) {
    var m = /^([^(]+)\s*(\(.*\))?$/.exec(g);
    return '<li><b>' + esc((m ? m[1] : g).trim()) + '</b>' + (m && m[2] ? ' ' + esc(m[2]) : '') + '</li>';
  }).join('');
}
function persLabel(n) { return n + ' ' + t(n > 1 ? 'persN' : 'pers1'); }
function cevTiles(s) {
  return s.items.map(function (it, i) {
    return '<div data-item="' + it.id + '"><span>' + esc(persLabel(i + 1)) + '</span><b class="price num">' + esc(it.p) + '</b>' + addBtn(it) + '</div>';
  }).join('');
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
      if (!gh) gh += '<div class="head"><h2>' + esc(multi ? g.n[LI] : title) + '</h2><p>' + esc(!multi || sid === 'fruhstuck' ? note : '') + '</p></div>';
      if (multi && sid !== 'fruhstuck') gh += '<h3 class="sub">' + esc(title) + '</h3>' + (note ? '<p class="sn">' + esc(note) + '</p>' : '');
      if (sid === 'fruhstuck' && plain) {
        var a = s.items[0], b = s.items[1];
        gh += '<div class="ess" data-rv><div><p class="eyebrow">' + esc(t('incl')) + '</p><h3>Breakfast Essentials</h3>' +
          '<div class="pl" data-item="' + a.id + '"><span>' + esc(t('pp')) + '</span><i></i><span class="price num">' + esc(a.p) + '</span>' + addBtn(a) + '</div>' +
          '<div class="pl" data-item="' + b.id + '"><span>' + esc(t('kid')) + '</span><i></i><span class="price num">' + esc(b.p) + '</span>' + addBtn(b) + '</div></div>' +
          '<ul>' + splitList(ds(a)).map(function (x) { return '<li>' + esc(x.charAt(0).toUpperCase() + x.slice(1)) + '</li>'; }).join('') + '</ul></div>';
        return;
      }
      if (sid === 'leonn-kuzu-cevirme' && plain) {
        var c = cevParts(s.items[0]);
        gh += '<div class="feature" data-rv><div class="tray"><img src="img/' + s.items[0].img + '" alt="Leonn Kuzu Çevirme" width="' + s.items[0].w + '" height="' + s.items[0].h + '" loading="lazy" decoding="async"></div>' +
          '<div><p class="eyebrow">' + esc(t('cev.e')) + '</p><h3>Leonn Kuzu Çevirme</h3><p>' + esc(c.lead) + '</p><ul class="garn">' + garnHtml(c.garn) + '</ul><div class="tiles">' + cevTiles(s) + '</div></div></div>';
        return;
      }
      var ph = its.filter(function (x) { return x.img; }), li = its.filter(function (x) { return !x.img; });
      if (sid === 'leonn-kuzu-cevirme') { li = its; ph = []; }
      if (ph.length) gh += '<div class="grid n' + Math.min(ph.length, 9) + '">' + ph.map(card).join('') + '</div>';
      if (li.length) gh += '<div class="list">' + li.map(row).join('') + '</div>';
    });
    if (gh) h += '<section class="msec" id="' + g.id + '">' + gh + '</section>';
  });
  $('#menu').innerHTML = h || '<p class="empty">' + esc(t('none')) + '</p>';
  $('#count').textContent = plain ? '' : total + ' ' + t('found');
  setupReveal(); onScroll();
}

/* ------------------------------------------------------------------ Großansicht */
var modalList = [], modalId = null;
function openItem(id, list) {
  var it = ITEMS[id]; if (!it) return;
  if (!$('#veil').classList.contains('on')) lastFocus = document.activeElement;
  if (list) modalList = list;
  if (modalList.indexOf(id) < 0) modalList = ALL.map(function (x) { return x.id; });
  modalId = id;
  var s = secById[it.sec], pos = modalList.indexOf(id), d = ds(it), n = secN(s), tg = tags(it);
  if (it.sec === 'leonn-kuzu-cevirme') d = cevParts(it).lead;
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

/* ------------------------------------------------------------------ Start: Laufband, Karussell, Kacheln, Çevirme */
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
var SHOW = ['chef-s-grill-selection-2', 'chef-s-grill-selection-0', 'anatolian-sauce-grill-0', 'bonfilet-selection-0', 'aus-dem-meer-0', 'fruhstuck-extras-1', 'salate-1', 'desserts-0'].filter(function (id) { return ITEMS[id] && ITEMS[id].img; });
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
var CATS = [['g1', '9f8c', 'until14'], ['g3', '9f97', ''], ['g2', '9f92', ''], ['g4', '9fa6', ''], ['g5', '9f9e', ''], ['g7', '9fa8', '']];
function groupCount(g) {
  var seen = {}, n = 0;
  g.s.forEach(function (sid) { (secById[sid] ? secById[sid].items : []).forEach(function (it) { var k = it.nm.replace(/\s*\(.*\)\s*/g, ''); if (!seen[k]) { seen[k] = 1; n++; } }); });
  return n;
}
function renderCats() {
  $('#cats').innerHTML = CATS.map(function (c) {
    var g = GROUPS.filter(function (x) { return x.id === c[0]; })[0]; if (!g) return '';
    return '<button type="button" class="cat" data-go="' + g.id + '" data-rv><img src="img/s/' + c[1] + '.webp" alt="" width="210" height="158" loading="lazy" decoding="async">' +
      '<span class="num">' + groupCount(g) + ' ' + esc(t('dishes')) + '</span><b>' + esc(g.n[LI]) + '</b>' + (c[2] ? '<i>' + esc(t(c[2])) + '</i>' : '') + ic('right') + '</button>';
  }).join('');
}
function renderCev() {
  var s = secById['leonn-kuzu-cevirme']; if (!s) return;
  var c = cevParts(s.items[0]);
  $('#cevLead').textContent = c.lead;
  $('#cevGarn').innerHTML = garnHtml(c.garn);
  $('#cevTiles').innerHTML = cevTiles(s);
}

/* ------------------------------------------------------------------ Öffnungs-Anzeige */
function berlinHour() {
  try { return parseInt(new Intl.DateTimeFormat('de-DE', { hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }).format(new Date()), 10); }
  catch (e) { return new Date().getHours(); }
}
function setStatus() {
  var h = berlinHour(), open = h >= 9 && h < 23, txt = open ? (h < 14 ? t('bf') : t('open')) : t('closed');
  ['', '2'].forEach(function (x) {
    var el = $('#status' + x); if (!el) return;
    el.classList.toggle('closed', !open); $('#statusText' + x).textContent = txt;
  });
}

/* ------------------------------------------------------------------ Reservierung */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fmtDate(v) {
  var p = String(v).split('-'); if (p.length !== 3) return '';
  var d = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(d)) return '';
  return d.toLocaleDateString(LOCALE[LI], { weekday: 'long', day: 'numeric', month: 'long' });
}
function whereLabel() { return $('#rWhere').value === 'v' ? 'V.I.P Room' : t('res.w1'); }
function ticket() {
  $('#tkDate').textContent = fmtDate($('#rDate').value) || '—';
  $('#tkTime').textContent = $('#rTime').value + t('clock');
  $('#tkPers').textContent = persLabel(+$('#rPers').value);
  $('#tkWhere').textContent = whereLabel();
  $('#tkName').textContent = $('#rName').value.trim();
}
function initRes() {
  var tm = $('#rTime'), h = '', i;
  for (i = 9; i <= 21; i++) h += '<option>' + pad(i) + ':00</option><option>' + pad(i) + ':30</option>';
  tm.innerHTML = h; tm.value = '19:00';
  var p = $('#rPers'), ph = ''; for (i = 1; i <= 15; i++) ph += '<option>' + i + '</option>';
  p.innerHTML = ph; p.value = '2';
  var now = new Date(), tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  $('#rDate').value = ymd(tom); $('#rDate').min = ymd(now);
  p.addEventListener('change', function () { if (+p.value >= 10) $('#rWhere').value = 'v'; ticket(); });
  ['rDate', 'rTime', 'rWhere', 'rName'].forEach(function (id) { $('#' + id).addEventListener('input', ticket); $('#' + id).addEventListener('change', ticket); });
  $('#resForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('#resOut'), bad = [];
    [['rDate', function (v) { return !!fmtDate(v); }], ['rName', function (v) { return v.trim().length > 1; }], ['rTel', function (v) { return v.replace(/\D/g, '').length >= 6; }], ['rMail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }]].forEach(function (c) {
      var el = $('#' + c[0]), ok = c[1](el.value);
      el.classList.toggle('bad', !ok); el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) bad.push(el);
    });
    if (bad.length) { o.innerHTML = esc(t('need')); bad[0].focus(); }
    else {
      o.innerHTML = '<b>' + esc(fmtDate($('#rDate').value)) + ' · ' + esc($('#rTime').value + t('clock')) + ' · ' + esc(persLabel(+$('#rPers').value)) + ' · ' + esc(whereLabel()) + '</b><br>' +
        esc($('#rName').value.trim()) + '<br><span style="color:var(--mute)">' + esc(t('demoR')) + '</span>';
    }
    o.classList.remove('on'); void o.offsetWidth; o.classList.add('on');
  });
  $('#vipAsk').addEventListener('click', function () { $('#rWhere').value = 'v'; ticket(); });
}

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
  $('#ppMinus').setAttribute('aria-label', t('less')); $('#ppPlus').setAttribute('aria-label', t('more'));
  splitWords(); renderBelt(); renderGroups(); renderMenu(); renderShow(); renderCats(); renderCev(); renderTable(); setStatus(); updGift(); ticket(); vidLabel();
  if (modalId) openItem(modalId);
  setupReveal();
}

/* ------------------------------------------------------------------ Navigation zwischen den Ansichten */
var VIEWS = ['start', 'speisekarte', 'ueber-uns', 'reservieren', 'gutschein', 'vip-room', 'kontakt'], pendingGroup = null, curView = null;
function navOpen(o) {
  $('#nav').classList.toggle('open', o); $('#burger').setAttribute('aria-expanded', o ? 'true' : 'false');
  document.documentElement.style.overflow = o ? 'hidden' : '';
}
function scrollToGroup(id, smooth) {
  var el = document.getElementById(id); if (!el) return;
  var y = el.getBoundingClientRect().top + window.pageYOffset - (barsH() + 6);
  window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce ? 'smooth' : 'auto' });
}
function route() {
  var h = (location.hash || '').replace('#', ''); if (VIEWS.indexOf(h) < 0) h = 'start';
  navOpen(false);
  if (h !== curView) {
    curView = h;
    VIEWS.forEach(function (v) { var el = document.getElementById('v-' + v); if (el) el.classList.toggle('on', v === h); });
    $$('nav.main a').forEach(function (a) { var on = a.getAttribute('href') === '#' + h; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
  }
  setHH(); setupReveal(); onScroll();
  if (h === 'speisekarte' && pendingGroup) { var g = pendingGroup; pendingGroup = null; setTimeout(function () { scrollToGroup(g, false); onScroll(); }, 60); }
  if (h === 'start' && beltPending) renderBelt();
  var v = $('#heroVideo');
  if (v) {
    if (h === 'start') {
      if (!v.getAttribute('poster')) v.setAttribute('poster', v.getAttribute('data-poster'));
      if (!vidPaused) { vidEnsure(); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    } else if (v.getAttribute('src')) v.pause();
  }
}
function vidEnsure() {
  var v = $('#heroVideo'); if (!v || v.getAttribute('src')) return;
  var small = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  v.src = v.getAttribute(small ? 'data-src-s' : 'data-src');
}
function goGroup(g) {
  if (curView === 'speisekarte') { scrollToGroup(g, true); return; }
  pendingGroup = g; location.hash = '#speisekarte';
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
function embers() {
  var c = $('#embers'); if (!c || reduce) return;
  var x = c.getContext('2d'), P = [], W = 0, H = 0, i;
  function size() { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; }
  function nw(any) { return { x: W * (0.35 + Math.random() * 0.65), y: any ? Math.random() * H : H + 10, r: Math.random() * 1.8 + 0.4, vy: Math.random() * 0.7 + 0.25, vx: (Math.random() - 0.5) * 0.4, a: Math.random() * 0.7 + 0.2, ph: Math.random() * 6.28 }; }
  size(); window.addEventListener('resize', size);
  for (i = 0; i < 64; i++) P.push(nw(true));
  (function tick(ts) {
    if (curView === 'start' && !document.hidden && window.pageYOffset < H + 200) {
      x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
      for (i = 0; i < P.length; i++) {
        var p = P[i]; p.y -= p.vy; p.x += p.vx + Math.sin(ts / 900 + p.ph) * 0.3; if (p.y < -10) P[i] = nw(false);
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28);
        x.fillStyle = 'rgba(240,190,110,' + (p.a * (0.6 + 0.4 * Math.sin(ts / 300 + p.ph))).toFixed(3) + ')';
        x.shadowBlur = 10; x.shadowColor = 'rgba(255,170,80,.9)'; x.fill();
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
var vidPaused = false;
function vidLabel() {
  var b = $('#vidToggle'); if (!b) return;
  b.setAttribute('aria-label', t(vidPaused ? 'playV' : 'pauseV')); b.setAttribute('aria-pressed', vidPaused ? 'true' : 'false');
  b.innerHTML = ic(vidPaused ? 'play' : 'pause');
}
function initVideo() {
  var v = $('#heroVideo'), b = $('#vidToggle'); if (!v || !b) return;
  if (reduce) { vidPaused = true; }
  b.addEventListener('click', function () {
    vidPaused = !vidPaused;
    if (vidPaused) v.pause(); else { vidEnsure(); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    vidLabel();
  });
  vidLabel();
}

/* ------------------------------------------------------------------ Ereignisse */
document.addEventListener('click', function (e) {
  var tg = e.target, el;
  if ((el = tg.closest('[data-add]'))) { var id = el.getAttribute('data-add'); addT(id, table[id] ? -table[id] : 1); return; }
  if ((el = tg.closest('[data-q]'))) { addT(el.getAttribute('data-id'), parseInt(el.getAttribute('data-q'), 10)); var keep = $('#tItems [data-row="' + el.getAttribute('data-id') + '"] [data-q="' + el.getAttribute('data-q') + '"]'); if (keep) keep.focus(); return; }
  if ((el = tg.closest('[data-mnav]'))) { modalStep(parseInt(el.getAttribute('data-mnav'), 10)); return; }
  if ((el = tg.closest('[data-close]'))) { closeItem(); return; }
  if ((el = tg.closest('[data-open]'))) {
    var list = el.hasAttribute('data-belt') ? $('#belt').beltIds : (tg.closest('#menu') ? visible.slice() : null);
    openItem(el.getAttribute('data-open'), list); return;
  }
  if ((el = tg.closest('[data-g]'))) { scrollToGroup(el.getAttribute('data-g'), true); return; }
  if ((el = tg.closest('[data-go]'))) { goGroup(el.getAttribute('data-go')); return; }
  if ((el = tg.closest('[data-f]'))) {
    filter = el.getAttribute('data-f');
    $$('[data-f]').forEach(function (c) { c.setAttribute('aria-pressed', c === el ? 'true' : 'false'); });
    renderMenu(); return;
  }
  if ((el = tg.closest('[data-show]'))) { showGo(parseInt(el.getAttribute('data-show'), 10)); return; }
  if ((el = tg.closest('[data-lang]'))) { LI = Math.max(0, LANGS.indexOf(el.getAttribute('data-lang'))); store('leonn-lang', LANGS[LI]); applyLang(); return; }
  if (tg === $('#veil')) { closeItem(); return; }
});
document.addEventListener('keydown', function (e) {
  var modalOn = $('#veil').classList.contains('on'), drawerOn = $('#drawer').classList.contains('on');
  if (e.key === 'Escape') { if (modalOn) closeItem(); else if (drawerOn) drawer(false); else if ($('#nav').classList.contains('open')) navOpen(false); return; }
  if (modalOn) {
    if (e.key === 'ArrowLeft') { modalStep(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { modalStep(1); e.preventDefault(); }
    else if (e.key === 'Tab') trap(e, $('#modal'));
  } else if (drawerOn && e.key === 'Tab') trap(e, $('#drawer'));
});
function init() {
  var sl = store('leonn-lang'); if (sl && LANGS.indexOf(sl) >= 0) LI = LANGS.indexOf(sl);
  $('#q').addEventListener('input', function () { query = this.value.trim(); renderMenu(); });
  $('#fab').addEventListener('click', function () { drawer(true); });
  $('#drawerX').addEventListener('click', function () { drawer(false); });
  $('#tClear').addEventListener('click', function () { table = {}; saveT(); renderTable(); syncAdds(); });
  $('#ppMinus').addEventListener('click', function () { ppl = Math.max(1, ppl - 1); saveT(); renderTable(); });
  $('#ppPlus').addEventListener('click', function () { ppl = Math.min(20, ppl + 1); saveT(); renderTable(); });
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
  initRes(); initGift(); initVideo();
  applyLang(); showGo(0, true); route();
  counters(); embers(); pointerFx(); showAuto();
  setInterval(setStatus, 60000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setHH(); onScroll(); });
}
init();
})();
