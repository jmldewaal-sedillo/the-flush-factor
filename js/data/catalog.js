// Alles wat te koop is, bij elkaar: voor "nieuw beschikbaar" bij een level-up en het uitgelichte item in de winkel.
import { SHOP_TOOLS } from './tools.js';
import { BUCKETS } from './buckets.js';
import { TOILETS, TILES, FLOORS, DECORATIONS } from './cosmetics.js';
import { REPAIRS, CLEANERS } from './care.js';

const tag = (list, category) => list.filter(i => i.price > 0).map(i => ({ ...i, category }));

export const CATALOG = [
  ...tag(SHOP_TOOLS, 'tools'), ...tag(REPAIRS, 'care'), ...tag(CLEANERS, 'care'),
  ...tag(TOILETS, 'toilets'), ...tag(TILES, 'tiles'), ...tag(FLOORS, 'floors'),
  ...tag(DECORATIONS, 'decoration'), ...tag(BUCKETS, 'buckets'),
];

export const unlockedAt = level => CATALOG.filter(i => (i.minLevel || 1) === level);
