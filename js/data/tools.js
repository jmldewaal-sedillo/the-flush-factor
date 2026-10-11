// Gereedschap. effect 'working' haalt `power` procent water weg; 'chaos' doet alleen iets grappigs.
// starting: true = nieuwe spelers hebben het meteen. De rest is te koop vanaf `minLevel` (lomp → luxe).
export const TOOLS = [
  // ── begin: twee werkende, twee chaos (punt 81) ──
  { id: 'plunger',         name: 'Ontstopper',            short: 'Ontstopper', icon: 'plunger',       effect: 'working', power: 45, cooldown: 12000, starting: true, description: 'De klassieke oplossing. Pomp pomp pomp!' },
  { id: 'hot-water',       name: 'Emmer heet water',      short: 'Heet water', icon: 'boiling-water', effect: 'working', power: 55, cooldown: 18000, starting: true, description: 'Ouderwets maar effectief. Au au au!' },
  { id: 'rubber-duck',     name: 'Rubberen eendje',       short: 'Eendje',     icon: 'duck',          effect: 'chaos', chaos: 'ducks',    cooldown: 10000, starting: true, description: 'Wetenschappelijk bewezen nutteloos.' },
  { id: 'confetti-cannon', name: 'Confettikanon',         short: 'Confetti',   icon: 'party-popper',  effect: 'chaos', chaos: 'confetti', cooldown: 12000, starting: true, description: 'Want soms moet je gewoon FEESTEN.' },

  // ── level 1 ──
  { id: 'flamingo',         name: 'Opblaasbare flamingo',  short: 'Flamingo',   icon: 'flamingo',        effect: 'chaos', chaos: 'flamingo', cooldown: 14000, price: 100,  minLevel: 1, description: 'Een roze flamingo in je toilet. Waarom niet.' },
  { id: 'toilet-snake',     name: 'Toiletveer',            short: 'Veer',       icon: 'spring',          effect: 'working', power: 75, cooldown: 28000, price: 150,  minLevel: 1, description: 'Gaat diep… diep… dieper…' },
  { id: 'magic-wand',       name: 'Toverstaf',             short: 'Toverstaf',  icon: 'magic-wand',      effect: 'chaos', chaos: 'magic',    cooldown: 8000,  price: 200,  minLevel: 1, description: 'Abracadabra! …Het werkt niet. Maar het ziet er GEWELDIG uit.' },
  // ── level 2 ──
  { id: 'disco-ball',       name: 'Discobal',              short: 'Discobal',   icon: 'disco-ball',      effect: 'chaos', chaos: 'disco',    cooldown: 20000, price: 250,  minLevel: 2, description: 'Het toilet DANST. Het toilet DANST ECHT.' },
  { id: 'megaphone',        name: 'Megafoon',              short: 'Megafoon',   icon: 'megaphone',       effect: 'chaos', chaos: 'megaphone', cooldown: 10000, price: 250, minLevel: 2, description: 'SCHREEUW HET SCHOON! (het werkt niet)' },
  { id: 'drain-cleaner',    name: 'Ontstoppingsmiddel',    short: 'Middel',     icon: 'chemical-bottle', effect: 'working', power: 90, cooldown: 40000, price: 300,  minLevel: 2, description: 'Chemisch geweld. Snel, maar met gevolgen voor de planeet.' },
  { id: 'tiny-elephant',    name: 'Mini-olifant',          short: 'Olifant',    icon: 'elephant',        effect: 'chaos', chaos: 'elephant', cooldown: 15000, price: 300,  minLevel: 2, description: 'Spuit water. Chaos gegarandeerd.' },
  // ── level 3 ──
  { id: 'ninja-unclogger',  name: 'Ninja-ontstopper',      short: 'Ninja',      icon: 'ninja',           effect: 'working', power: 80,  cooldown: 5000, price: 500,  minLevel: 3, description: 'Zo snel dat je het bijna niet ziet.' },
  { id: 'super-plunger',    name: 'Super Ontstopper 3000', short: 'Super 3000', icon: 'muscle',          effect: 'working', power: 100, cooldown: 8000, price: 600,  minLevel: 3, description: 'TURBOKRACHT. GEEN DISCUSSIE.' },
  { id: 'electric-plunger', name: 'Elektrische ontstopper', short: 'Elektrisch', icon: 'electric',       effect: 'working', power: 100, cooldown: 6000, price: 750,  minLevel: 3, description: '3000 toeren per minuut. Voel de kracht.' },
  // ── level 4 ──
  { id: 'hydro-jet',        name: 'Hogedrukspuit',         short: 'Hogedruk',   icon: 'water-gun',       effect: 'working', power: 100, cooldown: 4000, price: 1500, minLevel: 4, description: 'Industriële waterdruk. FWOOSH. Weg ermee.' },
  // ── level 5 ──
  { id: 'robot-arm',        name: 'Robotarm',              short: 'Robotarm',   icon: 'robot-arm',       effect: 'working', power: 100, cooldown: 2000, price: 3000, minLevel: 5, description: 'Grijpen. Uitrekken. Winnen. Altijd.' },
];

export const STARTING_TOOLS = TOOLS.filter(t => t.starting);
export const SHOP_TOOLS = TOOLS.filter(t => !t.starting);
// Spelers van vóór Sprint 9 begonnen met deze acht; zij houden ze (zie state.js).
export const LEGACY_STARTING_TOOLS = ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball'];
