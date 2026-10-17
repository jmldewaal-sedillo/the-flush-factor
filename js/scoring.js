// Puntenregels (punt 61): combo, punten per spoelbeurt, bonus, straffen en level. Geen DOM, geen 3D.
// Gedeeld door het spel (js/game.js) en de balanssimulatie (tools/balans.mjs), zodat die altijd met
// dezelfde regels rekent. De getallen zelf staan in js/data/config.js (SCORING) en js/data/levels.js.
import { SCORING, CLOG_KINDS } from './data/config.js';
import { LEVELS } from './data/levels.js';

// Combo na een spoelbeurt: sneller dan het venster = hoger, anders zakt hij weer.
export const nextCombo = (combo, msSinceLast) => msSinceLast < SCORING.comboWindowMs
  ? Math.min(combo + SCORING.comboStep, SCORING.comboMax)
  : Math.max(1, combo - SCORING.comboStep);

// factor: deel dat je overhoudt als het vies is (care.pointsFactor()) en × 2 in het spitsuur. Hoger level = meer per beurt.
const levelFactor = level => 1 + SCORING.flushPointsPerLevel * (level - 1);
export const flushPoints = (combo, factor = 1, level = 1) =>
  Math.max(1, Math.round(SCORING.flushPoints * levelFactor(level) * combo * factor));

// Moeilijkere soorten verstopping (punt 113) leveren meer op.
export const unclogBonus = (level, kind = 'normal') => Math.round(SCORING.unclogBonus * levelFactor(level) * (CLOG_KINDS[kind]?.bonus ?? 1));

export const overflowPenalty = (score, level = 1) => Math.round(Math.min(score * SCORING.overflowPenaltyPct, SCORING.overflowPenaltyMaxPerLevel * level));

// Het level volgt uit alle punten die je ooit verdiend hebt, niet uit je saldo: uitgeven kost geen voortgang.
export const levelFor = earned => LEVELS.filter(l => earned >= l.minScore).pop();
