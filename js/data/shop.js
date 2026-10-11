// Winkelcategorieën in volgorde. `source` bepaalt welke lijst getoond wordt (zie shop.js).
// `color` is de eigen kleur van de categorie (punt 85). Naam en ondertitel: taalbestanden, sleutels cat.<id>.*
export const SHOP_CATEGORIES = [
  { id: 'buy', icon: 'coins', source: 'packages', color: '#2bb673' },
  { id: 'tools', icon: 'wrench', source: 'tools', color: '#ef3e36' },
  { id: 'care', icon: 'care', source: 'care', color: '#3d9be9' },
  { id: 'toilets', icon: 'toilet', source: 'cosmetic', slot: 'toilet', color: '#a06cd5' },
  { id: 'tiles', icon: 'layout-grid', source: 'cosmetic', slot: 'tiles', color: '#1f9e9a' },
  { id: 'floors', icon: 'layers', source: 'cosmetic', slot: 'floor', color: '#c9792a' },
  { id: 'decoration', icon: 'paintbrush', source: 'decoration', color: '#e0559b' },
  { id: 'buckets', icon: 'bucket-wood', source: 'buckets', color: '#7a8a2e' },
];

// "Bijna betaalbaar!": vanaf dit deel van de prijs.
export const ALMOST_AFFORDABLE = 0.8;
