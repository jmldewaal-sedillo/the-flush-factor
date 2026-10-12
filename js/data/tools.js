// Namen en omschrijvingen staan in de taalbestanden (js/i18n/, sleutels item.<id>.*).
// Gereedschap. effect 'working' haalt `power` procent water weg; 'chaos' doet alleen iets grappigs.
// sound: het eigen geluid van dit gereedschap (punt 104), een sleutel uit js/data/sounds.js. VERPLICHT en
// uniek: geen twee gereedschappen delen een geluid (het spel en de tests controleren dat).
// starting: true = nieuwe spelers hebben het meteen. De rest is te koop vanaf `minLevel` (lomp → luxe).
export const TOOLS = [
  // ── begin: twee werkende, twee chaos (punt 81) ──
  { id: 'plunger', icon: 'plunger', effect: 'working', power: 45, cooldown: 12000, starting: true, sound: 'tool-plunger' },
  { id: 'hot-water', icon: 'boiling-water', effect: 'working', power: 55, cooldown: 18000, starting: true, sound: 'tool-hot-water' },
  { id: 'rubber-duck', icon: 'duck', effect: 'chaos', chaos: 'ducks', cooldown: 10000, starting: true, sound: 'tool-rubber-duck' },
  { id: 'confetti-cannon', icon: 'party-popper', effect: 'chaos', chaos: 'confetti', cooldown: 12000, starting: true, sound: 'tool-confetti-cannon' },

  // ── level 1 ──
  { id: 'flamingo', icon: 'flamingo', effect: 'chaos', chaos: 'flamingo', cooldown: 14000, price: 100, minLevel: 1, sound: 'tool-flamingo' },
  { id: 'toilet-snake', icon: 'spring', effect: 'working', power: 75, cooldown: 28000, price: 150, minLevel: 1, sound: 'tool-toilet-snake' },
  { id: 'magic-wand', icon: 'magic-wand', effect: 'chaos', chaos: 'magic', cooldown: 8000, price: 200, minLevel: 1, sound: 'tool-magic-wand' },
  // ── level 2 ──
  { id: 'disco-ball', icon: 'disco-ball', effect: 'chaos', chaos: 'disco', cooldown: 20000, price: 250, minLevel: 2, sound: 'tool-disco-ball' },
  { id: 'megaphone', icon: 'megaphone', effect: 'chaos', chaos: 'megaphone', cooldown: 10000, price: 250, minLevel: 2, sound: 'tool-megaphone' },
  { id: 'drain-cleaner', icon: 'chemical-bottle', effect: 'working', power: 90, cooldown: 40000, price: 300, minLevel: 2, sound: 'tool-drain-cleaner' },
  { id: 'tiny-elephant', icon: 'elephant', effect: 'chaos', chaos: 'elephant', cooldown: 15000, price: 300, minLevel: 2, sound: 'tool-tiny-elephant' },
  // ── level 3 ──
  { id: 'ninja-unclogger', icon: 'ninja', effect: 'working', power: 80, cooldown: 5000, price: 500, minLevel: 3, sound: 'tool-ninja-unclogger' },
  { id: 'super-plunger', icon: 'muscle', effect: 'working', power: 100, cooldown: 8000, price: 600, minLevel: 3, sound: 'tool-super-plunger' },
  { id: 'electric-plunger', icon: 'electric', effect: 'working', power: 100, cooldown: 6000, price: 750, minLevel: 3, sound: 'tool-electric-plunger' },
  // ── level 4 ──
  { id: 'hydro-jet', icon: 'water-gun', effect: 'working', power: 100, cooldown: 4000, price: 1500, minLevel: 4, sound: 'tool-hydro-jet' },
  // ── level 5 ──
  { id: 'robot-arm', icon: 'robot-arm', effect: 'working', power: 100, cooldown: 2000, price: 3000, minLevel: 5, sound: 'tool-robot-arm' },
];

export const STARTING_TOOLS = TOOLS.filter(t => t.starting);
export const SHOP_TOOLS = TOOLS.filter(t => !t.starting);
// Spelers van vóór Sprint 9 begonnen met deze acht; zij houden ze (zie state.js).
export const LEGACY_STARTING_TOOLS = ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball'];
