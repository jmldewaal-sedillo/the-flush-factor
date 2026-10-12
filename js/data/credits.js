// Bronvermelding voor het credits-scherm. Houd gelijk met docs/credits.md.
// `group`, `note` en `titleKey` zijn sleutels uit de taalbestanden (credits.*); namen van werken en makers
// worden niet vertaald.
import { GAME_ICON_CREDITS } from './icon-credits.js';

export const CREDITS = [
  { group: 'models', items: [
    { title: 'Toilet', author: 'HippoStance', license: 'CC BY 4.0', url: 'https://skfb.ly/6S9CM' },
    { title: 'Wooden Bucket', author: 'romullus', license: 'CC BY-SA 4.0', url: 'https://skfb.ly/6FRTz' },
    { title: 'Old Rusted Bucket v1', author: 'GameDev Nick', license: 'CC BY 4.0', url: 'https://skfb.ly/onACK' },
    { title: 'Plastic Bucket', author: 'MaX3Dd', license: 'CC BY 4.0', url: 'https://skfb.ly/oSNCN' },
    { title: 'Metal bucket', author: 'Kozlov Maksim', license: 'CC BY 4.0', url: 'https://skfb.ly/6TGrU' },
    { title: 'Pair of buckets', author: 'Sousinho', license: 'CC BY 4.0', url: 'https://skfb.ly/ozDUF' },
  ], note: 'modelsNote' },
  { group: 'textures', items: [
    { title: 'Tiles101, WoodFloor041', author: 'ambientCG', license: 'CC0', url: 'https://ambientcg.com' },
    { title: 'HDRI "Bathroom"', author: 'Poly Haven', license: 'CC0', url: 'https://polyhaven.com' },
  ] },
  { group: 'icons', items: [
    { titleKey: 'uiIcons', author: 'Lucide', license: 'ISC', url: 'https://lucide.dev' },
    ...GAME_ICON_CREDITS.map(c => ({ titleKey: 'gameIcons', count: c.icons.length, author: c.author, license: 'CC BY 3.0', url: c.url })),
  ] },
  // Geluiden en muziek (punten 96 en 102–105): allemaal CC0. Wat er per bestand mee gedaan is staat in docs/credits.md.
  { group: 'sounds', items: [
    { title: 'Toilet Flushing', author: 'lorenzgillner', license: 'CC0', url: 'https://freesound.org/people/lorenzgillner/sounds/274448/' },
    { title: 'Bubbling', author: 'pillwave', license: 'CC0', url: 'https://freesound.org/people/pillwave/sounds/423959/' },
    { title: 'Plop!', author: 'Breviceps', license: 'CC0', url: 'https://freesound.org/people/Breviceps/sounds/447910/' },
    { title: 'drain finishing/glug', author: 'brittmosel', license: 'CC0', url: 'https://freesound.org/people/brittmosel/sounds/529300/' },
    { title: 'Water drop (splash)', author: 'bolkmar', license: 'CC0', url: 'https://freesound.org/people/bolkmar/sounds/451126/' },
    { title: 'Aggressive Clatter 01', author: 'leonelmail', license: 'CC0', url: 'https://freesound.org/people/leonelmail/sounds/461696/' },
    { title: 'toilet scrub.wav', author: 'semccab', license: 'CC0', url: 'https://freesound.org/people/semccab/sounds/154369/' },
    { title: 'Plunger Pop.wav', author: 'praxis_bard', license: 'CC0', url: 'https://freesound.org/people/praxis_bard/sounds/380324/' },
    { title: 'Pouring Liquid.wav', author: 'Dvideoguy', license: 'CC0', url: 'https://freesound.org/people/Dvideoguy/sounds/207781/' },
    { title: 'Rubber Duck', author: 'Slothfully_So', license: 'CC0', url: 'https://freesound.org/people/Slothfully_So/sounds/685067/' },
    { title: 'partypopper.flac', author: 'Streety', license: 'CC0', url: 'https://freesound.org/people/Streety/sounds/26349/' },
    { title: 'balloon rub.wav', author: 'simosco', license: 'CC0', url: 'https://freesound.org/people/simosco/sounds/235535/' },
    { title: 'ratchet.wav', author: 'Nomadyag', license: 'CC0', url: 'https://freesound.org/people/Nomadyag/sounds/193058/' },
    { title: 'cartoon_wink_magic_sparkle.wav', author: 'MLaudio', license: 'CC0', url: 'https://freesound.org/people/MLaudio/sounds/511485/' },
    { title: 'Disco Beat 114 bpm.wav', author: 'FullMetalJedi', license: 'CC0', url: 'https://freesound.org/people/FullMetalJedi/sounds/339312/' },
    { title: 'Megaphone/Radio Gibberish (5)', author: 'Kastenfrosch', license: 'CC0', url: 'https://freesound.org/people/Kastenfrosch/sounds/521971/' },
    { title: 'Fizzle', author: 'michorvath', license: 'CC0', url: 'https://freesound.org/people/michorvath/sounds/388247/' },
    { title: 'Elephant Trumpets Growls.flac', author: 'D.jones', license: 'CC0', url: 'https://freesound.org/people/D.jones/sounds/527845/' },
    { title: 'Whoosh', author: 'qubodup', license: 'CC0', url: 'https://freesound.org/people/qubodup/sounds/60013/' },
    { title: 'Suction Cup', author: 'michorvath', license: 'CC0', url: 'https://freesound.org/people/michorvath/sounds/386885/' },
    { title: 'Electrical Drill.wav', author: 'aidansamuel', license: 'CC0', url: 'https://freesound.org/people/aidansamuel/sounds/540145/' },
    { title: 'Hidrolavadora.wav', author: 'valeulloam97', license: 'CC0', url: 'https://freesound.org/people/valeulloam97/sounds/532823/' },
    { title: 'servomotor.wav', author: 'vacuumfan7072', license: 'CC0', url: 'https://freesound.org/people/vacuumfan7072/sounds/264592/' },
    { title: 'Impact Sounds', author: 'Kenney', license: 'CC0', url: 'https://kenney.nl/assets/impact-sounds' },
    { title: 'Interface Sounds', author: 'Kenney', license: 'CC0', url: 'https://kenney.nl/assets/interface-sounds' },
  ], note: 'soundsNote' },
  { group: 'music', items: [
    { title: 'Deep House.wav', author: 'Johnnie_Holiday', license: 'CC0', url: 'https://freesound.org/people/Johnnie_Holiday/sounds/564794/' },
  ], note: 'musicNote' },
  { group: 'fonts', items: [
    { title: 'Lilita One', author: 'Juan Montoreano', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Lilita+One' },
    { title: 'Nunito', author: 'The Nunito Project Authors', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Nunito' },
  ] },
  { group: 'tech', items: [
    { title: 'three.js r170', author: 'three.js authors', license: 'MIT', url: 'https://threejs.org' },
  ] },
];

// Vaste gegevens van de maker (zie CLAUDE.md in de Apps-map).
export const STUDIO = { name: 'Studio Sedillo', email: 'studio.sedillo@gmail.com', site: 'https://studiosedillo.com', kvk: '42122276', year: 2026 };
