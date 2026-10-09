// Bronvermelding voor het credits-scherm. Houd gelijk met CREDITS.md.
import { GAME_ICON_CREDITS } from './icon-credits.js';

export const CREDITS = [
  { group: '3D-modellen', items: [
    { title: 'Toilet', author: 'HippoStance', license: 'CC BY 4.0', url: 'https://skfb.ly/6S9CM' },
    { title: 'Wooden Bucket', author: 'romullus', license: 'CC BY-SA 4.0', url: 'https://skfb.ly/6FRTz' },
    { title: 'Old Rusted Bucket v1', author: 'GameDev Nick', license: 'CC BY 4.0', url: 'https://skfb.ly/onACK' },
    { title: 'Plastic Bucket', author: 'MaX3Dd', license: 'CC BY 4.0', url: 'https://skfb.ly/oSNCN' },
    { title: 'Metal bucket', author: 'Kozlov Maksim', license: 'CC BY 4.0', url: 'https://skfb.ly/6TGrU' },
    { title: 'Pair of buckets', author: 'Sousinho', license: 'CC BY 4.0', url: 'https://skfb.ly/ozDUF' },
  ], note: 'Modellen zijn verkleind (textures naar WebP, max. 1024 px). De houten emmer blijft onder CC BY-SA 4.0 beschikbaar in assets/models/buckets/.' },
  { group: 'Textures en licht', items: [
    { title: 'Tiles101, WoodFloor041', author: 'ambientCG', license: 'CC0', url: 'https://ambientcg.com' },
    { title: 'HDRI "Bathroom"', author: 'Poly Haven', license: 'CC0', url: 'https://polyhaven.com' },
  ] },
  { group: 'Iconen', items: [
    { title: 'Interface-iconen', author: 'Lucide', license: 'ISC', url: 'https://lucide.dev' },
    ...GAME_ICON_CREDITS.map(c => ({ title: `Spel-iconen (${c.icons.length})`, author: c.author, license: 'CC BY 3.0', url: c.url })),
  ] },
  { group: 'Techniek', items: [
    { title: 'three.js r170', author: 'three.js authors', license: 'MIT', url: 'https://threejs.org' },
  ] },
];
