// Geluiden en muziek (punten 96 en 102–106). Alles wat je wilt bijstellen staat hier: welk bestand bij
// welk geluid hoort, in welke groep het valt en hoe hard het klinkt. De bestanden staan in assets/sounds/
// (kort, mono mp3; de muziek stereo); bron en licentie per geluid: docs/credits.md en het credits-scherm
// (js/data/credits.js). Welk geluid een gereedschap maakt staat bij het gereedschap zelf, in tools.js
// (`sound`), en welk geluid een voorwerp in de emmer maakt in clog-props.js.
//   group:   de regelaar in de geluidsinstellingen waar dit geluid onder valt (zie SOUND_GROUPS)
//   files:   één bestand, of meerdere varianten (er wordt nooit twee keer achter elkaar dezelfde gekozen)
//   gain:    volume van dit geluid ten opzichte van de rest (0–1)
//   loop:    blijft doorlopen zolang het spel dat vraagt (overlopen)
//   restart: een nieuwe keer afspelen kapt de vorige af (spoelen: snel achter elkaar tikken)
//   duck:    de muziek gaat zachter zolang dit geluid klinkt (belangrijke momenten)
export const SOUND_DIR = 'assets/sounds/';

// De regelaars in de geluidsinstellingen, in volgorde, met het icoon en de stand van een nieuw profiel.
export const SOUND_GROUPS = [
  { id: 'music',  icon: 'music',       on: true, volume: 0.5 },
  { id: 'water',  icon: 'droplets',    on: true, volume: 0.8 },     // spoelen, overlopen, verstoppen
  { id: 'tools',  icon: 'wrench',      on: true, volume: 0.8 },
  { id: 'bucket', icon: 'bucket-wood', on: true, volume: 0.8 },     // emmer en schoonmaak
  { id: 'ui',     icon: 'layout-grid', on: true, volume: 0.6 },     // knoppen en winkel
];

export const SOUNDS = {
  // ── toilet & water ──
  flush:          { group: 'water', files: ['flush.mp3'], gain: 0.9, restart: true, duck: true },   // 2,3 s; de spoelanimatie duurt 1,8 s
  clog:           { group: 'water', files: ['clog.mp3'], gain: 1 },                               // het voorwerp valt in de pot
  overflow:       { group: 'water', files: ['overflow.mp3'], gain: 0.75, loop: true },
  unclog:         { group: 'water', files: ['unclog.mp3'], gain: 1, duck: true },                 // plop + wegspoelen
  // ── emmer & schoonmaak ──
  'bucket-soft':  { group: 'bucket', files: ['bucket-soft-1.mp3', 'bucket-soft-2.mp3', 'bucket-soft-3.mp3'], gain: 0.7 },
  'bucket-hard':  { group: 'bucket', files: ['bucket-hard-1.mp3', 'bucket-hard-2.mp3', 'bucket-hard-3.mp3'], gain: 0.8 },
  'bucket-heavy': { group: 'bucket', files: ['bucket-heavy-1.mp3', 'bucket-heavy-2.mp3', 'bucket-heavy-3.mp3'], gain: 1 },
  'bucket-empty': { group: 'bucket', files: ['bucket-empty.mp3'], gain: 0.9 },
  scrub:          { group: 'bucket', files: ['scrub.mp3'], gain: 0.7, restart: true },
  // ── interface ──
  'ui-click':     { group: 'ui', files: ['ui-click.mp3'], gain: 0.6 },
  'ui-buy':       { group: 'ui', files: ['ui-buy.mp3'], gain: 0.8 },
  // ── gereedschap: elk een eigen geluid (punt 104). De sleutel is tool-<id van het gereedschap>. ──
  'tool-plunger':          { group: 'tools', files: ['tool-plunger.mp3'], gain: 1 },
  'tool-hot-water':        { group: 'tools', files: ['tool-hot-water.mp3'], gain: 0.9 },
  'tool-rubber-duck':      { group: 'tools', files: ['tool-rubber-duck.mp3'], gain: 0.8 },
  'tool-confetti-cannon':  { group: 'tools', files: ['tool-confetti-cannon.mp3'], gain: 0.9 },
  'tool-flamingo':         { group: 'tools', files: ['tool-flamingo.mp3'], gain: 1 },
  'tool-toilet-snake':     { group: 'tools', files: ['tool-toilet-snake.mp3'], gain: 0.9 },
  'tool-magic-wand':       { group: 'tools', files: ['tool-magic-wand.mp3'], gain: 0.8 },
  'tool-disco-ball':       { group: 'tools', files: ['tool-disco-ball.mp3'], gain: 0.7 },
  'tool-megaphone':        { group: 'tools', files: ['tool-megaphone.mp3'], gain: 0.7 },
  'tool-drain-cleaner':    { group: 'tools', files: ['tool-drain-cleaner.mp3'], gain: 1 },
  'tool-tiny-elephant':    { group: 'tools', files: ['tool-tiny-elephant.mp3'], gain: 0.6 },
  'tool-ninja-unclogger':  { group: 'tools', files: ['tool-ninja-unclogger.mp3'], gain: 0.9 },
  'tool-super-plunger':    { group: 'tools', files: ['tool-super-plunger.mp3'], gain: 1 },
  'tool-electric-plunger': { group: 'tools', files: ['tool-electric-plunger.mp3'], gain: 0.7 },
  'tool-hydro-jet':        { group: 'tools', files: ['tool-hydro-jet.mp3'], gain: 0.6 },
  'tool-robot-arm':        { group: 'tools', files: ['tool-robot-arm.mp3'], gain: 0.8 },
};

// Achtergrondmuziek (punt 105): één lus. Wordt pas geladen na het startscherm, los van de effecten.
// seconds: de exacte lengte van de lus (64 tellen, 16 maten, op ±118 tellen per minuut: 1434573 samples bij
// 44,1 kHz, geteld na het knippen). Daar springt hij terug naar het begin; het bestand heeft daarna nog een
// korte uitloop, zodat de decoder nooit te vroeg ophoudt.
export const MUSIC = { group: 'music', file: 'music-deep-house.mp3', gain: 0.7, seconds: 1434573 / 44100 };
// Zachter tijdens belangrijke geluiden: tot dit deel van het volume, zo snel omlaag en zo snel weer omhoog (s).
export const DUCK = { level: 0.35, down: 0.08, up: 0.5 };

// Een werkend gereedschap laat eerst zijn eigen geluid horen; zoveel seconden later volgt het ontstopt-geluid.
export const UNCLOG_AFTER_TOOL = 0.25;

// Instellingen van een nieuw profiel: niets gedempt, elke groep op zijn eigen stand.
export const soundDefaults = () => ({
  muted: false,
  groups: Object.fromEntries(SOUND_GROUPS.map(g => [g.id, { on: g.on, volume: g.volume }])),
});
export const VOLUME_STEP = 0.05;

// Overgangen in seconden: de naad van een doorlopend geluid, en het in- en uitfaden bij starten en stoppen.
export const LOOP_CROSSFADE = 0.4;
export const LOOP_FADE = 0.25;
// Stilte vooraan een bestand wordt bij het laden overgeslagen: alles onder deze sterkte telt als stilte.
export const LEAD_THRESHOLD = 0.02;
