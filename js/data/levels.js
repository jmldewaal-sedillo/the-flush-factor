// Levels: drempel in punten + moeilijkheid van verstoppingen. Namen: taalbestanden, sleutels level.<n>.
export const LEVELS = [
  { level: 1, minScore: 0, waterRiseRate: 6, maxChance: 0.05, minTimeBetweenClogs: 15000 },
  { level: 2, minScore: 200, waterRiseRate: 7.5, maxChance: 0.065, minTimeBetweenClogs: 13000 },
  { level: 3, minScore: 600, waterRiseRate: 9, maxChance: 0.08, minTimeBetweenClogs: 11000 },
  { level: 4, minScore: 1500, waterRiseRate: 11, maxChance: 0.10, minTimeBetweenClogs: 9000  },
  { level: 5, minScore: 4000, waterRiseRate: 14, maxChance: 0.12, minTimeBetweenClogs: 7000  },
];
