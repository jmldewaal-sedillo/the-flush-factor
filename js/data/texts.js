// Alle teksten die via JavaScript in beeld komen (voorbereiding op meertaligheid, ROADMAP punt 62).

export const MESSAGES = {
  flushSuccess: ['SPOELEN!', 'Bravo!', 'Schoon!', 'Weg ermee!', 'Tot nooit meer ziens!', 'FWOOSH!', 'Goedendag!'],
  clogStart: ['Oh nee… niet weer.', 'Dat was geen gewone lunch…', 'MAYDAY, MAYDAY!', 'De natuur neemt wraak.', 'Blorp.', 'Calamiteit!', 'Dit ruikt naar problemen.'],
  alreadyClogged: ['Al verstopt! Gebruik gereedschap!', 'Spoelen helpt niet, Einstein.', 'BLURP! Nope.', 'Zo werkt dat niet.'],
  overflow: ['OVERSTROMING!', 'GROTE CHAOS!', 'HELP.', 'Hier is wc-papier voor uitgevonden.', 'Nee nee nee NEE.'],
  toolChaos: ['…Wat?', 'Dat hielp NIETS.', 'Creativiteit: 10. Effect: 0.', 'Interessante keuze.', '10/10 voor moed, 0/10 voor resultaat.'],
  toolNotClogged: ['Er is niets verstopt. Ontspan.', 'Bewaar dat voor als het nodig is.', 'Dit gereedschap heeft even niets te doen.'],
  unclogSuccess: ['ONTSTOPT!', 'YES YES YES!', 'VRIJ!!!', 'Meesterwerk!', 'Victorie!'],
};

export const T = {
  clogWarning: 'VERSTOPT!',
  best: n => `Beste: ${n}`,
  level: n => `Lv.${n}`,
  levelUp: (n, name) => `LEVEL ${n}: ${name.toUpperCase()}!`,
  combo: x => `×${x} COMBO!`,
  liters: (used, cap) => `${used.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / ${cap} L`,
  partial: 'Iets beter! Blijf proberen…',
  cooldown: 'Nog even afkoelen…',
  soundSoon: 'Geluid komt binnenkort!',
  bucketEmptyAlready: 'De emmer is al leeg!',
  bucketEmptied: 'Emmer geleegd!',
  bucketFull: pts => `Emmer vol! −${pts} punten`,
  penalty: pts => ` −${pts} punten`,
  inBucket: name => `In de emmer: ${name}`,
  anchorFree: label => `Vrije plek: ${label}. Decoratie vind je in de winkel.`,
  shop: {
    active: 'Actief', owned: 'In bezit', placed: 'Hangt er', lockedLevel: n => `Lv.${n}`,
    notEnough: price => `Niet genoeg punten! (${price} nodig)`,
    toolAdded: name => `${name} toegevoegd aan je gereedschap!`,
    bought: name => `${name} gekocht!`,
    purchaseSoon: 'Binnenkort beschikbaar',
    decoPlaced: name => `${name} geplaatst.`,
    decoRemoved: name => `${name} weggehaald.`,
  },
  noWebGL: {
    title: 'WebGL niet beschikbaar',
    body: 'The Flush Factor heeft 3D-beeld (WebGL) nodig en dat staat op dit apparaat of in deze browser uit. Probeer een andere browser of zet hardwareversnelling aan.',
  },
  loading: 'Laden…',
  loadError: 'Laden mislukt. Controleer je verbinding en probeer opnieuw.',
};
