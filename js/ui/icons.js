// Iconen uit de lokale sprite (assets/icons/sprite.svg): Lucide + game-icons.net.
// De namen staan in tools/icons.config.json; nieuwe iconen toevoegen = daar een regel + `npm run icons`.
import { ICON_NAMES } from '../data/icon-credits.js';

const SPRITE = 'assets/icons/sprite.svg';
const known = new Set(ICON_NAMES);

/** HTML-string met het icoon. Onbekende naam → waarschuwing + neutraal icoon (nooit een leeg gat). */
export function icon(name, size = 24, cls = '') {
  if (!known.has(name)) {
    console.warn(`[iconen] onbekend icoon: ${name}`);
    name = 'info';
  }
  return `<svg class="ic ${cls}" width="${size}" height="${size}" aria-hidden="true"><use href="${SPRITE}#${name}"/></svg>`;
}
