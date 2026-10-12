// Geluiden (punt 96). Alles wat je wilt bijstellen staat hier: welk bestand bij welk moment hoort en hoe
// hard het klinkt. De bestanden staan in assets/sounds/ (kort, mono, mp3); bron en licentie per geluid:
// docs/credits.md en het credits-scherm (js/data/credits.js).
//   files: één bestand, of meerdere varianten (er wordt nooit twee keer achter elkaar dezelfde gekozen)
//   gain:  volume van dit geluid ten opzichte van de rest (0–1)
//   loop:  blijft doorlopen zolang het spel dat vraagt (overlopen)
//   restart: een nieuwe keer afspelen kapt de vorige af (spoelen: snel achter elkaar tikken)
export const SOUND_DIR = 'assets/sounds/';

export const SOUNDS = {
  flush:          { files: ['flush.mp3'], gain: 0.9, restart: true },     // 2,3 s: de spoelanimatie duurt 1,8 s, daarna loopt het weg
  overflow:       { files: ['overflow.mp3'], gain: 0.75, loop: true },
  unclog:         { files: ['unclog.mp3'], gain: 1 },                     // plop + wegspoelen
  chaos:          { files: ['chaos.mp3'], gain: 0.7 },                    // toeter: dit gereedschap doet niets nuttigs
  'bucket-soft':  { files: ['bucket-soft-1.mp3', 'bucket-soft-2.mp3', 'bucket-soft-3.mp3'], gain: 0.7 },
  'bucket-hard':  { files: ['bucket-hard-1.mp3', 'bucket-hard-2.mp3', 'bucket-hard-3.mp3'], gain: 0.8 },
  'bucket-heavy': { files: ['bucket-heavy-1.mp3', 'bucket-heavy-2.mp3', 'bucket-heavy-3.mp3'], gain: 1 },
};

// Instellingen van een nieuw profiel. Het volume loopt van 0 tot 1.
export const SOUND_DEFAULTS = { on: true, volume: 0.8 };
export const VOLUME_STEP = 0.05;

// Overgangen in seconden: de naad van een doorlopend geluid, en het in- en uitfaden bij starten en stoppen.
export const LOOP_CROSSFADE = 0.4;
export const LOOP_FADE = 0.25;
