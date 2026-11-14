// Adresse des Reservierungssystems. Auf der Cloudflare-Seite und lokal liegt es auf derselben Adresse,
// auf xenosmart.de (reine Dateiablage) wird das Cloudflare-Projekt angesprochen.
(function () {
  // true = Das Reservierungssystem ist noch nicht eingerichtet: Ist es nicht erreichbar, zeigt die Seite den Ablauf
  //        zum Ausprobieren ("Vorführ-Modus"). Sobald es läuft, auf false stellen: Dann erscheint bei einer Störung
  //        ein deutlicher Hinweis mit Telefonnummer – damit niemand glaubt, er habe reserviert.
  var VOR_DEM_START = true;
  var h = location.hostname, same = /\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1', ours = same || /(^|\.)xenosmart\.de$/.test(h);
  window.LEONN_CFG = {
    api: same ? location.origin + '/api' : 'https://leonn-reservierung.pages.dev/api',
    site: same ? location.origin + '/' : 'https://leonn-reservierung.pages.dev/',   // Adresse für den Status-Link an Gäste
    demo: ours ? VOR_DEM_START : true                                               // fremde Adressen (private Vorschau) zeigen immer nur die Vorführung
  };
})();
