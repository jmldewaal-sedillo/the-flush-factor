// Spitsuur (punt 114): af en toe een halve minuut met punten ×2 en veel meer verstoppingen. Wie het zonder
// overlopen doorstaat krijgt een bonus. Alleen logica en tijd; geen DOM. Gedeeld met tools/balans.mjs.
import { RUSH } from './data/config.js';

export class RushSystem {
  constructor(cfg = RUSH, rnd = Math.random) {
    this.cfg = cfg;
    this.rnd = rnd;
    this.active = false;
    this.remaining = 0;           // ms over in het lopende spitsuur
    this.untilNext = cfg.firstMs; // ms speeltijd tot het volgende
    this.overflowed = false;
    this._listeners = {};
  }

  on(event, fn) { (this._listeners[event] ||= []).push(fn); }
  _emit(event, detail) { (this._listeners[event] || []).forEach(fn => fn(detail)); }

  _interval() {
    const [a, b] = this.cfg.everyMs;
    return a + this.rnd() * (b - a);
  }

  get pointsFactor() { return this.active ? this.cfg.pointsFactor : 1; }
  bonus(level) { return this.cfg.bonusPerLevel * level; }

  update(dt, level) {
    if (level < this.cfg.fromLevel) return;
    if (this.active) {
      this.remaining -= dt;
      if (this.remaining <= 0) this.end();
      return;
    }
    this.untilNext -= dt;
    if (this.untilNext <= 0) this.start();
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.remaining = this.cfg.durationMs;
    this.overflowed = false;
    this._emit('start', { durationMs: this.cfg.durationMs });
  }

  end() {
    if (!this.active) return;
    this.active = false;
    this.remaining = 0;
    this.untilNext = this._interval();
    this._emit('end', { survived: !this.overflowed });
  }

  onOverflow() { if (this.active) this.overflowed = true; }
}
