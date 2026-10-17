// Gereedschap: bezit, cooldowns, gebruik en ontdekking (werkt / chaos). Geen DOM, geen 3D.
import { TOOLS } from './data/tools.js';
import { toolStats, upgradeTier } from './upgrades.js';

export class InventorySystem {
  constructor(state, clog) {
    this.state = state;
    this.clog = clog;
    this.tools = [];
    TOOLS.forEach(def => { if (state.ownedTools.includes(def.id)) this._add(def); });
  }

  // Verbeterd gereedschap (punt 115) heeft meer kracht en een kortere afkoeltijd.
  _add(def) {
    const stars = this.state.toolUpgrades[def.id] || 0;
    this.tools.push({ ...def, ...toolStats(def, stars), stars, cooldownRemaining: 0, discovered: this.state.toolDiscovery[def.id] || null });
  }

  // Volgende ster. Prijs en level controleert de winkel.
  upgrade(id) {
    const tool = this.get(id), def = TOOLS.find(t => t.id === id);
    const stars = (this.state.toolUpgrades[id] || 0) + 1;
    if (!tool || !upgradeTier(def, stars)) return false;
    this.state.toolUpgrades[id] = stars;
    Object.assign(tool, toolStats(def, stars), { stars });
    tool.cooldownRemaining = Math.min(tool.cooldownRemaining, tool.cooldown);
    return true;
  }

  addTool(id) {
    const def = TOOLS.find(t => t.id === id);
    if (!def || this.get(id)) return false;
    this._add(def);
    this.state.ownedTools = this.tools.map(t => t.id);
    return true;
  }

  get(id) { return this.tools.find(t => t.id === id); }
  getAll() { return this.tools; }

  update(dt) {
    for (const t of this.tools) if (t.cooldownRemaining > 0) t.cooldownRemaining = Math.max(0, t.cooldownRemaining - dt);
  }

  // 0 = klaar voor gebruik, 1 = net gebruikt
  cooldownPct(id) {
    const t = this.get(id);
    return t ? t.cooldownRemaining / t.cooldown : 0;
  }

  // Resultaat: 'cooldown' | 'not-clogged' | 'resolved' | 'partial' | 'chaos'
  use(id) {
    const tool = this.get(id);
    if (!tool) return null;
    if (tool.cooldownRemaining > 0) return 'cooldown';
    if (!this.clog.isClogged) return 'not-clogged';

    tool.cooldownRemaining = tool.cooldown;
    this.state.stats.toolsUsed++;
    if (!tool.discovered) {
      tool.discovered = tool.effect;
      this.state.toolDiscovery[tool.id] = tool.effect;
    }
    if (tool.effect === 'chaos') return 'chaos';
    return this.clog.resolve(tool.power) ? 'resolved' : 'partial';
  }
}
