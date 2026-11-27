/* Günlük – Takvim ve iş günlüğü (xenosmart.de/mustafa)
   Alles läuft und liegt auf dem Handy. Die Schnittstelle aus config.js sichert die Einträge und schickt die Erinnerungen. */
(function () {
  'use strict';

  var API = String(window.GUNLUK_API || '').replace(/\/+$/, '');
  var LS_DOC = 'gunluk.doc.v1', LS_KEY = 'gunluk.key.v1', LS_UI = 'gunluk.ui.v1';
  var KINDS = ['d2', 'd1', 'day', 'h1'];
  var TYPES = ['termin', 'is', 'not'];
  var KEY_RE = /^[A-Za-z0-9_-]{40,64}$/;

  /* ------------------------------------------------------------ Texte */
  var L = {
    tr: {
      tabToday: 'Bugün', tabCal: 'Takvim', tabList: 'Kayıtlar', tabSet: 'Ayarlar', add: 'Yeni kayıt', hello: 'Hayırlı işler',
      months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
      wdLong: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
      wdShort: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], wdMin: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'],
      relToday: 'Bugün', relTomorrow: 'Yarın', relAfter: 'Öbür gün', relYesterday: 'Dün',
      relIn: function (n) { return n + ' gün sonra'; }, relAgo: function (n) { return n + ' gün önce'; },
      week: function (n) { return n + '. hafta'; },
      longDate: function (day, mon, wd) { return day + ' ' + mon + ', ' + wd; },
      emptyDay: 'Bu güne henüz bir şey yazılmadı.',
      type_termin: 'Termin', type_is: 'İş kaydı', type_not: 'Not', f_termin: 'Termin', f_is: 'İş', f_not: 'Not', addTermin: '+ Termin', addIs: '+ İş', addNot: '+ Not',
      hint_termin: 'Gideceğin yer, görüşme, teslim. Vakti gelmeden haber veririm.',
      hint_is: 'O gün hangi şantiyede kaç eleman çalıştı, ne yapıldı.',
      hint_not: 'Unutmak istemediğin her şey.',
      ahead: 'Önümüzdeki günler', aheadNone: 'Önümüzdeki iki haftada kayıtlı bir şey yok.',
      nWorkers: function (n) { return n + ' eleman'; },
      newEntry: 'Yeni kayıt', editEntry: 'Kaydı düzenle', cancel: 'Vazgeç', save: 'Kaydet', del: 'Kaydı sil', delAsk: 'Bu kayıt silinsin mi?', delYes: 'Evet, sil', delNo: 'Vazgeç',
      fWhat: 'Ne var?', phWhat: 'Keşif, müşteri görüşmesi, teslim', fWhere: 'Nerede?', phWhere: 'Adres, müşteri ya da şantiye',
      fDate: 'Tarih', fTime: 'Saat', noTime: 'Saati sil', fNote: 'Not', phNote: 'Eklemek istediğin bir şey varsa', optional: '(istersen)',
      fSite: 'Hangi şantiye?', phSite: 'Şantiye, müşteri ya da adres', fN: 'Kaç eleman çalıştı?', fWho: 'Kimler?', phWho: 'Ahmet, Mehmet',
      fWork: 'Ne yapıldı?', phWork: 'Fayans döşendi, boya bitti', less: 'Bir eksik', more1: 'Bir fazla',
      fNoteMain: 'Not', phNoteMain: 'Aklında kalsın diye yaz',
      fRem: 'Ne zaman haber vereyim?', rem_d2: '2 gün önce', rem_d1: '1 gün önce', rem_day: 'O sabah', rem_h1: '1 saat önce',
      remHintTime: '“1 saat önce” için saat gir.', remHintPush: 'Bildirimler şu an kapalı. Ayarlar’dan açarsan telefonuna haber gelir.',
      done: 'Tamamlandı',
      errTermin: 'Ne olduğunu ya da nerede olduğunu yaz.', errIs: 'Şantiyeyi ya da yapılan işi yaz.', errNot: 'Bir not yaz.', errDate: 'Tarihi seç.',
      saved: 'Kaydedildi', deleted: 'Kayıt silindi', undo: 'Geri al',
      summary: function (m) { return m + ' özeti'; }, sumTermin: 'termin', sumDays: 'iş günü', sumMan: 'yevmiye',
      siteLine: function (d, n) { return d + ' gün, ' + n + ' yevmiye'; }, addHere: 'Bu güne ekle', openLeaf: 'Yaprağı aç',
      phSearch: 'Ara: şantiye, kişi, not', fAll: 'Hepsi',
      listEmpty: 'Henüz kayıt yok. Alttaki kırmızı düğmeyle ilk kaydını yaz.', listNone: 'Aramana uyan kayıt yok.', more: 'Daha eski kayıtları göster', exportCsv: 'Excel için indir',
      sPush: 'Bildirimler', pushOnS: 'Açık', pushOffS: 'Kapalı',
      pushOnT: 'Terminlerinden 2 gün önce, 1 gün önce, o sabah ve 1 saat önce telefonuna haber veririm.',
      pushOffT: 'Açarsan terminlerinden önce telefonuna bildirim gelir, uygulama kapalıyken de.',
      pushInstallT: 'iPhone’da bildirim için Günlük’ü önce ana ekrana eklemen gerekiyor.',
      pushNoneT: 'Bu tarayıcı bildirim göndermeye izin vermiyor.',
      pushDeniedT: 'Bildirim izni kapalı. Telefonunda Ayarlar › Bildirimler › Günlük’ten izin ver.',
      pushNoApiT: 'Bildirim sunucusu henüz bağlı değil. Terminlerin burada, “Önümüzdeki günler”de görünür.',
      pushBtn: 'Bildirimleri aç', pushTest: 'Deneme bildirimi gönder', pushOffBtn: 'Bildirimleri kapat',
      pushOn: 'Bildirimler açıldı', pushDenied: 'Bildirim izni verilmedi', pushFail: 'Bildirimler açılamadı. İnternetini kontrol edip tekrar dene.',
      pushTestSent: 'Deneme bildirimi yolda, birkaç saniyede gelir.', pushTestFail: 'Deneme bildirimi gönderilemedi.', pushOffDone: 'Bildirimler kapatıldı',
      evening: 'Akşam 18:00’de bugünü yazmayı hatırlat',
      sInstall: 'Ana ekrana ekle', installT: 'Günlük ana ekrandan açılınca uygulama gibi çalışır.', installBtn: 'Nasıl eklenir?', installNow: 'Şimdi ekle',
      installDone: 'Günlük ana ekranda kurulu.', installAndroid: 'Tarayıcı menüsünden “Ana ekrana ekle” ya da “Uygulamayı yükle”yi seç.',
      sLang: 'Dil', sName: 'Adın', phName: 'Mustafa abi',
      sBackup: 'Yedek', backupT: 'Kayıtların bu telefonda durur ve internette yedeklenir.',
      backupLast: function (s) { return 'Son yedek: ' + s; }, backupNever: 'Henüz yedeklenmedi.',
      backupPending: function (n) { return n + ' kayıt yedeklenmeyi bekliyor.'; },
      backupOff: 'İnternet yok. Bağlanınca kendiliğinden yedeklenir.', backupNoApi: 'Kayıtların bu telefonda durur.',
      backupNow: 'Şimdi yedekle', backupOk: 'Yedeklendi', backupFail: 'Yedeklenemedi. İnternetini kontrol et.',
      sMove: 'Başka telefona taşı', moveT: 'Bu kodu yeni telefonda Günlük’e yapıştırırsan bütün kayıtların oraya gelir. Kodu kimseyle paylaşma.',
      moveShow: 'Kodumu göster', moveCopy: 'Kodu kopyala', copied: 'Kopyalandı', moveIn: 'Kod ile kayıtları getir', movePh: 'Kodu buraya yapıştır',
      moveGo: 'Kayıtları getir', moveBad: 'Bu kod geçerli değil.', moveDone: 'Kayıtlar getirildi', moveFail: 'Kayıtlar getirilemedi. İnternetini kontrol et.',
      wipe: 'Bütün kayıtları sil', wipeAsk: 'Bütün kayıtların bu telefondan ve yedekten silinsin mi? Geri alınamaz.', wipeYes: 'Evet, hepsini sil', wipeDone: 'Bütün kayıtlar silindi',
      about: 'Günlük, XenoSmart tarafından Mustafa abi için yapıldı.', offline: 'İnternet yok',
      gTitle: 'Günlük’ü ana ekrana ekle', gText: 'Ana ekrandan açınca uygulama gibi çalışır ve terminlerini sana bildirimle hatırlatır.',
      g1: 'Safari’de Paylaş düğmesine dokun', g1b: 'Görünmüyorsa önce ••• düğmesine dokun.', g2: '“Ana Ekrana Ekle”yi seç', g3: 'Ana ekrandaki Günlük simgesinden aç',
      gNote: 'Kayıtlarını ana ekrandaki Günlük’ten yaz. Burada, tarayıcıda yazdıkların oraya geçmez.',
      gNoSafari: 'Listede “Ana Ekrana Ekle” yoksa önce “Safari’de Aç”a dokun.', gSkip: 'Şimdilik burada bak', gClose: 'Tamam',
      cDate: 'Tarih', cTime: 'Saat', cType: 'Tür', cTitle: 'Konu / Şantiye', cPlace: 'Yer', cN: 'Eleman', cWho: 'Kimler', cWork: 'Yapılan iş', cNote: 'Not', cDone: 'Tamamlandı', yes: 'evet'
    },
    de: {
      tabToday: 'Heute', tabCal: 'Kalender', tabList: 'Einträge', tabSet: 'Mehr', add: 'Neuer Eintrag', hello: 'Frohes Schaffen',
      months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      wdLong: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
      wdShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], wdMin: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      relToday: 'Heute', relTomorrow: 'Morgen', relAfter: 'Übermorgen', relYesterday: 'Gestern',
      relIn: function (n) { return 'in ' + n + ' Tagen'; }, relAgo: function (n) { return 'vor ' + n + ' Tagen'; },
      week: function (n) { return 'KW ' + n; },
      longDate: function (day, mon, wd) { return wd + ', ' + day + '. ' + mon; },
      emptyDay: 'Für diesen Tag steht noch nichts drin.',
      type_termin: 'Termin', type_is: 'Arbeit', type_not: 'Notiz', f_termin: 'Termin', f_is: 'Arbeit', f_not: 'Notiz', addTermin: '+ Termin', addIs: '+ Arbeit', addNot: '+ Notiz',
      hint_termin: 'Wohin du musst, Besprechung, Abnahme. Ich erinnere dich rechtzeitig.',
      hint_is: 'Auf welcher Baustelle wie viele Leute gearbeitet haben und was gemacht wurde.',
      hint_not: 'Alles, was du nicht vergessen willst.',
      ahead: 'Die nächsten Tage', aheadNone: 'In den nächsten zwei Wochen ist nichts eingetragen.',
      nWorkers: function (n) { return n + ' Mann'; },
      newEntry: 'Neuer Eintrag', editEntry: 'Eintrag ändern', cancel: 'Abbrechen', save: 'Speichern', del: 'Eintrag löschen', delAsk: 'Diesen Eintrag löschen?', delYes: 'Ja, löschen', delNo: 'Abbrechen',
      fWhat: 'Was steht an?', phWhat: 'Besichtigung, Kundengespräch, Abnahme', fWhere: 'Wo?', phWhere: 'Adresse, Kunde oder Baustelle',
      fDate: 'Datum', fTime: 'Uhrzeit', noTime: 'Uhrzeit löschen', fNote: 'Notiz', phNote: 'Falls du etwas dazuschreiben willst', optional: '(wenn du willst)',
      fSite: 'Welche Baustelle?', phSite: 'Baustelle, Kunde oder Adresse', fN: 'Wie viele Leute haben gearbeitet?', fWho: 'Wer?', phWho: 'Ahmet, Mehmet',
      fWork: 'Was wurde gemacht?', phWork: 'Fliesen gelegt, Anstrich fertig', less: 'Einer weniger', more1: 'Einer mehr',
      fNoteMain: 'Notiz', phNoteMain: 'Damit du es nicht vergisst',
      fRem: 'Wann soll ich dich erinnern?', rem_d2: '2 Tage vorher', rem_d1: '1 Tag vorher', rem_day: 'Am Morgen', rem_h1: '1 Stunde vorher',
      remHintTime: 'Für „1 Stunde vorher“ eine Uhrzeit eintragen.', remHintPush: 'Mitteilungen sind gerade aus. Schalte sie unter „Mehr“ ein, dann meldet sich dein Handy.',
      done: 'Erledigt',
      errTermin: 'Schreib, was ansteht oder wo.', errIs: 'Schreib die Baustelle oder was gemacht wurde.', errNot: 'Schreib eine Notiz.', errDate: 'Wähle das Datum.',
      saved: 'Gespeichert', deleted: 'Eintrag gelöscht', undo: 'Rückgängig',
      summary: function (m) { return 'Übersicht ' + m; }, sumTermin: 'Termine', sumDays: 'Arbeitstage', sumMan: 'Manntage',
      siteLine: function (d, n) { return d + (d === 1 ? ' Tag, ' : ' Tage, ') + n + (n === 1 ? ' Manntag' : ' Manntage'); }, addHere: 'An diesem Tag eintragen', openLeaf: 'Blatt öffnen',
      phSearch: 'Suchen: Baustelle, Person, Notiz', fAll: 'Alle',
      listEmpty: 'Noch keine Einträge. Mit dem roten Knopf unten legst du den ersten an.', listNone: 'Kein Eintrag passt zu deiner Suche.', more: 'Ältere Einträge zeigen', exportCsv: 'Für Excel herunterladen',
      sPush: 'Mitteilungen', pushOnS: 'Ein', pushOffS: 'Aus',
      pushOnT: 'Ich erinnere dich 2 Tage vorher, 1 Tag vorher, am Morgen und 1 Stunde vor deinen Terminen.',
      pushOffT: 'Wenn du sie einschaltest, meldet sich dein Handy vor deinen Terminen, auch wenn die App zu ist.',
      pushInstallT: 'Auf dem iPhone musst du Günlük dafür zuerst zum Home-Bildschirm hinzufügen.',
      pushNoneT: 'Dieser Browser erlaubt keine Mitteilungen.',
      pushDeniedT: 'Mitteilungen sind gesperrt. Erlaube sie auf dem Handy unter Einstellungen › Mitteilungen › Günlük.',
      pushNoApiT: 'Der Mitteilungs-Dienst ist noch nicht verbunden. Deine Termine siehst du hier unter „Die nächsten Tage“.',
      pushBtn: 'Mitteilungen einschalten', pushTest: 'Probe-Mitteilung senden', pushOffBtn: 'Mitteilungen ausschalten',
      pushOn: 'Mitteilungen sind eingeschaltet', pushDenied: 'Mitteilungen wurden nicht erlaubt', pushFail: 'Einschalten hat nicht geklappt. Prüfe dein Internet und versuch es noch einmal.',
      pushTestSent: 'Probe-Mitteilung ist unterwegs und kommt in ein paar Sekunden.', pushTestFail: 'Probe-Mitteilung konnte nicht gesendet werden.', pushOffDone: 'Mitteilungen sind ausgeschaltet',
      evening: 'Abends um 18:00 Uhr an den Eintrag für heute erinnern',
      sInstall: 'Zum Home-Bildschirm', installT: 'Vom Home-Bildschirm aus läuft Günlük wie eine App.', installBtn: 'So geht es', installNow: 'Jetzt hinzufügen',
      installDone: 'Günlük ist auf dem Home-Bildschirm installiert.', installAndroid: 'Wähle im Browser-Menü „Zum Startbildschirm hinzufügen“ oder „App installieren“.',
      sLang: 'Sprache', sName: 'Dein Name', phName: 'Mustafa',
      sBackup: 'Sicherung', backupT: 'Deine Einträge liegen auf diesem Handy und werden im Internet gesichert.',
      backupLast: function (s) { return 'Zuletzt gesichert: ' + s; }, backupNever: 'Noch nicht gesichert.',
      backupPending: function (n) { return n + (n === 1 ? ' Eintrag wartet' : ' Einträge warten') + ' auf die Sicherung.'; },
      backupOff: 'Kein Internet. Sobald du wieder verbunden bist, wird von selbst gesichert.', backupNoApi: 'Deine Einträge liegen auf diesem Handy.',
      backupNow: 'Jetzt sichern', backupOk: 'Gesichert', backupFail: 'Sicherung hat nicht geklappt. Prüfe dein Internet.',
      sMove: 'Auf ein anderes Handy umziehen', moveT: 'Wenn du diesen Code auf dem neuen Handy in Günlük einfügst, kommen alle Einträge dorthin. Gib den Code niemandem.',
      moveShow: 'Meinen Code zeigen', moveCopy: 'Code kopieren', copied: 'Kopiert', moveIn: 'Einträge mit Code holen', movePh: 'Code hier einfügen',
      moveGo: 'Einträge holen', moveBad: 'Dieser Code ist nicht gültig.', moveDone: 'Einträge wurden geholt', moveFail: 'Einträge konnten nicht geholt werden. Prüfe dein Internet.',
      wipe: 'Alle Einträge löschen', wipeAsk: 'Alle Einträge auf diesem Handy und in der Sicherung löschen? Das lässt sich nicht rückgängig machen.', wipeYes: 'Ja, alles löschen', wipeDone: 'Alle Einträge wurden gelöscht',
      about: 'Günlük, von XenoSmart für Mustafa abi gemacht.', offline: 'Kein Internet',
      gTitle: 'Günlük zum Home-Bildschirm hinzufügen', gText: 'Vom Home-Bildschirm aus läuft es wie eine App und erinnert dich mit Mitteilungen an deine Termine.',
      g1: 'Tippe in Safari auf Teilen', g1b: 'Siehst du es nicht, tippe zuerst auf •••.', g2: 'Wähle „Zum Home-Bildschirm“', g3: 'Öffne Günlük über das Symbol auf dem Home-Bildschirm',
      gNote: 'Trag deine Einträge dort ein. Was du hier im Browser schreibst, kommt dort nicht an.',
      gNoSafari: 'Fehlt „Zum Home-Bildschirm“ in der Liste, tippe zuerst auf „In Safari öffnen“.', gSkip: 'Erst einmal hier ansehen', gClose: 'Fertig',
      cDate: 'Datum', cTime: 'Uhrzeit', cType: 'Art', cTitle: 'Thema / Baustelle', cPlace: 'Ort', cN: 'Leute', cWho: 'Wer', cWork: 'Gemachte Arbeit', cNote: 'Notiz', cDone: 'Erledigt', yes: 'ja'
    }
  };
  function t(k) {
    var d = L[DOC.meta.lang] || L.tr, s = d[k];
    if (s == null) s = L.tr[k];
    if (typeof s === 'function') return s.apply(null, Array.prototype.slice.call(arguments, 1));
    return s == null ? k : s;
  }

  /* ------------------------------------------------------------ Symbole */
  function svg(d, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>'; }
  var I = {
    today: svg('<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3v3.5M15.5 3v3.5"/><path d="M10.6 13.6 12.2 12.4V17"/>'),
    cal: svg('<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3v3.5M15.5 3v3.5M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/>'),
    list: svg('<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', ' stroke-width="2.4"'),
    minus: svg('<path d="M5 12h14"/>', ' stroke-width="2.4"'),
    bell: svg('<path d="M6.5 16.5v-5.2a5.5 5.5 0 0 1 11 0v5.2l1.5 1.8H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
    bellOff: svg('<path d="M17.5 13.5v-2.2a5.5 5.5 0 0 0-8.7-4.5M6.6 10.2c-.1.4-.1.7-.1 1.1v5.2L5 18.3h11.5"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0M4 4l16 16"/>'),
    left: svg('<path d="m14.5 6-6 6 6 6"/>'), right: svg('<path d="m9.5 6 6 6-6 6"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', ' stroke-width="2.6"'),
    trash: svg('<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7M10.2 11v5M13.8 11v5"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: svg('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>'),
    share: svg('<path d="M12 15V3.5M8 7l4-4 4 4"/><path d="M8.5 10.5H6.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/>'),
    addbox: svg('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>'),
    down: svg('<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14"/>')
  };

  /* ------------------------------------------------------------ Hilfen */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function pd(s) { var a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 12); }
  function today() { return ymd(new Date()); }
  function addDays(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function diffDays(a, b) { return Math.round((pd(a) - pd(b)) / 864e5); }
  function dow(s) { return (pd(s).getDay() + 6) % 7; }                 // 0 = Montag
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(pd(s)) === s; }
  function isTime(s) { return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }
  function isoWeek(s) {
    var d = pd(s), u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = u.getUTCDay() || 7;
    u.setUTCDate(u.getUTCDate() + 4 - n);
    return Math.ceil(((u - Date.UTC(u.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  function b64u(buf) { var s = '', b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function rndKey() { var a = new Uint8Array(32); crypto.getRandomValues(a); return b64u(a); }
  function uid() { var a = new Uint8Array(6); crypto.getRandomValues(a); return Date.now().toString(36) + b64u(a).replace(/[^A-Za-z0-9]/g, 'x'); }
  function firstLine(s) { s = String(s || '').trim(); var i = s.indexOf('\n'); return i < 0 ? s : s.slice(0, i) + ' …'; }
  function low(s) { return String(s || '').toLocaleLowerCase('tr'); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* ------------------------------------------------------------ Daten */
  function loadDoc() {
    var d = null; try { d = JSON.parse(lsGet(LS_DOC) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    d.items = d.items && typeof d.items === 'object' ? d.items : {};
    d.dirty = d.dirty && typeof d.dirty === 'object' ? d.dirty : {};
    d.since = Number(d.since) || 0;
    var m = d.meta && typeof d.meta === 'object' ? d.meta : {};
    d.meta = { lang: m.lang === 'de' ? 'de' : 'tr', name: typeof m.name === 'string' ? m.name : 'Mustafa abi', evening: m.evening ? 1 : 0, eveningAt: '18:00', mu: Number(m.mu) || 0 };
    d.metaDirty = !!d.metaDirty; d.lastSync = Number(d.lastSync) || 0;
    return d;
  }
  function loadKey() { var k = lsGet(LS_KEY) || ''; if (!KEY_RE.test(k)) { k = rndKey(); lsSet(LS_KEY, k); } return k; }
  var DOC = loadDoc(), KEY = loadKey(), IDX = null;
  var UI = (function () { try { return JSON.parse(lsGet(LS_UI) || '{}') || {}; } catch (e) { return {}; } })();
  function saveDoc() { IDX = null; lsSet(LS_DOC, JSON.stringify(DOC)); }
  function saveUI() { lsSet(LS_UI, JSON.stringify(UI)); }

  var TORD = { termin: 0, is: 1, not: 2 };
  function cmp(a, b) {
    var ah = a.h || '', bh = b.h || '';
    if (!!ah !== !!bh) return ah ? -1 : 1;
    if (ah !== bh) return ah < bh ? -1 : 1;
    if (a.t !== b.t) return TORD[a.t] - TORD[b.t];
    return (a.c || 0) - (b.c || 0);
  }
  function idx() {
    if (IDX) return IDX;
    var by = {}, id, it;
    for (id in DOC.items) { it = DOC.items[id]; if (!it || it.x || !it.d) continue; (by[it.d] = by[it.d] || []).push(it); }
    for (var d in by) by[d].sort(cmp);
    return (IDX = by);
  }
  function setMeta(o) { for (var k in o) DOC.meta[k] = o[k]; DOC.meta.mu = Date.now(); DOC.metaDirty = true; saveDoc(); syncSoon(); }

  /* ------------------------------------------------------------ Zustand */
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function standalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = { tab: 'today', today: today(), day: today(), month: today().slice(0, 7), calDay: today(), filter: 'all', q: '', limit: 120, sheet: null, sheetErr: '', ask: '', push: API ? 'off' : 'noapi', syncing: false, again: false, syncErr: false, showKey: false, moveErr: '', anim: '', swiped: 0, stale: false, deferred: null };

  function rel(d) {
    var n = diffDays(d, today());
    if (n === 0) return t('relToday'); if (n === 1) return t('relTomorrow'); if (n === 2) return t('relAfter'); if (n === -1) return t('relYesterday');
    return n > 0 ? t('relIn', n) : t('relAgo', -n);
  }
  function longDate(d) { var dt = pd(d); return t('longDate', dt.getDate(), t('months')[dt.getMonth()], t('wdLong')[dow(d)]); }
  function clock(ms) { var d = new Date(ms); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '. ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  /* ------------------------------------------------------------ Zeilen */
  function rowParts(it) {
    var main = '', sub = [], tm = it.h ? '<b class="tm">' + it.h + '</b>' : '';
    if (it.t === 'termin') {
      main = tm + esc(it.title || it.place || t('type_termin'));
      if (it.title && it.place) sub.push(esc(it.place));
      if (it.note) sub.push(esc(firstLine(it.note)));
    } else if (it.t === 'is') {
      main = tm + esc(it.site || t('type_is'));
      if (it.n) sub.push(t('nWorkers', it.n));
      if (it.who) sub.push(esc(it.who));
      if (it.work) sub.push(esc(firstLine(it.work)));
    } else {
      var txt = String(it.note || '').trim(), i = txt.indexOf('\n');
      main = esc(i < 0 ? txt : txt.slice(0, i));
      if (i >= 0) sub.push(esc(firstLine(txt.slice(i + 1))));
    }
    return { main: main, sub: sub.join(', ') };
  }
  function rowHTML(it) {
    var p = rowParts(it);
    return '<li><button class="row' + (it.done ? ' is-done' : '') + '" data-a="edit" data-id="' + it.id + '"><i class="mk ' + it.t + (it.done ? ' done' : '') + '"></i><span class="row-t"><span class="row-main">' + p.main + '</span>' + (p.sub ? '<span class="row-sub">' + p.sub + '</span>' : '') + '</span></button></li>';
  }

  /* ------------------------------------------------------------ Ansicht: Bugün (das Kalenderblatt) */
  function viewToday() {
    var d = S.day, dt = pd(d), items = idx()[d] || [], isToday = d === today(), sun = dt.getDay() === 0;
    var prev = addDays(d, -1), next = addDays(d, 1);
    var h = '<header class="top"><p class="hello">' + esc(t('hello')) + (DOC.meta.name ? ', <b>' + esc(DOC.meta.name) + '</b>' : '') + '</p><div class="top-btns">'
      + (navigator.onLine === false ? '<span class="status-chip">' + esc(t('offline')) + '</span>' : '')
      + (S.push === 'noapi' ? '' : '<button class="icon-btn" data-a="bell" aria-label="' + esc(t('sPush') + ': ' + t(S.push === 'on' ? 'pushOnS' : 'pushOffS')) + '">' + (S.push === 'on' ? I.bell : I.bellOff + '<span class="dot"></span>') + '</button>')
      + '</div></header>';
    h += '<section class="pad"><div class="pad-top"></div><div class="leaf-stack"><article class="leaf' + (sun ? ' sun' : '') + (S.anim ? ' ' + S.anim : '') + '" id="leaf" data-swipe="day">'
      + '<div class="leaf-head">' + esc(t('months')[dt.getMonth()]) + ' ' + dt.getFullYear() + '</div><div class="leaf-perf"></div>'
      + '<h1 class="vh">' + esc(longDate(d)) + '</h1>'
      + '<div class="leaf-num" aria-hidden="true">' + dt.getDate() + '</div><div class="leaf-wd" aria-hidden="true">' + esc(t('wdLong')[dow(d)]) + '</div>'
      + '<div class="leaf-meta"><span>' + esc(t('week', isoWeek(d))) + '</span><span class="leaf-rel' + (isToday ? ' is-today' : '') + '">' + esc(rel(d)) + '</span></div>'
      + (items.length ? '<ul class="leaf-lines">' + items.map(rowHTML).join('') + '</ul>' : '<p class="leaf-empty">' + esc(t('emptyDay')) + '</p>')
      + '<div class="leaf-add">' + TYPES.map(function (k) { return '<button data-a="new" data-t="' + k + '"><i class="mk ' + k + '" style="margin:0"></i>' + esc(t('add' + k.charAt(0).toUpperCase() + k.slice(1))) + '</button>'; }).join('') + '</div>'
      + '</article></div>';
    h += '<nav class="pad-nav"><button data-a="day" data-n="-1">' + I.left + esc(t('wdShort')[dow(prev)] + ' ' + pd(prev).getDate()) + '</button>'
      + (isToday ? '<span></span>' : '<button class="to-today" data-a="day0">' + esc(t('relToday')) + '</button>')
      + '<button data-a="day" data-n="1">' + esc(t('wdShort')[dow(next)] + ' ' + pd(next).getDate()) + I.right + '</button></nav></section>';
    return h + aheadHTML();
  }
  function aheadHTML() {
    var t0 = today(), by = idx(), rows = '';
    for (var i = 1; i <= 14; i++) {
      var d = addDays(t0, i), list = by[d];
      if (!list) continue;
      var dt = pd(d);
      rows += '<li class="ahead-day"><button class="ahead-date' + (dt.getDay() === 0 ? ' sun' : '') + '" data-a="goDay" data-d="' + d + '" aria-label="' + esc(longDate(d)) + '"><b>' + dt.getDate() + '</b><span' + (i <= 2 ? ' class="rel"' : '') + '>' + esc(i <= 2 ? rel(d) : t('wdShort')[dow(d)]) + '</span></button><ul class="ahead-items">' + list.map(rowHTML).join('') + '</ul></li>';
    }
    return '<section class="on-wall"><h2 class="sec">' + esc(t('ahead')) + '</h2>' + (rows ? '<ol>' + rows + '</ol>' : '<p class="muted">' + esc(t('aheadNone')) + '</p>') + '</section>';
  }

  /* ------------------------------------------------------------ Ansicht: Takvim (Monat) */
  function viewCal() {
    var first = S.month + '-01', fd = pd(first), lead = (fd.getDay() + 6) % 7, dim = new Date(fd.getFullYear(), fd.getMonth() + 1, 0).getDate();
    var weeks = Math.ceil((lead + dim) / 7), start = addDays(first, -lead), t0 = today(), by = idx(), cells = '';
    for (var i = 0; i < weeks * 7; i++) {
      var d = addDays(start, i), dt = pd(d), list = by[d] || [], out = d.slice(0, 7) !== S.month, m = '';
      var nT = 0, hasI = false, hasN = false;
      for (var j = 0; j < list.length; j++) { if (list[j].t === 'termin') nT++; else if (list[j].t === 'is') hasI = true; else hasN = true; }
      if (nT) m += '<i></i>';
      if (nT > 1 && !(hasI && hasN)) m += '<i></i>';
      if (hasI) m += '<i class="is"></i>';
      if (hasN) m += '<i class="not"></i>';
      cells += '<button class="cell' + (out ? ' out' : '') + (dt.getDay() === 0 ? ' sun' : '') + (d === t0 ? ' today' : '') + (d === S.calDay ? ' sel' : '') + '" data-a="pick" data-d="' + d + '" aria-label="' + esc(longDate(d)) + (list.length ? ' (' + list.length + ')' : '') + '"' + (d === S.calDay ? ' aria-pressed="true"' : '') + '><span class="n">' + dt.getDate() + '</span><span class="mks">' + m + '</span></button>';
    }
    var h = '<header class="month-head"><button class="icon-btn" data-a="mon" data-n="-1" aria-label="' + esc(t('months')[(fd.getMonth() + 11) % 12]) + '">' + I.left + '</button><h1>' + esc(t('months')[fd.getMonth()]) + ' ' + fd.getFullYear() + '</h1><button class="icon-btn" data-a="mon" data-n="1" aria-label="' + esc(t('months')[(fd.getMonth() + 1) % 12]) + '">' + I.right + '</button></header>';
    h += '<section class="month-sheet" data-swipe="month"><div class="dow">' + t('wdMin').map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div><div class="grid">' + cells + '</div></section>';
    var sel = S.calDay, sl = by[sel] || [];
    h += '<section class="on-wall-day"><div class="day-head"><h2>' + esc(longDate(sel)) + '</h2><span>' + esc(rel(sel)) + '</span></div>'
      + (sl.length ? '<ul class="on-wall">' + sl.map(rowHTML).join('') + '</ul>' : '<p class="muted" style="padding:10px 0 2px">' + esc(t('emptyDay')) + '</p>')
      + '<button class="wall-btn solid" data-a="new" data-d="' + sel + '">' + I.plus + esc(t('addHere')) + '</button></section>';
    return h + sumHTML(S.month);
  }
  function sumHTML(month) {
    var by = idx(), nT = 0, days = {}, man = 0, sites = {}, d, i, it;
    for (d in by) {
      if (d.slice(0, 7) !== month) continue;
      for (i = 0; i < by[d].length; i++) {
        it = by[d][i];
        if (it.t === 'termin') nT++;
        else if (it.t === 'is') {
          days[d] = 1; man += it.n || 0;
          var k = low(it.site || '').trim() || '–';
          if (!sites[k]) sites[k] = { name: it.site || '–', days: {}, man: 0 };
          sites[k].days[d] = 1; sites[k].man += it.n || 0;
        }
      }
    }
    var nD = Object.keys(days).length;
    if (!nT && !nD) return '';
    var list = Object.keys(sites).map(function (k) { return sites[k]; }).sort(function (a, b) { return b.man - a.man || Object.keys(b.days).length - Object.keys(a.days).length; });
    var h = '<section><h2 class="sec">' + esc(t('summary', t('months')[pd(month + '-01').getMonth()])) + '</h2><div class="sum"><div><b>' + nT + '</b><span>' + esc(t('sumTermin')) + '</span></div><div><b>' + nD + '</b><span>' + esc(t('sumDays')) + '</span></div><div><b>' + man + '</b><span>' + esc(t('sumMan')) + '</span></div></div>';
    if (list.length) h += '<ul class="sites">' + list.map(function (s) { return '<li><span>' + esc(s.name) + '</span><span>' + esc(t('siteLine', Object.keys(s.days).length, s.man)) + '</span></li>'; }).join('') + '</ul>';
    return h + '</section>';
  }

  /* ------------------------------------------------------------ Ansicht: Kayıtlar (alle Einträge) */
  function viewList() {
    return '<h1 class="title">' + esc(t('tabList')) + '</h1><div class="search">' + I.search + '<input id="q" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(t('phSearch')) + '" aria-label="' + esc(t('phSearch')) + '" value="' + esc(S.q) + '"></div>'
      + '<div class="chips">' + ['all'].concat(TYPES).map(function (k) { return '<button class="chip" data-a="filter" data-k="' + k + '" aria-pressed="' + (S.filter === k) + '">' + (k === 'all' ? '' : '<i class="mk ' + k + '"></i>') + esc(k === 'all' ? t('fAll') : t('f_' + k)) + '</button>'; }).join('') + '</div>'
      + '<div id="recs">' + recsHTML() + '</div>';
  }
  function allItems() { var a = [], id, it; for (id in DOC.items) { it = DOC.items[id]; if (it && !it.x && it.d) a.push(it); } return a; }
  function recsHTML() {
    var all = allItems(), q = low(S.q).trim(), words = q ? q.split(/\s+/) : [];
    var list = all.filter(function (it) {
      if (S.filter !== 'all' && it.t !== S.filter) return false;
      if (!words.length) return true;
      var hay = low([it.title, it.place, it.site, it.who, it.work, it.note, it.d.slice(8) + '.' + it.d.slice(5, 7) + '.' + it.d.slice(0, 4)].join(' '));
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.d !== b.d ? (a.d < b.d ? 1 : -1) : cmp(a, b); });
    if (!all.length) return '<p class="muted" style="margin-top:22px">' + esc(t('listEmpty')) + '</p>';
    if (!list.length) return '<p class="muted" style="margin-top:22px">' + esc(t('listNone')) + '</p>';
    var h = '', mon = '', n = Math.min(list.length, S.limit);
    for (var i = 0; i < n; i++) {
      var it = list[i], m = it.d.slice(0, 7), dt = pd(it.d), p = rowParts(it);
      if (m !== mon) { h += (mon ? '</ul>' : '') + '<h2 class="month-label">' + esc(t('months')[dt.getMonth()]) + ' ' + dt.getFullYear() + '</h2><ul class="on-wall rec">'; mon = m; }
      h += '<li><button class="row' + (it.done ? ' is-done' : '') + '" data-a="edit" data-id="' + it.id + '"><span class="rec-date"><b>' + dt.getDate() + '</b><span>' + esc(t('wdShort')[dow(it.d)]) + '</span></span><i class="mk ' + it.t + (it.done ? ' done' : '') + '"></i><span class="row-t"><span class="row-main">' + p.main + '</span>' + (p.sub ? '<span class="row-sub">' + p.sub + '</span>' : '') + '</span></button></li>';
    }
    h += '</ul>';
    if (list.length > n) h += '<button class="wall-btn" data-a="more">' + esc(t('more')) + '</button>';
    return h + '<button class="wall-btn" data-a="csv">' + I.down + esc(t('exportCsv')) + '</button>';
  }

  /* ------------------------------------------------------------ Ansicht: Ayarlar */
  function viewSet() {
    var h = '<h1 class="title" style="margin-bottom:16px">' + esc(t('tabSet')) + '</h1>';
    // Mitteilungen
    var p = S.push, on = p === 'on';
    h += '<section class="set" id="set-push"><h2>' + esc(t('sPush')) + '</h2><p class="state ' + (on ? 'on' : (p === 'denied' || p === 'install' ? 'warn' : '')) + '"><i></i>' + esc(t(on ? 'pushOnS' : 'pushOffS')) + '</p><p>'
      + esc(t(on ? 'pushOnT' : p === 'install' ? 'pushInstallT' : p === 'none' ? 'pushNoneT' : p === 'denied' ? 'pushDeniedT' : p === 'noapi' ? 'pushNoApiT' : 'pushOffT')) + '</p>';
    if (p === 'off') h += '<button class="wall-btn solid" data-a="pushOn">' + I.bell + esc(t('pushBtn')) + '</button>';
    if (p === 'install') h += '<button class="wall-btn solid" data-a="guide">' + esc(t('installBtn')) + '</button>';
    if (on) h += '<button class="wall-btn" data-a="pushTest">' + esc(t('pushTest')) + '</button>'
      + '<button class="switch" role="switch" data-a="evening" aria-checked="' + (DOC.meta.evening ? 'true' : 'false') + '"><span>' + esc(t('evening')) + '</span><i></i></button>'
      + '<button class="wall-btn" data-a="pushOff">' + esc(t('pushOffBtn')) + '</button>';
    h += '</section>';
    // Home-Bildschirm
    h += '<section class="set"><h2>' + esc(t('sInstall')) + '</h2>';
    if (standalone()) h += '<p>' + esc(t('installDone')) + '</p>';
    else h += '<p>' + esc(t('installT')) + '</p>' + (S.deferred ? '<button class="wall-btn solid" data-a="install">' + esc(t('installNow')) + '</button>' : isIOS ? '<button class="wall-btn" data-a="guide">' + esc(t('installBtn')) + '</button>' : '<p>' + esc(t('installAndroid')) + '</p>');
    h += '</section>';
    // Sprache und Name
    h += '<section class="set"><h2>' + esc(t('sLang')) + '</h2><div class="seg"><button data-a="lang" data-k="tr" aria-pressed="' + (DOC.meta.lang === 'tr') + '">Türkçe</button><button data-a="lang" data-k="de" aria-pressed="' + (DOC.meta.lang === 'de') + '">Deutsch</button></div>'
      + '<label class="field-wall"><span>' + esc(t('sName')) + '</span><input id="name" type="text" maxlength="40" autocomplete="off" placeholder="' + esc(t('phName')) + '" value="' + esc(DOC.meta.name) + '"></label></section>';
    // Sicherung
    var nDirty = Object.keys(DOC.dirty).length;
    h += '<section class="set"><h2>' + esc(t('sBackup')) + '</h2>';
    if (!API) h += '<p>' + esc(t('backupNoApi')) + '</p>';
    else {
      h += '<p>' + esc(t('backupT')) + '</p><p><b>' + esc(navigator.onLine === false ? t('backupOff') : nDirty ? t('backupPending', nDirty) : DOC.lastSync ? t('backupLast', clock(DOC.lastSync)) : t('backupNever')) + '</b></p>'
        + '<button class="wall-btn" data-a="syncNow">' + esc(t('backupNow')) + '</button>';
    }
    h += '</section>';
    if (API) {
      h += '<section class="set"><h2>' + esc(t('sMove')) + '</h2><p>' + esc(t('moveT')) + '</p>';
      if (S.showKey) h += '<label class="field-wall"><span class="vh">Code</span><textarea id="mykey" readonly rows="2">' + esc(KEY) + '</textarea></label><button class="wall-btn" data-a="copyKey">' + esc(t('moveCopy')) + '</button>';
      else h += '<button class="wall-btn" data-a="showKey">' + esc(t('moveShow')) + '</button>';
      h += '<label class="field-wall"><span>' + esc(t('moveIn')) + '</span><input id="inkey" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + esc(t('movePh')) + '"></label>'
        + (S.moveErr ? '<p style="color:var(--red-on-wall);font-weight:600;margin-top:8px" role="alert">' + esc(S.moveErr) + '</p>' : '')
        + '<button class="wall-btn" data-a="moveGo">' + esc(t('moveGo')) + '</button></section>';
    }
    h += '<section class="set">';
    if (S.ask === 'wipe') h += '<div class="ask on-wall-ask" style="margin-top:0"><p>' + esc(t('wipeAsk')) + '</p><div><button data-a="askNo">' + esc(t('delNo')) + '</button><button class="yes" data-a="wipeYes">' + esc(t('wipeYes')) + '</button></div></div>';
    else h += '<button class="wall-btn danger" style="margin-top:0" data-a="wipe">' + I.trash + esc(t('wipe')) + '</button>';
    h += '</section><p class="about">' + esc(t('about')) + '</p>';
    return h;
  }

  /* ------------------------------------------------------------ Eingabe-Blatt */
  function defRem(f) {
    if (f.d < today()) return {};
    if (f.t === 'termin') return { d2: 1, d1: 1, day: 1, h1: 1 };
    if (f.t === 'is') return f.d > today() ? { d1: 1, day: 1 } : {};
    return {};
  }
  function openNew(tp, d) {
    d = isDate(d) ? d : (S.tab === 'today' ? S.day : S.tab === 'cal' ? S.calDay : today());
    var f = { isNew: true, t: TYPES.indexOf(tp) >= 0 ? tp : (d < today() ? 'is' : 'termin'), d: d, h: '', title: '', place: '', note: '', site: '', n: 0, who: '', work: '', done: 0, rTouched: false };
    f.r = defRem(f); S.sheet = f; S.sheetErr = ''; S.ask = ''; renderSheet(true);
  }
  function openEdit(id) {
    var it = DOC.items[id]; if (!it || it.x) return;
    var f = { isNew: false, id: id, t: it.t, d: it.d, h: it.h || '', title: it.title || '', place: it.place || '', note: it.note || '', site: it.site || '', n: it.n || 0, who: it.who || '', work: it.work || '', done: it.done ? 1 : 0, rTouched: true, r: {} };
    for (var i = 0; i < KINDS.length; i++) if (it.r && it.r[KINDS[i]]) f.r[KINDS[i]] = 1;
    S.sheet = f; S.sheetErr = ''; S.ask = ''; renderSheet(true);
  }
  function closeSheet() { S.sheet = null; S.sheetErr = ''; S.ask = ''; $('#sheet').innerHTML = ''; document.body.classList.remove('lock'); if (S.stale) render(); }
  function fText(k, label, ph, extra) { return '<label class="f"><span>' + label + '</span><input type="text" data-f="' + k + '" maxlength="200" autocomplete="off" enterkeyhint="next" placeholder="' + esc(ph) + '" value="' + esc(S.sheet[k]) + '"' + (extra || '') + '></label>'; }
  function fArea(k, label, ph) { return '<label class="f"><span>' + label + '</span><textarea data-f="' + k + '" maxlength="4000" rows="3" placeholder="' + esc(ph) + '">' + esc(S.sheet[k]) + '</textarea></label>'; }
  function fWhen(timeLabel) {
    var f = S.sheet;
    var h = '<label class="f"><span>' + esc(t('fDate')) + '</span><input type="date" data-f="d" value="' + esc(f.d) + '" required></label>';
    if (timeLabel == null) return h;
    return '<div class="two">' + h + '<div class="f"><span id="lb-h">' + timeLabel + '</span><div class="time-row"><input type="time" data-f="h" aria-labelledby="lb-h" value="' + esc(f.h) + '">' + (f.h ? '<button type="button" data-a="noTime" aria-label="' + esc(t('noTime')) + '">' + I.x + '</button>' : '') + '</div></div></div>';
  }
  function recentSites() {
    var seen = {}, out = [], all = allItems().filter(function (it) { return it.t === 'is' && it.site; }).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : (b.u || 0) - (a.u || 0); });
    for (var i = 0; i < all.length && out.length < 8; i++) { var k = low(all[i].site); if (!seen[k]) { seen[k] = 1; out.push(all[i].site); } }
    return out;
  }
  function sheetHTML() {
    var f = S.sheet, kinds = f.d > today() ? KINDS : (f.d === today() && f.h && f.t !== 'not' ? ['h1'] : []);
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><header class="sheet-head"><button type="button" data-a="close">' + esc(t('cancel')) + '</button><h2 id="sh-t">' + esc(t(f.isNew ? 'newEntry' : 'editEntry')) + '</h2><button type="button" class="ok" data-a="save">' + esc(t('save')) + '</button></header><div class="sheet-body">';
    h += '<div class="types" role="group">' + TYPES.map(function (k) { return '<button type="button" data-a="type" data-t="' + k + '" aria-pressed="' + (f.t === k) + '"><i class="mk ' + k + '"></i>' + esc(t('type_' + k)) + '</button>'; }).join('') + '</div><p class="type-hint">' + esc(t('hint_' + f.t)) + '</p>';
    if (f.t === 'termin') {
      h += fText('title', esc(t('fWhat')), t('phWhat')) + fText('place', esc(t('fWhere')), t('phWhere')) + fWhen(esc(t('fTime'))) + fArea('note', esc(t('fNote')) + ' <small>' + esc(t('optional')) + '</small>', t('phNote'));
    } else if (f.t === 'is') {
      var sg = recentSites();
      h += fText('site', esc(t('fSite')), t('phSite'));
      if (sg.length) h += '<div class="sugg">' + sg.map(function (s) { return '<button type="button" data-a="sugg" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
      h += '<div class="f"><span id="lb-n">' + esc(t('fN')) + '</span><div class="stepper" role="group" aria-labelledby="lb-n"><button type="button" data-a="step" data-n="-1" aria-label="' + esc(t('less')) + '">' + I.minus + '</button><output id="n-out" aria-live="polite">' + f.n + '</output><button type="button" data-a="step" data-n="1" aria-label="' + esc(t('more1')) + '">' + I.plus + '</button></div></div>';
      h += fText('who', esc(t('fWho')) + ' <small>' + esc(t('optional')) + '</small>', t('phWho'), ' maxlength="300"') + fArea('work', esc(t('fWork')), t('phWork')) + fWhen(esc(t('fTime')) + ' <small>' + esc(t('optional')) + '</small>');
    } else {
      h += fArea('note', esc(t('fNoteMain')), t('phNoteMain')) + fWhen(null);
    }
    if (kinds.length) {
      h += '<div class="f"><span id="lb-r">' + esc(t('fRem')) + '</span><div class="picks" role="group" aria-labelledby="lb-r">' + kinds.map(function (k) {
        var dis = k === 'h1' && (!f.h || f.t === 'not');
        return '<button type="button" data-a="rem" data-k="' + k + '" aria-pressed="' + (!!f.r[k] && !dis) + '"' + (dis ? ' disabled' : '') + '>' + I.check + esc(t('rem_' + k)) + '</button>';
      }).join('') + '</div>';
      if (S.push !== 'on' && S.push !== 'noapi') h += '<p class="hint">' + esc(t('remHintPush')) + '</p>';
      else if (!f.h && f.t !== 'not') h += '<p class="hint">' + esc(t('remHintTime')) + '</p>';
      h += '</div>';
    }
    if (!f.isNew && f.t === 'termin') h += '<button type="button" class="check" role="checkbox" data-a="done" aria-checked="' + (f.done ? 'true' : 'false') + '"><i>' + I.check + '</i>' + esc(t('done')) + '</button>';
    if (S.sheetErr) h += '<p class="err" role="alert">' + esc(S.sheetErr) + '</p>';
    h += '<button type="button" class="btn-main" data-a="save">' + esc(t('save')) + '</button>';
    if (!f.isNew) {
      if (S.ask === 'del') h += '<div class="ask"><p>' + esc(t('delAsk')) + '</p><div><button type="button" data-a="askNo">' + esc(t('delNo')) + '</button><button type="button" class="yes" data-a="delYes">' + esc(t('delYes')) + '</button></div></div>';
      else h += '<button type="button" class="btn-del" data-a="del">' + I.trash + esc(t('del')) + '</button>';
    }
    return h + '</div></div>';
  }
  function renderSheet(fresh) {
    var box = $('#sheet'), body = $('.sheet-body', box), top = body && !fresh ? body.scrollTop : 0;
    box.innerHTML = '<div class="sheet-wrap" data-a="backdrop">' + sheetHTML() + '</div>';
    if (fresh) { clearTimeout(toastT); toastFn = null; $('#toast').innerHTML = ''; }
    document.body.classList.add('lock');
    body = $('.sheet-body', box);
    if (body) body.scrollTop = top;
    if (!fresh) { var sh = $('.sheet', box); if (sh) sh.style.animation = 'none'; }
  }
  function readForm() {
    var f = S.sheet, els = document.querySelectorAll('#sheet [data-f]');
    for (var i = 0; i < els.length; i++) f[els[i].getAttribute('data-f')] = els[i].value;
    if (!isTime(f.h)) f.h = '';
  }
  function saveSheet() {
    var f = S.sheet; if (!f) return;
    readForm();
    var title = f.title.trim(), place = f.place.trim(), site = f.site.trim(), who = f.who.trim(), work = f.work.trim(), note = f.note.trim();
    var err = !isDate(f.d) ? 'errDate' : f.t === 'termin' ? (title || place ? '' : 'errTermin') : f.t === 'is' ? (site || work ? '' : 'errIs') : (note ? '' : 'errNot');
    if (err) { S.sheetErr = t(err); renderSheet(); var e = $('#sheet .err'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); return; }
    var now = Date.now(), old = f.isNew ? null : DOC.items[f.id], h = f.t === 'not' ? '' : f.h;
    var it = { id: f.isNew ? uid() : f.id, t: f.t, d: f.d, h: h };
    it.c = old && old.c ? old.c : now;
    it.tc = old && old.d === f.d && (old.h || '') === h ? (old.tc || old.c || now) : now;
    it.u = Math.max(now, old ? (old.u || 0) + 1 : 0);
    if (f.t === 'termin') { if (title) it.title = title; if (place) it.place = place; if (note) it.note = note; if (f.done) it.done = 1; }
    else if (f.t === 'is') { if (site) it.site = site; it.n = Math.max(0, Math.min(999, f.n | 0)); if (who) it.who = who; if (work) it.work = work; }
    else it.note = note;
    if (f.d >= today()) { var r = {}, any = false; for (var i = 0; i < KINDS.length; i++) { var k = KINDS[i]; if (f.r[k] && !(k === 'h1' && !h)) { r[k] = 1; any = true; } } if (any) it.r = r; }
    DOC.items[it.id] = it; DOC.dirty[it.id] = 1; saveDoc();
    if (S.tab === 'today') S.day = it.d;
    if (S.tab === 'cal') { S.calDay = it.d; S.month = it.d.slice(0, 7); }
    S.sheet = null; S.sheetErr = ''; $('#sheet').innerHTML = ''; document.body.classList.remove('lock');
    render(); toast(t('saved')); syncSoon();
  }
  function deleteItem(id) {
    var old = DOC.items[id]; if (!old) return;
    DOC.items[id] = { id: id, x: 1, u: Math.max(Date.now(), (old.u || 0) + 1) }; DOC.dirty[id] = 1; saveDoc();
    S.sheet = null; S.ask = ''; $('#sheet').innerHTML = ''; document.body.classList.remove('lock');
    render();
    toast(t('deleted'), t('undo'), function () {
      var cur = DOC.items[id]; old.u = Math.max(Date.now(), ((cur && cur.u) || 0) + 1);
      DOC.items[id] = old; DOC.dirty[id] = 1; saveDoc(); render(); syncSoon();
    });
    syncSoon();
  }

  /* ------------------------------------------------------------ Kurzmeldung */
  var toastT = 0, toastFn = null;
  function toast(msg, action, fn) {
    clearTimeout(toastT); toastFn = fn || null;
    $('#toast').innerHTML = '<div class="toast"><div class="toast-in" role="status"><span>' + esc(msg) + '</span>' + (action ? '<button type="button" data-a="toastDo">' + esc(action) + '</button>' : '') + '</div></div>';
    toastT = setTimeout(function () { $('#toast').innerHTML = ''; toastFn = null; }, action ? 6500 : 2600);
  }

  /* ------------------------------------------------------------ Hinweis: zum Home-Bildschirm */
  function showGuide() {
    var inApp = isIOS && !/Safari/i.test(navigator.userAgent);
    $('#guide').innerHTML = '<div class="guide" role="dialog" aria-modal="true" aria-labelledby="g-t"><div class="guide-in"><img class="app-ico" src="icons/icon-192.png" alt="" width="84" height="84">'
      + '<h1 id="g-t">' + esc(t('gTitle')) + '</h1><p>' + esc(t('gText')) + '</p>'
      + '<ol class="steps"><li>' + esc(t('g1')) + ' ' + I.share + '<br><small>' + esc(t('g1b')) + '</small></li><li>' + esc(t('g2')) + ' ' + I.addbox + '</li><li>' + esc(t('g3')) + '</li></ol>'
      + '<p class="note">' + esc(t('gNote')) + (inApp ? ' ' + esc(t('gNoSafari')) : '') + '</p>'
      + (inApp ? '' : '<p class="note" style="background:none;padding:10px 0 0;color:var(--chalk-2)">' + esc(t('gNoSafari')) + '</p>')
      + '<button type="button" class="skip" data-a="guideClose">' + esc(t('gSkip')) + '</button></div></div>';
    document.body.classList.add('lock');
    UI.guideAt = Date.now(); saveUI();
  }
  function closeGuide() { $('#guide').innerHTML = ''; if (!S.sheet) document.body.classList.remove('lock'); }

  /* ------------------------------------------------------------ Abgleich mit der Sicherung */
  function api(method, path, body, key) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    var h = { authorization: 'Bearer ' + (key || KEY) };
    if (body) h['content-type'] = 'application/json';
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined, cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { if (!r.ok || !j) { var e = new Error((j && j.error) || 'http' + r.status); e.status = r.status; throw e; } return j; });
    }).then(function (j) { clearTimeout(to); return j; }, function (e) { clearTimeout(to); throw e; });
  }
  var syncT = 0;
  function syncSoon(ms) { if (!API) return; clearTimeout(syncT); syncT = setTimeout(sync, ms == null ? 1500 : ms); }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function sync() {
    if (!API) return Promise.resolve(false);
    if (S.syncing) { S.again = true; return Promise.resolve(false); }
    S.syncing = true; S.again = false;
    var key = KEY, ids = Object.keys(DOC.dirty), sentU = {}, items = [], sentMu = DOC.meta.mu;
    ids.forEach(function (id) { var it = DOC.items[id]; if (it) { items.push(it); sentU[id] = it.u; } });
    return api('POST', '/sync', { since: DOC.since || 0, items: items, meta: DOC.metaDirty ? DOC.meta : null, tz: tz() }).then(function (r) {
      if (key !== KEY) return false;                                  // inzwischen wurde ein anderer Code geholt
      var changed = false, i, it, cur;
      for (i = 0; i < (r.items || []).length; i++) {
        it = r.items[i]; if (!it || !it.id) continue; delete it.s; cur = DOC.items[it.id];
        if (!cur || it.u > cur.u || (it.u === cur.u && !DOC.dirty[it.id])) { DOC.items[it.id] = it; changed = changed || !cur || cur.u !== it.u || !!cur.x !== !!it.x; }
      }
      ids.forEach(function (id) { var c = DOC.items[id]; if (!c || c.u === sentU[id] || (r.items || []).some(function (x) { return x.id === id && x.u >= c.u; })) delete DOC.dirty[id]; });
      if (r.reset) { for (var id in DOC.items) DOC.dirty[id] = 1; DOC.since = 0; S.again = true; }   // Sicherung war leer: alles noch einmal hochladen
      else DOC.since = r.rev || 0;
      if (DOC.metaDirty && DOC.meta.mu === sentMu) DOC.metaDirty = false;
      if (r.meta && r.meta.mu > (DOC.meta.mu || 0)) { DOC.meta.lang = r.meta.lang === 'de' ? 'de' : 'tr'; DOC.meta.name = r.meta.name || ''; DOC.meta.evening = r.meta.evening ? 1 : 0; DOC.meta.mu = r.meta.mu; changed = true; document.documentElement.lang = DOC.meta.lang; }
      var cut = Date.now() - 40 * 864e5;                              // alte Lösch-Merker, die schon gesichert sind, wegräumen
      for (var k in DOC.items) if (DOC.items[k].x && !DOC.dirty[k] && DOC.items[k].u < cut) delete DOC.items[k];
      DOC.lastSync = Date.now(); S.syncErr = false; saveDoc();
      if (changed || S.tab === 'set') render(true);
      return true;
    }).catch(function () { S.syncErr = true; return false; }).then(function (ok) {
      S.syncing = false;
      if (S.again) syncSoon(400); else if (!ok && Object.keys(DOC.dirty).length) syncSoon(60000);
      return ok;
    });
  }

  /* ------------------------------------------------------------ Mitteilungen */
  function pushCap() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function swReady() { return Promise.race([navigator.serviceWorker.ready, new Promise(function (res, rej) { setTimeout(function () { rej(new Error('sw')); }, 8000); })]); }
  function pushState() {
    if (!API) return Promise.resolve('noapi');
    if (!pushCap()) return Promise.resolve(isIOS && !standalone() ? 'install' : 'none');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return swReady().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) { return sub && Notification.permission === 'granted' ? 'on' : 'off'; }).catch(function () { return 'off'; });
  }
  function sendSub(sub) { var j = sub.toJSON(); return api('POST', '/push', { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, lang: DOC.meta.lang, tz: tz() }); }
  function refreshPush(resend) {
    return pushState().then(function (s) {
      var was = S.push; S.push = s;
      if (s !== was) render(true);
      if (s === 'on' && resend) swReady().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) { if (sub) return sendSub(sub); }).catch(function () {});
    });
  }
  function enablePush() {
    if (!API) return;
    if (!pushCap()) { if (isIOS && !standalone()) showGuide(); else toast(t('pushNoneT')); return; }
    var ask = new Promise(function (res) {                             // sofort im Tipp fragen, sonst unterdrückt das iPhone die Frage
      var r; try { r = Notification.requestPermission(function (p) { res(p); }); } catch (e) { res(Notification.permission); }
      if (r && r.then) r.then(res, function () { res(Notification.permission); });
    });
    ask.then(function (perm) {
      if (perm !== 'granted') { S.push = perm === 'denied' ? 'denied' : 'off'; render(); toast(t('pushDenied')); return; }
      return Promise.all([swReady(), api('GET', '/vapid')]).then(function (a) {
        var reg = a[0], k = a[1].key;
        return reg.pushManager.getSubscription().then(function (sub) {
          var cur = sub && sub.options && sub.options.applicationServerKey ? b64u(sub.options.applicationServerKey) : '';
          if (sub && cur && cur !== k) return sub.unsubscribe().then(function () { return null; });
          return sub;
        }).then(function (sub) { return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(k) }); });
      }).then(sendSub).then(function () {
        S.push = 'on'; render(); toast(t('pushOn'));
        return sync().then(function () { return api('POST', '/push/test', {}); }).catch(function () {});
      }).catch(function () { refreshPush(); toast(t('pushFail')); });
    });
  }
  function disablePush() {
    swReady().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) return;
      var ep = sub.endpoint;
      return sub.unsubscribe().then(function () { return api('DELETE', '/push', { endpoint: ep }).catch(function () {}); });
    }).catch(function () {}).then(function () { S.push = 'off'; render(); toast(t('pushOffDone')); });
  }

  /* ------------------------------------------------------------ Für Excel */
  function csvText() {
    var rows = [[t('cDate'), t('cTime'), t('cType'), t('cTitle'), t('cPlace'), t('cN'), t('cWho'), t('cWork'), t('cNote'), t('cDone')]];
    allItems().sort(function (a, b) { return a.d !== b.d ? (a.d < b.d ? -1 : 1) : cmp(a, b); }).forEach(function (it) {
      rows.push([it.d.slice(8) + '.' + it.d.slice(5, 7) + '.' + it.d.slice(0, 4), it.h || '', t('type_' + it.t), it.t === 'is' ? (it.site || '') : (it.title || ''), it.place || '', it.t === 'is' ? String(it.n || 0) : '', it.who || '', it.work || '', it.note || '', it.done ? t('yes') : '']);
    });
    return '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
  }
  function shareFile(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    function download() { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
    try {
      var file = new File([blob], name, { type: mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(function (e) { if (!e || e.name !== 'AbortError') download(); }); return; }
    } catch (e) { /* kein Teilen-Dialog: herunterladen */ }
    download();
  }

  /* ------------------------------------------------------------ Blättern */
  function goDay(n) {
    var leaf = $('#leaf');
    if (n > 0 && leaf && !reduced) {
      var ghost = leaf.cloneNode(true); ghost.removeAttribute('id'); ghost.removeAttribute('data-swipe');
      ghost.style.cssText = 'position:absolute;left:0;right:0;top:0;z-index:3;pointer-events:none';
      S.day = addDays(S.day, n); render();
      var stack = $('.leaf-stack');
      if (stack) { stack.appendChild(ghost); ghost.classList.add('tear'); setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 340); }
    } else {
      S.day = addDays(S.day, n); S.anim = n < 0 && !reduced ? 'hang' : ''; render(); S.anim = '';
    }
  }
  function goMonth(n) {
    var d = pd(S.month + '-01'); d.setMonth(d.getMonth() + n);
    S.month = ymd(d).slice(0, 7);
    S.calDay = today().slice(0, 7) === S.month ? today() : S.month + '-01';
    render();
  }
  function setTab(tab) {
    if (tab === S.tab) { if (tab === 'today') S.day = today(); if (tab === 'cal') { S.month = today().slice(0, 7); S.calDay = today(); } }
    S.tab = tab; S.ask = ''; S.moveErr = ''; S.limit = 120;
    render(); window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ Zeichnen */
  function renderTabs() {
    function tab(k, ico, label) { return '<button class="tab" data-a="tab" data-tab="' + k + '"' + (S.tab === k ? ' aria-current="page"' : '') + '>' + ico + '<span>' + esc(label) + '</span></button>'; }
    $('#tabs').innerHTML = '<div class="tabbar-in">' + tab('today', I.today, t('tabToday')) + tab('cal', I.cal, t('tabCal')) + '<button class="fab" data-a="new" aria-label="' + esc(t('add')) + '">' + I.plus + '</button>' + tab('list', I.list, t('tabList')) + tab('set', I.gear, t('tabSet')) + '</div>';
  }
  function typing() { var a = document.activeElement; return !!(a && (a.id === 'q' || a.id === 'name' || a.id === 'inkey')); }
  function render(soft) {
    if (soft && typing()) { S.stale = true; return; }                 // im Hintergrund nichts neu zeichnen, solange getippt wird
    S.stale = false;
    $('#screen').innerHTML = S.tab === 'today' ? viewToday() : S.tab === 'cal' ? viewCal() : S.tab === 'list' ? viewList() : viewSet();
    renderTabs();
  }

  /* ------------------------------------------------------------ Bedienung */
  var A = {
    tab: function (el) { setTab(el.getAttribute('data-tab')); },
    'new': function (el) { openNew(el.getAttribute('data-t'), el.getAttribute('data-d')); },
    edit: function (el) { openEdit(el.getAttribute('data-id')); },
    day: function (el) { goDay(+el.getAttribute('data-n')); },
    day0: function () { var back = S.day > today(); S.day = today(); S.anim = back && !reduced ? 'hang' : ''; render(); S.anim = ''; },
    goDay: function (el) { S.day = el.getAttribute('data-d'); S.tab = 'today'; render(); window.scrollTo(0, 0); },
    mon: function (el) { goMonth(+el.getAttribute('data-n')); },
    pick: function (el) { var d = el.getAttribute('data-d'); S.calDay = d; S.month = d.slice(0, 7); render(); },
    filter: function (el) {
      S.filter = el.getAttribute('data-k'); S.limit = 120;
      var cs = document.querySelectorAll('.chips .chip'); for (var i = 0; i < cs.length; i++) cs[i].setAttribute('aria-pressed', cs[i].getAttribute('data-k') === S.filter ? 'true' : 'false');
      var r = $('#recs'); if (r) r.innerHTML = recsHTML();
    },
    more: function () { S.limit += 200; $('#recs').innerHTML = recsHTML(); },
    csv: function () { shareFile('gunluk-' + today() + '.csv', 'text/csv', csvText()); },
    bell: function () { if (S.push === 'off') enablePush(); else if (S.push === 'install') showGuide(); else { S.tab = 'set'; render(); window.scrollTo(0, 0); } },
    pushOn: function () { enablePush(); },
    pushOff: function () { disablePush(); },
    pushTest: function () { api('POST', '/push/test', {}).then(function (r) { toast(t(r.ok ? 'pushTestSent' : 'pushTestFail')); if (!r.devices) refreshPush(true); }).catch(function () { toast(t('pushTestFail')); }); },
    evening: function () { setMeta({ evening: DOC.meta.evening ? 0 : 1 }); render(); },
    guide: function () { showGuide(); },
    guideClose: function () { closeGuide(); },
    install: function () { var p = S.deferred; if (!p) return; S.deferred = null; p.prompt(); if (p.userChoice) p.userChoice.then(function () { render(); }); },
    lang: function (el) {
      setMeta({ lang: el.getAttribute('data-k') === 'de' ? 'de' : 'tr' }); document.documentElement.lang = DOC.meta.lang; render();
      if (S.push === 'on') refreshPush(true);
    },
    syncNow: function () { sync().then(function (ok) { toast(t(ok ? 'backupOk' : 'backupFail')); render(); }); },
    showKey: function () { S.showKey = true; render(); },
    copyKey: function () {
      var done = function () { toast(t('copied')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(KEY).then(done, function () { var e = $('#mykey'); if (e) { e.focus(); e.select(); } });
      else { var e = $('#mykey'); if (e) { e.focus(); e.select(); try { document.execCommand('copy'); done(); } catch (x) { /* von Hand kopieren */ } } }
    },
    moveGo: function () {
      var el = $('#inkey'), code = el ? el.value.replace(/\s+/g, '') : '';
      if (!KEY_RE.test(code)) { S.moveErr = t('moveBad'); render(); return; }
      S.moveErr = '';
      api('POST', '/sync', { since: 0, items: [] }, code).then(function (r) {
        KEY = code; lsSet(LS_KEY, code);
        for (var id in DOC.items) DOC.dirty[id] = 1;                  // was schon auf diesem Handy steht, kommt mit
        DOC.since = 0; saveDoc(); S.showKey = false;
        return sync().then(function () { refreshPush(true); render(); toast(t('moveDone')); });
      }).catch(function () { S.moveErr = t('moveFail'); render(); });
    },
    wipe: function () { S.ask = 'wipe'; render(); },
    wipeYes: function () {
      var old = KEY;
      (API ? api('DELETE', '/account', {}, old).catch(function () {}) : Promise.resolve()).then(function () {
        var m = DOC.meta; DOC = loadDocEmpty(m); KEY = rndKey(); lsSet(LS_KEY, KEY); saveDoc();
        S.ask = ''; S.showKey = false; render(); toast(t('wipeDone')); if (S.push === 'on') refreshPush(true);
      });
    },
    askNo: function () { S.ask = ''; if (S.sheet) renderSheet(); else render(); },
    close: function () { closeSheet(); },
    backdrop: function (el, e) { if (e.target === el) closeSheet(); },
    save: function () { saveSheet(); },
    type: function (el) {
      var f = S.sheet; readForm(); f.t = el.getAttribute('data-t');
      if (f.isNew && !f.rTouched) f.r = defRem(f);
      S.sheetErr = ''; renderSheet();
    },
    sugg: function (el) { var f = S.sheet; readForm(); f.site = el.getAttribute('data-v'); var i = $('#sheet [data-f="site"]'); if (i) i.value = f.site; },
    step: function (el) { var f = S.sheet; f.n = Math.max(0, Math.min(99, (f.n | 0) + (+el.getAttribute('data-n')))); var o = $('#n-out'); if (o) o.textContent = f.n; },
    rem: function (el) { var f = S.sheet, k = el.getAttribute('data-k'); if (f.r[k]) delete f.r[k]; else f.r[k] = 1; f.rTouched = true; el.setAttribute('aria-pressed', f.r[k] ? 'true' : 'false'); },
    noTime: function () { var f = S.sheet; readForm(); f.h = ''; renderSheet(); },
    done: function (el) { var f = S.sheet; f.done = f.done ? 0 : 1; el.setAttribute('aria-checked', f.done ? 'true' : 'false'); },
    del: function () { S.ask = 'del'; readForm(); renderSheet(); var b = $('#sheet .sheet-body'); if (b) b.scrollTop = b.scrollHeight; },
    delYes: function () { if (S.sheet && S.sheet.id) deleteItem(S.sheet.id); },
    toastDo: function () { var fn = toastFn; clearTimeout(toastT); $('#toast').innerHTML = ''; toastFn = null; if (fn) fn(); }
  };
  function loadDocEmpty(meta) { return { items: {}, dirty: {}, since: 0, meta: { lang: meta.lang, name: meta.name, evening: meta.evening, eveningAt: '18:00', mu: Date.now() }, metaDirty: true, lastSync: 0 }; }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-a]') : null;
    if (!el) return;
    if (Date.now() - S.swiped < 350) return;                          // das war ein Wischen, kein Tippen
    var fn = A[el.getAttribute('data-a')];
    if (fn) fn(el, e);
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'q') { S.q = el.value; S.limit = 120; var r = $('#recs'); if (r) r.innerHTML = recsHTML(); return; }
    if (el.id === 'name') { setMeta({ name: el.value.replace(/\s+/g, ' ').slice(0, 40) }); return; }
    var k = el.getAttribute && el.getAttribute('data-f');
    if (k && S.sheet) S.sheet[k] = el.value;
  });
  document.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-f'), f = S.sheet;
    if (!f || (k !== 'd' && k !== 'h')) return;
    readForm();
    if (k === 'd' && isDate(f.d) && f.isNew && !f.rTouched) f.r = defRem(f);
    if (isDate(f.d)) renderSheet();
  });
  document.addEventListener('focusout', function (e) {
    var id = e.target && e.target.id;
    if (id === 'name') DOC.meta.name = DOC.meta.name.trim();
    if ((id === 'q' || id === 'name' || id === 'inkey') && S.stale) setTimeout(function () { if (!typing()) render(); }, 80);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (S.sheet) closeSheet(); else if ($('#guide').innerHTML) closeGuide(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'q') e.target.blur();
  });

  var sw = null;
  document.addEventListener('touchstart', function (e) {
    var el = e.target.closest ? e.target.closest('[data-swipe]') : null;
    sw = el && e.touches.length === 1 ? { el: el, x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!sw) return;
    var p = e.changedTouches[0], dx = p.clientX - sw.x, dy = p.clientY - sw.y, kind = sw.el.getAttribute('data-swipe'); sw = null;
    if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    S.swiped = Date.now();
    if (kind === 'day') goDay(dx < 0 ? 1 : -1); else goMonth(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ------------------------------------------------------------ Start */
  function applyUrl(search) {
    var m = /[?&]d=(\d{4}-\d{2}-\d{2})/.exec(search || ''), y = /[?&]yeni=(termin|is|not)/.exec(search || '');
    if (m && isDate(m[1])) { S.tab = 'today'; S.day = m[1]; }
    return y ? y[1] : '';
  }
  function rollover() {
    var now = today();
    if (now === S.today) return false;
    if (S.day === S.today) S.day = now;
    if (S.calDay === S.today) { S.calDay = now; S.month = now.slice(0, 7); }
    S.today = now; return true;
  }
  function boot() {
    document.documentElement.lang = DOC.meta.lang;
    $('#app').innerHTML = '<main class="screen" id="screen"></main><nav class="tabbar" id="tabs"></nav><div id="sheet"></div><div id="guide"></div><div id="toast" aria-live="polite"></div>';
    var neu = applyUrl(location.search);
    if (location.search && history.replaceState) history.replaceState(null, '', location.pathname);
    render();
    if (neu) openNew(neu, S.day);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
      navigator.serviceWorker.addEventListener('message', function (e) {
        var d = e.data || {};
        if (d.type === 'open') { var n = applyUrl(String(d.url || '').replace(/^[^?]*/, '')); closeGuide(); render(); window.scrollTo(0, 0); if (n && !S.sheet) openNew(n, S.day); }
        if (d.type === 'push') sync();
      });
    }
    refreshPush(true);
    if (isIOS && !standalone() && (!UI.guideAt || Date.now() - UI.guideAt > 20 * 3600 * 1000)) showGuide();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    sync();
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.deferred = e; if (S.tab === 'set') render(true); });
    window.addEventListener('appinstalled', function () { S.deferred = null; render(); });
    window.addEventListener('online', function () { render(true); sync(); });
    window.addEventListener('offline', function () { render(true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) return; if (rollover()) render(true); refreshPush(); sync(); });
    setInterval(function () { if (document.hidden) return; if (rollover()) render(true); sync(); }, 5 * 60000);
  }
  boot();
})();
