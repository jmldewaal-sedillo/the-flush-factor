// Gereedschap. effect 'working' haalt `power` procent water weg; 'chaos' doet alleen iets grappigs.
// starting: true = zit vanaf het begin in de inventaris; anders te koop (price, minLevel).
export const TOOLS = [
  { id: 'plunger',         name: 'Ontstopper',            icon: 'plunger',         effect: 'working', power: 45,  cooldown: 12000, starting: true,  description: 'De klassieke oplossing. Pomp pomp pomp!' },
  { id: 'toilet-snake',    name: 'Toiletveer',            icon: 'spring',          effect: 'working', power: 75,  cooldown: 28000, starting: true,  description: 'Gaat diep… diep… dieper…' },
  { id: 'drain-cleaner',   name: 'Ontstoppingsmiddel',    icon: 'chemical-bottle', effect: 'working', power: 90,  cooldown: 40000, starting: true,  description: 'Chemisch geweld. Snel, maar met gevolgen voor de planeet.' },
  { id: 'hot-water',       name: 'Emmer heet water',      icon: 'boiling-water',   effect: 'working', power: 55,  cooldown: 18000, starting: true,  description: 'Ouderwets maar effectief. Au au au!' },
  { id: 'rubber-duck',     name: 'Rubberen eendje',       icon: 'duck',            effect: 'chaos', chaos: 'ducks',     cooldown: 10000, starting: true, description: 'Wetenschappelijk bewezen nutteloos.' },
  { id: 'confetti-cannon', name: 'Confettikanon',         icon: 'party-popper',    effect: 'chaos', chaos: 'confetti',  cooldown: 12000, starting: true, description: 'Want soms moet je gewoon FEESTEN.' },
  { id: 'flamingo',        name: 'Opblaasbare flamingo',  icon: 'flamingo',        effect: 'chaos', chaos: 'flamingo',  cooldown: 14000, starting: true, description: 'Een roze flamingo in je toilet. Waarom niet.' },
  { id: 'disco-ball',      name: 'Discobal',              icon: 'disco-ball',      effect: 'chaos', chaos: 'disco',     cooldown: 20000, starting: true, description: 'Het toilet DANST. Het toilet DANST ECHT.' },

  { id: 'magic-wand',       name: 'Toverstaf',              icon: 'magic-wand', effect: 'chaos', chaos: 'magic',     cooldown: 8000,  price: 200,  minLevel: 1, description: 'Abracadabra! …Het werkt niet. Maar het ziet er GEWELDIG uit.' },
  { id: 'tiny-elephant',    name: 'Mini-olifant',           icon: 'elephant',   effect: 'chaos', chaos: 'elephant',  cooldown: 15000, price: 300,  minLevel: 1, description: 'Spuit water. Chaos gegarandeerd.' },
  { id: 'ninja-unclogger',  name: 'Ninja-ontstopper',       icon: 'ninja',      effect: 'working', power: 80,  cooldown: 5000,  price: 350,  minLevel: 1, description: 'Zo snel dat je het bijna niet ziet.' },
  { id: 'super-plunger',    name: 'Super Ontstopper 3000',  icon: 'muscle',     effect: 'working', power: 100, cooldown: 8000,  price: 500,  minLevel: 1, description: 'TURBOKRACHT. GEEN DISCUSSIE.' },
  { id: 'megaphone',        name: 'Megafoon',               icon: 'megaphone',  effect: 'chaos', chaos: 'megaphone', cooldown: 10000, price: 250,  minLevel: 2, description: 'SCHREEUW HET SCHOON! (het werkt niet)' },
  { id: 'electric-plunger', name: 'Elektrische ontstopper', icon: 'electric',   effect: 'working', power: 100, cooldown: 6000,  price: 750,  minLevel: 3, description: '3000 toeren per minuut. Voel de kracht.' },
  { id: 'hydro-jet',        name: 'Hogedrukspuit',          icon: 'water-gun',  effect: 'working', power: 100, cooldown: 4000,  price: 1500, minLevel: 4, description: 'Industriële waterdruk. FWOOSH. Weg ermee.' },
  { id: 'robot-arm',        name: 'Robotarm',               icon: 'robot-arm',  effect: 'working', power: 100, cooldown: 2000,  price: 3000, minLevel: 5, description: 'Grijpen. Uitrekken. Winnen. Altijd.' },
];

export const STARTING_TOOLS = TOOLS.filter(t => t.starting);
export const SHOP_TOOLS = TOOLS.filter(t => !t.starting);
