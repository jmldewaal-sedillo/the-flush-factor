// Cosmetica. Nieuwe items toevoegen = een regel erbij; geen code wijzigen.
//
// Toiletten: `skin` kleurt het model (tint × eigen texture; maps:false = effen materiaal).
// Tegels/vloeren: texture.type 'pbr' (bestanden <base>_color/_normal/_roughness.webp)
//   of 'pattern' (getekend in js/three/patterns.js). `size` = meters per herhaling.
// Decoratie: `build` = bouwfunctie in js/three/decor.js, `anchor` = plek uit data/room.js.

export const TOILETS = [
  { id: 'toilet-standard', name: 'Standaard',        icon: 'toilet', price: 0,    description: 'Het origineel.',                    skin: { color: 0xffffff, maps: true } },
  { id: 'toilet-golden',   name: 'Gouden troon',     icon: 'crown',  price: 1000, description: 'Want jij bent royalty.',            skin: { color: 0xffc94a, metalness: 1.0, roughness: 0.22, maps: false } },
  { id: 'toilet-space',    name: 'Ruimtetoilet',     icon: 'rocket', price: 800,  description: 'Spoelen in de ruimte. 3… 2… 1…',    skin: { color: 0x4a5a70, metalness: 0.7, roughness: 0.35, maps: false } },
  { id: 'toilet-medieval', name: 'Middeleeuwse ton', icon: 'barrel', price: 600,  description: '"Toilet" is hier een groot woord.', skin: { color: 0x8a5a33, metalness: 0.0, roughness: 0.85, maps: true } },
];

export const TILES = [
  { id: 'tiles-default',      name: 'Standaardtegels', icon: 'layout-grid', price: 0,   description: 'Delfts blauw. Degelijk.',          texture: { type: 'pbr', base: 'assets/textures/Tiles101', size: 0.8 } },
  { id: 'tiles-checkerboard', name: 'Schaakbord',      icon: 'chessboard',  price: 150, description: 'Jouw zet.',                        texture: { type: 'pattern', pattern: 'checker', colors: ['#f4f1ea', '#27384a'], size: 0.4 } },
  { id: 'tiles-stars',        name: 'Sterrenhemel',    icon: 'stars',       price: 200, description: 'Dromen terwijl je… je ding doet.', texture: { type: 'pattern', pattern: 'stars',   colors: ['#161a3a', '#ffe9a8'], size: 0.8 } },
  { id: 'tiles-zigzag',       name: 'Zigzagkoorts',    icon: 'zigzag',      price: 175, description: 'ZIGZAG DOOR HET LEVEN.',           texture: { type: 'pattern', pattern: 'zigzag',  colors: ['#f4a261', '#fff3d6'], size: 0.4 } },
];

export const FLOORS = [
  { id: 'floor-basic',   name: 'Houten vloer',   icon: 'layers',  price: 0,   description: 'Functioneel.',                 texture: { type: 'pbr', base: 'assets/textures/WoodFloor041', size: 1.0 } },
  { id: 'floor-marble',  name: 'Marmer',         icon: 'diamond', price: 300, description: 'Wie loopt er op marmer? Jij.', texture: { type: 'pattern', pattern: 'marble',  colors: ['#ece7dd', '#9a938a'], size: 0.6, roughness: 0.15 } },
  { id: 'floor-rainbow', name: 'Regenboogvloer', icon: 'rainbow', price: 400, description: 'Dans op regenbogen.',          texture: { type: 'pattern', pattern: 'rainbow', colors: [], size: 1.3, roughness: 0.4 } },
  { id: 'floor-lava',    name: 'Lavavloer',      icon: 'lava',    price: 500, description: 'NIET AANRAKEN.',               texture: { type: 'pattern', pattern: 'lava',    colors: ['#2a0d05', '#ff5a00'], size: 0.9, roughness: 0.6, emissive: 0.6 } },
];

export const DECORATIONS = [
  { id: 'deco-poster',   name: 'Motivatieposter', icon: 'poster',     price: 75,  anchor: 'wallRight',    build: 'poster',   description: '"BELIEVE IN YOUR FLUSH" — onbekend' },
  { id: 'deco-plant',    name: 'Badkamerplant',   icon: 'flower-pot', price: 100, anchor: 'floorLeft',    build: 'plant',    description: 'Zelfs planten overleven hier.' },
  { id: 'deco-mirror',   name: 'Spiegel',         icon: 'mirror',     price: 150, anchor: 'wallBack',     build: 'mirror',   description: 'Kijk eens hoe goed je het doet.' },
  { id: 'deco-shelf',    name: 'Plank',           icon: 'shelf',      price: 175, anchor: 'wallBackHigh', build: 'shelf',    description: 'Voor reserverollen en trofeeën.' },
  { id: 'deco-painting', name: '"La Toilette"',   icon: 'painting',   price: 200, anchor: 'wallLeft',     build: 'painting', description: 'Kunst op de wc. Verfijnd.' },
  { id: 'deco-cabinet',  name: 'Wandkastje',      icon: 'cabinet',    price: 250, anchor: 'wallLeftLow',  build: 'cabinet',  description: 'Wat erin zit? Beter van niet.' },
];

export const DEFAULT_COSMETICS = { toilet: 'toilet-standard', tiles: 'tiles-default', floor: 'floor-basic' };
export const COSMETIC_LISTS = { toilet: TOILETS, tiles: TILES, floor: FLOORS };
