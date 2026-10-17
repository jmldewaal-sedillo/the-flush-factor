#!/usr/bin/env node
// Balanssimulatie (punt 61): speelt het spel na met de echte regels en getallen uit js/data/ en
// js/scoring.js, en meet hoe lang het duurt tot elk level en tot alles gekocht is.
//
//   node tools/balans.mjs            → overzicht voor drie soorten spelers
//   node tools/balans.mjs --items    → plus per item: hoeveel minuten spelen het kost
//   --runs=5                          → minder potjes (sneller, minder precies)
//   npm run balans                    → hetzelfde als --items
//
// De test tests/balans.spec.js gebruikt runBalance() en bewaakt de streefwaarden (zie docs/puntenbalans.md).
//
// Wat de nagespeelde speler doet: tikt op Spoelen met een vast tempo zolang het toilet vrij is, pakt bij
// een verstopping na een korte reactietijd het beste werkende gereedschap dat klaar is, leegt de emmer
// als hij vol is, en spaart in een vaste volgorde: eerst repareren en het toilet schoonmaken, dan werkend
// gereedschap en sterren (punt 115), daarna de rest van goedkoop naar duur. Chaos-gereedschap gebruikt hij niet.
// Soorten verstoppingen (punt 113) en het spitsuur (punt 114) spelen mee; hij stopt na 15 levels en alles gekocht.
// Het is een schatting om getallen te vergelijken, geen voorspelling van echte spelers.
import { ClogSystem } from '../js/clog.js';
import { LEVELS } from '../js/data/levels.js';
import { TOOLS, STARTING_TOOLS } from '../js/data/tools.js';
import { REPAIRS, CLEANERS, CARE } from '../js/data/care.js';
import { CATALOG } from '../js/data/catalog.js';
import { CLOG_PROPS } from '../js/data/clog-props.js';
import { BUCKETS } from '../js/data/buckets.js';
import { nextCombo, flushPoints, unclogBonus, overflowPenalty, levelFor } from '../js/scoring.js';
import { RushSystem } from '../js/rush.js';
import { canUpgrade, upgradeTier, toolStats } from '../js/upgrades.js';
import { pathToFileURL } from 'node:url';

export const PLAYERS = [
  { name: 'rustig (tikt elke 2,5 s)', tap: 2500, reaction: 2500 },
  { name: 'gemiddeld (elke 1,2 s)', tap: 1200, reaction: 1500 },
  { name: 'fanatiek (zo snel als het kan)', tap: 700, reaction: 800 },
];
const STEP = 100;                       // ms per stap
const MAX_MIN = 3000;                   // stop na 50 uur speeltijd
const RUNS = 20;                        // gemiddelde over zoveel potjes (verstoppingen zijn willekeurig)
const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

// Alles wat te koop is, plus de sterren van het gereedschap (punt 115) als losse "items".
const UPGRADES = TOOLS.filter(canUpgrade).flatMap(def => [1, 2, 3].map(n => {
  const tier = upgradeTier(def, n);
  return { id: `${def.id}*${n}`, tool: def.id, stars: n, price: tier.price, minLevel: tier.level };
}));
const ITEMS = [...CATALOG, ...UPGRADES];
const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// Koopvolgorde: eerst repareren en het toilet schoon (vies en kapot kosten punten en verstoppingen),
// dan werkend gereedschap en sterren (op volgorde van level, dan prijs), daarna de rest van goedkoop naar duur.
// De speler spaart voor het eerste item dat al te koop is; wat nog op slot zit slaat hij over. Schoonmaakmiddelen tellen één keer.
const working = [...TOOLS.filter(t => !t.starting && t.effect === 'working'), ...UPGRADES]
  .sort((a, b) => (a.minLevel || 1) - (b.minLevel || 1) || a.price - b.price).map(t => t.id);
const first = [...REPAIRS.map(r => r.id), 'toilet-brush', ...working];
const rest = ITEMS.filter(i => !first.includes(i.id)).sort((a, b) => a.price - b.price).map(i => i.id);
const ORDER = [...first, ...rest];

export function simulate(player) {
  const clog = new ClogSystem();
  const rush = new RushSystem();
  let t = 0, score = 0, earned = 0, level = 1, combo = 1, lastFlush = -1e9, nextTap = 0, clogSince = null;
  let toiletDirty = true, bucketLiters = 0, overflows = 0, rushes = 0, survived = 0;
  const owned = new Set();
  const bucketCap = () => Math.max(...BUCKETS.filter(b => owned.has(b.id) || b.price === 0).map(b => b.liters));
  const tools = STARTING_TOOLS.filter(x => x.effect === 'working').map(x => ({ ...x, cd: 0 }));
  const ovAt = {}, levelAt = { 1: 0 }, boughtAt = {}, earnedAt = { 1: 0 }, rate = {};   // rate: punten per minuut per level
  const add = pts => { score += pts; earned += pts; };
  clog.setLevel(LEVELS[0]);
  clog.chanceFactor = CARE.brokenClogFactor;
  clog.on('clog', () => { clogSince = t; });
  clog.on('overflow', () => { overflows++; ovAt[level] = (ovAt[level] || 0) + 1; rush.onOverflow(); score = Math.max(0, score - overflowPenalty(score, level)); });
  clog.on('resolved', ({ kind }) => {
    add(unclogBonus(level, kind));
    combo = Math.max(1, combo - 1);
    const prop = CLOG_PROPS[Math.floor(Math.random() * CLOG_PROPS.length)];
    if (bucketLiters + prop.liters > bucketCap()) bucketLiters = 0;    // speler leegt de emmer
    bucketLiters += prop.liters;
    clogSince = null;
  });
  rush.on('start', () => { clog.rush = true; rushes++; });
  rush.on('end', ({ survived: ok }) => { clog.rush = false; if (ok) { survived++; add(rush.bonus(level)); } });
  const closeLevel = () => { rate[level] = (earned - earnedAt[level]) / ((t - levelAt[level]) / 60000); };
  const allBought = () => owned.size >= ORDER.length;

  while (t < MAX_MIN * 60000 && !(allBought() && level >= MAX_LEVEL)) {
    clog.update(STEP);
    rush.update(STEP, level);
    tools.forEach(x => { x.cd = Math.max(0, x.cd - STEP); });
    if (clog.isClogged) {
      if (t - clogSince >= player.reaction) {
        const ready = tools.filter(x => x.cd === 0).sort((a, b) => b.power - a.power)[0];
        if (ready) { ready.cd = ready.cooldown; clog.resolve(ready.power); }
      }
    } else if (t >= nextTap) {
      combo = nextCombo(combo, t - lastFlush);
      lastFlush = t;
      add(flushPoints(combo, (toiletDirty ? 1 - CARE.penaltyPerDirt : 1) * rush.pointsFactor, level));
      nextTap = t + player.tap;
    }
    const cfg = levelFor(earned);
    if (cfg.level > level) {
      closeLevel();
      level = cfg.level; clog.setLevel(cfg); levelAt[level] = t; earnedAt[level] = earned;
    }
    // Sparen voor het eerste item in de volgorde dat al te koop is.
    for (const id of ORDER) {
      if (owned.has(id)) continue;
      const item = byId[id];
      if ((item.minLevel || 1) > level) continue;
      if (item.stars && !owned.has(item.tool)) continue;          // eerst het gereedschap zelf
      if (item.stars > 1 && !owned.has(`${item.tool}*${item.stars - 1}`)) continue;
      if (score < item.price) break;
      score -= item.price;
      owned.add(id);
      boughtAt[id] = t;
      if (REPAIRS.every(r => owned.has(r.id))) clog.chanceFactor = 1;
      if (id === 'toilet-brush') toiletDirty = false;
      const def = TOOLS.find(x => x.id === (item.tool || id));
      if (def && def.effect === 'working') {
        const stats = toolStats(def, item.stars || 0);
        const have = tools.find(x => x.id === def.id);
        if (have) Object.assign(have, stats); else tools.push({ ...def, ...stats, cd: 0 });
      }
      break;
    }
    t += STEP;
  }
  closeLevel();
  return { ovAt, owned, levelAt, boughtAt, rate, done: allBought() && level >= MAX_LEVEL ? t : null, overflows, rushes, survived };
}

const avg = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

// → per speler: { player, levels: { 2: ms, … }, done: ms | null, rate: { 1: punten/min, … }, items: { id: ms } }
export function runBalance(runs = RUNS) {
  return PLAYERS.map(player => {
    const all = Array.from({ length: runs }, () => simulate(player));
    const pick = f => avg(all.map(f).filter(x => x != null));
    return {
      player,
      levels: Object.fromEntries(LEVELS.slice(1).map(l => [l.level, pick(r => r.levelAt[l.level])])),
      done: all.every(r => r.done != null) ? pick(r => r.done) : null,
      rate: Object.fromEntries(LEVELS.map(l => [l.level, pick(r => r.rate[l.level])])),
      items: Object.fromEntries(ORDER.map(id => [id, pick(r => r.boughtAt[id])])),
      overflows: pick(r => r.overflows),
      rushes: pick(r => r.rushes), survived: pick(r => r.survived),
    };
  });
}

function report(withItems, runs = RUNS) {
  const results = runBalance(runs);
  const min = ms => ms == null ? '—' : (ms / 60000 < 10 ? (ms / 60000).toFixed(1) : Math.round(ms / 60000)).toString().replace('.', ',');
  const hours = ms => ms == null ? '—' : (ms / 3600000).toFixed(1).replace('.', ',') + ' u';
  const cols = results.map(r => r.player.name.split(' ')[0]);
  const row = (label, cells) => console.log([label.padEnd(16), ...cells.map(c => String(c).padStart(12))].join(''));
  console.log(`Speeltijd tot elk level en tot alles gekocht (gemiddelde van ${runs} potjes):\n`);
  row('', cols);
  for (const l of LEVELS.slice(1)) row(`level ${l.level}`, results.map(r => `${min(r.levels[l.level])} min`));
  row('alles + lv ' + MAX_LEVEL, results.map(r => hours(r.done)));
  console.log('\nPunten per minuut op elk level:\n');
  row('', cols);
  for (const l of LEVELS) row(`level ${l.level}`, results.map(r => Math.round(r.rate[l.level] || 0)));
  console.log('\nOverlopen en spitsuren (per potje):\n');
  row('', cols);
  row('overlopen', results.map(r => Math.round(r.overflows)));
  row('spitsuren', results.map(r => Math.round(r.rushes)));
  row('doorstaan', results.map(r => Math.round(r.survived)));
  if (!withItems) return;
  // Hoeveel minuten spelen een item kost: prijs gedeeld door wat je verdient op het level waarop het te koop komt.
  console.log('\nMinuten spelen per item (prijs ÷ punten per minuut op het level waarop het te koop komt):\n');
  console.log(['item'.padEnd(22), 'prijs'.padStart(7), 'level'.padStart(6), ...cols.map(c => c.padStart(11))].join(''));
  for (const it of [...ITEMS].sort((a, b) => (a.minLevel || 1) - (b.minLevel || 1) || a.price - b.price)) {
    const lv = it.minLevel || 1;
    console.log([it.id.padEnd(22), String(it.price).padStart(7), String(lv).padStart(6),
      ...results.map(r => (it.price / r.rate[lv]).toFixed(1).replace('.', ',').padStart(11))].join(''));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runs = Number(process.argv.find(a => a.startsWith('--runs='))?.slice(7)) || RUNS;
  report(process.argv.includes('--items'), runs);
}
