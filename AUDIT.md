# The Flush Factor — AUDIT

Controle van het hele project op branch `rebuild` (afgesplitst van `main` @ `68776cc`).
Datum: 2026-10-09. In deze stap is **niets aan de code gewijzigd**; alleen dit rapport is toegevoegd.

Hoe gecontroleerd: alle bronbestanden, ROADMAP/README/CREDITS volledig gelezen; de bestaande
Playwright-suite gedraaid; eigen screenshots gemaakt (telefoon staand/liggend, tablet staand/liggend,
preview met notch, winkel open/dicht, mandzoom leeg/gevuld) met console- en netwerklog; GLB-bestanden
uitgelezen (nodes, materialen, textures, licentie-metadata); live GitHub Pages vergeleken met `main`.

Oordeel per onderdeel: **houden** / **verbeteren** / **opnieuw bouwen**.

---

## 0. Eerst dit: vier dingen die niet kloppen met de opdracht

| # | Wat | Gevolg |
|---|-----|--------|
| A | **ROADMAP.md stopt bij punt 49.** De punten 50 t/m 57 staan er niet in (ook niet in git-historie of een andere branch). | Ik ken alleen 52 (hengsel is een ring) en 55 (notch) uit je bericht. De tekst van 50, 51, 53, 54, 56, 57 heb ik nodig. |
| B | **`kfc_bucket.glb` bestaat niet** in `assets/models/buckets/`. Hij staat alleen in `credits.txt`. | Niets te controleren; wordt niet gebruikt. Regel blijft uit de credits. |
| C | **"Bathroom Toilet Paper by Quaternius"** staat in `credits.txt`, maar er is geen bestand, link of licentie. | Niet bruikbaar tot het bestand er is. Wc-rol blijft procedureel (kan prima met simpele vormen). |
| D | **Auteur "Old Rusted Bucket v1"**: `credits.txt` zegt *Coozy*, de metadata in het GLB zegt *GameDev Nick*. | Waarschijnlijk dezelfde maker met nieuwe accountnaam. Ik vermeld beide namen + link, tenzij jij het anders weet. |

---

## 1. Testresultaat nu

- `npx playwright test`: **73 geslaagd, 3 gefaald** (4,8 minuten). De 3 fouten zijn elke run andere tests:
  `Execution context was destroyed` / navigatie onderbroken.
- Oorzaak: de service worker stuurt na activeren `SW_UPDATED` en `game.js` herlaadt dan de pagina,
  midden in de test. Dat gebeurt ook bij echte spelers (eerste bezoek = één onverwachte herlaad).
- **GitHub Actions faalt op elke push** sinds Sprint 4 (laatste run: 14 min, failure). Niemand heeft dat opgepakt.
- Console: geen JS-fouten, geen 404's lokaal. Wel alleen omdat de testserver op `/` draait (zie §6).

---

## 2. Codestructuur

| Onderdeel | Werkt | Kwaliteit | Wat moet beter | Voorstel |
|-----------|-------|-----------|----------------|----------|
| `clog.js` | Ja | Goed, klein en los van DOM | `setLevel` overschrijft het gedeelde `CLOG_CONFIG`-object; `level`-parameter ongebruikt | **Houden**, klein opschonen |
| `items.js` | Ja | Redelijk; data staat bij elkaar | Emmers hebben geen model/afmeting, decoratie heeft geen ankerpunt, teksten en levels zitten in één groot bestand; `MESSAGES.toolWorking/comboBreak/levelUp` ongebruikt | **Verbeteren**: opsplitsen in `js/data/` (levels, tools, buckets, cosmetics, anchors, packages, texts) |
| `inventory.js` | Ja | Matig | De helft is weergave: chaos-effecten bouwen DOM-elementen in een logicamodule, en dezelfde effecten worden óók nog in 3D getekend (dubbel). Verwijst naar `#toilet-wrapper` (2D, onzichtbaar). `MESSAGES`-import ongebruikt | **Verbeteren**: logica houden, effecten naar aparte `effects`-module |
| `shop.js` | Deels | Matig | Zie §3 punt 42/45 (open-stand wordt niet bewaard, koopmelding werkt maar één keer, ingeklapte categorieën lekken) | **Verbeteren** (gerichte reparatie, geen herbouw nodig) |
| `purchases.js` | Ja | Prima als koppelpunt | Pakketten horen bij de data | **Houden**, data verplaatsen |
| `game.js` | Ja | Matig | ± 250 regels 2D/SVG-fallback (`animateFlush`, `shakeToilet`, `showClogProp`, `animatePropFlyToBin`, `interpolateColor`, …) die bij 3D nooit lopen; `iconEl` ongebruikt geïmporteerd; inventaris-DOM wordt bij elk gebruik helemaal opnieuw gebouwd; resize dubbel geregeld (ook in renderer); `0.0 / 20 L` met punt i.p.v. komma; level hangt aan uitgeefbaar saldo | **Verbeteren**: opsplitsen in state/opslag, UI, coördinatie |
| `renderer3d.js` | Ja | Zwak punt van het project (zie §4) | 1.278 regels in één bestand; alles hardgecodeerd; procedureel toilet (100 regels) wordt altijd gebouwd en direct verborgen; `DRACOLoader` geladen met decoder van **gstatic-CDN** (model is niet Draco → dode code, en breekt offline-belofte); cosmetica-tabellen dubbel t.o.v. `items.js` | **Opnieuw bouwen** in modules (scene, room, toilet, water, bucket, decor, camera, effects) |
| `icons.js` | Ja | Onvoldoende (zie §3 punt 43/47) | — | **Opnieuw bouwen** |
| `phone-preview.js` | Ja | Redelijk | Bevat nog emoji (📱) en symbolen (↻ ⛶ ✕); notch in de preview is nep: het spel krijgt geen safe-area en de menuknop schuift er half onder | **Verbeteren** |
| `index.html` | Ja | Matig | 75 regels SVG-toilet dat nooit zichtbaar is; iconen inline gekopieerd i.p.v. uit de iconenset; credits hardgecodeerd | **Verbeteren** |
| `style.css` / `animations.css` | Ja | Redelijk | Veel 2D-resten (tegel-achtergronden, vloerstrook, toilet-skins, prop-animaties); `[hidden]` werkt niet op elementen met `display:flex` | **Verbeteren** |

**Oude 2D/SVG-resten** (voorstel: verwijderen, zie §8): SVG-toilet in `index.html`, `#clog-prop`, `#decoration-slot`,
alle `#bathroom-scene::before/::after`-achtergronden, `data-tiles`/`data-floor`/`data-model`-CSS, bijbehorende keyframes
en de 2D-takken in `game.js`. De 2D-modus is nu al geen speelbare fallback (decoratie-icoon valt achter de scorebubbel,
mand is onzichtbaar). Voorstel: vervangen door één nette melding "WebGL niet beschikbaar".

---

## 3. Afgevinkte ROADMAP-punten: echt goed uitgevoerd?

Legenda: ✅ goed · ⚠️ werkt half · ❌ niet (goed) uitgevoerd

| Punt | Oordeel | Bevinding |
|------|---------|-----------|
| 1–9 (2D-versie) | ✅ maar achterhaald | Vervangen door 3D; code is nu ballast |
| 10 3D-scène | ⚠️ | Werkt. "SVG-fallback blijft werken" klopt niet meer |
| 11, 22 OpenGameArt-toilet | ⚠️ | `toilet.glb` (0,68 MB, 19 objecten: ook urinoirs en wastafels) wordt alleen geladen als het hoofdmodel faalt. In de praktijk nooit |
| 12 OrbitControls | ✅ | Werkt, limieten oké |
| 13, 35 uitgezoomd + ankerpunten | ⚠️ | `DECO_ANCHORS` bestaat maar **niets gebruikt het**. Decoratie uit de winkel verschijnt niet in 3D |
| 14–18 HUD | ⚠️ | Werkt; streak-vakjes zijn bij start twee lege grijze pilletjes |
| 19 mand + upgrades | ⚠️ | Grotere mand kopen verandert alleen het getal; het 3D-model blijft gelijk |
| 21 3D-fallback-fix | ✅ | |
| 23 resize | ✅ | Werkt, wel dubbel geïmplementeerd |
| 25, 32, 49 tests | ❌ | Zie §7 |
| 26 water in de pot | ✅ | Zit goed in de kom |
| 27 wc-hokje | ❌ | ROADMAP zegt 0,9–1,0 m breed. De ruimte is **3,0 × 7,7 × 3,2** eenheden; het toilet is 1 eenheid hoog en staat klein in een zaal. Zijwanden: 3×3 tegels uitgerekt over 7,7 m → zichtbaar vervormd (liggend/tablet) |
| 28 mandzoom | ⚠️ | Zie 38/52 |
| 30 gereedschapsmenu past | ⚠️ | Telefoon liggend: 4 van de 8 zichtbaar, rest alleen via scrollen zonder aanwijzing |
| 31 preview tablet | ✅ | |
| 33/34 HippoStance-toilet | ⚠️ | Model wordt geladen (in ROADMAP nog **niet** afgevinkt). Maar: de code vervangt het materiaal door effen wit → de **5,9 MB aan textures in het bestand wordt gedownload en weggegooid**. Deksel wordt verborgen i.p.v. opengeklapt |
| 36 scène vult scherm | ✅ | Geen balken meer |
| 37 spoelknop-icoon | ❌ | Zie 43/47 |
| 38 mandzoom | ❌ | "Terug" staat goed. Maar de **spoelknop blijft zichtbaar** (`hidden` wordt overschreven door `display:flex`), de gereedschapsbalk ligt over de mand, en het "hengsel" is nog te zien (zie 52) |
| **39 mand legen** | ⚠️ | Teller → 0, opslag werkt, knop "Legen" staat er. **Maar na herladen is de 3D-mand leeg terwijl de teller 5,0 L zegt** (inhoud wordt niet hersteld). Voorwerpen zijn platte witte icoon-plaatjes die bóven de mand zweven. Mand vol → voorwerp verdwijnt stil met −30 punten. De test controleert de 3D-inhoud niet |
| **42/45 winkel-accordion** | ⚠️ | Alle 7 categorieën staan er en klappen open (door mij geverifieerd: Punten kopen, Gereedschap, Toiletmodellen, Tegelpatronen, Vloeren, Decoratie, Manden). **Dat jij alleen gereedschap ziet, kan ik lokaal niet namaken**; meest waarschijnlijke oorzaak is een verouderde versie in de browsercache van je telefoon (zie §6). Echte fouten: (1) open/dicht-stand wordt nooit bewaard (code leest `data-cat-id` dat nergens gezet wordt → er wordt altijd `[]` opgeslagen); (2) ingeklapte categorieën laten een randje van de kaarten zien; (3) melding "Binnenkort beschikbaar" komt maar bij de eerste klik; (4) manden tellen verkeerd (`1/4`, ook na aankoop) |
| 46 punten kopen | ⚠️ | Zie (3) hierboven. Twee pakketten heten allebei "populair" |
| **43/47 emoji's vervangen** | ❌ | In de spel-DOM staan geen emoji meer, maar: (1) de 25 "game-icons.net"-iconen zijn **niet van game-icons.net**. Het zijn zelf in elkaar gezette cirkels en rechthoeken (in de code staat letterlijk "Simplified geometric versions"). CREDITS.md schrijft ze toe aan Delapouite/Lorc: **dat is onjuist**. (2) "banana" is in werkelijkheid het Lucide-icoon *flag*; "snake" is verzonnen. (3) Twee stijlen door elkaar (lijn + gevuld), gevulde iconen zwart op blauw. (4) De **spoelknop is een cirkelpijl die als een "G" leest**. (5) Emoji staan nog in `manifest.json` (app-icoon 🚽), `phone-preview.js` (📱) en de 3D-foutbanner (⚠️). (6) De emoji-test kijkt alleen naar het startscherm |
| 48 safe-area winkelkop | ✅ | CSS klopt |
| **52 hengsel is een ring** | ❌ bevestigd | Oorzaak gevonden: de *rand* van de mand (torus) is nooit plat gelegd en staat rechtop: dat is de ring die je ziet. Het echte hengsel zit erachter. Het geheel is een oranje cilinder zonder textuur |
| **55 beeld breekt bij de notch** | ⚠️ deels bevestigd | In de preview valt de menuknop half onder de notch. Op een echte telefoon regelt `env(safe-area-inset-top)` de knoppen. Wat er op jouw toestel precies breekt weet ik niet zeker zonder de tekst van punt 55 of een screenshot. Verdachten: `display: standalone` + `black-translucent`, `orientation: portrait` in het manifest terwijl liggend ondersteund wordt, en meldingen die op vaste pixelhoogte onder de menuknop staan. De bestaande "notch-test" test alleen of een padding ≥ 16 px is: die is altijd waar |

---

## 4. 3D-assets

### Wat staat er en wat wordt gebruikt

| Bestand | Grootte | Gebruikt | Licentie | In credits | Voorstel |
|---------|---------|----------|----------|------------|----------|
| `models/toilet-2k.glb` (HippoStance) | 6,4 MB | Ja, maar zonder eigen textures | CC BY 4.0 | Alleen in de credits-popup, **niet in `assets/CREDITS.md`** | **Blijft.** Eigen PBR-textures gebruiken; comprimeren (2K PNG → 1K WebP, doel < 1 MB); deksel met scharnier-hulpgroep openklappen |
| `models/toilet.glb` (loafbrr_1) | 0,68 MB | Alleen bij laadfout | CC0 | Ja | → `assets/_unused/` |
| `buckets/wooden_bucket.glb` (romullus) | 4,1 MB | Nee | **CC BY-SA 4.0** | Alleen `credits.txt` | **Gebruiken** als standaard-emmer level 1. Share-alike geldt voor het model zelf (ook de gecomprimeerde versie), niet voor de spelcode; ik vermeld dat in CREDITS |
| `buckets/plastic_bucket.glb` (MaX3Dd) | 1,7 MB | Nee | CC BY 4.0 | idem | Gebruiken als upgrade |
| `buckets/metal_bucket.glb` (Kozlov Maksim) | 2,1 MB | Nee | CC BY 4.0 | idem | Gebruiken als upgrade |
| `buckets/old_rusted_bucket_v1.glb` | 5,5 MB (12 textures) | Nee | CC BY 4.0 | idem, auteursnaam wijkt af (§0-D) | Gebruiken als upgrade, na compressie |
| `buckets/pair_of_buckets.glb` (Sousinho) | 4,7 MB | Nee | CC BY 4.0 | idem | Grote emmer eruit halen als XL-upgrade; anders → `_unused` |
| `kfc_bucket.glb` | — | — | — | — | Bestaat niet (§0-B) |
| `hdri/bathroom.hdr` | 1,6 MB | Ja | CC0 | Ja | Houden; verkleinen (alleen reflecties) |
| `textures/Tiles101_*` | 3,0 MB | Ja | CC0 | Ja | Houden, naar WebP, tegelmaat corrigeren |
| `textures/WoodFloor041_*` | 2,9 MB | Ja | CC0 | Ja | Houden, naar WebP |

- Geen enkel aanwezig model heeft een merklogo in naam, nodes of materialen. Ik bekijk de emmers in stap 2 nog visueel voor ze erin gaan.
- De map `buckets/` en `credits.txt` zijn nog **niet in git** (untracked).
- `assets/` is nu 34 MB. Eerste keer laden van het spel: **± 14,6 MB**, waarvan ± 6 MB nooit getoond wordt. Dat is te zwaar voor "vloeiend op een gemiddelde telefoon".
- Los bestand `3TrL3C98ts7rgspUppBufk.jpg` (1,1 MB) in de projectroot: nergens gebruikt, door `.gitignore` genegeerd. Ik laat het staan tot jij zegt wat het is.

### Gedownload of zelf gemaakt (plan voor stap 2)

| Object | Keuze | Waarom |
|--------|-------|--------|
| Toilet | Gedownload (HippoStance) | Jouw keuze; organische vorm die procedureel niet geloofwaardig lukt |
| Emmers | Gedownload (map `buckets/`) | Duigen, roest, deuken en hengsels zien er als model veel beter uit dan een cilinder |
| Wanden, vloer, plafond, plint | Zelf, met CC0-textures | Vlakken |
| Wc-rolhouder + rol | Zelf | Cilinders; nu zweeft hij 30 cm van de wand, dat herstel ik |
| Plank, kastje, lijst/schilderij, spiegel, poster | Zelf | Dozen en vlakken; precies wat procedureel goed kan |
| Plant | Zelf (pot) + eenvoudige bladeren, óf later een CC0-model | Bladeren zijn het twijfelgeval; als het niet goed oogt meld ik dat en zoek ik een model |
| Voorwerpen uit de verstopping (eendje, sok, autootje …) | Voorlopig icoon-plaatjes, wel ín de emmer | Tien losse modellen is een eigen klus; hoort bij punt 44 |

---

## 5. Layout op alle formaten

| Formaat | Oordeel | Bevinding |
|---------|---------|-----------|
| Telefoon staand (360–430 breed) | ⚠️ | Bruikbaar. Lege streak-pilletjes; mandzoom rommelig (§3-38) |
| Telefoon liggend | ❌ | Halve gereedschapsbalk buiten beeld; toilet piepklein in een enorme tegelgang |
| Tablet staand / liggend | ⚠️ | Knoppen passen; ruimte oogt als zaal, zijwandtegels uitgerekt |
| Notch | ⚠️ | Zie punt 55 |
| Desktop-preview | ⚠️ | Werkt; notch is cosmetisch en misleidend |
| Beeldkwaliteit | ⚠️ | Kartelranden: anti-aliasing staat alleen aan op "high" (Apple/Adreno 6-7); schaduwen ook. Op de meeste Android-toestellen dus geen van beide |

---

## 6. Service worker, cache en PWA

**Opnieuw bouwen.** Dit is waarschijnlijk de bron van "ik zie de nieuwe versie niet".

- Alle paden in `sw.js` beginnen met `/`. Op GitHub Pages staat het spel op `/the-flush-factor/`, dus
  `/index.html`, `/css/style.css` enz. geven **404** (gecontroleerd). `cache.addAll` faalt dan →
  de service worker installeert op de live site **nooit**. Offline spelen werkt daar dus niet, ondanks de README.
- `manifest.json` heeft `start_url: "/"`: een geïnstalleerde app opent de verkeerde pagina.
- Lokaal (waar het wél installeert): cache-first zonder versie op de bestanden → je blijft oude JS/CSS zien tot de
  SW-versie handmatig wordt opgehoogd. Textures en HDRI staan niet in de lijst.
- De automatische herlaad na `SW_UPDATED` veroorzaakt de wisselende testfouten.
- App-icoon is een emoji in een data-URL; er zijn geen echte PNG-iconen.
- README zegt "v10", code is v11; README beschrijft testen via lokaal IP terwijl jij via GitHub Pages test.

Voorstel: relatieve paden, één gegenereerde bestandslijst, netwerk-eerst voor code en cache-eerst voor assets,
geen geforceerde herlaad, echte iconen, `start_url: "./"`.

---

## 7. Tests

**Opnieuw bouwen.** De suite geeft nu vals vertrouwen.

- Bijna alles wacht met vaste `waitForTimeout` (1,5 s) i.p.v. op "spel is klaar" → traag (4,8 min) en wankel.
- De 4 formaat-screenshots draaien in alle 4 de projecten: 16 keer hetzelfde werk; twee extra screenshot-tests controleren alleen dat een bestand bestaat ("water van boven" is gewoon het startscherm).
- "Geen JS-fouten" filtert alles weg waar `fetch` of `GLTFLoader` in staat: precies de fouten die ertoe doen. 404's worden niet gecontroleerd.
- "Punten kopen" zoekt op selectors die niet bestaan (`[data-cat="buy"]`, `.buy-btn`) en slaagt daardoor altijd zonder iets te testen.
- "Notch" is altijd waar (§3-55). "Emoji" kijkt alleen naar het startscherm.
- "Mand legen" vult via localStorage en kijkt alleen naar de teller, niet naar de 3D-inhoud.
- Niet getest: alle winkelcategorieën mét inhoud, kopen/activeren, verstopping → ontstoppen → emmer, mandzoom, overlap van knoppen onderling, service worker op een submap.

Voorstel: een kleine test-haak in het spel (`window.__game`: klaar-signaal, verstopping forceren, 3D-inhoud tellen),
tests per onderwerp, notch gesimuleerd met instelbare safe-area, draaien op een submap-pad zoals GitHub Pages,
screenshots die ik zelf nakijk, en CI weer groen.

---

## 8. Wat ik wil verwijderen of verplaatsen (pas na jouw akkoord)

**Verplaatsen naar `assets/_unused/`** (niet weggooien):
- `assets/models/toilet.glb` (fallback-toilet)
- emmermodellen die uiteindelijk niet in de winkel komen
- originele, ongecomprimeerde versies van modellen/textures die ik comprimeer

**Verwijderen uit de code:**
- 2D/SVG-fallback: SVG-toilet, `#clog-prop`, `#decoration-slot`, bijbehorende CSS/keyframes en de 2D-takken in `game.js`
- procedureel reserve-toilet in `renderer3d.js`
- `DRACOLoader.js` (+ CDN-verwijzing)
- de 25 zelfgemaakte "game-icons" en de foute Lucide-namen (vervangen, zie plan)
- redundante tests (vervangen door betere)

**Functies:** er verdwijnt geen spelfunctie. Alleen de 2D-noodmodus wordt een melding.

---

## 9. Plan voor stap 2 (volgorde) — uitgevoerd, zie Deel 2

1. **Fundament**: data naar `js/data/`, `game.js` en `renderer3d.js` opsplitsen, 2D-resten eruit, test-haak erin.
2. **Service worker/manifest** opnieuw (relatieve paden, echte iconen) + tests op submap.
3. **Iconen**: één set, lokaal als losse SVG-bestanden. Voorstel **Lucide (ISC/MIT)** voor de interface en **echte
   game-icons.net (CC BY 3.0)** voor spelvoorwerpen, allemaal in dezelfde gevulde/lijn-behandeling; nieuw spoelicoon
   (hendel/waterkolk, geen cirkelpijl). Lukt downloaden niet → ik stop en geef je de links.
4. **3D-scène**: echte hokjesmaat, toilet met eigen textures en openklappend deksel, emmers als modellen met
   capaciteit in liters, inhoud zichtbaar ín de emmer en hersteld na herladen, decoratie op ankerpunten,
   anti-aliasing/schaduw op meer toestellen, assets gecomprimeerd.
5. **Winkel en HUD** repareren (bewaren open-stand, meldingen, tellingen, mandzoom, liggend, notch).
6. **ROADMAP 50–57** uitvoeren, zodra ik de tekst heb.
7. **Tests** opnieuw, screenshots nakijken, docs bijwerken, commit + push `rebuild`.

## 10. Open vragen — beantwoord, zie Deel 2

1. Wat is de tekst van ROADMAP-punten **50, 51, 53, 54, 56, 57** (en de precieze van 52 en 55)?
2. Punt 55: op welk toestel/browser breekt het beeld, en geïnstalleerd als app of in de browser? Een screenshot helpt het meest.
3. Akkoord met het weghalen van de 2D-noodmodus?
4. Iconen: akkoord met Lucide + echte game-icons.net (vraagt naamsvermelding), of liever één set zonder naamsvermelding?
5. Wat is `3TrL3C98ts7rgspUppBufk.jpg` in de projectroot?

---
---

# Deel 2 — Wat er in stap 2 is gedaan

Uitgevoerd op branch `rebuild` na akkoord. De bevindingen hierboven zijn de stand vóór de rebuild en blijven
staan als naslag; dit deel beschrijft het resultaat.

## Antwoorden en beslissingen

| Onderwerp | Besluit |
|---|---|
| ROADMAP 50–63 | Toegevoegd aan `ROADMAP.md`; 50–57 uitgevoerd, 58–63 alleen vastgelegd |
| 2D-noodmodus | Verwijderd; vervangen door de melding "WebGL niet beschikbaar" |
| Iconen | Lucide (interface) + echte game-icons.net (spelvoorwerpen), lokaal in `assets/icons/` |
| Referentiefoto | Verplaatst naar `assets/reference/toilet-referentie.jpg`; staat in `.gitignore`, dus niet in de repo, niet op de site en niet in de service-worker-cache |
| `kfc_bucket`, Quaternius wc-papier | Uit `credits.txt` gehaald; wc-rol is zelf gemaakt |
| Old Rusted Bucket | Maker volgens het bestand: **GameDev Nick**. **Te bevestigen** (in de eerste notitie stond Coozy) |

## Per 3D-object: gedownload of zelf gemaakt

| Object | Keuze | Bron / bestand | Waarom |
|---|---|---|---|
| Toilet | **Gedownload** | HippoStance, `assets/models/toilet.glb` | Organische vorm; gebruikt nu de eigen textures van het model, met alleen glanslaag en omgevingsreflectie erbij. Het deksel staat in het model al open (de oude code verborg het) |
| Houten emmer (level 1, 20 L) | **Gedownload** | romullus, `wooden_bucket.glb` | Duigen, touw en knopen zijn als model veel geloofwaardiger dan een cilinder |
| Roestige emmer (30 L) | **Gedownload** | GameDev Nick, `rusted_bucket.glb` | Roest en deuken |
| Plastic emmer (50 L) | **Gedownload** | MaX3Dd, `plastic_bucket.glb` | Beugel en vervorming |
| Zinken emmer (75 L) | **Gedownload** | Kozlov Maksim, `metal_bucket.glb` | Ribbels en houten greep |
| Dweilemmer XL (100 L) | **Gedownload** | Sousinho, `mop_bucket.glb` | Alleen de grote (gele) emmer uit "Pair of buckets" wordt getoond |
| Wanden, vloer, plinten | Zelf | `js/three/room.js` | Vlakken met CC0-textures |
| Wc-rolhouder + rol | Zelf | `js/three/room.js` | Cilinders en een plaatje; hangt nu echt aan de wand |
| Spiegel, schilderij, poster | Zelf | `js/three/decor.js` | Lijst van balkjes + vlak; afbeelding getekend op canvas |
| Plank met rollen, wandkastje | Zelf | `js/three/decor.js` | Dozen en cilinders |
| Plant | Zelf | `js/three/decor.js` | Pot + platte bladeren; oogt goed genoeg, dus geen model nodig |
| Tegel- en vloerpatronen (schaakbord, sterren, zigzag, marmer, regenboog, lava) | Zelf | `js/three/patterns.js` | Getekend op canvas; waren eerst alleen een kleurtint |
| Voorwerpen in de verstopping (10 stuks) | Zelf | `js/three/props.js` | Kleine objecten uit bollen, dozen en cilinders; goedkoop en herkenbaar |
| Water, belletjes, spetters, plas | Zelf | `js/three/water.js`, `effects.js` | Shader en eenvoudige deeltjes |

Geen van de gebruikte modellen heeft een merklogo (nagekeken op renders van elk model; op de dweilemmer staat
alleen een algemeen "natte vloer"-pictogram).

## Verplaatst naar `assets/_unused/` (niets verwijderd)

| Bestand | Reden |
|---|---|
| `_unused/models/toilet.glb` (loafbrr_1, CC0) | Reserve-toilet dat nooit geladen werd |
| `_unused/originals/models/toilet-2k.glb` | Origineel van het toilet (6,4 MB); het spel laadt de verkleinde versie |
| `_unused/originals/models/buckets/*.glb` (5 bestanden) | Originelen van de emmers |
| `_unused/originals/textures/*.jpg` (6 bestanden) | Originele JPG-textures |
| `_unused/originals/hdri/bathroom.hdr` | Origineel omgevingslicht |

Met `npm run assets` worden de spelversies opnieuw uit deze originelen gemaakt.

## Uit de code verwijderd

- 2D/SVG-noodmodus (SVG-toilet, `#clog-prop`, `#decoration-slot`, bijbehorende CSS en code).
- Procedureel reserve-toilet, `DRACOLoader.js` (met verwijzing naar een extern CDN) en `OrbitControls.js`.
- `js/items.js` en `js/icons.js` (inhoud verhuisd naar `js/data/` en de iconen-sprite).
- De 25 zelfgemaakte "game-icons" met onjuiste naamsvermelding.
- `unclogChance` bij gereedschap (stond in de data maar werd nergens gebruikt).

## Bewuste afwijkingen (graag even naar kijken)

1. **Vrij draaien is vervangen door camerastanden.** De oude OrbitControls botsten met "swipen tussen de muren".
   Nu: zes standen, vegen wisselt van muur, rustig slepen is rondkijken (beperkt), knijpen/scrollen is zoomen.
2. **Categorie "Manden" heet nu "Emmers"**, omdat er alleen nog emmers in staan. Eén woord in `js/data/shop.js`.
3. **Decoratie is aan/uit per plek** in plaats van "één decoratie tegelijk"; het item "Geen decoratie" is daardoor
   vervallen (weghalen = nog eens tikken). Er zijn twee items bijgekomen: Plank en Wandkastje.
4. **Het hokje is 1,3 × 2,2 × 2,5 m** (ROADMAP 27 noemde 0,9–1,0 m breed; punt 35 stond iets breder toe voor decoratie).
   De voorkant is open; van buiten kijk je door de wanden heen.
5. **`orientation: portrait` is uit het manifest gehaald**, omdat liggend nu goed werkt.
6. **Namen van voorwerpen**: "legoblokje" heet "bouwblokje" (geen merknaam).
7. **Iconen die game-icons.net niet heeft** (toilet, discobal): toilet komt uit Lucide; voor de discobal is het
   bestaande icoon "mesh-ball" van Lorc gebruikt. De voorwerpen uit de verstopping hebben geen icoon meer nodig,
   want het zijn nu 3D-objecten.

## Resultaat in cijfers

| | Voor | Na |
|---|---|---|
| Eerste laadbeurt | ± 14,6 MB | ± 2,5 MB (test bewaakt < 4 MB); extra emmers laden pas bij gebruik |
| `assets/` dat het spel kan laden | 34 MB | ± 4,5 MB |
| Grootste bronbestand | `renderer3d.js`, 1.278 regels | onder de 300 regels per module |
| Service worker op GitHub Pages | installeerde nooit (404's) | relatieve paden; getest onder een submap, inclusief offline |
| Tests | 19 tests, wankel, CI rood | zie README; draaien onder een submap, zonder vaste wachttijden |

## Nog open / eerlijk gezegd

- **Echte telefoon**: alles is getest in een headless browser (zonder GPU) met gesimuleerde safe-area.
  De framesnelheid op een echt toestel en het gedrag bij een echte notch zijn daarmee niet gemeten.
- **Live-controle van punt 51**: `tests/live.spec.js` controleert de live site in een schoon profiel, maar de live
  site toont `main`. De rebuild staat pas live na het mergen.
- **Maker van Old Rusted Bucket**: te bevestigen (zie boven).
- **Level hangt nog aan het uitgeefbare saldo** en de straffen zijn niet herzien: dat is punt 61.
