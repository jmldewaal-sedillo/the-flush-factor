// Alles wat over de 3D-scène zweeft: score, gereedschap, waterbalk, meldingen, menu's.
// Alleen DOM; krijgt gegevens aangereikt van game.js.
import { t, num, itemName, itemShort, LANGUAGES } from '../i18n/index.js';
import { CAMERA_VIEWS } from '../data/room.js';
import { CREDITS, STUDIO } from '../data/credits.js';
import { icon } from './icons.js';
import { storage } from '../storage.js';
import { VOLUME_STEP, SOUND_GROUPS } from '../data/sounds.js';

const $ = id => document.getElementById(id);
const RING = 2 * Math.PI * 24;

export const fmtNum = n => (n >= 10000 ? `${num(n / 1000, { maximumFractionDigits: 1 })}k` : num(n));

// Uitklapmenu's die dichtgaan bij een tik ernaast (punt 93): { isOpen(), close(), contains(target) }
const menus = [];

function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export const hud = {
  score(score, highScore) {
    $('score-value').textContent = fmtNum(score);
    $('high-score').textContent = t('best', { n: fmtNum(highScore) });
    $('shop-score').innerHTML = `${icon('coins', 16)} ${fmtNum(score)}`;
  },
  streak(streak, best) {
    $('streak-count').innerHTML = `${icon('toilet', 12)} ×${streak}`;
    $('streak-best').innerHTML = `${icon('trophy', 12)} ${best}`;
  },
  level(n) { $('level-display').textContent = t('level', { n }); },
  profile(profile) {
    $('profile-avatar').innerHTML = profile ? icon(profile.avatar, 22) : '';
    $('score-bubble').setAttribute('aria-label', profile ? t('a.profileOf', { name: profile.name || t('profile.guest') }) : t('a.profile'));
  },

  message(text) {
    $('status-msg').textContent = text;
    replay($('status-msg'), 'visible');
  },
  combo(x) {
    const el = $('combo-display');
    el.innerHTML = x ? `${icon('flame', 16)} ${t('combo', { x: num(x, { minimumFractionDigits: 1 }) })}` : '';
    if (x) replay(el, 'combo-pop');
  },
  pointPopup(pts) {
    const el = document.createElement('div');
    el.className = 'point-popup';
    el.textContent = `+${pts}`;
    el.style.left = `${40 + Math.random() * 20}%`;
    el.style.top = `${34 + Math.random() * 14}%`;
    $('fx-layer').appendChild(el);
    setTimeout(() => el.remove(), 900);
  },
  clogWarning(on) { $('clog-warning').classList.toggle('visible', on); },
  banner(id, html, ms) {
    const el = $(id);
    el.innerHTML = html;
    replay(el, 'visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), ms);
  },
  unclogBanner(text) { this.banner('unclog-banner', `${icon('circle-check', 26)} ${text}`, 1800); },
  levelUpBanner(level, name, newCount = 0) {
    const extra = newCount ? `<small>${icon('gift', 14)} ${t('levelUpNew', { n: newCount })}</small>` : '';
    this.banner('levelup-banner', `<span>${icon('sparkles', 20)} ${t('levelUp', { n: level, name: name.toLocaleUpperCase() })}</span>${extra}`, 3000);
  },
  shopBadge(n) { $('shop-badge').hidden = n <= 0; $('shop-badge').textContent = n > 0 ? String(n) : ''; },
  // Vies kost punten: toon hoeveel (punt 83).
  dirt(count, factor) {
    const pill = $('dirt-pill');
    pill.hidden = factor >= 1;
    pill.innerHTML = factor < 1 ? `${icon('stain', 13)}${t('care.penalty', { pct: Math.round((1 - factor) * 100) })}` : '';
  },
  // Knop voor de schoonmaakspullen, linksonder (punten 83, 91 en 92). Altijd in beeld: je ziet er je voorraad
  // op (hoe vaak je nog kunt vegen). De la toont per middel wat er nog over is.
  // owned: [{ id, icon, uses, left }], active: gekozen middel of null.
  cleaning(owned, active) {
    const wrap = $('hud-clean'), tray = $('clean-tray'), btn = $('btn-clean');
    const total = owned.reduce((sum, c) => sum + c.left, 0);
    const current = owned.find(c => c.id === active) || null;
    wrap.dataset.owned = String(owned.length);
    wrap.dataset.stock = String(total);
    if (current) document.body.dataset.cleaning = current.id; else delete document.body.dataset.cleaning;
    $('clean-icon').innerHTML = icon(current ? current.icon : 'care', 26);
    $('clean-count').textContent = String(current ? current.left : total);
    btn.setAttribute('aria-pressed', String(!!current));
    btn.setAttribute('aria-label', total > 0 ? t('care.stock', { n: total }) : t('care.stockEmpty'));
    tray.innerHTML = owned.map(c => {
      const name = itemName(c);
      return `<button class="round-btn clean-option" data-cleaner="${c.id}" data-left="${c.left}" aria-label="${t('care.option', { name, left: c.left, total: c.uses })}" aria-pressed="${c.id === active}" title="${name}">
        ${icon(c.icon, 26)}<span class="uses">${t('care.uses', { left: c.left, total: c.uses })}</span></button>`;
    }).join('')
      // klein knopje naar de winkel, meteen op de juiste categorie (punt 97)
      + `<button class="round-btn small shop-btn" id="btn-clean-shop" aria-label="${t('care.buy')}" title="${t('care.buy')}">${icon('shopping-cart', 20)}</button>`;
    if (!owned.length) this.closeCleanTray();
  },
  closeCleanTray() { $('clean-tray').hidden = true; $('btn-clean').setAttribute('aria-expanded', 'false'); },
  // onPick(id): een middel gekozen in de la. onEmpty(): de voorraad is leeg (de knop leidt dan naar de winkel).
  // onShop(): het winkelwagentje in de la.
  bindCleaning(onPick, onEmpty, onShop) {
    const tray = $('clean-tray'), btn = $('btn-clean');
    btn.addEventListener('click', () => {
      if ($('hud-clean').dataset.owned === '0') return onEmpty();
      tray.hidden = !tray.hidden;
      btn.setAttribute('aria-expanded', String(!tray.hidden));
    });
    tray.addEventListener('click', e => {
      if (e.target.closest('#btn-clean-shop')) { this.closeCleanTray(); return onShop(); }
      const opt = e.target.closest('[data-cleaner]');
      if (!opt) return;
      this.closeCleanTray();
      onPick(opt.dataset.cleaner);
    });
    menus.push({ isOpen: () => !tray.hidden, close: () => this.closeCleanTray(), contains: el => tray.contains(el) || btn.contains(el) });
  },
  sparkle() {
    const layer = $('fx-layer');
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle';
      el.innerHTML = icon('sparkles', 22 + Math.floor(Math.random() * 22));
      el.style.cssText = `left:${30 + Math.random() * 40}%;top:${30 + Math.random() * 30}%;animation-delay:${Math.random() * 0.25}s`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }
  },
  overflowShake() { replay($('game-screen'), 'overflow-shake'); },

  water(pct, phase, clogged) {
    const fill = $('water-bar-fill');
    fill.style.height = `${pct}%`;
    fill.style.background = phase.color;
    fill.dataset.phase = phase.id;
    document.body.classList.toggle('is-clogged', clogged);
  },

  bucket(usedLiters, capacity, iconName) {
    $('bucket-liters').textContent = t('liters', { used: num(usedLiters, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), cap: capacity });
    $('btn-bucket').classList.toggle('full', usedLiters >= capacity);
    $('btn-bucket').innerHTML = icon(iconName, 26);
    $('btn-bucket-empty').hidden = usedLiters <= 0;
  },

  // Gereedschap (punt 82): één kolom die scrollt. Knoppen één keer bouwen, daarna alleen bijwerken.
  // Lang indrukken toont de naam; dat telt niet als gebruiken.
  buildInventory(tools, onUse) {
    const bar = $('inventory-bar'), tip = $('tool-tip');
    bar.textContent = '';
    for (const tool of tools) {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.dataset.id = tool.id;
      btn.dataset.kind = tool.discovered || 'unknown';
      btn.setAttribute('aria-label', itemName(tool));
      btn.innerHTML = `
        <svg class="cd-ring" viewBox="0 0 60 60" aria-hidden="true"><circle class="cd-track" cx="30" cy="30" r="24"/><circle class="cd-fill" cx="30" cy="30" r="24"/></svg>
        ${icon(tool.icon, 28, 'tool-icon')}
        <span class="cd-secs"></span><span class="tool-badge"></span>`;
      let timer = 0, held = false;
      const hide = () => { clearTimeout(timer); tip.hidden = true; };
      btn.addEventListener('pointerdown', () => {
        held = false;
        timer = setTimeout(() => {
          held = true;
          const r = btn.getBoundingClientRect();
          tip.textContent = itemShort(tool);
          tip.style.left = `${r.right + 10}px`;
          tip.style.top = `${r.top + r.height / 2}px`;
          tip.hidden = false;
        }, 420);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => { clearTimeout(timer); if (held) setTimeout(hide, 900); });
      btn.addEventListener('click', () => { if (held) { held = false; return; } onUse(tool.id); });
      btn.addEventListener('contextmenu', e => e.preventDefault());
      bar.appendChild(btn);
    }
    this._fadeEdges();
  },
  updateInventory(tools, clogged) {
    for (const tool of tools) {
      const btn = document.querySelector(`.tool-btn[data-id="${tool.id}"]`);
      if (!btn) continue;
      const pct = tool.cooldownRemaining / tool.cooldown;
      btn.querySelector('.cd-fill').style.strokeDashoffset = RING * (1 - pct);
      btn.querySelector('.cd-secs').textContent = pct > 0 ? `${Math.ceil(tool.cooldownRemaining / 1000)}s` : '';
      btn.classList.toggle('on-cooldown', pct > 0);
      btn.classList.toggle('usable', clogged && pct === 0);
      const kind = tool.discovered || 'unknown';
      const badge = btn.querySelector('.tool-badge');
      if (badge.dataset.kind !== kind) {
        badge.dataset.kind = kind;
        btn.dataset.kind = kind;
        badge.innerHTML = kind === 'unknown' ? '?' : icon(kind === 'working' ? 'check' : 'zap', 12);
      }
    }
  },
  // In- en uitklappen van het gereedschap, zodat de scène vrij is. De keuze wordt onthouden.
  bindTools() {
    const btn = $('btn-tools-toggle'), bar = $('inventory-bar');
    const set = open => {
      document.body.dataset.tools = open ? 'open' : 'closed';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? t('a.toolsHide') : t('a.toolsShow'));
      storage.writeSetting('toolsOpen', open);
      this._fadeEdges();
    };
    set(storage.readSetting('toolsOpen') !== false);
    this.toolsLabel = () => btn.setAttribute('aria-label', document.body.dataset.tools === 'open' ? t('a.toolsHide') : t('a.toolsShow'));
    btn.addEventListener('click', () => set(document.body.dataset.tools !== 'open'));
    bar.addEventListener('scroll', () => { this._fadeEdges(); $('tool-tip').hidden = true; }, { passive: true });
    new ResizeObserver(() => this._fadeEdges()).observe(bar);
  },
  // Zachte vervaging boven/onder alleen waar er nog meer te scrollen valt.
  _fadeEdges() {
    const bar = $('inventory-bar');
    bar.dataset.fadeTop = String(bar.scrollTop > 4);
    bar.dataset.fadeBottom = String(bar.scrollTop + bar.clientHeight < bar.scrollHeight - 4);
  },

  // Camerastanden-menu (punt 53)
  buildCameraMenu(onPick) {
    const menu = $('camera-menu');
    menu.textContent = '';
    for (const [id, v] of Object.entries(CAMERA_VIEWS)) {
      if (v.menu === false) continue;
      const b = document.createElement('button');
      b.className = 'menu-item';
      b.dataset.view = id;
      b.setAttribute('role', 'menuitemradio');
      b.innerHTML = `${icon(v.icon, 18, v.flipIcon ? 'flip' : '')}<span>${t(`view.${id}`)}</span>`;
      b.addEventListener('click', () => onPick(id));
      menu.appendChild(b);
    }
  },
  view(id) {
    document.body.dataset.view = id;
    document.body.toggleAttribute('data-zoom', !!CAMERA_VIEWS[id].zoom);
    document.querySelectorAll('#camera-menu .menu-item').forEach(b => b.setAttribute('aria-checked', String(b.dataset.view === id)));
  },

  // Uitklapmenu's: openen/sluiten met de knop. Sluiten bij een tik ernaast regelt bindDismiss().
  bindPopover(buttonId, menuId) {
    const btn = $(buttonId), menu = $(menuId);
    const set = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => set(menu.hidden));
    menus.push({ isOpen: () => !menu.hidden, close: () => set(false), contains: el => menu.contains(el) || btn.contains(el) });
    return { close: () => set(false) };
  },
  // Tik naast een open menu: het menu gaat dicht en die tik doet verder niets (punt 93) — niet inzoomen,
  // niet spoelen, geen andere knop. Alleen de knop van een ander menu werkt meteen door, zodat je in één
  // tik van het ene menu naar het andere kunt.
  bindDismiss() {
    let swallow = false, timer = 0;
    const stop = e => { e.stopPropagation(); e.preventDefault(); };
    document.addEventListener('pointerdown', e => {
      clearTimeout(timer);
      swallow = false;
      const outside = menus.filter(m => m.isOpen() && !m.contains(e.target));
      if (!outside.length) return;
      outside.forEach(m => m.close());
      if (menus.some(m => m.contains(e.target))) return;      // de knop van een ander menu
      swallow = true;
      stop(e);
    }, true);
    for (const type of ['pointermove', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click']) {
      document.addEventListener(type, e => {
        if (!swallow) return;
        stop(e);
        // de klik komt direct na het loslaten; daarna is het gebaar voorbij
        if (type === 'click') swallow = false;
        else if (type === 'pointerup' || type === 'pointercancel') timer = setTimeout(() => { swallow = false; }, 400);
      }, { capture: true, passive: false });
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') menus.forEach(m => m.isOpen() && m.close()); });
  },
  menuOpen: () => menus.some(m => m.isOpen()),

  // Geluidsinstellingen (punt 106): per groep een aan/uit-knop en een schuif, plus "Alle geluid uit".
  // onChange({ muted }) · onChange({ group, on }) · onChange({ group, volume }) met het volume van 0 tot 1.
  bindSound(settings, onChange) {
    const dialog = $('sound-dialog'), list = $('sound-groups');
    list.innerHTML = SOUND_GROUPS.map(g => `
      <div class="sound-row" data-group="${g.id}">
        <button type="button" class="round-btn small sound-toggle" aria-pressed="true">${icon(g.icon, 20)}</button>
        <label><span class="sound-name"></span><input type="range" min="0" max="100" step="${Math.round(VOLUME_STEP * 100)}"></label>
      </div>`).join('');
    list.addEventListener('click', e => {
      const btn = e.target.closest('.sound-toggle');
      if (btn) onChange({ group: btn.closest('.sound-row').dataset.group, on: btn.getAttribute('aria-pressed') !== 'true' });
    });
    list.addEventListener('input', e => {
      if (e.target.matches('input[type="range"]')) onChange({ group: e.target.closest('.sound-row').dataset.group, volume: Number(e.target.value) / 100 });
    });
    $('btn-mute-all').addEventListener('click', () => onChange({ muted: $('btn-mute-all').getAttribute('aria-pressed') !== 'true' }));
    $('btn-sound-close').addEventListener('click', () => this.closeSound());
    dialog.addEventListener('click', e => { if (e.target === dialog) this.closeSound(); });
    this.sound(settings);
  },
  openSound() { $('sound-dialog').hidden = false; $('btn-sound-close').focus(); },
  closeSound() { $('sound-dialog').hidden = true; },
  soundOpen: () => !$('sound-dialog').hidden,
  // Toont de stand: { muted, groups: { <groep>: { on, volume } } }. Ook na een taalwissel.
  sound({ muted, groups }) {
    $('btn-mute-all').setAttribute('aria-pressed', String(muted));
    $('sound-dialog').dataset.muted = String(muted);
    $('btn-sound').querySelector('use').setAttribute('href', `assets/icons/sprite.svg#${muted ? 'volume-x' : 'volume-2'}`);
    $('btn-sound').dataset.muted = String(muted);
    $('sound-state').textContent = t(muted ? 'menu.soundOff' : 'menu.soundOn');
    for (const row of document.querySelectorAll('#sound-groups .sound-row')) {
      const g = groups[row.dataset.group], name = t(`sound.group.${row.dataset.group}`), pct = Math.round(g.volume * 100);
      const btn = row.querySelector('.sound-toggle'), range = row.querySelector('input');
      row.querySelector('.sound-name').textContent = name;
      row.dataset.on = String(g.on && !muted);
      btn.setAttribute('aria-pressed', String(g.on));
      btn.setAttribute('aria-label', t(g.on ? 'sound.turnOff' : 'sound.turnOn', { name }));
      btn.disabled = muted;
      range.value = String(pct);
      range.disabled = muted || !g.on;
      range.setAttribute('aria-label', t('sound.volumeOf', { name }));
      range.setAttribute('aria-valuetext', `${pct}%`);
    }
  },

  // Taalkeuze in het menu (punt 94): keuzelijst met elke taal in die taal zelf, zoals in Sudoku Kids.
  buildLanguages(current, onPick) {
    const select = $('setting-language');
    select.innerHTML = LANGUAGES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('');
    select.value = current;
    select.addEventListener('change', e => onPick(e.target.value));
  },

  buildCredits() {
    $('credits-list').innerHTML = `
      <p class="credits-made">${t('credits.madeBy')}</p>
      <p class="credits-contact">${t('credits.contact')}: <a href="mailto:${STUDIO.email}">${STUDIO.email}</a></p>` + CREDITS.map(g => `
      <h3>${t(`credits.${g.group}`)}</h3>
      <ul>${g.items.map(i => `<li><strong>${i.titleKey ? t(`credits.${i.titleKey}`, { n: i.count }) : i.title}</strong> — ${i.author}, ${i.license}<br><a href="${i.url}" target="_blank" rel="noopener">${i.url.replace('https://', '')}</a></li>`).join('')}</ul>
      ${g.note ? `<p class="credits-note">${t(`credits.${g.note}`)}</p>` : ''}`).join('');
  },

  loading(done) { $('loading').hidden = done; },
  fatal(title, body) {
    $('loading').hidden = true;
    $('fatal-title').textContent = title;
    $('fatal-body').textContent = body;
    $('fatal').hidden = false;
    document.body.dataset.screen = 'fatal';
  },
};
