// Alles wat over de 3D-scène zweeft: score, gereedschap, waterbalk, meldingen, menu's.
// Alleen DOM; krijgt gegevens aangereikt van game.js.
import { T } from '../data/texts.js';
import { CAMERA_VIEWS } from '../data/room.js';
import { CREDITS } from '../data/credits.js';
import { icon } from './icons.js';

const $ = id => document.getElementById(id);
const RING = 2 * Math.PI * 24;

export const fmtNum = n => (n >= 10000 ? `${(n / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}k` : n.toLocaleString('nl-NL'));

function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export const hud = {
  score(score, highScore) {
    $('score-value').textContent = fmtNum(score);
    $('high-score').textContent = T.best(fmtNum(highScore));
    $('shop-score').innerHTML = `${icon('coins', 16)} ${fmtNum(score)}`;
  },
  streak(streak, best) {
    $('streak-count').innerHTML = `${icon('toilet', 12)} ×${streak}`;
    $('streak-best').innerHTML = `${icon('trophy', 12)} ${best}`;
  },
  level(n) { $('level-display').textContent = T.level(n); },
  profile(profile) {
    $('profile-avatar').innerHTML = profile ? icon(profile.avatar, 22) : '';
    $('score-bubble').setAttribute('aria-label', profile ? `Profiel van ${profile.name}` : 'Profiel en statistieken');
  },

  message(text) {
    $('status-msg').textContent = text;
    replay($('status-msg'), 'visible');
  },
  combo(x) {
    const el = $('combo-display');
    el.innerHTML = x ? `${icon('flame', 16)} ${T.combo(x.toLocaleString('nl-NL', { minimumFractionDigits: 1 }))}` : '';
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
    const extra = newCount ? `<small>${icon('gift', 14)} ${T.levelUpNew(newCount)}</small>` : '';
    this.banner('levelup-banner', `<span>${icon('sparkles', 20)} ${T.levelUp(level, name)}</span>${extra}`, 3000);
  },
  shopBadge(n) { $('shop-badge').hidden = n <= 0; $('shop-badge').textContent = n > 0 ? String(n) : ''; },
  // Vies kost punten: toon hoeveel (punt 83).
  dirt(count, factor) {
    const pill = $('dirt-pill');
    pill.hidden = factor >= 1;
    pill.innerHTML = factor < 1 ? `${icon('stain', 13)}${T.care.penalty(Math.round((1 - factor) * 100))}` : '';
  },
  // Schoonmaakknop linksonder met een la vol schoonmaakspullen.
  cleaning(owned, active, dirtCount) {
    const wrap = $('hud-clean'), tray = $('clean-tray'), btn = $('btn-clean');
    wrap.hidden = dirtCount <= 0;
    $('clean-count').textContent = dirtCount > 0 ? String(dirtCount) : '';
    wrap.dataset.owned = String(owned.length);
    if (active) document.body.dataset.cleaning = active; else delete document.body.dataset.cleaning;
    btn.setAttribute('aria-pressed', String(!!active));
    btn.setAttribute('aria-label', active ? T.care.stop : 'Schoonmaken');
    tray.innerHTML = owned.map(c => `<button class="round-btn clean-option" data-cleaner="${c.id}" aria-label="${c.name}" aria-pressed="${c.id === active}" title="${c.name}">${icon(c.icon, 26)}</button>`).join('');
    if (dirtCount <= 0 || !owned.length) { tray.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  },
  bindCleaning(onPick) {
    const tray = $('clean-tray'), btn = $('btn-clean');
    btn.addEventListener('click', () => {
      if ($('hud-clean').dataset.owned === '0') return this.message(T.care.noCleaners);
      if (document.body.dataset.cleaning) { onPick(null); tray.hidden = true; }
      else tray.hidden = !tray.hidden;
      btn.setAttribute('aria-expanded', String(!tray.hidden));
    });
    tray.addEventListener('click', e => {
      const opt = e.target.closest('[data-cleaner]');
      if (opt) onPick(opt.dataset.cleaner);
    });
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
    $('bucket-liters').textContent = T.liters(usedLiters, capacity);
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
      btn.setAttribute('aria-label', tool.name);
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
          tip.textContent = tool.short || tool.name;
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
    const KEY = 'flushfactor_tools_open';
    const btn = $('btn-tools-toggle'), bar = $('inventory-bar');
    const set = open => {
      document.body.dataset.tools = open ? 'open' : 'closed';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Gereedschap verbergen' : 'Gereedschap tonen');
      try { localStorage.setItem(KEY, open ? '1' : '0'); } catch { /* geen opslag */ }
      this._fadeEdges();
    };
    let open = true;
    try { open = localStorage.getItem(KEY) !== '0'; } catch { /* geen opslag */ }
    set(open);
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
      b.innerHTML = `${icon(v.icon, 18, v.flipIcon ? 'flip' : '')}<span>${v.label}</span>`;
      b.addEventListener('click', () => onPick(id));
      menu.appendChild(b);
    }
  },
  view(id) {
    document.body.dataset.view = id;
    document.body.toggleAttribute('data-zoom', !!CAMERA_VIEWS[id].zoom);
    document.querySelectorAll('#camera-menu .menu-item').forEach(b => b.setAttribute('aria-checked', String(b.dataset.view === id)));
  },

  // Uitklapmenu's: openen/sluiten, sluiten bij tik erbuiten.
  bindPopover(buttonId, menuId) {
    const btn = $(buttonId), menu = $(menuId);
    const set = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', e => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false); });
    return { close: () => set(false) };
  },

  buildCredits() {
    $('credits-list').innerHTML = CREDITS.map(g => `
      <h3>${g.group}</h3>
      <ul>${g.items.map(i => `<li><strong>${i.title}</strong> — ${i.author}, ${i.license}<br><a href="${i.url}" target="_blank" rel="noopener">${i.url.replace('https://', '')}</a></li>`).join('')}</ul>
      ${g.note ? `<p class="credits-note">${g.note}</p>` : ''}`).join('');
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
