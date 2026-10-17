// Spelstand: standaardwaarden, opslaan/laden (via js/storage.js) en migratie van oudere versies.
import { storage } from './storage.js';
import { BUCKETS, DEFAULT_BUCKET, LEGACY_DEFAULT_BUCKET, LEGACY_BUCKET_IDS } from './data/buckets.js';
import { CLOG_PROPS } from './data/clog-props.js';
import { DECORATIONS, DEFAULT_COSMETICS, LEGACY_COSMETICS, COSMETIC_LISTS } from './data/cosmetics.js';
import { STARTING_TOOLS, LEGACY_STARTING_TOOLS, TOOLS } from './data/tools.js';
import { DEFECTS, CLEANERS } from './data/care.js';
import { STRINGS, deviceLanguage } from './i18n/index.js';
import { AVATARS, DEFAULT_PROFILE, NAME_MAX } from './data/profile.js';
import { SOUND_GROUPS, soundDefaults } from './data/sounds.js';
import { LEVELS } from './data/levels.js';
import { levelFor } from './scoring.js';
import { canUpgrade, MAX_STARS } from './upgrades.js';

// Een nieuwe speler begint in een armoedig hokje (punt 79): kapot en vies toilet, roestige emmer,
// kale muur, vieze vloer, vier stuks gereedschap.
export function createState() {
  return {
    score: 0, highScore: 0, combo: 1, streak: 0, bestStreak: 0, level: 1,
    earned: 0,                          // alle punten die je ooit verdiend hebt; het level volgt hieruit (punt 61)
    bucketId: DEFAULT_BUCKET,
    bucketItems: [],                    // [{ id: propId, liters }]
    cosmetics: { ...DEFAULT_COSMETICS },
    decor: {},                          // { anchorId: decorationId }
    purchased: new Set(),
    ownedTools: STARTING_TOOLS.map(t => t.id),
    toolDiscovery: {},                  // { toolId: 'working' | 'chaos' }
    toolUpgrades: {},                   // { toolId: aantal sterren 1–3 } (punt 115)
    stats: { totalFlushes: 0, totalClogs: 0, totalUnclogs: 0, totalLiters: 0, totalOverflows: 0, toolsUsed: 0 },
    profile: null,                      // { name, avatar, mode: 'guest', createdAt } — null = eerste start
    toilet: { defects: Object.fromEntries(Object.keys(DEFECTS).map(k => [k, true])), dirt: 1 },   // dirt 0–1
    stains: [],                         // vlekken op muren en vloer: { id, surface, look, u, v, size, turn, dirt }
    overflowStreak: 0,                  // verstoppingen achter elkaar die overliepen
    newItems: [],                       // net vrijgespeeld bij een level-up, nog niet bekeken in de winkel
    supplies: {},                       // voorraad schoonmaakspullen: { cleanerId: aantal keer gebruik over } (punt 92)
    sound: soundDefaults(),             // { muted, groups: { <groep>: { on, volume 0–1 } } }; hoort bij het profiel (punt 106)
    language: deviceLanguage(),         // taal: eerst die van het toestel (anders Engels), daarna de keuze uit het menu
    // niet opgeslagen:
    lastFlushTime: 0, isFlushing: false, currentProp: null,
  };
}

export const bucketDef = state => BUCKETS.find(b => b.id === state.bucketId) || BUCKETS[0];
export const bucketLiters = state => state.bucketItems.reduce((sum, it) => sum + it.liters, 0);

export function saveState(state) {
  const data = {
    version: 5,
    score: state.score, highScore: state.highScore, earned: state.earned, combo: state.combo,
    streak: state.streak, bestStreak: state.bestStreak, level: state.level,
    bucketId: state.bucketId, bucketItems: state.bucketItems,
    cosmetics: state.cosmetics, decor: state.decor,
    purchased: [...state.purchased], ownedTools: state.ownedTools,
    toolDiscovery: state.toolDiscovery, toolUpgrades: state.toolUpgrades, stats: state.stats, profile: state.profile,
    toilet: state.toilet, stains: state.stains, overflowStreak: state.overflowStreak, newItems: state.newItems,
    supplies: state.supplies, sound: state.sound,
  };
  storage.write('game', data, state.profile?.name);
  storage.writeSetting('language', state.language);       // de taal hoort bij het toestel, niet bij het profiel
}

// Oude opslag bewaarde mand-inhoud als icoonnaam; zet om naar voorwerp-id's.
const LEGACY_PROP_ICONS = { 'rubber-duck': 'duck', smartphone: 'phone', 'teddy-bear': 'teddy', lego: 'brick' };

function migrate(data) {
  return migrateV5(migrateV4(migrateV3(data.version >= 2 ? data : migrateV2(data))));
}

// Versie 4 → 5 (punt 61). De prijzen in de winkel zijn ×5 gegaan (en punten verdienen gaat trager); wie al
// speelde krijgt zijn saldo ×5, zodat hij er evenveel voor kan kopen. Het level volgde uit het saldo en volgt
// nu uit alles wat je ooit verdiend hebt; het hoogste saldo ooit is daarvan de beste schatting.
// Niemand zakt een level: dat regelt loadState().
function migrateV5(data) {
  if (data.version >= 5) return data;
  const score = Number.isFinite(data.score) ? data.score * 5 : 0;
  const highScore = Number.isFinite(data.highScore) ? data.highScore * 5 : 0;
  return { ...data, version: 5, score, highScore, earned: Math.max(score, highScore) };
}

// Versie 3 → 4 (punt 92). Schoonmaakspullen raken voortaan op. Wie ze al had gekocht toen ze nog
// onbeperkt meegingen, krijgt van elk een volle voorraad.
function migrateV4(data) {
  if (data.version >= 4) return data;
  const supplies = {};
  for (const c of CLEANERS) if ((data.purchased || []).includes(c.id)) supplies[c.id] = c.uses;
  return { ...data, version: 4, supplies };
}

// Versie 2 → 3 (Sprint 9). Wie al speelde houdt alles wat hij had: het hele toilet, de houten emmer,
// de tegels en de houten vloer (die waren toen gratis) en zijn gereedschap. De armoedige start-staat
// geldt alleen voor nieuwe spelers.
function migrateV3(data) {
  if (data.version >= 3) return data;
  const purchased = new Set(data.purchased || []);
  [LEGACY_DEFAULT_BUCKET, LEGACY_COSMETICS.tiles, LEGACY_COSMETICS.floor].forEach(id => purchased.add(id));
  return {
    ...data, version: 3,
    purchased: [...purchased],
    bucketId: data.bucketId || LEGACY_DEFAULT_BUCKET,
    cosmetics: { ...LEGACY_COSMETICS, ...(data.cosmetics || {}) },
    ownedTools: data.ownedTools?.length ? data.ownedTools : LEGACY_STARTING_TOOLS,
    toilet: { defects: {}, dirt: 0 },
    stains: [], overflowStreak: 0, newItems: [],
  };
}

function migrateV2(data) {
  const out = { ...data, version: 2 };
  out.bucketId = LEGACY_BUCKET_IDS[data.activeBasket] || DEFAULT_BUCKET;
  out.bucketItems = (data.basketItems || []).map(it => {
    const id = LEGACY_PROP_ICONS[it.icon] || it.icon;
    return { id, liters: it.volume ?? 0.5 };
  });
  const old = data.activeCosmetics || {};
  out.cosmetics = { toilet: old.toilet, tiles: old.tiles, floor: old.floor };
  out.decor = {};
  const deco = DECORATIONS.find(d => d.id === old.decoration);
  if (deco) out.decor[deco.anchor] = deco.id;
  out.purchased = (data.purchasedItems || []).map(id => LEGACY_BUCKET_IDS[id] || id);
  return out;
}

export function loadState(state) {
  const language = storage.readSetting('language');
  if (STRINGS[language]) state.language = language;
  let data = storage.read('game');
  if (!data || typeof data !== 'object') return state;
  data = migrate(data);

  const num = (v, d) => (Number.isFinite(v) ? v : d);
  state.score = num(data.score, 0);
  state.highScore = num(data.highScore, 0);
  state.combo = num(data.combo, 1);
  state.streak = num(data.streak, 0);
  state.bestStreak = num(data.bestStreak, 0);
  // Het level zakt nooit, en wat je verdiend hebt is minstens de drempel van je level.
  state.earned = Math.max(0, num(data.earned, 0));
  state.level = Math.min(LEVELS.length, Math.max(num(data.level, 1), levelFor(state.earned).level));
  state.earned = Math.max(state.earned, LEVELS[state.level - 1].minScore);
  state.purchased = new Set(data.purchased || []);
  state.bucketId = BUCKETS.some(b => b.id === data.bucketId) ? data.bucketId : DEFAULT_BUCKET;
  state.bucketItems = (data.bucketItems || [])
    .filter(it => CLOG_PROPS.some(p => p.id === it.id))
    .map(it => ({ id: it.id, liters: num(it.liters, 0.5) }));
  for (const slot of Object.keys(DEFAULT_COSMETICS)) {
    const id = data.cosmetics?.[slot];
    state.cosmetics[slot] = COSMETIC_LISTS[slot].some(c => c.id === id) ? id : DEFAULT_COSMETICS[slot];
  }
  state.decor = {};
  for (const [anchor, id] of Object.entries(data.decor || {})) {
    if (DECORATIONS.some(d => d.id === id && d.anchor === anchor)) state.decor[anchor] = id;
  }
  const known = new Set(TOOLS.map(t => t.id));
  const owned = (data.ownedTools || []).filter(id => known.has(id));
  state.ownedTools = owned.length ? owned : STARTING_TOOLS.map(t => t.id);
  state.toolDiscovery = data.toolDiscovery || {};
  // Sterren alleen voor gereedschap dat je hebt en dat verbeterd kan worden, nooit meer dan het maximum.
  state.toolUpgrades = {};
  for (const [id, n] of Object.entries(data.toolUpgrades || {})) {
    const def = TOOLS.find(t => t.id === id);
    if (def && canUpgrade(def) && state.ownedTools.includes(id) && Number.isInteger(n) && n > 0) state.toolUpgrades[id] = Math.min(MAX_STARS, n);
  }
  state.stats = { ...state.stats, ...(data.stats || {}) };
  const defects = data.toilet?.defects || {};
  state.toilet = {
    defects: Object.fromEntries(Object.keys(DEFECTS).map(k => [k, defects[k] === true])),
    dirt: Math.min(1, Math.max(0, num(data.toilet?.dirt, 0))),
  };
  state.stains = (Array.isArray(data.stains) ? data.stains : [])
    .filter(st => st && typeof st.id === 'string' && ['wall-back', 'wall-left', 'wall-right', 'floor'].includes(st.surface) && st.dirt > 0)
    .map(st => ({ id: st.id, surface: st.surface, look: st.look === 'puddle' ? 'puddle' : 'splat', u: num(st.u, 0), v: num(st.v, 1), size: num(st.size, 0.3), turn: num(st.turn, 0), dirt: Math.min(1, st.dirt) }));
  state.overflowStreak = num(data.overflowStreak, 0);
  state.newItems = Array.isArray(data.newItems) ? data.newItems.filter(x => typeof x === 'string') : [];
  // Voorraad: alleen bekende middelen, nooit meer dan er in een nieuwe zit. "Gekocht" volgt de voorraad.
  state.supplies = {};
  for (const c of CLEANERS) {
    const left = Math.min(c.uses, Math.floor(num(data.supplies?.[c.id], 0)));
    if (left > 0) { state.supplies[c.id] = left; state.purchased.add(c.id); } else state.purchased.delete(c.id);
  }
  // Geluid (punt 106): per groep aan/uit en volume, plus de hoofdschakelaar. Oudere opslag had één schakelaar
  // en één volume (punt 96): "uit" wordt "alle geluid uit", het volume geldt voor de effecten; de muziek
  // krijgt zijn standaard. Nog oudere opslag heeft niets en krijgt de standaard.
  const old = data.sound || {}, base = soundDefaults();
  state.sound = {
    muted: typeof old.muted === 'boolean' ? old.muted : old.on === false,
    groups: Object.fromEntries(SOUND_GROUPS.map(g => {
      const own = old.groups?.[g.id] || {};
      const legacy = g.id !== 'music' && Number.isFinite(old.volume) ? old.volume : base.groups[g.id].volume;
      return [g.id, { on: typeof own.on === 'boolean' ? own.on : base.groups[g.id].on, volume: Math.min(1, Math.max(0, num(own.volume, legacy))) }];
    })),
  };
  if (data.profile && typeof data.profile === 'object') {
    state.profile = {
      name: String(data.profile.name || '').slice(0, NAME_MAX),      // leeg = "Gast" in de gekozen taal
      avatar: AVATARS.includes(data.profile.avatar) ? data.profile.avatar : DEFAULT_PROFILE.avatar,
      mode: 'guest',
      createdAt: data.profile.createdAt || null,
    };
  }
  return state;
}
