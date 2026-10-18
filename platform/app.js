// The Flush Factor – platform/app.js
// De dunne laag voor het bouwdoel APP: Capacitor, voor Android én iOS uit dezelfde bestanden. Alles zit in de
// app: geen service worker, geen netwerk nodig. Zie platform/web.js voor de onderdelen en docs/app.md voor het
// bouwen.
window.Platform = {
  DOEL: 'app',
  SERVICE_WORKER: false,
  EXTERNE_LINKS: true,           // Capacitor opent een link naar buiten in de browser van de telefoon
  VOLLEDIG_SCHERM: false,

  start(app) {
    // De terugknop van Android: een stap terug in het spel, en als er niets meer terug te doen is de app
    // sluiten. iOS heeft geen terugknop; daar komt dit nooit. De plug-in @capacitor/app zit alleen in de echte
    // app; in een browser gebeurt er niets.
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!plugin) return;
    plugin.addListener('backButton', () => { if (!app.back()) plugin.exitApp(); });
  },

  // Advertenties: uit. AdMob komt er alleen in via de Capacitor-plug-in, na akkoord van Jenn.
  advertenties: {
    beschikbaar: false,
    tussendoor() { return Promise.resolve(false); },
  },

  spel: {
    geladen() {},
    start() {},
    stop() {},
  },
};
