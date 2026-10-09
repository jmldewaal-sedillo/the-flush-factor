// Algemene spelinstellingen. Alles wat je wilt bijstellen zonder code te lezen staat hier.

export const SAVE_KEY = 'flushfactor_v1';

// Verstoppingen (basiswaarden; per level overschreven door LEVELS).
export const CLOG_CONFIG = {
  baseChancePerSecond: 0.008,   // kans per seconde op een verstopping
  extraChancePerMinute: 0.004,  // extra kans per minuut speeltijd
  maxChancePerSecond: 0.05,
  minTimeBetweenClogs: 15000,   // ms
  waterRiseRate: 6,             // % per seconde tijdens verstopping
  waterDrainRate: 8,            // % per seconde als het toilet vrij is
  overflowThreshold: 100,
  overflowDuration: 2.5,        // seconden
  clogStartWaterLevel: 15,
};

// Waterfases tijdens een verstopping (drempel in % waterstand).
export const WATER_PHASES = [
  { id: 'ok',     from: 0,  color: '#3aade0', water: 0x8fd8f2 },
  { id: 'yellow', from: 1,  color: '#f2c94c', water: 0xb9b36a },
  { id: 'orange', from: 45, color: '#f2994a', water: 0xa8843e },
  { id: 'red',    from: 75, color: '#e63946', water: 0x8a5a2b },
];

export const SCORING = {
  flushPoints: 10,
  comboWindowMs: 1800,
  comboStep: 0.5,
  comboMax: 8,
  unclogBonusPerLevel: 20,
  bucketFullPenalty: 30,
  overflowPenaltyPct: 0.1,
  overflowPenaltyMax: 100,
};

// Intensiteit van 3D-effecten per kwaliteitsniveau (punt 54).
export const EFFECTS = {
  low:    { bubbles: 6,  splashes: 8,  shake: 0.5, puddle: true, shadows: false, antialias: false, maxDpr: 1 },
  medium: { bubbles: 14, splashes: 18, shake: 1.0, puddle: true, shadows: true,  antialias: true,  maxDpr: 1.5 },
  high:   { bubbles: 22, splashes: 30, shake: 1.0, puddle: true, shadows: true,  antialias: true,  maxDpr: 2 },
};
