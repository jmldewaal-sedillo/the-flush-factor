# The Flush Factor — afspraken voor deze app

De basis voor alle apps staat in `Apps/CLAUDE.md` en geldt hier ook. De vaste opzet van elke
app (merk, één codebase met drie bouwdoelen, hoofdsite, testen, advertenties, privacy en de
blocklist) staat daar in **sectie 11, "App-structuur Studio Sedillo"**; die regels worden hier
niet herhaald. Dit bestand bevat alleen wat specifiek is voor deze app. Lees aan het begin van
elke sessie `ROADMAP.md`.

## Doel

Een absurd, brutaal en grappig spoelspel: je spoelt een toilet door, lost verstoppingen op met
(soms nutteloos) gereedschap en bouwt een armoedig wc-hokje uit tot een luxe badkamer.

## Doelgroep

Algemeen publiek dat van flauwe toilethumor houdt; **geen kinder-app** (geen ouderslot; `KINDER_APP: false`).
Inloggen en punten kopen met echt geld zijn voorbereid maar staan uit en zijn niet te zien (Sprint 16); aan
zetten past niet bij een app voor kinderen onder de 13. *Aanname van Claude; Jenn beslist dit definitief vóór
publicatie (zie `docs/publiceren.md`).*

## Toon

Brutaal, droog en grappig; korte zinnen, veel uitroepen in hoofdletters. Smerig mag, maar
**cartoonesk**: vlekken, klodders en troep, nooit realistisch of walgelijk. Geen seksuele of
kwetsende grappen. De speler wordt met "je" aangesproken.

## Techniek

- Vanilla JavaScript met ES-modules, geen bouwstap. 3D met three.js r170 (lokaal in `js/vendor/`).
- Slug `flushfactor`; opslag alleen via `js/storage.js` (prefix `flushfactor.`).
- Tien talen (zelfde lijst als Sudoku Kids): één bestand per taal in `js/i18n/`, de juridische
  teksten in `js/i18n/legal/`. Nieuwe tekst = in **alle** tien bestanden; de tests controleren dat.
- Eén designbestand: `css/tokens.css` (stijl "Sticker"). Geen losse kleuren of lettertypen elders.
- Alle getallen en lijsten (prijzen, levels, gereedschap, schoonmaakspullen, geluiden) staan in `js/data/`.
- Geluid: alleen via `js/sound.js`; bestanden in `assets/sounds/` (kort, mono mp3, alleen CC0), elk met bron
  en licentie in `docs/credits.md` en `js/data/credits.js`. Laden pas na de eerste tik, dan alles tegelijk.
  Een geluid hangt aan een event van de eventbus (`bindSounds()` in `js/game.js`), nooit aan een timer.
  **Elk gereedschap krijgt een eigen geluid** (`sound` in `js/data/tools.js`); een test eist dat.
  Claude kan niet luisteren: Jenn keurt elk nieuw geluid op het testadres.
- `sw.js` heeft geen handmatige `CACHE_VERSION`: `npm run build` (`tools/build-sw.mjs`) berekent de
  versie uit de inhoud van de bestanden, en een test faalt als hij niet actueel is.
- Tests: Playwright, vier formaten, eigen poort (5599). `npm test`; `npm run serve` voor zelf kijken.

## App-specifieke regels

- **Bouwdoelen (sectie 11, punt 2; Sprint 15):** `tools/bouw.mjs` met `app` (Capacitor voor Android én iOS
  uit dezelfde bestanden, `dist/app/`, laag `platform/app.js`) en `test`/`pages` (de testversie op github.io,
  laag `platform/web.js`). De bronbestanden in de root zijn zelf de webversie (live op github.io vanaf `main`).
  Webportals nog niet: pas na akkoord van Jenn, dan een `platform/portal.js` en `bouw.mjs portal`. Bouwen,
  sleutels en uitbrengen: `docs/app.md`. De spelcode vraagt aan `window.Platform` wat kan (service worker,
  volledig scherm, terugknop) en kijkt nooit zelf naar het bouwdoel; een test bewaakt dat.
- **Geen verhuizing naar een subdomein en geen DNS-records.** De webversie blijft staan op
  `jmldewaal-sedillo.github.io/the-flush-factor/` tot Jenn iets anders besluit; een eigen
  subdomein komt er pas bij "lanceren web". Zet **geen `CNAME`-bestand in de root**.
- **Schakelaars (Sprint 16):** `KINDER_APP`, `ADVERTENTIES`, `AANKOPEN` en `INLOGGEN` in `js/data/config.js`. Wat uit
  staat is ook niet te zien (geen knoppen zonder werking, `Apps/CLAUDE.md` §11.8). Tests die de voorbereide knoppen
  nodig hebben zetten ze per pagina aan met `openGame(page, { switches: { AANKOPEN: true } })` (`tests/helpers.js`).
- **Vaste controles (`Apps/CLAUDE.md` §11.7a, Sprint 16):** `tests/toegankelijkheid.spec.js` (axe, tien talen),
  `toetsenbord.spec.js` (focus in vensters: `js/ui/focus.js`), `beveiliging.spec.js` (CSP, vijandige codes,
  Android), `inhoud.spec.js` (store-teksten, trackers, hosts, credits) en `geld.spec.js`. Geen inline scripts of
  stijlen (de CSP verbiedt ze; balken via `bar()`/`applyBars()` in `js/ui/icons.js`); de importmap staat met zijn
  hash in de CSP van `index.html` (een test berekent hem opnieuw). Elke opgeslagen waarde gaat door `loadState`
  in `js/state.js`, die alles nakijkt.
- **Geld verdienen:** de knoppen voor punten kopen en de plek voor advertenties blijven uit.
  AdMob of aankopen kunnen pas nadat het zakelijke postadres bij de KvK is vastgelegd en het
  bezoekadres is afgeschermd, en dan alleen na akkoord van Jenn (sectie 11, punt 5).
- **Betalen (besluit van Jenn, 2026-10-12):** bij puntenpakketten voorlopig het antwoord van Google Play
  Billing op het toestel vertrouwen, elke aankoop bevestigen en verbruiken; controle via een server pas
  zodra er accounts komen (ROADMAP, punt 60).
- **Blocklist:** de controle draait in `ci.yml` en `privacy.yml`; zonder het geheim faalt de run.
- Testen op de telefoon: de testversie staat op `jmldewaal-sedillo.github.io/the-flush-factor-test/`
  (noindex). Push naar test: `git push test <branch>:main`; zie `docs/testversie.md`.
- **Afwijking van `Apps/CLAUDE.md` §3 ("deploy alleen als de tests groen zijn"), besluit van Jenn
  2026-10-12:** de testversie wordt gepubliceerd na de korte rooktest (`npm run test:rook`); de
  volledige suite draait ernaast en blokkeert de testversie niet. `main` blijft achter de volledige
  suite. Zie README.md, "Testen en publiceren".
- De houten emmer is CC BY-SA 4.0 (gelijk delen): het bewerkte model moet onder dezelfde licentie
  beschikbaar blijven. Zie `docs/credits.md`.
- Eerlijke winkel: geen nep-timers of "laatste kans"; echt geld altijd met de prijs in euro's en
  duidelijk anders dan punten (een test bewaakt dit).
