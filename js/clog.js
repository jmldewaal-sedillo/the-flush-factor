// Verstoppingssysteem: kans, waterstand, overloop en soort verstopping (punt 113). Geen DOM, geen 3D.
import { CLOG_CONFIG, CLOG_KINDS, DOUBLE_FOLLOW_UP_MS, RUSH } from './data/config.js';

// Kies een soort uit gewichten ({ normal: 70, fast: 30 }); rnd: 0–1.
export function pickKind(weights = { normal: 1 }, rnd = Math.random()) {
  const entries = Object.entries(weights).filter(([id, w]) => CLOG_KINDS[id] && w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rnd * total;
  for (const [id, w] of entries) { if ((r -= w) < 0) return id; }
  return entries.length ? entries[entries.length - 1][0] : 'normal';
}

export class ClogSystem {
  constructor(config = CLOG_CONFIG) {
    this.cfg = { ...config };
    this.kinds = { normal: 1 };   // gewichten van het huidige level
    this.isClogged = false;
    this.kind = null;             // soort van de huidige verstopping
    this.waterLevel = 0;          // 0–100
    this.isOverflowing = false;
    this.overflowTimer = 0;
    this.timeSinceLastClog = 0;   // ms
    this.totalPlaytime = 0;       // ms
    this.followUp = 0;            // ms tot de tweede verstopping van een dubbele (0 = geen)
    this.paused = false;          // testen: geen willekeurige verstoppingen
    this.chanceFactor = 1;        // kapot toilet raakt sneller verstopt (zie care.js)
    this.rush = false;            // spitsuur (punt 114): veel meer verstoppingen
    this._listeners = {};
  }

  on(event, fn) { (this._listeners[event] ||= []).push(fn); }
  _emit(event, detail) { (this._listeners[event] || []).forEach(fn => fn(detail)); }

  get kindDef() { return CLOG_KINDS[this.kind] || CLOG_KINDS.normal; }

  update(dt) {
    this.totalPlaytime += dt;
    const dtSec = dt / 1000;

    if (this.isOverflowing) {
      this.overflowTimer -= dt;
      if (this.overflowTimer <= 0) {
        // De verstopping blijft, maar de speler krijgt een nieuwe kans.
        this.isOverflowing = false;
        this.waterLevel = 60;
      }
      return;
    }

    if (this.isClogged) {
      this.waterLevel = Math.min(100, this.waterLevel + this.cfg.waterRiseRate * this.kindDef.rise * dtSec);
      if (this.waterLevel >= this.cfg.overflowThreshold) this._triggerOverflow();
      return;
    }

    this.waterLevel = Math.max(0, this.waterLevel - this.cfg.waterDrainRate * dtSec);
    // De tweede helft van een dubbele verstopping komt altijd, ook als willekeurige verstoppingen uit staan.
    if (this.followUp > 0) {
      this.followUp -= dt;
      if (this.followUp <= 0) { this.followUp = 0; this._triggerClog('normal', true); }
      return;
    }
    this.timeSinceLastClog += dt;
    const minTime = this.cfg.minTimeBetweenClogs * (this.rush ? RUSH.minTimeFactor : 1);
    if (!this.paused && this.timeSinceLastClog >= minTime && Math.random() < this._chance(dtSec)) {
      this._triggerClog();
    }
  }

  _chance(dtSec) {
    const minutes = this.totalPlaytime / 60000;
    const extra = Math.min(this.cfg.maxChancePerSecond - this.cfg.baseChancePerSecond, minutes * this.cfg.extraChancePerMinute);
    return (this.cfg.baseChancePerSecond + extra) * dtSec * this.chanceFactor * (this.rush ? RUSH.chanceFactor : 1);
  }

  _triggerClog(kind = pickKind(this.kinds), second = false) {
    this.isClogged = true;
    this.kind = kind;
    this.second = second;         // de tweede van een dubbele: daarna geen derde
    this.timeSinceLastClog = 0;
    this.waterLevel = this.cfg.clogStartWaterLevel;
    this._emit('clog', { kind, second });
  }

  _triggerOverflow() {
    this.isOverflowing = true;
    this.overflowTimer = this.cfg.overflowDuration * 1000;
    this.waterLevel = 100;
    this._emit('overflow', { kind: this.kind });
  }

  // Gereedschap haalt `power` procent water weg (minder bij een hardnekkige); bij 0 is de verstopping opgelost.
  resolve(power = 100) {
    this.waterLevel = Math.max(0, this.waterLevel - power * this.kindDef.power);
    if (this.waterLevel > 0) return false;
    const kind = this.kind, second = this.second;
    this.isClogged = false;
    this.isOverflowing = false;
    this.kind = null;
    if (CLOG_KINDS[kind]?.double && !second) this.followUp = DOUBLE_FOLLOW_UP_MS;
    this._emit('resolved', { kind, followUp: this.followUp > 0 });
    return true;
  }

  setLevel(levelCfg) {
    if (!levelCfg) return;
    this.cfg.waterRiseRate = levelCfg.waterRiseRate;
    this.cfg.maxChancePerSecond = levelCfg.maxChance;
    this.cfg.minTimeBetweenClogs = levelCfg.minTimeBetweenClogs;
    this.kinds = levelCfg.kinds || { normal: 1 };
  }

  forceClog(kind = 'normal') { if (!this.isClogged) this._triggerClog(kind); }
}
