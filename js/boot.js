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
