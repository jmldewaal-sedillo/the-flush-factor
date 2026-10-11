// Draait vóór de stylesheet effect heeft: zet een gesimuleerde safe-area (notch / punch-hole)
// als de pagina is geopend met ?safe=boven,rechts,onder,links (pixels). Gebruikt door de
// telefoonpreview en de tests; op een echte telefoon komen de waarden uit env(safe-area-inset-*).
(function () {
  var safe = new URLSearchParams(location.search).get('safe');
  if (!safe) return;
  var v = safe.split(',').map(function (n) { return Math.max(0, parseInt(n, 10) || 0); });
  var s = document.documentElement.style;
  ['--sat', '--sar', '--sab', '--sal'].forEach(function (name, i) { s.setProperty(name, (v[i] || 0) + 'px'); });
})();

// Vangnet: gaat er iets mis vóórdat het spel klaar is (script laadt niet, fout in een module), toon dan
// een melding in plaats van eeuwig "Laden…".
(function () {
  function fail() {
    if (window.__game && window.__game.ready) return;
    var fatal = document.getElementById('fatal');
    if (!fatal || !fatal.hidden) return;
    // De tekst komt uit de taalbestanden (toesteltaal, anders Engels). Laden die ook niet, dan blijft de
    // korte Engelse noodtekst hieronder staan: zonder taalbestanden valt er niets te vertalen.
    var title = document.getElementById('fatal-title'), body = document.getElementById('fatal-body');
    title.textContent = 'The game could not start';
    body.textContent = 'Something went wrong while loading. Check your connection and reload the page.';
    import('./i18n/index.js').then(function (i18n) {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem('flushfactor.settings') || 'null'); } catch (e) { /* geen opslag */ }
      var lang = saved && i18n.STRINGS[saved.language] ? saved.language : i18n.deviceLanguage();
      title.textContent = i18n.STRINGS[lang]['fatal.title'];
      body.textContent = i18n.STRINGS[lang]['fatal.body'];
    }).catch(function () { /* noodtekst blijft staan */ });
    var loading = document.getElementById('loading');
    if (loading) loading.hidden = true;
    fatal.hidden = false;
  }
  window.addEventListener('error', function (e) { if (!e.target || e.target === window || e.target.tagName === 'SCRIPT') fail(); }, true);
  window.addEventListener('unhandledrejection', fail);
})();
