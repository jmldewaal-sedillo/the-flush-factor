// Algemene spelinstellingen. Alles wat je wilt bijstellen zonder code te lezen staat hier.

// Datum van de laatste wijziging van de privacyverklaring (JJJJ-MM-DD). Pas hem aan samen met de tekst
// in js/i18n/legal/.
export const PRIVACY_DATE = '2026-10-12';
export const APP_NAME = 'The Flush Factor';
export const APP_SHORT_NAME = 'FlushFactor';

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

// Soorten verstoppingen (punt 113). Welke soorten op een level voorkomen, en hoe vaak: LEVELS (kinds).
// rise: hoe snel het water stijgt (× het level), power: hoeveel gereedschap uithaalt (× zijn kracht),
// bonus: × de ontstopbonus, double: na het oplossen volgt meteen een tweede verstopping.
export const CLOG_KINDS = {
  normal:   { rise: 1,   power: 1,   bonus: 1 },
  fast:     { rise: 1.5, power: 1,   bonus: 1.5 },
  stubborn: { rise: 1,   power: 0.5, bonus: 2 },
  double:   { rise: 1,   power: 1,   bonus: 1, double: true },
  mega:     { rise: 1.3, power: 0.5, bonus: 3 },
};
export const DOUBLE_FOLLOW_UP_MS = 1500;   // zo lang na het oplossen komt de tweede verstopping van een dubbele

// Spitsuur (punt 114): af en toe een halve minuut alle hens aan dek. Punten ×2, veel meer verstoppingen;
// wie het zonder overlopen doorstaat krijgt een bonus.
export const RUSH = {
  fromLevel: 3,
  everyMs: [240000, 360000],    // tijd tussen twee spitsuren (willekeurig daartussen, alleen speeltijd)
  firstMs: 90000,               // het eerste spitsuur na het bereiken van level 3 (of na het starten)
  durationMs: 30000,
  pointsFactor: 2,
  chanceFactor: 3,              // × de kans op een verstopping
  minTimeFactor: 0.35,          // × de minimale tijd tussen verstoppingen
  bonusPerLevel: 150,           // bonus = dit × level, alleen zonder overlopen
};

// Gereedschap verbeteren (punt 115). Werkend gereedschap uit de winkel kan drie keer verbeterd worden.
// Ster n komt vrij op level max(levels[n-1], minLevel + n); de prijzen staan per gereedschap in tools.js.
export const UPGRADE = {
  levels: [5, 9, 13],
  power: 0.2,                   // +20% kracht per ster
  cooldown: 0.15,               // −15% afkoeltijd per ster
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
  flushPointsPerLevel: 0.05,         // +5% punten per spoelbeurt per level boven 1 (level 15: ×1,7)
  comboWindowMs: 3000,
  comboStep: 0.25,
  comboMax: 2,
  unclogBonus: 30,                  // × hetzelfde levelvoordeel als spoelen, × de bonus van de soort verstopping (CLOG_KINDS)
  bucketFullPenalty: 30,
  overflowPenaltyPct: 0.1,
  overflowPenaltyMaxPerLevel: 250,   // maximale straf = dit × level
};

// Intensiteit van 3D-effecten per kwaliteitsniveau (punt 54).
export const EFFECTS = {
  low:    { bubbles: 6,  splashes: 8,  shake: 0.5, puddle: true, shadows: false, antialias: false, maxDpr: 1 },
  medium: { bubbles: 14, splashes: 18, shake: 1.0, puddle: true, shadows: true,  antialias: true,  maxDpr: 1.5 },
  high:   { bubbles: 22, splashes: 30, shake: 1.0, puddle: true, shadows: true,  antialias: true,  maxDpr: 2 },
};
