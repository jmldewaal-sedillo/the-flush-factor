// THE FLUSH FACTOR — phone-preview.js
// Ontwikkelhulp: toont het spel op een laptop/desktop in een telefoon- of tabletframe.
// Op echte telefoons (touch) doet dit bestand niets.
// Het frame simuleert ook de safe-area: het spel in het frame krijgt ?safe=… mee (zie js/boot.js),
// zodat knoppen net als op een echte telefoon onder de notch / punch-hole blijven.
(function () {
  'use strict';

  var inIframe = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  if (inIframe) return;

  var params = new URLSearchParams(location.search);
  var urlParam = params.get('preview');           // 'phone' | 'off' | null
  var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem('flushfactor_preview_' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('flushfactor_preview_' + k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('flushfactor_preview_' + k); } catch (e) {} }
  };
  var ic = function (name, size) {
    return '<svg class="ic" width="' + size + '" height="' + size + '" aria-hidden="true"><use href="assets/icons/sprite.svg#' + name + '"/></svg>';
  };

  var show = urlParam === 'off' ? false : urlParam === 'phone' ? true : (store.get('mode') !== 'off' && !isTouch && !navigator.webdriver);

  if (!show) {
    // Preview eerder uitgezet? Bied een knop om hem weer aan te zetten.
    if (!isTouch && urlParam !== 'off' && store.get('mode') === 'off') {
      document.addEventListener('DOMContentLoaded', function () {
        var btn = document.createElement('button');
        btn.id = 'pv-reopen';
        btn.className = 'pill-btn';
        btn.innerHTML = ic('smartphone', 18) + '<span>Preview</span>';
        btn.addEventListener('click', function () { store.del('mode'); location.href = location.pathname; });
        document.body.appendChild(btn);
      });
    }
    return;
  }

  window.__PHONE_PREVIEW_ACTIVE = true;           // game.js start dan niet op de buitenste pagina

  document.addEventListener('DOMContentLoaded', function () {
    var SIZES = {
      small:      { w: 360, h: 740,  type: 'phone',  label: 'Klein' },
      standard:   { w: 390, h: 844,  type: 'phone',  label: 'Standaard' },
      large:      { w: 430, h: 932,  type: 'phone',  label: 'Groot' },
      'tablet-s': { w: 768, h: 1024, type: 'tablet', label: 'Mini' },
      'tablet-l': { w: 820, h: 1180, type: 'tablet', label: 'Groot' }
    };
    // Schermuitsparingen: safe-area in staande stand [boven, rechts, onder, links]
    var CUTOUTS = {
      notch: { label: 'Notch',      safe: [47, 0, 34, 0] },
      punch: { label: 'Punch-hole', safe: [36, 0, 20, 0] },
      none:  { label: 'Geen',       safe: [0, 0, 0, 0] }
    };

    var size = SIZES[store.get('size')] ? store.get('size') : 'standard';
    var cutout = CUTOUTS[store.get('cutout')] ? store.get('cutout') : 'notch';
    var landscape = store.get('landscape_' + SIZES[size].type) === 'true';

    var style = document.createElement('style');
    style.textContent =
      'body.pv-active{overflow:hidden!important;background:#14141f!important}' +
      '#game-screen,#shop-screen,#credits-modal,#fatal{display:none!important}' +
      '#pv-root{position:fixed;inset:0;display:flex;flex-direction:column;background:#14141f;font-family:system-ui,sans-serif;color:#eee;z-index:9999}' +
      '#pv-toolbar{display:flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(0,0,0,.45);flex-shrink:0;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.1)}' +
      '.pv-lbl{display:inline-flex;align-items:center;gap:4px;font-size:.72rem;color:#9a9ab0;white-space:nowrap}' +
      '.pv-sep{width:1px;height:20px;background:rgba(255,255,255,.2);flex-shrink:0}' +
      '.pv-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:rgba(255,255,255,.08);color:#ccc;font-size:.74rem;line-height:1.3;cursor:pointer}' +
      '.pv-btn:hover{background:rgba(255,255,255,.18)}' +
      '.pv-btn.active{background:rgba(44,125,160,.6);border-color:#4aa8d0;color:#fff}' +
      '.pv-btn small{opacity:.65}' +
      '.pv-off{border-color:rgba(230,57,70,.5);color:#ff9d9d}' +
      '#pv-stage{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:16px}' +
      '#pv-frame{position:relative;flex-shrink:0;overflow:hidden;background:#000;box-shadow:0 0 0 10px #222,0 0 0 13px #3a3a3a,0 24px 64px rgba(0,0,0,.8)}' +
      '#pv-iframe{display:block;border:none;width:100%;height:100%}' +
      '.pv-cut{position:absolute;background:#000;z-index:10;pointer-events:none}' +
      '#pv-homebar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:120px;height:5px;background:rgba(255,255,255,.35);border-radius:3px;z-index:10;pointer-events:none}';
    document.head.appendChild(style);

    function sizeButtons(type) {
      return Object.keys(SIZES).filter(function (k) { return SIZES[k].type === type; }).map(function (k) {
        return '<button class="pv-btn" data-size="' + k + '">' + SIZES[k].label + ' <small>' + SIZES[k].w + '×' + SIZES[k].h + '</small></button>';
      }).join('');
    }
    var root = document.createElement('div');
    root.id = 'pv-root';
    root.innerHTML =
      '<div id="pv-toolbar">' +
        '<span class="pv-lbl">' + ic('smartphone', 14) + 'Telefoon</span>' + sizeButtons('phone') +
        '<div class="pv-sep"></div><span class="pv-lbl">' + ic('tablet', 14) + 'Tablet</span>' + sizeButtons('tablet') +
        '<div class="pv-sep"></div><span class="pv-lbl">Uitsparing</span>' +
        Object.keys(CUTOUTS).map(function (k) { return '<button class="pv-btn" data-cutout="' + k + '">' + CUTOUTS[k].label + '</button>'; }).join('') +
        '<div class="pv-sep"></div><button class="pv-btn" id="pv-rotate">' + ic('rotate-cw', 14) + 'Draaien</button>' +
        '<button class="pv-btn" id="pv-fullscreen">' + ic('maximize', 14) + '<span>Volledig scherm</span></button>' +
        '<button class="pv-btn pv-off" id="pv-disable">' + ic('x', 14) + 'Sluit preview</button>' +
      '</div>' +
      '<div id="pv-stage"><div id="pv-frame"><iframe id="pv-iframe" title="The Flush Factor — preview"></iframe></div></div>';
    document.body.classList.add('pv-active');
    document.body.appendChild(root);

    var frame = document.getElementById('pv-frame');
    var stage = document.getElementById('pv-stage');
    var iframe = document.getElementById('pv-iframe');
    var loadedSafe = null;

    function apply() {
      var s = SIZES[size], tablet = s.type === 'tablet';
      var w = landscape ? s.h : s.w, h = landscape ? s.w : s.h;
      var scale = Math.min(1, (stage.clientWidth - 32) / w, (stage.clientHeight - 32) / h);
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      frame.style.transform = 'scale(' + scale.toFixed(4) + ')';
      frame.style.borderRadius = tablet ? '18px' : '44px';

      // Safe-area: tablets hebben geen uitsparing; liggend zit die links.
      var c = tablet ? CUTOUTS.none : CUTOUTS[cutout];
      var safe = landscape ? [0, 0, c.safe[2] ? 21 : 0, c.safe[0]] : c.safe;

      frame.querySelectorAll('.pv-cut, #pv-homebar').forEach(function (el) { el.remove(); });
      if (!tablet && cutout !== 'none') {
        var cut = document.createElement('div');
        cut.className = 'pv-cut';
        var css = cutout === 'notch'
          ? (landscape ? 'left:0;top:50%;transform:translateY(-50%);width:32px;height:160px;border-radius:0 20px 20px 0'
                       : 'top:0;left:50%;transform:translateX(-50%);width:160px;height:32px;border-radius:0 0 20px 20px')
          : (landscape ? 'left:10px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%'
                       : 'top:10px;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%');
        cut.style.cssText = css;
        frame.appendChild(cut);
        var bar = document.createElement('div');
        bar.id = 'pv-homebar';
        frame.appendChild(bar);
      }

      var key = safe.join(',');
      if (key !== loadedSafe) { loadedSafe = key; iframe.src = './?safe=' + key; }

      document.querySelectorAll('[data-size]').forEach(function (b) { b.classList.toggle('active', b.dataset.size === size); });
      document.querySelectorAll('[data-cutout]').forEach(function (b) { b.classList.toggle('active', b.dataset.cutout === cutout); b.disabled = tablet; });
    }
    apply();

    var raf;
    window.addEventListener('resize', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); });

    document.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () {
        var prev = SIZES[size].type;
        size = b.dataset.size;
        landscape = prev === SIZES[size].type ? store.get('landscape_' + SIZES[size].type) === 'true' : false;
        store.set('size', size);
        apply();
      });
    });
    document.querySelectorAll('[data-cutout]').forEach(function (b) {
      b.addEventListener('click', function () { cutout = b.dataset.cutout; store.set('cutout', cutout); apply(); });
    });
    document.getElementById('pv-rotate').addEventListener('click', function () {
      landscape = !landscape;
      store.set('landscape_' + SIZES[size].type, String(landscape));
      apply();
    });
    var fs = document.getElementById('pv-fullscreen');
    fs.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', function () {
      fs.classList.toggle('active', !!document.fullscreenElement);
      setTimeout(apply, 150);
    });
    document.getElementById('pv-disable').addEventListener('click', function () {
      store.set('mode', 'off');
      location.href = location.pathname;
    });
  });
})();
