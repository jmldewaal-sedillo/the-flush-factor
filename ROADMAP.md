# The Flush Factor — ROADMAP

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

## Versie 1.0 — Play Store release

- [ ] **TWA-integratie**: Digital Asset Links (`/.well-known/assetlinks.json`), Bubblewrap-configuratie.
- [ ] **Privacybeleid** (vereist voor Play Store).
- [ ] **Reclame-integratie** (optioneel): AdMob via TWA.
- [ ] **In-app aankopen** (optioneel): punten kopen via Google Play Billing.
- [ ] **Volledige offline test** op Android-apparaat.
- [ ] **Prestatieoptimalisatie**: Lighthouse-score ≥ 90.

---

## Toekomstige ideeën

- Multiplayer: wie haalt de meeste punten in 60 seconden?
- Seizoensgebonden events: "Kerst Chaos" met kersttegels.
- Mini-games bij verstopping: swipe-puzzel om te ontstoppen.
- Toilet-upgrades die passieve punten geven.
- Ranglijst (lokaal of online).

---

## Toekomstplan (nog niet bouwen)

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

- [x] **46. Punten kopen** — "Punten kopen" als eerste categorie in de winkel, met vier pakketten (500 / 1.500 / 5.000 / 15.000 punten, €0,99–€17,99). Koppelpunt Digital Goods API / Google Play Billing via `purchaseService.buy(productId)` in `js/purchases.js` (dispatcht `purchase:pending`-event). Saldo wijzigt niet.

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

- [ ] **58. Geluiden** — Spoelen, gorgelen, plop bij ontstoppen, chaos-geluiden, kassa, level-up (CC0-bronnen); volume en aan/uit in het menu.
- [ ] **59. Profiel** — *Fase 1 (lokaal gastprofiel, naam, avatar, statistieken) is gedaan in punt 69.* Nog te doen: echt koppelen met Google/Facebook/e-mail om te synchroniseren, gastvoortgang overzetten, account verwijderen. Zie het stappenplan bij Sprint 8. *(Vervangt punt 40.)*
- [ ] **60. Echte betaling voor punten** — Google Play Billing (Digital Goods API + Payment Request API in de TWA), via `purchaseService.buy()` in `js/purchases.js`, server-side gecontroleerd. *(Vervangt punt 41.)*
- [ ] **61. Logische puntenbalans** — Eén doordacht systeem voor punten per spoelbeurt/combo/ontstopping/level en prijzen, met een overzicht "hoeveel minuten spelen voor item X"; straffen in verhouding. Alle getallen staan al bij elkaar in `js/data/`.
- [ ] **62. Meerdere talen** — Alle teksten naar taalbestanden (nl, en), taalkeuze in het menu, standaard de toesteltaal. Voorbereid: teksten uit JavaScript staan in `js/data/texts.js`.
- [ ] **63. Aankleden** — Toilet en hokje aankleden (wc-hoes, matjes, handdoeken, spiegels, kastjes, planten, posters, verlichting) op de ankerpunten; thema-sets; items plaatsen, verschuiven en weghalen. Basis ligt er: ankerpunten in `js/data/room.js`, decoratie in `js/data/cosmetics.js`.

---

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
  - **In-app aankopen**: digitale items alleen via Google Play Billing (punt 60); prijzen duidelijk, geen aankoop zonder bevestiging.
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

- [ ] **76. Troep op de muren + schoonmaken**
  - Als een verstopping **3 keer achter elkaar** overloopt, vliegt er troep tegen de muren en op de vloer: vlekken en
    spetters (decals op de wanden), voorwerpen die blijven plakken. De teller staat in de spelstand; hij gaat terug naar
    nul na een schone ontstopping.
  - Schoonmaken met spullen uit een nieuwe winkelcategorie **"Schoonmaak"**: spons (langzaam, gratis), schoonmaakspray,
    mop, hogedrukreiniger, schoonmaakrobot (doet het vanzelf, duur). Elk met eigen snelheid en bereik. Data in
    `js/data/cleaning.js`; vlekken als lijst met positie, grootte en "hoe vies" in de spelstand.
  - Zolang het vies is: minder punten per spoelbeurt (bv. −10% per vlek, maximaal −50%), zichtbaar bij de score.
    Afstemmen met de puntenbalans (punt 61).
  - Bediening: in de muurstanden (punt 67) over een vlek vegen om te poetsen.

- [ ] **77.** *(gereserveerd voor latere punten)*

---

*Bijgewerkt: Sprint 8 — punten 64–71 uitgevoerd; 58–63 en 72–77 vastgelegd voor later.*
