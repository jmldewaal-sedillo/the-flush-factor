// ============================================================
// THE FLUSH FACTOR — clog.js
// Verstoppingssysteem: kans, waterstand, overloop.
// Pas CLOG_CONFIG aan om het spel moeilijker/makkelijker te maken.
// ============================================================

export const CLOG_CONFIG = {
  // Kans per seconde dat een verstopping optreedt (basis)
  baseChancePerSecond: 0.008,
  // Extra kans per minuut speeltijd (oploopend gevaar)
  extraChancePerMinute: 0.004,
  // Maximum totale kans per seconde
  maxChancePerSecond: 0.05,
  // Minimale tijd (ms) tussen twee verstoppingen
  minTimeBetweenClogs: 15000,
  // Water stijgt X% per seconde als verstopt
  waterRiseRate: 6,
  // Water daalt X% per seconde als niet verstopt
  waterDrainRate: 8,
  // Overloop treedt op bij X%
  overflowThreshold: 100,
  // Seconden dat overloopstraf actief is
  overflowDuration: 2.5,
  // Startwaarde waterstand bij nieuwe verstopping
  clogStartWaterLevel: 15,
};

export class ClogSystem {
  constructor(config = CLOG_CONFIG) {
    this.cfg = config;
    this.isClogged = false;
    this.waterLevel = 0;          // 0–100
    this.isOverflowing = false;
    this.overflowTimer = 0;
    this.timeSinceLastClog = 0;   // ms
    this.totalPlaytime = 0;       // ms
    this._listeners = {};
  }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  update(dt) {
    this.totalPlaytime += dt;
    const dtSec = dt / 1000;

    if (this.isOverflowing) {
      this.overflowTimer -= dt;
      if (this.overflowTimer <= 0) {
        this.isOverflowing = false;
        this.waterLevel = 60;
        // Verstopping blijft, maar we geven de speler een kans
      }
      return;
    }

    if (this.isClogged) {
      this.waterLevel = Math.min(100, this.waterLevel + this.cfg.waterRiseRate * dtSec);
      if (this.waterLevel >= this.cfg.overflowThreshold) {
        this._triggerOverflow();
      }
    } else {
      this.waterLevel = Math.max(0, this.waterLevel - this.cfg.waterDrainRate * dtSec);
      this.timeSinceLastClog += dt;

      if (this.timeSinceLastClog >= this.cfg.minTimeBetweenClogs) {
        const chance = this._calcChance(dtSec);
        if (Math.random() < chance) {
          this._triggerClog();
        }
      }
    }
  }

  _calcChance(dtSec) {
    const minutes = this.totalPlaytime / 60000;
    const extra = Math.min(
      this.cfg.maxChancePerSecond - this.cfg.baseChancePerSecond,
      minutes * this.cfg.extraChancePerMinute
    );
    return (this.cfg.baseChancePerSecond + extra) * dtSec;
  }

  _triggerClog() {
    this.isClogged = true;
    this.timeSinceLastClog = 0;
    this.waterLevel = this.cfg.clogStartWaterLevel;
    this._emit('clog', null);
  }

  _triggerOverflow() {
    this.isOverflowing = true;
    this.overflowTimer = this.cfg.overflowDuration * 1000;
    this.waterLevel = 100;
    this._emit('overflow', null);
  }

  // Weg met de verstopping (gebruikt door gereedschap)
  resolve(waterReduction = 100) {
    this.waterLevel = Math.max(0, this.waterLevel - waterReduction);
    if (this.waterLevel <= 0) {
      this.isClogged = false;
      this.waterLevel = 0;
      this._emit('resolved', null);
      return true; // volledig opgelost
    }
    return false; // deels opgelost
  }

  // Forceer een verstopping (voor testen/debug)
  forceClog() {
    this._triggerClog();
  }
}
