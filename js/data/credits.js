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
  // Geluiden (punt 96): allemaal CC0. Wat er per bestand mee gedaan is staat in docs/credits.md.
  { group: 'sounds', items: [
    { title: 'Toilet Flushing', author: 'lorenzgillner', license: 'CC0', url: 'https://freesound.org/people/lorenzgillner/sounds/274448/' },
    { title: 'Bubbling', author: 'pillwave', license: 'CC0', url: 'https://freesound.org/people/pillwave/sounds/423959/' },
    { title: 'Plop!', author: 'Breviceps', license: 'CC0', url: 'https://freesound.org/people/Breviceps/sounds/447910/' },
    { title: 'drain finishing/glug', author: 'brittmosel', license: 'CC0', url: 'https://freesound.org/people/brittmosel/sounds/529300/' },
    { title: 'Honk! (Vintage Bicycle Horn)', author: 'Breviceps', license: 'CC0', url: 'https://freesound.org/people/Breviceps/sounds/468441/' },
    { title: 'Impact Sounds', author: 'Kenney', license: 'CC0', url: 'https://kenney.nl/assets/impact-sounds' },
  ], note: 'soundsNote' },
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
