# The Flush Factor

Het meest absurde spoelspel ooit gemaakt. Mobile-first PWA in vanilla JavaScript met een 3D-wc-hokje (three.js).

- Live (branch `main`): https://jmldewaal-sedillo.github.io/the-flush-factor/
- Test: https://jmldewaal-sedillo.github.io/the-flush-factor-test/ (noindex; repo `the-flush-factor-test`, zie [docs/testversie.md](docs/testversie.md))
- Privacy: `privacy.html` · Gegevens verwijderen: `delete.html`
- Planning: [ROADMAP.md](ROADMAP.md) · Controle van de rebuild: [AUDIT.md](AUDIT.md) · Bronnen: [docs/credits.md](docs/credits.md) · Afspraken: [CLAUDE.md](CLAUDE.md)

## Starten en testen

```bash
npm install          # eenmalig (alleen Playwright)
npm run serve        # http://localhost:5000/the-flush-factor/ (het adres staat in de terminal)
```

De testserver (`tools/serve.mjs`) zet het spel bewust in de submap `/the-flush-factor/`, net als GitHub Pages.
Een pad dat met `/` begint geeft dan meteen een 404 in plaats van pas op de live site.

**Poorten.** Je eigen server en de tests zitten elkaar niet in de weg:

| Wat | Poort | Als de poort bezet is |
|---|---|---|
| `npm run serve` | 5000 | neemt de eerstvolgende vrije (5001, 5002, …) en toont het adres in de terminal |
| `npm test` (Playwright) | 5599 | start en stopt zijn eigen server; staat er al een testserver op die poort, dan gebruikt hij die |

Kijk dus altijd naar het adres dat de terminal toont. Een andere poort kiezen kan met `node tools/serve.mjs 8080`
(of `PORT=8080`), voor de tests met `TEST_PORT=5600 npm test`. De testpoort staat op één plek: `tests/server.js`.

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
index.html            Pagina: 3D-scène, zwevende knoppen, winkel, profiel, credits
privacy.html, delete.html, verwijderen.html   Privacyverklaring en "gegevens verwijderen"
manifest.webmanifest, sw.js   PWA: installeerbaar en offline speelbaar
css/                  tokens.css (HET designbestand: kleuren, letters, randen, schaduwen), style.css, animations.css, pages.css
style-preview.html    Stijlvoorbeelden (drie richtingen; gekozen door Jenn: A · Sticker).
                      Hoort niet bij het spel; staat wel op het testadres.
js/
  game.js             Coördinator: spelregels, game-loop, koppeling logica ↔ weergave
  state.js            Spelstand, laden en bewaren, migratie van oudere versies
  storage.js          DE ENIGE plek die iets bewaart (prefix flushfactor.), overzetten, wissen, oude sleutels overzetten
  i18n/               Talen: index.js + één bestand per taal (nl is de bron); legal/ = privacytekst per taal
  pages.js            Toont de privacyverklaring en de verwijderpagina
  clog.js             Verstoppingen: kans, waterstand, overloop          (geen DOM, geen 3D)
  care.js             Schoonmaak en reparatie: toiletstaat, vlekken, straf, voorraad (geen DOM, geen 3D)
  inventory.js        Gereedschap: bezit, cooldown, gebruik              (geen DOM, geen 3D)
  shop.js             Winkel met uitklapbare categorieën
  purchases.js        Koppelpunt voor echte aankopen (nu een stub)
  auth.js             Koppelpunt voor inloggen met Google/Facebook (nu een stub)
  sound.js            Geluid: laden na de eerste tik, afspelen, lus bij overlopen, aan/uit en volume
  events.js           Eventbus tussen logica en weergave
  renderer3d.js       Bouwt de 3D-scène en luistert naar de eventbus
  boot.js             Gesimuleerde safe-area (?safe=…)
  phone-preview.js    Preview op laptop/desktop
  data/               ALLE inhoud en instellingen (zie hieronder)
  three/              3D-modules: context, room, toilet, water, bucket, props, decor, stains, camera, effects, patterns, geometry
  ui/                 hud.js (knoppen, meldingen, menu's), profile.js (welkom + profiel), data.js (overzetten en wissen), chaos.js, icons.js
  vendor/, utils/     three.js r170 (MIT)
assets/
  models/             toilet.glb + buckets/*.glb (gecomprimeerd)
  textures/, hdri/    tegels, vloer, omgevingslicht
  icons/              lucide/, game-icons/ (bron-SVG's), sprite.svg (gegenereerd), app/ (app-iconen)
  fonts/              Lilita One + Nunito (spel) en vier lettertypen voor de stijlvoorbeelden; elk met OFL.txt
  _unused/            originelen en niet-gebruikte modellen (worden niet geladen)
tools/                serve, build-icons, build-sw, bouw-site (testversie voor github.io), optimize-assets, model-viewer
tests/                Playwright-tests per onderwerp
docs/                 credits, privacy-audit, testversie, publiceren
store/                materiaal voor Google Play (begin)
```

De weergave weet niets van de spelregels: `game.js` stuurt events (`flush`, `clog`, `unclog`, `water`, …) over de
eventbus en `renderer3d.js` tekent. `clog.js` en `inventory.js` raken de DOM en three.js niet aan.

## Iets toevoegen zonder code te herschrijven

Alles staat in `js/data/`:

| Wat | Bestand | Toevoegen = |
|---|---|---|
| Gereedschap | `tools.js` | een regel (effect `working` met `power`, of `chaos`; `starting` of `price` + `minLevel`) |
| Schoonmaakspullen, reparaties, straf bij vuil | `care.js` | een regel (`targets`, `power`, `uses` = hoe vaak te gebruiken) |
| Levels | `levels.js` | een regel met drempel en moeilijkheid |
| Emmers (capaciteit in liters, binnenmaat) | `buckets.js` | een regel + GLB in `assets/models/buckets/`; binnenmaat meten met `__game.three.bucketMeasure()` |
| Voorwerpen in de verstopping | `clog-props.js` | een regel + bouwfunctie in `three/props.js` |
| Toiletten, tegels, vloeren, decoratie | `cosmetics.js` | een regel (decoratie: + bouwfunctie in `three/decor.js`) |
| Decoratie-ankerpunten, camerastanden, maten van het hokje | `room.js` | een regel |
| Puntenpakketten | `packages.js` | een regel |
| **Namen, omschrijvingen en alle andere tekst** | `js/i18n/<taal>.js` | de sleutel in **alle tien** bestanden (bv. `item.<id>.name`, `item.<id>.desc`); een test faalt als er één ontbreekt |
| Avatars | `profile.js` | een icoonnaam |
| Winkelcategorieën (met eigen kleur) | `shop.js` | een regel |
| Kleuren, lettertypen, randen, schaduwen | `css/tokens.css` | — |
| Teksten | `texts.js` | — |
| Punten, straffen, waterfases, effect-intensiteit | `config.js` | — |
| Iconen | `tools/icons.config.json` | naam toevoegen en `npm run icons` |

## Bediening in de scène

| Gebaar | Wat er gebeurt |
|---|---|
| Tik op het toilet | In de pot kijken; spoelen en ontstoppen kan daar ook |
| Tik op de emmer | Emmerweergave |
| Nog een tik (in een close-up, waar dan ook) | Terug naar het vorige standpunt |
| Tik op een muur | Naar die muur; nog een tik op dezelfde muur: terug naar het toilet |
| Vegen naar links/rechts | Linkermuur, midden, rechtermuur |
| Rustig slepen / knijpen | Rondkijken / zoomen |
| Tik op de scorebubbel | Profiel en statistieken |
| Sopje linksonder (alleen als er iets vies is) | Schoonmaakmiddel kiezen; daarna over de vieze plek vegen of tikken |
| Moersleutel linksboven | Gereedschap in- en uitklappen |
| Gereedschap lang indrukken | Naam tonen (gebruikt het niet) |

De tests maken een bestaande speler aan; met een lege opslag (eerste start) verschijnt eerst het welkomstscherm
en begin je in de armoedige start-staat: kapot en vies toilet, kale muur, vieze vloer, roestige emmer en vier
stuks gereedschap. Wie al speelde vóór Sprint 9 houdt alles wat hij had.

Om die start zelf te zien: open het spel in een privévenster, of wis de opslag in de console met
`localStorage.clear()` en herlaad.

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
| `bucket.spec.js` | vullen, legen, herladen; volle emmer; emmerweergave; alle vijf emmers en hun hengsel; inhoud blijft binnen de emmer |
| `camera.spec.js` | zes camerastanden, swipen, "+"-plekken, muren aantikken, tik tegenover slepen |
| `start.spec.js` | start-staat van een nieuwe speler, vrijspelen per level, bestaande speler (level 4) houdt alles |
| `care.spec.js` | repareren, toilet en vlekken schoonmaken, troep na drie keer overlopen, straf bij vuil, winkelknop in de schoonmaakla |
| `menus.spec.js` | knop schoonmaakspullen altijd in beeld, spullen raken op (ook na herladen), menu's sluiten bij een tik ernaast zonder bijwerking |
| `water.spec.js` | geen water buiten de kom (acht camerapunten, zes momenten), spetters in de kom, geen losse bouten |
| `i18n.spec.js` | zelfde talen als Sudoku Kids, elke taal compleet, standaardtaal, taalkeuze, niets buiten zijn knop of vak |
| `storage.spec.js` | sleutels onder `flushfactor.`, migratie van de oude sleutels, voortgang overzetten, profiel en alles verwijderen |
| `pages.spec.js` | privacyverklaring en verwijderpagina in elke taal, ook zonder `.html` in het adres, en `verwijderen.html` stuurt door |
| `tools.spec.js` | gereedschapsmenu: één kolom, scrollen met vervaging, in- en uitklappen, naam bij lang indrukken |
| `style.spec.js` | designbestand en lettertypen, winkel (uitgelicht, labels, feestje, eerlijkheid), welkomstscherm |
| `toilet.spec.js` | geen los hendeltje, in de pot kijken, tik in / tik uit, waterstroom bij spoelen |
| `profile.spec.js` | welkomstscherm bij eerste start, gastprofiel, statistieken, inlog-koppelpunt |
| `clog.spec.js` | verstopping, waterfases, chaos, ontstoppen, overlopen met plas |
| `layout.spec.js` | alle knoppen in beeld en zonder overlap, met notch- en punch-hole-profiel; scène tot achter de notch |
| `sw.spec.js` | service worker in een submap, volledige cache, offline, geen herlaad; manifest |
| `screenshots.spec.js` | screenshots van alle toestanden in `tests/screenshots/<formaat>/` om na te kijken |
| `sound.spec.js` | geluiden: laden pas na de eerste tik en zonder fouten, elk moment zijn geluid, aan/uit en volume onthouden, klein, met bron en licentie |
| `ci.spec.js` | de controle op privégegevens (blocklist) staat in de workflows en werkt; de testversie bevat `style-preview.html`, noindex |
| `rook.spec.js` | de rooktest: kort en breed, draait vóór publicatie van de testversie (`npm run test:rook`) |
| `live.spec.js` | winkel op de live site in een schoon profiel (alleen met `LIVE_URL=…`) |

De tests wachten op het spel zelf (`window.__game`), niet op vaste tijden. `window.__game` is ook handig in de
console: `__game.forceClog('duck')`, `__game.setScore(5000)`, `__game.snapshot()`.

## Een branch testen

Het live adres toont alleen `main`. Een andere branch probeer je lokaal:

```bash
git fetch && git checkout sprint-9
npm install
npm run serve        # open het adres uit de terminal (standaard http://localhost:5000/the-flush-factor/)
npm test
```

Of op je telefoon, via het testadres (zie [docs/testversie.md](docs/testversie.md)):

```bash
git push test sprint-9:main          # na de rooktest (doel: binnen 10 minuten) staat het op
                                     # https://jmldewaal-sedillo.github.io/the-flush-factor-test/
```

## Testen en publiceren

| | Wat draait er | Hoe lang | Wat hangt ervan af |
|---|---|---|---|
| **Rooktest** | `npm run test:rook` (`tests/rook.spec.js`): laden zonder fouten, spoelen, verstopping oplossen, winkel, schoonmaken, menu, taal, gegevens, privacypagina's; één telefoon- en één tabletformaat | lokaal een kwart minuut, op GitHub een paar minuten | **Publicatie van de testversie** |
| **Volledige suite** | `npm test`: alle tests op vier formaten | lokaal ongeveer 25 minuten, op GitHub ongeveer een uur | **`main`** (het live adres) |

Werkwijze:

1. **Testversie:** `git push test <branch>:main`. Op GitHub starten de rooktest en de volledige suite
   tegelijk. Na een groene rooktest staat de testversie online; de volledige suite draait door en houdt de
   publicatie niet tegen.
2. **Na ongeveer een uur** nakijken of de volledige suite ook groen is:
   `gh run list -R jmldewaal-sedillo/the-flush-factor-test --limit 1`. Rood = er is iets stuk dat de
   rooktest niet ziet; de testversie staat er dan wel, maar is niet goedgekeurd.
3. **Live:** mergen naar `main` alleen na akkoord van Jenn en alleen als de volledige suite groen is op
   die commit. Het live adres wordt rechtstreeks vanaf `main` gevuld (geen workflow ertussen), dus die
   controle is een afspraak en geen slot.

Een nieuwe push vervangt een nog lopende volledige run van dezelfde branch. Pushes met alleen
documentatie (`*.md`) starten geen tests en publiceren dus ook niets.

**Controle op privégegevens (blocklist).** Vóór de rooktest, en nog een keer op de gebouwde testversie vóór
het publiceren, gaat alles langs de lijst uit het geheim `PRIVATE_BLOCKLIST`. De workflow
`.github/workflows/privacy.yml` doet dat ook bij elke push met alleen documentatie, inclusief de
geschiedenis. Ontbreekt het geheim, dan faalt de run. De inhoud van de lijst wordt nooit getoond. Lokaal:
`tools/install-hooks.sh` (één keer per kopie van de repo) en `python3 tests/no-private-data.py`.

## Talen

Tien talen, dezelfde als in Sudoku Kids: Nederlands, English, Deutsch, Français, Español, Português,
Italiano, Polski, Türkçe, Bahasa Indonesia. De eerste keer volgt het spel de taal van het toestel (anders
Engels); daarna de keuze uit het menu (menuknop → Taal). Teksten staan in `js/i18n/<taal>.js`, met `{naam}` als
invulplek; vaste teksten in `index.html` hebben `data-i18n`. Nederlands is de bron. De vertalingen zijn
nog niet nagekeken door moedertaalsprekers (ROADMAP → Voor publicatie).

## Geluid

Dertien korte geluiden in `assets/sounds/` (mono mp3, samen ±113 kB), allemaal CC0; bron en licentie per
geluid in `docs/credits.md` en het credits-scherm. Welk geluid bij welk moment hoort en hoe hard het
klinkt staat in `js/data/sounds.js`; per voorwerp staat in `js/data/clog-props.js` of het zacht, hard of
zwaar in de emmer valt. Browsers spelen pas geluid af na een tik: tot dan wordt er niets geladen, en als
het geluid uit staat ook daarna niet. Menuknop → Geluid (aan/uit) en Volume; bewaard bij het profiel.
In de console: `__game.sound()` laat zien wat er geladen en afgespeeld is.

## Gegevens en privacy

Alles blijft op het toestel, onder de prefix `flushfactor.` (zie `docs/privacy-audit.md`). Via de scorebubbel:
voortgang overzetten (code of bestand), profiel verwijderen, alle gegevens van de app verwijderen.

## Play Store (later)

De Android-app wordt een Capacitor-app (`Apps/CLAUDE.md`, sectie 11); dit project is daar nog niet naar omgezet.
Wat er nog moet gebeuren staat in ROADMAP.md ("Volgende" en "Voor publicatie in Google Play") en `docs/publiceren.md`.
