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
  levelUpBanner(level, name) { this.banner('levelup-banner', `${icon('sparkles', 20)} ${T.levelUp(level, name)}`, 2500); },
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

  // Gereedschap: knoppen één keer bouwen, daarna alleen bijwerken.
  buildInventory(tools, onUse) {
    const bar = $('inventory-bar');
    bar.textContent = '';
    for (const tool of tools) {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.dataset.id = tool.id;
      btn.setAttribute('aria-label', tool.name);
      btn.title = tool.name;
      btn.innerHTML = `
        <svg class="cd-ring" viewBox="0 0 60 60" aria-hidden="true"><circle class="cd-track" cx="30" cy="30" r="24"/><circle class="cd-fill" cx="30" cy="30" r="24"/></svg>
        ${icon(tool.icon, 26, 'tool-icon')}
        <span class="cd-secs"></span><span class="tool-badge" hidden></span>`;
      btn.addEventListener('click', () => onUse(tool.id));
      bar.appendChild(btn);
    }
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
      const badge = btn.querySelector('.tool-badge');
      if (tool.discovered && badge.dataset.kind !== tool.discovered) {
        badge.dataset.kind = tool.discovered;
        badge.hidden = false;
        badge.innerHTML = icon(tool.discovered === 'working' ? 'check' : 'zap', 11);
      }
    }
  },

  // Camerastanden-menu (punt 53)
  buildCameraMenu(onPick) {
    const menu = $('camera-menu');
    menu.textContent = '';
    for (const [id, v] of Object.entries(CAMERA_VIEWS)) {
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
