// Winkelcategorieën in volgorde. `source` bepaalt welke lijst getoond wordt (zie shop.js).
// `color` is de eigen kleur van de categorie (punt 85).
export const SHOP_CATEGORIES = [
  { id: 'buy',        label: 'Punten kopen',            icon: 'coins',       source: 'packages',   color: '#2bb673', blurb: 'Met echt geld. Prijzen in euro.' },
  { id: 'tools',      label: 'Gereedschap',             icon: 'wrench',      source: 'tools',      color: '#ef3e36', blurb: 'Werkt het? Dat merk je vanzelf.' },
  { id: 'care',       label: 'Schoonmaak & Reparatie',  icon: 'care',        source: 'care',       color: '#3d9be9', blurb: 'Lijm, borstels en sop.' },
  { id: 'toilets',    label: 'Toiletmodellen',          icon: 'toilet',      source: 'cosmetic', slot: 'toilet', color: '#a06cd5', blurb: 'Voor als hij heel en schoon is.' },
  { id: 'tiles',      label: 'Tegelpatronen',           icon: 'layout-grid', source: 'cosmetic', slot: 'tiles',  color: '#1f9e9a', blurb: 'Weg met die kale muur.' },
  { id: 'floors',     label: 'Vloeren',                 icon: 'layers',      source: 'cosmetic', slot: 'floor',  color: '#c9792a', blurb: 'Iets om op te staan.' },
  { id: 'decoration', label: 'Decoratie',               icon: 'paintbrush',  source: 'decoration', color: '#e0559b', blurb: 'Gezelligheid kent geen tijd.' },
  { id: 'buckets',    label: 'Emmers',                  icon: 'bucket-wood', source: 'buckets',    color: '#7a8a2e', blurb: 'Meer liters, minder legen.' },
];

// "Bijna betaalbaar!": vanaf dit deel van de prijs.
export const ALMOST_AFFORDABLE = 0.8;
