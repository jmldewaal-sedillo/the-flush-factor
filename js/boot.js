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
    document.getElementById('fatal-title').textContent = 'Het spel kon niet starten';
    document.getElementById('fatal-body').textContent = 'Er ging iets mis bij het laden. Controleer je verbinding en herlaad de pagina.';
    var loading = document.getElementById('loading');
    if (loading) loading.hidden = true;
    fatal.hidden = false;
  }
  window.addEventListener('error', function (e) { if (!e.target || e.target === window || e.target.tagName === 'SCRIPT') fail(); }, true);
  window.addEventListener('unhandledrejection', fail);
})();
