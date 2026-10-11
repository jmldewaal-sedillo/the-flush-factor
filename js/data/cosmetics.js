// Cosmetica. Nieuwe items toevoegen = een regel erbij (plus naam en omschrijving in de taalbestanden,
// js/i18n/, sleutels item.<id>.name en item.<id>.desc); geen code wijzigen.
//
// Elk item heeft `price` en `minLevel` (vanaf welk level het te koop is).
// Toiletten: `skin` kleurt het model (tint × eigen texture; maps:false = effen materiaal).
// Tegels/vloeren: texture.type 'pbr' (bestanden <base>_color/_normal/_roughness.webp)
//   of 'pattern' (getekend in js/three/patterns.js). `size` = meters per herhaling.
// Decoratie: `build` = bouwfunctie in js/three/decor.js, `anchor` = plek uit data/room.js.

// Toiletmodellen: andere uitvoeringen. Alleen te koop als het toilet gerepareerd én schoon is (punt 79).
export const TOILETS = [
  { id: 'toilet-standard', icon: 'toilet', price: 0, minLevel: 1, skin: { color: 0xffffff, maps: true } },
  { id: 'toilet-medieval', icon: 'barrel', price: 600, minLevel: 3, skin: { color: 0x8a5a33, metalness: 0.0, roughness: 0.85, maps: true } },
  { id: 'toilet-space', icon: 'rocket', price: 1000, minLevel: 4, skin: { color: 0x4a5a70, metalness: 0.7, roughness: 0.35, maps: false } },
  { id: 'toilet-golden', icon: 'crown', price: 2000, minLevel: 5, skin: { color: 0xffc94a, metalness: 1.0, roughness: 0.22, maps: false } },
];

export const TILES = [
  { id: 'tiles-bare', icon: 'bare-wall', price: 0, minLevel: 1, texture: { type: 'pattern', pattern: 'plaster', colors: ['#e9e6dc', '#bdb7a6'], size: 1.3, roughness: 0.95 } },
  { id: 'tiles-default', icon: 'layout-grid', price: 200, minLevel: 2, texture: { type: 'pbr', base: 'assets/textures/Tiles101', size: 0.8 } },
  { id: 'tiles-checkerboard', icon: 'chessboard', price: 300, minLevel: 2, texture: { type: 'pattern', pattern: 'checker', colors: ['#f4f1ea', '#27384a'], size: 0.4 } },
  { id: 'tiles-zigzag', icon: 'zigzag', price: 400, minLevel: 3, texture: { type: 'pattern', pattern: 'zigzag', colors: ['#f4a261', '#fff3d6'], size: 0.4 } },
  { id: 'tiles-stars', icon: 'stars', price: 600, minLevel: 4, texture: { type: 'pattern', pattern: 'stars', colors: ['#161a3a', '#ffe9a8'], size: 0.8 } },
];

export const FLOORS = [
  { id: 'floor-dirty', icon: 'dirt-floor', price: 0, minLevel: 1, texture: { type: 'pattern', pattern: 'dirt', colors: ['#6b4f38', '#3f2d20'], size: 1.1, roughness: 0.9 } },
  { id: 'floor-basic', icon: 'wood-floor', price: 150, minLevel: 1, texture: { type: 'pbr', base: 'assets/textures/WoodFloor041', size: 1.0 } },
  { id: 'floor-marble', icon: 'diamond', price: 500, minLevel: 3, texture: { type: 'pattern', pattern: 'marble', colors: ['#ece7dd', '#9a938a'], size: 0.6, roughness: 0.15 } },
  { id: 'floor-rainbow', icon: 'rainbow', price: 700, minLevel: 4, texture: { type: 'pattern', pattern: 'rainbow', colors: [], size: 1.3, roughness: 0.4 } },
  { id: 'floor-lava', icon: 'lava', price: 1000, minLevel: 5, texture: { type: 'pattern', pattern: 'lava', colors: ['#2a0d05', '#ff5a00'], size: 0.9, roughness: 0.6, emissive: 0.6 } },
];

export const DECORATIONS = [
  { id: 'deco-poster', icon: 'poster', price: 75, minLevel: 1, anchor: 'wallRight', build: 'poster' },
  { id: 'deco-plant', icon: 'flower-pot', price: 100, minLevel: 1, anchor: 'floorLeft', build: 'plant' },
  { id: 'deco-mirror', icon: 'mirror', price: 200, minLevel: 2, anchor: 'wallBack', build: 'mirror' },
  { id: 'deco-shelf', icon: 'shelf', price: 250, minLevel: 2, anchor: 'wallBackHigh', build: 'shelf' },
  { id: 'deco-painting', icon: 'painting', price: 400, minLevel: 3, anchor: 'wallLeft', build: 'painting' },
  { id: 'deco-cabinet', icon: 'cabinet', price: 500, minLevel: 3, anchor: 'wallLeftLow', build: 'cabinet' },
];

// Nieuwe spelers beginnen armoedig (punt 79).
export const DEFAULT_COSMETICS = { toilet: 'toilet-standard', tiles: 'tiles-bare', floor: 'floor-dirty' };
// Spelers van vóór Sprint 9 hadden deze gratis; zij houden ze (zie state.js).
export const LEGACY_COSMETICS = { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' };
export const COSMETIC_LISTS = { toilet: TOILETS, tiles: TILES, floor: FLOORS };
