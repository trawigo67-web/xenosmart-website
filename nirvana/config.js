// NIRVANA – Einstellungen an EINER Stelle.
// Reservierung, Bestellung, Feier- und Kindergeburtstags-Anfragen laufen über dieselbe Schnittstelle wie bei Leonn
// (eigenes Cloudflare-Projekt „nirvana-reservierung“, noch NICHT eingerichtet).
(function () {
  // true  = Vorführ-Modus: Alles lässt sich ausprobieren, es wird aber NICHTS an das Restaurant gesendet.
  //         Eingaben bleiben nur auf diesem Gerät. So bleibt es, bis die Inhaber die Seite freigeben.
  // false = Live: Reservierungen und Bestellungen gehen an das System bzw. den gewählten Kanal (siehe BESTELLUNG.kanal).
  var VOR_DEM_START = true;
  var SYSTEM = 'https://nirvana-reservierung.pages.dev';
  var h = location.hostname, same = /\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1', ours = same || /(^|\.)xenosmart\.de$/.test(h) || /(^|\.)nirvanamechernich\.com$/.test(h);

  window.NIRVANA_CFG = {
    api: same ? location.origin + '/api' : (ours && !VOR_DEM_START ? SYSTEM + '/api' : ''),
    site: same ? location.origin + '/' : SYSTEM + '/',
    demo: ours ? VOR_DEM_START : true,
    preview: true,                       // zeigt „Vorschlag“-Markierungen bei neuen, noch nicht bestätigten Angeboten

    phone: '02443 9124069', phoneIntl: '+4924439124069', mail: 'info@nirvanamechernich.com',
    whatsapp: '',                        // z. B. '49170xxxxxxx' – leer = kein WhatsApp-Knopf

    // Öffnungszeiten (0 = Sonntag … 6 = Samstag), wie auf nirvanamechernich.com
    hours: { 0: ['09:00', '22:00'], 1: ['10:00', '22:00'], 2: ['10:00', '22:00'], 3: ['10:00', '22:00'], 4: ['10:00', '22:00'], 5: ['10:00', '23:00'], 6: ['10:00', '23:00'] },

    // Online-Bestellung – ALLE Werte sind Vorschläge und müssen vom Restaurant bestätigt werden
    order: {
      kanal: 'api',                      // 'api' (Bestellsystem), 'whatsapp' oder 'mail' – greift erst, wenn VOR_DEM_START = false
      pickupMin: 25,                     // Abholung frühestens in … Minuten
      deliveryMin: 50,                   // Lieferung frühestens in … Minuten
      stepMin: 15,
      lastBeforeClose: 30,               // letzte Bestellung … Minuten vor Schluss
      delivery: [                        // Liefergebiete nach Postleitzahl
        { zip: '53894', name: 'Mechernich (alle Ortsteile)', min: 25, fee: 2.5 },
        { zip: '53879', name: 'Euskirchen', min: 35, fee: 4.5 },
        { zip: '53881', name: 'Euskirchen (Ost)', min: 35, fee: 4.5 },
        { zip: '53925', name: 'Kall', min: 35, fee: 4.5 },
        { zip: '53909', name: 'Zülpich', min: 40, fee: 5.5 }
      ],
      pay: ['bar', 'karte']              // Bezahlung bei Abholung bzw. Lieferung
    },

    // Reservierung (Vorführ-Modus) – Bereiche und Grenzen, Vorschlag
    rsv: { maxParty: 9, groupMin: 10, groupMax: 40, maxDays: 60, terrace: [5, 9], sundayBreakfast: ['09:00', '11:00'] }
  };
})();
