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

*Bijgewerkt: versie 0.1 — initiële release.*
