// Spelstand: standaardwaarden, opslaan/laden in localStorage en migratie van oude opslag.
import { SAVE_KEY } from './data/config.js';
import { BUCKETS, DEFAULT_BUCKET, LEGACY_DEFAULT_BUCKET, LEGACY_BUCKET_IDS } from './data/buckets.js';
import { CLOG_PROPS } from './data/clog-props.js';
import { DECORATIONS, DEFAULT_COSMETICS, LEGACY_COSMETICS, COSMETIC_LISTS } from './data/cosmetics.js';
import { STARTING_TOOLS, LEGACY_STARTING_TOOLS, TOOLS } from './data/tools.js';
import { DEFECTS } from './data/care.js';
import { AVATARS, DEFAULT_PROFILE, NAME_MAX } from './data/profile.js';

// Een nieuwe speler begint in een armoedig hokje (punt 79): kapot en vies toilet, roestige emmer,
// kale muur, vieze vloer, vier stuks gereedschap.
export function createState() {
  return {
    score: 0, highScore: 0, combo: 1, streak: 0, bestStreak: 0, level: 1,
    bucketId: DEFAULT_BUCKET,
    bucketItems: [],                    // [{ id: propId, liters }]
    cosmetics: { ...DEFAULT_COSMETICS },
    decor: {},                          // { anchorId: decorationId }
    purchased: new Set(),
    ownedTools: STARTING_TOOLS.map(t => t.id),
    toolDiscovery: {},                  // { toolId: 'working' | 'chaos' }
    stats: { totalFlushes: 0, totalClogs: 0, totalUnclogs: 0, totalLiters: 0, totalOverflows: 0, toolsUsed: 0 },
    profile: null,                      // { name, avatar, mode: 'guest', createdAt } — null = eerste start
    toilet: { defects: Object.fromEntries(Object.keys(DEFECTS).map(k => [k, true])), dirt: 1 },   // dirt 0–1
    stains: [],                         // vlekken op muren en vloer: { id, surface, look, u, v, size, turn, dirt }
    overflowStreak: 0,                  // verstoppingen achter elkaar die overliepen
    newItems: [],                       // net vrijgespeeld bij een level-up, nog niet bekeken in de winkel
    // niet opgeslagen:
    lastFlushTime: 0, isFlushing: false, currentProp: null,
  };
}

export const bucketDef = state => BUCKETS.find(b => b.id === state.bucketId) || BUCKETS[0];
export const bucketLiters = state => state.bucketItems.reduce((sum, it) => sum + it.liters, 0);

export function saveState(state) {
  const data = {
    version: 3,
    score: state.score, highScore: state.highScore, combo: state.combo,
    streak: state.streak, bestStreak: state.bestStreak, level: state.level,
    bucketId: state.bucketId, bucketItems: state.bucketItems,
    cosmetics: state.cosmetics, decor: state.decor,
    purchased: [...state.purchased], ownedTools: state.ownedTools,
    toolDiscovery: state.toolDiscovery, stats: state.stats, profile: state.profile,
    toilet: state.toilet, stains: state.stains, overflowStreak: state.overflowStreak, newItems: state.newItems,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* opslag vol of geblokkeerd */ }
}

// Oude opslag bewaarde mand-inhoud als icoonnaam; zet om naar voorwerp-id's.
const LEGACY_PROP_ICONS = { 'rubber-duck': 'duck', smartphone: 'phone', 'teddy-bear': 'teddy', lego: 'brick' };

function migrate(data) {
  return migrateV3(data.version >= 2 ? data : migrateV2(data));
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
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { data = null; }
  if (!data || typeof data !== 'object') return state;
  data = migrate(data);

  const num = (v, d) => (Number.isFinite(v) ? v : d);
  state.score = num(data.score, 0);
  state.highScore = num(data.highScore, 0);
  state.combo = num(data.combo, 1);
  state.streak = num(data.streak, 0);
  state.bestStreak = num(data.bestStreak, 0);
  state.level = num(data.level, 1);
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
  if (data.profile && typeof data.profile === 'object') {
    state.profile = {
      name: String(data.profile.name || DEFAULT_PROFILE.name).slice(0, NAME_MAX),
      avatar: AVATARS.includes(data.profile.avatar) ? data.profile.avatar : DEFAULT_PROFILE.avatar,
      mode: 'guest',
      createdAt: data.profile.createdAt || null,
    };
  }
  return state;
}
