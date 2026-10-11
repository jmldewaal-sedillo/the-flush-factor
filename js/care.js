// Schoonmaak en reparatie (punten 80 en 83): staat van het toilet, vlekken op muren en vloer,
// wat er gebeurt bij herhaald overlopen, en wat vies zijn kost. Alleen logica: geen DOM, geen 3D.
import { CARE, CLEANERS, DEFECTS, REPAIRS } from './data/care.js';
import { ROOM } from './data/room.js';

// Waar vlekken mogen komen, per oppervlak: [u-min, u-max, v-min, v-max] in meters.
// Muren: u = langs de muur, v = hoogte. Vloer: u = links/rechts (x), v = van achterwand naar voren (z).
const W = ROOM.width / 2;
const STAIN_AREAS = {
  'wall-back':  [-W + 0.2, W - 0.2, 0.9, 2.1],
  'wall-left':  [0.35, ROOM.depth - 0.45, 0.6, 2.0],
  'wall-right': [0.9, ROOM.depth - 0.45, 1.0, 2.0],
  floor:        [-W + 0.2, 0.1, 0.8, ROOM.depth - 0.4],
};
const WALLS = ['wall-back', 'wall-left', 'wall-right'];
const rand = (a, b) => a + Math.random() * (b - a);

export class CareSystem {
  constructor(state) {
    this.state = state;
    this.clogOverflows = 0;      // hoe vaak de huidige verstopping al is overgelopen
  }

  // ── toestand ──
  isBroken() { return Object.values(this.state.toilet.defects).some(Boolean); }
  isToiletDirty() { return this.state.toilet.dirt > 0; }
  dirtCount() { return this.state.stains.length + (this.isToiletDirty() ? 1 : 0); }
  // Deel van de punten dat je per spoelbeurt overhoudt (1 = alles).
  pointsFactor() { return 1 - Math.min(CARE.maxPenalty, this.dirtCount() * CARE.penaltyPerDirt); }
  clogFactor() { return this.isBroken() ? CARE.brokenClogFactor : 1; }
  ownedCleaners() { return CLEANERS.filter(c => this.state.purchased.has(c.id)); }

  // ── repareren ──
  // → defect-id dat hersteld is, of null als het niet (meer) nodig was
  repair(repairId) {
    const def = REPAIRS.find(r => r.id === repairId);
    if (!def || !DEFECTS[def.fixes] || !this.state.toilet.defects[def.fixes]) return null;
    this.state.toilet.defects[def.fixes] = false;
    return def.fixes;
  }

  // ── schoonmaken ──
  // target: { kind: 'toilet' } of { kind: 'stain', id }
  // → { result: 'cleaned' | 'cleaner' | 'wrong-tool' | 'nothing', surface, dirt, id? }
  scrub(cleanerId, target) {
    const cleaner = CLEANERS.find(c => c.id === cleanerId && this.state.purchased.has(c.id));
    if (!cleaner) return { result: 'nothing' };
    if (target.kind === 'toilet') {
      if (!this.isToiletDirty()) return { result: 'nothing', surface: 'toilet' };
      if (!cleaner.targets.includes('toilet')) return { result: 'wrong-tool', surface: 'toilet' };
      const dirt = Math.max(0, +(this.state.toilet.dirt - cleaner.power).toFixed(3));
      this.state.toilet.dirt = dirt < 0.02 ? 0 : dirt;
      return { result: this.state.toilet.dirt === 0 ? 'cleaned' : 'cleaner', surface: 'toilet', dirt: this.state.toilet.dirt };
    }
    const stain = this.state.stains.find(s => s.id === target.id);
    if (!stain) return { result: 'nothing' };
    const surface = stain.surface === 'floor' ? 'floor' : 'wall';
    if (!cleaner.targets.includes(surface)) return { result: 'wrong-tool', surface };
    const dirt = Math.max(0, +(stain.dirt - cleaner.power).toFixed(3));
    stain.dirt = dirt < 0.02 ? 0 : dirt;
    if (stain.dirt === 0) this.state.stains = this.state.stains.filter(s => s !== stain);
    return { result: stain.dirt === 0 ? 'cleaned' : 'cleaner', surface, dirt: stain.dirt, id: stain.id };
  }

  // ── overlopen ──
  onClogStart() { this.clogOverflows = 0; }

  // → { puddle: stain | null, mess: [stain] } — wat er door dit overlopen bij is gekomen
  onOverflow() {
    this.clogOverflows++;
    const added = { puddle: null, mess: [] };
    if (this.clogOverflows === 1) {
      // Eerste keer overlopen van deze verstopping telt mee voor de reeks.
      this.state.overflowStreak++;
      if (this.state.overflowStreak >= CARE.overflowsForMess) {
        this.state.overflowStreak = 0;
        for (let i = 0; i < CARE.messStains.wall; i++) added.mess.push(this._addStain(WALLS[i % WALLS.length], 'splat'));
        for (let i = 0; i < CARE.messStains.floor; i++) added.mess.push(this._addStain('floor', 'splat'));
        added.mess = added.mess.filter(Boolean);
      }
    } else if (this.clogOverflows === CARE.overflowsForPuddle) {
      // Dezelfde verstopping loopt nog eens over: de vloer blijft nat en vies.
      added.puddle = this._addStain('floor', 'puddle');
    }
    return added;
  }

  // Een verstopping die zonder overlopen is opgelost breekt de reeks.
  onResolved() {
    if (this.clogOverflows === 0) this.state.overflowStreak = 0;
    this.clogOverflows = 0;
  }

  _addStain(surface, look) {
    if (this.state.stains.length >= CARE.maxStains) return null;
    const [u0, u1, v0, v1] = STAIN_AREAS[surface];
    const stain = {
      id: `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
      surface, look,
      u: +rand(u0, u1).toFixed(3), v: +rand(v0, v1).toFixed(3),
      size: +(look === 'puddle' ? rand(0.5, 0.65) : rand(0.26, 0.42)).toFixed(3),
      turn: +rand(0, 6.28).toFixed(2),
      dirt: 1,
    };
    this.state.stains.push(stain);
    return stain;
  }
}
