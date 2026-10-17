// Levels: drempel in punten (alles wat je ooit verdiend hebt) + moeilijkheid. Namen: taalbestanden, sleutels level.<n>.
// waterRiseRate: % per seconde tijdens een verstopping; maxChance: hoogste kans per seconde op een verstopping;
// minTimeBetweenClogs: ms; kinds: hoe vaak elke soort verstopping voorkomt (gewichten, zie CLOG_KINDS in config.js).
// Na een wijziging: npm run balans (zie docs/puntenbalans.md).
export const LEVELS = [
  { level: 1,  minScore: 0,       waterRiseRate: 6,    maxChance: 0.05,  minTimeBetweenClogs: 15000, kinds: { normal: 1 } },
  { level: 2,  minScore: 2500,    waterRiseRate: 7.5,  maxChance: 0.065, minTimeBetweenClogs: 13000, kinds: { normal: 1 } },
  { level: 3,  minScore: 9000,    waterRiseRate: 9,    maxChance: 0.08,  minTimeBetweenClogs: 11000, kinds: { normal: 85, fast: 15 } },
  { level: 4,  minScore: 25000,   waterRiseRate: 10,   maxChance: 0.09,  minTimeBetweenClogs: 10000, kinds: { normal: 70, fast: 15, stubborn: 15 } },
  { level: 5,  minScore: 50000,   waterRiseRate: 11,   maxChance: 0.10,  minTimeBetweenClogs: 9000,  kinds: { normal: 60, fast: 20, stubborn: 20 } },
  { level: 6,  minScore: 95000,   waterRiseRate: 12,   maxChance: 0.11,  minTimeBetweenClogs: 8500,  kinds: { normal: 50, fast: 20, stubborn: 20, double: 10 } },
  { level: 7,  minScore: 155000,  waterRiseRate: 12.5,   maxChance: 0.12,  minTimeBetweenClogs: 8000,  kinds: { normal: 45, fast: 20, stubborn: 20, double: 15 } },
  { level: 8,  minScore: 240000,  waterRiseRate: 13,   maxChance: 0.13,  minTimeBetweenClogs: 7500,  kinds: { normal: 40, fast: 20, stubborn: 25, double: 15 } },
  { level: 9,  minScore: 340000,  waterRiseRate: 13.5,   maxChance: 0.14,  minTimeBetweenClogs: 7000,  kinds: { normal: 35, fast: 20, stubborn: 25, double: 15, mega: 5 } },
  { level: 10, minScore: 480000,  waterRiseRate: 14,   maxChance: 0.15,  minTimeBetweenClogs: 6500,  kinds: { normal: 30, fast: 20, stubborn: 25, double: 15, mega: 10 } },
  { level: 11, minScore: 660000,  waterRiseRate: 14.5,   maxChance: 0.16,  minTimeBetweenClogs: 6000,  kinds: { normal: 25, fast: 20, stubborn: 25, double: 18, mega: 12 } },
  { level: 12, minScore: 860000,  waterRiseRate: 15,   maxChance: 0.17,  minTimeBetweenClogs: 5500,  kinds: { normal: 20, fast: 22, stubborn: 25, double: 18, mega: 15 } },
  { level: 13, minScore: 1090000,  waterRiseRate: 16,   maxChance: 0.18,  minTimeBetweenClogs: 5000,  kinds: { normal: 18, fast: 22, stubborn: 25, double: 18, mega: 17 } },
  { level: 14, minScore: 1380000, waterRiseRate: 17,   maxChance: 0.19,  minTimeBetweenClogs: 4500,  kinds: { normal: 15, fast: 22, stubborn: 25, double: 18, mega: 20 } },
  { level: 15, minScore: 1770000, waterRiseRate: 18,   maxChance: 0.20,  minTimeBetweenClogs: 4000,  kinds: { normal: 12, fast: 22, stubborn: 25, double: 18, mega: 23 } },
];
