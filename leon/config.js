// Adresse des Reservierungssystems. Auf der Cloudflare-Seite und lokal liegt es auf derselben Adresse,
// auf xenosmart.de (reine Dateiablage) wird das Cloudflare-Projekt angesprochen.
(function () {
  // true = Das Reservierungssystem ist noch nicht eingerichtet: Die Seite zeigt den Ablauf nur zum Ausprobieren
  //        ("Vorführ-Modus") und spricht die spätere Adresse noch gar nicht an – sie gehört erst nach dem Einrichten sicher zu uns.
  // false = Es läuft: Bei einer Störung erscheint ein deutlicher Hinweis mit Telefonnummer, damit niemand glaubt, er habe reserviert.
  var VOR_DEM_START = true;
  var SYSTEM = 'https://leonn-reservierung.pages.dev';
  var h = location.hostname, same = /\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1', ours = same || /(^|\.)xenosmart\.de$/.test(h);
  window.LEONN_CFG = {
    api: same ? location.origin + '/api' : (ours && !VOR_DEM_START ? SYSTEM + '/api' : ''),   // fremde Adressen (private Vorschau) sprechen nie etwas an
    site: same ? location.origin + '/' : SYSTEM + '/',                                        // Adresse für den Status-Link an Gäste
    demo: ours ? VOR_DEM_START : true
  };
})();
