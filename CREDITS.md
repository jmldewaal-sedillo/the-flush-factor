# The Flush Factor — Credits

Bronvermelding van alles wat niet zelf gemaakt is. Het credits-scherm in het spel (menu → Credits)
toont dezelfde gegevens uit `js/data/credits.js`.

## 3D-modellen (gedownload)

| Model | Maker | Licentie | Bron | Bestand in het spel |
|---|---|---|---|---|
| "Toilet" | HippoStance | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | https://skfb.ly/6S9CM | `assets/models/toilet.glb` |
| "Wooden Bucket" | romullus | [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/) | https://skfb.ly/6FRTz | `assets/models/buckets/wooden_bucket.glb` |
| "Old Rusted Bucket v1" | GameDev Nick *(te bevestigen, zie onder)* | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | https://skfb.ly/onACK | `assets/models/buckets/rusted_bucket.glb` |
| "Plastic Bucket" | MaX3Dd | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | https://skfb.ly/oSNCN | `assets/models/buckets/plastic_bucket.glb` |
| "Metal bucket" | Kozlov Maksim | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | https://skfb.ly/6TGrU | `assets/models/buckets/metal_bucket.glb` |
| "Pair of buckets" | Sousinho | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | https://skfb.ly/ozDUF | `assets/models/buckets/mop_bucket.glb` (alleen de grote emmer wordt getoond) |

**Wijzigingen:** alle modellen zijn verkleind met `tools/optimize-assets.sh` (textures naar WebP, maximaal 1024 px;
geometrie ongewijzigd). De originelen staan in `assets/_unused/originals/`.

**Share-alike:** de houten emmer valt onder CC BY-SA 4.0. De aangepaste (verkleinde) versie in deze repo is
onder dezelfde licentie beschikbaar. Dat geldt voor het model, niet voor de spelcode.

**Te bevestigen:** de metadata in het bestand van "Old Rusted Bucket v1" noemt *GameDev Nick* als maker;
in de oorspronkelijke notitie (`credits.txt`) stond *Coozy*. Vermoedelijk dezelfde maker met een nieuwe accountnaam.

## Textures en licht (CC0)

| Wat | Maker | Licentie | Bron |
|---|---|---|---|
| Tiles101 (wandtegels), WoodFloor041 (vloer) | Lennart Demes / ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Tiles101 · https://ambientcg.com/view?id=WoodFloor041 |
| HDRI "Bathroom" (reflecties) | Poly Haven | CC0 1.0 | https://polyhaven.com |

Omgezet naar WebP resp. verkleind naar 512×256.

## Iconen

Alle iconen staan als losse, ongewijzigde SVG-bestanden in `assets/icons/` en worden door
`tools/build-icons.mjs` samengevoegd tot `assets/icons/sprite.svg`. Welk icoon waarvoor dient staat in
`tools/icons.config.json`.

### Lucide — interface

- Bron: https://lucide.dev (pakket `lucide-static` 1.53.0)
- Licentie: ISC — zie `assets/icons/lucide/LICENSE`
- Gebruikt (31): menu, arrow-left, shopping-cart, trash-2, volume-2, info, maximize, switch-camera, x, chevron-down, lock, coins, trophy, check, circle-check, zap, flame, sparkles, wrench, plus, layout-grid, layers, toilet, smartphone, tablet, rotate-cw, triangle-alert, paintbrush, eye, droplets, scan-eye

### game-icons.net — spelvoorwerpen

- Bron: https://game-icons.net
- Licentie: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- Wijziging: alleen de kleur (zwart → de kleur van de knop); vormen ongewijzigd.

| Naam in het spel | Icoon op game-icons.net | Maker |
|---|---|---|
| `flush` | [vortex](https://game-icons.net/1x1/lorc/vortex.html) | Lorc |
| `plunger` | [plunger](https://game-icons.net/1x1/delapouite/plunger.html) | Delapouite |
| `spring` | [spring](https://game-icons.net/1x1/delapouite/spring.html) | Delapouite |
| `chemical-bottle` | [poison-bottle](https://game-icons.net/1x1/lorc/poison-bottle.html) | Lorc |
| `boiling-water` | [boiling-bubbles](https://game-icons.net/1x1/lorc/boiling-bubbles.html) | Lorc |
| `duck` | [plastic-duck](https://game-icons.net/1x1/delapouite/plastic-duck.html) | Delapouite |
| `party-popper` | [party-popper](https://game-icons.net/1x1/delapouite/party-popper.html) | Delapouite |
| `flamingo` | [flamingo](https://game-icons.net/1x1/delapouite/flamingo.html) | Delapouite |
| `disco-ball` | [mesh-ball](https://game-icons.net/1x1/lorc/mesh-ball.html) | Lorc |
| `muscle` | [muscle-up](https://game-icons.net/1x1/lorc/muscle-up.html) | Lorc |
| `ninja` | [ninja-mask](https://game-icons.net/1x1/lorc/ninja-mask.html) | Lorc |
| `magic-wand` | [fairy-wand](https://game-icons.net/1x1/lorc/fairy-wand.html) | Lorc |
| `elephant` | [elephant](https://game-icons.net/1x1/delapouite/elephant.html) | Delapouite |
| `megaphone` | [megaphone](https://game-icons.net/1x1/delapouite/megaphone.html) | Delapouite |
| `electric` | [electric](https://game-icons.net/1x1/sbed/electric.html) | sbed |
| `water-gun` | [water-gun](https://game-icons.net/1x1/delapouite/water-gun.html) | Delapouite |
| `robot-arm` | [mechanical-arm](https://game-icons.net/1x1/lorc/mechanical-arm.html) | Lorc |
| `crown` | [crown](https://game-icons.net/1x1/lorc/crown.html) | Lorc |
| `rocket` | [rocket](https://game-icons.net/1x1/lorc/rocket.html) | Lorc |
| `barrel` | [barrel](https://game-icons.net/1x1/delapouite/barrel.html) | Delapouite |
| `chessboard` | [empty-chessboard](https://game-icons.net/1x1/delapouite/empty-chessboard.html) | Delapouite |
| `stars` | [sparkles](https://game-icons.net/1x1/delapouite/sparkles.html) | Delapouite |
| `zigzag` | [air-zigzag](https://game-icons.net/1x1/lorc/air-zigzag.html) | Lorc |
| `diamond` | [cut-diamond](https://game-icons.net/1x1/lorc/cut-diamond.html) | Lorc |
| `rainbow` | [rainbow-star](https://game-icons.net/1x1/lorc/rainbow-star.html) | Lorc |
| `lava` | [lava](https://game-icons.net/1x1/sbed/lava.html) | sbed |
| `flower-pot` | [flower-pot](https://game-icons.net/1x1/lorc/flower-pot.html) | Lorc |
| `mirror` | [mirror-mirror](https://game-icons.net/1x1/lorc/mirror-mirror.html) | Lorc |
| `painting` | [mona-lisa](https://game-icons.net/1x1/delapouite/mona-lisa.html) | Delapouite |
| `poster` | [target-poster](https://game-icons.net/1x1/delapouite/target-poster.html) | Delapouite |
| `shelf` | [trophies-shelf](https://game-icons.net/1x1/delapouite/trophies-shelf.html) | Delapouite |
| `cabinet` | [lockers](https://game-icons.net/1x1/delapouite/lockers.html) | Delapouite |
| `bucket-wood` | [empty-wood-bucket-handle](https://game-icons.net/1x1/delapouite/empty-wood-bucket-handle.html) | Delapouite |
| `bucket-metal` | [empty-metal-bucket-handle](https://game-icons.net/1x1/delapouite/empty-metal-bucket-handle.html) | Delapouite |
| `bucket-plastic` | [beach-bucket](https://game-icons.net/1x1/delapouite/beach-bucket.html) | Delapouite |
| `bucket-rusty` | [foundry-bucket](https://game-icons.net/1x1/delapouite/foundry-bucket.html) | Delapouite |
| `bucket-mop` | [paint-bucket](https://game-icons.net/1x1/delapouite/paint-bucket.html) | Delapouite |
| `water-drops` | [droplets](https://game-icons.net/1x1/lorc/droplets.html) | Lorc |
| `music` | [musical-notes](https://game-icons.net/1x1/delapouite/musical-notes.html) | Delapouite |

## Code van anderen

| Wat | Licentie | Bestand |
|---|---|---|
| three.js r170 (`three.module.min.js`, `GLTFLoader.js`, `RGBELoader.js`, `BufferGeometryUtils.js`) | MIT — https://github.com/mrdoob/three.js | `js/vendor/`, `js/utils/` |

## Zelf gemaakt

Wanden, vloer, plinten, wc-rolhouder, decoratie (spiegel, schilderij, poster, plank, kastje, plant),
de kleine voorwerpen die het toilet verstoppen, tegel- en vloerpatronen, water en effecten, en het app-icoon
(Lucide-icoon "toilet" op een blauw vlak). Zie `AUDIT.md` voor de afweging per onderdeel.

## Niet in het spel

- `assets/_unused/models/toilet.glb` — "Toilets" van loafbrr_1 (CC0, opengameart.org/content/toilets), het vroegere reserve-toilet.
- `assets/_unused/originals/` — de ongecomprimeerde originelen van de modellen en textures hierboven.
