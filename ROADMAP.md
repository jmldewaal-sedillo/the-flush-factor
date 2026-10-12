# The Flush Factor — Roadmap

## Status

Live: https://jmldewaal-sedillo.github.io/the-flush-factor/ — versie 0.2 (branch `main`)
Android: nog niet in de Play Store (de app is nog niet omgezet naar Capacitor)
Test: https://jmldewaal-sedillo.github.io/the-flush-factor-test/ (noindex; repo `the-flush-factor-test`, zie `docs/testversie.md`)
Webportals: nog geen

**Besluit van Jenn, 2026-10-11 (`Apps/CLAUDE.md`, sectie 11):** eerst de Android-app en webportals; geen app-website op een subdomein tot "lanceren web". Het plan "verhuizen naar flushfactor.studiosedillo.com" en de TWA zijn vervallen.

Werk in uitvoering staat op de branch `sprint-9` (Sprint 9, 10 en 11), nog niet gemerged naar `main`.

## Nu bezig

- [x] **Sprint 10 (punten 89–95)** en **Sprint 11 (punten 96–101)**: zie de secties onderaan. Klaar op de branch, wacht op testen door Jenn.
- [ ] **Sprint 12 (punten 102–106):** aanvulling op de geluiden na het beluisteren door Jenn; zie de sectie onderaan.

## Volgende

- [ ] **61 (en 88). Puntenbalans opnieuw nakijken.** Er is veel bijgekomen (opbouw, schoonmaakspullen die opraken). Neem de aantallen in `js/data/care.js` mee: hoeveel spelen kost een spons, en loont schoonmaken dan nog?
- [ ] **Omzetten naar één codebase met drie bouwdoelen** (`Apps/CLAUDE.md`, sectie 11; voorbeeld: de template `studio-sedillo-app-template` en Sudoku Kids): een dunne laag per bouwdoel (opslag, advertenties, SDK, terugknop), `android` met Capacitor (alle bestanden in de app, zonder service worker, package `com.studiosedillo.flushfactor`), `webportals` als upload-zip zonder service worker en zonder externe links, en de testversie op github.io met noindex. Wat van het oude plan was (subdomein, TWA, `assetlinks.json`) is al weg; `tools/bouw-site.mjs` (testversie voor github.io) gaat dan op in `tools/bouw.mjs`.
- [ ] ~~Verhuizen naar flushfactor.studiosedillo.com~~ **Vervallen** (besluit 2026-10-11): geen subdomein en geen DNS-records tot "lanceren web".
- [x] Test-repo `the-flush-factor-test` aangemaakt (2026-10-11, na akkoord), met deploy naar github.io na groene tests.
- [ ] Op een echte telefoon testen via het testadres (nog nooit gedaan).
- [ ] Merge `sprint-9` naar `main` na akkoord ("zet live").

## Later / ideeën

- [ ] 58. Geluiden, tweede deel (kassa, level-up, begin van een verstopping) · 60. Echte betaling voor punten · 63. Aankleden (zie "Toekomst" verderop)
- [ ] **Aankopen via een server controleren zodra er accounts komen (bij punt 59; besluit van Jenn, 2026-10-12):** elke aankoop bij Google laten bevestigen door een eigen server (Google Play Developer API), en terugbetaalde of teruggedraaide aankopen intrekken (de punten weer afschrijven). Tot die tijd vertrouwt het spel het antwoord van Google Play Billing op het toestel. Zie "Capacitor: betalen, inloggen en offline", onderdeel 1.
- [ ] 59. Echt inloggen met Google/Facebook. **Eerst** privacyverklaring en Data Safety bijwerken (CLAUDE.md §5).
- [ ] 44, 72–75: zie "Toekomstplan" en "Toekomst (vastgelegd, nog niet bouwen)" verderop. (Punt 77 bestaat niet: het nummer is overgeslagen.)
- [ ] Meer dan 16 gereedschappen (het menu is erop voorbereid).

## Voor publicatie in Google Play

- [ ] **Vertalingen laten nakijken door moedertaalsprekers**: alle tien talen in `js/i18n/` (spel) en `js/i18n/legal/` (privacyverklaring en verwijderpagina). Ze zijn door Claude geschreven en nog door niemand nagelezen; vooral de grappen en de juridische tekst.
- [ ] Doelgroep en leeftijd vastleggen (aanname nu: geen kinder-app; zie `CLAUDE.md` van deze app).
- [ ] Privacyverklaring en verwijderpagina **live** op https://studiosedillo.com/the-flush-factor/privacy en `/delete` (de URL's voor de Play Store; minimaal EN en NL). De pagina's zelf zijn er (Sprint 10); ze moeten nog naar de hoofdsite.
- [ ] **Privacytekst laten nakijken** (door iemand met verstand van de AVG): de verklaring en de verwijderpagina in `js/i18n/legal/`, in elk geval Nederlands en Engels. Door Claude geschreven, door niemand nagekeken.
- [ ] Vlak voor publicatie opnieuw controleren of het EU-U.S. Data Privacy Framework nog geldt voor GitHub en Google (de tekst noemt het). Stand op 2026-10-12: van kracht; het Gerecht van de EU heeft het op 3 september 2025 in stand gelaten, het hoger beroep (zaak C-703/25 P, Latombe/Commissie) loopt nog bij het Hof van Justitie. Vernietigt het Hof het besluit, dan moet die alinea eruit of anders.
- [ ] Data Safety ingevuld (antwoorden volgen uit `docs/privacy-audit.md`).
- [ ] Store-teksten (begin in `store/`), icoon, feature graphic 1024×500, telefoon- en tabletscreenshots.
- [ ] Android-app gebouwd met Capacitor en getest in de interne test van de Play Console. De upload key maakt Jenn zelf. (Was: TWA met `assetlinks.json`; vervallen.)
- [ ] Gesloten test: 12 testers, 14 dagen (eis voor een nieuw persoonlijk ontwikkelaarsaccount).
- [ ] **Vóór advertenties (AdMob) of aankopen:** zakelijk postadres bij de KvK vastgelegd en het bezoekadres afgeschermd, anders toont Google het adres. AdMob via de Capacitor-plug-in, standaard uit tot akkoord van Jenn. Zonder dat: uitbrengen zonder advertenties en zonder aankopen.
- [ ] Webportals (CrazyGames, Poki, …): eerst de voorwaarden over exclusiviteit en advertenties lezen; niets inbouwen zonder akkoord van Jenn.
- [ ] Contentbeoordeling (IARC) ingevuld.
- [ ] App toevoegen aan studiosedillo.com, pas **na de lancering** (`Apps/tools/hoofdsite-toevoegen.sh`, na akkoord).
- [ ] 72. Play Store-beleid en 73. regels nakijken (zie verderop).

## Logboek

### 2026-10-12
- **Stijl gekozen (punt 78):** Jenn heeft de drie richtingen op het testadres bekeken en kiest A · Sticker. Die was al doorgevoerd; er verandert niets aan het spel.
- **Sprint 11 (punten 96–101)** op de branch `sprint-9`: geluiden (dertien korte CC0-geluiden, pas geladen na de eerste tik, aan/uit en volume in het menu, bewaard bij het profiel), winkelwagentje in de schoonmaakla, controle tegen de gewijzigde `Apps/CLAUDE.md` (AUDIT.md deel 6: blocklist-controle in de CI, KvK-vermelding en vaste voettekst), privacytekst preciezer over wat er naar de VS gaat, `style-preview.html` op het testadres, en deze roadmap opgeruimd (zie punt 99).
- Besluit van Jenn over betalen vastgelegd: voorlopig het antwoord van Google Play Billing op het toestel vertrouwen, aankopen altijd bevestigen en verbruiken; controle via een server zodra er accounts komen.
- **Testversie sneller online:** de test-repo publiceert na een korte rooktest (`tests/rook.spec.js`, telefoon en tablet) in plaats van na de volledige suite van een uur. De volledige suite draait ernaast en blijft de eis voor `main`. Werkwijze in README.md ("Testen en publiceren").
- Testversie staat online op https://jmldewaal-sedillo.github.io/the-flush-factor-test/. Layout: het literlabel bij de emmer kon met een breder lettertype over de spoelknop vallen (gevonden door de tests op GitHub); hersteld.

### 2026-10-11
- **App-structuur Studio Sedillo** (`Apps/CLAUDE.md`, sectie 11) vastgelegd. In deze roadmap aangepast: status (geen subdomein, testversie op github.io), "Verhuizen naar flushfactor.studiosedillo.com" vervallen, TWA vervangen door Capacitor, privacy-URL's op de hoofdsite, gesloten test, en de voorwaarde voor advertenties en aankopen. Nieuw onder "Volgende": omzetten naar drie bouwdoelen. `CLAUDE.md` verwijst nu naar sectie 11. Aan de app zelf is niets veranderd.

- **Punten 41, 46, 59 en 60 bijgewerkt voor Capacitor** (alleen vastgelegd): nieuwe sectie "Capacitor: betalen, inloggen en offline" met de keuze van de plug-in voor Google Play Billing, de aansluiting op `purchaseService.buy()` en `authService`, en wat er verandert aan service worker en offline. De TWA-regels zijn doorgestreept, het stappenplan voor de login heeft een aantekening.
- **Sprint 10 (punten 89–95)** op de branch `sprint-9`: controle tegen `Apps/CLAUDE.md` (AUDIT.md deel 5), water blijft in de kom, knop voor schoonmaakspullen altijd in beeld, schoonmaakspullen raken op, menu's sluiten bij een tik ernaast, tien talen. Uit de controle: opslag onder de prefix `flushfactor.` met migratie, privacyverklaring en verwijderpagina in tien talen, voortgang overzetten, profiel en alle gegevens verwijderen, test-repo en deploy naar het testadres.
- **Sprint 9 (punten 78–88)** afgerond: eigen stijl (A · Sticker), opbouw van kapotte wc naar luxe badkamer, schoonmaak en reparatie, emmer stapelen, speelse winkel. `npm run serve` kiest zelf een vrije poort; de tests draaien op poort 5599.

*De geschiedenis per sprint staat hieronder (oudste eerst).*

---

## Versie 0.1 — Werkende basisversie (huidig)

### Gebouwd
- **Spelscherm**: Badkamerscène met cartoonesk toilet (SVG), waterstandbalk, statusberichten.
- **Spoelmechaniek**: Tik op de knop → punten + animatie + combo-systeem.
- **Verstoppingssysteem** (`clog.js`):
  - Willekeurige verstopping met oplopende kans naarmate je langer speelt.
  - Configureerbaar via `CLOG_CONFIG` (kansen, waterstijgsnelheid, overflow-drempel).
  - Water stijgt bij verstopping, daalt als vrij.
  - Overloop → puntenverlies + combo-reset.
- **Inventaris** met 8 gereedschappen:
  - 4 werkend: Ontstopper, Toiletveer, Ontstoppingsmiddel, Emmer Heet Water.
  - 4 chaos: Rubberen Eendje (eendjes), Confettikanon, Opblaasbare Flamingo, Discobal.
  - Ontdekkingssysteem: speler ontdekt zelf welke werken (badge na eerste gebruik).
  - Cooldown-overlay per tool.
- **Winkel** (`shop.js`):
  - Tabbladen: Gereedschap / Cosmetica.
  - Premiumgereedschappen: Super Ontstopper 3000, Ninja Ontstopper, Toverstaf, Mini Olifant.
  - Cosmetica: 4 toiletmodellen, 4 tegelpatronen, 4 vloeren, 5 decoraties.
- **Cosmeticasysteem**: wand/tegel/vloer/toilet/decoratie direct zichtbaar in spel.
- **Voortgangsopslag**: alles in `localStorage` (score, highscore, inventaris, cosmetica).
- **PWA**: `manifest.json` + `sw.js` (offline speelbaar).
- **Mobile-first**: portretstand, touch-bediening, grote knoppen.

---

## Volgende stappen (huidige sprint)

- [x] **1. Realistischer toilet** — SVG met juiste verhoudingen, zachte schaduwen, glans op porselein, subtiele kleurverlopen; cosmetische modellen blijven werken.
- [x] **2. Water dat echt wegspoelt** — kolk draait, water zakt bij spoelen, stijgt bij verstopping; vloeiend op telefoon via transform/opacity.
- [x] **3. Teller "spoelbeurten zonder verstopping"** — streakteller en record onder de score; reset bij verstopping; bewaard in localStorage.
- [x] **4. Ruimte voor camera / notch** — safe-area-inset-* voor header en inventarisbalk zodat het op elke telefoon goed valt.
- [x] **5. Volledig scherm op laptop** — breed scherm toont spel als staande kolom in het midden; zichtbare terugknop; re-enableknop voor telefoonpreview.
- [x] **6. Level-systeem voor ontstoppingsgereedschap**
  - Gereedschap kent een logische opbouw per level: je begint met lompe, simpele spullen (o.a. een oldschool rubberen ontstopper) en hoe hoger je level, hoe luxer en gekker het gereedschap wordt (bv. elektrische ontstopper, hogedrukspuit, robotarm, gouden ontstopper).
  - Level stijgt op basis van aantal spoelbeurten / verdiende punten. Nieuwe gereedschappen worden pas zichtbaar of koopbaar in de winkel vanaf het juiste level.
  - Elk level bevat een mix van werkende en chaos-gereedschappen, zodat het ontdekken blijft.
  - Verstoppingen worden per level iets heftiger, zodat betere spullen ook echt nodig zijn.
  - Alle level-data in `items.js` / een configbestand, zodat het makkelijk uit te breiden is.
- [x] **7. Prullenbak naast het toilet**
  - Naast het toilet staat een prullenbak die zich zichtbaar vult met de troep die uit een verstopping wordt gehaald (cartoonesk: propjes wc-papier, rubberen eendje, sok, speelgoedautootje, telefoon, enz.).
  - Als hij vol is moet hij geleegd worden (tikken), anders gebeurt er iets grappigs (bv. omvallen, troep op de vloer, puntaftrek).
  - Eventueel later een cosmetisch item/upgrade in de winkel (grotere bak, pedaalemmer, luxe designbak).
- [x] **8. Duidelijk zichtbare verstopping**
  - Als het toilet verstopt raakt moet dat direct onmiskenbaar zijn: zichtbare prop/obstakel in de afvoer, water dat troebel wordt en stijgt, een waarschuwing (rood knipperend, schudden, tekstballon zoals "VERSTOPT!") en een geluid-/tekstcue.
- [x] **9. Duidelijk zichtbare ontstopping**
  - Bij succesvol ontstoppen een groot, bevredigend moment: het gereedschap trekt het voorwerp er zichtbaar uit (dat vliegt richting de prullenbak, zie punt 7), het water spoelt in één keer weg met een kolk, en een grote "ONTSTOPT!"-melding met bonuspunten.
  - Werkt een gereedschap niet (chaos-item), dan blijft de prop zichtbaar zitten, zodat het verschil met een echte ontstopping meteen duidelijk is.
- [x] **10. Realistische 3D-scène** — Three.js vervangt de SVG-weergave; zie deelstappen:
  - [x] Three.js (0.170.0) lokaal opgeslagen in `js/vendor/` voor offline PWA.
  - [x] Importmap in `index.html` zodat `three` en addon resolven naar lokale bestanden.
  - [x] `js/renderer3d.js`: eigen 3D-module die luistert naar game-events (`game:flush`, `game:clog`, `game:unclog`, `game:chaos`).
  - [x] Procedureel toilet-model via LatheGeometry + BoxGeometry, MeshPhysicalMaterial (glanzend porselein).
  - [x] ACESFilmic tone mapping, sRGB-output, PCFSoftShadowMap (high-tier).
  - [x] HDRI-omgevingskaart (`assets/hdri/bathroom.hdr`) voor realistische reflecties/belichting.
  - [x] PBR-tegeltexturen (albedo, normal, roughness) voor wand en vloer, CC0 via ambientCG.
  - [x] Water als ShaderMaterial: golfjes, transparant, kleurovergang helder→troebel bij verstopping.
  - [x] SPOELEN: kolk-animatie, waterpeil zakt → vult opnieuw (uniform-driven).
  - [x] VERSTOPT: prop verschijnt als 3D Sprite (emoji op CanvasTexture), water wordt troebel.
  - [x] ONTSTOPT: prop vliegt in boog richting prullenbak, water klaart op + deeltjesburst.
  - [x] Chaos-effecten in 3D-scène (eendjes/confetti als Sprites in 3D-ruimte).
  - [x] Cosmetica-wissel: porselein-kleur/metalness op toilet-model; textuur-swap voor wand/vloer.
  - [x] Kwaliteitsniveaus (laag/midden/hoog) o.b.v. GPU; schaduwen en pixelRatio omlaag bij laag.
  - [x] WebGL-fallback: SVG-modus blijft werken als WebGL niet beschikbaar is.
  - [x] Quickfixes: "SPOELEN" past in knop, gereendsschapnamen passen over twee regels, typo "entstoppen" → "ontstoppen".

---

## Sprint 2 (punten 11–20)

- [x] **11. Echt toilet-GLB** — CC0 GLB-model (opengameart.org, Toilet/toilet.glb, 94KB); GLTFLoader + DRACOLoader; fallback naar procedureel bij laad-fout; cosmetica-skin toegepast op geladen materialen.
- [x] **12. Camera OrbitControls** — Vrij draaien/zoomen met limieten; auto-zoom bij verstopping (inzoomen op kom) en bij ontstopping (terugvliegen); resetCamera() via menu-knop.
- [x] **13. Startpositie verder uitgezoomd** — Camera start op (0, 2.8, 7.0); decorationAnchor Group toegevoegd boven toilet.
- [x] **14. Header weg, fullscreen layout** — `<header>` verwijderd; `#bathroom-scene` wordt `position:fixed; inset:0`; vier HUD-zones: `#hud-topleft`, `#hud-topright`, `#hud-left`, `#hud-bottom`.
- [x] **15. Ronde WC-menuknop (linksboven)** — Bubble-knop met frosted glass; uitklapbaar menu met geluid/credits/volledig scherm/camera-reset; credits-modal met CREDITS.md-inhoud.
- [x] **16. Score-bubbel (rechtsboven)** — Frosted glass bubble met score, highscore, streak, level en winkelknop.
- [x] **17. Spoelknop zwevend (onderin midden)** — Ronde knop met safe-area-inset-bottom.
- [x] **18. Gereedschappen verticaal (linkerkant)** — Ronde knoppen met SVG-cirkel cooldown-ring en secondenteller.
- [x] **19. Mand (rechtsonder) ipv prullenbak** — 3D-mand (wicker-stijl); volumetracking in liters; upgrade-manden in winkel; item "valt" in mand bij ontstopping.
- [x] **20. Knoppen blokkeren 3D niet** — `pointer-events:all` op canvas voor OrbitControls; HUD-elementen hoger z-index.

---

## Sprint 3 (punten 21–25)

- [x] **21. Oorzaak 3D-fallback vinden en oplossen** — Root-cause: ontbrekende `js/utils/BufferGeometryUtils.js` (relatieve import in GLTFLoader.js); toegevoegd aan `js/utils/`; zichtbare foutbanner bij onverwachte fallback; SW v7 stuurt `SW_UPDATED` → game.js herlaadt pagina automatisch.
- [x] **22. Realistisch toiletmodel** — CC0 "Toilets" pack (loafbrr_1, opengameart.org) gedownload; `Toilet_Round_A` gebruikt (aparte seat_cover/seat/flusher nodes); PBR-materialen per onderdeel; CREDITS.md bijgewerkt.
- [x] **23. Layout die altijd herstelt bij schermwissel** — Centrale resize-functie in renderer3d.js + game.js; ResizeObserver + resize/orientationchange/fullscreenchange/visualViewport; `position:fixed;inset:0` layout.
- [x] **24. Kleine UI-fouten** — Waterbalk `position:relative` fix; spoelknop label verkleind; preview-heractiveerknop toont "📱 Preview" label.
- [x] **25. Automatische tests** — Playwright smoke-tests (`tests/smoke.spec.js`); `playwright.config.js`; GitHub Actions workflow (`.github/workflows/ci.yml`); screenshots in `tests/screenshots/`.

---

## Sprint 4 (punten 26–32)

- [x] **26. Water zit niet in de pot (fout)** — Wateroppervlak zweeft boven het toilet; fix positie/grootte/vorm op basis van GLB bounding box van de kom; Playwright-screenshot van bovenaf.
- [x] **27. Smallere ruimte, echt een wc-hokje** — Ca. 0,9–1,0 m breed, 1,5–1,8 m diep, 2,4 m hoog; toilet tegen achterwand; camera vanuit deuropening; OrbitControls-limieten aanpassen.
- [x] **28. Inzoomen op de mand** — Klik op 3D-mand of mandknop → camera zoomt soepel naar kijk-van-bovenaf; terugknop + Esc.
- [x] **29. Toilet-logo naar midden boven** — Ronde blauwe knop van linksboven naar midden boven.
- [x] **30. Gereedschapsmenu past altijd op het scherm** — Max hoogte = viewport min boven/onder; scrollbaar met fade; liggend: kleinere knoppen of twee kolommen.
- [x] **31. Preview-werkbalk: tablet staand + terug naar telefoon** — Tabletformaten (768×1024, 820×1180); altijd staand openen; Draaien togglet; alle formaten wisselbaar.
- [x] **32. Testen uitbreiden** — Tablet staand/liggend, wisselen telefoon↔tablet↔gedraaid; overlap-checks; screenshots.

---

## Sprint 5 (punten 33–39)

> Nagekeken in de rebuild (zie AUDIT.md): 33–37 kloppen; 38 en 39 waren maar half af en zijn in Sprint 7 (punten 52, 54, 56) opnieuw gebouwd.

- [x] **33. Beter toiletmodel (Sketchfab HippoStance)** — CC-BY model met nodes Toilet, ToiletSeatCover, ToiletSeat, ToiletSeatMount, ToiletFlushHandle; bestand `assets/models/toilet-2k.glb`; vereist handmatig downloaden van Sketchfab (authenticatie vereist — niet automatisch te doen). Naamsvermelding in CREDITS.md.

- [x] **34. Controle toiletmodel (eerst doen)**
  - Controleer of het Sketchfab-model van HippoStance (`assets/models/toilet-2k.glb`, nodes Toilet, ToiletSeatCover, ToiletSeat, ToiletSeatMount, ToiletFlushHandle) echt in gebruik is. De samenvatting noemde "Toilet_Round_A_Seat", wat niet uit dit model komt. Is punt 33 niet (volledig) uitgevoerd, doe dat dan eerst.
  - Het deksel (ToiletSeatCover) staat nu dicht, waardoor je het water niet ziet. Standaard moet het deksel OPEN staan (rechtop tegen de stortbak), zodat je in de pot en het water kijkt.

- [x] **35. Startbeeld verder uitgezoomd**
  - Zoom het startbeeld verder uit, zodat er duidelijk vrije wandruimte is BOVEN het toilet en AAN BEIDE ZIJKANTEN. Daar komen later kastjes, planken, spiegel, schilderijtjes en andere decoratie uit de winkel.
  - Maak hiervoor ankerpunten aan: wand boven het toilet, linkerwand, rechterwand, en vloer links/rechts. Leg ze vast in een config, zodat decoratie later op een vaste plek kan worden gezet.
  - Het hokje mag daarvoor iets breder worden als dat nodig is, maar moet wel als wc-ruimte blijven voelen.
  - Het toilet en de mand blijven goed zichtbaar en niet bedekt door de knoppen.

- [x] **36. 3D-scène vult het hele scherm**
  - De 3D-scène moet doorlopen tot helemaal bovenin (achter de notch) en helemaal onderin. Nu zit er bovenin een grijze strook en onderin een lichtblauwe balk.
  - Verwijder die balken/achtergronden; ALLE knoppen (spoelknop, terug, mand, gereedschappen, score, winkel, menu) zweven over de scène heen, met safe-area-insets zodat ze niet achter de notch of de home-balk vallen.
  - Controleer in alle formaten (telefoon klein/standaard/groot, tablet mini/groot, staand en liggend).

- [x] **37. Spoelknop met icoon**
  - Haal de tekst "SPOELEN" uit de spoelknop. Gebruik alleen een duidelijk icoon van een spoelhendel / flush-symbool (SVG, zie punt 43 voor de icon-set). Geef de knop wel een aria-label "Spoelen" voor toegankelijkheid.

- [x] **38. Inzoomen op de mand**
  - Bij het inzoomen op de mand zit het hengsel in de weg. Verberg het hengsel (of draai het plat weg) zolang de camera ingezoomd is, en laat het weer zien bij teruggaan.
  - De knop "Terug" overlapt nu met de spoelknop. Verplaats "Terug" naar een plek zonder overlap (bv. linksboven onder de menuknop) en verberg de spoelknop zolang je in de mand kijkt.

- [x] **39. Mand legen werkt niet (fout)**
  - Het legen van de mand werkt niet; de teller (bv. 3,5 / 20 L) blijft staan en de voorwerpen blijven liggen. Zoek de oorzaak en los het op.
  - Duidelijke manier om te legen: een knop "Mand legen" die verschijnt bij de mandknop en in de ingezoomde mandweergave. Bij legen: korte animatie (mand kantelt / voorwerpen verdwijnen), teller terug naar 0 L, opgeslagen in localStorage.
  - Voeg een Playwright-test toe die de mand vult, leegt en controleert dat teller en 3D-inhoud echt leeg zijn, ook na herladen van de pagina.

---

## Versie 0.2 — Verbeteringen & uitbreiding

### Prioriteit hoog
- [x] ~~**Geluidseffecten** via Web Audio API~~ *Gedaan in punt 96; wat nog ontbreekt staat bij punt 58.*
- [ ] **Dagelijkse uitdagingen en dagelijkse bonus**: "Spoel 50× vandaag voor bonuspunten", beloning voor terugkomen. Eerlijk houden: geen druk of straf voor een gemiste dag.
- [ ] **Prestaties/badges**: bijv. "Eerste overloop overleefd", "Ninja Combo × 8".
- [x] ~~**Betere PWA-iconen**~~ *Gedaan in Sprint 7 (192, 512 en maskable).*
- [x] ~~**Splashscherm**~~ *Gedaan als welkomstscherm (punten 69 en 86).*

### Prioriteit middel
- [x] ~~**Animaties verbeteren**~~ *Gedaan in de punten 54 en 68.*
- [x] ~~**Extra gereedschappen**~~ *Gedaan: zestien stuks (punt 81). Nog meer: zie "Later / ideeën".*
- [ ] **Extra cosmetica**: seizoensgebonden items (kerst-toilet, zomer-strandtoilet).
- [ ] ~~**Tutorial**~~ *Dubbel: staat bij punt 73 (spelregels / tutorial).*
- [ ] **Snelheidsmodus**: optie om spoelcyclus te versnellen voor gevorderde spelers.

### Prioriteit laag
- [x] ~~**Statistiekenscherm**~~ *Gedaan in het profielscherm (punt 69); "beste combo" zit er niet in.*
- [ ] ~~**Dagelijks bonus**~~ *Dubbel: samengevoegd met "Dagelijkse uitdagingen" hierboven.*

---

## Versie 1.0 — Play Store release

- [ ] ~~TWA-integratie~~ **Vervallen** (besluit 2026-10-11): de Android-app wordt een Capacitor-app. Zie "Capacitor: betalen, inloggen en offline" verderop.
- [x] ~~**Privacybeleid**~~ *Geschreven in Sprint 10 (punt 89); live zetten en laten nakijken staat onder "Voor publicatie in Google Play".*
- [ ] ~~**Reclame-integratie**~~ *Dubbel: staat onder "Voor publicatie in Google Play" (vóór advertenties of aankopen).* AdMob via de Capacitor-plug-in, standaard uit; pas na het KvK-postadres en akkoord van Jenn (`Apps/CLAUDE.md`, sectie 11, punt 5).
- [ ] ~~**In-app aankopen**~~ *Dubbel: punt 60.*
- [ ] ~~**Volledige offline test** op Android-apparaat~~ *Dubbel: hoort bij "Android-app gebouwd met Capacitor en getest in de interne test" onder "Voor publicatie".*
- [ ] **Prestatieoptimalisatie**: Lighthouse-score ≥ 90 (voor de webversie; pas zinvol bij "lanceren web").

---

## Toekomstige ideeën

- Multiplayer: wie haalt de meeste punten in 60 seconden?
- Seizoensgebonden events: "Kerst Chaos" met kersttegels.
- Mini-games bij verstopping: swipe-puzzel om te ontstoppen.
- Toilet-upgrades die passieve punten geven.
- Ranglijst (lokaal of online).

---

## Toekomstplan (nog niet bouwen)

- [ ] ~~**40. Profiel**~~ *Vervangen: fase 1 is gedaan in punt 69, de rest staat in punt 59.*
  - Onder de scorebubbel een profielknop.
  - Fase 1: spelen als gast (lokaal profiel met naam/avatar).
  - Fase 2: account aanmaken met e-mailadres, Google of Facebook, zodat voortgang op meerdere apparaten bewaard blijft. Gastvoortgang moet bij het aanmaken van een account overgezet worden.
  - Uitzoeken: backend (bv. Firebase Authentication + Firestore of Supabase), privacyverklaring en AVG, account verwijderen moet mogelijk zijn (verplicht in de Play Store).

- [ ] ~~**41. Aankopen met echt geld**~~ *Vervangen door punt 60.*
  - Kostenprofiel / betaalomgeving voor aankopen met echt geld (bv. puntenpakketten, premium items).
  - Let op: voor digitale aankopen in een app via de Google Play Store is Google Play Billing verplicht. ~~Voor de PWA/TWA gaat dat via de Digital Goods API + Payment Request API.~~ *Bijgewerkt 2026-10-11: in de Capacitor-app loopt dat via een plug-in voor Google Play Billing; zie punt 60.* Andere betaalmethoden (Stripe, PayPal) zijn voor in-app digitale items niet toegestaan.
  - ~~Aankopen moeten server-side gecontroleerd worden en aan het account (punt 40) gekoppeld zijn.~~ *Besluit 2026-10-12: pas zodra er accounts komen; zie punt 60.*
  - Duidelijke prijzen, geen misleidende aankopen; nadenken over leeftijdsclassificatie en ouderlijk toezicht.

- [x] **42. Winkel met uitklapmenu's** *(Sprint 6, hersteld in punt 51)*
  - De winkel wordt één overzicht met alle categorieën als kopjes (bv. Gereedschap, Toiletten, Tegels, Vloeren, Decoratie, Manden). Elke categorie klapt uit (accordion/dropdown) als je erop tikt, zodat je in één oogopslag alle categorieën ziet.

- [x] **43. Eigen icon-set in plaats van emoji's** *(Sprint 6 was onvolledig en met onjuiste credits; opnieuw gedaan in punt 50)*
  - Alle emoji's in het spel vervangen door één consistente set SVG-iconen met een vrije licentie. Gekozen voor:
    - **Lucide** (MIT) voor UI-iconen
    - **game-icons.net** (CC BY 3.0, Delapouite/Lorc) voor spel-iconen
  - Credits in `assets/CREDITS.md`.

- [ ] **44. Meer gratis layout- en decoratie-ideeën**
  - Lijst maken van gratis (CC0/CC-BY) 3D-modellen en textures voor de winkel: andere tegels en vloeren (ambientCG, Poly Haven), kastjes, planken, spiegels, planten, wc-rolhouders, posters, verlichting (Poly Haven, Kenney, Sketchfab met filter Downloadable + CC-licentie), en complete badkamerthema's (bv. retro, luxe hotel, festival-dixi, oud café).

---

---

## Sprint 6 (punten 45–49)

- [x] **45. Winkel accordion** — Winkel herschreven als accordion met categorieën (Punten kopen, Gereedschap, Toiletmodellen, Tegelpatronen, Vloeren, Decoratie, Manden). Data-driven via `CATEGORIES`-array in `shop.js`. Meerdere categorieën tegelijk open. Staat opgeslagen in `localStorage` (`flushfactor_shop_open`). CSS-accordion via `grid-template-rows: 0fr → 1fr`.

- [x] **46. Punten kopen** — "Punten kopen" als eerste categorie in de winkel, met vier pakketten (500 / 1.500 / 5.000 / 15.000 punten, €0,99–€17,99). Koppelpunt Digital Goods API / Google Play Billing via `purchaseService.buy(productId)` in `js/purchases.js` (dispatcht `purchase:pending`-event). Saldo wijzigt niet. *Bijgewerkt 2026-10-11: het koppelpunt `purchaseService.buy()` blijft, maar wordt in de Android-app gevuld door een Capacitor-plug-in en niet door de Digital Goods API (punt 60).*

- [x] **47. Eigen icon-set (emoji's weg)** — Alle emoji's vervangen door lokale SVG-iconen in `js/icons.js`. Lucide MIT voor UI; game-icons.net CC BY 3.0 voor spel-iconen. Exports: `icon()`, `iconEl()`, `iconDataUrl()`. Three.js sprites gebruiken `iconDataUrl(name, 128, 'white')`. Chaos-effecten via `_spawnIcons()`.

- [x] **48. Safe-area shop-header** — `.shop-header { padding-top: max(env(safe-area-inset-top, 0px) + 16px, 20px) }` zodat de winkelkop niet achter notch/Dynamic Island valt.

- [x] **49. Tests uitbreiden** — Nieuwe Playwright-tests: accordion uitklappen/inklappen, meerdere categorieën tegelijk, "Punten kopen" saldo ongewijzigd, emoji-scan (`\p{Extended_Pictographic}/gu`), notch-padding.

---

## Sprint 7 — rebuild (punten 50–57)

Branch `rebuild`. Het hele project is nagekeken (zie `AUDIT.md`) en waar nodig opnieuw gebouwd.

- [x] **50. Emoji's volledig vervangen** — Alle gereedschappen, badges (werkt/chaos), scorebubbel, winkelitems, meldingen en banners gebruiken iconen uit één lokale sprite (`assets/icons/sprite.svg`): Lucide (ISC) voor de interface en de echte game-icons.net-iconen (CC BY 3.0) voor spelvoorwerpen, met naamsvermelding per maker. De emoji-test scant de broncode (html, css, js, manifest, preview) én de interface in alle toestanden. Spoelknop: draaikolk-icoon.
- [x] **51. Winkel** — Zeven categorieën zichtbaar en uitklapbaar (Punten kopen, Gereedschap, Toiletmodellen, Tegelpatronen, Vloeren, Decoratie, Emmers). Open/dicht-stand wordt bewaard; ingeklapt lekt er niets meer door; melding bij elke tik. Live-controle in een schoon profiel: `tests/live.spec.js`.
- [x] **52. Emmer** — Echte modellen; `wooden_bucket.glb` is de emmer van level 1 (20 L). Het hengsel (touw/beugel) wordt verborgen in de emmerweergave. Vijf emmers met capaciteit in liters in `js/data/buckets.js`.
- [x] **53. Camerastanden** — Overzicht, Toilet, Muur boven toilet, Linkermuur, Rechtermuur, Emmer, met soepele overgang. Cameraknop linksboven plus swipen tussen de muren. In muurstanden en het overzicht tonen de vrije ankerpunten een subtiele "+".
- [x] **54. Meer actie bij verstoppen** — Voorwerp valt zichtbaar in de pot, borrelend water met belletjes, klotsen en spetters, camerashake en trillend toilet, water wordt troebel en stijgt in fases (geel/oranje/rood), plas op de vloer bij overlopen die langzaam verdwijnt. Troep is echte kleine 3D-objecten, ook in de emmer. Effecten in `js/three/effects.js`, intensiteit per kwaliteitsniveau in `js/data/config.js`.
- [x] **55. Notch** — De scène loopt door tot achter de notch; de camera houdt de bovenrand van het beeld op de wand (geen losse strook). Alle knoppen staan onder de uitsparing via safe-area plus marge. De preview heeft een notch- en een punch-hole-profiel die de safe-area echt doorgeven.
- [x] **56. Emmerweergave** — Gereedschapsbalk, spoelknop en cameraknop verborgen; "Terug" linksboven zonder overlap.
- [x] **57. Tests voor 50 t/m 56** — Nieuwe Playwright-suite per onderwerp (`tests/*.spec.js`), draait onder een submap zoals GitHub Pages, zonder vaste wachttijden.

Ook in deze sprint (uit de audit): code opgesplitst in data (`js/data/`), logica en weergave (`js/three/`, `js/ui/`); 2D-noodmodus vervangen door een melding "WebGL niet beschikbaar"; service worker opnieuw (relatieve paden, geen geforceerde herlaad); assets gecomprimeerd (eerste laadbeurt van ±14,6 MB naar ±2,5 MB); hokje op echte maat; decoratie verschijnt in 3D op de ankerpunten; echte app-iconen.

---

## Toekomst (alleen vastgelegd, nog niet bouwen)

- [ ] **58. Geluiden** — *Eerste deel gedaan in punt 96:* spoelen, overlopen (borrelen), plop bij ontstoppen, chaos-geluid, voorwerpen in de emmer, volume en aan/uit in het menu. **Nog te doen:** kassa bij een aankoop, level-up, het begin van een verstopping, schoonmaken en repareren; eventueel een eigen geluid per chaos-gereedschap (nu één toeter voor alle).
- [ ] **59. Profiel** — *Fase 1 (lokaal gastprofiel, naam, avatar, statistieken) is gedaan in punt 69.* Nog te doen: echt koppelen met Google/Facebook/e-mail om te synchroniseren, gastvoortgang overzetten, account verwijderen. *Bijgewerkt 2026-10-11 voor Capacitor:* in de Android-app kan inloggen niet met een webvenster (pop-up of omleiding), maar via een plug-in die het inlogscherm van Android zelf opent; `authService` in `js/auth.js` blijft het enige koppelpunt. Zie "Capacitor: betalen, inloggen en offline" hieronder en de aangepaste stappen in het stappenplan bij Sprint 8. *(Vervangt punt 40.)*
- [ ] **60. Echte betaling voor punten** — Google Play Billing via een Capacitor-plug-in, achter `purchaseService.buy()` in `js/purchases.js`. ~~Digital Goods API + Payment Request API in de TWA~~ is vervallen (besluit 2026-10-11). Uitwerking: "Capacitor: betalen, inloggen en offline" hieronder. Voorwaarden vooraf: het KvK-postadres en akkoord van Jenn (sectie 11, punt 5), en de privacyverklaring en Data Safety bijgewerkt. **Besluit van Jenn (2026-10-12):** bij puntenpakketten voorlopig het antwoord van Google Play Billing op het toestel vertrouwen, zonder eigen server; elke aankoop netjes bevestigen (acknowledge) en verbruiken (consume). Zodra er accounts komen (punt 59): controle via een server toevoegen, inclusief het intrekken van terugbetaalde aankopen. *(Vervangt punt 41.)*
- [ ] **61. Logische puntenbalans** — Eén doordacht systeem voor punten per spoelbeurt/combo/ontstopping/level en prijzen, met een overzicht "hoeveel minuten spelen voor item X"; straffen in verhouding. Alle getallen staan al bij elkaar in `js/data/`.
- [x] **62. Meerdere talen** — *Gedaan in punt 94 (tien talen).* Oorspronkelijk: Alle teksten naar taalbestanden (nl, en), taalkeuze in het menu, standaard de toesteltaal. Voorbereid: teksten uit JavaScript staan in `js/data/texts.js`.
- [ ] **63. Aankleden** — Toilet en hokje aankleden (wc-hoes, matjes, handdoeken, spiegels, kastjes, planten, posters, verlichting) op de ankerpunten; thema-sets; items plaatsen, verschuiven en weghalen. Basis ligt er: ankerpunten in `js/data/room.js`, decoratie in `js/data/cosmetics.js`.

---

### Capacitor: betalen, inloggen en offline (vastgelegd 2026-10-11, nog niet bouwen)

Hoort bij de punten 41, 46, 59 en 60 en bij "Omzetten naar drie bouwdoelen" (bovenaan, onder "Volgende").
Aanleiding: `Apps/CLAUDE.md`, sectie 11. De Android-app wordt een **Capacitor-app** (alle bestanden in de
app, zonder service worker) in plaats van een TWA. Een TWA draait in Chrome en kon daardoor de Digital
Goods API, de Payment Request API en een gewone web-login gebruiken; een Capacitor-app draait in de
WebView van Android, en daar bestaan die niet. Alles hieronder moet bij het bouwen opnieuw nagelopen
worden: versies en eisen van Google veranderen.

**1. Punten kopen: Google Play Billing (punten 41, 46, 60)**

- De regel blijft: digitale spullen in een Android-app uit de Play Store mogen alleen via Google Play
  Billing. In de Capacitor-app gaat dat via een plug-in die de Billing-bibliotheek van Android aanroept.
- **Welke plug-in** (kiezen bij het bouwen; eerst npm, de changelog en de ondersteunde versie van de
  Play Billing Library controleren, want Google weigert updates met een te oude versie):

  | Kandidaat | Wat het is | Past bij onze regels? |
  |---|---|---|
  | `@capgo/native-purchases` | Praat rechtstreeks met Google Play Billing, zonder tussendienst | **Voorkeur**: geen extra partij die gegevens krijgt. Onderhoud en Billing-versie nog controleren (alleen de eigen beschrijving van de maker gezien). |
  | `cordova-plugin-purchase` | Oudere, veelgebruikte plug-in; werkt ook in Capacitor | Reserve. Status in 2026 niet kunnen bevestigen. |
  | `@revenuecat/purchases-capacitor` | Officiële plug-in van RevenueCat, met hun server ertussen | Alleen na akkoord van Jenn: RevenueCat is een extra verwerker (account, eigen privacyparagraaf), en dat botst met "geen externe verzoeken" (sectie 11, punt 6). |

- **Aansluiting op de code.** De winkel blijft `purchaseService.buy(productId)` aanroepen en weet niets
  van Android. Wat verandert zit achter dat koppelpunt:
  - `js/purchases.js` vraagt aan de platformlaag (`platform/android.js`, `platform/web.js`,
    `platform/portal.js`) of kopen kan. Web en webportals: `{ status: 'unavailable' }`, en de categorie
    "Punten kopen" wordt daar **niet getoond** (nu staat hij er met "Binnenkort beschikbaar").
  - Android: `buy()` start de aankoop bij Google, wacht op het resultaat en geeft
    `{ status: 'purchased' | 'cancelled' | 'pending' | 'error', productId }` terug. Pas bij `purchased`
    schrijft het spel de punten bij, en daarna wordt de aankoop bij Google **verbruikt** ("consume"),
    zodat hetzelfde pakket nog eens gekocht kan worden. Bijschrijven vóór verbruiken, en bij het starten
    van de app openstaande aankopen alsnog afhandelen (anders is iemand geld kwijt zonder punten, of
    betaalt Google na drie dagen vanzelf terug).
  - De product-id's in `js/data/packages.js` (`pack_500`, …) worden de id's in de Play Console. De
    **prijs komt dan van Google** (in de valuta van de speler), niet meer uit `price` in dat bestand; de
    winkel toont wat de plug-in teruggeeft. De regel "echt geld altijd met een duidelijke prijs, apart van
    punten" en de test daarvoor blijven gelden.
  - Tests: een nagemaakte platformlaag die elk resultaat kan teruggeven; in de tests wordt nooit echt
    gekocht. Echt testen kan alleen met een testaccount in de interne test van de Play Console.
- **Controle van aankopen (besluit van Jenn, 2026-10-12).** Het spel heeft geen server. Bij verbruikbare
  puntenpakketten vertrouwt het spel **voorlopig het antwoord van Google Play Billing op het toestel**.
  Elke aankoop wordt altijd netjes afgehandeld: punten bijschrijven, daarna bevestigen (acknowledge) en
  verbruiken (consume), en bij het starten van de app openstaande aankopen alsnog afhandelen. Wie het toestel
  manipuleert kan zichzelf punten geven, maar dat kan nu ook al (de spelstand staat lokaal) en het kost
  niemand anders iets.
  **Zodra er accounts komen (punt 59):** controle via een eigen server toevoegen. De server laat elke aankoop
  door Google bevestigen (Google Play Developer API) voordat de punten bij het account komen, en trekt
  terugbetaalde of teruggedraaide aankopen in (Google meldt die; de punten gaan er dan weer af). Staat ook
  onder "Later / ideeën".
- **Voorwaarden vooraf** (sectie 11, punt 5): zakelijk postadres bij de KvK vastgelegd en het
  bezoekadres afgeschermd (Google toont bij apps met aankopen het adres), akkoord van Jenn, en daarna
  eerst de privacyverklaring, Data Safety ("financiële gegevens: aankoopgeschiedenis, verwerkt door
  Google") en de leeftijdsclassificatie bijwerken.

**2. Inloggen (punten 40, 59, 69)**

- Nu: `authService.signIn()` en `linkAccount()` in `js/auth.js` geven `unavailable`. Dat koppelpunt
  blijft; het profielscherm verandert niet.
- Wat **niet** meer kan in de Android-app: het webvenster van Firebase (`signInWithPopup`,
  `linkWithPopup`, omleiden). Google staat inloggen in een ingebouwde WebView niet toe, en de app draait
  op een eigen intern adres (`https://localhost`), niet op `github.io`. De stappen 7, 13–14 en 16–17 van
  het stappenplan bij Sprint 8 gingen daarvan uit; zie de aantekening daar.
- In plaats daarvan: een plug-in die het **inlogscherm van Android zelf** opent en het resultaat aan
  Firebase doorgeeft. Kandidaat: `@capacitor-firebase/authentication` (Capawesome, Robin Genz), met
  Google en Facebook als aanbieders. Nog controleren bij het bouwen: of hij de huidige manier van
  Android gebruikt (Credential Manager), en de versie.
- Extra werk aan de kant van Jenn, bovenop het stappenplan: in Firebase een **Android-app** toevoegen
  (package `com.studiosedillo.flushfactor`) met de SHA-1/SHA-256 van de upload key én van de app signing
  key van Google Play, het bestand `google-services.json` in het Android-project (geen geheim, maar wel
  buiten de gedeelde webcode), en bij Facebook het Android-platform met de key hash.
- Voortgang bewaren bij een account vraagt een database (Firestore). Dat is de eerste keer dat gegevens
  het toestel verlaten: account verwijderen in de app én via een web-URL wordt dan verplicht, en de
  privacyverklaring, de verwijderpagina en Data Safety moeten **eerst** aangepast (sectie 5).
- Web en webportals: geen inloggen (portals staan geen externe links of eigen accounts toe zonder hun
  voorwaarden; sectie 11, punt 5). De inlogknoppen worden daar via de platformlaag verborgen.
- Geen kinder-app, anders mag inloggen via Google/Facebook helemaal niet (sectie 5).

**3. Service worker en offline**

| | Web (nu) | Android (Capacitor) | Webportal |
|---|---|---|---|
| Waar staan de bestanden | Op de website; `sw.js` zet ze in een cache | **In de app zelf** (38 MB aan modellen, textures en code) | In de upload-zip bij de portal |
| Service worker | Ja (`registerServiceWorker()` in `js/game.js`) | **Nee**: niet registreren, `sw.js` en `manifest.webmanifest` gaan niet mee | **Nee** |
| Offline | Na het eerste bezoek | **Altijd, vanaf de installatie** | Hangt af van de portal |
| Bijwerken | Nieuwe `sw.js` haalt de nieuwe bestanden op | **Alleen via een update in de Play Store** | Nieuwe upload |
| Opslag | `localStorage` van het webadres | `localStorage` van de WebView, hoort bij de app; Android kan die bij weinig ruimte in theorie wissen, dus bij het omzetten de opslag via de platformlaag laten lopen (Capacitor Preferences), zoals de template doet | Van de portal; kan per portal anders zijn |

Wat daardoor in de code moet veranderen bij het omzetten (nu gaat het uit van de webversie):

- `registerServiceWorker()` in `js/game.js`: alleen op het bouwdoel web.
- `storage.wipeEverything()` in `js/storage.js` wist caches en de service worker; in de app bestaan die
  niet. "Alle gegevens verwijderen" wist daar alleen de opslag, en de tekst van de bevestiging
  ("…en de bestanden voor gebruik zonder internet") klopt daar niet: eigen tekst per bouwdoel.
- De privacyverklaring noemt hosting bij GitHub Pages en het ophalen van bestanden van de website. Voor
  de Android-app geldt dat niet (er wordt niets opgehaald); de versie op de hoofdsite moet dat
  onderscheid maken.
- `js/storage.js` praat rechtstreeks met `localStorage`; dat wordt de opslag van de platformlaag. De
  sleutels (`flushfactor.…`) en de overzetcode blijven gelijk, zodat een code van de webversie in de app
  werkt en andersom.
- "Volledig scherm" in het menu en de ontwikkel-preview (`js/phone-preview.js`) horen alleen bij web.
- De terugknop van Android: eerst een open menu, de winkel of een close-up sluiten, pas op het
  spelscherm de app verlaten.
- De links in het credits-scherm en naar `privacy.html`/`delete.html` openen in de app in de browser van
  het toestel; in de portal-versie mogen er geen externe links in zitten.
- `tools/build-sw.mjs` en `tests/sw.spec.js` blijven voor web; de Android- en portal-bouw krijgen een
  test dat er géén service worker en geen manifest in zit.

## Sprint 8 (punten 64–71)

Gemerged naar `main` als `v0.2-rebuild`; daarna op `main` verder gewerkt.

- [x] **64. Losse hendel onder het toilet (fout)** — Uitgezocht: het was geen tweede spoelhendel maar een **stopkraan met toevoerslang** die in het model aan de toiletromp vastzit (zes losse onderdelen binnen de mesh `Toilet`: kraan, wandplaat, slang en koppelingen) en links laag tegen de achterwand hing. Die onderdelen worden nu niet meer getoond. Er is één spoelhendel (`ToiletFlushHandle`), op de stortbak, en die draait bij het spoelen om zijn eigen bevestigingspunt. Test + screenshot van dichtbij (`01b-toilet-dichtbij.png`).
- [x] **65. Inzoomen op het toilet door te tikken** — Tik op het toilet: de camera gaat soepel boven de pot hangen en je kijkt in het water. Kan altijd; bij een verstopping gebeurt het vanzelf. Spoelknop en gereedschap blijven staan, dus je kunt ingezoomd spoelen en ontstoppen.
- [x] **66. Eén tik in, één tik uit** — Emmer en toilet: één tik zoomt in, nog een tik (op het voorwerp of ergens in de scène) gaat terug naar het **vorige standpunt**. "Terug" en Esc werken ook.
- [x] **67. Muren aantikken voor camerastand** — Tik op de muur boven het toilet, de linker- of de rechtermuur: de camera gaat erheen; nog een tik op dezelfde muur: terug naar het toiletbeeld. De cameraknop blijft. Alleen een korte tik zonder beweging telt (niet slepen, knijpen of lang vasthouden).
- [x] **68. Zichtbare waterstroom bij spoelen** — Watergordijn met stromende strepen langs de binnenwand van de pot (de vorm is op het model afgetast), draaiende kolk op het wateroppervlak, het peil zakt weg in de afvoer en de pot loopt weer vol; plus de bestaande spetters. Duur 1,8 s. Bij kwaliteit "laag" minder detail in het gordijn, maar het is er altijd. Test vergelijkt het beeld in rust met het beeld tijdens het spoelen; screenshotreeks `01d-spoelen-1…4.png`.
- [x] **69. Profiel en eerste start** — Welkomstscherm bij de allereerste start, daarna via een tik op de scorebubbel. "Spelen als gast" werkt volledig offline (naam, avatar, lokaal bewaard). "Inloggen met Google/Facebook" lopen via één koppelpunt (`authService.signIn()` in `js/auth.js`) en tonen "Binnenkort beschikbaar"; er is geen inlogscherm nagemaakt. Profielscherm: naam, avatar, statistieken (totaal gespoeld, langste reeks, ontstoppingen, verzamelde liters troep) en "Account koppelen". Stappenplan voor de echte koppeling: zie hieronder.
- [x] **70. Knop "Legen" en winkelknop alleen icoon** — Beide rond, zonder tekst, met `aria-label` ("Emmer legen", "Winkel").
- [x] **71. Tests** — `tests/toilet.spec.js`, `tests/profile.spec.js` en uitbreidingen in `camera.spec.js`, `layout.spec.js`, `emoji.spec.js` en `screenshots.spec.js`.

### Stappenplan: echte Google- en Facebook-login (voor punt 69)

> **Aantekening 2026-10-11 (Capacitor).** Dit stappenplan is geschreven voor een web-login en klopt voor de
> Android-app niet meer op deze punten: stap 7 (het toegestane domein is in de app niet `github.io`; er komt een
> Android-app in Firebase bij, met SHA-vingerafdrukken), stap 13–14 (Facebook krijgt het Android-platform met een
> key hash in plaats van alleen een omleidings-URI), en stap 16–17 (geen `linkWithPopup`: inloggen gaat via een
> Capacitor-plug-in). De stappen A, B en het aanmaken van de aanbieders blijven geldig. Zie "Capacitor: betalen,
> inloggen en offline" hierboven. Het voorbeeldadres van de privacyverklaring in stap 1 wordt
> `https://studiosedillo.com/the-flush-factor/privacy`.

Dit moet jij zelf aanmaken, omdat het aan jouw accounts hangt. Daarna kan de koppeling in `js/auth.js` gebouwd worden.
Voorstel: **Firebase Authentication** (inloggen) + **Cloud Firestore** (voortgang bewaren). Gratis voor dit gebruik.

**A. Vooraf (nodig voor alles hierna)**

1. **Privacyverklaring** op een openbare URL (bijvoorbeeld `privacy.html` in deze repo, dan staat hij op
   `https://jmldewaal-sedillo.github.io/the-flush-factor/privacy.html`). Erin: welke gegevens (naam, e-mailadres,
   profielfoto van de aanbieder, spelvoortgang), waarvoor, hoe lang, en hoe je ze laat verwijderen. Zie punt 73.
2. **Pagina "account verwijderen"** (mag in dezelfde verklaring): uitleg hoe een speler zijn account en gegevens laat
   wissen. Google Play en Facebook eisen allebei zo'n URL.
3. Beslis welk **e-mailadres** spelers te zien krijgen als contact.

**B. Firebase**

4. Ga naar https://console.firebase.google.com → **Project toevoegen** (naam bv. `the-flush-factor`). Google Analytics mag uit.
5. In het project: **Build → Authentication → Aan de slag**.
6. **Project-instellingen → Jouw apps → Web-app (`</>`) toevoegen**. Je krijgt een blokje `firebaseConfig`
   (apiKey, authDomain, projectId, …). **Dat blokje heb ik nodig.** Het is geen geheim, het mag in de code.
7. **Authentication → Instellingen → Geautoriseerde domeinen**: voeg `jmldewaal-sedillo.github.io` toe
   (`localhost` staat er al).
8. **Build → Firestore Database → Database maken**, locatie `europe-west` (eur3), start in **productiemodus**.
   De beveiligingsregels (elke speler alleen bij zijn eigen gegevens) lever ik aan.

**C. Google-login**

9. **Authentication → Inlogmethode → Google → Inschakelen.** Kies een openbare projectnaam en je contactadres. Opslaan.
10. Controleer in https://console.cloud.google.com → **API's en services → OAuth-toestemmingsscherm** (zelfde project):
    app-naam, logo (optioneel), link naar de privacyverklaring, en zet de status op **In productie**
    (anders kunnen alleen testgebruikers inloggen). Voor alleen naam/e-mail/profielfoto is geen Google-verificatie nodig.

**D. Facebook-login**

11. Ga naar https://developers.facebook.com → registreer als ontwikkelaar → **Mijn apps → App maken**, type
    "Consumenten" → product **Facebook Login** toevoegen.
12. **App-instellingen → Basis**: noteer **App-ID** en **App-geheim**; vul de URL van de privacyverklaring en de URL voor
    het verwijderen van gegevens in; kies een categorie (Games).
13. In Firebase: **Authentication → Inlogmethode → Facebook → Inschakelen**, plak App-ID en App-geheim.
    Firebase toont dan een **OAuth-omleidings-URI** (`https://<project>.firebaseapp.com/__/auth/handler`).
14. Terug bij Facebook: **Facebook Login → Instellingen → Geldige OAuth-omleidings-URI's**: plak die URI.
15. Zet de Facebook-app op **Live** (schakelaar bovenin). Voor `public_profile` en `email` is geen app-review nodig;
    Facebook kan wel om **bedrijfs- of identiteitsverificatie** vragen.

**E. Wat ik daarna bouw (als A t/m D klaar zijn)**

16. Firebase-SDK lokaal in de repo (geen CDN, in verband met offline) en de echte `signIn`/`linkAccount`/`signOut` in `js/auth.js`.
17. Gastvoortgang koppelen aan het account (`linkWithPopup`), synchroniseren met Firestore, en een regel voor wat er
    gebeurt als er op twee toestellen verschillende voortgang staat (voorstel: hoogste score wint, aankopen samenvoegen).
18. "Uitloggen" en "Account verwijderen" in het profielscherm.
19. Tests met de Firebase-emulator, zodat er in de tests nooit echt wordt ingelogd.

Wat ik van je nodig heb om te beginnen: **het `firebaseConfig`-blokje (stap 6)** en de bevestiging dat stap 9 t/m 15 gedaan zijn.
Het Facebook App-geheim hoef je mij niet te geven; dat vul je zelf in bij Firebase (stap 13).

---

## Toekomst (vastgelegd, nog niet bouwen) — punten 72–77

- [ ] **72. Play Store-beleid nakijken**
  - Inhoudsclassificatie: IARC-vragenlijst in de Play Console invullen; let op "grove humor" (wc-humor) en op
    gesimuleerd gokken (hebben we niet). Verwachting: PEGI 3 of 7; pas vaststellen na de vragenlijst.
  - Privacyverklaring: verplicht zodra er accounts, aankopen of advertenties zijn; URL in de Play Console én in de app.
  - Formulier **Gegevensveiligheid (Data safety)**: per soort gegevens (naam, e-mail, gebruikers-ID's, aankoopgeschiedenis,
    app-activiteit) aangeven of ze verzameld/gedeeld worden, of ze versleuteld onderweg zijn en of verwijderen kan.
  - **Account verwijderen**: verplicht als je accounts kunt aanmaken: in de app én via een web-URL (zie stappenplan, stap 2).
  - **In-app aankopen**: digitale items alleen via Google Play Billing (punt 60, in de Capacitor-app via een plug-in); prijzen duidelijk, geen aankoop zonder bevestiging.
  - **Advertenties** (alleen als ze komen): aangeven in de Play Console, advertentie-ID declareren, geen misleidende plaatsing.
  - **Doelgroep**: in "Doelgroep en content" kiezen voor 13+ of 16+ en aangeven dat de app niet op kinderen gericht is;
    anders gelden de strengere regels van het Families-beleid.
  - Uitkomst vastleggen als afvinklijst in `docs/play-store.md`.

- [ ] **73. Regels nakijken**
  - **AVG/privacy**: welke gegevens (nu: niets buiten het toestel; straks naam, e-mail, voortgang), grondslag
    (uitvoering van de dienst / toestemming), bewaartermijn, rechten van spelers (inzage, verwijderen), verwerkers
    (Google/Firebase, Meta) en waar de gegevens staan (EU-regio). Geen analytics of advertenties zonder toestemming.
  - **Consumentenrecht** bij echt geld: prijzen inclusief btw, duidelijk wat je krijgt, geen misleidende "populair"-labels,
    geen druk op kinderen, herroepingsrecht bij digitale inhoud (vervalt pas na uitdrukkelijke instemming), bestelknop met
    betalingsverplichting. De labels bij de puntenpakketten nalopen.
  - **Licenties**: alle assets en hun naamsvermelding nalopen tegen `CREDITS.md` (CC BY, CC BY-SA van de houten emmer,
    ISC, MIT); maker van "Old Rusted Bucket" bevestigen.
  - **Spelregels / tutorial** bij de eerste start, na het welkomstscherm: in drie of vier stappen uitleggen hoe je spoelt,
    wat een verstopping is, het verschil tussen werkend en chaos-gereedschap, en de emmer legen. Overslaan moet kunnen;
    later terug te vinden in het menu.

- [ ] **74. Assets nakijken en uitbreiden**
  - Overzicht (tabel in `docs/assets.md`, gegenereerd door een script): elk model, elke texture en elk icoon met licentie,
    grootte, waar het gebruikt wordt, en of het in de eerste laadbeurt zit.
  - Kwaliteit: de zelfgemaakte troep-voorwerpen en de plant zijn eenvoudig; kijken waar een CC0-model (Poly Haven, Kenney,
    Quaternius) beter is. Dweilemmer-bestand bevat nog een tweede, ongebruikte emmer (kan kleiner).
  - Wat ontbreekt: meer troep-voorwerpen, meer decoratie, echte andere toiletten voor de winkel (nu alleen andere kleuren),
    schoonmaakspullen (punt 76).
  - Wat weg kan: `assets/_unused/` verhuizen naar een aparte branch of release-bijlage, zodat de repo klein blijft.

- [ ] **75. Ander spoelicoon**
  - Nieuw ontwerp voor de spoelknop (de draaikolk vervangen). Drie tot vijf varianten laten zien, naast elkaar op de echte
    knop in blauw en in rood (verstopt): bijvoorbeeld een spoelhendel, een druppel met kolk, een stortbak met pijl,
    een drukknop met twee standen. Bestaand icoon uit een vrije set of zelf getekend (dan zonder andermans naam erbij).
  - Pas na jouw keuze doorvoeren in `tools/icons.config.json`.

- [x] **76. Troep op de muren + schoonmaken** *(uitgevoerd als onderdeel van punt 83, Sprint 9)*
  - Als een verstopping **3 keer achter elkaar** overloopt, vliegt er troep tegen de muren en op de vloer: vlekken en
    spetters (decals op de wanden), voorwerpen die blijven plakken. De teller staat in de spelstand; hij gaat terug naar
    nul na een schone ontstopping.
  - Schoonmaken met spullen uit een nieuwe winkelcategorie **"Schoonmaak"**: spons (langzaam, gratis), schoonmaakspray,
    mop, hogedrukreiniger, schoonmaakrobot (doet het vanzelf, duur). Elk met eigen snelheid en bereik. Data in
    `js/data/cleaning.js`; vlekken als lijst met positie, grootte en "hoe vies" in de spelstand.
  - Zolang het vies is: minder punten per spoelbeurt (bv. −10% per vlek, maximaal −50%), zichtbaar bij de score.
    Afstemmen met de puntenbalans (punt 61).
  - Bediening: in de muurstanden (punt 67) over een vlek vegen om te poetsen.
## Sprint 9 (punten 78–88)

Branch `sprint-9` (nog niet gemerged). Feedback na het testen van Sprint 8: muren aantikken en inzoomen werken goed.

- [x] **78. Eigen visuele stijl** — *Jenn heeft op 2026-10-12 de drie richtingen bekeken en gekozen: A blijft.* Stijlvoorbeeldpagina `style-preview.html` met drie richtingen (A Sticker, B Tegelwerk, C Stripboek). **Gekozen: A · Sticker.** Vastgelegd in één designbestand, `css/tokens.css` (kleuren, lettertypen Lilita One + Nunito, omlijning, harde schaduw, scheve hoekjes), en overal doorgevoerd: zwevende knoppen, scorebubbel, gereedschap, menu's, meldingen en banners, winkel, profiel en welkomstscherm, credits, laad- en foutscherm. De oude "glazen" stijl is weg; een test bewaakt dat kleuren en lettertypen alleen uit de tokens komen.
- [x] **79. Opbouw: van kapotte wc naar luxe badkamer** — Nieuwe spelers beginnen met een kapot en vies toilet, de roestige emmer (12 L), een kale muur en een bruine vieze vloer. Alles heeft een prijs en een level (`minLevel`) in `js/data/`: tegels, vloeren, toiletmodellen, emmers, decoratie, gereedschap, schoonmaak en reparatie. Toilet: kapot → gerepareerd → schoon → ander model (dat laatste kan pas als hij heel en schoon is). Bestaande spelers houden alles; getest met een opslag op level 4.
- [x] **80. Vies en kapot toilet** — Kapot: scheve bril, scheef deksel met een barst, een stukje uit de rand. Vies: vuillaag met vlekken en druipers over het hele toilet, doffe kleur, kalkrand in de pot. Allemaal lagen bovenop het model en zijn eigen textures; het model is niet vervangen. Repareren en schoonmaken laten de overgang zien (bril draait recht, barst vervaagt, vuil lost op).
- [x] **81. Minder gereedschap aan het begin** — Vier om te beginnen: ontstopper en emmer heet water (werken), rubberen eendje en confettikanon (chaos). De overige twaalf komen per level vrij (level 1 t/m 5, lomp → luxe). Bij een level-up: melding "N nieuw in de winkel", een teller op de winkelknop en "Nieuw!" op de kaarten. Bestaande spelers houden hun gereedschap.
- [x] **82. Gereedschapsmenu links** — Eén kolom die scrollt, met een zachte vervaging waar meer staat, en een knop (moersleutel) om het menu in en uit te klappen; de keuze wordt onthouden. Onbekend / werkt / chaos hebben elk een eigen kleur en badge; afkoelring en seconden zijn groter; lang indrukken toont de korte naam zonder het gereedschap te gebruiken. Getest met 4 en met alle 16 gereedschappen.
- [x] **83. Schoonmaak en reparatie (inclusief punt 76)** — Winkelcategorie "Schoonmaak & Reparatie": lijm & reparatieset, nieuwe bril, nieuw deksel; wc-borstel, toiletreiniger; dweil en emmer, schrobmachine; spons, schoonmaakspray, hogedrukreiniger. Na drie verstoppingen op rij die overlopen vliegt er troep tegen muren en vloer (4 + 2 vlekken); loopt dezelfde verstopping twee keer over, dan blijft er een plas staan. Schoonmaken: sopje linksonder, middel kiezen, over de plek vegen of tikken; het verkeerde middel zegt waarvoor het niet is. Vies kost 10% per plek, tot 50%, zichtbaar bij de score. Alles in `js/data/care.js`.
- [x] **84. Troep netjes in de emmer** — Elk voorwerp telt als een bol, zakt naar de laagste vrije plek en rust op de bodem, de wand of andere voorwerpen. Niets steekt door de wand, niets zweeft; een volle emmer ligt tot net boven de rand. Elke emmer heeft zijn binnenmaat in `js/data/buckets.js`, gemeten op het model; een test vergelijkt de data met het model. Screenshots: `s9-09-emmer-*-opzij.png` en `s9-10-emmer-*-boven.png`.
- [x] **85. Speelse, verslavende winkel (eerlijk)** — Categorieën met eigen kleur en icoon, sticker-kaarten, uitgelicht item (het goedkoopste dat je nu kunt kopen) met voortgangsbalk, voortgang naar het volgende level, "Nieuw!" en "Bijna betaalbaar!", collectie per categorie ("3 van 5"), confetti en muntjes bij een aankoop. Eerlijk: geen timers of "laatste kans" (test), en echt geld staat apart met het label "Echt geld" en de prijs in euro's.
- [x] **86. Welkomstscherm** — In de nieuwe stijl. De Google- en Facebook-knoppen hebben een gestippelde rand en het label "Binnenkort", met de uitleg dat inloggen later komt.
- [x] **87. Tests** — `tests/start.spec.js`, `care.spec.js`, `tools.spec.js`, `style.spec.js`, uitbreidingen in `bucket.spec.js` en `screenshots.spec.js`; bestaande tests bijgewerkt.
- [ ] ~~**88. Notitie voor later**~~ *Dubbel: samengevoegd met punt 61 (puntenbalans), dat bovenaan onder "Volgende" staat.*

---

## Sprint 10 (punten 89–95)

Branch `sprint-9` (nog niet gemerged).

- [x] **89. CLAUDE.md uit de Apps-map** — Elke afspraak nagelopen; de lijst voldaan / niet voldaan / niet van toepassing staat in AUDIT.md deel 5. Aangepast: opslag onder `flushfactor.` met migratie van de oude sleutels, privacyverklaring en verwijderpagina (`privacy.html`, `delete.html`, `verwijderen.html`) in tien talen, in de app "Voortgang overzetten", "Profiel verwijderen" en "Alle gegevens van deze app verwijderen", "Gemaakt door Studio Sedillo" met contactadres in de credits, `docs/` (privacy-audit, credits, testversie, publiceren), `store/`, `.nojekyll`, `manifest.webmanifest`, tests bij elke push, test-repo met deploy naar github.io (noindex), en deze roadmap in de vaste opbouw. Tijdens de sprint kwam sectie 11 erbij (geen subdomein, Capacitor in plaats van TWA); wat ik voor het oude plan had klaargezet is weer weggehaald. Het omzetten naar drie bouwdoelen staat onder "Volgende".
- [x] **90. Water alleen ín de pot** — Oorzaak 1: de trechter van de draaikolk zakte tijdens het spoelen ruim een halve meter weg, dwars door de voet. Oorzaak 2: onder de kom is het model niet overal dicht, waardoor het weggezakte water bij de afvoer te zien was. Opgelost op twee manieren: het wateroppervlak volgt de gemeten binnenmaat van de kom en komt nooit onder de bodem, en een masker (stencil) op de opening van de kom tekent water, watergordijn en kalkrand alleen waar je door die opening kijkt. Spetters van het spoelen blijven in de kom. Het zwarte streepje was een van vier zwarte bouten in het model (twee in de voet, twee onder de stortbak); die worden niet meer getoond.
- [x] **91. Knop schoonmaakspullen altijd zichtbaar** — Linksonder, altijd (behalve in de close-up van de emmer). De teller toont hoe vaak je nog kunt vegen; bij een lege voorraad is hij grijs met een 0 en opent de knop de categorie "Schoonmaak & Reparatie" in de winkel.
- [x] **92. Schoonmaakspullen raken op** — Elk middel heeft een aantal keer gebruik (`uses` in `js/data/care.js`); elke veeg die vuil weghaalt telt als één. In de la en in de winkel zie je wat er over is ("3/6", balkje). Op = uit de voorraad en weer te koop. Duurder gaat langer mee. Reparaties zijn eenmalig. Wie al schoonmaakspullen had, krijgt van elk een volle voorraad.
- [x] **93. Schoonmaakmenu sluit bij tik ernaast** — Ook het cameramenu en het hoofdmenu. De tik wordt ingeslikt: niet inzoomen, niet spoelen, geen andere knop. Van het ene menu naar het andere kan wel in één tik; Escape sluit ook. **Afwijking (besluit van Jenn, 11 oktober):** het gereedschapsmenu blijft open tot je op de moersleutel tikt, anders zou de eerste tik op Spoelen het inklappen en niet spoelen.
- [x] **94. Talen zoals Sudoku Kids** — Dezelfde tien talen (Nederlands, English, Deutsch, Français, Español, Português, Italiano, Polski, Türkçe, Bahasa Indonesia), dezelfde keuzelijst (in het hoofdmenu), standaard de taal van het toestel en anders Engels. Eén bestand per taal in `js/i18n/`; in de code en de data staat geen tekst meer. In Sudoku Kids is niets gewijzigd.
- [x] **95. Tests** — `tests/water.spec.js`, `menus.spec.js`, `i18n.spec.js`, `storage.spec.js`, `pages.spec.js`; uitbreidingen in `care.spec.js`, `layout.spec.js` en `screenshots.spec.js`.

---

## Sprint 11 (punten 96–101)

Branch `sprint-9` (nog niet gemerged).

- [x] **96. Geluiden (uitvoering van punt 58, eerste deel)** — Spoelen (even lang als de spoelanimatie), overlopend toilet (borrelen, loopt mee zolang het overloopt), ontstoppen (plop plus wegspoelen; chaos-gereedschap een eigen grappig geluid), voorwerpen die in de emmer vallen (per soort, drie varianten). Alleen CC0; bron en licentie per geluid in `docs/credits.md` en het credits-scherm. Klein en kort, pas laden na de eerste tik. Menu: geluid aan/uit en volume, per profiel onthouden. *Nog door Jenn te beluisteren (zie "Nu bezig"); de Freesound-geluiden zijn de voorbeeldversies van Freesound, zie `docs/credits.md`.*
- [x] **97. Knop naar de winkel in het schoonmaakmenu** — Winkelwagentje in de uitgeklapte la (aria-label "Schoonmaakspullen kopen") dat de winkel opent op "Schoonmaak & Reparatie"; na het sluiten ben je terug in het spel.
- [x] **98. Controle tegen de Apps-CLAUDE.md** — Opnieuw volledig gelezen (tussentijds gewijzigd), de lijst in AUDIT.md bijgewerkt en opgelost wat niet voldoet, waaronder de blocklist-controle in de CI.
- [x] **99. Open punten roadmap** — Overzicht van alle open punten in vier groepen; dubbele en achterhaalde punten opgeruimd, nummering intact.
- [x] **100. Antwoorden op het rapport van sprint 10** — Betalen (besluit vastgelegd), privacytekst (welke dienst stuurt gegevens naar de VS), punt 78 (stijlvoorbeeld op de testlink; Jenn koos daarna A). De passage over het Data Privacy Framework is niet weggehaald maar preciezer gemaakt: de webversie komt van GitHub Pages en e-mail loopt via Gmail, allebei Amerikaans, en `Apps/CLAUDE.md` §5 schrijft die vermelding voor.
- [x] **101. Tests** — Geluiden laden zonder fouten en volgen de instellingen, de winkelknop in het schoonmaakmenu opent de juiste categorie, de blocklist-controle draait in CI. `tests/sound.spec.js`, `tests/ci.spec.js`, uitbreidingen in `care.spec.js`, `pages.spec.js`, `rook.spec.js`; `menus.spec.js` aangepast (het hoofdmenu is een regel hoger). Volledige suite lokaal groen op vier formaten.

---

## Sprint 12 (punten 102–106): aanvulling op de geluiden

Branch `sprint-9` (nog niet gemerged). Feedback van Jenn na het beluisteren van punt 96.

- [ ] **102. Geluid op het juiste moment** — Het geluid bij het verstopt raken begint op hetzelfde moment als de verstopping (het voorwerp dat valt). Structureel voor alle geluiden: vooraf geladen en gedecodeerd (AudioBuffers, na de eerste tik), zonder stilte vooraan, afgespeeld vanuit dezelfde spel-events die de animaties starten. Test meet de vertraging tussen event en start van het geluid; doel onder 50 ms.
- [ ] **103. Geluid bij emmer legen** — Eigen geluid (troep die eruit kiept en rammelt).
- [ ] **104. Elk gereedschap een eigen geluid** — Zestien gereedschappen, zestien geluiden. Werkend: eigen geluid tijdens gebruik, daarna het algemene ontstopt-geluid. Chaos: alleen het eigen geluid. Per gereedschap vastgelegd in `js/data/tools.js`; een test eist dat elk gereedschap een geluid heeft en dat geen twee hetzelfde bestand delen.
- [ ] **105. Rustig house-deuntje** — Rustige deep-house-lus als achtergrondmuziek, naadloos herhalend, standaard aan. Vrije licentie, bron in `docs/credits.md` en het credits-scherm. Zachter tijdens spoelen en ontstoppen, stil op de achtergrond, klein bestand, pas geladen na het startscherm.
- [ ] **106. Geluidsinstellingen** — Per profiel een schuif en aan/uit voor Muziek, Toilet & water, Gereedschap, Emmer & schoonmaak en Interface, plus de hoofdschakelaar "Alle geluid uit". Onthouden na herladen. Test: elke regelaar raakt alleen zijn eigen groep.
