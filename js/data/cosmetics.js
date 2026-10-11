// Cosmetica. Nieuwe items toevoegen = een regel erbij; geen code wijzigen.
//
// Elk item heeft `price` en `minLevel` (vanaf welk level het te koop is).
// Toiletten: `skin` kleurt het model (tint × eigen texture; maps:false = effen materiaal).
// Tegels/vloeren: texture.type 'pbr' (bestanden <base>_color/_normal/_roughness.webp)
//   of 'pattern' (getekend in js/three/patterns.js). `size` = meters per herhaling.
// Decoratie: `build` = bouwfunctie in js/three/decor.js, `anchor` = plek uit data/room.js.

// Toiletmodellen: andere uitvoeringen. Alleen te koop als het toilet gerepareerd én schoon is (punt 79).
export const TOILETS = [
  { id: 'toilet-standard', name: 'Standaard',        icon: 'toilet', price: 0,    minLevel: 1, description: 'Het origineel.',                    skin: { color: 0xffffff, maps: true } },
  { id: 'toilet-medieval', name: 'Middeleeuwse ton', icon: 'barrel', price: 600,  minLevel: 3, description: '"Toilet" is hier een groot woord.', skin: { color: 0x8a5a33, metalness: 0.0, roughness: 0.85, maps: true } },
  { id: 'toilet-space',    name: 'Ruimtetoilet',     icon: 'rocket', price: 1000, minLevel: 4, description: 'Spoelen in de ruimte. 3… 2… 1…',    skin: { color: 0x4a5a70, metalness: 0.7, roughness: 0.35, maps: false } },
  { id: 'toilet-golden',   name: 'Gouden troon',     icon: 'crown',  price: 2000, minLevel: 5, description: 'Want jij bent royalty.',            skin: { color: 0xffc94a, metalness: 1.0, roughness: 0.22, maps: false } },
];

export const TILES = [
  { id: 'tiles-bare',         name: 'Kale muur',       icon: 'bare-wall',   price: 0,   minLevel: 1, description: 'Wit, ooit. Geen tegel te bekennen.',  texture: { type: 'pattern', pattern: 'plaster', colors: ['#e9e6dc', '#bdb7a6'], size: 1.3, roughness: 0.95 } },
  { id: 'tiles-default',      name: 'Delfts blauw',    icon: 'layout-grid', price: 200, minLevel: 2, description: 'Degelijk. Oma zou trots zijn.',       texture: { type: 'pbr', base: 'assets/textures/Tiles101', size: 0.8 } },
  { id: 'tiles-checkerboard', name: 'Schaakbord',      icon: 'chessboard',  price: 300, minLevel: 2, description: 'Jouw zet.',                           texture: { type: 'pattern', pattern: 'checker', colors: ['#f4f1ea', '#27384a'], size: 0.4 } },
  { id: 'tiles-zigzag',       name: 'Zigzagkoorts',    icon: 'zigzag',      price: 400, minLevel: 3, description: 'ZIGZAG DOOR HET LEVEN.',              texture: { type: 'pattern', pattern: 'zigzag',  colors: ['#f4a261', '#fff3d6'], size: 0.4 } },
  { id: 'tiles-stars',        name: 'Sterrenhemel',    icon: 'stars',       price: 600, minLevel: 4, description: 'Dromen terwijl je… je ding doet.',    texture: { type: 'pattern', pattern: 'stars',   colors: ['#161a3a', '#ffe9a8'], size: 0.8 } },
];

export const FLOORS = [
  { id: 'floor-dirty',   name: 'Vieze vloer',    icon: 'dirt-floor', price: 0,    minLevel: 1, description: 'Bruin. Vraag niet waarvan.',       texture: { type: 'pattern', pattern: 'dirt',    colors: ['#6b4f38', '#3f2d20'], size: 1.1, roughness: 0.9 } },
  { id: 'floor-basic',   name: 'Houten vloer',   icon: 'wood-floor', price: 150,  minLevel: 1, description: 'Planken! Echte planken!',          texture: { type: 'pbr', base: 'assets/textures/WoodFloor041', size: 1.0 } },
  { id: 'floor-marble',  name: 'Marmer',         icon: 'diamond',    price: 500,  minLevel: 3, description: 'Wie loopt er op marmer? Jij.',     texture: { type: 'pattern', pattern: 'marble',  colors: ['#ece7dd', '#9a938a'], size: 0.6, roughness: 0.15 } },
  { id: 'floor-rainbow', name: 'Regenboogvloer', icon: 'rainbow',    price: 700,  minLevel: 4, description: 'Dans op regenbogen.',              texture: { type: 'pattern', pattern: 'rainbow', colors: [], size: 1.3, roughness: 0.4 } },
  { id: 'floor-lava',    name: 'Lavavloer',      icon: 'lava',       price: 1000, minLevel: 5, description: 'NIET AANRAKEN.',                   texture: { type: 'pattern', pattern: 'lava',    colors: ['#2a0d05', '#ff5a00'], size: 0.9, roughness: 0.6, emissive: 0.6 } },
];

export const DECORATIONS = [
  { id: 'deco-poster',   name: 'Motivatieposter', icon: 'poster',     price: 75,  minLevel: 1, anchor: 'wallRight',    build: 'poster',   description: '"BELIEVE IN YOUR FLUSH" — onbekend' },
  { id: 'deco-plant',    name: 'Badkamerplant',   icon: 'flower-pot', price: 100, minLevel: 1, anchor: 'floorLeft',    build: 'plant',    description: 'Zelfs planten overleven hier.' },
  { id: 'deco-mirror',   name: 'Spiegel',         icon: 'mirror',     price: 200, minLevel: 2, anchor: 'wallBack',     build: 'mirror',   description: 'Kijk eens hoe goed je het doet.' },
  { id: 'deco-shelf',    name: 'Plank',           icon: 'shelf',      price: 250, minLevel: 2, anchor: 'wallBackHigh', build: 'shelf',    description: 'Voor reserverollen en trofeeën.' },
  { id: 'deco-painting', name: '"La Toilette"',   icon: 'painting',   price: 400, minLevel: 3, anchor: 'wallLeft',     build: 'painting', description: 'Kunst op de wc. Verfijnd.' },
  { id: 'deco-cabinet',  name: 'Wandkastje',      icon: 'cabinet',    price: 500, minLevel: 3, anchor: 'wallLeftLow',  build: 'cabinet',  description: 'Wat erin zit? Beter van niet.' },
];

// Nieuwe spelers beginnen armoedig (punt 79).
export const DEFAULT_COSMETICS = { toilet: 'toilet-standard', tiles: 'tiles-bare', floor: 'floor-dirty' };
// Spelers van vóór Sprint 9 hadden deze gratis; zij houden ze (zie state.js).
export const LEGACY_COSMETICS = { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' };
export const COSMETIC_LISTS = { toilet: TOILETS, tiles: TILES, floor: FLOORS };
