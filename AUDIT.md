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
| Tests | 19 tests, wankel (elke run andere fouten), CI rood | 41 tests op 4 formaten = 139 uitgevoerd; drie volledige runs achter elkaar zonder fout (± 9 min per run); draaien onder een submap, zonder vaste wachttijden |

## Zelf nagekeken op screenshots

Telefoon staand en liggend, tablet staand en liggend (`tests/screenshots/`), plus de desktop-preview "Groot 430×932"
met notch en met punch-hole: start, verstopping, plas na overlopen, winkel dicht en open, alle zes camerastanden in
een aangeklede ruimte, emmerweergave. De live site (`main`) is in een schoon profiel gecontroleerd: daar staan alle
zeven winkelcategorieën en ze klappen uit. Dat je er maar één zag, komt dus vrijwel zeker door een oude versie in de
cache van je browser, niet door de code op de site.

## Nog open / eerlijk gezegd

- **Echte telefoon**: alles is getest in een headless browser (zonder GPU) met gesimuleerde safe-area.
  De framesnelheid op een echt toestel en het gedrag bij een echte notch zijn daarmee niet gemeten.
- **Live-controle van punt 51**: `tests/live.spec.js` controleert de live site in een schoon profiel, maar de live
  site toont `main`. De rebuild staat pas live na het mergen.
- **Maker van Old Rusted Bucket**: te bevestigen (zie boven).
- **Level hangt nog aan het uitgeefbare saldo** en de straffen zijn niet herzien: dat is punt 61.

---
---

# Deel 3 — Sprint 8 (punten 64–71), op `main` na `v0.2-rebuild`

## Uitgezocht: het "losse hendeltje" (punt 64)

| Vraag | Antwoord |
|---|---|
| Welk onderdeel? | Geen `ToiletFlushHandle` en geen `ToiletSeatMount`, maar een **stopkraan met toevoerslang** die deel is van de mesh `Toilet` (de romp): zes losse onderdelen (kraan, wandplaat, slang, koppelingen) |
| Waarom stond het daar? | Zo is het model gemaakt: de kraan hangt links laag tegen de achterwand. Geen fout in draaipunt of transformatie, en niets werd dubbel geladen |
| Wat is gedaan? | De zes onderdelen worden herkend aan hun aantal driehoeken en niet meer getoond (`PLUMBING_TRIS` in `js/three/toilet.js`). Het model zelf is ongewijzigd |
| Spoelhendel | Er was en is er één, op de stortbak. Hij bewoog eerst een paar millimeter omlaag; nu draait hij om zijn eigen bevestigingspunt |

## Gevonden tijdens het testen (en hersteld)

| Fout | Hoe gevonden |
|---|---|
| Knijpen met twee vingers kon als veeg tellen en van muur wisselen | nieuwe test "slepen, knijpen en lang vasthouden tellen niet als tik" |
| Een tik direct na het laden miste soms: het spel meldde zich klaar vóór het eerste getekende beeld, de camera stond dan nog niet op zijn plek | eerste van de drie stabiliteitsruns |
| Een fout in een script liet het spel eeuwig op "Laden…" staan | eigen tikfout tijdens het bouwen; nu toont `js/boot.js` een melding |
| Profielscherm opende soms halverwege gescrold | screenshot liggend formaat |

## Bewuste keuzes

1. **"In de pot" is een zevende camerastand, maar staat niet in het cameramenu.** Je komt er door op het toilet te tikken, of vanzelf bij een verstopping. Het menu houdt de zes standen van punt 53.
2. **In een close-up gaat élke tik in de scène terug**, niet alleen een tik op het voorwerp zelf (punt 66 noemt beide).
3. **Na een verstopping zoomt de camera alleen vanzelf uit als hij ook vanzelf inzoomde.** Tikte je zelf op het toilet, dan blijf je in de pot kijken.
4. **Het rustpeil van het water staat hoger** dan vóór sprint 8 (60% in plaats van 38% van de komdiepte), zodat de kolk en het leeglopen te zien zijn.
5. **Inlogknoppen zonder merklogo's.** De iconenset heeft die niet en de huisstijlregels van Google en Facebook stellen eisen aan hun logo's; dat hoort bij de echte koppeling.
6. **Bestaande spelers zien het welkomstscherm ook één keer**, omdat zij nog geen profiel hebben. Hun voortgang blijft staan (getest met een oude opslag).

## Oude service worker (vraag bij de merge)

Alle tien oude versies van `sw.js` (v1 t/m v11) probeerden `/index.html` op de domeinroot te cachen. Op GitHub Pages
geeft dat een 404, dus de installatie mislukte elke keer: op de live site heeft nooit een oude service worker kunnen
draaien. Er is daarom niets op te ruimen. Wat wél kan blijven hangen is de gewone browsercache (GitHub Pages: 10 minuten).

## Nog open

- Echte telefoon: nog niet getest (alles in een headless browser met gesimuleerde notch).
- De testsuite is traag op de CI-runner (twee kernen, geen GPU): ruim een half uur. Lokaal ± 13 minuten.
- Maker van "Old Rusted Bucket": nog te bevestigen.

---
---

# Deel 4 — Sprint 9 (punten 78–88), branch `sprint-9`

## Stijl (punt 78)

Gekozen: **A · Sticker**. Het designbestand is `css/tokens.css`: kleuren, lettertypen, omlijning, hoekradius,
harde schaduw en de scheve hoekjes staan daar en nergens anders. `css/style.css` gebruikt alleen die variabelen
(een test bewaakt dat er geen losse lettertypen of kleuren insluipen en dat de oude "glazen" stijl weg is).
`style-preview.html` met de drie richtingen blijft staan als naslag; het spel laadt hem niet.

Afwijking van het voorbeeld: op de voorbeeldpagina was de spoelknop rood. In het spel is hij **blauw en wordt
hij rood bij een verstopping**, omdat rood anders niets meer betekent.

## Gedownload of zelf gemaakt (nieuw in deze sprint)

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Lettertypen Lilita One en Nunito | **Gedownload** (SIL OFL), lokaal in `assets/fonts/` | Een eigen letter maak je niet zelf; OFL mag mee in de app |
| Vuillaag op het toilet, kalkrand in de pot | Zelf (shader bovenop het model) | Het model en zijn textures blijven ongewijzigd, zoals gevraagd |
| Barst in het deksel, ontbrekend stukje uit de bril | Zelf (getekend, als sticker op het onderdeel) | Cartoonesk; de geometrie van het model hoeft niet kapot |
| Scheve bril en scheef deksel | Zelf (de bestaande onderdelen een paar graden gedraaid om hun scharnier) | Het model heeft losse onderdelen met een scharnierpunt |
| Kale stucmuur, bruine vieze vloer | Zelf (getekend patroon) | Vlakken |
| Spetters en plassen op muur en vloer | Zelf (getekende klodders op een vlak) | Cartoonesk, licht, overal te plaatsen |
| Start-emmer | **Gedownload** (`old_rusted_bucket`, stond er al) | Past precies bij "vieze emmer" |

## Beslissingen in de opbouw (punt 79)

| Wat | Nieuwe speler | Bestaande speler (opslag van vóór Sprint 9) |
|---|---|---|
| Toilet | kapot (bril, deksel, stukje) en vies | heel en schoon |
| Emmer | roestig, 12 L, gratis | houdt zijn emmer; de houten emmer blijft van hem |
| Muur / vloer | kale muur / vieze vloer | houdt Delfts blauw en de houten vloer |
| Gereedschap | 4 (ontstopper, heet water, eendje, confetti) | houdt alle 8 van toen, plus wat hij kocht |
| Level-slot | geldt | geldt alleen voor wat hij nog niet heeft |

De roestige emmer was eerst een upgrade van 30 liter; als start-emmer is hij nu **12 liter** en het model staat
een beetje scheef, waardoor er onderin weinig ruimte is. De overige emmers zijn iets kleiner in beeld gemaakt
(de dweilemmer was ruim een halve meter breed).

## Regels die ik zelf heb gekozen (stel gerust bij in `js/data/care.js`)

- Vies kost **10% per vieze plek** (een vies toilet telt als één), tot maximaal **50%** minder punten per spoelbeurt.
- Een **kapot toilet raakt 1,5× zo snel verstopt**. Dat stond niet in de opdracht; het geeft repareren een reden.
- Troep tegen de muren komt bij de **derde verstopping op rij die overloopt**: 4 vlekken op de muren, 2 op de vloer.
  Een verstopping die je zonder overlopen oplost zet de teller terug.
- Loopt **dezelfde** verstopping twee keer over, dan blijft er een plas op de vloer staan.
- Schoonmaakspullen koop je één keer. Eenvoudige middelen hebben drie vegen nodig, de dure één.
- Reparaties zijn per gebrek: lijm voor het stukje, een nieuwe bril, een nieuw deksel.
- Andere toiletmodellen kun je pas kopen als het toilet heel en schoon is.

## Gevonden tijdens het bouwen (en hersteld)

| Fout | Hoe gevonden |
|---|---|
| Halverwege een veeg ging de schoonmaakstand uit (vlek was al weg) en werd de rest van het gebaar een wissel van muur | test "vegen over een vlek poetst ook" |
| De vuillaag werd ook getekend bij een schoon toilet (dubbel tekenwerk, tests drie keer zo traag) | de volledige testrun |
| Winkel crashte op de categorie "Punten kopen" (geen collectie) | eerste screenshot van de winkel |
| Binnenmaten van de emmers klopten niet met de modellen (geschat) | gemeten met stralen; een test vergelijkt de data nu met het model |
| De schoonmaakla lag op een smal staand scherm over de spoelknop | screenshot `s9-08`; hij staat er nu boven, met een test |
| Eigen server en tests deelden poort 5000 | de tests hebben nu een eigen poort (5599, `tests/server.js`); `npm run serve` kiest zelf een vrije poort |

## Nog open

- **Punt 88**: de puntenbalans (punt 61) moet opnieuw bekeken worden; er is veel bijgekomen en de prijzen zijn een eerste schatting.
- "20+ gereedschappen": er bestaan er nu 16. Het menu is daarmee getest (scrollen, vervaging); meer is alleen data.
- Echte telefoon: nog steeds niet getest.
- De ontwikkel-preview (`phone-preview.js`) heeft de nieuwe stijl niet gekregen; die hoort niet bij het spel.

---
---

# Deel 5 — Sprint 10 (punten 89–95), branch `sprint-9`

## Controle tegen `Apps/CLAUDE.md` (punt 89)

Nagelopen op 11 oktober 2026 en **opnieuw op 12 oktober 2026 (punt 98)**, nadat het bestand weer was gewijzigd.
**V** = voldaan, **N** = niet voldaan, **–** = niet van toepassing. De tabellen hieronder zijn bijgewerkt naar de
stand van 12 oktober; wat er die dag veranderd is staat in "Controle van 12 oktober 2026 (punt 98)" verderop.

**Het bestand is tijdens de sprint drie keer aangevuld.** De laatste aanvulling, sectie 11
("App-structuur Studio Sedillo"), draait een deel van de eerdere afspraken om: geen app-website op een
subdomein en geen DNS-records tot "lanceren web", de testversie op github.io (noindex), de Android-app
met Capacitor in plaats van een TWA, en de privacy-URL's voor de Play Store op de hoofdsite. De tabellen
hieronder volgen die laatste versie. Wat ik eerder in de sprint voor het oude plan had klaargezet
(`docs/domein.md` met DNS-records, `docs/twa.md`, `assetlinks.json`, een eigen domein voor de test-repo)
heb ik weer weggehaald voordat er iets gepusht was; er zijn geen DNS-records aangemaakt of gevraagd.

### §1 Vaste gegevens

| Afspraak | | Toelichting |
|---|---|---|
| Merknaam Studio Sedillo | V | In de credits, de privacypagina's, `store/` en de docs. |
| Contact studio.sedillo@gmail.com | V | Nieuw in het credits-scherm en op de privacypagina's; er staat nergens een ander adres. |
| Hoofddomein, eigen subdomein | – | Sectie 11: geen subdomein tot "lanceren web". Live blijft op `jmldewaal-sedillo.github.io/the-flush-factor/`. |
| GitHub-account jmldewaal-sedillo | V | |
| GitHub Pages met eigen domein en HTTPS | – | Geen eigen domein (sectie 11). Live en test staan op github.io, met HTTPS. |
| Play Console, AdMob | – | Nog niet gepubliceerd; AdMob wordt niet gebruikt. |
| "Gemaakt door Studio Sedillo · KvK 42122276" in de app | V | Bovenaan het credits-scherm, in elke taal (dezelfde woorden als Sudoku Kids). Het KvK-nummer is op 12 oktober toegevoegd. |
| Rechtsvorm en KvK (eenmanszaak, KvK 42122276, Nederland) | V | Sinds 12 oktober in de privacyverklaring, de voettekst en de credits. |
| Vermelding verantwoordelijke (AVG) | V | "Studio Sedillo (eenmanszaak), KvK 42122276, Nederland · studio.sedillo@gmail.com", in tien talen; de vijf talen die Sudoku Kids ook op de hoofdsite heeft zijn woordelijk overgenomen. |
| Voettekst op webpagina's | V | "© 2026 Studio Sedillo · KvK 42122276 · Nederland · studio.sedillo@gmail.com" op `privacy.html` en `delete.html` (het land in de gekozen taal). Het spelscherm zelf is geen leespagina en heeft geen voettekst; daar staat het in de credits. |
| Btw-id | – | Nog niet bekend; nergens vermeld. |
| Adres nooit vermelden | V | Staat nergens. Bewaakt door de pre-commit hook, de CI en `tests/ci.spec.js`; lokaal ook de hele geschiedenis nagelopen (geen treffers). De lijst zelf is niet geopend. |
| Apps met advertenties of aankopen pas na het postadres | V | Beide staan uit; vastgelegd in ROADMAP en `docs/publiceren.md`. |

### §2 Naamgeving (slug `flushfactor`)

| Afspraak | | Toelichting |
|---|---|---|
| Projectmap, live-repo | V | `Apps/the-flush-factor/`, `the-flush-factor`. |
| Test-repo `the-flush-factor-test` | V | Nieuw aangemaakt (na akkoord), remote `test`. |
| Live-adres op een subdomein | – | Vervallen tot "lanceren web" (sectie 11). |
| Testadres | V | `jmldewaal-sedillo.github.io/the-flush-factor-test/`, noindex (sectie 11, punt 4). Zie `docs/testversie.md`. |
| Package-naam `com.studiosedillo.flushfactor` | V | Vastgelegd in de docs; de Android-app zelf is er nog niet. |
| Prefix `flushfactor.` voor de opslag | V | Was `flushfactor_v1`, `flushfactor_shop_open`, `flushfactor_tools_open`. Omgezet met een migratie en een test (na akkoord). |
| Vanaf dag één een eigen subdomein | – | Vervallen (sectie 11). De overzet-functie is er voor een nieuwe telefoon. |

### §3 Checklist nieuwe app

Het script `nieuwe-app.sh` is voor nieuwe apps; deze app bestond al. Per onderdeel wat er nu staat:

| Onderdeel | | Toelichting |
|---|---|---|
| `.gitignore`, repo's, remotes `origin` en `test` | V | |
| `ROADMAP.md` volgens §6 | V | Status, Nu bezig, Volgende, Later, Voor publicatie, Logboek bovenaan; de sprintgeschiedenis eronder. |
| `README.md` met live- en testadres | V | Bijgewerkt. |
| `CLAUDE.md` in de app-map | V | Nieuw: doel, doelgroep, toon, techniek, app-specifieke regels. |
| `KINDER_APP` kiezen | deels | Aanname: geen kinder-app. Jenn beslist (staat onder "Voor publicatie"). |
| `CNAME` met het live-subdomein | – | Geen `CNAME` (sectie 11); `tools/bouw-site.mjs` weigert er een in de testversie. |
| `.nojekyll` | V | Nieuw. |
| GitHub Pages via de workflow | deels | Test-repo ja (na groene tests); live-repo nog "vanaf branch main". |
| DNS-records | – | Geen (sectie 11, punt 6). |
| `manifest.webmanifest` met iconen 192/512/maskable, relatieve `start_url` en `scope`, `theme_color` | V | Hernoemd van `manifest.json`. |
| Service worker met `CACHE_VERSION` | V, anders | De versie wordt door `npm run build` berekend uit de inhoud; een test en de CI falen als hij niet actueel is. Vergeten kan dus niet. |
| Veilige zones (notch) | V | Sinds Sprint 7, met tests. |
| Taalkeuze, teksten in taalbestanden | V | Tien talen in `js/i18n/` (punt 94). |
| Echt icoon in plaats van tijdelijk | V | |
| `privacy.html`, `delete.html`, `verwijderen.html`, `docs/privacy-audit.md` | V | Nieuw, in tien talen (na akkoord). |
| "Profiel verwijderen", "Alle gegevens verwijderen", "Voortgang overzetten", credits | V | Nieuw, via de scorebubbel. Getest: daarna geen `flushfactor.`-sleutel en geen cache meer over. |
| Playwright-tests en screenshots op meerdere formaten | V | Vier formaten. |
| Tests bij elke push; deploy alleen als ze groen zijn | deels | Tests: nu bij elke push (was alleen `main`). Deploy na groene tests: op de test-repo. De live-repo publiceert nog rechtstreeks vanaf `main`, zonder die voorwaarde. |
| `store/` met teksten | deels | Begin: titel en beschrijvingen in het Nederlands en Engels (concept). |
| `/.well-known/assetlinks.json`, `docs/twa.md` | – | Hoorden bij de TWA; vervallen (Capacitor). |
| `docs/publiceren.md` | V | Kort, bijgewerkt naar sectie 11. |
| Upload key | – | Maakt Jenn zelf. |
| App op studiosedillo.com | – | Pas na de lancering (sectie 11, punt 3). |
| **Sectie 11: één codebase met drie bouwdoelen** (`platform/`, Capacitor, webportals, `tools/bouw.mjs`, `capacitor.config.json`, `bouw.config.json`) | N | Nog niet omgezet; staat onder "Volgende" in de roadmap. Dit is een eigen sprint. Daar horen ook bij: de vindbaar-schakelaar (`VINDBAAR` in `config.js`), `docs/lanceren.md`, `docs/android.md`, `docs/webportals.md` en de privacypagina's bouwen voor de hoofdsite (`bouw.mjs hoofdsite`). |
| Sectie 11: vindbaar-schakelaar op "nee" | deels | De testversie is altijd noindex (meta-tag en `robots.txt`). Het live adres op github.io (versie 0.2, van vóór deze afspraken) heeft **geen** noindex; dat verandert pas bij een merge naar `main`, na akkoord. |
| Sectie 11: geen externe verzoeken | V | Een test faalt bij elk verzoek buiten het eigen adres. De geluiden (punt 96) komen uit `assets/sounds/`. |
| Sectie 11: testversie op github.io, noindex | V | Meta-tag in elke pagina en een `robots.txt` die alles weigert. |
| Sectie 11: advertenties en aankopen standaard uit | V | De knoppen voor punten kopen doen niets; er is geen advertentiecode. |
| Sectie 11: blocklist met pre-commit hook en CI-controle | V | Hook: `tools/install-hooks.sh` (staat aan in deze kopie). CI, sinds 12 oktober: vóór de rooktest in `ci.yml`, nog een keer op de gebouwde testversie vóór het publiceren, en `privacy.yml` bij elke push (ook alleen documentatie) inclusief de geschiedenis. Zonder het geheim faalt de run. Het geheim `PRIVATE_BLOCKLIST` stond wel in `the-flush-factor` maar niet in `the-flush-factor-test`; daar is het op 12 oktober gezet (rechtstreeks van schijf naar `gh`, zonder de inhoud te tonen). |

### §4 DNS, §5 Privacy

| Afspraak | | Toelichting |
|---|---|---|
| DNS-records | – | Geen (sectie 11). Met `dig` gecontroleerd: er bestaan geen records voor deze app. |
| Geen tracking, analytics, advertenties | V | Een test bewaakt dat er geen verzoeken naar andere servers gaan. |
| Geen accounts, tenzij expliciet besloten | V | Jenn heeft om de inlogknoppen gevraagd (punt 69); ze zijn niet actief en versturen niets. Vóór ze live gaan: privacyverklaring en Data Safety bijwerken. |
| Gegevens alleen lokaal, met de prefix | V | Alleen `js/storage.js` raakt de opslag aan (test). |
| Sleutels veranderen nooit, of met migratie en test | V | `migrateLegacy` in `js/storage.js`, `tests/storage.spec.js`. |
| `docs/privacy-audit.md` | V | Een test faalt als het spel een sleutel schrijft die er niet in staat. |
| Privacyverklaring met alle verplichte onderdelen, in alle talen | V | Een test controleert per taal: verantwoordelijke met KvK, contactadres, datum, GitHub Pages, Gmail, het Data Privacy Framework, artikel 6, de Autoriteit Persoonsgegevens, en de voettekst. |
| Privacyverklaring per bouwdoel kloppend | V | Sinds 12 oktober: alleen de webversie haalt bestanden op bij GitHub Pages; de Android-app bevat alles zelf. Een aparte tekst voor een portal komt bij het omzetten. |
| Controleren of het Data Privacy Framework nog geldt | V, tijdelijk | Nagezocht op 12 oktober 2026: van kracht. Het Gerecht van de EU liet het op 3 september 2025 in stand; het hoger beroep (C-703/25 P) loopt nog. Vlak voor publicatie opnieuw nakijken (staat onder "Voor publicatie"). |
| Privacyverklaring op `studiosedillo.com/the-flush-factor/privacy` en `/delete` | N | De pagina's bestaan in de app; op de hoofdsite staan ze nog niet. Dat pusht naar de live site en gebeurt pas bij de lancering, na akkoord (`Apps/tools/hoofdsite-toevoegen.sh`). |
| Kinderparagraaf, ouderslot | – | Geen kinder-app (aanname). |
| Verwijderpagina `/delete` met `/verwijderen` | V | |
| Wissen getest: geen sleutel en geen cache over | V | |

### §6 Roadmap, §7 GitHub, §8 Inhoud, §9 Werkwijze

| Afspraak | | Toelichting |
|---|---|---|
| Roadmap in de vaste opbouw, logboek bijwerken | V | |
| Begin van de sessie: `git status`, `git pull`, roadmap lezen | V | Sprint 11: alle drie gedaan (werkmap schoon, branch actueel). |
| Kleine commits | V | Sprint 11: één commit per onderdeel. De commits van Sprint 9 en 10 waren groot. |
| `main` alleen na akkoord | V | Alles staat op de branch `sprint-9`. |
| Alle tests groen; sw-versie omhoog | V | |
| Pushen naar de test-repo | V | Nieuw: `git push test sprint-9:main`. |
| Nooit force-pushen naar `main`, geen secrets | V | `.gitignore` sluit nu ook `*.keystore` en `*.jks` uit. |
| Scripts die naar live pushen alleen met `--dry-run` | – | Geen van die scripts gedraaid (ook `sync-blocklist.sh` niet: dat zet het geheim in álle repo's; hier was alleen de test-repo nodig). |
| Eigen werk of CC0 heeft de voorkeur; CC-BY met naamsvermelding | V | |
| Niets zonder duidelijke licentie | V | **Let op:** de houten emmer is CC BY-**SA** 4.0 (gelijk delen). Het bewerkte model blijft daarom onder dezelfde licentie beschikbaar; dat staat in de credits. Wil je dat niet, dan moet er een ander model komen. |
| Bronnen in `docs/credits.md`, gegevens gecontroleerd | deels | De geluiden (punt 96) zijn op 12 oktober per stuk op de pagina van de bron nagekeken (alle CC0). De modellen zijn in Sprint 7 nagelopen en daarna niet opnieuw; de maker van "Old Rusted Bucket" is nog niet bevestigd (punt 73). |
| Geen emoji als iconen | V | Test op broncode en op het scherm, nu ook op alle taalbestanden. |
| Store-geschikt | V | Cartoonesk vies, niet realistisch. |
| Nederlands, structureel oplossen, stappen opschrijven, afwijkingen melden | V | Zie hieronder en `docs/testversie.md`. |

### Niet gedaan, en waarom

- **Omzetten naar de drie bouwdoelen van sectie 11** (dunne laag in `platform/`, Capacitor, webportals,
  privacypagina's bouwen voor de hoofdsite). Die sectie kwam aan het eind van de sprint; het is een
  eigen stuk werk met eigen tests en staat bovenaan onder "Volgende".
- **De live-repo via de workflow laten publiceren.** `main` verandert alleen na akkoord.

### Let op bij de test-repo

De test-repo `the-flush-factor-test` is aangemaakt na akkoord van Jenn in deze sessie, toen het plan nog
een eigen testdomein was. De `CLAUDE.md` van de app zei daarna dat aanmaken "bij het omzetten hoort".
De repo bestaat nu dus eerder dan daar bedoeld; hij publiceert naar github.io, zonder eigen domein en
met noindex, zoals sectie 11 voorschrijft.

## Controle van 12 oktober 2026 (punt 98)

`Apps/CLAUDE.md` opnieuw volledig gelezen. Nieuw of anders ten opzichte van de controle van 11 oktober:
het KvK-nummer met de vaste formuleringen (verantwoordelijke, voettekst, credits), de regel dat het adres
nergens mag staan, de URL's van de privacypagina's op de hoofdsite, `sync-blocklist.sh`, en in §5 dat de
privacyverklaring per bouwdoel moet kloppen. De tabellen hierboven zijn daarop bijgewerkt.

**Niet voldaan, en opgelost**

| Wat | Wat er mis was | Wat er nu staat |
|---|---|---|
| Blocklist-controle in de CI | De stap stond niet (meer) in `ci.yml`, en de test-repo, de enige die publiceert, had het geheim niet. Er werd dus niets gecontroleerd voordat iets online kwam. | `ci.yml`: controle vóór de rooktest en op de gebouwde testversie vóór het publiceren. `privacy.yml`: bij elke push, ook met alleen documentatie, met de hele geschiedenis. Zonder geheim faalt de run in plaats van te waarschuwen. Geheim gezet in de test-repo. Test: `tests/ci.spec.js`. |
| KvK-nummer | Stond nergens in de app. | Credits (tien talen), verantwoordelijke in de privacyverklaring (tien talen), voettekst op de privacy- en verwijderpagina. |
| Privacyverklaring per bouwdoel | De tekst deed alsof het spel altijd van een website komt. | Onderscheid tussen de webversie (GitHub Pages) en de Android-app (alles in de app). |
| Wat het spel bewaart | Nieuw: geluid aan/uit en volume. | In de privacyverklaring (tien talen) en `docs/privacy-audit.md`. Geen nieuwe sleutel: het zit in de spelstand van het profiel. |
| `style-preview.html` op het testadres | Werd niet meegenomen in de testversie. | Gaat mee (noindex), zit niet in de service worker. |

**Niet voldaan, en niet door mij op te lossen**

| Wat | Waarom niet | Wat Jenn moet doen |
|---|---|---|
| Eén codebase met drie bouwdoelen (sectie 11, punt 2), met alles wat eraan hangt | Een eigen sprint; staat onder "Volgende". | Zeggen wanneer die sprint mag beginnen. Eén keer `npm run android:init` en de upload key volgen daarna (`docs/android.md` komt dan). |
| Privacy- en verwijderpagina op studiosedillo.com | Pusht naar de live hoofdsite; alleen na akkoord en pas bij de lancering. | Bij de lancering akkoord geven voor `Apps/tools/hoofdsite-toevoegen.sh`. |
| Het live adres (github.io, versie 0.2) heeft geen noindex, geen KvK en nog de oude opslag | `main` verandert alleen na "zet live". | Na het testen van deze branch "zet live" zeggen, of besluiten dat het live adres tot de lancering weg mag. |
| Doelgroep (`KINDER_APP`) | Besluit van Jenn. | Kiezen: algemeen publiek (aanname) of ook kinderen onder 13. |
| Postadres bij de KvK | Voorwaarde voor advertenties en aankopen. | Regelen vóórdat aankopen of AdMob aan gaan. |
| Privacytekst en vertalingen | Door Claude geschreven, door niemand nagekeken. | Laten nakijken (staat onder "Voor publicatie"). |

**Zelf gedaan aan instellingen bij GitHub** (hoort bij "los de blocklist-controle in de CI op"): het geheim
`PRIVATE_BLOCKLIST` gezet in `the-flush-factor-test`. Verder niets aan Pages, domeinen of DNS.

**Geluiden: eerlijk gezegd.** Claude kan niet luisteren. De geluiden zijn gekozen op titel, omschrijving,
duur en gemeten volume; ze laden en spelen aantoonbaar af, maar of ze góéd klinken moet Jenn horen. De
bestanden van Freesound zijn de voorbeeldversies die Freesound zelf aanbiedt (mp3), omdat de originelen
alleen na inloggen te downloaden zijn; zie `docs/credits.md`.

## Water buiten de kom (punt 90)

| Wat je zag | Wat het was | Opgelost met |
|---|---|---|
| Blauw onder aan de voet tijdens het spoelen | De trechter van de draaikolk: de diepte was een getal zonder maat en kwam uit op ruim 0,5 m | Diepte in meters, hooguit 6 cm en nooit door de bodem van de kom |
| Blauw plekje achter de voet (gevonden door de nieuwe test) | Onder de kom is het model bij de afvoer niet dicht; het weggezakte water was door die kier te zien | Masker op de opening van de kom (stencil): water wordt alleen getekend waar je door de opening kijkt |
| Spetters naast de pot | De spetters van het spoelen vlogen vrij weg | Spetters van het spoelen verdwijnen zodra ze de kom zouden verlaten |
| Zwart streepje links bij de voet | Een van vier zwarte bouten in het model (twee in de voet, twee onder de stortbak), geen rest van de stopkraan | De vier bouten worden niet meer getoond |

De test tekent het beeld met en zonder water vanuit acht camerapunten en zes momenten van de
spoelbeurt, en telt pixels die verschillen buiten de opening van de kom: dat moet nul zijn. Een
tweede test zet de beveiligingen uit en controleert dat de test de oude fout dan wél ziet.

## Keuzes die ik zelf heb gemaakt (stel gerust bij)

- **Eén veeg = één keer gebruik** (punt 92). Alleen een veeg die vuil weghaalt telt; het verkeerde
  middel of naast de vlek kost niets. Aantallen in `js/data/care.js`: spons, wc-borstel en dweil 6×
  (goed voor twee vlekken), spray 10×, toiletreiniger 5×, schrobmachine 12×, hogedrukreiniger 20×.
- **De teller op de knop** toont het totaal aantal keer vegen dat je nog in huis hebt; tijdens het
  schoonmaken wat er over is van het gekozen middel.
- **Kiezen in de la sluit de la.** Voorheen bleef hij openstaan tijdens het poetsen; nu is de scène vrij.
- **De taalkeuze staat in het hoofdmenu** (dit spel heeft geen instellingenscherm zoals Sudoku Kids).
- **Sudoku Kids heeft één bestand met alle talen; hier is het één bestand per taal**, zoals gevraagd.
  De werking is gelijk: dezelfde lijst, `{naam}` als invulplek, `data-i18n` in de html.
- **De taal hoort bij het toestel**, niet bij het profiel: "Profiel verwijderen" laat de taal staan.
- **"Profiel verwijderen" wist ook de voortgang.** Dit spel heeft één profiel; naam, avatar, punten
  en statistieken horen daarbij.

## Nog open

- Vertalingen (spel en privacytekst) zijn door Claude geschreven en door niemand nagelezen.
- De ontwikkel-preview (`phone-preview.js`) en `style-preview.html` zijn alleen Nederlands; ze horen
  niet bij het spel.
- De naam en omschrijving in `manifest.webmanifest` zijn vast (Nederlands); een manifest kan niet per
  taal wisselen.
- Echte telefoon: nog niet getest. Daarvoor is het testadres er nu.
