// Iconen uit de lokale sprite (assets/icons/sprite.svg): Lucide + game-icons.net.
// De namen staan in tools/icons.config.json; nieuwe iconen toevoegen = daar een regel + `npm run icons`.
import { ICON_NAMES } from '../data/icon-credits.js';

const SPRITE = 'assets/icons/sprite.svg';
const known = new Set(ICON_NAMES);

/**
 * Een voortgangsbalk als HTML-string. De breedte gaat via een data-attribuut en daarna via de stijl van het
 * element (applyBars): de Content-Security-Policy verbiedt style-attributen in HTML (Sprint 16).
 */
export const bar = (pct, cls = '') => `<span class="bar ${cls}"><span class="bar-fill" data-fill="${Math.round(Math.min(100, Math.max(0, pct)))}"></span></span>`;
/** Zet de breedte van elke balk uit bar() onder root. Roep aan na elke innerHTML met een balk erin. */
export function applyBars(root) {
  root.querySelectorAll('.bar-fill[data-fill]').forEach(el => { el.style.width = `${el.dataset.fill}%`; });
}

/** HTML-string met het icoon. Onbekende naam → waarschuwing + neutraal icoon (nooit een leeg gat). */
export function icon(name, size = 24, cls = '') {
  if (!known.has(name)) {
    console.warn(`[iconen] onbekend icoon: ${name}`);
    name = 'info';
  }
  return `<svg class="ic ${cls}" width="${size}" height="${size}" aria-hidden="true"><use href="${SPRITE}#${name}"/></svg>`;
}
