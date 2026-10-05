// ============================================================
// THE FLUSH FACTOR — inventory.js
// Beheer van gereedschappen: gebruik, cooldown, ontdekking.
// ============================================================

import { TOOLS, PREMIUM_TOOLS, MESSAGES } from './items.js';

export class InventorySystem {
  constructor(gameState, clogSystem) {
    this.state = gameState;
    this.clog = clogSystem;
    this.tools = [];   // actieve tool-instanties
    this._chaosCleanupFns = [];
    this._initTools();
  }

  _initTools() {
    const savedDiscovery = this.state.toolDiscovery || {};
    const savedOwned = new Set(this.state.ownedTools || TOOLS.map(t => t.id));

    // Voeg alle startgereedschappen toe + gekochte premiums
    [...TOOLS, ...PREMIUM_TOOLS].forEach(def => {
      if (!savedOwned.has(def.id)) return;
      this.tools.push({
        ...def,
        cooldownRemaining: 0,    // ms
        discovered: savedDiscovery[def.id] || null,
      });
    });
  }

  addTool(id) {
    const def = PREMIUM_TOOLS.find(t => t.id === id);
    if (!def || this.tools.find(t => t.id === id)) return false;
    const savedDiscovery = this.state.toolDiscovery || {};
    this.tools.push({
      ...def,
      cooldownRemaining: 0,
      discovered: savedDiscovery[id] || null,
    });
    return true;
  }

  update(dt) {
    this.tools.forEach(t => {
      if (t.cooldownRemaining > 0) {
        t.cooldownRemaining = Math.max(0, t.cooldownRemaining - dt);
      }
    });
  }

  // Gebruik een tool. Geeft resultaat-string terug.
  use(id) {
    const tool = this.tools.find(t => t.id === id);
    if (!tool) return null;
    if (tool.cooldownRemaining > 0) return 'cooldown';

    const wasClogged = this.clog.isClogged;

    if (!wasClogged) {
      return 'not-clogged';
    }

    tool.cooldownRemaining = tool.cooldown;

    if (tool.effectType === 'working') {
      const resolved = this.clog.resolve(tool.effectiveness);
      if (!tool.discovered) {
        tool.discovered = 'working';
        this._saveDiscovery(tool.id, 'working');
      }
      return resolved ? 'resolved' : 'partial';
    } else {
      // Chaos!
      this._triggerChaos(tool.chaosEffect);
      if (!tool.discovered) {
        tool.discovered = 'chaos';
        this._saveDiscovery(tool.id, 'chaos');
      }
      return 'chaos';
    }
  }

  _saveDiscovery(id, type) {
    const d = this.state.toolDiscovery || {};
    d[id] = type;
    this.state.toolDiscovery = d;
  }

  // Geeft cooldown-percentage terug (0 = klaar, 1 = vol cooldown)
  cooldownPct(id) {
    const tool = this.tools.find(t => t.id === id);
    if (!tool) return 0;
    return tool.cooldownRemaining / tool.cooldown;
  }

  getAll() {
    return this.tools;
  }

  // ──────── CHAOS-EFFECTEN ────────
  _triggerChaos(effect) {
    // Ruim vorig chaos-effect op
    this._chaosCleanupFns.forEach(fn => fn());
    this._chaosCleanupFns = [];

    const scene = document.getElementById('bathroom-scene');
    if (!scene) return;

    switch (effect) {
      case 'ducks':   this._chaosDucks(scene); break;
      case 'confetti':this._chaosConfetti(scene); break;
      case 'flamingo':this._chaosFlamingo(scene); break;
      case 'disco':   this._chaosDisco(scene); break;
      case 'magic':   this._chaosMagic(scene); break;
      case 'elephant':this._chaosElephant(scene); break;
    }
  }

  _spawnEmoji(scene, emoji, count, durationMs, extraClass = '') {
    const els = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = `chaos-emoji ${extraClass}`;
      el.textContent = emoji;
      el.style.cssText = `
        position:absolute;
        font-size:${28 + Math.random() * 24}px;
        left:${5 + Math.random() * 85}%;
        top:${5 + Math.random() * 80}%;
        animation: chaosFloat ${0.8 + Math.random() * 1.2}s ease-in-out infinite alternate;
        animation-delay:${Math.random() * 0.5}s;
        pointer-events:none;
        z-index:20;
        user-select:none;
      `;
      scene.appendChild(el);
      els.push(el);
    }
    const timer = setTimeout(() => els.forEach(e => e.remove()), durationMs);
    this._chaosCleanupFns.push(() => { clearTimeout(timer); els.forEach(e => e.remove()); });
  }

  _chaosDucks(scene) {
    this._spawnEmoji(scene, '🦆', 9, 3000);
    const toilet = document.getElementById('toilet-wrapper');
    if (toilet) {
      toilet.classList.add('toilet-wiggle');
      const t = setTimeout(() => toilet.classList.remove('toilet-wiggle'), 1500);
      this._chaosCleanupFns.push(() => { clearTimeout(t); toilet.classList.remove('toilet-wiggle'); });
    }
  }

  _chaosConfetti(scene) {
    const colors = ['#ff4757','#ffa502','#2ed573','#1e90ff','#ff6b81','#eccc68'];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.style.cssText = `
        position:absolute;
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;
        top:-10px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation:confettiFall ${1 + Math.random() * 1.5}s ease-in forwards;
        animation-delay:${Math.random() * 0.8}s;
        pointer-events:none;
        z-index:20;
      `;
      scene.appendChild(el);
      this._chaosCleanupFns.push(() => el.remove());
    }
    setTimeout(() => {
      scene.querySelectorAll('[style*="confettiFall"]').forEach(e => e.remove());
    }, 3000);
  }

  _chaosFlamingo(scene) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      font-size:80px;
      left:50%;transform:translateX(-50%);
      bottom:80px;
      animation:flamingoBounce 0.5s ease-in-out infinite alternate;
      pointer-events:none;
      z-index:25;
      filter:drop-shadow(0 4px 8px rgba(255,20,147,0.5));
    `;
    el.textContent = '🦩';
    scene.appendChild(el);
    const t = setTimeout(() => el.remove(), 2500);
    this._chaosCleanupFns.push(() => { clearTimeout(t); el.remove(); });
  }

  _chaosDisco(scene) {
    const overlay = document.createElement('div');
    overlay.id = 'disco-overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;
      animation:discoFlash 0.2s linear infinite;
      pointer-events:none;
      z-index:15;
      border-radius:16px;
    `;
    scene.appendChild(overlay);
    const toilet = document.getElementById('toilet-wrapper');
    if (toilet) toilet.classList.add('toilet-disco');
    const t = setTimeout(() => {
      overlay.remove();
      if (toilet) toilet.classList.remove('toilet-disco');
    }, 3000);
    this._chaosCleanupFns.push(() => {
      clearTimeout(t); overlay.remove();
      if (toilet) toilet.classList.remove('toilet-disco');
    });
  }

  _chaosMagic(scene) {
    this._spawnEmoji(scene, '✨', 12, 2500);
    this._spawnEmoji(scene, '⭐', 6, 2500);
  }

  _chaosElephant(scene) {
    this._spawnEmoji(scene, '🐘', 1, 3000, 'elephant-big');
    this._spawnEmoji(scene, '💧', 10, 3000);
  }
}
