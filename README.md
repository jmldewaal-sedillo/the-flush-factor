# The Flush Factor

Het meest absurde spoelspel ooit gemaakt. Mobile-first PWA in vanilla JavaScript met een 3D-wc-hokje (three.js).

- Live (branch `main`): https://jmldewaal-sedillo.github.io/the-flush-factor/
- Planning: [ROADMAP.md](ROADMAP.md) · Controle van de rebuild: [AUDIT.md](AUDIT.md) · Bronnen: [CREDITS.md](CREDITS.md)

## Starten en testen

```bash
npm install          # eenmalig (alleen Playwright)
npm run serve        # http://localhost:5000/the-flush-factor/
```

De testserver (`tools/serve.mjs`) zet het spel bewust in de submap `/the-flush-factor/`, net als GitHub Pages.
Een pad dat met `/` begint geeft dan meteen een 404 in plaats van pas op de live site.

Het spel gebruikt ES-modules en werkt dus niet via `file://`.

### Op een laptop

Op een breed scherm zonder touch opent het spel in een **preview**: een telefoon- of tabletframe met knoppen voor
formaat, draaien en de schermuitsparing (Notch / Punch-hole / Geen). De preview geeft de bijbehorende safe-area
echt door aan het spel, zodat je ziet wat er op een telefoon gebeurt.

| URL-parameter | Gedrag |
|---|---|
| `?preview=phone` / `?preview=off` | Preview aan of uit forceren |
| `?safe=47,0,34,0` | Safe-area simuleren: boven, rechts, onder, links (pixels) |
| `?quality=low\|medium\|high` | Kwaliteitsniveau forceren (anders automatisch) |
| `?clogs=off` | Geen willekeurige verstoppingen (handig bij uitproberen) |
| `?sw=off` | Service worker niet registreren |

### Op een telefoon

Via GitHub Pages (branch `main`). Een andere branch testen: zie "Een branch testen" onderaan.

## Projectstructuur

```
index.html            Pagina: 3D-scène, zwevende knoppen, winkel, credits
manifest.json, sw.js  PWA: installeerbaar en offline speelbaar
css/                  style.css (layout, safe-area), animations.css
js/
  game.js             Coördinator: spelregels, game-loop, koppeling logica ↔ weergave
  state.js            Spelstand, opslaan/laden, migratie van oude opslag
  clog.js             Verstoppingen: kans, waterstand, overloop          (geen DOM, geen 3D)
  inventory.js        Gereedschap: bezit, cooldown, gebruik              (geen DOM, geen 3D)
  shop.js             Winkel met uitklapbare categorieën
  purchases.js        Koppelpunt voor echte aankopen (nu een stub)
  events.js           Eventbus tussen logica en weergave
  renderer3d.js       Bouwt de 3D-scène en luistert naar de eventbus
  boot.js             Gesimuleerde safe-area (?safe=…)
  phone-preview.js    Preview op laptop/desktop
  data/               ALLE inhoud en instellingen (zie hieronder)
  three/              3D-modules: context, room, toilet, water, bucket, props, decor, camera, effects, patterns
  ui/                 hud.js (knoppen, meldingen), chaos.js (chaos-effecten), icons.js
  vendor/, utils/     three.js r170 (MIT)
assets/
  models/             toilet.glb + buckets/*.glb (gecomprimeerd)
  textures/, hdri/    tegels, vloer, omgevingslicht
  icons/              lucide/, game-icons/ (bron-SVG's), sprite.svg (gegenereerd), app/ (app-iconen)
  _unused/            originelen en niet-gebruikte modellen (worden niet geladen)
tools/                serve, build-icons, build-sw, optimize-assets, model-viewer
tests/                Playwright-tests per onderwerp
```

De weergave weet niets van de spelregels: `game.js` stuurt events (`flush`, `clog`, `unclog`, `water`, …) over de
eventbus en `renderer3d.js` tekent. `clog.js` en `inventory.js` raken de DOM en three.js niet aan.

## Iets toevoegen zonder code te herschrijven

Alles staat in `js/data/`:

| Wat | Bestand | Toevoegen = |
|---|---|---|
| Gereedschap | `tools.js` | een regel (effect `working` met `power`, of `chaos`) |
| Levels | `levels.js` | een regel met drempel en moeilijkheid |
| Emmers (capaciteit in liters) | `buckets.js` | een regel + GLB in `assets/models/buckets/` |
| Voorwerpen in de verstopping | `clog-props.js` | een regel + bouwfunctie in `three/props.js` |
| Toiletten, tegels, vloeren, decoratie | `cosmetics.js` | een regel (decoratie: + bouwfunctie in `three/decor.js`) |
| Decoratie-ankerpunten, camerastanden, maten van het hokje | `room.js` | een regel |
| Puntenpakketten | `packages.js` | een regel |
| Winkelcategorieën | `shop.js` | een regel |
| Teksten | `texts.js` | — |
| Punten, straffen, waterfases, effect-intensiteit | `config.js` | — |
| Iconen | `tools/icons.config.json` | naam toevoegen en `npm run icons` |

## Bouwen

Er is geen bundler; de browser laadt de bronbestanden direct. Twee dingen worden gegenereerd:

```bash
npm run build    # iconen-sprite + bestandslijst en versie in sw.js
npm run icons    # ontbrekende bron-iconen downloaden (Lucide, game-icons.net) en sprite bouwen
npm run assets   # modellen/textures opnieuw comprimeren uit assets/_unused/originals/
```

Draai `npm run build` na elke wijziging in `js/`, `css/` of `assets/`; de test `sw.spec.js` faalt als je het vergeet.

## Tests

```bash
npx playwright install chromium   # eenmalig
npm test                          # alles, op 4 formaten (telefoon/tablet, staand/liggend)
npx playwright test shop          # één onderwerp
```

| Bestand | Controleert |
|---|---|
| `boot.spec.js` | geen console-fouten, 404's of externe verzoeken; eerste laadbeurt < 4 MB; melding zonder WebGL |
| `emoji.spec.js` | geen emoji in broncode, manifest, preview en interface (alle toestanden); elk icoon bestaat |
| `shop.spec.js` | zeven categorieën, uitklappen, bewaren, kopen, activeren, effect in 3D |
| `bucket.spec.js` | vullen, legen, herladen; volle emmer; emmerweergave; alle vijf emmers en hun hengsel |
| `camera.spec.js` | zes camerastanden, swipen, "+"-plekken |
| `clog.spec.js` | verstopping, waterfases, chaos, ontstoppen, overlopen met plas |
| `layout.spec.js` | alle knoppen in beeld en zonder overlap, met notch- en punch-hole-profiel; scène tot achter de notch |
| `sw.spec.js` | service worker in een submap, volledige cache, offline, geen herlaad; manifest |
| `screenshots.spec.js` | screenshots van alle toestanden in `tests/screenshots/<formaat>/` om na te kijken |
| `live.spec.js` | winkel op de live site in een schoon profiel (alleen met `LIVE_URL=…`) |

De tests wachten op het spel zelf (`window.__game`), niet op vaste tijden. `window.__game` is ook handig in de
console: `__game.forceClog('duck')`, `__game.setScore(5000)`, `__game.snapshot()`.

## Een branch testen

GitHub Pages toont alleen `main`. Een andere branch (bijvoorbeeld `rebuild`) probeer je lokaal:

```bash
git fetch && git checkout rebuild
npm install
npm run serve        # open http://localhost:5000/the-flush-factor/
npm test
```

## Play Store (later)

Voorbereid voor een TWA: `manifest.json` met `display: standalone`, echte iconen en een service worker.
Volgende stappen staan in ROADMAP.md (punten 58–63 en "Versie 1.0").
