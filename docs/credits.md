# The Flush Factor — Credits

Bronvermelding van alles wat niet zelf gemaakt is. Het credits-scherm in het spel (menu → Credits)
toont dezelfde gegevens uit `js/data/credits.js`.

Volgorde: 3D-modellen · textures en licht · iconen · geluiden en muziek · lettertypen · code van anderen.

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
- Gebruikt (44): menu, arrow-left, shopping-cart, trash-2, volume-2, info, maximize, switch-camera, x, chevron-down, lock, coins, trophy, check, circle-check, zap, flame, sparkles, wrench, plus, layout-grid, layers, toilet, smartphone, tablet, rotate-cw, triangle-alert, paintbrush, eye, droplets, scan-eye, chevron-left, chevron-right, star, gift, target, hammer, euro, arrow-up, globe, arrow-left-right, user-x, shield-check, volume-x

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
| `care` | [bubbles](https://game-icons.net/1x1/lorc/bubbles.html) | Lorc |
| `repair-kit` | [sticking-plaster](https://game-icons.net/1x1/lorc/sticking-plaster.html) | Lorc |
| `new-seat` | [auto-repair](https://game-icons.net/1x1/lorc/auto-repair.html) | Lorc |
| `new-lid` | [toolbox](https://game-icons.net/1x1/delapouite/toolbox.html) | Delapouite |
| `toilet-brush` | [toothbrush](https://game-icons.net/1x1/caro-asercion/toothbrush.html) | Caro Asercion |
| `toilet-cleaner` | [liquid-soap](https://game-icons.net/1x1/delapouite/liquid-soap.html) | Delapouite |
| `mop` | [broom](https://game-icons.net/1x1/delapouite/broom.html) | Delapouite |
| `scrubber` | [floor-polisher](https://game-icons.net/1x1/delapouite/floor-polisher.html) | Delapouite |
| `sponge` | [soap](https://game-icons.net/1x1/delapouite/soap.html) | Delapouite |
| `pressure-washer` | [splashy-stream](https://game-icons.net/1x1/lorc/splashy-stream.html) | Lorc |
| `spray` | [spray](https://game-icons.net/1x1/lorc/spray.html) | Lorc |
| `stain` | [goo-explosion](https://game-icons.net/1x1/lorc/goo-explosion.html) | Lorc |
| `medal` | [star-medal](https://game-icons.net/1x1/delapouite/star-medal.html) | Delapouite |
| `bare-wall` | [broken-wall](https://game-icons.net/1x1/delapouite/broken-wall.html) | Delapouite |
| `dirt-floor` | [earth-crack](https://game-icons.net/1x1/lorc/earth-crack.html) | Lorc |
| `wood-floor` | [wood-beam](https://game-icons.net/1x1/delapouite/wood-beam.html) | Delapouite |

## Geluiden en muziek (CC0)

Alle geluiden en de muziek zijn CC0 1.0 (publiek domein, vrij te gebruiken in een commerciële app); de licentie
is per geluid op de pagina van de bron nagekeken op 12 oktober 2026 (punt 96) en 13 oktober 2026 (punten
102–105). De bestanden staan in `assets/sounds/`: de effecten als mono mp3 (44,1 kHz, 80 kbit/s, samen ±300 kB),
de muziek als stereo mp3 (112 kbit/s, ±450 kB). Welk bestand bij welk moment hoort, in welke groep het valt en
hoe hard het klinkt staat in `js/data/sounds.js`; het geluid per gereedschap in `js/data/tools.js`.

| Bestand in het spel | Moment | Bron | Maker | Licentie | Wat ermee gedaan is |
|---|---|---|---|---|---|
| `flush.mp3` | spoelen | ["Toilet Flushing"](https://freesound.org/people/lorenzgillner/sounds/274448/) | lorenzgillner (Freesound) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | ingekort tot 2,3 s (de spoelanimatie duurt 1,8 s), uitfaden |
| `clog.mp3` | verstopt raken: het voorwerp valt in de pot | ["Water drop (splash)"](https://freesound.org/people/bolkmar/sounds/451126/) | bolkmar (Freesound) | CC0 1.0 | ingekort tot 0,7 s, harder gezet |
| `overflow.mp3` | overlopend toilet (loopt door) | ["Bubbling"](https://freesound.org/people/pillwave/sounds/423959/) | pillwave (Freesound) | CC0 1.0 | 4 s uitgeknipt, harder gezet; het spel maakt er bij het laden een naadloze lus van |
| `unclog.mp3` | ontstopt | ["Plop!"](https://freesound.org/people/Breviceps/sounds/447910/) + ["drain finishing/glug"](https://freesound.org/people/brittmosel/sounds/529300/) | Breviceps, brittmosel (Freesound) | CC0 1.0 | de plop, direct gevolgd door 1 s van het wegspoelen; samengevoegd tot één bestand |
| `tool-plunger.mp3` | gereedschap: ontstopper | ["Plunger Pop.wav"](https://freesound.org/people/praxis_bard/sounds/380324/) | praxis_bard (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-hot-water.mp3` | gereedschap: emmer heet water | ["Pouring Liquid.wav"](https://freesound.org/people/Dvideoguy/sounds/207781/) | Dvideoguy (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-rubber-duck.mp3` | gereedschap: rubberen eendje | ["Rubber Duck"](https://freesound.org/people/Slothfully_So/sounds/685067/) | Slothfully_So (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-confetti-cannon.mp3` | gereedschap: confettikanon | ["partypopper.flac"](https://freesound.org/people/Streety/sounds/26349/) | Streety (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-flamingo.mp3` | gereedschap: opblaasbare flamingo | ["balloon rub.wav"](https://freesound.org/people/simosco/sounds/235535/) | simosco (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-toilet-snake.mp3` | gereedschap: toiletveer | ["ratchet.wav"](https://freesound.org/people/Nomadyag/sounds/193058/) | Nomadyag (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-magic-wand.mp3` | gereedschap: toverstaf | ["cartoon_wink_magic_sparkle.wav"](https://freesound.org/people/MLaudio/sounds/511485/) | MLaudio (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-disco-ball.mp3` | gereedschap: discobal | ["Disco Beat 114 bpm.wav"](https://freesound.org/people/FullMetalJedi/sounds/339312/) | FullMetalJedi (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-megaphone.mp3` | gereedschap: megafoon | ["Megaphone/Radio Gibberish (5)"](https://freesound.org/people/Kastenfrosch/sounds/521971/) | Kastenfrosch (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-drain-cleaner.mp3` | gereedschap: ontstoppingsmiddel | ["Fizzle"](https://freesound.org/people/michorvath/sounds/388247/) | michorvath (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-tiny-elephant.mp3` | gereedschap: mini-olifant | ["Elephant Trumpets Growls.flac"](https://freesound.org/people/D.jones/sounds/527845/) | D.jones (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-ninja-unclogger.mp3` | gereedschap: ninja-ontstopper | ["Whoosh"](https://freesound.org/people/qubodup/sounds/60013/) | qubodup (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-super-plunger.mp3` | gereedschap: super ontstopper 3000 | ["Suction Cup"](https://freesound.org/people/michorvath/sounds/386885/) | michorvath (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-electric-plunger.mp3` | gereedschap: elektrische ontstopper | ["Electrical Drill.wav"](https://freesound.org/people/aidansamuel/sounds/540145/) | aidansamuel (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-hydro-jet.mp3` | gereedschap: hogedrukspuit | ["Hidrolavadora.wav"](https://freesound.org/people/valeulloam97/sounds/532823/) | valeulloam97 (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `tool-robot-arm.mp3` | gereedschap: robotarm | ["servomotor.wav"](https://freesound.org/people/vacuumfan7072/sounds/264592/) | vacuumfan7072 (Freesound) | CC0 1.0 | stilte vooraan weg, ingekort, volume gelijkgetrokken |
| `bucket-soft-1…3.mp3` | zacht voorwerp in de emmer (papier, sok, knuffel, eend, vis, banaan) | ["Impact Sounds"](https://kenney.nl/assets/impact-sounds) 1.0: `impactSoft_medium_000…002.ogg` | Kenney (kenney.nl) | CC0 1.0 | alleen omgezet van ogg naar mp3 |
| `bucket-hard-1…3.mp3` | klein hard voorwerp (autootje, telefoon, sleutel) | idem: `impactGeneric_light_000…002.ogg` | Kenney | CC0 1.0 | alleen omgezet |
| `bucket-heavy-1…3.mp3` | baksteen | idem: `impactWood_heavy_000…002.ogg` | Kenney | CC0 1.0 | alleen omgezet |
| `bucket-empty.mp3` | emmer legen | ["Aggressive Clatter 01"](https://freesound.org/people/leonelmail/sounds/461696/) | leonelmail (Freesound) | CC0 1.0 | ingekort tot 1,1 s |
| `scrub.mp3` | schoonmaken (één veeg) | ["toilet scrub.wav"](https://freesound.org/people/semccab/sounds/154369/) | semccab (Freesound) | CC0 1.0 | één veeg van 0,5 s uitgeknipt, harder gezet |
| `ui-click.mp3` | knoppen | ["Interface Sounds"](https://kenney.nl/assets/interface-sounds) 1.0: `click_001.ogg` | Kenney (kenney.nl) | CC0 1.0 | alleen omgezet van ogg naar mp3 |
| `ui-buy.mp3` | aankoop in de winkel | idem: `confirmation_001.ogg` | Kenney | CC0 1.0 | alleen omgezet |

### Muziek

| Bestand in het spel | Bron | Maker | Licentie | Wat ermee gedaan is |
|---|---|---|---|---|
| `music-deep-house.mp3` | ["Deep House.wav"](https://freesound.org/people/Johnnie_Holiday/sounds/564794/) (door de maker opgegeven: 128 tellen per minuut) | Johnnie_Holiday (Freesound) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | ingekort tot precies 64 tellen (16 maten), vertraagd naar 118 tellen per minuut zonder de toonhoogte te veranderen (32,5 s), iets zachter gezet |

**Versie van Freesound:** de originele bestanden kun je bij Freesound alleen downloaden als je bent ingelogd. Gebruikt
is daarom de voorbeeldversie die Freesound zelf van elk geluid aanbiedt (mp3, "hq"), en die is daarna ingekort.
Het is dezelfde opname onder dezelfde licentie, alleen al een keer gecomprimeerd. Wil je de originelen gebruiken:
log in bij Freesound, download ze via de links hierboven en geef ze aan Claude om opnieuw te knippen.

**Niet beluisterd door Claude:** de geluiden en de muziek zijn gekozen op titel, omschrijving, duur en gemeten
volume. Claude kan niet luisteren; Jenn beoordeelt op het testadres of ze passen. Een geluid vervangen: nieuw
bestand in `assets/sounds/`, de regel in `js/data/sounds.js`, en de bron hier en in `js/data/credits.js`.

## Lettertypen

Lokaal meegeleverd in `assets/fonts/`, elk met zijn licentietekst (`OFL.txt`). Alleen de Latijnse tekenset, als WOFF2.

| Lettertype | Gebruik | Makers | Licentie | Bron |
|---|---|---|---|---|
| **Lilita One** | koppen, knoppen, score (stijl "Sticker") | Juan Montoreano | [SIL Open Font License 1.1](https://openfontlicense.org) | https://fonts.google.com/specimen/Lilita+One |
| **Nunito** (600, 800) | lopende tekst | The Nunito Project Authors (Vernon Adams e.a.) | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nunito |
| Bungee, Rubik, Bangers, Comic Neue | alleen op de stijlvoorbeeldpagina `style-preview.html` (richtingen B en C); het spel laadt ze niet | The Bungee / Rubik / Bangers / Comic Neue Project Authors | SIL Open Font License 1.1 | https://fonts.google.com |

De bestanden komen ongewijzigd van Fontsource (https://fontsource.org), dat de Google Fonts-versies verpakt.

## Code van anderen

| Wat | Licentie | Bestand |
|---|---|---|
| three.js r170 (`three.module.min.js`, `GLTFLoader.js`, `RGBELoader.js`, `BufferGeometryUtils.js`) | MIT — https://github.com/mrdoob/three.js | `js/vendor/`, `js/utils/` |

## Zelf gemaakt

Wanden, vloer, plinten, wc-rolhouder, decoratie (spiegel, schilderij, poster, plank, kastje, plant),
de kleine voorwerpen die het toilet verstoppen, tegel- en vloerpatronen (ook de kale muur en de vieze vloer),
de vuillaag, barst en kalkrand van het toilet, vlekken en plassen, water en effecten, en het app-icoon
(Lucide-icoon "toilet" op een blauw vlak). Zie `AUDIT.md` voor de afweging per onderdeel.

## Niet in het spel

- `assets/_unused/models/toilet.glb` — "Toilets" van loafbrr_1 (CC0, opengameart.org/content/toilets), het vroegere reserve-toilet.
- `assets/_unused/originals/` — de ongecomprimeerde originelen van de modellen en textures hierboven.
