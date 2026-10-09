// Winkelcategorieën in volgorde. `source` bepaalt welke lijst getoond wordt (zie shop.js).
export const SHOP_CATEGORIES = [
  { id: 'buy',        label: 'Punten kopen',   icon: 'coins',       source: 'packages' },
  { id: 'tools',      label: 'Gereedschap',    icon: 'wrench',      source: 'tools' },
  { id: 'toilets',    label: 'Toiletmodellen', icon: 'toilet',      source: 'cosmetic', slot: 'toilet' },
  { id: 'tiles',      label: 'Tegelpatronen',  icon: 'layout-grid', source: 'cosmetic', slot: 'tiles' },
  { id: 'floors',     label: 'Vloeren',        icon: 'layers',      source: 'cosmetic', slot: 'floor' },
  { id: 'decoration', label: 'Decoratie',      icon: 'paintbrush',  source: 'decoration' },
  { id: 'buckets',    label: 'Emmers',         icon: 'bucket-wood', source: 'buckets' },
];
