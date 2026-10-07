// ============================================================
// THE FLUSH FACTOR — phone-preview.js
// Toont het spel in een telefoonframe op desktops/laptops.
// Op echte telefoons (touch) doet dit bestand niets.
// ============================================================

(function () {
  'use strict';

  // ── Stap 1: Zitten we al in een iframe? ──
  var inIframe = (function () {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();
  if (inIframe) return;

  // ── Stap 2: Bepaal of de preview getoond moet worden ──
  var params     = new URLSearchParams(location.search);
  var urlParam   = params.get('preview'); // 'phone' | 'off' | null
  var savedMode  = '';

  var isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  var showPreview;
  if (urlParam === 'off') {
    showPreview = false;
  } else if (urlParam === 'phone') {
    showPreview = true;
  } else {
    try { savedMode = localStorage.getItem('flushfactor_preview_mode') || ''; } catch (e) {}
    showPreview = savedMode !== 'off' && !isTouchDevice;
  }

  // ── Toon kleine heractiveer-knop als preview handmatig werd uitgeschakeld ──
  if (!showPreview) {
    if (!isTouchDevice && urlParam !== 'off' && savedMode === 'off') {
      document.addEventListener('DOMContentLoaded', function () {
        var btn = document.createElement('button');
        btn.id      = 'pv-reopen';
        btn.title   = 'Telefoonpreview inschakelen';
        btn.textContent = '📱';
        btn.addEventListener('click', function () {
          try { localStorage.removeItem('flushfactor_preview_mode'); } catch (e) {}
          location.href = location.pathname;
        });
        document.body.appendChild(btn);
      });
    }
    return;
  }

  // ── Stap 3: Markeer dat game.js niet mag initiëren op de host-pagina ──
  window.__PHONE_PREVIEW_ACTIVE = true;

  // ── Stap 4: Bouw de preview-UI zodra de DOM gereed is ──
  document.addEventListener('DOMContentLoaded', function () {

    var SIZES = {
      small:    { w: 360, h: 740 },
      standard: { w: 390, h: 844 },
      large:    { w: 430, h: 932 }
    };

    var currentSize = 'standard';
    var isLandscape = false;
    try {
      var ls = localStorage.getItem('flushfactor_preview_size');
      if (ls && SIZES[ls]) currentSize = ls;
      isLandscape = localStorage.getItem('flushfactor_preview_landscape') === 'true';
    } catch (e) {}

    // ── CSS voor de preview-UI ──
    var style = document.createElement('style');
    style.textContent =
      'body.pv-active{overflow:hidden!important;background:#1a1a2e!important}' +
      '#pv-root{position:fixed;inset:0;display:flex;flex-direction:column;' +
        'background:#1a1a2e;font-family:system-ui,sans-serif;color:#eee;z-index:9999}' +
      '#pv-toolbar{display:flex;align-items:center;gap:8px;padding:8px 14px;' +
        'background:rgba(0,0,0,.45);flex-shrink:0;flex-wrap:wrap;' +
        'border-bottom:1px solid rgba(255,255,255,.1)}' +
      '.pv-lbl{font-size:.7rem;color:#888;margin-right:2px;white-space:nowrap}' +
      '.pv-sep{width:1px;height:20px;background:rgba(255,255,255,.2);flex-shrink:0}' +
      '.pv-btn{padding:5px 11px;border:1px solid rgba(255,255,255,.2);border-radius:6px;' +
        'background:rgba(255,255,255,.08);color:#ccc;font-size:.72rem;line-height:1.3;' +
        'cursor:pointer;text-align:center;transition:background .12s,border-color .12s}' +
      '.pv-btn:hover{background:rgba(255,255,255,.18)}' +
      '.pv-btn.active{background:rgba(44,125,160,.55);border-color:#4aa8d0;color:#fff}' +
      '.pv-off{border-color:rgba(230,57,70,.4)!important;color:#ff9090!important}' +
      '.pv-off:hover{background:rgba(230,57,70,.2)!important}' +
      '#pv-stage{flex:1;display:flex;align-items:center;justify-content:center;' +
        'overflow:hidden;padding:16px}' +
      '#pv-frame{position:relative;flex-shrink:0;overflow:hidden;border-radius:44px;' +
        'box-shadow:0 0 0 10px #222,0 0 0 13px #3a3a3a,0 24px 64px rgba(0,0,0,.8);' +
        'transform-origin:center center}' +
      '#pv-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);' +
        'width:120px;height:30px;background:#222;border-radius:0 0 18px 18px;' +
        'z-index:10;pointer-events:none}' +
      '#pv-homebar{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);' +
        'width:110px;height:5px;background:rgba(255,255,255,.28);border-radius:3px;' +
        'z-index:10;pointer-events:none}' +
      '#pv-iframe{display:block;border:none;width:100%;height:100%}';
    document.head.appendChild(style);

    // ── HTML voor de preview-UI ──
    var root = document.createElement('div');
    root.id = 'pv-root';
    root.innerHTML =
      '<div id="pv-toolbar">' +
        '<span class="pv-lbl">Formaat:</span>' +
        '<button class="pv-btn" data-size="small">Klein ' +
          '<small style="opacity:.65">360\u00d7740</small></button>' +
        '<button class="pv-btn" data-size="standard">Standaard ' +
          '<small style="opacity:.65">390\u00d7844</small></button>' +
        '<button class="pv-btn" data-size="large">Groot ' +
          '<small style="opacity:.65">430\u00d7932</small></button>' +
        '<div class="pv-sep"></div>' +
        '<button class="pv-btn" id="pv-rotate">\u21bb Draaien</button>' +
        '<div class="pv-sep"></div>' +
        '<button class="pv-btn" id="pv-fullscreen">\u26f6 Volledig</button>' +
        '<div class="pv-sep"></div>' +
        '<button class="pv-btn pv-off" id="pv-disable">\u2715 Sluit preview</button>' +
      '</div>' +
      '<div id="pv-stage">' +
        '<div id="pv-frame">' +
          '<div id="pv-notch"></div>' +
          '<iframe id="pv-iframe" src="./" scrolling="no"' +
            ' title="The Flush Factor \u2014 telefoonpreview"></iframe>' +
          '<div id="pv-homebar"></div>' +
        '</div>' +
      '</div>';

    document.body.classList.add('pv-active');
    document.body.appendChild(root);

    var frame = document.getElementById('pv-frame');
    var stage = document.getElementById('pv-stage');

    // ── Frame-afmetingen & schaalfactor berekenen ──
    function applySize() {
      var s = SIZES[currentSize] || SIZES.standard;
      var w = s.w, h = s.h;
      if (isLandscape) { var tmp = w; w = h; h = tmp; }

      var scale = Math.min(1,
        (stage.clientWidth  - 16) / w,
        (stage.clientHeight - 16) / h
      );

      frame.style.width     = w + 'px';
      frame.style.height    = h + 'px';
      frame.style.transform = 'scale(' + scale.toFixed(4) + ')';

      // Notch en home-balk alleen in portretstand
      var notch   = document.getElementById('pv-notch');
      var homebar = document.getElementById('pv-homebar');
      if (notch)   notch.style.display   = isLandscape ? 'none' : '';
      if (homebar) homebar.style.display = isLandscape ? 'none' : '';

      // Actieve formaatknop markeren
      document.querySelectorAll('[data-size]').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.size === currentSize);
      });
    }

    applySize();

    // Herbereken schaal bij venstergrootte-wijziging
    var resizeRaf;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(applySize);
    });

    // ── Formaatknoppen ──
    document.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentSize = btn.dataset.size;
        try { localStorage.setItem('flushfactor_preview_size', currentSize); } catch (e) {}
        applySize();
      });
    });

    // ── Draaien (portret ↔ liggend) ──
    document.getElementById('pv-rotate').addEventListener('click', function () {
      isLandscape = !isLandscape;
      try { localStorage.setItem('flushfactor_preview_landscape', String(isLandscape)); } catch (e) {}
      applySize();
    });

    // ── Volledig scherm aan/uit ──
    var fsBtn = document.getElementById('pv-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
      document.addEventListener('fullscreenchange', function () {
        if (document.fullscreenElement) {
          fsBtn.textContent = '\u2715 Sluit volledig scherm';
          fsBtn.classList.add('active');
        } else {
          fsBtn.textContent = '\u26f6 Volledig';
          fsBtn.classList.remove('active');
        }
        // Herbereken na fullscreen-overgang
        setTimeout(applySize, 150);
      });
    }

    // ── Preview uitschakelen → spel volledig scherm ──
    document.getElementById('pv-disable').addEventListener('click', function () {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().then(function () {
          try { localStorage.setItem('flushfactor_preview_mode', 'off'); } catch (e) {}
          location.href = location.pathname;
        });
      } else {
        try { localStorage.setItem('flushfactor_preview_mode', 'off'); } catch (e) {}
        location.href = location.pathname;
      }
    });

  }); // einde DOMContentLoaded

})(); // einde IIFE
