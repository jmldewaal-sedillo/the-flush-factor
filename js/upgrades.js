// Gereedschap verbeteren (punt 115): per ster meer kracht en een kortere afkoeltijd. Geen DOM.
// Gedeeld door het spel (inventory.js, shop.js) en de balanssimulatie (tools/balans.mjs).
import { UPGRADE } from './data/config.js';

export const MAX_STARS = UPGRADE.levels.length;
export const canUpgrade = def => def.effect === 'working' && Array.isArray(def.upgradePrices);

// Ster n (1–3): vanaf welk level en voor hoeveel punten. null als het niet kan.
export function upgradeTier(def, n) {
  if (!canUpgrade(def) || n < 1 || n > MAX_STARS) return null;
  return { stars: n, level: Math.max(UPGRADE.levels[n - 1], (def.minLevel || 1) + n), price: def.upgradePrices[n - 1] };
}

// Kracht en afkoeltijd met zoveel sterren.
export function toolStats(def, stars = 0) {
  if (!canUpgrade(def) || !stars) return { power: def.power, cooldown: def.cooldown };
  return {
    power: Math.round(def.power * (1 + UPGRADE.power * stars)),
    cooldown: Math.round(def.cooldown * (1 - UPGRADE.cooldown * stars)),
  };
}
