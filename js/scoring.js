// Puntenregels (punt 61): combo, punten per spoelbeurt, bonus, straffen en level. Geen DOM, geen 3D.
// Gedeeld door het spel (js/game.js) en de balanssimulatie (tools/balans.mjs), zodat die altijd met
// dezelfde regels rekent. De getallen zelf staan in js/data/config.js (SCORING) en js/data/levels.js.
import { SCORING } from './data/config.js';
import { LEVELS } from './data/levels.js';

// Combo na een spoelbeurt: sneller dan het venster = hoger, anders zakt hij weer.
export const nextCombo = (combo, msSinceLast) => msSinceLast < SCORING.comboWindowMs
  ? Math.min(combo + SCORING.comboStep, SCORING.comboMax)
  : Math.max(1, combo - SCORING.comboStep);

// factor: deel dat je overhoudt als het vies is (care.pointsFactor()).
export const flushPoints = (combo, factor = 1) => Math.max(1, Math.round(SCORING.flushPoints * combo * factor));

export const unclogBonus = level => SCORING.unclogBonusPerLevel * level;

export const overflowPenalty = score => Math.round(Math.min(score * SCORING.overflowPenaltyPct, SCORING.overflowPenaltyMax));

// Het level volgt uit alle punten die je ooit verdiend hebt, niet uit je saldo: uitgeven kost geen voortgang.
export const levelFor = earned => LEVELS.filter(l => earned >= l.minScore).pop();
