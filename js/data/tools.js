// Namen en omschrijvingen staan in de taalbestanden (js/i18n/, sleutels item.<id>.*).
// Gereedschap. effect 'working' haalt `power` procent water weg; 'chaos' doet alleen iets grappigs.
// starting: true = nieuwe spelers hebben het meteen. De rest is te koop vanaf `minLevel` (lomp → luxe).
export const TOOLS = [
  // ── begin: twee werkende, twee chaos (punt 81) ──
  { id: 'plunger', icon: 'plunger', effect: 'working', power: 45, cooldown: 12000, starting: true },
  { id: 'hot-water', icon: 'boiling-water', effect: 'working', power: 55, cooldown: 18000, starting: true },
  { id: 'rubber-duck', icon: 'duck', effect: 'chaos', chaos: 'ducks', cooldown: 10000, starting: true },
  { id: 'confetti-cannon', icon: 'party-popper', effect: 'chaos', chaos: 'confetti', cooldown: 12000, starting: true },

  // ── level 1 ──
  { id: 'flamingo', icon: 'flamingo', effect: 'chaos', chaos: 'flamingo', cooldown: 14000, price: 100, minLevel: 1 },
  { id: 'toilet-snake', icon: 'spring', effect: 'working', power: 75, cooldown: 28000, price: 150, minLevel: 1 },
  { id: 'magic-wand', icon: 'magic-wand', effect: 'chaos', chaos: 'magic', cooldown: 8000, price: 200, minLevel: 1 },
  // ── level 2 ──
  { id: 'disco-ball', icon: 'disco-ball', effect: 'chaos', chaos: 'disco', cooldown: 20000, price: 250, minLevel: 2 },
  { id: 'megaphone', icon: 'megaphone', effect: 'chaos', chaos: 'megaphone', cooldown: 10000, price: 250, minLevel: 2 },
  { id: 'drain-cleaner', icon: 'chemical-bottle', effect: 'working', power: 90, cooldown: 40000, price: 300, minLevel: 2 },
  { id: 'tiny-elephant', icon: 'elephant', effect: 'chaos', chaos: 'elephant', cooldown: 15000, price: 300, minLevel: 2 },
  // ── level 3 ──
  { id: 'ninja-unclogger', icon: 'ninja', effect: 'working', power: 80, cooldown: 5000, price: 500, minLevel: 3 },
  { id: 'super-plunger', icon: 'muscle', effect: 'working', power: 100, cooldown: 8000, price: 600, minLevel: 3 },
  { id: 'electric-plunger', icon: 'electric', effect: 'working', power: 100, cooldown: 6000, price: 750, minLevel: 3 },
  // ── level 4 ──
  { id: 'hydro-jet', icon: 'water-gun', effect: 'working', power: 100, cooldown: 4000, price: 1500, minLevel: 4 },
  // ── level 5 ──
  { id: 'robot-arm', icon: 'robot-arm', effect: 'working', power: 100, cooldown: 2000, price: 3000, minLevel: 5 },
];

export const STARTING_TOOLS = TOOLS.filter(t => t.starting);
export const SHOP_TOOLS = TOOLS.filter(t => !t.starting);
// Spelers van vóór Sprint 9 begonnen met deze acht; zij houden ze (zie state.js).
export const LEGACY_STARTING_TOOLS = ['plunger', 'toilet-snake', 'drain-cleaner', 'hot-water', 'rubber-duck', 'confetti-cannon', 'flamingo', 'disco-ball'];
