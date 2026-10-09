// Verstoppingssysteem: kans, waterstand, overloop. Geen DOM, geen 3D.
import { CLOG_CONFIG } from './data/config.js';

export class ClogSystem {
  constructor(config = CLOG_CONFIG) {
    this.cfg = { ...config };
    this.isClogged = false;
    this.waterLevel = 0;          // 0–100
    this.isOverflowing = false;
    this.overflowTimer = 0;
    this.timeSinceLastClog = 0;   // ms
    this.totalPlaytime = 0;       // ms
    this.paused = false;          // testen: geen willekeurige verstoppingen
    this._listeners = {};
  }

  on(event, fn) { (this._listeners[event] ||= []).push(fn); }
  _emit(event) { (this._listeners[event] || []).forEach(fn => fn()); }

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
      this.waterLevel = Math.min(100, this.waterLevel + this.cfg.waterRiseRate * dtSec);
      if (this.waterLevel >= this.cfg.overflowThreshold) this._triggerOverflow();
      return;
    }

    this.waterLevel = Math.max(0, this.waterLevel - this.cfg.waterDrainRate * dtSec);
    this.timeSinceLastClog += dt;
    if (!this.paused && this.timeSinceLastClog >= this.cfg.minTimeBetweenClogs && Math.random() < this._chance(dtSec)) {
      this._triggerClog();
    }
  }

  _chance(dtSec) {
    const minutes = this.totalPlaytime / 60000;
    const extra = Math.min(this.cfg.maxChancePerSecond - this.cfg.baseChancePerSecond, minutes * this.cfg.extraChancePerMinute);
    return (this.cfg.baseChancePerSecond + extra) * dtSec;
  }

  _triggerClog() {
    this.isClogged = true;
    this.timeSinceLastClog = 0;
    this.waterLevel = this.cfg.clogStartWaterLevel;
    this._emit('clog');
  }

  _triggerOverflow() {
    this.isOverflowing = true;
    this.overflowTimer = this.cfg.overflowDuration * 1000;
    this.waterLevel = 100;
    this._emit('overflow');
  }

  // Gereedschap haalt `power` procent water weg; bij 0 is de verstopping opgelost.
  resolve(power = 100) {
    this.waterLevel = Math.max(0, this.waterLevel - power);
    if (this.waterLevel > 0) return false;
    this.isClogged = false;
    this.isOverflowing = false;
    this._emit('resolved');
    return true;
  }

  setLevel(levelCfg) {
    if (!levelCfg) return;
    this.cfg.waterRiseRate = levelCfg.waterRiseRate;
    this.cfg.maxChancePerSecond = levelCfg.maxChance;
    this.cfg.minTimeBetweenClogs = levelCfg.minTimeBetweenClogs;
  }

  forceClog() { if (!this.isClogged) this._triggerClog(); }
}
