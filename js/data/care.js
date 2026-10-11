// Schoonmaak en reparatie (punten 80 en 83). Alles wat je hier bijstelt werkt direct door in het spel.

// Gebreken van het kapotte toilet waarmee nieuwe spelers beginnen. Elk gebrek heeft één reparatie.
export const DEFECTS = {
  seat: { label: 'Scheve bril' },
  lid:  { label: 'Barst in het deksel' },
  chip: { label: 'Stukje uit de rand' },
};

// Reparaties: eenmalig. Kopen = meteen uitvoeren (met animatie in de scène).
export const REPAIRS = [
  { id: 'repair-kit', name: 'Lijm & reparatieset', icon: 'repair-kit', price: 60,  minLevel: 1, fixes: 'chip', description: 'Plakt het stukje terug. Niemand die het ziet.' },
  { id: 'new-seat',   name: 'Nieuwe bril',         icon: 'new-seat',   price: 120, minLevel: 1, fixes: 'seat', description: 'Eindelijk recht zitten.' },
  { id: 'new-lid',    name: 'Nieuw deksel',        icon: 'new-lid',    price: 150, minLevel: 1, fixes: 'lid',  description: 'Zonder barst. Luxe.' },
];

// Schoonmaakspullen: je koopt ze één keer en gebruikt ze zo vaak je wilt.
// targets: waar het voor is ('toilet', 'floor', 'wall'). power: hoeveel vuil één veeg weghaalt (1 = alles).
export const CLEANERS = [
  { id: 'sponge',          name: 'Spons',             icon: 'sponge',          price: 60,   minLevel: 1, targets: ['wall'],          power: 0.34, description: 'Boenen. En nog eens boenen.' },
  { id: 'toilet-brush',    name: 'Wc-borstel',        icon: 'toilet-brush',    price: 80,   minLevel: 1, targets: ['toilet'],        power: 0.34, description: 'Niemands favoriet. Wel nodig.' },
  { id: 'mop',             name: 'Dweil en emmer',    icon: 'mop',             price: 100,  minLevel: 1, targets: ['floor'],         power: 0.34, description: 'Sop erin, vloer erdoor.' },
  { id: 'spray',           name: 'Schoonmaakspray',   icon: 'spray',           price: 250,  minLevel: 2, targets: ['wall'],          power: 0.6,  description: 'Pssst. Weg vlek.' },
  { id: 'toilet-cleaner',  name: 'Toiletreiniger',    icon: 'toilet-cleaner',  price: 300,  minLevel: 2, targets: ['toilet'],        power: 1,    description: 'Eén scheut en hij blinkt.' },
  { id: 'scrubber',        name: 'Schrobmachine',     icon: 'scrubber',        price: 800,  minLevel: 4, targets: ['floor'],         power: 1,    description: 'Brrrrrr. Vloer als nieuw.' },
  { id: 'pressure-washer', name: 'Hogedrukreiniger',  icon: 'pressure-washer', price: 1200, minLevel: 4, targets: ['wall', 'floor'], power: 1,    description: 'Alles weg. Ook het behang, bijna.' },
];

export const CARE = {
  // Troep tegen de muren (voorheen punt 76): na zoveel verstoppingen achter elkaar die overliepen.
  overflowsForMess: 3,
  messStains: { wall: 4, floor: 2 },   // hoeveel vlekken er dan bij komen
  // Loopt dezelfde verstopping vaker over, dan blijft er een plas op de vloer staan.
  overflowsForPuddle: 2,
  maxStains: 14,
  // Vies kost punten: per vieze plek (en een vies toilet telt als één plek) dit deel minder per spoelbeurt.
  penaltyPerDirt: 0.1,
  maxPenalty: 0.5,
  // Kapot toilet raakt sneller verstopt.
  brokenClogFactor: 1.5,
};

export const SURFACE_LABELS = { toilet: 'het toilet', floor: 'de vloer', wall: 'de muur' };
