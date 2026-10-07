# The Flush Factor — ROADMAP 🗺️

## ✅ Versie 0.1 — Werkende basisversie (huidig)

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

## 🔧 Volgende stappen (huidige sprint)

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

## 🔧 Sprint 2 (punten 11–20)

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

## 🔧 Sprint 3 (punten 21–25)

- [x] **21. Oorzaak 3D-fallback vinden en oplossen** — Root-cause: ontbrekende `js/utils/BufferGeometryUtils.js` (relatieve import in GLTFLoader.js); toegevoegd aan `js/utils/`; zichtbare foutbanner bij onverwachte fallback; SW v7 stuurt `SW_UPDATED` → game.js herlaadt pagina automatisch.
- [x] **22. Realistisch toiletmodel** — CC0 "Toilets" pack (loafbrr_1, opengameart.org) gedownload; `Toilet_Round_A` gebruikt (aparte seat_cover/seat/flusher nodes); PBR-materialen per onderdeel; CREDITS.md bijgewerkt.
- [x] **23. Layout die altijd herstelt bij schermwissel** — Centrale resize-functie in renderer3d.js + game.js; ResizeObserver + resize/orientationchange/fullscreenchange/visualViewport; `position:fixed;inset:0` layout.
- [x] **24. Kleine UI-fouten** — Waterbalk `position:relative` fix; spoelknop label verkleind; preview-heractiveerknop toont "📱 Preview" label.
- [x] **25. Automatische tests** — Playwright smoke-tests (`tests/smoke.spec.js`); `playwright.config.js`; GitHub Actions workflow (`.github/workflows/ci.yml`); screenshots in `tests/screenshots/`.

---

## 🔧 Sprint 4 (punten 26–32)

- [x] **26. Water zit niet in de pot (fout)** — Wateroppervlak zweeft boven het toilet; fix positie/grootte/vorm op basis van GLB bounding box van de kom; Playwright-screenshot van bovenaf.
- [x] **27. Smallere ruimte, echt een wc-hokje** — Ca. 0,9–1,0 m breed, 1,5–1,8 m diep, 2,4 m hoog; toilet tegen achterwand; camera vanuit deuropening; OrbitControls-limieten aanpassen.
- [x] **28. Inzoomen op de mand** — Klik op 3D-mand of mandknop → camera zoomt soepel naar kijk-van-bovenaf; terugknop + Esc.
- [x] **29. Toilet-logo naar midden boven** — Ronde blauwe knop van linksboven naar midden boven.
- [x] **30. Gereedschapsmenu past altijd op het scherm** — Max hoogte = viewport min boven/onder; scrollbaar met fade; liggend: kleinere knoppen of twee kolommen.
- [x] **31. Preview-werkbalk: tablet staand + terug naar telefoon** — Tabletformaten (768×1024, 820×1180); altijd staand openen; Draaien togglet; alle formaten wisselbaar.
- [x] **32. Testen uitbreiden** — Tablet staand/liggend, wisselen telefoon↔tablet↔gedraaid; overlap-checks; screenshots.

---

## 🔧 Sprint 5 (punten 33–39)

- [ ] **33. Beter toiletmodel (Sketchfab HippoStance)** — CC-BY model met nodes Toilet, ToiletSeatCover, ToiletSeat, ToiletSeatMount, ToiletFlushHandle; bestand `assets/models/toilet-2k.glb`; vereist handmatig downloaden van Sketchfab (authenticatie vereist — niet automatisch te doen). Naamsvermelding in CREDITS.md.

- [ ] **34. Controle toiletmodel (eerst doen)**
  - Controleer of het Sketchfab-model van HippoStance (`assets/models/toilet-2k.glb`, nodes Toilet, ToiletSeatCover, ToiletSeat, ToiletSeatMount, ToiletFlushHandle) echt in gebruik is. De samenvatting noemde "Toilet_Round_A_Seat", wat niet uit dit model komt. Is punt 33 niet (volledig) uitgevoerd, doe dat dan eerst.
  - Het deksel (ToiletSeatCover) staat nu dicht, waardoor je het water niet ziet. Standaard moet het deksel OPEN staan (rechtop tegen de stortbak), zodat je in de pot en het water kijkt.

- [ ] **35. Startbeeld verder uitgezoomd**
  - Zoom het startbeeld verder uit, zodat er duidelijk vrije wandruimte is BOVEN het toilet en AAN BEIDE ZIJKANTEN. Daar komen later kastjes, planken, spiegel, schilderijtjes en andere decoratie uit de winkel.
  - Maak hiervoor ankerpunten aan: wand boven het toilet, linkerwand, rechterwand, en vloer links/rechts. Leg ze vast in een config, zodat decoratie later op een vaste plek kan worden gezet.
  - Het hokje mag daarvoor iets breder worden als dat nodig is, maar moet wel als wc-ruimte blijven voelen.
  - Het toilet en de mand blijven goed zichtbaar en niet bedekt door de knoppen.

- [ ] **36. 3D-scène vult het hele scherm**
  - De 3D-scène moet doorlopen tot helemaal bovenin (achter de notch) en helemaal onderin. Nu zit er bovenin een grijze strook en onderin een lichtblauwe balk.
  - Verwijder die balken/achtergronden; ALLE knoppen (spoelknop, terug, mand, gereedschappen, score, winkel, menu) zweven over de scène heen, met safe-area-insets zodat ze niet achter de notch of de home-balk vallen.
  - Controleer in alle formaten (telefoon klein/standaard/groot, tablet mini/groot, staand en liggend).

- [ ] **37. Spoelknop met icoon**
  - Haal de tekst "SPOELEN" uit de spoelknop. Gebruik alleen een duidelijk icoon van een spoelhendel / flush-symbool (SVG, zie punt 43 voor de icon-set). Geef de knop wel een aria-label "Spoelen" voor toegankelijkheid.

- [ ] **38. Inzoomen op de mand**
  - Bij het inzoomen op de mand zit het hengsel in de weg. Verberg het hengsel (of draai het plat weg) zolang de camera ingezoomd is, en laat het weer zien bij teruggaan.
  - De knop "Terug" overlapt nu met de spoelknop. Verplaats "Terug" naar een plek zonder overlap (bv. linksboven onder de menuknop) en verberg de spoelknop zolang je in de mand kijkt.

- [ ] **39. Mand legen werkt niet (fout)**
  - Het legen van de mand werkt niet; de teller (bv. 3,5 / 20 L) blijft staan en de voorwerpen blijven liggen. Zoek de oorzaak en los het op.
  - Duidelijke manier om te legen: een knop "Mand legen" die verschijnt bij de mandknop en in de ingezoomde mandweergave. Bij legen: korte animatie (mand kantelt / voorwerpen verdwijnen), teller terug naar 0 L, opgeslagen in localStorage.
  - Voeg een Playwright-test toe die de mand vult, leegt en controleert dat teller en 3D-inhoud echt leeg zijn, ook na herladen van de pagina.

---

## 🔜 Versie 0.2 — Verbeteringen & uitbreiding

### Prioriteit hoog
- [ ] **Geluidseffecten** via Web Audio API: plons bij spoelen, blorp bij verstopping, feest bij oplossen.
- [ ] **Dagelijkse uitdagingen**: "Spoel 50× vandaag voor bonuspunten."
- [ ] **Prestaties/badges**: bijv. "Eerste overloop overleefd", "Ninja Combo × 8".
- [ ] **Betere PWA-iconen**: echte PNG-iconen in meerdere maten (192×192, 512×512).
- [ ] **Splashscherm**: titelscherm met start-knop bij eerste bezoek.

### Prioriteit middel
- [ ] **Animaties verbeteren**: vloeiendere wateranimatie, bubbels in de kom bij verstopping.
- [ ] **Extra gereedschappen**: Vacuümpomp, Hydrojet, etc.
- [ ] **Extra cosmetica**: seizoensgebonden items (kerst-toilet, zomer-strandtoilet).
- [ ] **Tutorial**: eerste 3 verstoppingen worden begeleid.
- [ ] **Snelheidsmodus**: optie om spoelcyclus te versnellen voor gevorderde spelers.

### Prioriteit laag
- [ ] **Statistiekenscherm**: totaal spoelen, totaal verstoppingen, beste combo.
- [ ] **Dagelijks bonus**: beloningssysteem voor dagelijks terugkeren.

---

## 🚀 Versie 1.0 — Play Store release

- [ ] **TWA-integratie**: Digital Asset Links (`/.well-known/assetlinks.json`), Bubblewrap-configuratie.
- [ ] **Privacybeleid** (vereist voor Play Store).
- [ ] **Reclame-integratie** (optioneel): AdMob via TWA.
- [ ] **In-app aankopen** (optioneel): punten kopen via Google Play Billing.
- [ ] **Volledige offline test** op Android-apparaat.
- [ ] **Prestatieoptimalisatie**: Lighthouse-score ≥ 90.

---

## 💡 Toekomstige ideeën

- Multiplayer: wie haalt de meeste punten in 60 seconden?
- Seizoensgebonden events: "Kerst Chaos" met kersttegels.
- Mini-games bij verstopping: swipe-puzzel om te ontstoppen.
- Toilet-upgrades die passieve punten geven.
- Ranglijst (lokaal of online).

---

## 🔮 Toekomstplan (nog niet bouwen)

- [ ] **40. Profiel**
  - Onder de scorebubbel een profielknop.
  - Fase 1: spelen als gast (lokaal profiel met naam/avatar).
  - Fase 2: account aanmaken met e-mailadres, Google of Facebook, zodat voortgang op meerdere apparaten bewaard blijft. Gastvoortgang moet bij het aanmaken van een account overgezet worden.
  - Uitzoeken: backend (bv. Firebase Authentication + Firestore of Supabase), privacyverklaring en AVG, account verwijderen moet mogelijk zijn (verplicht in de Play Store).

- [ ] **41. Aankopen met echt geld**
  - Kostenprofiel / betaalomgeving voor aankopen met echt geld (bv. puntenpakketten, premium items).
  - Let op: voor digitale aankopen in een app via de Google Play Store is Google Play Billing verplicht. Voor de PWA/TWA gaat dat via de Digital Goods API + Payment Request API. Andere betaalmethoden (Stripe, PayPal) zijn voor in-app digitale items niet toegestaan.
  - Aankopen moeten server-side gecontroleerd worden en aan het account (punt 40) gekoppeld zijn.
  - Duidelijke prijzen, geen misleidende aankopen; nadenken over leeftijdsclassificatie en ouderlijk toezicht.

- [ ] **42. Winkel met uitklapmenu's**
  - De winkel wordt één overzicht met alle categorieën als kopjes (bv. Gereedschap, Toiletten, Tegels, Vloeren, Decoratie, Manden). Elke categorie klapt uit (accordion/dropdown) als je erop tikt, zodat je in één oogopslag alle categorieën ziet.

- [ ] **43. Eigen icon-set in plaats van emoji's**
  - Alle emoji's in het spel vervangen door één consistente set SVG-iconen met een vrije licentie. Opties om te vergelijken:
    - game-icons.net (veel spel-iconen, CC BY 3.0, naamsvermelding nodig)
    - Kenney.nl (CC0, game-UI en iconen)
    - Lucide, Tabler Icons of Phosphor (MIT, strakke UI-iconen)
  - Voorstel maken welke set het best past, inclusief een lijst van alle plekken in het spel waar nu een emoji staat. Credits in CREDITS.md.

- [ ] **44. Meer gratis layout- en decoratie-ideeën**
  - Lijst maken van gratis (CC0/CC-BY) 3D-modellen en textures voor de winkel: andere tegels en vloeren (ambientCG, Poly Haven), kastjes, planken, spiegels, planten, wc-rolhouders, posters, verlichting (Poly Haven, Kenney, Sketchfab met filter Downloadable + CC-licentie), en complete badkamerthema's (bv. retro, luxe hotel, festival-dixi, oud café).

---

*Bijgewerkt: Sprint 5 — punten 34–39 toegevoegd/uitgewerkt; punten 40–44 vastgelegd als toekomstplan.*
