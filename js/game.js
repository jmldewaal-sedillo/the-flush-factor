// THE FLUSH FACTOR — hoofdcoördinator: spelregels, game-loop en koppeling tussen logica en weergave.
import { SCORING, WATER_PHASES, CLOG_KINDS, RUSH } from './data/config.js';
import { LEVELS } from './data/levels.js';
import { nextCombo, flushPoints, unclogBonus, overflowPenalty, levelFor } from './scoring.js';
import { CLOG_PROPS } from './data/clog-props.js';
import { ANCHORS, DEFAULT_VIEW } from './data/room.js';
import { t, pick, num, itemName, setLanguage, missingKeys, getLanguage } from './i18n/index.js';
import { bus } from './events.js';
import { createState, loadState, saveState, bucketDef, bucketLiters } from './state.js';
import { storage, migrateLegacy } from './storage.js';
import { ClogSystem } from './clog.js';
import { RushSystem } from './rush.js';
import { CareSystem } from './care.js';
import { CLEANERS, DEFECTS } from './data/care.js';
import { unlockedAt } from './data/catalog.js';
import { InventorySystem } from './inventory.js';
import { Shop } from './shop.js';
import { init3D } from './renderer3d.js';
import { hud } from './ui/hud.js';
import { playChaos } from './ui/chaos.js';
import { ProfileScreen } from './ui/profile.js';
import { bindDataControls, dataDialogOpen, closeDataDialogs } from './ui/data.js';
import { sound } from './sound.js';
import { SOUNDS, UNCLOG_AFTER_TOOL } from './data/sounds.js';
import { TOOLS } from './data/tools.js';

const $ = id => document.getElementById(id);
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const params = new URLSearchParams(location.search);

migrateLegacy();               // sleutels van vóór de prefix flushfactor. overzetten (eenmalig)
const state = loadState(createState());
setLanguage(state.language);
sound.configure(state.sound);
sound.arm();                   // laden en afspelen pas na de eerste tik (punt 96)
const clog = new ClogSystem();
const rush = new RushSystem();
const inv = new InventorySystem(state, clog);
const care = new CareSystem(state);
clog.chanceFactor = care.clogFactor();
let cleaner = null;            // gekozen schoonmaakmiddel (schoonmaakstand), of null
let shop, profileScreen, three = null;
let pickView = () => {};      // camerastand kiezen via het menu (sluit het menu)
// Na verwijderen of terugzetten van gegevens schrijft het spel niets meer weg tot het opnieuw start.
let saving = true;
const save = () => { if (saving) saveState(state); };

// ──────── SCORE EN LEVEL ────────
// Het level volgt uit alles wat je ooit verdiend hebt (`earned`), niet uit je saldo: kopen kost geen voortgang (punt 61).
function addScore(pts) {
  state.score += pts;
  state.earned += Math.max(0, pts);
  state.highScore = Math.max(state.highScore, state.score);
  const cfg = levelFor(state.earned);
  if (cfg.level > state.level) {
    // Alles wat op de tussenliggende levels vrijkomt is "nieuw" in de winkel (punt 81).
    const fresh = [];
    for (let l = state.level + 1; l <= cfg.level; l++) fresh.push(...unlockedAt(l).map(i => i.id));
    state.newItems = [...new Set([...state.newItems, ...fresh])];
    state.level = cfg.level;
    clog.setLevel(cfg);
    bus.emit('level:up', { level: cfg.level });
    hud.level(state.level);
    hud.levelUpBanner(cfg.level, t(`level.${cfg.level}`), fresh.length);
    hud.shopBadge(state.newItems.length);
  }
  hud.score(state.score, state.highScore);
}

function losePoints(pts) {
  state.score = Math.max(0, state.score - pts);
  hud.score(state.score, state.highScore);
}

// ──────── SPOELEN ────────
const COMBO_SHOWN = 1 + (SCORING.comboMax - 1) / 2;      // de combo komt in beeld vanaf halverwege
function flush() {
  if (state.isFlushing) return;
  if (clog.isClogged) return hud.message(pick('m.alreadyClogged'));

  state.isFlushing = true;
  setTimeout(() => { state.isFlushing = false; }, 700);
  state.stats.totalFlushes++;

  const now = Date.now();
  state.combo = nextCombo(state.combo, now - state.lastFlushTime);
  state.lastFlushTime = now;

  // Vies kost punten (punt 83), spitsuur geeft dubbel (punt 114), een hoger level meer per beurt.
  const pts = flushPoints(state.combo, care.pointsFactor() * rush.pointsFactor, state.level);
  addScore(pts);
  hud.pointPopup(pts);
  hud.message(pick('m.flush'));
  hud.combo(state.combo >= COMBO_SHOWN ? state.combo : 0);

  state.streak++;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  hud.streak(state.streak, state.bestStreak);

  bus.emit('flush');
  save();
}

// ──────── VERSTOPPING ────────
// Soorten verstoppingen (punt 113): de waarschuwing zegt welke soort het is; een bijzondere soort legt
// in de melding uit wat er anders is.
clog.on('clog', ({ kind, second }) => {
  state.stats.totalClogs++;
  care.onClogStart();
  state.streak = 0;
  state.currentProp = state.forcedProp || rnd(CLOG_PROPS);
  state.forcedProp = null;
  hud.streak(state.streak, state.bestStreak);
  hud.message(second ? t('kind.double.second') : kind === 'normal' ? pick('m.clogStart') : t(`kind.${kind}.msg`));
  hud.clogWarning(true, second ? 'double' : kind);
  bus.emit('clog', { propId: state.currentProp.id, kind });
  save();
});

clog.on('resolved', ({ kind, followUp }) => {
  const prop = state.currentProp;
  state.currentProp = null;
  care.onResolved();
  hud.clogWarning(false);
  hud.unclogBanner(followUp ? t('kind.double.next') : pick('m.unclog'));
  state.stats.totalUnclogs++;

  const bonus = unclogBonus(state.level, kind);
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
    hud.message(t('bucketFull', { pts: SCORING.bucketFullPenalty }));
  }
  bus.emit('unclog', { propId: prop?.id, intoBucket: fits });
  updateBucket();
  save();
});

clog.on('overflow', () => {
  state.stats.totalOverflows++;
  rush.onOverflow();
  const penalty = overflowPenalty(state.score, state.level);
  losePoints(penalty);
  hud.message(pick('m.overflow') + (penalty ? t('penalty', { pts: penalty }) : ''));
  hud.overflowShake();
  hud.combo(0);
  state.combo = 1;
  bus.emit('overflow');
  // Herhaald overlopen maakt de boel vies (punt 83).
  const added = care.onOverflow();
  if (added.mess.length || added.puddle) {
    if (added.mess.length) { hud.message(t('care.mess')); bus.emit('mess'); }
    refreshDirt();
  }
  save();
});

// ──────── SPITSUUR (punt 114) ────────
rush.on('start', ({ durationMs }) => {
  clog.rush = true;
  hud.rush(durationMs);
  hud.rushBanner(t('rush.start', { x: RUSH.pointsFactor }));
  bus.emit('rush:start');
});
rush.on('end', ({ survived }) => {
  clog.rush = false;
  hud.rush(0);
  if (survived) {
    const bonus = rush.bonus(state.level);
    addScore(bonus);
    hud.pointPopup(bonus);
    hud.rushBanner(t('rush.survived', { pts: num(bonus) }));
    state.stats.rushesSurvived = (state.stats.rushesSurvived || 0) + 1;
  } else hud.message(t('rush.over'));
  bus.emit('rush:end', { survived });
  save();
});

// ──────── SCHOONMAAK EN REPARATIE ────────
const showCleaning = () => hud.cleaning(care.ownedCleaners(), cleaner);

function refreshDirt() {
  bus.emit('stains', { list: state.stains.map(s => ({ ...s })) });
  hud.dirt(care.dirtCount(), care.pointsFactor());
  showCleaning();
}

// Kies een schoonmaakmiddel (nog een keer hetzelfde = stoppen). Alleen wat je in voorraad hebt kan.
function setCleaner(id) {
  const next = id && id !== cleaner && care.usesLeft(id) > 0 ? id : null;
  if (next && care.dirtCount() === 0) { hud.message(t('care.nothingDirty')); return; }
  cleaner = next;
  bus.emit('scrubmode', { on: !!cleaner });
  showCleaning();
  if (cleaner) hud.message(t('care.pick', { name: itemName({ id: cleaner }) }));
}

// Er is in de schoonmaakstand over iets geveegd of getikt.
function scrub(target) {
  if (!cleaner) return;
  const used = cleaner;
  const r = care.scrub(used, target);
  if (r.result === 'wrong-tool') return hud.message(t(`care.wrong.${r.surface}`));
  if (r.result === 'nothing') return;
  bus.emit('scrubbed', { surface: r.surface });
  if (r.surface === 'toilet') bus.emit('toilet:condition', { ...toiletCondition(), animate: 'clean' });
  else bus.emit('stain:scrub', { id: r.id, dirt: r.dirt });
  if (r.result === 'cleaned') {
    hud.message(t('care.cleaned'));
    hud.sparkle();
    if (r.surface !== 'toilet') bus.emit('stains', { list: state.stains.map(s => ({ ...s })) });
  }
  // Op (punt 92): het middel verdwijnt uit de voorraad en de schoonmaakstand stopt.
  if (r.left === 0) {
    setCleaner(null);
    hud.message(t('care.usedUp', { name: itemName({ id: used }) }));
  } else if (care.dirtCount() === 0 && cleaner) setCleaner(null);
  hud.dirt(care.dirtCount(), care.pointsFactor());
  showCleaning();
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
  if (result === 'partial') hud.message(t('partial'));
  else if (result === 'cooldown') hud.message(t('cooldown'));
  else if (result === 'not-clogged') hud.message(pick('m.toolNotClogged'));
  else if (result === 'chaos') {
    hud.message(pick('m.toolChaos'));
    playChaos(inv.get(id).chaos);
    bus.emit('chaos', { effect: inv.get(id).chaos });
  }
  // Het gereedschap is echt gebruikt: zijn eigen geluid (punt 104).
  if (result === 'resolved' || result === 'partial' || result === 'chaos') bus.emit('tool:use', { id, result });
  if (result === 'resolved' || result === 'partial' || result === 'chaos') save();
  return result;
}

// ──────── GELUID ────────
// Instellingen uit het geluidsvenster (punt 106); horen bij het profiel en worden met de spelstand bewaard.
// change: { muted } of { group, on } of { group, volume }
function setSound(change) {
  const next = { muted: state.sound.muted, groups: Object.fromEntries(Object.entries(state.sound.groups).map(([id, v]) => [id, { ...v }])) };
  if ('muted' in change) next.muted = !!change.muted;
  if (change.group && next.groups[change.group]) {
    if ('on' in change) next.groups[change.group].on = !!change.on;
    if ('volume' in change) next.groups[change.group].volume = Math.min(1, Math.max(0, change.volume));
  }
  state.sound = next;
  sound.configure(state.sound);
  hud.sound(state.sound);
  save();
}

// Geluiden hangen aan dezelfde events als de animaties (punt 102): het geluid start op het moment dat het
// event verstuurd wordt. pick(detail) → naam van het geluid (of niets); after: seconden later beginnen.
function cue(event, pick, after = 0) {
  bus.on(event, detail => {
    const name = typeof pick === 'function' ? pick(detail) : pick;
    if (name) sound.play(name, { since: bus.stamp(event), after });
  });
}
function bindSounds() {
  // Elk gereedschap moet een eigen geluid hebben (punt 104); een nieuw gereedschap zonder valt hier meteen op.
  const used = new Set();
  for (const tool of TOOLS) {
    if (!SOUNDS[tool.sound] || used.has(tool.sound)) console.error(`[geluid] gereedschap "${tool.id}" heeft geen eigen geluid (js/data/tools.js, js/data/sounds.js)`);
    used.add(tool.sound);
  }
  cue('flush', 'flush');
  cue('clog', 'clog');                                    // het voorwerp valt in de pot
  cue('tool:use', ({ id }) => inv.get(id)?.sound);
  cue('unclog', 'unclog', UNCLOG_AFTER_TOOL);             // eerst het gereedschap, dan plop + wegspoelen
  cue('bucket:land', ({ propId }) => `bucket-${CLOG_PROPS.find(p => p.id === propId)?.sound || 'soft'}`);
  cue('bucket:empty', 'bucket-empty');
  cue('scrubbed', 'scrub');
  cue('ui:click', 'ui-click');
  cue('ui:buy', 'ui-buy');
  cue('level:up', 'level-up');
  cue('rush:start', 'rush');
  cue('rush:end', ({ survived }) => survived ? 'level-up' : null);
  cue('toilet:condition', ({ animate }) => animate === 'repair' ? 'repair' : null);
  // Interface: elke knop, behalve de knoppen die zelf al een geluid maken (spoelen, gereedschap, emmer legen).
  document.addEventListener('click', e => {
    const el = e.target.closest('button, select, a, label.file-btn');
    if (!el || e.defaultPrevented || el.closest('#flush-btn, .tool-btn, #btn-bucket-empty, .shop-card')) return;      // ook niet bij een ingeslikte tik (punt 93)
    bus.emit('ui:click');
  }, true);
}

// ──────── EMMER ────────
function updateBucket() {
  const def = bucketDef(state);
  hud.bucket(bucketLiters(state), def.liters, def.icon);
}

function emptyBucket() {
  if (!state.bucketItems.length) return hud.message(t('bucketEmptyAlready'));
  state.bucketItems = [];
  bus.emit('bucket:empty');
  updateBucket();
  hud.message(t('bucketEmptied'));
  save();
}

// ──────── WATER (elke frame) ────────
const waterPhase = (pct, clogged) => (clogged ? WATER_PHASES.filter(p => pct >= p.from).pop() : WATER_PHASES[0]);

let lastTs = 0;
function loop(ts) {
  const dt = Math.min(ts - lastTs, 100);
  lastTs = ts;
  clog.update(dt);
  if (!clog.paused) rush.update(dt, state.level);    // geen spitsuur op het welkomstscherm of in tests met ?clogs=off
  if (rush.active) hud.rushTime(rush.remaining);
  inv.update(dt);
  const phase = waterPhase(clog.waterLevel, clog.isClogged);
  hud.water(clog.waterLevel, phase, clog.isClogged);
  hud.updateInventory(inv.getAll(), clog.isClogged);
  bus.emit('water', { level: clog.waterLevel, clogged: clog.isClogged, phase });
  sound.loop('overflow', clog.isOverflowing);
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
    upgradeTool(id) { inv.upgrade(id); hud.buildInventory(inv.getAll(), useTool); },
    repair,
    cleanerBought(id) { care.restock(id); showCleaning(); },
    usesLeft: id => care.usesLeft(id),
    toiletReady: () => !care.isBroken() && !care.isToiletDirty(),
    seen(ids) { state.newItems = state.newItems.filter(id => !ids.includes(id)); hud.shopBadge(state.newItems.length); },
    changed() { hud.score(state.score, state.highScore); save(); },
    bought() { bus.emit('ui:buy'); },
  });

  // Profiel (punt 69): welkomstscherm bij de eerste start, daarna via de scorebubbel.
  const clogsPaused = clog.paused;
  profileScreen = new ProfileScreen({
    getProfile: () => state.profile,
    getStats: () => [
      { label: t('stat.flushes'), value: num(state.stats.totalFlushes) },
      { label: t('stat.bestStreak'), value: num(state.bestStreak) },
      { label: t('stat.unclogs'), value: num(state.stats.totalUnclogs) },
      { label: t('stat.liters'), value: t('stat.litersValue', { n: num(state.stats.totalLiters, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }) },
    ],
    onSave(profile) {
      const first = !state.profile;
      state.profile = { ...profile, mode: 'guest', createdAt: state.profile?.createdAt || new Date().toISOString() };
      hud.profile(state.profile);
      save();
      if (first) { clog.paused = clogsPaused; sound.allowMusic(); } else hud.message(t('profile.saved'));
    },
  });
  hud.profile(state.profile);
  if (state.profile) sound.allowMusic();      // muziek pas na het startscherm (punt 105)
  $('score-bubble').addEventListener('click', () => profileScreen.open());
  bindDataControls({ beforeChange() { saving = false; clog.paused = true; } });
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
  showCleaning();
  // Lege voorraad: de knop brengt je naar de juiste categorie in de winkel (punt 91).
  // Het winkelwagentje in de la doet hetzelfde zonder die melding (punt 97); de schoonmaakstand stopt dan.
  hud.bindCleaning(setCleaner,
    () => { shop.open({ category: 'care' }); shop.say(t('care.shopHint')); },
    () => { if (cleaner) setCleaner(null); shop.open({ category: 'care' }); });
  hud.bindTools();
  hud.bindDismiss();
  updateBucket();

  // Taal (punt 94): keuze in het menu; alles wat in beeld staat wordt meteen opnieuw getekend.
  hud.buildLanguages(state.language, code => {
    state.language = setLanguage(code);
    save();
    refreshTexts();
  });

  const cameraMenu = hud.bindPopover('btn-camera', 'camera-menu');
  const mainMenu = hud.bindPopover('btn-menu', 'main-menu');
  const setView = id => { cameraMenu.close(); bus.emit('view:set', { id }); };
  pickView = setView;
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
    if (dataDialogOpen()) closeDataDialogs();
    else if (profileScreen.isOpen()) profileScreen.close();
    else if (hud.soundOpen()) hud.closeSound();
    else if (!$('credits-modal').hidden) $('credits-modal').hidden = true;
    else if (document.body.hasAttribute('data-zoom')) bus.emit('view:back');
  });

  $('main-menu').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    mainMenu.close();
    if (action === 'sound') return hud.openSound();
    if (action === 'credits') $('credits-modal').hidden = false;
    else if (action === 'fullscreen') document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.().catch(() => {});
    else if (action === 'camera-reset') setView(DEFAULT_VIEW);
  });

  bus.on('view:changed', ({ id }) => hud.view(id));
  bus.on('anchor:tap', ({ id }) => ANCHORS[id] && hud.message(t('anchorFree', { place: t(`anchor.${id}`) })));
  bus.on('scrub', target => scrub(target));
  bindSounds();
  hud.bindSound(state.sound, setSound);

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
    hud.fatal(t('loadError'), String(err?.message || err));
    return;
  }
  if (!three) return hud.fatal(t('noWebGL.title'), t('noWebGL.body'));

  hud.loading(true);
  requestAnimationFrame(loop);
  registerServiceWorker();

  window.__game.three = three.debug;
  window.__game.ready = true;
  document.documentElement.dataset.ready = 'true';
}

// Na een taalwissel: alles wat tekst toont opnieuw opbouwen.
function refreshTexts() {
  hud.score(state.score, state.highScore);
  hud.level(state.level);
  hud.profile(state.profile);
  hud.buildInventory(inv.getAll(), useTool);
  hud.buildCameraMenu(pickView);
  hud.view(three ? three.view() : DEFAULT_VIEW);
  hud.buildCredits();
  hud.dirt(care.dirtCount(), care.pointsFactor());
  hud.toolsLabel?.();
  hud.sound(state.sound);
  showCleaning();
  updateBucket();
  profileScreen.refresh();
  shop.refresh();
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
    score: state.score, earned: state.earned, level: state.level, streak: state.streak, combo: state.combo,
    bucketId: state.bucketId, bucketItems: state.bucketItems.map(i => i.id), bucketLiters: bucketLiters(state),
    cosmetics: { ...state.cosmetics }, decor: { ...state.decor }, ownedTools: [...state.ownedTools],
    profile: state.profile ? { ...state.profile } : null, stats: { ...state.stats, bestStreak: state.bestStreak },
    toilet: toiletCondition(), broken: care.isBroken(), stains: state.stains.map(st => ({ ...st })), dirtCount: care.dirtCount(), pointsFactor: care.pointsFactor(),
    overflowStreak: state.overflowStreak, newItems: [...state.newItems], purchased: [...state.purchased], cleaner,
    supplies: { ...state.supplies }, language: getLanguage(), sound: JSON.parse(JSON.stringify(state.sound)),
    toolUpgrades: { ...state.toolUpgrades }, clogKind: clog.kind, rush: { active: rush.active, remaining: rush.remaining },
    tools: inv.getAll().map(x => ({ id: x.id, power: x.power, cooldown: x.cooldown, stars: x.stars || 0 })),
    clogged: clog.isClogged, waterLevel: clog.waterLevel, overflowing: clog.isOverflowing, currentProp: state.currentProp?.id ?? null,
  }),
  forceClog(propId, kind = 'normal') { state.forcedProp = CLOG_PROPS.find(p => p.id === propId) || null; clog.forceClog(CLOG_KINDS[kind] ? kind : 'normal'); },
  // Spitsuur (punt 114) meteen beginnen of beëindigen.
  startRush() { rush.start(); },
  endRush() { rush.end(); },
  setWater(pct) { clog.waterLevel = pct; },
  // Zet het saldo; wat je verdiend hebt groeit mee (het level volgt daaruit), maar zakt nooit.
  setScore(n) { state.score = n; state.earned = Math.max(state.earned, n); addScore(0); save(); },
  resetCooldowns() { inv.getAll().forEach(t => { t.cooldownRemaining = 0; }); },
  pauseClogs(on = true) { clog.paused = on; },
  // Schoonmaken zonder te mikken (tests): doet precies wat een veeg over die plek doet.
  scrub,
  setCleaner,
  defects: () => Object.keys(DEFECTS),
  // Talen (punt 94): wisselen zoals het menu dat doet, en welke sleutels er ontbraken.
  setLanguage(code) { state.language = setLanguage(code); save(); refreshTexts(); },
  missingTexts: () => missingKeys(),
  skipTime(ms) { clog.timeSinceLastClog += ms; clog.totalPlaytime += ms; },
  useTool,
  // Geluid (punt 96): wat er geladen en afgespeeld is.
  sound: () => sound.debug(),
};

if (!window.__PHONE_PREVIEW_ACTIVE) init();
