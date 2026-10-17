#!/usr/bin/env node
// Balanssimulatie (punt 61): speelt het spel na met de echte regels en getallen uit js/data/ en
// js/scoring.js, en meet hoe lang het duurt tot elk level en tot alles gekocht is.
//
//   node tools/balans.mjs            → overzicht voor drie soorten spelers
//   node tools/balans.mjs --items    → plus per item: hoeveel minuten spelen het kost
//   npm run balans                    → hetzelfde als --items
//
// De test tests/balans.spec.js gebruikt runBalance() en bewaakt de streefwaarden (zie docs/puntenbalans.md).
//
// Wat de nagespeelde speler doet: tikt op Spoelen met een vast tempo zolang het toilet vrij is, pakt bij
// een verstopping na een korte reactietijd het beste werkende gereedschap dat klaar is, leegt de emmer
// als hij vol is, en koopt in een vaste volgorde: eerst repareren en het toilet schoonmaken, dan het
// werkende gereedschap van goedkoop naar duur, daarna de rest van goedkoop naar duur. Chaos-gereedschap gebruikt hij niet.
// Het is een schatting om getallen te vergelijken, geen voorspelling van echte spelers.
import { ClogSystem } from '../js/clog.js';
import { LEVELS } from '../js/data/levels.js';
import { TOOLS, STARTING_TOOLS } from '../js/data/tools.js';
import { REPAIRS, CLEANERS, CARE } from '../js/data/care.js';
import { CATALOG } from '../js/data/catalog.js';
import { CLOG_PROPS } from '../js/data/clog-props.js';
import { BUCKETS } from '../js/data/buckets.js';
import { nextCombo, flushPoints, unclogBonus, overflowPenalty, levelFor } from '../js/scoring.js';
import { pathToFileURL } from 'node:url';

export const PLAYERS = [
  { name: 'rustig (tikt elke 2,5 s)', tap: 2500, reaction: 2500 },
  { name: 'gemiddeld (elke 1,2 s)', tap: 1200, reaction: 1500 },
  { name: 'fanatiek (zo snel als het kan)', tap: 700, reaction: 800 },
];
const STEP = 100;                       // ms per stap
const MAX_MIN = 600;                    // stop na 10 uur speeltijd
const RUNS = 20;                        // gemiddelde over zoveel potjes (verstoppingen zijn willekeurig)

// Koopvolgorde: eerst repareren en het toilet schoon (vies en kapot kosten punten en verstoppingen),
// dan werkend gereedschap (van goedkoop naar duur, zodra het te koop is), daarna de rest van goedkoop naar duur.
// Schoonmaakmiddelen tellen één keer.
const buyOrder = [
  ...REPAIRS.map(r => r.id), 'toilet-brush',
  ...TOOLS.filter(t => !t.starting && t.effect === 'working').sort((a, b) => a.price - b.price).map(t => t.id),
];
const rest = CATALOG.filter(i => !buyOrder.includes(i.id)).sort((a, b) => a.price - b.price).map(i => i.id);
const ORDER = [...buyOrder, ...rest];
const byId = Object.fromEntries(CATALOG.map(i => [i.id, i]));

function simulate(player) {
  const clog = new ClogSystem();
  let t = 0, score = 0, earned = 0, level = 1, combo = 1, lastFlush = -1e9, nextTap = 0, clogSince = null;
  let toiletDirty = true, bucketLiters = 0, overflows = 0;
  const owned = new Set();
  const bucketCap = () => Math.max(...BUCKETS.filter(b => owned.has(b.id) || b.price === 0).map(b => b.liters));
  const tools = STARTING_TOOLS.filter(x => x.effect === 'working').map(x => ({ ...x, cd: 0 }));
  const levelAt = { 1: 0 }, boughtAt = {}, earnedAt = { 1: 0 }, rate = {};   // rate: punten per minuut per level
  let next = 0;                          // index in ORDER
  const add = pts => { score += pts; earned += pts; };
  clog.setLevel(LEVELS[0]);
  clog.chanceFactor = CARE.brokenClogFactor;
  clog.on('clog', () => { clogSince = t; });
  clog.on('overflow', () => { overflows++; score = Math.max(0, score - overflowPenalty(score)); });
  clog.on('resolved', () => {
    add(unclogBonus(level));
    combo = Math.max(1, combo - 1);
    const prop = CLOG_PROPS[Math.floor(Math.random() * CLOG_PROPS.length)];
    if (bucketLiters + prop.liters > bucketCap()) bucketLiters = 0;    // speler leegt de emmer
    bucketLiters += prop.liters;
    clogSince = null;
  });
  const closeLevel = () => { rate[level] = (earned - earnedAt[level]) / ((t - levelAt[level]) / 60000); };

  while (t < MAX_MIN * 60000 && next < ORDER.length) {
    clog.update(STEP);
    tools.forEach(x => { x.cd = Math.max(0, x.cd - STEP); });
    if (clog.isClogged) {
      if (t - clogSince >= player.reaction) {
        const ready = tools.filter(x => x.cd === 0).sort((a, b) => b.power - a.power)[0];
        if (ready) { ready.cd = ready.cooldown; clog.resolve(ready.power); }
      }
    } else if (t >= nextTap) {
      combo = nextCombo(combo, t - lastFlush);
      lastFlush = t;
      add(flushPoints(combo, toiletDirty ? 1 - CARE.penaltyPerDirt : 1));
      nextTap = t + player.tap;
    }
    const cfg = levelFor(earned);
    if (cfg.level > level) {
      closeLevel();
      level = cfg.level; clog.setLevel(cfg); levelAt[level] = t; earnedAt[level] = earned;
    }
    // Kopen wat aan de beurt is (wacht op het level als het nog niet te koop is).
    while (next < ORDER.length) {
      const item = byId[ORDER[next]];
      if ((item.minLevel || 1) > level || score < item.price) break;
      score -= item.price;
      owned.add(item.id);
      boughtAt[item.id] = t;
      if (REPAIRS.every(r => owned.has(r.id))) clog.chanceFactor = 1;
      if (item.id === 'toilet-brush') toiletDirty = false;
      const tool = TOOLS.find(x => x.id === item.id);
      if (tool && tool.effect === 'working') tools.push({ ...tool, cd: 0 });
      next++;
    }
    t += STEP;
  }
  closeLevel();
  return { levelAt, boughtAt, rate, done: next >= ORDER.length ? t : null, overflows };
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
    };
  });
}

function report(withItems) {
  const results = runBalance();
  const min = ms => ms == null ? '—' : (ms / 60000 < 10 ? (ms / 60000).toFixed(1) : Math.round(ms / 60000)).toString().replace('.', ',');
  const cols = results.map(r => r.player.name.split(' ')[0]);
  console.log('Minuten speeltijd tot elk level en tot alles gekocht (gemiddelde van ' + RUNS + ' potjes):\n');
  console.log(['speler'.padEnd(32), ...LEVELS.slice(1).map(l => ('level ' + l.level).padStart(9)), 'alles'.padStart(9)].join(''));
  for (const r of results) console.log([r.player.name.padEnd(32), ...LEVELS.slice(1).map(l => min(r.levels[l.level]).padStart(9)), min(r.done).padStart(9)].join(''));
  console.log('\nPunten per minuut op elk level:\n');
  console.log(['level'.padEnd(8), ...cols.map(c => c.padStart(11))].join(''));
  for (const l of LEVELS) console.log([String(l.level).padEnd(8), ...results.map(r => String(Math.round(r.rate[l.level] || 0)).padStart(11))].join(''));
  if (!withItems) return;
  // Hoeveel minuten spelen een item kost: prijs gedeeld door wat je verdient op het level waarop het te koop komt.
  console.log('\nMinuten spelen per item (prijs ÷ punten per minuut op het level waarop het te koop komt):\n');
  console.log(['item'.padEnd(22), 'prijs'.padStart(7), 'level'.padStart(6), ...cols.map(c => c.padStart(11))].join(''));
  for (const it of [...CATALOG].sort((a, b) => (a.minLevel || 1) - (b.minLevel || 1) || a.price - b.price)) {
    const lv = it.minLevel || 1;
    console.log([it.id.padEnd(22), String(it.price).padStart(7), String(lv).padStart(6),
      ...results.map(r => (it.price / r.rate[lv]).toFixed(1).replace('.', ',').padStart(11))].join(''));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) report(process.argv.includes('--items'));
