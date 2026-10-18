// The Flush Factor – platform/web.js
// De dunne laag voor het bouwdoel WEB: de browser, ook de testversie en het live adres op github.io.
//
// Elk bouwdoel heeft zo'n bestand met precies dezelfde onderdelen (tests/bouwdoelen.spec.js controleert dat):
//   platform/web.js   browser, met service worker
//   platform/app.js   Capacitor-app voor Android én iOS: alles in de app, zonder service worker
// tools/bouw.mjs zet het juiste bestand in de pagina's. De spelcode vraagt aan Platform wat kan en kijkt nooit
// zelf op welk bouwdoel ze draait. Zie Apps/CLAUDE.md, sectie 11 ("App-structuur Studio Sedillo").
window.Platform = {
  DOEL: 'web',
  SERVICE_WORKER: true,          // bestanden bewaren voor spelen zonder internet
  EXTERNE_LINKS: true,           // links naar buiten (credits, privacyverklaringen, mailto)
  VOLLEDIG_SCHERM: true,         // menu-item "Volledig scherm"; een app is dat al

  // Eén keer aangeroepen als het spel klaar is. app.back() doet één stap terug (venster dicht, uitzoomen) en
  // geeft false als er niets meer terug te doen is.
  start(app) {},

  // Advertenties: uit. Alleen na akkoord van Jenn (Apps/CLAUDE.md, sectie 11, punt 5).
  advertenties: {
    beschikbaar: false,
    tussendoor() { return Promise.resolve(false); },
  },

  // Voor portals die willen weten wanneer er gespeeld wordt. Hier doet het niets.
  spel: {
    geladen() {},
    start() {},
    stop() {},
  },
};
