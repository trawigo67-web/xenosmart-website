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
'res.fine': ['Eine Reservierungsanfrage ist noch keine bestätigte Reservierung. Verbindlich wird sie erst mit unserer ausdrücklichen Bestätigung.', 'Rezervasyon talebi henüz onaylanmış bir rezervasyon değildir. Ancak tarafımızca açıkça onaylandığında kesinleşir.', 'A reservation request is not yet a confirmed reservation. It only becomes binding once we have explicitly confirmed it.'],
'tk.label': ['Reservierung', 'Rezervasyon', 'Reservation'],
'rsv.s1': ['Personen', 'Kişi sayısı', 'Guests'],
'rsv.s2': ['Tag & Uhrzeit', 'Gün ve saat', 'Day & time'],
'rsv.s3': ['Ihre Daten', 'Bilgileriniz', 'Your details'],
'rsv.q1': ['Wie viele Personen kommen?', 'Kaç kişi geliyorsunuz?', 'How many guests are coming?'],
'rsv.area': ['Wo möchten Sie sitzen?', 'Nerede oturmak istersiniz?', 'Where would you like to sit?'],
'rsv.r.s': ['Im Gastraum, für 1 bis {n} Personen', 'Salonda, 1–{n} kişi', 'In the dining room, 1 to {n} guests'],
'rsv.v.s': ['Privater Raum für {a} bis {b} Personen', '{a}–{b} kişilik özel salon', 'Private room for {a} to {b} guests'],
'rsv.v.only': ['Ab {n} Personen reservieren wir für Sie den V.I.P Room.', '{n} kişi ve üzeri için V.I.P Room ayrılır.', 'For {n} guests or more we book the V.I.P Room for you.'],
'rsv.big': ['Mehr als {n} Personen? Rufen Sie uns bitte an:', '{n} kişiden fazla mısınız? Lütfen bizi arayın:', 'More than {n} guests? Please call us:'],
'rsv.next': ['Weiter', 'Devam', 'Continue'],
'rsv.back': ['Zurück', 'Geri', 'Back'],
'rsv.change': ['Ändern', 'Değiştir', 'Change'],
'rsv.q2': ['Wann möchten Sie kommen?', 'Ne zaman gelmek istersiniz?', 'When would you like to come?'],
'rsv.pick': ['Bitte wählen Sie zuerst einen Tag.', 'Lütfen önce bir gün seçin.', 'Please choose a day first.'],
'rsv.times': ['Freie Zeiten am {d}', '{d} için uygun saatler', 'Available times on {d}'],
'rsv.g1': ['Vormittag', 'Sabah', 'Morning'],
'rsv.g2': ['Mittag & Nachmittag', 'Öğle ve öğleden sonra', 'Lunch & afternoon'],
'rsv.g3': ['Abend', 'Akşam', 'Evening'],
'rsv.free': ['frei', 'uygun', 'available'],
'rsv.few': ['wenige Plätze', 'az yer kaldı', 'few seats left'],
'rsv.full': ['ausgebucht', 'dolu', 'fully booked'],
'rsv.closed': ['geschlossen', 'kapalı', 'closed'],
'rsv.pm': ['Vorheriger Monat', 'Önceki ay', 'Previous month'],
'rsv.nm': ['Nächster Monat', 'Sonraki ay', 'Next month'],
'rsv.noslots': ['An diesem Tag ist online nichts mehr frei. Rufen Sie uns gern an:', 'Bu gün için çevrim içi yer kalmadı. Bizi arayabilirsiniz:', 'Nothing is available online on this day. Feel free to call us:'],
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
'rsv.test': ['Testbetrieb: Dieses Reservierungssystem wird gerade erprobt. Eine Reservierung hier gilt noch nicht. Bitte reservieren Sie bis dahin telefonisch.', 'Test aşaması: Bu rezervasyon sistemi şu anda deneniyor. Buradan yapılan rezervasyon henüz geçerli değildir. Lütfen şimdilik telefonla rezervasyon yapın.', 'Trial run: this reservation system is currently being tested. A reservation made here is not valid yet. Until then, please book by phone.'],
'rsv.demo': ['Vorführ-Modus: Diese Vorschau ist nicht mit dem Reservierungssystem verbunden. Eingaben bleiben auf diesem Gerät.', 'Tanıtım modu: Bu önizleme rezervasyon sistemine bağlı değil. Girdiler bu cihazda kalır.', 'Demo mode: this preview is not connected to the reservation system. Entries stay on this device.'],
'rsv.err.full': ['Diese Zeit ist gerade vergeben worden. Bitte wählen Sie eine andere.', 'Bu saat az önce doldu. Lütfen başka bir saat seçin.', 'This time has just been taken. Please choose another one.'],
'rsv.err.rate': ['Zu viele Anfragen. Bitte versuchen Sie es später noch einmal oder rufen Sie uns an.', 'Çok fazla talep. Lütfen daha sonra tekrar deneyin veya bizi arayın.', 'Too many requests. Please try again later or call us.'],
'rsv.err.net': ['Das hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal.', 'Şu anda olmadı. Lütfen tekrar deneyin.', 'That did not work just now. Please try again.'],
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
'ft.note': ['Interne Vorschau von XenoSmart für das Leonn Restaurant. Diese Seite ist nicht die offizielle Website. Der Gutschein ist nur eine Vorführung, die Reservierung läuft im Testbetrieb.', 'Leonn Restaurant için XenoSmart tarafından hazırlanan dahili önizleme. Bu sayfa resmi site değildir. Hediye çeki yalnızca bir tanıtımdır, rezervasyon test aşamasındadır.', 'Internal preview by XenoSmart for Leonn Restaurant. This page is not the official website. The gift card is a demonstration only; reservations are running as a trial.'],
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
'demoG': ['Vorschau: Auf der echten Seite beginnt hier die Zahlung. In dieser Vorschau wird nichts bestellt.', 'Önizleme: Gerçek sitede ödeme burada başlar. Bu önizlemede sipariş verilmez.', 'Preview: on the real site payment starts here. Nothing is ordered in this preview.'],
'need': ['Bitte füllen Sie die markierten Felder aus.', 'Lütfen işaretli alanları doldurun.', 'Please fill in the highlighted fields.'],
'for_': ['Für', 'Kime:', 'For'],
'from_': ['von', 'Gönderen:', 'from'],
'hot': ['Scharf', 'Acılı', 'Spicy'],
'mild': ['Leicht scharf', 'Hafif acılı', 'Mildly spicy'],
'pre': ['Nur auf Vorbestellung', 'Yalnızca ön siparişle', 'Pre-order only'],
'rec': ['Empfehlung des Hauses', 'Ustanın tavsiyesi', 'House recommendation'],
'bfph': ['Unser Frühstückstisch', 'Kahvaltı sofrası', 'Our breakfast table'],
'dishes': ['Gerichte', 'çeşit', 'dishes'],
'until14': ['täglich bis 14:00 Uhr', 'her gün 14:00’e kadar', 'daily until 14:00'],
'clock': [' Uhr', '', ''],
'prev': ['Vorheriges Gericht', 'Önceki yemek', 'Previous dish'],
'next': ['Nächstes Gericht', 'Sonraki yemek', 'Next dish'],
'close': ['Schließen', 'Kapat', 'Close'],
'amb': ['Ambiente', 'Atmosfer', 'Ambience'],
'amb.theme': ['Design', 'Tema', 'Design'],
'amb.mode': ['Darstellung', 'Görünüm', 'Appearance'],
'amb.music': ['Musik', 'Müzik', 'Music'],
'amb.note': ['Ihre Auswahl gilt nur auf diesem Gerät.', 'Seçiminiz yalnızca bu cihazda geçerlidir.', 'Your choice only applies on this device.'],
'amb.auto.s': ['passend zum Kalender', 'takvime göre', 'follows the calendar'],
'amb.now': ['jetzt', 'şimdi', 'now'],
'mode.dark': ['Dunkel', 'Koyu', 'Dark'],
'mode.light': ['Hell', 'Açık', 'Light'],
'mode.system': ['Wie Gerät', 'Cihaz gibi', 'Device'],
'music.s': ['Leise Instrumentalmusik im Hintergrund', 'Arka planda kısık enstrümantal müzik', 'Quiet instrumental background music'],
'music.on': ['Musik ausschalten', 'Müziği kapat', 'Turn music off'],
'music.off': ['Musik einschalten', 'Müziği aç', 'Turn music on'],
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
  if (it.rec) h += '<span class="tag rec">' + ic('star') + esc(t('rec')) + '</span>';
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
function sideNote(s, note) {
  var x = s.side;
  return '<p class="sn side"><span class="sideph"><img src="img/s/' + x.img + '" alt="" width="' + x.sw + '" height="' + x.sh + '" loading="lazy" decoding="async"></span><span>' + esc(note) + '</span></p>';
}
function splitList(s) { return String(s).split(/,\s(?![^(]*\))/); }
function cevParts(it) {
  var d = ds(it), m = d.split(/\s*(?:Garnituren|Garnitürler|Sides):\s*/);
  return { lead: m[0], garn: m[1] ? splitList(m[1]) : [] };
}
function garnHtml(list) {
  var imgs = (secById['leonn-kuzu-cevirme'] || {}).garnImg || [];
  return list.map(function (g, i) {
    var m = /^([^(]+)\s*(\(.*\))?$/.exec(g), x = imgs[i];
    return '<li' + (x ? ' class="gi"' : '') + '>' + (x ? '<img src="img/xs/' + x.img + '" alt="" loading="lazy" decoding="async">' : '') + '<b>' + esc((m ? m[1] : g).trim()) + '</b>' + (m && m[2] ? ' ' + esc(m[2]) : '') + '</li>';
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
      var hn = !multi || sid === 'fruhstuck' ? note : '';
      if (!gh) gh += '<div class="head"><h2>' + esc(multi ? g.n[LI] : title) + '</h2>' + (hn && !multi && s.side ? sideNote(s, hn) : '<p>' + esc(hn) + '</p>') + '</div>';
      if (multi && sid !== 'fruhstuck') gh += '<h3 class="sub">' + esc(title) + '</h3>' + (note ? (s.side ? sideNote(s, note) : '<p class="sn">' + esc(note) + '</p>') : '');
      if (sid === 'fruhstuck' && plain) {
        var a = s.items[0], b = s.items[1];
        var bp = s.photos || [];
        gh += '<div class="ess" data-rv>' + (bp.length ? '<figure class="ess-ph"><img src="img/' + bp[0].img + '" alt="' + esc(t('bfph')) + '" width="' + bp[0].w + '" height="' + bp[0].h + '" loading="lazy" decoding="async">' +
          bp.slice(1).map(function (x, i) { return '<img class="acc a' + i + '" src="img/s/' + x.img + '" alt="" width="' + x.sw + '" height="' + x.sh + '" loading="lazy" decoding="async">'; }).join('') + '</figure>' : '') + '<div><p class="eyebrow">' + esc(t('incl')) + '</p><h3>Breakfast Essentials</h3>' +
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
/* ------------------------------------------------------------------ Reservierung
   Spricht mit dem Reservierungssystem (config.js). Ist es nicht erreichbar, läuft ein Vorführ-Modus nur auf diesem Gerät. */
var API = (window.LEONN_CFG && window.LEONN_CFG.api) || '', DEMO_OK = !window.LEONN_CFG || window.LEONN_CFG.demo !== false || !API;
var RS = { step: 1, persons: 2, area: 'r', ym: '', date: '', time: '', cfg: null, demo: false, loading: false, months: {}, days: {},
  form: { name: '', tel: '', mail: '', note: '', ok: false }, t0: 0, busy: false, done: null, mine: {}, ask: '', timer: null };
function apiCall(path, opt) {
  if (!API) return Promise.reject(new Error('no api'));
  var ctl = ('AbortController' in window) ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
  opt = opt || {}; if (ctl) opt.signal = ctl.signal;
  return fetch(API + path, opt).then(function (r) { clearTimeout(to); return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); }, function (e) { clearTimeout(to); throw e; });
}
function addDaysStr(d, n) { var p = d.split('-'), x = new Date(+p[0], +p[1] - 1, +p[2] + n); return ymd(x); }
function demoHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function demoCfg() { var n = new Date(); return { mode: 'demo', firstSlot: '09:00', lastSlot: '21:30', slotMin: 30, maxParty: 9, vip: true, vipMin: 6, vipMax: 15, maxDays: 60, phone: '02443 9124069', autoConfirm: false, today: ymd(n), now: pad(n.getHours()) + ':' + pad(n.getMinutes()) }; }
function demoState(date) { var c = RS.cfg; return date < c.today ? 'past' : (date > addDaysStr(c.today, c.maxDays) ? 'far' : 'open'); }
function demoDay(date) {
  var c = RS.cfg, st = demoState(date), out = [];
  if (st !== 'open') return { date: date, state: st, slots: [] };
  for (var m = 9 * 60; m <= 21 * 60 + 30; m += 30) {
    var tm = pad(Math.floor(m / 60)) + ':' + pad(m % 60), h = demoHash(date + tm + RS.area), s = h % 9 === 0 ? 'full' : (h % 4 === 0 ? 'few' : 'free');
    if (date === c.today && m < (+c.now.slice(0, 2)) * 60 + (+c.now.slice(3)) + 60) s = 'past';
    out.push({ t: tm, s: s });
  }
  return { date: date, state: 'open', slots: out };
}
function demoMonth(ym) {
  var days = {}, last = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate();
  for (var d = 1; d <= last; d++) { var date = ym + '-' + pad(d), st = demoState(date); days[date] = st === 'open' ? (demoHash(date) % 7 === 0 ? 'few' : 'free') : st; }
  return { ym: ym, days: days };
}
function demoAll() { try { return JSON.parse(store('leonn-res-demo') || '{}') || {}; } catch (e) { return {}; } }
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
function areaLabel(a) { return a === 'v' ? 'V.I.P Room' : t('res.w1'); }
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
  var max = Math.max(c.maxParty, c.vip ? c.vipMax : 0);
  if (RS.persons > max) RS.persons = max;
  if (RS.persons > c.maxParty) RS.area = 'v';
  else if (!c.vip || RS.persons < c.vipMin) RS.area = 'r';
}
function rsvSteps() {
  var names = [t('rsv.s1'), t('rsv.s2'), t('rsv.s3')];
  $('#rsvSteps').innerHTML = RS.step > 3 ? '' : names.map(function (n, i) {
    var k = i + 1, cls = k === RS.step ? 'on' : (k < RS.step ? 'done' : '');
    return '<li class="' + cls + '"' + (k === RS.step ? ' aria-current="step"' : '') + '>' + (k < RS.step ? '<button type="button" data-rsv="go" data-step="' + k + '">' : '<span>') + '<i class="num">' + (k < RS.step ? ic('check') : k) + '</i><em>' + esc(n) + '</em>' + (k < RS.step ? '</button>' : '</span>') + '</li>';
  }).join('');
  $('#rsvSteps').hidden = RS.step > 3;
}
function rsvPanel1() {
  var c = RS.cfg, max = Math.max(c.maxParty, c.vip ? c.vipMax : 0), h = '', i, ppl = '';
  for (i = 1; i <= Math.max(RS.persons, Math.min(max, 10)); i++) ppl += '<span class="' + (i <= RS.persons ? 'on' : '') + '">' + ic('person') + '</span>';
  h += '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q1')) + '</h2><div class="rsv-people" aria-hidden="true">' + ppl + '</div><div class="rsv-nums" role="radiogroup" aria-label="' + esc(t('res.pers')) + '">';
  for (i = 1; i <= max; i++) h += '<button type="button" role="radio" aria-checked="' + (i === RS.persons) + '" data-n="' + i + '" class="num' + (i > c.maxParty ? ' vipn' : '') + '">' + i + '</button>';
  h += '</div><p class="rsv-hint">' + (RS.persons > c.maxParty ? esc(fill(t('rsv.v.only'), { n: c.maxParty + 1 })) + ' ' : '') + esc(fill(t('rsv.big'), { n: max })) + ' <a href="tel:+4924439124069" class="nb">' + esc(c.phone) + '</a></p>';
  var rOk = RS.persons <= c.maxParty, vOk = c.vip && RS.persons >= c.vipMin && RS.persons <= c.vipMax;
  h += '<h2 class="rsv-q sm">' + esc(t('rsv.area')) + '</h2><div class="rsv-areas" role="radiogroup" aria-label="' + esc(t('res.where')) + '">' +
    '<button type="button" class="rsv-area" role="radio" data-area="r" aria-checked="' + (RS.area === 'r') + '"' + (rOk ? '' : ' disabled') + '><img src="img/grill-poster.jpg" alt="" width="880" height="660" loading="lazy"><span><b>' + esc(t('res.w1')) + '</b><i>' + esc(fill(t('rsv.r.s'), { n: c.maxParty })) + '</i></span></button>' +
    (c.vip ? '<button type="button" class="rsv-area" role="radio" data-area="v" aria-checked="' + (RS.area === 'v') + '"' + (vOk ? '' : ' disabled') + '><img src="img/vip-room.jpg" alt="" width="1400" height="1052" loading="lazy"><span><b>V.I.P Room</b><i>' + esc(fill(t('rsv.v.s'), { a: c.vipMin, b: c.vipMax })) + '</i></span></button>' : '') +
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
  day.slots.forEach(function (x) { if (x.s !== 'past') g[x.t < '12:00' ? 0 : (x.t < '18:00' ? 1 : 2)].push(x); });
  if (!day.slots.some(function (x) { return x.s === 'free' || x.s === 'few'; })) return h + '<p class="rsv-pick">' + esc(t('rsv.noslots')) + ' <a href="tel:+4924439124069" class="nb">' + esc(RS.cfg.phone) + '</a></p>';
  ['rsv.g1', 'rsv.g2', 'rsv.g3'].forEach(function (k, i) {
    if (!g[i].length) return;
    h += '<div class="tgroup"><h4>' + esc(t(k)) + '</h4><div class="tms">' + g[i].map(function (x) {
      return '<button type="button" class="tm s-' + x.s + '" data-time="' + x.t + '"' + (x.s === 'full' ? ' disabled' : '') + ' aria-pressed="' + (x.t === RS.time) + '" aria-label="' + x.t + t('clock') + (x.s === 'few' ? ', ' + esc(t('rsv.few')) : x.s === 'full' ? ', ' + esc(t('rsv.full')) : '') + '"><b class="num">' + x.t + '</b>' + (x.s === 'few' ? '<i>' + esc(t('rsv.few')) + '</i>' : x.s === 'full' ? '<i>' + esc(t('rsv.full')) + '</i>' : '') + '</button>';
    }).join('') + '</div></div>';
  });
  return h + '<p class="rsv-bf">' + esc(t('con.bf')) + '</p>';
}
function rsvPanel2() {
  var k = RS.ym + '|' + rsvKey(), dk = RS.date + '|' + rsvKey();
  return '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q2')) + '</h2><div class="rsv-sum"><span>' + esc(persLabel(RS.persons)) + '</span><span>' + esc(areaLabel(RS.area)) + '</span><button type="button" class="lnk" data-rsv="go" data-step="1">' + esc(t('rsv.change')) + '</button></div>' +
    '<div class="rsv-when"><div id="rsvCal">' + calHtml(RS.months[k]) + '</div><div class="times" id="rsvTimes" aria-live="polite">' + timesHtml(RS.days[dk]) + '</div></div>' +
    '<div class="rsv-nav"><button type="button" class="btn ghost" data-rsv="back">' + esc(t('rsv.back')) + '</button><button type="button" class="btn" data-rsv="next"' + (RS.date && RS.time ? '' : ' disabled') + '>' + esc(t('rsv.next')) + ic('right') + '</button></div>';
}
function rsvPanel3() {
  var f = RS.form;
  return '<h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.q3')) + '</h2><div class="rsv-sum"><span>' + esc(persLabel(RS.persons)) + '</span><span>' + esc(fmtShort(RS.date)) + '</span><span>' + esc(RS.time + t('clock')) + '</span><span>' + esc(areaLabel(RS.area)) + '</span><button type="button" class="lnk" data-rsv="go" data-step="2">' + esc(t('rsv.change')) + '</button></div>' +
    '<form class="form" id="rsvForm" novalidate>' +
    '<label><span>' + esc(t('res.name')) + '</span><input type="text" id="rName" autocomplete="name" maxlength="80" required value="' + esc(f.name) + '"></label>' +
    '<label><span>' + esc(t('res.tel')) + '</span><input type="tel" id="rTel" autocomplete="tel" inputmode="tel" maxlength="30" required value="' + esc(f.tel) + '"></label>' +
    '<label class="full"><span>' + esc(t('res.mail')) + '</span><input type="email" id="rMail" autocomplete="email" maxlength="120" required value="' + esc(f.mail) + '"></label>' +
    '<label class="full"><span>' + esc(t('res.note')) + '</span><textarea id="rNote" rows="2" maxlength="400">' + esc(f.note) + '</textarea></label>' +
    '<label class="hp" aria-hidden="true">Website<input type="text" id="rWeb" tabindex="-1" autocomplete="off"></label>' +
    '<label class="full check"><input type="checkbox" id="rOk"' + (f.ok ? ' checked' : '') + '><span>' + esc(t('rsv.consent')) + '</span></label>' +
    '<div class="full rsv-nav"><button type="button" class="btn ghost" data-rsv="back">' + esc(t('rsv.back')) + '</button><button class="btn" type="submit" id="rsvSend"' + (RS.busy ? ' disabled' : '') + '>' + esc(RS.busy ? t('rsv.sending') : t(RS.cfg.autoConfirm ? 'rsv.send2' : 'rsv.send')) + '</button></div></form>';
}
function rsvPanel4() {
  var d = RS.done, live = RS.mine[d.token]; if (live) d.status = live.status;
  var ok = d.status === 'confirmed';
  return '<div class="rsv-done s-' + d.status + '"><div class="rsv-check" aria-hidden="true">' + ic('check') + '</div><h2 class="rsv-q" tabindex="-1">' + esc(t(ok ? 'rsv.done.h2' : 'rsv.done.h')) + '</h2>' +
    '<p>' + esc(t(ok ? 'rsv.done.p2' : 'rsv.done.p')) + '</p>' +
    '<div class="rsv-code"><span>' + esc(t('rsv.code')) + '</span><b class="num">' + esc(d.code) + '</b></div>' +
    '<div class="rsv-sum"><span>' + esc(persLabel(d.persons)) + '</span><span>' + esc(fmtShort(d.date)) + '</span><span>' + esc(d.time + t('clock')) + '</span><span>' + esc(areaLabel(d.area)) + '</span></div>' +
    '<div class="rsv-nav"><button type="button" class="btn ghost" data-rsv="cal" data-tok="' + esc(d.token) + '">' + ic('cal') + esc(t('rsv.cal')) + '</button><button type="button" class="btn ghost" data-rsv="new">' + esc(t('rsv.new')) + '</button></div></div>';
}
function rsvRender(focus) {
  var p = $('#rsvPanel'), c = RS.cfg, n = $('#rsvNote');
  if (!c) {
    $('#rsvSteps').hidden = true; n.hidden = true;
    p.innerHTML = RS.off ? '<div class="rsv-off"><h2 class="rsv-q" tabindex="-1">' + esc(t('rsv.off.h')) + '</h2><p>' + esc(t('rsv.off.p')) + ' <a href="tel:+4924439124069" class="nb">02443 9124069</a></p><div class="rsv-nav"><button type="button" class="btn" data-rsv="retry">' + ic('refresh') + esc(t('rsv.retry')) + '</button></div></div>'
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
  if (focus) { var h = $('.rsv-q', p); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } } var y = $('#rsvSteps').getBoundingClientRect().top + window.pageYOffset - hhNow() - 18; if (window.pageYOffset > y || p.getBoundingClientRect().top > window.innerHeight * 0.6) jumpTo(y); }
}
function rsvLoad2() {
  var c = RS.cfg, key = rsvKey(), ym = RS.ym;
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
    // nicht erreichbar: nur vor dem Start (oder in der privaten Vorschau) die Vorführung zeigen, sonst einen deutlichen Hinweis
    var fail = function () { if (DEMO_OK) { RS.demo = true; RS.cfg = demoCfg(); } else RS.off = true; };
    apiCall('/config').then(function (r) { if (!r.ok || !r.j || !r.j.today) throw new Error('cfg'); RS.cfg = r.j; RS.demo = false; })
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
  var body = { date: RS.date, time: RS.time, persons: RS.persons, area: RS.area, name: f.name.trim(), phone: f.tel.trim(), email: f.mail.trim(), note: f.note.trim(), lang: LANGS[LI], consent: true, web: $('#rWeb').value, el: Date.now() - RS.t0 };
  RS.busy = true; rsvMsg(''); var btn = $('#rsvSend'); btn.disabled = true; btn.textContent = t('rsv.sending');
  var p;
  if (RS.demo) {
    var all = demoAll(), tok = 'demo-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    all[tok] = { code: 'L' + Math.random().toString(36).slice(2, 7).toUpperCase(), date: body.date, time: body.time, persons: body.persons, area: body.area, name: body.name, status: 'pending', test: true, canCancel: true };
    store('leonn-res-demo', JSON.stringify(all));
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
function mineList() { try { var a = JSON.parse(store('leonn-res') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function mineSave(a) { store('leonn-res', JSON.stringify(a.slice(-4))); }
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
  if (k.indexOf('demo-') === 0) { var all = demoAll(); if (all[k]) { all[k].status = 'cancelled'; all[k].canCancel = false; store('leonn-res-demo', JSON.stringify(all)); } mineLoad(); return; }
  apiCall('/r/' + k + '/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(function (r) { if (r.ok) RS.mine[k] = r.j; RS.months = {}; RS.days = {}; mineRender(); if (RS.step === 4 && RS.done && RS.done.token === k) rsvRender(); }).catch(function () { rsvFail(); mineRender(); });
}
function rsvIcs(k) {
  var d = RS.mine[k] || (RS.done && RS.done.token === k ? RS.done : null); if (!d) return;
  var ds = d.date.replace(/-/g, ''), tm = d.time.replace(':', '') + '00', end = pad(Math.min(23, +d.time.slice(0, 2) + 2)) + d.time.slice(3) + '00';
  var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Leonn Restaurant//Reservierung//DE', 'BEGIN:VEVENT', 'UID:' + d.code + '@leonn', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    'DTSTART;TZID=Europe/Berlin:' + ds + 'T' + tm, 'DTEND;TZID=Europe/Berlin:' + ds + 'T' + end, 'SUMMARY:Leonn Restaurant – ' + persLabel(d.persons), 'LOCATION:Bergisch Gladbacher Straße 261–263\\, 51063 Köln', 'DESCRIPTION:' + t('rsv.code') + ': ' + d.code, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'leonn-' + d.code + '.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); } catch (e) {}
}
function initRes() {
  var root = $('#v-reservieren');
  root.addEventListener('click', function (e) {
    var el, c = RS.cfg;
    if (!c) { if (e.target.closest('[data-rsv="retry"]')) rsvEnter(); return; }
    if ((el = e.target.closest('[data-n]'))) { RS.persons = +el.getAttribute('data-n'); rsvFix(); RS.time = ''; rsvRender(); var b = $('#rsvPanel [data-n="' + RS.persons + '"]'); if (b) b.focus(); return; }
    if ((el = e.target.closest('[data-area]'))) { if (el.disabled) return; RS.area = el.getAttribute('data-area'); RS.time = ''; rsvRender(); var a = $('#rsvPanel [data-area="' + RS.area + '"]'); if (a) a.focus(); return; }
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
  root.addEventListener('change', function (e) { if (e.target.id === 'rOk') RS.form.ok = e.target.checked; });
  root.addEventListener('submit', function (e) { e.preventDefault(); rsvSubmit(); });
  root.addEventListener('keydown', function (e) {
    var g = e.target.closest && e.target.closest('.rsv-nums'); if (!g) return;
    var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0); if (!d) return;
    e.preventDefault(); var n = $('#rsvPanel [data-n="' + (RS.persons + d) + '"]'); if (n) n.click();
  });
  $('#vipAsk').addEventListener('click', function () { RS.area = 'v'; if (RS.cfg && RS.persons < RS.cfg.vipMin) RS.persons = RS.cfg.vipMin; else if (!RS.cfg && RS.persons < 6) RS.persons = 6; RS.step = 1; RS.done = null; RS.time = ''; if (RS.cfg) rsvRender(); });
  // Status-Link aus der Bestätigung: …/?r=<Token>#reservieren
  var m = /[?&]r=([A-Za-z0-9_-]{20,60})/.exec(location.search || '');
  if (m) { var l = mineList(); if (!l.some(function (x) { return x.t === m[1]; })) { l.push({ t: m[1], d: '' }); mineSave(l); } try { history.replaceState(null, '', location.pathname + '#reservieren'); } catch (e) { location.hash = '#reservieren'; } }
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
  splitWords(); renderBelt(); renderGroups(); renderMenu(); renderShow(); renderCats(); renderCev(); renderTable(); setStatus(); updGift(); rsvRender(); mineRender(); vidLabel();
  if (typeof ambText === 'function' && AMB.t) { ambText(); ambPanel(); musUi(); }
  if (modalId) openItem(modalId);
  setupReveal();
}

/* ------------------------------------------------------------------ Navigation zwischen den Ansichten */
var VIEWS = ['start', 'speisekarte', 'ueber-uns', 'reservieren', 'gutschein', 'vip-room', 'kontakt'], pendingGroup = null, curView = null;
function navOpen(o) {
  var hd = $('header.top'); if (o && hd) $('#nav').style.setProperty('--navtop', Math.round(Math.max(0, hd.getBoundingClientRect().bottom) + 14) + 'px');
  $('#nav').classList.toggle('open', o); $('#burger').setAttribute('aria-expanded', o ? 'true' : 'false');
  document.documentElement.style.overflow = o ? 'hidden' : '';
}
// Sofort springen: die Seite scrollt sonst wegen „scroll-behavior:smooth“ weich – Safari bricht das beim Seitenwechsel ab
// und blieb unten stehen (z. B. Fußzeile statt Reservierung)
function jumpTo(y) { var s = document.documentElement.style, o = s.scrollBehavior; s.scrollBehavior = 'auto'; window.scrollTo(0, Math.max(0, y)); s.scrollBehavior = o; }
function scrollToGroup(id, smooth) {
  var el = document.getElementById(id); if (!el) return;
  var y = el.getBoundingClientRect().top + window.pageYOffset - (barsH() + 6);
  if (smooth && !reduce) window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); else jumpTo(y);
}
function route() {
  var h = (location.hash || '').replace('#', ''); if (VIEWS.indexOf(h) < 0) h = 'start';
  navOpen(false);
  if (h !== curView) {
    curView = h;
    VIEWS.forEach(function (v) { var el = document.getElementById('v-' + v); if (el) el.classList.toggle('on', v === h); });
    $$('nav.main a').forEach(function (a) { var on = a.getAttribute('href') === '#' + h; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    jumpTo(0);
  }
  setHH(); setupReveal(); onScroll();
  if (h === 'speisekarte' && pendingGroup) { var g = pendingGroup; pendingGroup = null; setTimeout(function () { scrollToGroup(g, false); onScroll(); }, 60); }
  if (h === 'start' && beltPending) renderBelt();
  if (h === 'reservieren') rsvEnter();
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
/* Bewegter Hintergrund im Bogen: Funken (Klassik), Schnee, Sterne, Blüten, Blätter, Lichtpunkte, Glitzer. */
var FX = { kind: 'embers', light: false, rgb: '219,189,130', reset: null };
function embers() {
  var c = $('#embers'); if (!c || reduce) return;
  var x = c.getContext('2d'), P = [], B = [], W = 0, H = 0, i, nextBurst = 0;
  function size() { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; }
  function count() { return Math.max(24, Math.min(70, Math.round(W * H / 15000))); }
  function nw(any) {
    var k = FX.kind, r = Math.random;
    if (k === 'embers') return { x: W * (0.35 + r() * 0.65), y: any ? r() * H : H + 10, r: r() * 1.8 + 0.4, vy: r() * 0.7 + 0.25, vx: (r() - 0.5) * 0.4, a: r() * 0.7 + 0.2, ph: r() * 6.28 };
    if (k === 'stars') return { x: r() * W, y: r() * H * 0.9, r: r() * 1.3 + 0.5, a: r() * 0.6 + 0.3, ph: r() * 6.28, sp: 600 + r() * 1400 };
    if (k === 'glints') return { x: r() * W, y: any ? r() * H : H + 20, r: r() * 5 + 2, vy: r() * 0.25 + 0.08, vx: (r() - 0.5) * 0.15, a: r() * 0.35 + 0.1, ph: r() * 6.28 };
    if (k === 'sparkle') return { x: r() * W, y: any ? r() * H : H + 10, r: r() * 1.4 + 0.4, vy: r() * 0.5 + 0.15, vx: (r() - 0.5) * 0.3, a: r() * 0.7 + 0.3, ph: r() * 6.28 };
    // fallend: Schnee, Blüten, Blätter
    return { x: r() * W, y: any ? r() * H : -12, r: k === 'snow' ? r() * 2 + 0.7 : r() * 3 + 4, vy: k === 'snow' ? r() * 0.6 + 0.25 : r() * 0.5 + 0.35, vx: (r() - 0.5) * 0.3, a: r() * 0.5 + 0.4, ph: r() * 6.28, rot: r() * 6.28, vr: (r() - 0.5) * 0.03, hue: r() };
  }
  function fill() { P = []; B = []; for (i = 0; i < count(); i++) P.push(nw(true)); }
  FX.reset = fill;
  size(); fill();
  window.addEventListener('resize', function () { size(); fill(); });
  function burst() {
    var cx = W * (0.2 + Math.random() * 0.6), cy = H * (0.12 + Math.random() * 0.3), n = 34, j;
    for (j = 0; j < n; j++) { var ang = j / n * 6.283 + Math.random() * 0.2, sp = 0.9 + Math.random() * 1.6; B.push({ x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, c: Math.random() < 0.3 ? '255,255,255' : FX.rgb }); }
  }
  function leafPath(s) { x.beginPath(); x.moveTo(0, -s); x.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s); x.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s); x.fill(); }
  (function tick(ts) {
    if (curView === 'start' && !document.hidden && window.pageYOffset < H + 200) {
      var k = FX.kind, lite = FX.light, p;
      x.clearRect(0, 0, W, H); x.shadowBlur = 0;
      x.globalCompositeOperation = lite || k === 'petals' || k === 'leaves' ? 'source-over' : 'lighter';
      for (i = 0; i < P.length; i++) {
        p = P[i];
        if (k === 'embers') {
          p.y -= p.vy; p.x += p.vx + Math.sin(ts / 900 + p.ph) * 0.3; if (p.y < -10) P[i] = nw(false);
          x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28);
          x.fillStyle = 'rgba(' + (lite ? '200,120,40' : '240,190,110') + ',' + (p.a * (lite ? 0.7 : 1) * (0.6 + 0.4 * Math.sin(ts / 300 + p.ph))).toFixed(3) + ')';
          if (!lite) { x.shadowBlur = 10; x.shadowColor = 'rgba(255,170,80,.9)'; }
          x.fill();
        } else if (k === 'stars') {
          var tw = p.a * (0.3 + 0.7 * Math.abs(Math.sin(ts / p.sp + p.ph)));
          x.fillStyle = 'rgba(' + (lite ? FX.rgb : (p.r > 1.4 ? FX.rgb : '255,250,235')) + ',' + tw.toFixed(3) + ')';
          if (p.r > 1.45) { var sz = p.r * 3.2; x.beginPath(); x.moveTo(p.x, p.y - sz); x.quadraticCurveTo(p.x, p.y, p.x + sz, p.y); x.quadraticCurveTo(p.x, p.y, p.x, p.y + sz); x.quadraticCurveTo(p.x, p.y, p.x - sz, p.y); x.quadraticCurveTo(p.x, p.y, p.x, p.y - sz); x.fill(); }
          else { x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill(); }
        } else if (k === 'glints') {
          p.y -= p.vy; p.x += p.vx + Math.sin(ts / 2400 + p.ph) * 0.2; if (p.y < -20) P[i] = nw(false);
          var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4), al = p.a * (0.6 + 0.4 * Math.sin(ts / 1600 + p.ph));
          g.addColorStop(0, 'rgba(' + FX.rgb + ',' + al.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + FX.rgb + ',0)');
          x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 2.4, 0, 6.28); x.fill();
        } else if (k === 'sparkle') {
          p.y -= p.vy; p.x += p.vx + Math.sin(ts / 700 + p.ph) * 0.25; if (p.y < -10) P[i] = nw(false);
          x.fillStyle = 'rgba(' + FX.rgb + ',' + (p.a * (0.4 + 0.6 * Math.abs(Math.sin(ts / 250 + p.ph)))).toFixed(3) + ')';
          x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill();
        } else {
          p.y += p.vy; p.x += p.vx + Math.sin(ts / 1500 + p.ph) * (k === 'snow' ? 0.35 : 0.6); p.rot += p.vr;
          if (p.y > H + 14) P[i] = nw(false);
          if (k === 'snow') {
            x.fillStyle = (lite ? 'rgba(90,125,165,' : 'rgba(255,255,255,') + (p.a * (lite ? 0.55 : 0.85)).toFixed(3) + ')';
            x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28); x.fill();
          } else {
            x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
            if (k === 'petals') { x.fillStyle = 'rgba(' + (p.hue < 0.5 ? (lite ? '176,74,107' : '235,169,188') : (lite ? '210,140,160' : '250,225,232')) + ',' + (p.a * 0.8).toFixed(3) + ')'; x.beginPath(); x.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.28); x.fill(); }
            else { x.fillStyle = 'rgba(' + (p.hue < 0.33 ? '196,105,42' : p.hue < 0.66 ? '165,55,40' : '214,160,70') + ',' + (p.a * (lite ? 0.75 : 0.85)).toFixed(3) + ')'; leafPath(p.r); }
            x.restore();
          }
        }
      }
      if (FX.kind === 'sparkle') {
        if (ts > nextBurst) { burst(); nextBurst = ts + 3500 + Math.random() * 3500; }
        for (i = B.length - 1; i >= 0; i--) {
          var q = B[i]; q.x += q.vx; q.y += q.vy; q.vy += 0.018; q.vx *= 0.985; q.life -= 0.011;
          if (q.life <= 0) { B.splice(i, 1); continue; }
          x.fillStyle = 'rgba(' + q.c + ',' + (q.life * 0.9).toFixed(3) + ')'; x.beginPath(); x.arc(q.x, q.y, 1.3, 0, 6.28); x.fill();
        }
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

/* ------------------------------------------------------------------ Ambiente: Designs, Hell/Dunkel, Musik */
var AMB_T = ['klassik', 'fruehling', 'sommer', 'herbst', 'winter', 'ramadan', 'weihnachten', 'silvester'];
var AMB_N = {
  auto: ['Automatisch', 'Otomatik', 'Automatic'], klassik: ['Leonn Klassik', 'Leonn Klasik', 'Leonn Classic'], fruehling: ['Frühling', 'İlkbahar', 'Spring'],
  sommer: ['Sommer', 'Yaz', 'Summer'], herbst: ['Herbst', 'Sonbahar', 'Autumn'], winter: ['Winter', 'Kış', 'Winter'],
  ramadan: ['Ramadan & Bayram', 'Ramazan & Bayram', 'Ramadan & Eid'], weihnachten: ['Weihnachten', 'Noel', 'Christmas'], silvester: ['Silvester', 'Yılbaşı', 'New Year’s Eve']
};
// Vorschau im Auswahlfeld: Hintergrund, Akzent, Zeichen
var AMB_SW = { auto: ['#0B0A26', '#DBBD82', 'i-cal'], klassik: ['#0B0A26', '#DBBD82', 'd-spark'], fruehling: ['#0E1A17', '#EBA9BC', 'd-tulip'], sommer: ['#061A2C', '#74D6CC', 'd-sun'],
  herbst: ['#1A0F12', '#E3A65A', 'd-leaf'], winter: ['#08162B', '#C9DDF0', 'd-flake'], ramadan: ['#0A0D2B', '#E8C56E', 'd-crescent'], weihnachten: ['#0B1A14', '#E3C27A', 'd-bauble'], silvester: ['#0B0B0F', '#E9D29C', 'd-spark'] };
var AMB_FX = { klassik: 'embers', fruehling: 'petals', sommer: 'glints', herbst: 'leaves', winter: 'snow', ramadan: 'stars', weihnachten: 'snow', silvester: 'sparkle' };
// Gruß über der Überschrift ({y} = Jahr)
var AMB_HI = {
  ramadan: ['Gesegneten Ramadan', 'Hayırlı Ramazanlar', 'Ramadan Mubarak'],
  bayram: ['Frohes Ramadanfest', 'Ramazan Bayramınız mübarek olsun', 'Eid Mubarak'],
  kurban: ['Frohes Opferfest', 'Kurban Bayramınız mübarek olsun', 'Eid al-Adha Mubarak'],
  advent: ['Schöne Adventszeit', 'Mutlu Noeller', 'Season’s greetings'],
  xmas: ['Frohe Weihnachten', 'Mutlu Noeller', 'Merry Christmas'],
  nye: ['Guten Rutsch ins Jahr {y}', 'Mutlu yıllar · {y}', 'Happy New Year {y}'],
  ny: ['Frohes neues Jahr {y}', 'Mutlu yıllar · {y}', 'Happy New Year {y}'],
  winter: ['Gemütliche Wintertage', 'Keyifli kış günleri', 'Cosy winter days'],
  fruehling: ['Willkommen, Frühling', 'Hoş geldin bahar', 'Hello, spring'],
  sommer: ['Schöne Sommertage', 'Güzel yaz günleri', 'Sunny summer days'],
  herbst: ['Goldene Herbsttage', 'Altın sonbahar günleri', 'Golden autumn days']
};
// Band unter der Startseite: Überschrift, Text, Knöpfe [Ziel, Beschriftung DE/TR/EN]
var AMB_BAND = {
  ramadan: { h: ['Iftar bei Leonn', 'Leonn’da iftar', 'Iftar at Leonn'], p: ['Das Fasten gemeinsam brechen, mit Familie und Freunden, in ruhiger Atmosphäre. Bitte reservieren Sie Ihren Tisch rechtzeitig.', 'Orucunuzu aileniz ve dostlarınızla, huzurlu bir ortamda açın. Lütfen masanızı zamanında ayırtın.', 'Break your fast together with family and friends in a calm atmosphere. Please book your table in good time.'], b: [['#reservieren', 'cta.res'], ['#speisekarte', 'cta.menu']] },
  bayram: { h: ['Bayram bei Leonn', 'Leonn’da bayram', 'Eid at Leonn'], p: ['Feiern Sie mit der ganzen Familie. Für größere Gruppen gibt es unseren V.I.P Room.', 'Bayramı tüm ailenizle kutlayın. Kalabalık gruplar için V.I.P Room’umuz hazır.', 'Celebrate with the whole family. For larger groups there is our V.I.P Room.'], b: [['#reservieren', 'cta.res'], ['#vip-room', 'V.I.P Room']] },
  weihnachten: { h: ['Weihnachtsfeier bei Leonn', 'Leonn’da yılsonu kutlaması', 'Christmas party at Leonn'], p: ['Mit Kollegen, Familie oder Freunden: Für Gruppen ab 6 Personen gibt es den V.I.P Room. Für die Feier bei Ihnen können Sie Catering anfragen.', 'İş arkadaşlarınız, aileniz veya dostlarınızla: 6 kişiden itibaren gruplar için V.I.P Room. Kendi mekânınızdaki kutlama için catering talep edebilirsiniz.', 'With colleagues, family or friends: groups of 6 or more can use the V.I.P Room. For a celebration at your place, you can request catering.'], b: [['#vip-room', 'V.I.P Room'], ['catering/', 'Catering']] },
  silvester: { h: ['Festlicher Jahresausklang', 'Yıla güzel bir veda', 'A festive farewell to the year'], p: ['Ein besonderes Abendessen zum Jahresende. An den letzten Abenden des Jahres sind die Plätze begehrt, reservieren Sie früh.', 'Yılın son akşamlarında özel bir akşam yemeği. Bu akşamlarda yerler çabuk doluyor, erkenden ayırtın.', 'A special dinner to end the year. Tables are in demand on the last evenings of the year, so book early.'], b: [['#reservieren', 'cta.res'], ['#speisekarte', 'cta.menu']] },
  winter: { h: ['Wärme für kalte Tage', 'Soğuk günlere sıcacık lezzetler', 'Warmth for cold days'], p: ['Suppen mit frischem Ballonbrot, Güveç aus dem Ofen und dazu ein Çay: genau das Richtige, wenn es draußen kalt ist.', 'Balon ekmekle çorbalar, fırından güveç ve yanında bir çay: dışarısı soğukken tam ihtiyacınız olan.', 'Soups with fresh balloon bread, güveç from the oven and a glass of çay: just right when it is cold outside.'], b: [['g2'], ['g5']] },
  fruehling: { h: ['Frühstück im Frühling', 'Baharda kahvaltı', 'Breakfast in spring'], p: ['Breakfast Essentials mit frischem Gemüse, Käse, Oliven und hausgemachten Marmeladen, täglich bis 14 Uhr.', 'Taze sebze, peynir, zeytin ve ev yapımı reçellerle Breakfast Essentials, her gün saat 14:00’e kadar.', 'Breakfast Essentials with fresh vegetables, cheese, olives and homemade jams, daily until 2 pm.'], b: [['g1'], ['#reservieren', 'cta.res']] },
  sommer: { h: ['Leicht durch den Sommer', 'Yaza hafif lezzetler', 'Light dishes for summer'], p: ['Frische Salate, Meze, Ayran und Limonata: leicht und erfrischend für warme Tage.', 'Taze salatalar, mezeler, ayran ve limonata: sıcak günler için hafif ve ferahlatıcı.', 'Fresh salads, meze, ayran and lemonade: light and refreshing for warm days.'], b: [['g2'], ['g3']] },
  herbst: { h: ['Herbstzeit ist Güveç-Zeit', 'Sonbahar güveç zamanı', 'Autumn is güveç season'], p: ['Wenn die Tage kürzer werden: Güveç aus dem Ofen, Leonn Kuzu Çevirme vom Spieß und Künefe zum Abschluss.', 'Günler kısalırken: fırından güveç, şişte Leonn Kuzu Çevirme ve tatlı olarak künefe.', 'As the days grow shorter: güveç from the oven, Leonn Kuzu Çevirme from the spit and künefe to finish.'], b: [['g5'], ['g6']] }
};
var AMB = { pref: 'auto', site: 'auto', mode: 'dark', t: 'klassik', k: '', y: 0, open: false };
function ambLight() { return document.documentElement.getAttribute('data-mode') === 'light'; }
function ambResolve() {
  var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), y = d.getFullYear(), a = window.leonnAuto ? window.leonnAuto(d) : ['klassik', 'klassik'];
  var t = AMB.pref !== 'auto' ? AMB.pref : (AMB.site !== 'auto' ? AMB.site : a[0]), k = t;
  if (AMB_T.indexOf(t) < 0) t = k = 'klassik';
  if (t === 'ramadan') k = a[0] === 'ramadan' ? a[1] : 'ramadan';
  if (t === 'weihnachten') k = m === 12 && day >= 24 && day <= 26 ? 'xmas' : 'advent';
  if (t === 'silvester') k = m === 1 && day === 1 ? 'ny' : 'nye';
  AMB.t = t; AMB.k = k; AMB.y = t === 'silvester' && m >= 7 ? y + 1 : y; AMB.auto = a;
}
function ambSym(id, cls, st) { return '<svg class="' + (cls || '') + '"' + (st ? ' style="' + st + '"' : '') + ' aria-hidden="true"><use href="#' + id + '"/></svg>'; }
// Schmuck: Lage kommt aus dem CSS (.m Hauptzeichen, .h1–.h3 hängend, .s1–.s3 klein), Größe hier (--w Breite, --ar Höhe/Breite)
function ambD(id, cls, w, ar, extra) { return ambSym(id, cls, '--w:' + w + 'px;--ar:' + ar + ';' + (extra || '')); }
function ambH(id, cls, len, w, ar, extra) { return '<span class="hang ' + cls + '" style="--l:' + len + 'px">' + ambD(id, id === 'd-lantern' ? 'lantern' : '', w, ar, extra) + '</span>'; }
function ambDeco() {
  var th = AMB.t, h = '';
  if (th === 'ramadan') h = ambD('d-crescent', 'm bob', 92, 1) + ambH('d-lantern', 'h1', 26, 34, 2.4) + ambH('d-lantern', 'h2', 64, 40, 2.4) + ambH('d-lantern', 'h3', 14, 30, 2.4) + ambD('d-spark', 's1', 14, 1) + ambD('d-spark', 's2', 10, 1);
  else if (th === 'weihnachten') h = ambH('d-bauble', 'h1', 22, 34, 1.55, '--c:#B3263A') + ambH('d-bauble', 'h2', 58, 40, 1.55) + ambH('d-bauble', 'h3', 10, 30, 1.55, '--c:#2E6B4A') + ambD('d-spark', 'm bob', 50, 1) + ambD('d-spark', 's1', 14, 1) + ambD('d-spark', 's3', 11, 1);
  else if (th === 'silvester') h = '<span class="yr">' + AMB.y + '</span>' + ambD('d-spark', 'm bob', 46, 1) + ambD('d-spark', 's1', 12, 1) + ambD('d-spark', 's3 bob', 16, 1);
  else if (th === 'winter') h = ambD('d-flake', 'm spin', 84, 1, 'opacity:.85') + ambD('d-flake', 's3 spin', 34, 1, 'opacity:.6;animation-duration:80s') + ambD('d-flake', 's1 spin', 24, 1, 'opacity:.5;animation-direction:reverse');
  else if (th === 'fruehling') h = ambD('d-tulip', 'm bob', 58, 2) + ambD('d-tulip', 's3 bob', 34, 2, 'animation-delay:-3s');
  else if (th === 'sommer') h = ambD('d-sun', 'm spin', 100, 1, 'animation-duration:90s') + ambH('d-nazar', 'h2', 30, 36, 1.23);
  else if (th === 'herbst') h = ambD('d-pome', 'm bob', 80, 1.07) + ambD('d-leaf', 's3 bob', 32, 1, '--c:#C4692A;animation-delay:-2s') + ambD('d-leaf', 's1 bob', 22, 1, '--c:#A5372A;animation-delay:-4s');
  var el = $('#deco'); if (el) el.innerHTML = h;
  ambLayout();
}
// Tablet hochkant und Handy (einspaltig): freie Flächen neben dem Text ausmessen und den Schmuck nur dort hinsetzen.
// Gemessen wird über offsetLeft/offsetTop, damit die Einblend-Animation der Überschrift das Ergebnis nicht verfälscht.
var AMB_LQ = 0;
function ambLayoutSoon() { if (AMB_LQ) return; AMB_LQ = (window.requestAnimationFrame || setTimeout)(function () { AMB_LQ = 0; ambLayout(); }); }
function ambOff(el) { var x = 0, y = 0; for (var e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x: x, y: y }; }
function ambLayout() {
  var box = $('#deco'); if (!box) return;
  var kids = [].slice.call(box.querySelectorAll('svg.m, .hang, svg.s1, svg.s2, svg.s3'));
  kids.forEach(function (e) { e.style.left = e.style.top = e.style.right = e.style.display = ''; e.style.removeProperty('--l'); e.style.removeProperty('--k'); });
  if (!kids.length || !box.offsetWidth || window.innerWidth > 980) return;
  var h = $('#heroH'), st = $('#status'), hi = $('#seasonHi'); if (!h || !st || !h.offsetHeight) return;
  var W = box.offsetWidth, D = ambOff(box), k = parseFloat(getComputedStyle(box).getPropertyValue('--k')) || 1;
  var rect = function (el) { var o = ambOff(el); return { l: o.x - D.x, t: o.y - D.y, r: o.x - D.x + el.offsetWidth, b: o.y - D.y + el.offsetHeight }; };
  var H = rect(h), S = rect(st), G = hi && !hi.hidden && hi.offsetWidth ? rect(hi) : null, lines = [];
  var add = function (r) { var L = lines.filter(function (x) { return Math.abs(x.t - r.t) < (r.b - r.t) / 2; })[0]; if (L) { L.r = Math.max(L.r, r.r); L.t = Math.min(L.t, r.t); L.b = Math.max(L.b, r.b); } else lines.push({ t: r.t, b: r.b, r: r.r }); };
  var words = h.querySelectorAll('.w');
  if (words.length) {
    // Wortkästchen sind so hoch wie die Zeile; Ober- und Unterlängen der Schrift ragen darüber hinaus – einmal ausmessen
    var cs = getComputedStyle(h), pr = document.createElement('div'), lh = words[0].offsetHeight;
    pr.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap';
    ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing'].forEach(function (p) { pr.style[p] = cs[p]; });
    pr.innerHTML = '<span>Hg</span>'; box.appendChild(pr); var ov = Math.max(0, (pr.firstChild.getBoundingClientRect().height - lh) / 2); box.removeChild(pr);
    [].forEach.call(words, function (w) { var r = rect(w); add({ t: r.t - ov, b: r.b + ov, r: r.r }); });
  }
  else { var g = document.createRange(), B = box.getBoundingClientRect(); g.selectNodeContents(h); [].forEach.call(g.getClientRects(), function (c) { if (c.width > 1) add({ t: c.top - B.top, b: c.bottom - B.top, r: c.right - B.left }); }); }
  lines.sort(function (a, b) { return a.t - b.t; });
  var gap = 14, right = W - 10;
  var nat = function (svg) { var s = svg.style, w = parseFloat(s.getPropertyValue('--w')) || 40, ar = parseFloat(s.getPropertyValue('--ar')) || 1; return { w: w * k, h: w * ar * k }; };
  // Hauptzeichen: rechts neben einer oder zwei Zeilen der Überschrift, so groß wie der freie Platz erlaubt
  var m = box.querySelector('svg.m'), mz = null;
  if (m) {
    var n = nat(m);
    for (var i = 0; i < lines.length; i++) for (var j = i; j < Math.min(lines.length, i + 2); j++) {
      var x0 = Math.max.apply(null, lines.slice(i, j + 1).map(function (x) { return x.r; })) + gap, zw = right - x0, top = lines[i].t, bot = lines[j].b;
      // Nachbarzeilen, die bis in diese Spalte reichen, begrenzen die Höhe (Schwingen der Animation eingerechnet)
      if (i > 0 && lines[i - 1].r + gap > x0) top = Math.max(top, lines[i - 1].b);
      if (j < lines.length - 1 && lines[j + 1].r + gap > x0) bot = Math.min(bot, lines[j + 1].t);
      var f = Math.min(1, zw / n.w, (bot - top - 12) / n.h);
      if (!mz || f > mz.f) mz = { f: f, x: x0 + zw / 2, y: (top + bot) / 2 };
    }
  }
  // Bereich oberhalb der Überschrift, rechts neben Öffnungs-Chip und Gruß (dort hängt der Schmuck)
  var hs = [].slice.call(box.querySelectorAll('.hang')), aL = Math.max(S.r, G ? G.r : 0) + gap, aW = right - aL, aB = H.t - 6;
  if (m) {
    // passt das Hauptzeichen nicht neben die Überschrift, rechts oben in diesen Bereich setzen
    if (!mz || n.w * mz.f < 26) { var fa = Math.min(1, aW / n.w, (aB - 20) / n.h); if (n.w * fa >= 26) { mz = { f: fa, x: right - n.w * fa / 2, y: aB / 2 + 4 }; aW -= n.w * fa + 12; } }
    if (mz && n.w * mz.f >= 26) { m.style.setProperty('--k', k * mz.f); m.style.right = 'auto'; m.style.left = Math.round(mz.x - n.w * mz.f / 2) + 'px'; m.style.top = Math.round(mz.y - n.h * mz.f / 2) + 'px'; }
    else m.style.display = 'none';
  }
  var prio = hs.slice().sort(function (a, b) { return nat(b.querySelector('svg')).h - nat(a.querySelector('svg')).h; }), keep = [];
  prio.forEach(function (e) { var need = keep.concat([e]).reduce(function (s, x) { return s + nat(x.querySelector('svg')).w + 12; }, 0); if (need <= aW) keep.push(e); });
  var shown = hs.filter(function (e) { return keep.indexOf(e) >= 0; }), mag = [0.55, 1, 0.25];
  hs.forEach(function (e) { if (shown.indexOf(e) < 0) e.style.display = 'none'; });
  shown.forEach(function (e, i) {
    var n = nat(e.querySelector('svg')), f = Math.min(1, (aB - 10) / n.h);
    if (f < 0.6) { e.style.display = 'none'; return; }
    var maxL = aB - n.h * f - 2, L = Math.max(8, maxL * mag[(hs.indexOf(e)) % 3]);
    e.style.setProperty('--k', k * f); e.style.setProperty('--l', (L / (k * f)).toFixed(1) + 'px');
    e.style.left = Math.round(aL + aW * (i + 0.5) / shown.length) + 'px';
  });
  // kleine Sterne: auf schmalen Bildschirmen weglassen, die Teilchen im Hintergrund reichen dort
  [].forEach.call(box.querySelectorAll('svg.s1, svg.s2, svg.s3'), function (e) { e.style.display = 'none'; });
}
function ambText() {
  var hi = $('#seasonHi'), band = $('#seasonBand'), th = AMB.t, k = AMB.k, g = AMB_HI[k], bd = AMB_BAND[k] || AMB_BAND[th];
  if (hi) {
    if (g && th !== 'klassik') { hi.innerHTML = ambSym(AMB_SW[th][2]) + '<span>' + esc(g[LI].replace('{y}', AMB.y)) + '</span>'; hi.hidden = false; }
    else { hi.hidden = true; hi.innerHTML = ''; }
  }
  if (band) {
    if (bd && th !== 'klassik') {
      var btns = bd.b.map(function (x, i) {
        var cls = 'btn' + (i ? ' ghost' : '');
        if (/^g\d$/.test(x[0])) { var gr = GROUPS.filter(function (q) { return q.id === x[0]; })[0]; return '<a class="' + cls + '" href="#speisekarte" data-go="' + x[0] + '">' + esc(gr ? gr.n[LI] : t('cta.menu')) + '</a>'; }
        return '<a class="' + cls + '" href="' + x[0] + '">' + esc(I[x[1]] ? I[x[1]][LI] : x[1]) + '</a>';
      }).join('');
      band.innerHTML = '<div class="wrap" data-rv>' + ambSym(AMB_SW[th][2], 'sb-ic') + '<div><p class="eyebrow">' + esc(AMB_N[th][LI]) + '</p><h2>' + esc(bd.h[LI]) + '</h2><p>' + esc(bd.p[LI]) + '</p></div><div class="cta">' + btns + '</div></div>';
      band.hidden = false;
    } else { band.hidden = true; band.innerHTML = ''; }
  }
}
function ambPanel() {
  var box = $('#ambThemes'); if (!box) return;
  var list = ['auto'].concat(AMB_T);
  box.innerHTML = list.map(function (k) {
    var sw = AMB_SW[k], on = AMB.pref === k, sub = k === 'auto' ? '<small>' + esc(t('amb.now')) + ': ' + esc(AMB_N[AMB.pref === 'auto' ? AMB.t : (AMB.site !== 'auto' ? AMB.site : AMB.auto[0])][LI]) + '</small>' : '';
    return '<button type="button" class="amb-t" role="radio" aria-checked="' + on + '" data-amb-t="' + k + '"><span class="swt" style="--b:' + sw[0] + ';--a:' + sw[1] + '">' + ambSym(sw[2], sw[2].indexOf('i-') === 0 ? 'ic' : '') + '</span><span>' + esc(AMB_N[k][LI]) + sub + '</span></button>';
  }).join('');
  $('#ambModes').innerHTML = [['dark', 'i-moon'], ['light', 'i-sun'], ['system', 'i-device']].map(function (m) {
    return '<button type="button" class="amb-m" role="radio" aria-checked="' + (AMB.mode === m[0]) + '" data-amb-m="' + m[0] + '">' + ambSym(m[1], 'ic') + '<span>' + esc(t('mode.' + m[0])) + '</span></button>';
  }).join('');
  var mb = $('#ambMusic'); if (mb) mb.setAttribute('aria-checked', musPref() ? 'true' : 'false');
  $('#ambBtn').setAttribute('aria-label', t('amb')); $('#ambX').setAttribute('aria-label', t('close'));
}
function ambApply(animate) {
  ambResolve();
  var de = document.documentElement, md = AMB.mode === 'system' ? (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : AMB.mode;
  var changed = de.getAttribute('data-theme') !== AMB.t || de.getAttribute('data-mode') !== md;
  if (animate && changed && !reduce) { de.classList.add('amb-switch'); clearTimeout(ambApply.tm); ambApply.tm = setTimeout(function () { de.classList.remove('amb-switch'); }, 800); }
  de.setAttribute('data-theme', AMB.t); de.setAttribute('data-mode', md);
  var cs = getComputedStyle(de), mt = document.querySelector('meta[name="theme-color"]');
  if (mt) mt.setAttribute('content', (cs.getPropertyValue('--night') || '#0B0A26').trim());
  FX.kind = AMB_FX[AMB.t] || 'embers'; FX.light = md === 'light'; FX.rgb = (cs.getPropertyValue('--gold-rgb') || '219,189,130').trim();
  if (FX.reset && changed) FX.reset();
  ambDeco(); ambText(); ambPanel(); setupReveal();
}
function ambOpen(o) {
  var p = $('#amb'), b = $('#ambBtn'); if (!p) return;
  var hd = $('header.top'); if (o && hd) p.style.setProperty('--ambtop', Math.round(Math.max(8, hd.getBoundingClientRect().bottom + 10)) + 'px');
  AMB.open = o; p.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false');
  if (o) { ambPanel(); var f = p.querySelector('[aria-checked="true"]') || p.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
  else if (document.activeElement && p.contains(document.activeElement)) (b.offsetParent ? b : $('#burger')).focus();
}
function ambSiteDesign() {
  // Einstellung des Restaurants (Admin-App): gilt für alle, die selbst nichts gewählt haben
  if (!API || typeof apiCall !== 'function') return;
  apiCall('/config').then(function (r) {
    if (!r.ok || !r.j || !r.j.design) return;
    var d = AMB_T.indexOf(r.j.design) >= 0 ? r.j.design : 'auto';
    if (d !== AMB.site) { AMB.site = d; store('leonn-site-theme', d); if (AMB.pref === 'auto') ambApply(true); else ambPanel(); }
  }, function () {});
}

/* Leise Hintergrundmusik: startet bei der ersten Berührung der Seite (Browser erlauben Ton erst danach), immer abschaltbar. */
var MUS = { ctx: null, gain: null, src: null, buf: null, loading: false, on: false, started: false, failed: false, waits: [] }, MUS_VOL = 0.2;
function musPref() { var v = store('leonn-music'); if (v) return v === 'on'; return !(navigator.connection && navigator.connection.saveData); }
function musUi() {
  var b = $('#music'), pref = musPref(); if (!b) return;
  if (MUS.failed || !(window.AudioContext || window.webkitAudioContext)) { b.hidden = true; return; }
  b.hidden = false;
  b.setAttribute('aria-pressed', MUS.on ? 'true' : 'false');
  b.setAttribute('aria-label', t(MUS.on ? 'music.on' : 'music.off'));
  var mb = $('#ambMusic'); if (mb) mb.setAttribute('aria-checked', pref ? 'true' : 'false');
}
function musEnsure() {
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try {
    if (!MUS.ctx) { MUS.ctx = new AC(); MUS.gain = MUS.ctx.createGain(); MUS.gain.gain.value = 0; MUS.gain.connect(MUS.ctx.destination); }
    if (MUS.ctx.state !== 'running' && MUS.ctx.resume) MUS.ctx.resume();
  } catch (e) { return false; }
  return true;
}
function musLoad(cb) {
  if (MUS.buf) { cb(); return; }
  MUS.waits.push(cb); if (MUS.loading) return; MUS.loading = true;
  fetch('audio/leonn-ambiente.mp3').then(function (r) { if (!r.ok) throw new Error('audio'); return r.arrayBuffer(); }).then(function (ab) {
    return new Promise(function (res, rej) { MUS.ctx.decodeAudioData(ab, res, rej); });
  }).then(function (b) { MUS.buf = b; MUS.loading = false; var w = MUS.waits; MUS.waits = []; w.forEach(function (f) { f(); }); })
    .catch(function () { MUS.loading = false; MUS.failed = true; MUS.on = false; musUi(); });
}
function musPlay() {
  if (!musEnsure()) return;
  MUS.on = true; MUS.started = true; musUi();
  musLoad(function () {
    if (!MUS.on) return;
    if (!MUS.src) { MUS.src = MUS.ctx.createBufferSource(); MUS.src.buffer = MUS.buf; MUS.src.loop = true; MUS.src.connect(MUS.gain); MUS.src.start(0); }
    var g = MUS.gain.gain, now = MUS.ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(MUS_VOL, now + 3.5);
  });
}
function musStop() {
  MUS.on = false; musUi();
  if (!MUS.ctx || !MUS.gain) return;
  var g = MUS.gain.gain, now = MUS.ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 0.8);
  setTimeout(function () { if (!MUS.on && MUS.ctx && MUS.ctx.state === 'running' && MUS.ctx.suspend) MUS.ctx.suspend(); }, 900);
}
function musToggle() { if (MUS.on) { store('leonn-music', 'off'); musStop(); } else { store('leonn-music', 'on'); musPlay(); } }
function musSwitch() { if (musPref()) { store('leonn-music', 'off'); musStop(); } else { store('leonn-music', 'on'); musPlay(); } }
function musInit() {
  musUi();
  var first = function (e) {
    if (e.target && e.target.closest && e.target.closest('#music,#ambMusic')) return;
    off(); if (musPref() && !MUS.started) musPlay();
  };
  var evs = ['click', 'keydown', 'touchend'];
  function off() { evs.forEach(function (n) { document.removeEventListener(n, first, true); }); }
  evs.forEach(function (n) { document.addEventListener(n, first, true); });
  document.addEventListener('visibilitychange', function () {
    if (!MUS.ctx) return;
    if (document.hidden) { if (MUS.ctx.state === 'running') MUS.ctx.suspend(); }
    else if (MUS.on && MUS.ctx.resume) MUS.ctx.resume();
  });
}
function ambInit() {
  AMB.pref = store('leonn-theme') || 'auto'; AMB.site = store('leonn-site-theme') || 'auto'; AMB.mode = store('leonn-mode') || 'dark';
  if (AMB.pref !== 'auto' && AMB_T.indexOf(AMB.pref) < 0) AMB.pref = 'auto';
  if (['dark', 'light', 'system'].indexOf(AMB.mode) < 0) AMB.mode = 'dark';
  ambApply(false);
  if (window.ResizeObserver) { var ro = new ResizeObserver(ambLayoutSoon); ['#deco', '#status', '#seasonHi', '#heroH'].forEach(function (s) { var e = $(s); if (e) ro.observe(e); }); }
  else window.addEventListener('resize', ambLayoutSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ambLayoutSoon);
  $('#ambBtn').addEventListener('click', function (e) { e.stopPropagation(); ambOpen(!AMB.open); });
  var na = $('#navAmb'); if (na) na.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); navOpen(false); ambOpen(true); });
  $('#ambX').addEventListener('click', function () { ambOpen(false); });
  $('#amb').addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-amb-t]'))) { AMB.pref = el.getAttribute('data-amb-t'); store('leonn-theme', AMB.pref); ambApply(true); var f = $('[data-amb-t="' + AMB.pref + '"]'); if (f) f.focus(); }
    else if ((el = e.target.closest('[data-amb-m]'))) { AMB.mode = el.getAttribute('data-amb-m'); store('leonn-mode', AMB.mode); ambApply(true); var g = $('[data-amb-m="' + AMB.mode + '"]'); if (g) g.focus(); }
    else if (e.target.closest('#ambMusic')) musSwitch();
  });
  $('#amb').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { ambOpen(false); return; }
    var r = e.target.closest('[role="radio"]'); if (!r || ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
    var all = $$('[role="radio"]', r.parentNode), i = all.indexOf(r) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
    e.preventDefault(); all[(i + all.length) % all.length].click();
  });
  document.addEventListener('click', function (e) { if (AMB.open && !e.target.closest('#amb,#ambBtn')) ambOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && AMB.open) ambOpen(false); });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: light)'); var ch = function () { if (AMB.mode === 'system') ambApply(true); }; if (mq.addEventListener) mq.addEventListener('change', ch); else if (mq.addListener) mq.addListener(ch); }
  $('#music').addEventListener('click', musToggle);
  musInit();
  ambSiteDesign();
  // Tageswechsel (z. B. Silvester um Mitternacht): einmal pro Stunde neu bestimmen
  setInterval(function () { var o = AMB.t + AMB.k; ambResolve(); if (o !== AMB.t + AMB.k) ambApply(true); }, 3600000);
}

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
    jumpTo(y); $('#q').focus();
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
  initRes(); initGift(); initVideo(); ambInit();
  applyLang(); showGo(0, true); route();
  counters(); embers(); pointerFx(); showAuto();
  setInterval(setStatus, 60000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setHH(); onScroll(); });
}
init();
})();
