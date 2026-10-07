// ============================================================
// THE FLUSH FACTOR — items.js
// All static game data: tools, cosmetics, messages, levels.
// To add new content, just add entries to these arrays.
// ============================================================

// ──────── LEVEL CONFIG ────────
export const LEVEL_CONFIG = [
  { level: 1, minScore: 0,    name: 'Beginner',     waterRiseRate: 6,   maxChance: 0.05,  minTimeBetweenClogs: 15000 },
  { level: 2, minScore: 200,  name: 'Doorgespoeld', waterRiseRate: 7.5, maxChance: 0.065, minTimeBetweenClogs: 13000 },
  { level: 3, minScore: 600,  name: 'Loodgieter',   waterRiseRate: 9,   maxChance: 0.08,  minTimeBetweenClogs: 11000 },
  { level: 4, minScore: 1500, name: 'Expert',       waterRiseRate: 11,  maxChance: 0.10,  minTimeBetweenClogs: 9000  },
  { level: 5, minScore: 4000, name: 'Meester',      waterRiseRate: 14,  maxChance: 0.12,  minTimeBetweenClogs: 7000  },
];

// ──────── DINGEN DIE HET TOILET VERSTOPPEN ────────
export const CLOG_PROPS = [
  { id: 'toilet-paper', icon: 'toilet-paper', name: 'wc-papier',         volume: 0.5 },
  { id: 'rubber-duck',  icon: 'rubber-duck',  name: 'rubberen eendje',   volume: 1.0 },
  { id: 'sock',         icon: 'sock',         name: 'sok',               volume: 0.3 },
  { id: 'toy-car',      icon: 'toy-car',      name: 'speelgoedautootje', volume: 1.5 },
  { id: 'phone',        icon: 'smartphone',   name: 'telefoon',          volume: 0.8 },
  { id: 'teddy',        icon: 'teddy-bear',   name: 'teddybeer',         volume: 2.0 },
  { id: 'fish',         icon: 'fish',         name: 'visje',             volume: 0.6 },
  { id: 'banana',       icon: 'banana',       name: 'bananenschil',      volume: 0.4 },
  { id: 'lego',         icon: 'lego',         name: 'legoblokje',        volume: 1.5 },
  { id: 'key',          icon: 'key',          name: 'sleutel',           volume: 0.2 },
];

// ──────── MAND UPGRADES ────────
export const BASKET_CONFIG = [
  { id: 'basket-s',  name: 'Kleine mand',      capacity: 20,  price: 0,    icon: 'wicker-basket', description: 'Standaard mand. Werkt prima.' },
  { id: 'basket-m',  name: 'Middelgrote mand', capacity: 30,  price: 200,  icon: 'wicker-basket', description: 'Meer ruimte voor meer troep.' },
  { id: 'basket-l',  name: 'Grote mand',       capacity: 50,  price: 500,  icon: 'wicker-basket', description: 'Voor de echte verzamelaar.' },
  { id: 'basket-xl', name: 'XL-mand',          capacity: 100, price: 1500, icon: 'wicker-basket', description: 'Je kunt eens per maand legen.' },
];

export const TOOLS = [
  // ──────── WERKENDE GEREEDSCHAPPEN ────────
  {
    id: 'plunger',
    name: 'Ontstopper',
    icon: 'plunger',
    description: 'De klassieke oplossing. Pump pump pump!',
    effectType: 'working',
    effectiveness: 45,
    unclogChance: 0.70,
    cooldown: 12000,
    startingTool: true,
  },
  {
    id: 'toilet-snake',
    name: 'Toiletveer',
    icon: 'snake',
    description: 'Gaat diep… diep… dieper…',
    effectType: 'working',
    effectiveness: 75,
    unclogChance: 0.90,
    cooldown: 28000,
    startingTool: true,
  },
  {
    id: 'drain-cleaner',
    name: 'Ontstoppingsmiddel',
    icon: 'drain-cleaner',
    description: 'Chemisch geweld. Snel maar met gevolgen voor de planeet.',
    effectType: 'working',
    effectiveness: 90,
    unclogChance: 0.95,
    cooldown: 40000,
    startingTool: true,
  },
  {
    id: 'hot-water',
    name: 'Emmer Heet Water',
    icon: 'bucket',
    description: 'Ouderwets maar effectief. Au au au!',
    effectType: 'working',
    effectiveness: 55,
    unclogChance: 0.75,
    cooldown: 18000,
    startingTool: true,
  },

  // ──────── CHAOS-GEREEDSCHAPPEN ────────
  {
    id: 'rubber-duck',
    name: 'Rubberen Eendje',
    icon: 'rubber-duck',
    description: 'Wetenschappelijk bewezen nutteloos.',
    effectType: 'chaos',
    chaosEffect: 'ducks',
    cooldown: 10000,
    startingTool: true,
  },
  {
    id: 'confetti-cannon',
    name: 'Confettikanon',
    icon: 'party-popper',
    description: 'Want soms moet je gewoon FEESTEN.',
    effectType: 'chaos',
    chaosEffect: 'confetti',
    cooldown: 12000,
    startingTool: true,
  },
  {
    id: 'flamingo',
    name: 'Opblaasbare Flamingo',
    icon: 'flamingo',
    description: 'Een roze flamingo in je toilet. Waarom niet.',
    effectType: 'chaos',
    chaosEffect: 'flamingo',
    cooldown: 14000,
    startingTool: true,
  },
  {
    id: 'disco-ball',
    name: 'Discobal',
    icon: 'disco-ball',
    description: 'Het toilet DANST. Het toilet DANST ECHT.',
    effectType: 'chaos',
    chaosEffect: 'disco',
    cooldown: 20000,
    startingTool: true,
  },
];

export const PREMIUM_TOOLS = [
  // ── Level 1 (altijd zichtbaar) ──
  {
    id: 'super-plunger',
    name: 'Super Ontstopper 3000',
    icon: 'muscle',
    description: 'TURBO KRACHT. GEEN DISCUSSIE.',
    effectType: 'working',
    effectiveness: 100,
    unclogChance: 1.0,
    cooldown: 8000,
    startingTool: false,
    price: 500,
    minLevel: 1,
  },
  {
    id: 'ninja-unclogger',
    name: 'Ninja Ontstopper',
    icon: 'ninja',
    description: 'Zo snel dat je het bijna niet ziet.',
    effectType: 'working',
    effectiveness: 80,
    unclogChance: 0.95,
    cooldown: 5000,
    startingTool: false,
    price: 350,
    minLevel: 1,
  },
  {
    id: 'magic-wand',
    name: 'Toverstaf',
    icon: 'magic-wand',
    description: 'Abracadabra! …Het werkt niet. Maar het ziet er GEWELDIG uit.',
    effectType: 'chaos',
    chaosEffect: 'magic',
    cooldown: 8000,
    startingTool: false,
    price: 200,
    minLevel: 1,
  },
  {
    id: 'tiny-elephant',
    name: 'Mini Olifant',
    icon: 'elephant',
    description: 'Spuit water. Chaos gegarandeerd.',
    effectType: 'chaos',
    chaosEffect: 'elephant',
    cooldown: 15000,
    startingTool: false,
    price: 300,
    minLevel: 1,
  },
  // ── Level 2 ──
  {
    id: 'megaphone',
    name: 'Megafoon',
    icon: 'megaphone',
    description: 'SCHREEUW HET SCHOON! (het werkt niet)',
    effectType: 'chaos',
    chaosEffect: 'megaphone',
    cooldown: 10000,
    startingTool: false,
    price: 250,
    minLevel: 2,
  },
  // ── Level 3 ──
  {
    id: 'electric-plunger',
    name: 'Elektrische Ontstopper',
    icon: 'zap',
    description: '3000 RPM motoraandrijving. Voel de kracht.',
    effectType: 'working',
    effectiveness: 100,
    unclogChance: 1.0,
    cooldown: 6000,
    startingTool: false,
    price: 750,
    minLevel: 3,
  },
  // ── Level 4 ──
  {
    id: 'hydro-jet',
    name: 'Hogedrukspuit',
    icon: 'water-gun',
    description: 'Industriële waterdruk. FWOOSH. Weg ermee.',
    effectType: 'working',
    effectiveness: 100,
    unclogChance: 1.0,
    cooldown: 4000,
    startingTool: false,
    price: 1500,
    minLevel: 4,
  },
  // ── Level 5 ──
  {
    id: 'robot-arm',
    name: 'Robotarm',
    icon: 'robot-hand',
    description: 'Grijpen. Uitrekken. Winnen. Altijd.',
    effectType: 'working',
    effectiveness: 100,
    unclogChance: 1.0,
    cooldown: 2000,
    startingTool: false,
    price: 3000,
    minLevel: 5,
  },
];

export const COSMETICS = [
  // Toiletmodellen
  { id: 'toilet-standard', category: 'toilet', name: 'Standaard',         icon: 'toilet',   price: 0,    description: 'Het origineel.' },
  { id: 'toilet-golden',   category: 'toilet', name: 'Gouden Troon',      icon: 'crown',    price: 1000, description: 'Want jij bent royalty.' },
  { id: 'toilet-space',    category: 'toilet', name: 'Space Toilet',      icon: 'rocket',   price: 800,  description: 'Spoelen in de ruimte. 3… 2… 1…' },
  { id: 'toilet-medieval', category: 'toilet', name: 'Middeleeuwse Ton',  icon: 'landmark', price: 600,  description: '"Toilet" is een groot woord hier.' },

  // Tegelpatronen
  { id: 'tiles-default',      category: 'tiles', name: 'Standaard Tegels', icon: 'grid-2x2',    price: 0,   description: 'Wit. Schoon. Saai.' },
  { id: 'tiles-checkerboard', category: 'tiles', name: 'Schaakbord',        icon: 'checkerboard', price: 150, description: 'Jouw zet.' },
  { id: 'tiles-stars',        category: 'tiles', name: 'Sterrenhemel',      icon: 'star',        price: 200, description: 'Dromen terwijl je… je ding doet.' },
  { id: 'tiles-zigzag',       category: 'tiles', name: 'Zigzag Fever',      icon: 'zap',         price: 175, description: 'ZIGZAG DOOR HET LEVEN.' },

  // Vloertypen
  { id: 'floor-basic',    category: 'floor', name: 'Standaard Vloer', icon: 'layers',  price: 0,   description: 'Functioneel.' },
  { id: 'floor-marble',   category: 'floor', name: 'Marmer',          icon: 'gem',     price: 300, description: 'Wie loopt er op marmer? Jij.' },
  { id: 'floor-rainbow',  category: 'floor', name: 'Regenboogvloer',  icon: 'rainbow', price: 400, description: 'Dans op regenbogen.' },
  { id: 'floor-lava',     category: 'floor', name: 'Lavavloer',       icon: 'flame',   price: 500, description: 'NIET AANRAKEN.' },

  // Decoraties
  { id: 'deco-none',    category: 'decoration', name: 'Geen decoratie',  icon: 'ban',      price: 0,   description: 'Kaal maar eerlijk.' },
  { id: 'deco-plant',   category: 'decoration', name: 'Badkamerplant',   icon: 'sprout',   price: 100, description: 'Zelfs planten overleven hier.' },
  { id: 'deco-mirror',  category: 'decoration', name: 'Spiegel',         icon: 'mirror',   price: 150, description: 'Kijk eens hoe goed je het doet.' },
  { id: 'deco-painting',category: 'decoration', name: '"La Toilette"',   icon: 'image',    price: 200, description: 'Kunst in de badkamer. Verfijnd.' },
  { id: 'deco-poster',  category: 'decoration', name: 'Motivatieposter', icon: 'dumbbell', price: 75,  description: '"BELIEVE IN YOUR FLUSH" — Onbekend' },
];

export const MESSAGES = {
  flushSuccess: [
    'SPOELEN!', 'Bravo!', 'Schoon!', 'Weg ermee!',
    'Tot nooit meer ziens!', 'FWOOSH!', 'Goedendag!',
  ],
  clogStart: [
    'Oh nee… niet weer.',
    'Dat was geen gewone lunch…',
    'MAYDAY, MAYDAY!',
    'De natuur heeft haar wraak.',
    'Blorp.',
    'Calamiteit!',
    'Dit ruikt naar problemen.',
    '…Geur activeren.',
  ],
  alreadyClogged: [
    'Al verstopt! Gebruik gereedschap!',
    'Spoelen helpt niet, Einstein.',
    'BLURP! Nope.',
    'Dat werkt niet zo.',
  ],
  overflow: [
    'OVERSTROMING!', 'GROTE CHAOS!', 'HELP.',
    'Dit is waarom we WC-papier hebben.',
    'Nee nee nee NEE.',
  ],
  toolWorking: [
    'Dat deed het!', 'YES!', 'Opgelost!',
    'Meesterwerk!', 'Genie aan het werk!',
  ],
  toolChaos: [
    '…Wat?', 'Dat hielp NIETS.',
    'Creativiteit: 10. Effect: 0.',
    'Interessante keuze.',
    '10/10 voor moed, 0/10 voor resultaat.',
  ],
  toolNotClogged: [
    'Er is niets verstopt? Ontspan.',
    'Doe dat maar als het nodig is.',
    'Gereedschap gaat hier nergens naartoe.',
  ],
  comboBreak: [
    'Combo verbroken!', 'Back to basics.', 'Oops.',
  ],
  levelUp: [
    'LEVEL UP!', 'Hoger niveau!', 'Je wordt pro!', 'Volgende stap!',
  ],
  unclogSuccess: [
    'ONTSTOPT!', 'YES YES YES!', 'VRIJ!!!', 'Meesterwerk!', 'Victorie!',
  ],
};
