// Schoonmaak en reparatie (punten 80, 83 en 92). Alles wat je hier bijstelt werkt direct door in het spel.
// Namen en omschrijvingen staan in de taalbestanden (js/i18n/, sleutels item.<id>.*).

// Gebreken van het kapotte toilet waarmee nieuwe spelers beginnen. Elk gebrek heeft één reparatie.
export const DEFECTS = { seat: {}, lid: {}, chip: {} };

// Reparaties: één keer te gebruiken. Kopen = meteen uitvoeren (met animatie in de scène); daarna is hij op.
export const REPAIRS = [
  { id: 'repair-kit', icon: 'repair-kit', price: 60, minLevel: 1, fixes: 'chip', uses: 1 },
  { id: 'new-seat', icon: 'new-seat', price: 120, minLevel: 1, fixes: 'seat', uses: 1 },
  { id: 'new-lid', icon: 'new-lid', price: 150, minLevel: 1, fixes: 'lid', uses: 1 },
];

// Schoonmaakspullen raken op (punt 92).
// targets: waar het voor is ('toilet', 'floor', 'wall'). power: hoeveel vuil één veeg weghaalt (1 = alles).
// uses: hoe vaak je ermee kunt vegen voordat het op is; daarna koop je een nieuwe. Elke veeg die vuil weghaalt
// telt als één keer. Duurdere spullen gaan langer mee én halen meer weg per veeg.
//   vegen per vlek = 1 / power (afgerond naar boven) → vlekken per aankoop = uses / dat aantal
export const CLEANERS = [
  { id: 'sponge', icon: 'sponge', price: 60, minLevel: 1, targets: ['wall'], power: 0.34, uses: 6 },                      // 2 vlekken
  { id: 'toilet-brush', icon: 'toilet-brush', price: 80, minLevel: 1, targets: ['toilet'], power: 0.34, uses: 6 },        // 2 keer het toilet
  { id: 'mop', icon: 'mop', price: 100, minLevel: 1, targets: ['floor'], power: 0.34, uses: 6 },                          // 2 vlekken
  { id: 'spray', icon: 'spray', price: 250, minLevel: 2, targets: ['wall'], power: 0.6, uses: 10 },                       // 5 vlekken
  { id: 'toilet-cleaner', icon: 'toilet-cleaner', price: 300, minLevel: 2, targets: ['toilet'], power: 1, uses: 5 },      // 5 keer het toilet
  { id: 'scrubber', icon: 'scrubber', price: 800, minLevel: 4, targets: ['floor'], power: 1, uses: 12 },                  // 12 vlekken
  { id: 'pressure-washer', icon: 'pressure-washer', price: 1200, minLevel: 4, targets: ['wall', 'floor'], power: 1, uses: 20 },   // 20 vlekken
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
