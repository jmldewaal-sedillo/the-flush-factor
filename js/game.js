// ============================================================
// THE FLUSH FACTOR — game.js
// Hoofdcoördinator: game loop, spoelen, UI, opslaan.
// ============================================================

import { MESSAGES, CLOG_PROPS, LEVEL_CONFIG } from './items.js';
import { ClogSystem } from './clog.js';
import { InventorySystem } from './inventory.js';
import { ShopSystem } from './shop.js';

// ──────── STATE ────────
const state = {
  score: 0,
  highScore: 0,
  combo: 1,
  lastFlushTime: 0,
  isFlushing: false,
  streak: 0,        // Spoelbeurten zonder verstopping
  bestStreak: 0,    // Langste reeks ooit
  level: 1,         // Huidig level
  trashLevel: 0,    // Aantal items in prullenbak (max 5)
  trashItems: [],   // Emoji's van weggehaalde props
  currentProp: null,// Transient: huidige verstoppingsprop
  activeCosmetics: {
    toilet: 'toilet-standard',
    tiles: 'tiles-default',
    floor: 'floor-basic',
    decoration: 'deco-none',
  },
  purchasedItems: new Set(),
  ownedTools: null,       // null = gebruik startgereedschappen
  toolDiscovery: {},
  stats: {
    totalFlushes: 0,
    totalClogs: 0,
    totalOverflows: 0,
  },
};

// ──────── SYSTEMEN ────────
const clog = new ClogSystem();
let inv, shop;

// ──────── DOM-SHORTCUTS ────────
const $ = id => document.getElementById(id);

// ──────── INIT ────────
function init() {
  loadState();

  // Pas clog-moeilijkheid aan op geladen level
  const levelCfg = LEVEL_CONFIG.find(c => c.level === state.level) || LEVEL_CONFIG[0];
  clog.setLevel(state.level, levelCfg);

  inv  = new InventorySystem(state, clog);
  shop = new ShopSystem(state, inv);

  shop.onPurchase(() => { saveState(); updateScoreUI(); });

  setupEvents();
  setupClogEvents();
  applyAllCosmetics();
  renderInventory();

  // Winkelknoppen
  $('btn-shop').addEventListener('click', () => shop.open());
  $('btn-shop-close').addEventListener('click', () => { shop.close(); saveState(); });
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      shop.render();
    });
  });

  // Prullenbak
  const trashBin = $('trash-bin');
  if (trashBin) trashBin.addEventListener('click', emptyTrash);

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  updateLevelUI();
  updateTrashUI();

  requestAnimationFrame(gameLoop);
}

// ──────── GAME LOOP ────────
let lastTs = 0;
function gameLoop(ts) {
  const dt = Math.min(ts - lastTs, 100); // max 100ms stap
  lastTs = ts;

  clog.update(dt);
  inv.update(dt);
  updateWaterUI();
  updateInventoryUI();

  requestAnimationFrame(gameLoop);
}

// ──────── SPOELEN ────────
function flush() {
  if (state.isFlushing) return;

  if (clog.isClogged) {
    showMsg(rnd(MESSAGES.alreadyClogged));
    shakeToilet();
    return;
  }

  state.isFlushing = true;
  state.stats.totalFlushes++;

  // Combo berekening
  const now = Date.now();
  if (now - state.lastFlushTime < 1800) {
    state.combo = Math.min(state.combo + 0.5, 8);
  } else {
    state.combo = Math.max(1, state.combo - 0.5);
  }
  state.lastFlushTime = now;

  const pts = Math.round(10 * state.combo);
  addScore(pts);
  spawnPointPopup(pts);
  showMsg(rnd(MESSAGES.flushSuccess));
  animateFlush();

  // Streak bijhouden
  state.streak++;
  if (state.streak > state.bestStreak) state.bestStreak = state.streak;
  updateStreakUI();

  if (state.combo >= 4) showComboMsg();

  setTimeout(() => { state.isFlushing = false; }, 700);
  saveState();
}

// ──────── STREAK UI ────────
function updateStreakUI() {
  const sc = $('streak-count');
  if (sc) sc.textContent = `🚽 ×${state.streak}`;
  const sb = $('streak-best');
  if (sb) sb.textContent = `🏆 ${state.bestStreak}`;
}

// ──────── LEVEL SYSTEEM ────────
function checkLevelUp() {
  const newLevel = LEVEL_CONFIG.reduce((lv, cfg) =>
    state.score >= cfg.minScore ? cfg.level : lv, 1);
  if (newLevel > state.level) {
    state.level = newLevel;
    const cfg = LEVEL_CONFIG.find(c => c.level === newLevel);
    clog.setLevel(newLevel, cfg);
    updateLevelUI();
    showLevelUpBanner(cfg);
    saveState();
  }
}

function updateLevelUI() {
  const el = $('level-display');
  if (el) el.textContent = `Lv.${state.level}`;
}

function showLevelUpBanner(cfg) {
  const el = $('levelup-banner');
  if (!el || !cfg) return;
  el.textContent = `🎉 LEVEL ${cfg.level}: ${cfg.name.toUpperCase()}!`;
  el.classList.remove('visible');
  void el.offsetWidth;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2500);
}

// ──────── SCORE ────────
function addScore(pts) {
  state.score += pts;
  if (state.score > state.highScore) state.highScore = state.score;
  checkLevelUp();
  updateScoreUI();
}

function updateScoreUI() {
  const el = $('score-value');
  if (el) el.textContent = fmtNum(state.score);
  const hi = $('high-score');
  if (hi) hi.textContent = `Beste: ${fmtNum(state.highScore)}`;
  const shopScore = $('shop-score');
  if (shopScore) shopScore.textContent = `💰 ${fmtNum(state.score)}`;
}

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

// ──────── POPUP +PUNTEN ────────
function spawnPointPopup(pts) {
  const scene = $('bathroom-scene');
  if (!scene) return;
  const el = document.createElement('div');
  el.className = 'point-popup';
  el.textContent = `+${pts}`;
  el.style.left = `${40 + Math.random() * 20}%`;
  el.style.top  = `${30 + Math.random() * 20}%`;
  scene.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ──────── BERICHTEN ────────
function showMsg(text) {
  const el = $('status-msg');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('visible');
  void el.offsetWidth; // herstart animatie
  el.classList.add('visible');
}

function showComboMsg() {
  const comboEl = $('combo-display');
  if (!comboEl) return;
  comboEl.textContent = `🔥 x${state.combo.toFixed(1)} COMBO!`;
  comboEl.classList.add('combo-pop');
  setTimeout(() => comboEl.classList.remove('combo-pop'), 400);
}

// ──────── ANIMATIES ────────
function animateFlush() {
  const wrapper = $('toilet-wrapper');
  if (!wrapper) return;
  wrapper.classList.add('flushing');
  setTimeout(() => wrapper.classList.remove('flushing'), 700);

  const water = $('bowl-water');
  if (water) {
    water.classList.add('flushing-water');
    setTimeout(() => water.classList.remove('flushing-water'), 700);
  }
}

function shakeToilet() {
  const w = $('toilet-wrapper');
  if (!w) return;
  w.classList.add('toilet-shake');
  setTimeout(() => w.classList.remove('toilet-shake'), 400);

  const water = $('bowl-water');
  if (water) {
    water.classList.remove('clog-water');
    void water.offsetWidth;
    water.classList.add('clog-water');
    setTimeout(() => water.classList.remove('clog-water'), 800);
  }
}

// ──────── WATERSTAND UI ────────
function updateWaterUI() {
  const bar = $('water-bar-fill');
  const pct = clog.waterLevel;
  if (bar) {
    bar.style.height = `${pct}%`;
    bar.className = 'water-bar-fill ' + (
      pct > 80 ? 'water-danger' : pct > 50 ? 'water-warning' : 'water-ok'
    );
  }

  const bowl = $('bowl-water');
  if (bowl) {
    if (clog.isClogged) {
      const t = Math.min(1, pct / 80);
      bowl.style.fill = interpolateColor('#5BC8F5', '#8B6914', t);
      const rise = pct * 0.12;
      bowl.setAttribute('ry', Math.max(20, 30 - rise));
    } else {
      bowl.style.fill = '';
      bowl.setAttribute('ry', '29');
    }
  }

  const scene = $('bathroom-scene');
  if (scene) {
    scene.classList.toggle('clogged-state', clog.isClogged);
    scene.classList.toggle('overflow-state', clog.isOverflowing);
  }
}

function interpolateColor(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1,3),16), g1 = parseInt(hex1.slice(3,5),16), b1 = parseInt(hex1.slice(5,7),16);
  const r2 = parseInt(hex2.slice(1,3),16), g2 = parseInt(hex2.slice(3,5),16), b2 = parseInt(hex2.slice(5,7),16);
  const r = Math.round(r1 + (r2-r1)*t);
  const g = Math.round(g1 + (g2-g1)*t);
  const b = Math.round(b1 + (b2-b1)*t);
  return `rgb(${r},${g},${b})`;
}

// ──────── CLOG PROP (zichtbare verstopping) ────────
function showClogProp(prop) {
  const el = $('clog-prop');
  if (!el || !prop) return;
  el.textContent = prop.emoji;
  el.classList.remove('bobbing', 'dropping', 'chaos-shake');
  el.style.transition = '';
  el.style.transform  = '';
  el.style.opacity    = '';
  el.classList.add('visible', 'dropping');
  setTimeout(() => {
    el.classList.remove('dropping');
    el.classList.add('bobbing');
  }, 500);
}

function hideClogProp() {
  const el = $('clog-prop');
  if (!el) return;
  el.classList.remove('visible', 'bobbing', 'dropping', 'chaos-shake');
  el.style.transition = '';
  el.style.transform  = '';
  el.style.opacity    = '';
}

function animatePropFlyToBin(prop) {
  const propEl = $('clog-prop');
  const binEl  = $('trash-bin');
  if (!propEl || !binEl || !propEl.classList.contains('visible')) return;

  propEl.classList.remove('bobbing', 'dropping', 'chaos-shake');

  const propRect = propEl.getBoundingClientRect();
  const binRect  = binEl.getBoundingClientRect();
  const dx = binRect.left + binRect.width  / 2 - (propRect.left + propRect.width  / 2);
  const dy = binRect.top  + binRect.height / 2 - (propRect.top  + propRect.height / 2);

  propEl.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s 0.18s';
  propEl.style.transform  = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.28)`;
  propEl.style.opacity    = '0';

  setTimeout(hideClogProp, 650);
}

function chaosPropEffect() {
  const el = $('clog-prop');
  if (!el || !el.classList.contains('visible')) return;
  el.classList.remove('bobbing');
  el.classList.add('chaos-shake');
  setTimeout(() => {
    el.classList.remove('chaos-shake');
    el.classList.add('bobbing');
  }, 550);
}

// ──────── CLOG WARNING ────────
function showClogWarning(visible) {
  const el = $('clog-warning');
  if (!el) return;
  el.classList.toggle('visible', visible);
}

// ──────── ONTSTOPPINGS-CELEBRATIE ────────
function showUnclogCelebration() {
  const el = $('unclog-banner');
  if (!el) return;
  el.textContent = rnd(MESSAGES.unclogSuccess) + ' 🎉';
  el.classList.remove('visible');
  void el.offsetWidth;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 1800);
}

// ──────── PRULLENBAK ────────
function addToTrash(prop) {
  if (!prop) return;
  if (state.trashLevel >= 5) {
    // Bak zit vol → straf
    const penalty = 30;
    state.score = Math.max(0, state.score - penalty);
    showMsg(`🗑️ Prullenbak vol! -${penalty}pts`);
    updateScoreUI();
    const bin = $('trash-bin');
    if (bin) {
      bin.classList.add('trash-overflow');
      setTimeout(() => bin.classList.remove('trash-overflow'), 500);
    }
    saveState();
    return;
  }
  state.trashLevel++;
  state.trashItems.push(prop.emoji);
  if (state.trashItems.length > 10) state.trashItems = state.trashItems.slice(-10);
  updateTrashUI();
  saveState();
}

function emptyTrash() {
  if (state.trashLevel === 0) {
    showMsg('Prullenbak is al leeg!');
    return;
  }
  state.trashLevel = 0;
  state.trashItems = [];
  updateTrashUI();
  showMsg('🗑️ Prullenbak geleegd!');
  saveState();
}

function updateTrashUI() {
  const bin     = $('trash-bin');
  const items   = $('trash-items');
  const countEl = $('trash-count');
  if (!bin) return;
  if (items) items.textContent = state.trashItems.slice(-4).join('');
  if (countEl) countEl.textContent = state.trashLevel > 0 ? `${state.trashLevel}/5` : '';
  bin.classList.toggle('trash-full', state.trashLevel >= 5);
}

// ──────── CLOG-EVENTS ────────
function setupClogEvents() {
  clog.on('clog', () => {
    state.stats.totalClogs++;
    state.streak = 0;
    state.currentProp = rnd(CLOG_PROPS);
    updateStreakUI();
    showMsg(rnd(MESSAGES.clogStart));
    showClogProp(state.currentProp);
    showClogWarning(true);
    const w = $('toilet-wrapper');
    if (w) w.classList.add('clogged');
    $('flush-btn')?.classList.add('clogged');
    updateInventoryUI();
    saveState();
  });

  clog.on('resolved', () => {
    showClogWarning(false);

    // Prop vliegt richting prullenbak
    const prop = state.currentProp;
    animatePropFlyToBin(prop);

    // Grote celebratie + bonuspunten
    showUnclogCelebration();
    const bonus = 20 * state.level;
    addScore(bonus);
    spawnPointPopup(bonus);

    // Prop in bak (vertraagd zodat de vlieganimatie klaar is)
    setTimeout(() => addToTrash(prop), 650);

    state.currentProp = null;
    const w = $('toilet-wrapper');
    if (w) w.classList.remove('clogged');
    $('flush-btn')?.classList.remove('clogged');
    state.combo = Math.max(1, state.combo - 1);
    updateInventoryUI();
    saveState();
  });

  clog.on('overflow', () => {
    state.stats.totalOverflows++;
    const penalty = Math.round(Math.min(state.score * 0.1, 100));
    state.score = Math.max(0, state.score - penalty);
    showMsg(rnd(MESSAGES.overflow) + (penalty > 0 ? ` -${penalty}pts` : ''));
    const scene = $('bathroom-scene');
    if (scene) {
      scene.classList.add('overflow-shake');
      setTimeout(() => scene.classList.remove('overflow-shake'), 600);
    }
    state.combo = 1;
    $('combo-display').textContent = '';
    updateScoreUI();
    saveState();
  });
}

// ──────── INVENTARIS UI ────────
function renderInventory() {
  const bar = $('inventory-bar');
  if (!bar) return;
  bar.innerHTML = '';
  inv.getAll().forEach(tool => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.dataset.id = tool.id;
    btn.setAttribute('aria-label', tool.name);

    const badge = tool.discovered
      ? `<span class="tool-badge ${tool.discovered === 'working' ? 'badge-working' : 'badge-chaos'}">${tool.discovered === 'working' ? '✅' : '💥'}</span>`
      : '';

    btn.innerHTML = `
      <span class="tool-emoji">${tool.emoji}</span>
      <span class="tool-name">${tool.name}</span>
      <div class="tool-cooldown-overlay"></div>
      ${badge}
    `;
    btn.addEventListener('click', () => onToolClick(tool.id));
    bar.appendChild(btn);
  });
}

function updateInventoryUI() {
  inv.getAll().forEach(tool => {
    const btn = document.querySelector(`.tool-btn[data-id="${tool.id}"]`);
    if (!btn) return;
    const pct = inv.cooldownPct(tool.id);
    const overlay = btn.querySelector('.tool-cooldown-overlay');
    if (overlay) overlay.style.height = `${pct * 100}%`;
    btn.classList.toggle('on-cooldown', pct > 0);
    btn.classList.toggle('usable', clog.isClogged && pct === 0);
  });
}

function onToolClick(id) {
  const result = inv.use(id);
  switch (result) {
    case 'resolved':
      // Celebratie en bonuspunten zijn al afgevuurd via clog.on('resolved')
      break;
    case 'partial':
      showMsg('Iets beter! Blijf proberen…');
      break;
    case 'chaos':
      showMsg(rnd(MESSAGES.toolChaos));
      chaosPropEffect();
      break;
    case 'not-clogged':
      showMsg(rnd(MESSAGES.toolNotClogged));
      break;
    case 'cooldown':
      showMsg('Nog bezig met afkoelen…');
      break;
  }
  if (result === 'resolved' || result === 'partial' || result === 'chaos') {
    renderInventory();
    state.stats.toolsUsed = (state.stats.toolsUsed || 0) + 1;
  }
}

// ──────── COSMETICA ────────
function applyAllCosmetics() {
  Object.entries(state.activeCosmetics).forEach(([cat, id]) => {
    applyCosmetic(cat, id);
  });
}

function applyCosmetic(category, id) {
  const scene = $('bathroom-scene');
  if (!scene) return;

  if (category === 'tiles') {
    scene.dataset.tiles = id;
  } else if (category === 'floor') {
    scene.dataset.floor = id;
  } else if (category === 'toilet') {
    const toiletSvg = $('toilet-svg');
    if (toiletSvg) toiletSvg.dataset.model = id;
  } else if (category === 'decoration') {
    const deco = $('decoration-slot');
    const decoMap = {
      'deco-none':   '',
      'deco-plant':  '🌱',
      'deco-mirror': '🪞',
      'deco-painting':'🖼️',
      'deco-poster': '💪',
      'deco-rubber-duck-deco':'🦆',
    };
    if (deco) deco.textContent = decoMap[id] || '';
  }
}

document.addEventListener('cosmetic:changed', (e) => {
  const item = e.detail;
  state.activeCosmetics[item.category] = item.id;
  applyCosmetic(item.category, item.id);
  saveState();
});

// ──────── EVENTS ────────
function setupEvents() {
  const flushBtn = $('flush-btn');
  if (flushBtn) {
    flushBtn.addEventListener('click', flush);
    flushBtn.addEventListener('touchend', (e) => { e.preventDefault(); flush(); });
  }
}

// ──────── OPSLAAN / LADEN ────────
const SAVE_KEY = 'flushfactor_v1';

function saveState() {
  const data = {
    score: state.score,
    highScore: state.highScore,
    combo: state.combo,
    streak: state.streak,
    bestStreak: state.bestStreak,
    level: state.level,
    trashLevel: state.trashLevel,
    trashItems: state.trashItems,
    activeCosmetics: state.activeCosmetics,
    purchasedItems: [...state.purchasedItems],
    ownedTools: inv.getAll().map(t => t.id),
    toolDiscovery: state.toolDiscovery,
    stats: state.stats,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.score          = data.score          ?? 0;
    state.highScore      = data.highScore       ?? 0;
    state.combo          = data.combo           ?? 1;
    state.streak         = data.streak          ?? 0;
    state.bestStreak     = data.bestStreak      ?? 0;
    state.level          = data.level           ?? 1;
    state.trashLevel     = data.trashLevel      ?? 0;
    state.trashItems     = data.trashItems      ?? [];
    state.activeCosmetics= data.activeCosmetics ?? state.activeCosmetics;
    state.purchasedItems = new Set(data.purchasedItems ?? []);
    state.ownedTools     = data.ownedTools      ?? null;
    state.toolDiscovery  = data.toolDiscovery   ?? {};
    state.stats          = data.stats           ?? state.stats;
  } catch {}
  updateScoreUI();
  updateStreakUI();
}

// ──────── HULP ────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ──────── START ────────
// Sla init over als phone-preview.js de host-pagina beheert.
window.addEventListener('DOMContentLoaded', function () {
  if (!window.__PHONE_PREVIEW_ACTIVE) init();
});
