// THE FLUSH FACTOR — hoofdcoördinator: spelregels, game-loop en koppeling tussen logica en weergave.
import { SCORING, WATER_PHASES } from './data/config.js';
import { LEVELS } from './data/levels.js';
import { CLOG_PROPS } from './data/clog-props.js';
import { ANCHORS, DEFAULT_VIEW } from './data/room.js';
import { MESSAGES, T } from './data/texts.js';
import { bus } from './events.js';
import { createState, loadState, saveState, bucketDef, bucketLiters } from './state.js';
import { ClogSystem } from './clog.js';
import { CareSystem } from './care.js';
import { CLEANERS, DEFECTS, SURFACE_LABELS } from './data/care.js';
import { unlockedAt } from './data/catalog.js';
import { InventorySystem } from './inventory.js';
import { Shop } from './shop.js';
import { init3D } from './renderer3d.js';
import { hud } from './ui/hud.js';
import { playChaos } from './ui/chaos.js';
import { ProfileScreen } from './ui/profile.js';

const $ = id => document.getElementById(id);
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const params = new URLSearchParams(location.search);

const state = loadState(createState());
const clog = new ClogSystem();
const inv = new InventorySystem(state, clog);
const care = new CareSystem(state);
clog.chanceFactor = care.clogFactor();
let cleaner = null;            // gekozen schoonmaakmiddel (schoonmaakstand), of null
let shop, profileScreen, three = null;
const save = () => saveState(state);

// ──────── SCORE EN LEVEL ────────
function addScore(pts) {
  state.score += pts;
  state.highScore = Math.max(state.highScore, state.score);
  const cfg = LEVELS.filter(l => state.score >= l.minScore).pop();
  if (cfg.level > state.level) {
    // Alles wat op de tussenliggende levels vrijkomt is "nieuw" in de winkel (punt 81).
    const fresh = [];
    for (let l = state.level + 1; l <= cfg.level; l++) fresh.push(...unlockedAt(l).map(i => i.id));
    state.newItems = [...new Set([...state.newItems, ...fresh])];
    state.level = cfg.level;
    clog.setLevel(cfg);
    hud.level(state.level);
    hud.levelUpBanner(cfg.level, cfg.name, fresh.length);
    hud.shopBadge(state.newItems.length);
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

  // Vies kost punten (punt 83).
  const pts = Math.max(1, Math.round(SCORING.flushPoints * state.combo * care.pointsFactor()));
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
  care.onClogStart();
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
  care.onResolved();
  hud.clogWarning(false);
  hud.unclogBanner(rnd(MESSAGES.unclogSuccess));
  state.stats.totalUnclogs++;

  const bonus = SCORING.unclogBonusPerLevel * state.level;
  addScore(bonus);
  hud.pointPopup(bonus);
  state.combo = Math.max(1, state.combo - 1);

  // Het voorwerp gaat in de emmer als het past; anders valt het ernaast en kost het punten.
  const fits = !!prop && bucketLiters(state) + prop.liters <= bucketDef(state).liters;
  if (prop && fits) {
    state.bucketItems.push({ id: prop.id, liters: prop.liters });
    state.stats.totalLiters += prop.liters;
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
  // Herhaald overlopen maakt de boel vies (punt 83).
  const added = care.onOverflow();
  if (added.mess.length || added.puddle) {
    if (added.mess.length) { hud.message(T.care.mess); bus.emit('mess'); }
    refreshDirt();
  }
  save();
});

// ──────── SCHOONMAAK EN REPARATIE ────────
function refreshDirt() {
  bus.emit('stains', { list: state.stains.map(s => ({ ...s })) });
  hud.dirt(care.dirtCount(), care.pointsFactor());
  hud.cleaning(care.ownedCleaners(), cleaner, care.dirtCount());
}

function setCleaner(id) {
  cleaner = id && id !== cleaner ? id : null;
  bus.emit('scrubmode', { on: !!cleaner });
  hud.cleaning(care.ownedCleaners(), cleaner, care.dirtCount());
  if (cleaner) hud.message(T.care.pick(CLEANERS.find(c => c.id === cleaner).name));
}

// Er is in de schoonmaakstand over iets geveegd of getikt.
function scrub(target) {
  if (!cleaner) return;
  const r = care.scrub(cleaner, target);
  if (r.result === 'wrong-tool') return hud.message(T.care.wrongTool(SURFACE_LABELS[r.surface]));
  if (r.result === 'nothing') return;
  if (r.surface === 'toilet') bus.emit('toilet:condition', { ...toiletCondition(), animate: 'clean' });
  else bus.emit('stain:scrub', { id: r.id, dirt: r.dirt });
  if (r.result === 'cleaned') {
    hud.message(T.care.cleaned);
    hud.sparkle();
    if (r.surface !== 'toilet') bus.emit('stains', { list: state.stains.map(s => ({ ...s })) });
    if (care.dirtCount() === 0 && cleaner) setCleaner(null);
  }
  hud.dirt(care.dirtCount(), care.pointsFactor());
  hud.cleaning(care.ownedCleaners(), cleaner, care.dirtCount());
  save();
}

const toiletCondition = () => ({ defects: { ...state.toilet.defects }, dirt: state.toilet.dirt });

function repair(repairId) {
  const fixed = care.repair(repairId);
  if (!fixed) return false;
  clog.chanceFactor = care.clogFactor();
  bus.emit('toilet:condition', { ...toiletCondition(), animate: 'repair', fixed });
  return true;
}

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
    repair,
    cleanerBought() { hud.cleaning(care.ownedCleaners(), cleaner, care.dirtCount()); },
    toiletReady: () => !care.isBroken() && !care.isToiletDirty(),
    seen(ids) { state.newItems = state.newItems.filter(id => !ids.includes(id)); hud.shopBadge(state.newItems.length); },
    changed() { hud.score(state.score, state.highScore); save(); },
  });

  // Profiel (punt 69): welkomstscherm bij de eerste start, daarna via de scorebubbel.
  const clogsPaused = clog.paused;
  profileScreen = new ProfileScreen({
    getProfile: () => state.profile,
    getStats: () => [
      { label: T.profile.stats.flushes, value: state.stats.totalFlushes.toLocaleString('nl-NL') },
      { label: T.profile.stats.bestStreak, value: state.bestStreak.toLocaleString('nl-NL') },
      { label: T.profile.stats.unclogs, value: state.stats.totalUnclogs.toLocaleString('nl-NL') },
      { label: T.profile.stats.liters, value: T.profile.stats.litersValue(state.stats.totalLiters) },
    ],
    onSave(profile) {
      const first = !state.profile;
      state.profile = { ...profile, mode: 'guest', createdAt: state.profile?.createdAt || new Date().toISOString() };
      hud.profile(state.profile);
      save();
      if (first) clog.paused = clogsPaused; else hud.message(T.profile.saved);
    },
  });
  hud.profile(state.profile);
  $('score-bubble').addEventListener('click', () => profileScreen.open());
  if (!state.profile) {
    clog.paused = true;              // geen verstoppingen terwijl het welkomstscherm openstaat
    profileScreen.open({ welcome: true });
  }

  // HUD
  hud.score(state.score, state.highScore);
  hud.streak(state.streak, state.bestStreak);
  hud.level(state.level);
  hud.buildInventory(inv.getAll(), useTool);
  hud.buildCredits();
  hud.view(DEFAULT_VIEW);
  hud.shopBadge(state.newItems.length);
  hud.dirt(care.dirtCount(), care.pointsFactor());
  hud.cleaning(care.ownedCleaners(), cleaner, care.dirtCount());
  hud.bindCleaning(setCleaner);
  hud.bindTools();
  updateBucket();

  const cameraMenu = hud.bindPopover('btn-camera', 'camera-menu');
  const mainMenu = hud.bindPopover('btn-menu', 'main-menu');
  const setView = id => { cameraMenu.close(); bus.emit('view:set', { id }); };
  hud.buildCameraMenu(setView);

  $('flush-btn').addEventListener('click', flush);
  $('btn-shop').addEventListener('click', () => { if (cleaner) setCleaner(null); shop.open(); });
  $('btn-shop-close').addEventListener('click', () => { shop.close(); save(); });
  $('btn-bucket').addEventListener('click', () => setView('bucket'));
  $('btn-back').addEventListener('click', () => bus.emit('view:back'));
  $('btn-bucket-empty').addEventListener('click', emptyBucket);
  $('btn-credits-close').addEventListener('click', () => { $('credits-modal').hidden = true; });
  $('credits-modal').addEventListener('click', e => { if (e.target === $('credits-modal')) $('credits-modal').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (profileScreen.isOpen()) profileScreen.close();
    else if (!$('credits-modal').hidden) $('credits-modal').hidden = true;
    else if (document.body.hasAttribute('data-zoom')) bus.emit('view:back');
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
  bus.on('scrub', target => scrub(target));

  // 3D
  try {
    three = await init3D($('scene'), {
      bucketId: state.bucketId,
      bucketItems: state.bucketItems.map(it => ({ ...it })),
      cosmetics: { ...state.cosmetics },
      decor: { ...state.decor },
      toilet: toiletCondition(),
      stains: state.stains.map(st => ({ ...st })),
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
    profile: state.profile ? { ...state.profile } : null, stats: { ...state.stats, bestStreak: state.bestStreak },
    toilet: toiletCondition(), broken: care.isBroken(), stains: state.stains.map(st => ({ ...st })), dirtCount: care.dirtCount(), pointsFactor: care.pointsFactor(),
    overflowStreak: state.overflowStreak, newItems: [...state.newItems], purchased: [...state.purchased], cleaner,
    clogged: clog.isClogged, waterLevel: clog.waterLevel, overflowing: clog.isOverflowing, currentProp: state.currentProp?.id ?? null,
  }),
  forceClog(propId) { state.forcedProp = CLOG_PROPS.find(p => p.id === propId) || null; clog.forceClog(); },
  setWater(pct) { clog.waterLevel = pct; },
  setScore(n) { state.score = n; addScore(0); save(); },
  resetCooldowns() { inv.getAll().forEach(t => { t.cooldownRemaining = 0; }); },
  pauseClogs(on = true) { clog.paused = on; },
  // Schoonmaken zonder te mikken (tests): doet precies wat een veeg over die plek doet.
  scrub,
  setCleaner,
  defects: () => Object.keys(DEFECTS),
  skipTime(ms) { clog.timeSinceLastClog += ms; clog.totalPlaytime += ms; },
  useTool,
};

if (!window.__PHONE_PREVIEW_ACTIVE) init();
