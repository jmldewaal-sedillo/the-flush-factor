// THE FLUSH FACTOR — hoofdcoördinator: spelregels, game-loop en koppeling tussen logica en weergave.
import { SCORING, WATER_PHASES } from './data/config.js';
import { LEVELS } from './data/levels.js';
import { CLOG_PROPS } from './data/clog-props.js';
import { ANCHORS, DEFAULT_VIEW } from './data/room.js';
import { MESSAGES, T } from './data/texts.js';
import { bus } from './events.js';
import { createState, loadState, saveState, bucketDef, bucketLiters } from './state.js';
import { ClogSystem } from './clog.js';
import { InventorySystem } from './inventory.js';
import { Shop } from './shop.js';
import { init3D } from './renderer3d.js';
import { hud } from './ui/hud.js';
import { playChaos } from './ui/chaos.js';

const $ = id => document.getElementById(id);
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const params = new URLSearchParams(location.search);

const state = loadState(createState());
const clog = new ClogSystem();
const inv = new InventorySystem(state, clog);
let shop, three = null;
const save = () => saveState(state);

// ──────── SCORE EN LEVEL ────────
function addScore(pts) {
  state.score += pts;
  state.highScore = Math.max(state.highScore, state.score);
  const cfg = LEVELS.filter(l => state.score >= l.minScore).pop();
  if (cfg.level > state.level) {
    state.level = cfg.level;
    clog.setLevel(cfg);
    hud.level(state.level);
    hud.levelUpBanner(cfg.level, cfg.name);
  }
  hud.score(state.score, state.highScore);
}

function losePoints(pts) {
  state.score = Math.max(0, state.score - pts);
  hud.score(state.score, state.highScore);
}

// ──────── SPOELEN ────────
function flush() {
  if (state.isFlushing) return;
  if (clog.isClogged) return hud.message(rnd(MESSAGES.alreadyClogged));

  state.isFlushing = true;
  setTimeout(() => { state.isFlushing = false; }, 700);
  state.stats.totalFlushes++;

  const now = Date.now();
  state.combo = now - state.lastFlushTime < SCORING.comboWindowMs
    ? Math.min(state.combo + SCORING.comboStep, SCORING.comboMax)
    : Math.max(1, state.combo - SCORING.comboStep);
  state.lastFlushTime = now;

  const pts = Math.round(SCORING.flushPoints * state.combo);
  addScore(pts);
  hud.pointPopup(pts);
  hud.message(rnd(MESSAGES.flushSuccess));
  hud.combo(state.combo >= 4 ? state.combo : 0);

  state.streak++;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  hud.streak(state.streak, state.bestStreak);

  bus.emit('flush');
  save();
}

// ──────── VERSTOPPING ────────
clog.on('clog', () => {
  state.stats.totalClogs++;
  state.streak = 0;
  state.currentProp = state.forcedProp || rnd(CLOG_PROPS);
  state.forcedProp = null;
  hud.streak(state.streak, state.bestStreak);
  hud.message(rnd(MESSAGES.clogStart));
  hud.clogWarning(true);
  bus.emit('clog', { propId: state.currentProp.id });
  save();
});

clog.on('resolved', () => {
  const prop = state.currentProp;
  state.currentProp = null;
  hud.clogWarning(false);
  hud.unclogBanner(rnd(MESSAGES.unclogSuccess));

  const bonus = SCORING.unclogBonusPerLevel * state.level;
  addScore(bonus);
  hud.pointPopup(bonus);
  state.combo = Math.max(1, state.combo - 1);

  // Het voorwerp gaat in de emmer als het past; anders valt het ernaast en kost het punten.
  const fits = !!prop && bucketLiters(state) + prop.liters <= bucketDef(state).liters;
  if (prop && fits) {
    state.bucketItems.push({ id: prop.id, liters: prop.liters });
  } else if (prop) {
    losePoints(SCORING.bucketFullPenalty);
    hud.message(T.bucketFull(SCORING.bucketFullPenalty));
  }
  bus.emit('unclog', { propId: prop?.id, intoBucket: fits });
  updateBucket();
  save();
});

clog.on('overflow', () => {
  state.stats.totalOverflows++;
  const penalty = Math.round(Math.min(state.score * SCORING.overflowPenaltyPct, SCORING.overflowPenaltyMax));
  losePoints(penalty);
  hud.message(rnd(MESSAGES.overflow) + (penalty ? T.penalty(penalty) : ''));
  hud.overflowShake();
  hud.combo(0);
  state.combo = 1;
  bus.emit('overflow');
  save();
});

function useTool(id) {
  const result = inv.use(id);
  if (result === 'partial') hud.message(T.partial);
  else if (result === 'cooldown') hud.message(T.cooldown);
  else if (result === 'not-clogged') hud.message(rnd(MESSAGES.toolNotClogged));
  else if (result === 'chaos') {
    hud.message(rnd(MESSAGES.toolChaos));
    playChaos(inv.get(id).chaos);
    bus.emit('chaos', { effect: inv.get(id).chaos });
  }
  if (result === 'resolved' || result === 'partial' || result === 'chaos') save();
  return result;
}

// ──────── EMMER ────────
function updateBucket() {
  const def = bucketDef(state);
  hud.bucket(bucketLiters(state), def.liters, def.icon);
}

function emptyBucket() {
  if (!state.bucketItems.length) return hud.message(T.bucketEmptyAlready);
  state.bucketItems = [];
  bus.emit('bucket:empty');
  updateBucket();
  hud.message(T.bucketEmptied);
  save();
}

// ──────── WATER (elke frame) ────────
const waterPhase = (pct, clogged) => (clogged ? WATER_PHASES.filter(p => pct >= p.from).pop() : WATER_PHASES[0]);

let lastTs = 0;
function loop(ts) {
  const dt = Math.min(ts - lastTs, 100);
  lastTs = ts;
  clog.update(dt);
  inv.update(dt);
  const phase = waterPhase(clog.waterLevel, clog.isClogged);
  hud.water(clog.waterLevel, phase, clog.isClogged);
  hud.updateInventory(inv.getAll(), clog.isClogged);
  bus.emit('water', { level: clog.waterLevel, clogged: clog.isClogged, phase });
  requestAnimationFrame(loop);
}

// ──────── START ────────
async function init() {
  clog.setLevel(LEVELS.find(l => l.level === state.level));
  if (params.get('clogs') === 'off') clog.paused = true;

  shop = new Shop(state, {
    activateCosmetic(slot, id) { state.cosmetics[slot] = id; bus.emit('cosmetic', { slot, id }); },
    toggleDecor(def) {
      const placed = state.decor[def.anchor] !== def.id;
      if (placed) state.decor[def.anchor] = def.id; else delete state.decor[def.anchor];
      bus.emit('decor', { map: { ...state.decor } });
      return placed;
    },
    setBucket(id) { state.bucketId = id; bus.emit('bucket:set', { id }); updateBucket(); },
    addTool(id) { inv.addTool(id); hud.buildInventory(inv.getAll(), useTool); },
    changed() { hud.score(state.score, state.highScore); save(); },
  });

  // HUD
  hud.score(state.score, state.highScore);
  hud.streak(state.streak, state.bestStreak);
  hud.level(state.level);
  hud.buildInventory(inv.getAll(), useTool);
  hud.buildCredits();
  hud.view(DEFAULT_VIEW);
  updateBucket();

  const cameraMenu = hud.bindPopover('btn-camera', 'camera-menu');
  const mainMenu = hud.bindPopover('btn-menu', 'main-menu');
  const setView = id => { cameraMenu.close(); bus.emit('view:set', { id }); };
  hud.buildCameraMenu(setView);

  $('flush-btn').addEventListener('click', flush);
  $('btn-shop').addEventListener('click', () => shop.open());
  $('btn-shop-close').addEventListener('click', () => { shop.close(); save(); });
  $('btn-bucket').addEventListener('click', () => setView('bucket'));
  $('btn-back').addEventListener('click', () => setView(DEFAULT_VIEW));
  $('btn-bucket-empty').addEventListener('click', emptyBucket);
  $('btn-credits-close').addEventListener('click', () => { $('credits-modal').hidden = true; });
  $('credits-modal').addEventListener('click', e => { if (e.target === $('credits-modal')) $('credits-modal').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('credits-modal').hidden) $('credits-modal').hidden = true;
    else if (document.body.dataset.view === 'bucket') setView(DEFAULT_VIEW);
  });

  $('main-menu').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    mainMenu.close();
    if (action === 'sound') hud.message(T.soundSoon);
    else if (action === 'credits') $('credits-modal').hidden = false;
    else if (action === 'fullscreen') document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.().catch(() => {});
    else if (action === 'camera-reset') setView(DEFAULT_VIEW);
  });

  bus.on('view:changed', ({ id }) => hud.view(id));
  bus.on('anchor:tap', ({ id }) => hud.message(T.anchorFree(ANCHORS[id].label)));

  // 3D
  try {
    three = await init3D($('scene'), {
      bucketId: state.bucketId,
      bucketItems: state.bucketItems.map(it => it.id),
      cosmetics: { ...state.cosmetics },
      decor: { ...state.decor },
    });
  } catch (err) {
    console.error('[3D] laden mislukt:', err);
    hud.fatal(T.loadError, String(err?.message || err));
    return;
  }
  if (!three) return hud.fatal(T.noWebGL.title, T.noWebGL.body);

  hud.loading(true);
  requestAnimationFrame(loop);
  registerServiceWorker();

  window.__game.three = three.debug;
  window.__game.ready = true;
  document.documentElement.dataset.ready = 'true';
}

// Service worker: niet tijdens geautomatiseerde tests (tenzij ?sw=on), en nooit de pagina herladen.
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const mode = params.get('sw');
  if (mode === 'off' || (navigator.webdriver && mode !== 'on')) return;
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('[sw] registratie mislukt:', err.message));
}

// Haak voor de tests en voor foutzoeken in de console. Verandert het spel niet zolang niemand hem aanroept.
window.__game = {
  ready: false,
  three: null,
  snapshot: () => ({
    score: state.score, level: state.level, streak: state.streak, combo: state.combo,
    bucketId: state.bucketId, bucketItems: state.bucketItems.map(i => i.id), bucketLiters: bucketLiters(state),
    cosmetics: { ...state.cosmetics }, decor: { ...state.decor }, ownedTools: [...state.ownedTools],
    clogged: clog.isClogged, waterLevel: clog.waterLevel, overflowing: clog.isOverflowing, currentProp: state.currentProp?.id ?? null,
  }),
  forceClog(propId) { state.forcedProp = CLOG_PROPS.find(p => p.id === propId) || null; clog.forceClog(); },
  setWater(pct) { clog.waterLevel = pct; },
  setScore(n) { state.score = n; addScore(0); save(); },
  resetCooldowns() { inv.getAll().forEach(t => { t.cooldownRemaining = 0; }); },
  pauseClogs(on = true) { clog.paused = on; },
  skipTime(ms) { clog.timeSinceLastClog += ms; clog.totalPlaytime += ms; },
  useTool,
};

if (!window.__PHONE_PREVIEW_ACTIVE) init();
